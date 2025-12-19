/**
 * Upload ALL videos to Shopify systematically
 */

const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'jqp1x4-7e.myshopify.com';
const SHOPIFY_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN ||
  process.env.SHOPIFY_ACCESS_TOKEN ||
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_PASSWORD;

const VIDEOS = [
  {
    name: 'generated_video.mp4',
    path: path.join(__dirname, '..', 'Video Ads', 'generated_video.mp4'),
    alt: 'Henderson Shop - About Us Story',
    purpose: 'About page'
  },
  {
    name: 'AirBag.mp4',
    path: path.join(__dirname, '..', 'Video Ads', 'AirBag.mp4'),
    alt: 'Motorcycle AirBag Protection Gear',
    purpose: 'Protection collection'
  },
  {
    name: 'Shooting Helmet.mp4',
    path: path.join(__dirname, '..', 'Video Ads', 'Shooting Helmet.mp4'),
    alt: 'Premium Motorcycle Helmets',
    purpose: 'Helmets collection'
  },
  {
    name: 'Rider Equipement.mp4',
    path: path.join(__dirname, '..', 'Video Ads', 'Rider Equipement.mp4'),
    alt: 'Motorcycle Jackets and Pants',
    purpose: 'Jackets-Pants collection'
  }
];

async function uploadVideo(video) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Uploading: ${video.name}`);
    console.log(`Purpose: ${video.purpose}`);
    console.log(`${'='.repeat(60)}`);

    const videoBuffer = fs.readFileSync(video.path);
    const videoSize = fs.statSync(video.path).size;
    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Step 1: Create staged upload
    console.log('\n[1/3] Creating staged upload...');
    const stagedUploadResponse = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
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
          `,
          variables: {
            input: [
              {
                filename: video.name.toLowerCase().replace(/\s+/g, '-'),
                mimeType: 'video/mp4',
                resource: 'VIDEO',
                fileSize: videoSize.toString()
              }
            ]
          }
        })
      }
    );

    const stagedData = await stagedUploadResponse.json();

    if (stagedData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      throw new Error(`Staged upload errors: ${JSON.stringify(stagedData.data.stagedUploadsCreate.userErrors)}`);
    }

    const stagedTarget = stagedData.data.stagedUploadsCreate.stagedTargets[0];
    const uploadUrl = stagedTarget.url;
    const resourceUrl = stagedTarget.resourceUrl;
    const parameters = stagedTarget.parameters;

    console.log('✅ Staged upload created');

    // Step 2: Upload file
    console.log('\n[2/3] Uploading video file to Google Cloud...');
    const formData = new FormData();

    parameters.forEach(param => {
      formData.append(param.name, param.value);
    });

    formData.append('file', videoBuffer, {
      filename: video.name.toLowerCase().replace(/\s+/g, '-'),
      contentType: 'video/mp4'
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('✅ Video uploaded to cloud storage');

    // Step 3: Create file in Shopify
    console.log('\n[3/3] Creating file record in Shopify...');
    const fileCreateResponse = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            mutation fileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  ... on Video {
                    id
                    alt
                    createdAt
                    fileStatus
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            files: [
              {
                alt: video.alt,
                contentType: 'VIDEO',
                originalSource: resourceUrl
              }
            ]
          }
        })
      }
    );

    const fileData = await fileCreateResponse.json();

    if (fileData.data?.fileCreate?.userErrors?.length > 0) {
      throw new Error(`File create errors: ${JSON.stringify(fileData.data.fileCreate.userErrors)}`);
    }

    const videoFile = fileData.data.fileCreate.files[0];
    console.log('✅ Video file created in Shopify');
    console.log(`   Video ID: ${videoFile.id}`);
    console.log(`   Status: ${videoFile.fileStatus}`);

    return {
      name: video.name,
      purpose: video.purpose,
      videoId: videoFile.id,
      status: 'SUCCESS'
    };

  } catch (error) {
    console.error(`❌ Failed to upload ${video.name}: ${error.message}`);
    return {
      name: video.name,
      purpose: video.purpose,
      error: error.message,
      status: 'FAILED'
    };
  }
}

async function uploadAllVideos() {
  console.log('\n🎬 STARTING SYSTEMATIC VIDEO UPLOAD');
  console.log(`Total videos to upload: ${VIDEOS.length}`);
  console.log('='.repeat(60));

  const results = [];

  for (const video of VIDEOS) {
    const result = await uploadVideo(video);
    results.push(result);

    // Wait 2 seconds between uploads
    if (VIDEOS.indexOf(video) < VIDEOS.length - 1) {
      console.log('\nWaiting 2 seconds before next upload...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save results
  const resultsFile = path.join(__dirname, 'video-upload-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`);
    console.log(`   Purpose: ${result.purpose}`);
    console.log(`   Status: ${result.status}`);
    if (result.status === 'SUCCESS') {
      console.log(`   Video ID: ${result.videoId}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n✅ Results saved to: ${resultsFile}`);

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const failCount = results.filter(r => r.status === 'FAILED').length;

  console.log(`\n📈 Success: ${successCount}/${VIDEOS.length}`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount}/${VIDEOS.length}`);
  }

  return results;
}

uploadAllVideos()
  .then(() => {
    console.log('\n🎉 Video upload process complete!');
    console.log('\n⏭️  Next step: Wait ~10 seconds for processing, then get video URLs');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Upload process failed:', error.message);
    process.exit(1);
  });
