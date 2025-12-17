#!/usr/bin/env node
/**
 * PROMO VIDEO GENERATOR - Search Functionality Demo
 * Purpose: Demonstrate search and discovery experience
 * Method: Puppeteer + puppeteer-screen-recorder
 * Context: Session 98+++ - Marketing automation Phase 1
 *
 * Scenario: Homepage → Search "helmet" → Browse Results → Select Product
 * Output: MP4 video (1080p, 30fps)
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-search-demo.mp4';
const SEARCH_QUERY = 'helmet';

console.log('================================================================================');
console.log('HENDERSON SHOP - SEARCH FUNCTIONALITY DEMO');
console.log('================================================================================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Scenario: Homepage → Search "${SEARCH_QUERY}" → Results → Product`);
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

    // Find and focus search input
    console.log('\n📍 Scene 2: Using Search');
    console.log(`   → Typing search query: "${SEARCH_QUERY}"`);

    const searchFound = await page.evaluate((query) => {
      // Common search selectors in Shopify themes
      const searchInput = document.querySelector('input[type="search"], input[name="q"], .search__input, #search, input[placeholder*="Search"]');

      if (searchInput) {
        // Highlight search bar
        searchInput.style.outline = '3px solid #FF3131';
        searchInput.style.outlineOffset = '2px';
        searchInput.focus();
        return true;
      }
      return false;
    }, SEARCH_QUERY);

    if (searchFound) {
      await wait(1500);
      console.log('   ✓ Search bar highlighted and focused');

      // Type search query character by character (realistic)
      await page.type('input[type="search"], input[name="q"], .search__input, #search, input[placeholder*="Search"]', SEARCH_QUERY, { delay: 100 });
      console.log(`   ✓ Typed: "${SEARCH_QUERY}"`);
      await wait(1500);

      // Submit search
      await page.keyboard.press('Enter');
      console.log('   ✓ Submitted search');
      await wait(3000);

      // Wait for search results to load
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
        console.log('   ⚠️  Navigation timeout, continuing...');
      });

      console.log(`\n📍 Scene 3: Search Results`);
      console.log(`   ✓ Loaded: ${page.url()}`);
      await wait(2500);

      // Scroll through results
      console.log('   ↓ Browsing search results...');
      await page.evaluate(() => window.scrollBy(0, 600));
      await wait(2000);
      await page.evaluate(() => window.scrollBy(0, 600));
      await wait(2000);

      // Get first product URL from results
      console.log('\n📍 Scene 4: Product Selection');
      console.log('   → Finding first product in results...');

      const firstProductUrl = await page.evaluate(() => {
        const productLink = document.querySelector('a[href*="/products/"]');
        return productLink ? productLink.href : null;
      });

      if (firstProductUrl) {
        console.log(`   → Navigating to: ${firstProductUrl}`);
        await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`   ✓ Loaded: ${page.url()}`);
        await wait(3000);

        // Scroll to view product details
        console.log('   ↓ Viewing product details...');
        await page.evaluate(() => window.scrollBy(0, 600));
        await wait(2000);

        // Scroll to reviews/description
        await page.evaluate(() => window.scrollBy(0, 800));
        await wait(2000);

        // Scroll back to top
        console.log('   ↑ Scrolling back to product info...');
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(2000);

        // Highlight Add to Cart
        const addToCartHighlighted = await page.evaluate(() => {
          const addBtn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
          if (addBtn) {
            addBtn.style.outline = '3px solid #FF3131';
            addBtn.style.outlineOffset = '2px';
            return true;
          }
          return false;
        });

        if (addToCartHighlighted) {
          await wait(2000);
          console.log('   ✓ Add to Cart button highlighted');
        }
      } else {
        console.log('   ⚠️  No product found in search results');
      }

    } else {
      console.log('   ⚠️  Search bar not found, using direct URL');
      await page.goto(`${SITE_URL}/search?q=${SEARCH_QUERY}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log(`   ✓ Loaded search results directly`);
      await wait(3000);
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
    console.log('✅ SEARCH DEMO VIDEO COMPLETE\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
