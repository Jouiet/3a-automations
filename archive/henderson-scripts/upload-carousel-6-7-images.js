#!/usr/bin/env node
/**
 * Upload carousel images 6 & 7 to Shopify Media Library
 * - Carousel 6: pexels-bylukemiller-33141882-optimized.webp (1.6MB)
 * - Carousel 7: Motorcycle 1-optimized.webp (819KB)
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const FormData = require('form-data');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

const IMAGES = [
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-bylukemiller-33141882-optimized.webp',
    filename: 'pexels-bylukemiller-33141882-optimized.webp',
    carousel: 6,
    description: 'Sportbike red/black wheelie action'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/Motorcycle 1-optimized.webp',
    filename: 'motorcycle-1-optimized.webp',
    carousel: 7,
    description: 'Aprilia racing bike on track'
  }
];

async function uploadToMediaLibrary(img) {
  console.log(`\n📤 Carousel ${img.carousel}: ${img.description}`);
  console.log(`   File: ${img.filename}`);

  const fileBuffer = fs.readFileSync(img.localPath);
  const sizeKB = (fileBuffer.length / 1024).toFixed(1);
  console.log(`   Size: ${sizeKB} KB`);

  // Step 1: Generate staged upload URL
  const graphqlUrl = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`;

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

  const stagedResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: stagedUploadMutation })
  });

  const stagedData = await stagedResponse.json();

  if (stagedData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(stagedData.data.stagedUploadsCreate.userErrors));
  }

  if (!stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0]) {
    throw new Error('No staged target returned: ' + JSON.stringify(stagedData));
  }

  const stagedTarget = stagedData.data.stagedUploadsCreate.stagedTargets[0];
  console.log(`   ✅ Staged upload URL generated`);

  // Step 2: Upload file to staged URL
  const formData = new FormData();
  stagedTarget.parameters.forEach(param => {
    formData.append(param.name, param.value);
  });
  formData.append('file', fileBuffer, img.filename);

  const uploadResponse = await fetch(stagedTarget.url, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: HTTP ${uploadResponse.status}`);
  }

  console.log(`   ✅ File uploaded to staging`);

  // Step 3: Create file in Shopify Media Library
  const createFileMutation = `
    mutation fileCreate {
      fileCreate(files: [{
        alt: "${img.description}",
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

  // Wait 2 seconds for staging to complete
  await new Promise(r => setTimeout(r, 2000));

  const createResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: createFileMutation })
  });

  const createData = await createResponse.json();

  if (createData.data?.fileCreate?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(createData.data.fileCreate.userErrors));
  }

  if (!createData.data?.fileCreate?.files?.[0]?.image?.url) {
    console.log(`   ⚠️  File created but URL is null (CDN propagation delay)`);
    console.log(`   Full response:`, JSON.stringify(createData, null, 2));
    // Return expected CDN URL based on filename
    const expectedUrl = `https://cdn.shopify.com/s/files/1/0868/2863/1412/files/${img.filename}`;
    return { ...img, url: expectedUrl, sizeKB, status: 'pending_propagation' };
  }

  const fileUrl = createData.data.fileCreate.files[0].image.url;
  console.log(`   ✅ File created in media library`);
  console.log(`   🌐 URL: ${fileUrl}`);

  return { ...img, url: fileUrl, sizeKB, status: 'success' };
}

async function main() {
  console.log('🚀 Uploading carousel images 6 & 7 to Shopify Media Library\n');
  console.log('='.repeat(70));

  const results = [];
  for (const img of IMAGES) {
    try {
      const result = await uploadToMediaLibrary(img);
      results.push(result);
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ ...img, status: 'failed', error: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.status === 'success' || r.status === 'pending_propagation');
  console.log(`✅ Successful: ${successful.length}/${IMAGES.length}`);

  if (successful.length > 0) {
    console.log('\n📸 Images uploaded:');
    successful.forEach(r => {
      console.log(`   Carousel ${r.carousel}: ${r.filename} (${r.sizeKB} KB)`);
      if (r.url) console.log(`   URL: ${r.url}`);
    });
  }

  const failed = results.filter(r => r.status === 'failed');
  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(r => {
      console.log(`   Carousel ${r.carousel}: ${r.filename}`);
      console.log(`   Error: ${r.error}`);
    });
  }

  console.log('\n⏭️  Next: Update templates/index.json with new image references');
  console.log('='.repeat(70));

  return results;
}

main().catch(console.error);
