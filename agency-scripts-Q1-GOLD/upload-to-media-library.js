#!/usr/bin/env node
/**
 * Upload images to Shopify FILES (media library) - NOT theme assets
 * This makes images accessible via cdn/shop/files/ path
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const FormData = require('form-data');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

const IMAGES = [
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-timmossholder-3076826-optimized.webp',
    filename: 'pexels-timmossholder-3076826.webp',
    slide: 6
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-bylukemiller-33141882-optimized.webp',
    filename: 'pexels-bylukemiller-33141882.webp',
    slide: 7
  }
];

async function uploadToFiles(img) {
  console.log(`\n📤 Uploading: ${img.filename} (Slide ${img.slide})`);

  const fileBuffer = fs.readFileSync(img.localPath);
  const sizeKB = (fileBuffer.length / 1024).toFixed(1);
  console.log(`   Size: ${sizeKB} KB`);

  // Step 1: Generate staged upload URL
  const stagedUploadUrl = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`;

  const stagedUploadMutation = `
    mutation generateStagedUploads {
      stagedUploadsCreate(input: [{
        resource: IMAGE,
        filename: "${img.filename}",
        mimeType: "image/webp",
        httpMethod: POST
      }]) {
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

  const stagedResponse = await fetch(stagedUploadUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: stagedUploadMutation })
  });

  const stagedData = await stagedResponse.json();

  if (stagedData.data.stagedUploadsCreate.userErrors.length > 0) {
    throw new Error(JSON.stringify(stagedData.data.stagedUploadsCreate.userErrors));
  }

  const stagedTarget = stagedData.data.stagedUploadsCreate.stagedTargets[0];
  console.log(`   ✅ Staged upload URL generated`);

  // Step 2: Upload file to staged URL
  const formData = new FormData();
  stagedTarget.parameters.forEach(param => {
    formData.append(param.name, param.value);
  });
  formData.append('file', fileBuffer, img.filename);

  await fetch(stagedTarget.url, {
    method: 'POST',
    body: formData
  });

  console.log(`   ✅ File uploaded to staging`);

  // Step 3: Create file in Shopify
  const createFileMutation = `
    mutation fileCreate {
      fileCreate(files: [{
        alt: "${img.filename.replace('.webp', '')}",
        contentType: IMAGE,
        originalSource: "${stagedTarget.resourceUrl}"
      }]) {
        files {
          ... on MediaImage {
            id
            image {
              url
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

  const createResponse = await fetch(stagedUploadUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: createFileMutation })
  });

  const createData = await createResponse.json();

  if (createData.data.fileCreate.userErrors.length > 0) {
    throw new Error(JSON.stringify(createData.data.fileCreate.userErrors));
  }

  const fileUrl = createData.data.fileCreate.files[0].image.url;
  console.log(`   ✅ File created in media library`);
  console.log(`   🌐 URL: ${fileUrl}`);

  return { ...img, url: fileUrl, sizeKB };
}

async function main() {
  console.log('🚀 Uploading images to Shopify FILES (media library)\n');
  console.log('='.repeat(70));

  const results = [];
  for (const img of IMAGES) {
    try {
      const result = await uploadToFiles(img);
      results.push(result);
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.length}/${IMAGES.length}`);

  if (results.length > 0) {
    console.log('\n📸 Images now in media library:');
    results.forEach(r => {
      console.log(`   Slide ${r.slide}: ${r.filename}`);
      console.log(`   URL: ${r.url}`);
    });
  }

  console.log('\n✅ Images accessible via cdn/shop/files/');
  console.log('='.repeat(70));
}

main();
