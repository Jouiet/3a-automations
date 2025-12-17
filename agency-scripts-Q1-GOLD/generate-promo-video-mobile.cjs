#!/usr/bin/env node
/**
 * PROMO VIDEO GENERATOR - Mobile Responsive Demo
 * Purpose: Demonstrate mobile shopping experience (iPhone SE)
 * Method: Puppeteer + puppeteer-screen-recorder
 * Context: Session 98+++ - Marketing automation Phase 1
 *
 * Scenario: Homepage → Helmets → Product Details (Mobile Viewport)
 * Output: MP4 video (375x667, 30fps) - Portrait format
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-mobile-responsive.mp4';

// iPhone SE viewport
const MOBILE_VIEWPORT = {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
};

console.log('================================================================================');
console.log('HENDERSON SHOP - MOBILE RESPONSIVE DEMO');
console.log('================================================================================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Device: iPhone SE (${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height})`);
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
  console.log('🎬 STEP 1: Launching browser (mobile mode)...\n');

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
    defaultViewport: MOBILE_VIEWPORT
  });

  const page = await browser.newPage();

  // Set user agent to iPhone
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

  // Configure recorder (portrait format)
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false,
    fps: 30,
    videoFrame: {
      width: MOBILE_VIEWPORT.width,
      height: MOBILE_VIEWPORT.height
    },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 3000, // Lower bitrate for mobile
    aspectRatio: '9:16' // Portrait
  });

  try {
    // Start recording
    const outputPath = path.join(OUTPUT_DIR, VIDEO_FILENAME);
    console.log(`🔴 STEP 2: Starting recording (portrait mode)...\n`);
    await recorder.start(outputPath);

    // === SCENARIO START ===
    console.log('📍 Scene 1: Mobile Homepage');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`   ✓ Loaded: ${page.url()}`);
    await wait(2500);

    // Scroll down on mobile
    console.log('   ↓ Scrolling (touch gesture simulation)...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2000);

    // Open mobile menu if exists
    console.log('\n📍 Scene 2: Mobile Navigation');
    const menuOpened = await page.evaluate(() => {
      const menuBtn = document.querySelector('.mobile-nav__toggle, .menu-toggle, button[aria-label*="menu" i], .hamburger');
      if (menuBtn) {
        menuBtn.click();
        return true;
      }
      return false;
    });

    if (menuOpened) {
      console.log('   ✓ Mobile menu opened');
      await wait(2000);

      // Close menu and navigate directly
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.mobile-nav__close, .menu-close, button[aria-label*="close" i]');
        if (closeBtn) closeBtn.click();
      });
      await wait(1000);
    }

    // Navigate to Helmets collection directly
    console.log('   → Navigating to Helmets collection...');
    await page.goto(`${SITE_URL}/collections/helmets`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log(`   ✓ Loaded: ${page.url()}`);
    await wait(2500);

    // Scroll through mobile collection
    console.log('\n📍 Scene 3: Browsing Products (Mobile)');
    console.log('   ↓ Scrolling through products...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(2000);
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(2000);

    // Navigate to first product
    console.log('\n📍 Scene 4: Mobile Product Page');
    console.log('   → Finding first product...');

    const firstProductUrl = await page.evaluate(() => {
      const productLink = document.querySelector('a[href*="/products/"]');
      return productLink ? productLink.href : null;
    });

    if (firstProductUrl) {
      console.log(`   → Navigating to: ${firstProductUrl}`);
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`   ✓ Loaded: ${page.url()}`);
      await wait(3000);

      // Scroll to view product details on mobile
      console.log('   ↓ Viewing product details...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await wait(2000);

      // Scroll to reviews/description
      await page.evaluate(() => window.scrollBy(0, 600));
      await wait(2000);

      // Scroll back to Add to Cart
      console.log('   ↑ Scrolling back to Add to Cart...');
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(2000);

      // Highlight Add to Cart button
      const addToCartHighlighted = await page.evaluate(() => {
        const addBtn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
        if (addBtn) {
          addBtn.style.outline = '3px solid #FF3131';
          addBtn.style.outlineOffset = '2px';
          // Scroll into view
          addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      });

      if (addToCartHighlighted) {
        await wait(2000);
        console.log('   ✓ Add to Cart button highlighted (mobile view)');
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
    console.log(`🎬 Resolution: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height} (Portrait)`);
    console.log(`📱 Device: iPhone SE`);
    console.log(`🎞️  Frame Rate: 30 fps`);
    console.log(`⏱️  Estimated Duration: ~20-25 seconds`);
    console.log(`💡 Use Case: Instagram Stories, TikTok, YouTube Shorts`);
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
    console.log('✅ MOBILE RESPONSIVE VIDEO COMPLETE\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
