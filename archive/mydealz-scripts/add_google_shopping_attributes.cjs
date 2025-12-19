// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

require('dotenv').config();
const https = require('https');

const SHOPIFY_DOMAIN = '5dc028-dd.myshopify.com';
const API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-01';

// Smart categorization based on product title/handle
function determineAttributes(product) {
  const title = product.title.toLowerCase();
  const handle = product.handle.toLowerCase();
  const text = title + ' ' + handle;

  const attributes = {
    condition: 'new', // All MyDealz products are new
    age_group: 'adult', // Default
    gender: 'unisex', // Default
    material: null,
    color: null
  };

  // Determine age_group
  if (text.includes('kids') || text.includes('children') || text.includes('child')) {
    attributes.age_group = 'kids';
  } else if (text.includes('toddler')) {
    attributes.age_group = 'toddler';
  } else if (text.includes('infant') || text.includes('baby')) {
    attributes.age_group = 'infant';
  }

  // Determine gender
  if ((text.includes('men') || text.includes('male') || text.includes('mens')) &&
      !text.includes('women') && !text.includes('unisex')) {
    attributes.gender = 'male';
  } else if ((text.includes('women') || text.includes('female') || text.includes('womens') ||
             text.includes('ladies')) && !text.includes('men') && !text.includes('unisex')) {
    attributes.gender = 'female';
  }

  // Determine material (common materials)
  const materials = ['leather', 'aluminum', 'cotton', 'down', 'polyester', 'wool',
                     'nylon', 'metal', 'plastic', 'wood', 'glass', 'ceramic'];
  for (const material of materials) {
    if (text.includes(material)) {
      attributes.material = material.charAt(0).toUpperCase() + material.slice(1);
      break;
    }
  }

  // Determine color (common colors)
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange',
                  'purple', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold'];
  for (const color of colors) {
    if (text.includes(color)) {
      attributes.color = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }

  return attributes;
}

async function updateProduct(productId, metafields) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ product: { id: productId, metafields } });

    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: `/admin/api/${API_VERSION}/products/${productId}.json`,
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject({ success: false, status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchProducts(limit = 250) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: `/admin/api/${API_VERSION}/products.json?limit=${limit}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function addGoogleShoppingAttributes(dryRun = true) {
  console.log('='.repeat(70));
  console.log('ADD GOOGLE SHOPPING ATTRIBUTES TO PRODUCTS');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE UPDATE'}`);
  console.log('');

  try {
    const response = await fetchProducts();
    const products = response.products;

    console.log(`Total Products: ${products.length}`);
    console.log('');

    let processedCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (const product of products) {
      processedCount++;

      const attributes = determineAttributes(product);

      console.log(`[${processedCount}/${products.length}] ${product.title}`);
      console.log(`   Condition: ${attributes.condition}`);
      console.log(`   Age Group: ${attributes.age_group}`);
      console.log(`   Gender: ${attributes.gender}`);
      if (attributes.material) console.log(`   Material: ${attributes.material}`);
      if (attributes.color) console.log(`   Color: ${attributes.color}`);

      if (!dryRun) {
        try {
          // Prepare metafields for Google Shopping
          const metafields = [
            {
              namespace: 'google',
              key: 'condition',
              value: attributes.condition,
              type: 'single_line_text_field'
            },
            {
              namespace: 'google',
              key: 'age_group',
              value: attributes.age_group,
              type: 'single_line_text_field'
            },
            {
              namespace: 'google',
              key: 'gender',
              value: attributes.gender,
              type: 'single_line_text_field'
            }
          ];

          if (attributes.material) {
            metafields.push({
              namespace: 'google',
              key: 'material',
              value: attributes.material,
              type: 'single_line_text_field'
            });
          }

          if (attributes.color) {
            metafields.push({
              namespace: 'google',
              key: 'color',
              value: attributes.color,
              type: 'single_line_text_field'
            });
          }

          await updateProduct(product.id, metafields);
          updatedCount++;
          console.log(`   ✓ Updated successfully`);
        } catch (error) {
          errors.push({ product: product.title, error });
          console.log(`   ✗ Update failed: ${error.message || error}`);
        }
      }

      console.log('');

      // Rate limiting: wait 500ms between requests
      if (!dryRun) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Total Products Processed: ${processedCount}`);
    if (!dryRun) {
      console.log(`Successfully Updated: ${updatedCount}`);
      console.log(`Errors: ${errors.length}`);
    } else {
      console.log('');
      console.log('⚠️  DRY RUN MODE - No changes made');
      console.log('');
      console.log('To apply these changes, run:');
      console.log('  node scripts/add_google_shopping_attributes.cjs --live');
    }
    console.log('');

    if (errors.length > 0 && !dryRun) {
      console.log('ERRORS:');
      errors.forEach(e => {
        console.log(`  - ${e.product}: ${e.error.message || e.error}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Check command line arguments
const isLive = process.argv.includes('--live');
addGoogleShoppingAttributes(!isLive);
