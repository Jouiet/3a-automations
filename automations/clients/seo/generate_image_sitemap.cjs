#!/usr/bin/env node
/**
 * GENERATE IMAGE SITEMAP
 * Purpose: Create XML sitemap for product images (SEO)
 * Method: Shopify Admin API → XML sitemap
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const https = require('https');
const fs = require('fs');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const API_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';
const STORE_URL = process.env.STORE_PUBLIC_URL || `https://${SHOPIFY_DOMAIN}`;

if (!SHOPIFY_DOMAIN || !API_TOKEN) {
  console.error('❌ ERROR: SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN required in .env');
  process.exit(1);
}

async function fetchAllProducts() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: `/admin/api/${API_VERSION}/products.json?limit=250`,
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data).products);
        } else {
          reject({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateImageSitemap(products) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const product of products) {
    if (product.status !== 'active') continue;
    if (!product.images || product.images.length === 0) continue;

    const productUrl = `${STORE_URL}/products/${product.handle}`;
    const lastmod = product.updated_at.split('T')[0];

    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(productUrl)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;

    // Include ALL images for this product
    for (const image of product.images) {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escapeXml(image.src)}</image:loc>\n`;

      // Use alt text as title (we just added these!)
      const title = image.alt && image.alt.trim()
        ? escapeXml(image.alt)
        : escapeXml(`${product.title} - Image ${image.position}`);
      xml += `      <image:title>${title}</image:title>\n`;

      // Caption with position info
      const caption = image.alt && image.alt.trim()
        ? escapeXml(image.alt)
        : escapeXml(`${product.title} - View ${image.position}`);
      xml += `      <image:caption>${caption}</image:caption>\n`;

      xml += '    </image:image>\n';
    }

    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

async function main() {
  console.log('='.repeat(70));
  console.log('IMAGE SITEMAP GENERATOR - MyDealz Store');
  console.log('='.repeat(70));
  console.log('');

  console.log('[1/3] Fetching all products from Shopify...');
  const products = await fetchAllProducts();
  console.log(`  ✓ Fetched ${products.length} products`);
  console.log('');

  console.log('[2/3] Generating image sitemap XML...');
  const xml = generateImageSitemap(products);

  // Count images and products
  const imageCount = (xml.match(/<image:image>/g) || []).length;
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`  ✓ Generated sitemap with ${urlCount} products and ${imageCount} images`);
  console.log('');

  console.log('[3/3] Saving sitemap...');
  fs.writeFileSync('sitemap_images.xml', xml);
  console.log('  ✓ Saved to: sitemap_images.xml');
  console.log('');

  console.log('='.repeat(70));
  console.log('SUCCESS');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total Products: ${urlCount}`);
  console.log(`Total Images: ${imageCount}`);
  console.log('');
  console.log('NEXT STEPS:');
  console.log('1. Upload sitemap_images.xml to your web server root');
  console.log('2. Add to main sitemap.xml:');
  console.log('   <sitemap>');
  console.log(`     <loc>${STORE_URL}/sitemap_images.xml</loc>`);
  console.log('   </sitemap>');
  console.log('3. Submit to Google Search Console');
  console.log('');
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
