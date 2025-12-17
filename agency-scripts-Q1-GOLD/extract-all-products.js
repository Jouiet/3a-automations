#!/usr/bin/env node
/**
 * Extract ALL Henderson Shop Products Data
 * For comprehensive marketing analysis
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

async function fetchAllProducts() {
  console.log('🔍 Fetching all products from Henderson Shop...\n');

  let allProducts = [];
  let pageInfo = null;
  let pageCount = 0;

  do {
    pageCount++;
    const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/products.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allProducts = allProducts.concat(data.products);

    console.log(`📦 Page ${pageCount}: ${data.products.length} products fetched (Total: ${allProducts.length})`);

    // Check for pagination
    const linkHeader = response.headers.get('Link');
    pageInfo = linkHeader && linkHeader.includes('rel="next"')
      ? linkHeader.match(/<[^>]*page_info=([^>]*)>/)?.[1]
      : null;

  } while (pageInfo);

  return allProducts;
}

async function fetchAllCollections() {
  console.log('\n📚 Fetching all collections...\n');

  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/custom_collections.json`;

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Found ${data.custom_collections.length} custom collections`);

  return data.custom_collections;
}

async function analyzeProducts(products) {
  console.log('\n📊 ANALYZING PRODUCTS DATA:\n');
  console.log('═'.repeat(80));

  // Basic stats
  const totalProducts = products.length;
  const publishedProducts = products.filter(p => p.status === 'active').length;
  const draftProducts = products.filter(p => p.status === 'draft').length;

  console.log(`\n📈 PRODUCT STATISTICS:`);
  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Published: ${publishedProducts}`);
  console.log(`   Drafts: ${draftProducts}`);

  // Price analysis
  const prices = products
    .filter(p => p.variants && p.variants.length > 0)
    .map(p => parseFloat(p.variants[0].price));

  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
  const minPrice = Math.min(...prices).toFixed(2);
  const maxPrice = Math.max(...prices).toFixed(2);

  console.log(`\n💰 PRICE RANGE:`);
  console.log(`   Average: $${avgPrice}`);
  console.log(`   Min: $${minPrice}`);
  console.log(`   Max: $${maxPrice}`);

  // Product types
  const productTypes = {};
  products.forEach(p => {
    const type = p.product_type || 'Uncategorized';
    productTypes[type] = (productTypes[type] || 0) + 1;
  });

  console.log(`\n🏷️  PRODUCT TYPES (Categories):`);
  Object.entries(productTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} products`);
    });

  // Tags analysis
  const allTags = {};
  products.forEach(p => {
    const tags = p.tags ? p.tags.split(',').map(t => t.trim()) : [];
    tags.forEach(tag => {
      allTags[tag] = (allTags[tag] || 0) + 1;
    });
  });

  console.log(`\n🔖 TOP TAGS (Marketing Keywords):`);
  Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([tag, count]) => {
      console.log(`   ${tag}: ${count} products`);
    });

  // Image analysis
  const totalImages = products.reduce((sum, p) => sum + (p.images?.length || 0), 0);
  const avgImagesPerProduct = (totalImages / products.length).toFixed(1);
  const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0).length;

  console.log(`\n🖼️  IMAGES ANALYSIS:`);
  console.log(`   Total Images: ${totalImages}`);
  console.log(`   Average per Product: ${avgImagesPerProduct}`);
  console.log(`   Products without images: ${productsWithoutImages}`);

  // Vendor analysis
  const vendors = {};
  products.forEach(p => {
    const vendor = p.vendor || 'Unknown';
    vendors[vendor] = (vendors[vendor] || 0) + 1;
  });

  console.log(`\n🏢 VENDORS/BRANDS:`);
  Object.entries(vendors)
    .sort((a, b) => b[1] - a[1])
    .forEach(([vendor, count]) => {
      console.log(`   ${vendor}: ${count} products`);
    });

  console.log('\n' + '═'.repeat(80));
}

async function extractProductImages(products) {
  console.log('\n🖼️  EXTRACTING ALL PRODUCT IMAGES FOR MARKETING:\n');

  const allImages = [];

  products.forEach(product => {
    if (product.images && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        allImages.push({
          productId: product.id,
          productTitle: product.title,
          productType: product.product_type,
          imageId: img.id,
          imageUrl: img.src,
          imageAlt: img.alt || '',
          position: img.position || idx + 1,
          width: img.width,
          height: img.height,
          isPrimary: idx === 0
        });
      });
    }
  });

  console.log(`✅ Extracted ${allImages.length} images from ${products.length} products`);

  return allImages;
}

async function main() {
  try {
    console.log('🚀 HENDERSON SHOP - COMPREHENSIVE PRODUCT DATA EXTRACTION');
    console.log('═'.repeat(80));

    // Fetch all data
    const products = await fetchAllProducts();
    const collections = await fetchAllCollections();
    const images = await extractProductImages(products);

    // Analyze
    await analyzeProducts(products);

    // Save raw data
    const dataDir = path.join(__dirname, '..', 'marketing-analysis');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save products
    fs.writeFileSync(
      path.join(dataDir, 'all-products-raw.json'),
      JSON.stringify(products, null, 2)
    );
    console.log(`\n💾 Saved: marketing-analysis/all-products-raw.json (${products.length} products)`);

    // Save collections
    fs.writeFileSync(
      path.join(dataDir, 'all-collections.json'),
      JSON.stringify(collections, null, 2)
    );
    console.log(`💾 Saved: marketing-analysis/all-collections.json (${collections.length} collections)`);

    // Save images catalog
    fs.writeFileSync(
      path.join(dataDir, 'all-images-catalog.json'),
      JSON.stringify(images, null, 2)
    );
    console.log(`💾 Saved: marketing-analysis/all-images-catalog.json (${images.length} images)`);

    // Save simplified product catalog for marketing
    const simplifiedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      type: p.product_type,
      vendor: p.vendor,
      tags: p.tags,
      status: p.status,
      price: p.variants?.[0]?.price,
      compareAtPrice: p.variants?.[0]?.compare_at_price,
      inventoryQuantity: p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
      imageCount: p.images?.length || 0,
      primaryImage: p.images?.[0]?.src || null,
      url: `https://www.hendersonshop.com/products/${p.handle}`
    }));

    fs.writeFileSync(
      path.join(dataDir, 'products-marketing-catalog.json'),
      JSON.stringify(simplifiedProducts, null, 2)
    );
    console.log(`💾 Saved: marketing-analysis/products-marketing-catalog.json (simplified)`);

    console.log('\n✅ EXTRACTION COMPLETE!\n');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
