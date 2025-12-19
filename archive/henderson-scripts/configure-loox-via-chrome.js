#!/usr/bin/env node

/**
 * LOOX REVIEWS CONFIGURATION VIA CHROME DEVTOOLS
 *
 * This script uses Chrome DevTools Protocol to navigate to Loox app
 * and guide the configuration process.
 *
 * Prerequisites:
 * - Chrome launched with --remote-debugging-port=9222
 * - User logged into Shopify Admin
 */

const CDP = require('chrome-remote-interface');

async function configureLoox() {
  console.log('═'.repeat(80));
  console.log('LOOX REVIEWS CONFIGURATION VIA CHROME DEVTOOLS');
  console.log('═'.repeat(80));
  console.log();

  let client;

  try {
    // Connect to Chrome DevTools
    console.log('Step 1: Connecting to Chrome DevTools Protocol...');
    client = await CDP({ port: 9222 });
    console.log('  ✅ Connected to Chrome');
    console.log();

    const { Network, Page, Runtime, DOM } = client;

    // Enable necessary domains
    await Network.enable();
    await Page.enable();
    await DOM.enable();
    await Runtime.enable();

    console.log('Step 2: Navigating to Shopify Apps page...');
    await Page.navigate({ url: 'https://admin.shopify.com/store/jqp1x4-7e/apps' });
    await Page.loadEventFired();
    console.log('  ✅ Loaded Shopify Apps page');
    console.log();

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Step 3: Searching for Loox app...');

    // Get page content and find Loox
    const result = await Runtime.evaluate({
      expression: `
        const looxLinks = Array.from(document.querySelectorAll('a')).filter(a =>
          a.textContent.toLowerCase().includes('loox') ||
          a.href.includes('loox')
        );
        looxLinks.length > 0 ? looxLinks[0].href : null;
      `,
      returnByValue: true
    });

    if (result.result.value) {
      console.log(`  ✅ Found Loox app link: ${result.result.value}`);
      console.log();

      console.log('Step 4: Opening Loox app...');
      await Page.navigate({ url: result.result.value });
      await Page.loadEventFired();
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('  ✅ Loox app opened');
      console.log();

      console.log('═'.repeat(80));
      console.log('✅ LOOX APP IS NOW OPEN IN CHROME');
      console.log('═'.repeat(80));
      console.log();
      console.log('**MANUAL CONFIGURATION REQUIRED:**');
      console.log();
      console.log('Please complete these steps in the Loox interface:');
      console.log();
      console.log('1. Enable "Automatic Review Requests"');
      console.log('   - Toggle switch should be ON');
      console.log('   - Set timing: 7 days after delivery');
      console.log();
      console.log('2. Configure Discount Codes:');
      console.log('   - Text review discount: REVIEW10 (10% off)');
      console.log('   - Photo review discount: PHOTOREVIEW15 (15% off)');
      console.log();
      console.log('3. Enable Photo Review Widgets');
      console.log('   - Should display on product pages');
      console.log();
      console.log('4. Customize Email Template:');
      console.log('   - Add Henderson Shop branding');
      console.log('   - Include "Since 2017" tagline');
      console.log('   - Professional motorcycle gear messaging');
      console.log();
      console.log('5. Test Configuration:');
      console.log('   - Send test review request email');
      console.log('   - Verify discount codes work');
      console.log();
      console.log('**EXPECTED ROI**: $15,000-25,000/year');
      console.log('**TIME REQUIRED**: 20-30 minutes');
      console.log();
      console.log('Press Ctrl+C when configuration is complete...');
      console.log();

      // Keep connection alive
      await new Promise(() => {});

    } else {
      console.log('  ❌ Could not find Loox app link');
      console.log();
      console.log('Please manually navigate to:');
      console.log('https://admin.shopify.com/store/jqp1x4-7e/apps');
      console.log('Then click on "Loox Reviews" app');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log();
    console.log('**TROUBLESHOOTING:**');
    console.log('1. Ensure Chrome is running with debugging: --remote-debugging-port=9222');
    console.log('2. Ensure you are logged into Shopify Admin');
    console.log('3. Check that port 9222 is not blocked');
    console.log();
    process.exit(1);
  } finally {
    if (client) {
      // Don't close - keep browser open for configuration
      console.log('(Chrome will remain open for configuration)');
    }
  }
}

// Check if chrome-remote-interface is available
try {
  require.resolve('chrome-remote-interface');
  configureLoox();
} catch (e) {
  console.log('❌ chrome-remote-interface not installed');
  console.log();
  console.log('Installing dependency...');
  console.log('Run: npm install chrome-remote-interface');
  console.log();
  console.log('OR manually navigate to:');
  console.log('https://admin.shopify.com/store/jqp1x4-7e/apps');
  console.log('Then click "Loox Reviews" and configure:');
  console.log('- Enable automatic review requests (7 days)');
  console.log('- Configure REVIEW10 and PHOTOREVIEW15 discount codes');
  console.log('- Enable photo review widgets');
  console.log('- Customize email template with Henderson branding');
  process.exit(1);
}
