// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

require('dotenv').config();
const https = require('https');

const SHOPIFY_DOMAIN = '5dc028-dd.myshopify.com';
const API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-01';

// Smart categorization based on product title/handle/variant title
function determineAttributes(product, variant) {
  const productTitle = product.title.toLowerCase();
  const productHandle = product.handle.toLowerCase();
  const variantTitle = variant.title.toLowerCase();
  const text = productTitle + ' ' + productHandle + ' ' + variantTitle;

  const attributes = {
    condition: 'new', // All MyDealz products are new
    age_group: 'adult', // Default
    gender: 'unisex', // Default
  };

  // Determine age_group
  if (text.includes('kids') || text.includes('children') || text.includes('child')) {
    attributes.age_group = 'kids';
  } else if (text.includes('toddler')) {
    attributes.age_group = 'toddler';
  } else if (text.includes('infant') || text.includes('baby')) {
    attributes.age_group = 'infant';
  }

  // Determine gender - more aggressive detection
  if ((text.includes('men') || text.includes('male') || text.includes('mens') || text.includes("men's")) &&
      !text.includes('women') && !text.includes('unisex')) {
    attributes.gender = 'male';
  } else if ((text.includes('women') || text.includes('female') || text.includes('womens') || text.includes("women's") ||
             text.includes('ladies') || text.includes('woman')) && !text.includes('men') && !text.includes('unisex')) {
    attributes.gender = 'female';
  }

  return attributes;
}

async function createVariantMetafield(variantId, namespace, key, value, type = 'single_line_text_field') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      metafield: {
        namespace: namespace,
        key: key,
        value: value,
        type: type,
        owner_id: variantId,
        owner_resource: 'variant'
      }
    });

    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: `/admin/api/${API_VERSION}/metafields.json`,
      method: 'POST',
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
      path: `/admin/api/${API_VERSION}/products.json?limit=${limit}&fields=id,title,handle,variants`,
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

async function addGoogleShoppingAttributesToVariants(dryRun = true, testLimit = null) {
  console.log('='.repeat(80));
  console.log('ADD GOOGLE SHOPPING ATTRIBUTES TO PRODUCT VARIANTS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE UPDATE'}`);
  if (testLimit) {
    console.log(`Test Mode: Limited to first ${testLimit} variants`);
  }
  console.log('');

  try {
    const response = await fetchProducts();
    const products = response.products;

    // Collect all variants with product context
    const variantsWithContext = [];
    products.forEach(product => {
      product.variants.forEach(variant => {
        variantsWithContext.push({
          product: product,
          variant: variant
        });
      });
    });

    const totalVariants = testLimit ? Math.min(testLimit, variantsWithContext.length) : variantsWithContext.length;
    const variantsToProcess = variantsWithContext.slice(0, totalVariants);

    console.log(`Total Products: ${products.length}`);
    console.log(`Total Variants: ${variantsWithContext.length}`);
    console.log(`Variants to Process: ${totalVariants}`);
    console.log('');

    let processedCount = 0;
    let updatedCount = 0;
    let metafieldsCreated = 0;
    const errors = [];

    for (const { product, variant } of variantsToProcess) {
      processedCount++;

      const attributes = determineAttributes(product, variant);

      console.log(`[${processedCount}/${totalVariants}] ${product.title} - ${variant.title}`);
      console.log(`   Variant ID: ${variant.id}`);
      console.log(`   Condition: ${attributes.condition}`);
      console.log(`   Age Group: ${attributes.age_group}`);
      console.log(`   Gender: ${attributes.gender}`);

      if (!dryRun) {
        try {
          // Add core metafields to variant
          await createVariantMetafield(variant.id, 'google', 'condition', attributes.condition);
          metafieldsCreated++;
          await new Promise(resolve => setTimeout(resolve, 300));

          await createVariantMetafield(variant.id, 'google', 'age_group', attributes.age_group);
          metafieldsCreated++;
          await new Promise(resolve => setTimeout(resolve, 300));

          await createVariantMetafield(variant.id, 'google', 'gender', attributes.gender);
          metafieldsCreated++;
          await new Promise(resolve => setTimeout(resolve, 300));

          updatedCount++;
          console.log(`   ✓ Updated successfully`);
        } catch (error) {
          errors.push({
            product: product.title,
            variant: variant.title,
            error: error.message || JSON.stringify(error)
          });
          console.log(`   ✗ Update failed: ${error.message || JSON.stringify(error)}`);
        }
      }

      console.log('');

      // Progress indicator every 50 variants
      if (processedCount % 50 === 0 && !dryRun) {
        const percentage = ((processedCount / totalVariants) * 100).toFixed(1);
        const elapsed = Math.floor((processedCount * 1000) / 1000); // rough estimate
        const eta = Math.floor(((totalVariants - processedCount) * 1000) / 1000);
        console.log(`*** PROGRESS: ${percentage}% | ${processedCount}/${totalVariants} variants | ETA: ~${Math.floor(eta/60)}m ***`);
        console.log('');
      }
    }

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total Variants Processed: ${processedCount}`);
    if (!dryRun) {
      console.log(`Successfully Updated: ${updatedCount}`);
      console.log(`Total Metafields Created: ${metafieldsCreated}`);
      console.log(`Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log('');
        console.log('ERRORS:');
        errors.slice(0, 10).forEach(e => {
          console.log(`  - ${e.product} - ${e.variant}: ${e.error}`);
        });
        if (errors.length > 10) {
          console.log(`  ... and ${errors.length - 10} more errors`);
        }
      }

      // Success metrics
      const successRate = ((updatedCount / processedCount) * 100).toFixed(2);
      const avgMetafieldsPerVariant = (metafieldsCreated / updatedCount).toFixed(2);
      console.log('');
      console.log('METRICS:');
      console.log(`  Success Rate: ${successRate}%`);
      console.log(`  Avg Metafields per Variant: ${avgMetafieldsPerVariant}`);
      console.log(`  Total API Calls: ${metafieldsCreated}`);
      console.log(`  Estimated Execution Time: ~${Math.floor((metafieldsCreated * 0.3) / 60)} minutes`);
    } else {
      console.log('');
      console.log('⚠️  DRY RUN MODE - No changes made');
      console.log('');
      console.log('To apply these changes, run:');
      if (testLimit) {
        console.log('  node scripts/add_google_shopping_attributes_variants.cjs --live --test 5');
      } else {
        console.log('  node scripts/add_google_shopping_attributes_variants.cjs --live');
      }
    }
    console.log('');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const isLive = process.argv.includes('--live');
const testIndex = process.argv.indexOf('--test');
const testLimit = testIndex !== -1 ? parseInt(process.argv[testIndex + 1]) : null;

addGoogleShoppingAttributesToVariants(!isLive, testLimit);
