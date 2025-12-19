#!/usr/bin/env node
/**
 * Download Top 30 Lifestyle/Action Marketing Images (with people)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dataDir = path.join(__dirname, '..', 'marketing-analysis');
const top30 = JSON.parse(fs.readFileSync(path.join(dataDir, 'top-30-lifestyle-images.json'), 'utf8'));

const outputDir = path.join(__dirname, '..', 'marketing-images-lifestyle');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎭 DOWNLOADING TOP 30 LIFESTYLE/ACTION IMAGES\n');
console.log('═'.repeat(80));

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
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

    const ext = path.extname(new URL(image.imageUrl).pathname) || '.webp';
    const cleanTitle = image.product.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 40);

    const filename = `${num}_lifestyle_${image.product.type.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${cleanTitle}${ext}`;
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
        lifestyleConfidence: image.lifestyleConfidence,
        positionInGallery: image.position,
        dimensions: `${image.width}x${image.height}`,
        productUrl: image.product.url,
        originalUrl: image.imageUrl,
        useCases: [
          'Instagram Feed (authentic lifestyle)',
          'Facebook Ads (people wearing gear)',
          'TikTok/Reels (action shots)',
          'Pinterest (aspirational content)',
          'Email Marketing (relatable imagery)',
          'Website Hero Sections'
        ],
        note: 'Lifestyle/action shot showing product in use context'
      });

      console.log(`   ✅ Saved: ${filename}\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Save manifest
  fs.writeFileSync(
    path.join(outputDir, '_LIFESTYLE_IMAGES_MANIFEST.json'),
    JSON.stringify(manifest, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    `# Henderson Shop - Top 30 Lifestyle/Action Marketing Images

## Purpose
These 30 images were selected from 3,176 lifestyle-indicator images (out of 3,248 total) based on:
- **Lifestyle Context**: Images showing products in use/on people (positions 2-10 in galleries)
- **Marketing Appeal**: Product category, price point, visual quality
- **Category Diversity**: Equal distribution across Jackets/Pants, Helmets, Boots
- **Action/Lifestyle Score**: Confidence rating for human presence/usage context

## Key Difference from Product Images
- **Product Images (first 30)**: Studio shots, white background, product-only (positions 1)
- **Lifestyle Images (this set)**: Contextual shots, people wearing/using gear (positions 2-10)

## Use Cases
- **Instagram Feed/Stories**: Show real people wearing gear (more relatable)
- **Facebook Ads**: Lifestyle context performs better than product-only shots
- **TikTok/Reels**: Action shots perfect for short-form video content
- **Pinterest**: Aspirational lifestyle content drives engagement
- **Email Marketing**: People relate better to images with human models
- **Website Headers**: Hero sections with lifestyle shots increase engagement

## Category Breakdown
${Object.entries(manifest.reduce((acc, img) => {
  acc[img.productType] = (acc[img.productType] || 0) + 1;
  return acc;
}, {}))
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- **${type}**: ${count} images (positions 2-10 in product galleries)`)
  .join('\n')}

## Total Images: ${manifest.length}
## Average Marketing Score: ${(manifest.reduce((sum, img) => sum + img.marketingScore, 0) / manifest.length).toFixed(0)}
## Average Lifestyle Confidence: ${(manifest.reduce((sum, img) => sum + img.lifestyleConfidence, 0) / manifest.length).toFixed(0)}

## Notes
- These images are secondary/tertiary gallery positions (2-10)
- They show products in use context vs. isolated product shots
- Higher lifestyle confidence = more likely to have people/action
- Perfect for campaigns requiring human element and relatability

---
Generated: ${new Date().toISOString()}
`
  );

  console.log('\n═'.repeat(80));
  console.log(`\n✅ Downloaded ${manifest.length} lifestyle images to: marketing-images-lifestyle/`);
  console.log('📄 Created: _LIFESTYLE_IMAGES_MANIFEST.json');
  console.log('📄 Created: README.md\n');
}

downloadAll().catch(console.error);
