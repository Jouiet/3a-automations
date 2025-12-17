#!/usr/bin/env node
/**
 * Download Top 30 Marketing Images
 * Organized in marketing-images folder for ad campaigns
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dataDir = path.join(__dirname, '..', 'marketing-analysis');
const top30 = JSON.parse(fs.readFileSync(path.join(dataDir, 'top-30-marketing-images.json'), 'utf8'));

const outputDir = path.join(__dirname, '..', 'marketing-images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🖼️  DOWNLOADING TOP 30 MARKETING IMAGES\n');
console.log('═'.repeat(80));

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadAll() {
  const manifest = [];

  for (let i = 0; i < top30.length; i++) {
    const image = top30[i];
    const num = String(i + 1).padStart(2, '0');

    // Clean filename
    const ext = path.extname(new URL(image.imageUrl).pathname) || '.webp';
    const cleanTitle = image.product.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);

    const filename = `${num}_${image.product.type.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${cleanTitle}${ext}`;
    const filepath = path.join(outputDir, filename);

    try {
      console.log(`${i + 1}/30 Downloading: ${filename}`);
      await downloadImage(image.imageUrl, filepath);

      manifest.push({
        rank: i + 1,
        filename,
        productTitle: image.product.title,
        productType: image.product.type,
        price: image.product.price,
        marketingScore: image.marketingScore,
        dimensions: `${image.width}x${image.height}`,
        productUrl: image.product.url,
        originalUrl: image.imageUrl,
        useCases: [
          'Facebook Carousel Ads',
          'Instagram Feed/Stories',
          'Google Display Ads',
          'AI Video Ads (15-20s)',
          'Product Catalog'
        ]
      });

      console.log(`   ✅ Saved: ${filename}\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Save manifest
  fs.writeFileSync(
    path.join(outputDir, '_MARKETING_IMAGES_MANIFEST.json'),
    JSON.stringify(manifest, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    `# Henderson Shop - Top 30 Marketing Images

## Purpose
These 30 images were algorithmically selected from 3,248 product images based on:
- Visual quality (resolution, aspect ratio)
- Marketing appeal (product category, price point)
- Category diversity
- Ad platform compatibility

## Use Cases
- **Facebook/Instagram Carousel Ads**: All images optimized for carousel format
- **Google Display Ads**: High-resolution images for display campaigns
- **AI Video Ads**: Transform into 15-20s video ads using tools like Runway, Pika, or Synthesia
- **Product Catalogs**: Ready for print and digital catalogs
- **Social Media Content**: Instagram posts, Stories, Reels

## Category Breakdown
${Object.entries(manifest.reduce((acc, img) => {
  acc[img.productType] = (acc[img.productType] || 0) + 1;
  return acc;
}, {}))
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- **${type}**: ${count} images`)
  .join('\n')}

## Total Images: ${manifest.length}
## Average Marketing Score: ${(manifest.reduce((sum, img) => sum + img.marketingScore, 0) / manifest.length).toFixed(0)}

---
Generated: ${new Date().toISOString()}
`
  );

  console.log('\n═'.repeat(80));
  console.log(`\n✅ Downloaded ${manifest.length} images to: marketing-images/`);
  console.log('📄 Created: _MARKETING_IMAGES_MANIFEST.json');
  console.log('📄 Created: README.md\n');
}

downloadAll().catch(console.error);
