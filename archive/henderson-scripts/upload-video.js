/**
 * Script to upload Henderson Store.mp4 video to Shopify
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

const VIDEO_PATH = path.join(__dirname, '..', 'Video Ads', 'Henderson Store.mp4');

async function uploadVideo() {
  try {
    console.log('Reading video file...');
    const videoBuffer = fs.readFileSync(VIDEO_PATH);
    const videoSize = fs.statSync(VIDEO_PATH).size;
    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Step 1: Create a staged upload
    console.log('\nCreating staged upload...');
    const stagedUploadMutation = `
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
    `;

    const stagedUploadResponse = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: stagedUploadMutation,
          variables: {
            input: [
              {
                filename: 'henderson-store.mp4',
                mimeType: 'video/mp4',
                resource: 'VIDEO',
                fileSize: videoSize.toString()
              }
            ]
          }
        })
      }
    );

    const stagedUploadData = await stagedUploadResponse.json();
    console.log('Staged upload response:', JSON.stringify(stagedUploadData, null, 2));

    if (stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      throw new Error(`Staged upload errors: ${JSON.stringify(stagedUploadData.data.stagedUploadsCreate.userErrors)}`);
    }

    const stagedTarget = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];
    const uploadUrl = stagedTarget.url;
    const resourceUrl = stagedTarget.resourceUrl;
    const parameters = stagedTarget.parameters;

    console.log('\nUpload URL:', uploadUrl);
    console.log('Resource URL:', resourceUrl);

    // Step 2: Upload the file to the staged upload URL
    console.log('\nUploading video file...');
    const formData = new FormData();

    // Add all parameters from staged upload
    parameters.forEach(param => {
      formData.append(param.name, param.value);
    });

    // Add the file
    formData.append('file', videoBuffer, {
      filename: 'henderson-store.mp4',
      contentType: 'video/mp4'
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
    }

    console.log('✅ Video uploaded successfully');
    console.log('Upload response status:', uploadResponse.status);

    // Step 3: Create the file in Shopify
    console.log('\nCreating file record in Shopify...');
    const fileCreateMutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on Video {
              id
              alt
              createdAt
              fileStatus
              sources {
                url
                mimeType
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

    const fileCreateResponse = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: fileCreateMutation,
          variables: {
            files: [
              {
                alt: 'Henderson Shop - Premium Motorcycle Gear Brand Story',
                contentType: 'VIDEO',
                originalSource: resourceUrl
              }
            ]
          }
        })
      }
    );

    const fileCreateData = await fileCreateResponse.json();
    console.log('File create response:', JSON.stringify(fileCreateData, null, 2));

    if (fileCreateData.data?.fileCreate?.userErrors?.length > 0) {
      throw new Error(`File create errors: ${JSON.stringify(fileCreateData.data.fileCreate.userErrors)}`);
    }

    const videoFile = fileCreateData.data.fileCreate.files[0];
    const videoUrl = videoFile.sources?.[0]?.url;

    console.log('\n✅ Video successfully uploaded to Shopify!');
    console.log('Video ID:', videoFile.id);
    console.log('Video URL:', videoUrl);
    console.log('File Status:', videoFile.fileStatus);

    // Save the URL to a file for reference
    fs.writeFileSync(
      path.join(__dirname, 'new-video-url.txt'),
      videoUrl || 'Processing...',
      'utf8'
    );

    return videoUrl;

  } catch (error) {
    console.error('❌ Error uploading video:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the script
uploadVideo()
  .then((url) => {
    console.log('\n🎉 Done!');
    if (url) {
      console.log('\nNew video URL:', url);
      console.log('\nNext step: Update the About page with this new URL');
    } else {
      console.log('\nVideo is processing. Check Shopify admin > Content > Files');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
