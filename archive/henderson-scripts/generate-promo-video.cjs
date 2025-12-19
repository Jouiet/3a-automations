#!/usr/bin/env node
/**
 * PROMO VIDEO GENERATOR - Proof of Concept
 * Purpose: Automated screen recording of Henderson Shop user experience
 * Method: Puppeteer + puppeteer-screen-recorder
 * Context: Session 98++ - Marketing automation (video content)
 *
 * Scenario: Homepage → Helmets Collection → Product Details
 * Output: MP4 video (1080p, 30fps)
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-helmets-demo.mp4';

console.log('================================================================================');
console.log('HENDERSON SHOP - PROMO VIDEO GENERATOR (POC)');
console.log('================================================================================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Scenario: Homepage → Helmets → Product Details`);
console.log(`Output: ${OUTPUT_DIR}/${VIDEO_FILENAME}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * Create output directory if not exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
  }
}

/**
 * Wait helper (smoother UX in video)
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main video generation
 */
async function generatePromoVideo() {
  console.log('🎬 STEP 1: Launching browser...\n');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true, // Set to false for debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();

  // Configure recorder
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false,
    fps: 30,
    videoFrame: {
      width: 1920,
      height: 1080
    },
    videoCrf: 18, // Quality: 0 (best) - 51 (worst), 18 = visually lossless
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 5000,
    aspectRatio: '16:9'
  });

  try {
    // Start recording
    const outputPath = path.join(OUTPUT_DIR, VIDEO_FILENAME);
    console.log(`🔴 STEP 2: Starting recording...\n`);
    await recorder.start(outputPath);

    // === SCENARIO START ===
    console.log('📍 Scene 1: Homepage');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`   ✓ Loaded: ${page.url()}`);
    await wait(3000); // Show homepage for 3 seconds

    // Scroll down to show products
    console.log('   ↓ Scrolling down...');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(2000);

    // Navigate to Helmets collection (direct navigation more reliable than clicking)
    console.log('\n📍 Scene 2: Helmets Collection');
    console.log('   → Navigating to helmets collection...');
    await page.goto(`${SITE_URL}/collections/helmets`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log(`   ✓ Loaded: ${page.url()}`);
    await wait(3000);

    // Scroll through collection
    console.log('   ↓ Browsing products...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await wait(2000);
    await page.evaluate(() => window.scrollBy(0, 800));
    await wait(2000);

    // Navigate to first product (extract URL from page then navigate directly)
    console.log('\n📍 Scene 3: Product Details');
    console.log('   → Finding first product link...');

    const firstProductUrl = await page.evaluate(() => {
      const productLink = document.querySelector('a[href*="/products/"]');
      return productLink ? productLink.href : null;
    });

    if (firstProductUrl) {
      console.log(`   → Navigating to product: ${firstProductUrl}`);
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`   ✓ Loaded: ${page.url()}`);
      await wait(3000);

      // Scroll down to show product details
      console.log('   ↓ Viewing product details...');
      await page.evaluate(() => window.scrollBy(0, 600));
      await wait(2000);

      // Scroll to reviews section if exists
      await page.evaluate(() => window.scrollBy(0, 800));
      await wait(2000);

      // Scroll back to top
      console.log('   ↑ Scrolling back to Add to Cart...');
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(2000);

      // Hover over Add to Cart button using evaluate (more reliable)
      const addToCartExists = await page.evaluate(() => {
        const btn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
        if (btn) {
          btn.style.outline = '3px solid #FF3131';
          return true;
        }
        return false;
      });

      if (addToCartExists) {
        await wait(1500);
        console.log('   ✓ Showcased Add to Cart button');
      }
    } else {
      console.log('   ⚠️  No product found in collection');
    }

    // Final pause
    await wait(2000);
    console.log('\n✅ Scenario completed!\n');

  } catch (error) {
    console.error('\n❌ ERROR during recording:', error.message);
    throw error;
  } finally {
    // Stop recording
    console.log('⏹️  STEP 3: Stopping recording...\n');
    await recorder.stop();

    // Close browser
    await browser.close();
    console.log('🔒 Browser closed\n');
  }

  // Verify output
  const outputPath = path.join(OUTPUT_DIR, VIDEO_FILENAME);
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('================================================================================');
    console.log('✅ VIDEO GENERATED SUCCESSFULLY');
    console.log('================================================================================');
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📦 Size: ${fileSizeMB} MB`);
    console.log(`🎬 Resolution: 1920x1080 (Full HD)`);
    console.log(`🎞️  Frame Rate: 30 fps`);
    console.log(`⏱️  Estimated Duration: ~20-25 seconds`);
    console.log('================================================================================\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. Review video: open promo-videos/henderson-helmets-demo.mp4');
    console.log('2. Optimize for social media (optional):');
    console.log('   - Instagram: 1080x1920 (portrait)');
    console.log('   - TikTok: 1080x1920 (portrait)');
    console.log('   - YouTube Shorts: 1080x1920 (portrait)');
    console.log('   - Facebook/Twitter: 1920x1080 (landscape)');
    console.log('3. Add overlays/text (optional): Use FFmpeg or video editor');
    console.log('4. Upload to social media platforms\n');

    return outputPath;
  } else {
    throw new Error('Video file not created');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    ensureOutputDir();
    await generatePromoVideo();

    console.log('✅ POC COMPLETED SUCCESSFULLY\n');
    console.log('💡 TO CREATE MORE SCENARIOS:');
    console.log('   - Edit scenarios in this script');
    console.log('   - Create separate scripts for different journeys');
    console.log('   - Batch generate multiple videos in parallel');
    console.log('   - Automate with GitHub Actions (scheduled generation)\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
