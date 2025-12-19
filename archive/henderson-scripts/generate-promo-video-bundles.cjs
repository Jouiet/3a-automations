#!/usr/bin/env node
/**
 * PROMO VIDEO GENERATOR - Bundles Showcase
 * Purpose: Demonstrate bundle shopping experience
 * Method: Puppeteer + puppeteer-screen-recorder
 * Context: Session 98+++ - Marketing automation Phase 1
 *
 * Scenario: Homepage → Bundles Collection → Product → Add to Cart → Checkout Preview
 * Output: MP4 video (1080p, 30fps)
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-bundles-showcase.mp4';

console.log('================================================================================');
console.log('HENDERSON SHOP - BUNDLES SHOWCASE VIDEO');
console.log('================================================================================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Scenario: Homepage → Bundles → Add to Cart → Checkout`);
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
    headless: true,
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
    videoCrf: 18,
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
    await wait(2000);

    // Scroll to showcase
    console.log('   ↓ Scrolling...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(1500);

    // Navigate to Bundles collection
    console.log('\n📍 Scene 2: Bundles Collection');
    console.log('   → Navigating to bundles...');
    await page.goto(`${SITE_URL}/collections/bundles`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log(`   ✓ Loaded: ${page.url()}`);
    await wait(2500);

    // Scroll through bundles
    console.log('   ↓ Browsing bundles...');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(2000);
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(2000);

    // Navigate to first bundle product
    console.log('\n📍 Scene 3: Bundle Product Details');
    console.log('   → Finding first bundle...');

    const firstBundleUrl = await page.evaluate(() => {
      const bundleLink = document.querySelector('a[href*="/products/"]');
      return bundleLink ? bundleLink.href : null;
    });

    if (firstBundleUrl) {
      console.log(`   → Navigating to: ${firstBundleUrl}`);
      await page.goto(firstBundleUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`   ✓ Loaded: ${page.url()}`);
      await wait(3000);

      // Scroll to view bundle details
      console.log('   ↓ Viewing bundle details...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await wait(2000);

      // Scroll back to Add to Cart
      console.log('   ↑ Scrolling to Add to Cart...');
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(2000);

      // Highlight and click Add to Cart
      console.log('\n📍 Scene 4: Add to Cart');
      const addedToCart = await page.evaluate(() => {
        const addBtn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
        if (addBtn) {
          addBtn.style.outline = '3px solid #FF3131';
          addBtn.style.outlineOffset = '2px';
          return true;
        }
        return false;
      });

      if (addedToCart) {
        await wait(1500);
        console.log('   ✓ Add to Cart button highlighted');

        // Click Add to Cart via JavaScript (more reliable)
        await page.evaluate(() => {
          const addBtn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
          if (addBtn) addBtn.click();
        });
        console.log('   ✓ Clicked Add to Cart');
        await wait(3000);

        // Navigate to cart
        console.log('\n📍 Scene 5: Cart Preview');
        console.log('   → Navigating to cart...');
        await page.goto(`${SITE_URL}/cart`, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`   ✓ Loaded: ${page.url()}`);
        await wait(3000);

        // Scroll through cart
        console.log('   ↓ Viewing cart items...');
        await page.evaluate(() => window.scrollBy(0, 400));
        await wait(2000);

        // Highlight checkout button
        const checkoutHighlighted = await page.evaluate(() => {
          const checkoutBtn = document.querySelector('button[name="checkout"], .cart__checkout, a[href*="checkout"]');
          if (checkoutBtn) {
            checkoutBtn.style.outline = '3px solid #FF3131';
            checkoutBtn.style.outlineOffset = '2px';
            return true;
          }
          return false;
        });

        if (checkoutHighlighted) {
          await wait(2000);
          console.log('   ✓ Checkout button highlighted');
        }
      }
    } else {
      console.log('   ⚠️  No bundle product found');
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
    console.log(`⏱️  Estimated Duration: ~25-30 seconds`);
    console.log('================================================================================\n');

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
    console.log('✅ BUNDLES SHOWCASE VIDEO COMPLETE\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
