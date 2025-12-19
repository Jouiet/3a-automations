#!/usr/bin/env node

/**
 * Upload Collection Videos to Shopify CDN
 * Uploads:
 * 1. Henderson Store real Clients.mp4 -> for /collections/all
 * 2. generated_video.mp4 -> for /collections/gloves
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'jqp1x4-7e.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ SHOPIFY_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

const VIDEO_FILES = [
  {
    name: 'Henderson Store real Clients.mp4',
    path: './Video Ads/Henderson Store real Clients.mp4',
    purpose: '/collections/all - View Certified Helmets section'
  },
  {
    name: 'generated_video.mp4',
    path: './Video Ads/generated_video.mp4',
    purpose: '/collections/gloves - Brand story video'
  }
];

/**
 * Upload file to Shopify using GraphQL Files API
 */
async function uploadVideo(videoFile) {
  console.log(`\n📤 Uploading: ${videoFile.name}`);
  console.log(`   Purpose: ${videoFile.purpose}`);

  const videoPath = path.resolve(videoFile.path);

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    return null;
  }

  const fileStats = fs.statSync(videoPath);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   Size: ${fileSizeMB} MB`);

  // Step 1: Generate staged upload URL
  const stagedUploadMutation = `
    mutation generateStagedUploads($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedUploadVariables = {
    input: [
      {
        resource: 'VIDEO',
        filename: videoFile.name,
        mimeType: 'video/mp4',
        fileSize: fileStats.size.toString(),
        httpMethod: 'POST'
      }
    ]
  };

  try {
    const stagedResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: stagedUploadMutation,
        variables: stagedUploadVariables
      })
    });

    const stagedData = await stagedResponse.json();

    if (stagedData.errors) {
      console.error('❌ Staged upload error:', stagedData.errors);
      return null;
    }

    const stagedTarget = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!stagedTarget) {
      console.error('❌ No staged target returned');
      console.log(JSON.stringify(stagedData, null, 2));
      return null;
    }

    console.log('✅ Staged upload URL generated');

    // Step 2: Upload file to staged URL
    const fileBuffer = fs.readFileSync(videoPath);
    const formData = new FormData();

    // Add parameters from staged upload
    stagedTarget.parameters.forEach(param => {
      formData.append(param.name, param.value);
    });

    // Add file
    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    formData.append('file', blob, videoFile.name);

    console.log('📤 Uploading to CDN...');

    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      console.error('❌ Upload failed:', uploadResponse.statusText);
      return null;
    }

    console.log('✅ File uploaded to CDN');

    // Step 3: Create file record in Shopify
    const fileCreateMutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on Video {
              id
              alt
              originalSource {
                url
              }
              sources {
                url
                format
                height
                width
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileCreateVariables = {
      files: [
        {
          alt: videoFile.name.replace('.mp4', ''),
          contentType: 'VIDEO',
          originalSource: stagedTarget.resourceUrl
        }
      ]
    };

    const fileCreateResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: fileCreateMutation,
        variables: fileCreateVariables
      })
    });

    const fileCreateData = await fileCreateResponse.json();

    if (fileCreateData.errors || fileCreateData.data?.fileCreate?.userErrors?.length > 0) {
      console.error('❌ File create error:', fileCreateData.errors || fileCreateData.data.fileCreate.userErrors);
      return null;
    }

    const createdVideo = fileCreateData.data?.fileCreate?.files?.[0];

    if (!createdVideo) {
      console.error('❌ No video file returned');
      return null;
    }

    console.log('✅ Video created in Shopify');
    console.log(`   Video ID: ${createdVideo.id}`);
    console.log(`   Video URL: ${createdVideo.sources?.[0]?.url || createdVideo.originalSource?.url}`);

    return {
      id: createdVideo.id,
      url: createdVideo.sources?.[0]?.url || createdVideo.originalSource?.url,
      name: videoFile.name
    };

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎬 Henderson Collection Videos Upload\n');
  console.log(`Store: ${SHOPIFY_STORE}`);
  console.log(`Videos to upload: ${VIDEO_FILES.length}\n`);

  const results = [];

  for (const videoFile of VIDEO_FILES) {
    const result = await uploadVideo(videoFile);
    results.push({ file: videoFile.name, result });

    // Wait between uploads
    if (videoFile !== VIDEO_FILES[VIDEO_FILES.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds before next upload...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));

  results.forEach(({ file, result }) => {
    if (result) {
      console.log(`\n✅ ${file}`);
      console.log(`   URL: ${result.url}`);
    } else {
      console.log(`\n❌ ${file} - FAILED`);
    }
  });

  // Save results to file
  const resultsFile = './tmp/collection-videos-upload.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  console.log('\n✅ Upload process complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
