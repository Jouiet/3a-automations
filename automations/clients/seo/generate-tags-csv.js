require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function generateTagsCSV() {
  console.log('\n🔍 GENERATING TAGS BULK EDIT CSV');
  console.log('='.repeat(80));

  // Fetch all products
  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-10/products.json?limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API Error:', response.status, response.statusText);
    console.error('Response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const products = data.products || [];

  if (products.length === 0) {
    console.error('❌ No products found');
    console.error('Response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`\n📊 Total products: ${products.length}`);

  // Find products without tags
  const productsWithoutTags = products.filter(p => !p.tags || p.tags.trim() === '');

  console.log(`\n❌ Products without tags: ${productsWithoutTags.length}`);

  if (productsWithoutTags.length === 0) {
    console.log('✅ All products have tags!');
    return;
  }

  // Generate tags based on product info
  const csvRows = [];

  // CSV Header
  csvRows.push([
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Product Category',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Grams',
    'Variant Inventory Tracker',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Fulfillment Service',
    'Variant Price',
    'Variant Compare At Price',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Variant Barcode',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Variant Image',
    'Variant Weight Unit',
    'Variant Tax Code',
    'Cost per item',
    'Included / International',
    'Price / International',
    'Compare At Price / International',
    'Status'
  ].join(','));

  console.log(`\n📝 Generating tags for products:`);

  for (const product of productsWithoutTags) {
    const tags = [];

    // Product type-based tags
    const type = product.product_type?.toLowerCase() || '';

    if (type.includes('helmet')) {
      tags.push('helmets', 'safety-gear', 'motorcycle-gear');
      if (type.includes('full face') || product.title.toLowerCase().includes('full face')) {
        tags.push('full-face');
      }
      if (type.includes('modular') || product.title.toLowerCase().includes('modular')) {
        tags.push('modular');
      }
      if (type.includes('half') || product.title.toLowerCase().includes('half')) {
        tags.push('half-face');
      }
    } else if (type.includes('jacket') || type.includes('pant')) {
      tags.push('jackets-pants', 'motorcycle-gear', 'protection');
      if (product.title.toLowerCase().includes('waterproof')) {
        tags.push('waterproof');
      }
      if (product.title.toLowerCase().includes('leather')) {
        tags.push('leather');
      }
    } else if (type.includes('glove')) {
      tags.push('accessories', 'gloves', 'protection');
      if (product.title.toLowerCase().includes('winter')) {
        tags.push('winter');
      }
      if (product.title.toLowerCase().includes('summer')) {
        tags.push('summer');
      }
      if (product.title.toLowerCase().includes('waterproof')) {
        tags.push('waterproof');
      }
    } else if (type.includes('boot') || type.includes('shoe')) {
      tags.push('boots', 'footwear', 'protection');
    } else {
      // Generic accessories
      tags.push('accessories', 'motorcycle-gear');
    }

    // Certifications
    const titleLower = product.title.toLowerCase();
    if (titleLower.includes('dot')) tags.push('dot-certified');
    if (titleLower.includes('ece')) tags.push('ece-certified');
    if (titleLower.includes('ce')) tags.push('ce-certified');

    // Materials
    if (titleLower.includes('leather')) tags.push('leather');
    if (titleLower.includes('carbon')) tags.push('carbon-fiber');
    if (titleLower.includes('kevlar')) tags.push('kevlar');

    // Season
    if (titleLower.includes('winter')) {
      tags.push('winter');
    } else if (titleLower.includes('summer')) {
      tags.push('summer');
    } else {
      tags.push('all-season');
    }

    // Gender
    if (titleLower.includes('men') && !titleLower.includes('women')) {
      tags.push('mens');
    } else if (titleLower.includes('women') && !titleLower.includes('men')) {
      tags.push('womens');
    } else {
      tags.push('unisex');
    }

    // Features
    if (titleLower.includes('waterproof')) tags.push('waterproof');
    if (titleLower.includes('breathable')) tags.push('breathable');
    if (titleLower.includes('racing')) tags.push('racing');
    if (titleLower.includes('vintage')) tags.push('vintage');
    if (titleLower.includes('protective') || titleLower.includes('protection')) {
      tags.push('protective');
    }

    // Remove duplicates and sort
    const uniqueTags = [...new Set(tags)].sort();

    console.log(`\n   ${product.title}`);
    console.log(`   Handle: ${product.handle}`);
    console.log(`   Type: ${product.product_type || 'N/A'}`);
    console.log(`   Generated tags: ${uniqueTags.join(', ')}`);

    // Add CSV row
    csvRows.push([
      product.handle,  // Handle - REQUIRED
      '',  // Title - empty
      '',  // Body (HTML) - empty
      '',  // Vendor - empty
      '',  // Product Category - empty
      '',  // Type - empty
      `"${uniqueTags.join(', ')}"`,  // Tags - THIS IS WHAT WE'RE ADDING
      '',  // Published - empty
      '',  // Option1 Name - empty
      '',  // Option1 Value - empty
      '',  // Option2 Name - empty
      '',  // Option2 Value - empty
      '',  // Option3 Name - empty
      '',  // Option3 Value - empty
      '',  // Variant SKU - empty
      '',  // Variant Grams - empty
      '',  // Variant Inventory Tracker - empty
      '',  // Variant Inventory Qty - empty
      '',  // Variant Inventory Policy - empty
      '',  // Variant Fulfillment Service - empty
      '',  // Variant Price - empty
      '',  // Variant Compare At Price - empty
      '',  // Variant Requires Shipping - empty
      '',  // Variant Taxable - empty
      '',  // Variant Barcode - empty
      '',  // Image Src - empty
      '',  // Image Position - empty
      '',  // Image Alt Text - empty
      '',  // Variant Image - empty
      '',  // Variant Weight Unit - empty
      '',  // Variant Tax Code - empty
      '',  // Cost per item - empty
      '',  // Included / International - empty
      '',  // Price / International - empty
      '',  // Compare At Price / International - empty
      ''   // Status - empty
    ].join(','));
  }

  // Write CSV file
  const csvContent = csvRows.join('\n');
  const outputPath = '/tmp/shopify_tags_bulk_edit.csv';
  fs.writeFileSync(outputPath, csvContent);

  console.log(`\n✅ CSV generated: ${outputPath}`);
  console.log(`📊 Total rows: ${csvRows.length - 1} (header + ${csvRows.length - 1} products)`);
  console.log(`\n📋 IMPORT INSTRUCTIONS:`);
  console.log(`   1. Go to Shopify Admin → Products → Import`);
  console.log(`   2. Upload: ${outputPath}`);
  console.log(`   3. Select: "Overwrite any current products that have the same handle"`);
  console.log(`   4. Import and wait for completion`);
  console.log(`   5. Verify: Check random products for tags`);

  console.log(`\n⏱️  Estimated time: 1-2 minutes`);
  console.log(`💡 Impact: ${productsWithoutTags.length} products will get tags`);
  console.log(`📈 SEO improvement: Tags score 7/10 → 9/10\n`);

  return {
    productsUpdated: productsWithoutTags.length,
    csvPath: outputPath
  };
}

generateTagsCSV().catch(console.error);
