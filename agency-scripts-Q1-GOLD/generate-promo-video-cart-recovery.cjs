#!/usr/bin/env node
/**
 * PROMO VIDEO GENERATOR - Abandoned Cart Recovery Journey
 * Purpose: Demonstrate cart abandonment + recovery workflow
 * Method: Puppeteer + puppeteer-screen-recorder
 * Context: Session 98+++ - Marketing automation Phase 1
 *
 * Scenario: Homepage → Product → Add to Cart → Abandon → Return → Complete
 * Output: MP4 video (1080p, 30fps)
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-cart-recovery.mp4';

console.log('================================================================================');
console.log('HENDERSON SHOP - ABANDONED CART RECOVERY JOURNEY');
console.log('================================================================================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Scenario: Product → Add to Cart → Abandon → Return → Complete`);
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

    // Navigate to featured product
    console.log('\n📍 Scene 2: Product Discovery');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(1500);

    const firstProductUrl = await page.evaluate(() => {
      const productLink = document.querySelector('a[href*="/products/"]');
      return productLink ? productLink.href : null;
    });

    if (firstProductUrl) {
      console.log(`   → Navigating to product: ${firstProductUrl}`);
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`   ✓ Loaded: ${page.url()}`);
      await wait(2500);

      // View product
      console.log('   ↓ Viewing product details...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await wait(2000);

      // Scroll back to Add to Cart
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(1500);

      // Add to Cart
      console.log('\n📍 Scene 3: Adding to Cart');
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

        // Click Add to Cart
        await page.evaluate(() => {
          const addBtn = document.querySelector('button[name="add"], .product-form__submit, button[type="submit"]');
          if (addBtn) addBtn.click();
        });
        console.log('   ✓ Product added to cart');
        await wait(3000);

        // Navigate to cart
        console.log('\n📍 Scene 4: Viewing Cart');
        await page.goto(`${SITE_URL}/cart`, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`   ✓ Loaded cart: ${page.url()}`);
        await wait(2500);

        // Scroll through cart
        console.log('   ↓ Reviewing cart items...');
        await page.evaluate(() => window.scrollBy(0, 300));
        await wait(2000);

        // ABANDONMENT - Navigate away
        console.log('\n📍 Scene 5: Cart Abandonment');
        console.log('   → User navigates away (abandons cart)...');
        await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('   ✓ Left cart (abandoned)');
        await wait(2000);

        // Browse other products (showing user is still interested)
        console.log('   → Browsing other products...');
        await page.evaluate(() => window.scrollBy(0, 600));
        await wait(2000);

        // RECOVERY - Simulate email reminder
        console.log('\n📍 Scene 6: Recovery Trigger');
        console.log('   ✉️  Simulating email reminder notification...');

        // Show visual "notification" effect
        await page.evaluate(() => {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF3131 0%, #cc2828 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(255, 49, 49, 0.3);
            z-index: 10000;
            font-family: 'Archivo', Arial, sans-serif;
            font-size: 16px;
            font-weight: 600;
            animation: slideIn 0.5s ease-out;
          `;
          notification.innerHTML = `
            📧 Complete Your Order!<br>
            <span style="font-size: 14px; font-weight: 400;">Your cart is waiting - 10% OFF with COMPLETE10</span>
          `;
          document.body.appendChild(notification);
        });

        await wait(3000);
        console.log('   ✓ Email notification displayed');

        // RETURN TO CART
        console.log('\n📍 Scene 7: Return to Cart');
        console.log('   → User returns to cart via email link...');
        await page.goto(`${SITE_URL}/cart`, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`   ✓ Returned to cart: ${page.url()}`);
        await wait(2500);

        // Scroll to checkout
        console.log('   ↓ Scrolling to checkout...');
        await page.evaluate(() => window.scrollBy(0, 400));
        await wait(2000);

        // Highlight checkout button
        console.log('\n📍 Scene 8: Completing Purchase');
        const checkoutHighlighted = await page.evaluate(() => {
          const checkoutBtn = document.querySelector('button[name="checkout"], .cart__checkout, a[href*="checkout"]');
          if (checkoutBtn) {
            checkoutBtn.style.outline = '3px solid #FF3131';
            checkoutBtn.style.outlineOffset = '2px';
            checkoutBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
          }
          return false;
        });

        if (checkoutHighlighted) {
          await wait(2500);
          console.log('   ✓ Checkout button highlighted');

          // Show discount code applied
          await page.evaluate(() => {
            const discountNotice = document.createElement('div');
            discountNotice.style.cssText = `
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #2ecc71;
              color: white;
              padding: 15px 30px;
              border-radius: 8px;
              font-family: 'Archivo', Arial, sans-serif;
              font-size: 14px;
              font-weight: 600;
              z-index: 10000;
            `;
            discountNotice.innerHTML = '✅ Discount COMPLETE10 applied - 10% OFF!';
            document.body.appendChild(discountNotice);
          });

          await wait(2500);
          console.log('   ✓ Discount code confirmation displayed');
        }
      }
    } else {
      console.log('   ⚠️  No product found');
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
    console.log(`⏱️  Estimated Duration: ~35-40 seconds`);
    console.log(`💡 Use Case: Email marketing demo, automation showcase`);
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
    console.log('✅ CART RECOVERY VIDEO COMPLETE\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
