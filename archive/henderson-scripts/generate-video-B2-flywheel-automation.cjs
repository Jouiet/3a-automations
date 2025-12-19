#!/usr/bin/env node
/**
 * MARKETING VIDEO B2 - AUTONOMOUS FLYWHEEL JOURNEY
 * Strategy: SYSTEM-CENTRIC (Henderson Competitive Advantage)
 * Angle: AI-first infrastructure, automation, smart workflows
 * Target Persona: Tech-savvy riders, early adopters
 * Duration: ~45 seconds
 *
 * MARKETING OBJECTIVES:
 * - Showcase Henderson's autonomous flywheel system
 * - Demonstrate email automation workflows
 * - Highlight VIP program journey
 * - Position as tech-forward motorcycle gear retailer
 *
 * JOURNEY DEMONSTRATED:
 * 1. Homepage → Browse products
 * 2. Cart abandonment trigger
 * 3. Email popup simulation (automation)
 * 4. Return to cart via "recovery"
 * 5. VIP program showcase
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-B2-flywheel-automation.mp4';
const BRAND_COLOR = '#FF3131';

console.log('================================================================================');
console.log('MARKETING VIDEO B2 - AUTONOMOUS FLYWHEEL JOURNEY');
console.log('================================================================================');
console.log(`Strategy: System-Centric (AI-First Infrastructure)`);
console.log(`Target: Tech-savvy riders, early adopters`);
console.log(`Duration: ~45 seconds`);
console.log('================================================================================\n');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function installMouseHelper(page) {
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const box = document.createElement('div');
      box.classList.add('mouse-helper');
      const styleElement = document.createElement('style');
      styleElement.innerHTML = `.mouse-helper { pointer-events: none; position: absolute; z-index: 100000; top: 0; left: 0; width: 50px; height: 50px; background: rgba(255, 49, 49, 0.3); border: 5px solid #FF3131; border-radius: 50%; margin-left: -25px; margin-top: -25px; transition: all 0.15s ease; box-shadow: 0 0 20px rgba(255, 49, 49, 0.6); } .mouse-helper.click { animation: clickEffect 0.3s ease; } @keyframes clickEffect { 0% { transform: scale(1); } 50% { transform: scale(1.3); background: rgba(255, 49, 49, 0.6); } 100% { transform: scale(1); } }`;
      document.head.appendChild(styleElement);
      document.body.appendChild(box);
      document.addEventListener('mousemove', event => { box.style.left = event.pageX + 'px'; box.style.top = event.pageY + 'px'; });
    });
  });
}

async function showTextOverlay(page, text, duration = 2500) {
  await page.evaluate((overlayText) => {
    const existing = document.querySelector('.scene-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay';
    overlay.textContent = overlayText;
    overlay.style.cssText = `position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.85); color: white; padding: 20px 40px; font-size: 28px; font-weight: 600; border-radius: 12px; z-index: 99999; font-family: 'Archivo', Arial, sans-serif; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);`;
    document.body.appendChild(overlay);
  }, text);
  await wait(duration);
  await page.evaluate(() => { const overlay = document.querySelector('.scene-overlay'); if (overlay) overlay.remove(); });
  await wait(300);
}

async function highlightElement(page, selector, duration = 2000) {
  const highlighted = await page.evaluate((sel, brandColor) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    element.style.outline = `5px solid ${brandColor}`;
    element.style.outlineOffset = '8px';
    element.style.boxShadow = `0 0 40px rgba(255, 49, 49, 0.6)`;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }, selector, BRAND_COLOR);
  if (highlighted) await wait(duration);
  return highlighted;
}

async function moveCursorToElement(page, selector) {
  const elementCoords = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, selector);
  if (elementCoords) {
    await page.mouse.move(elementCoords.x, elementCoords.y, { steps: 50 });
    await wait(500);
    return true;
  }
  return false;
}

async function generatePromoVideo() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await installMouseHelper(page);

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false, fps: 30, videoFrame: { width: 1920, height: 1080 },
    videoCrf: 18, videoCodec: 'libx264', videoPreset: 'ultrafast',
    videoBitrate: 5000, aspectRatio: '16:9'
  });

  try {
    const outputPath = path.join(OUTPUT_DIR, VIDEO_FILENAME);
    console.log('🔴 Starting recording...\n');
    await recorder.start(outputPath);

    // === SCENE 1: HOMEPAGE - SMART SYSTEM ===
    console.log('Scene 1: Homepage - Smart Shopping Experience');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await showTextOverlay(page, '🤖 Henderson Shop - AI-Powered Shopping', 2500);
    await wait(1000);

    // === SCENE 2: BROWSE PRODUCTS ===
    console.log('Scene 2: Browse Products');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(1500);
    await moveCursorToElement(page, 'a[href*="/products/"]:first-of-type');
    await wait(1000);

    // === SCENE 3: PRODUCT PAGE - ADD TO CART ===
    console.log('Scene 3: Add to Cart');
    const firstProductUrl = await page.evaluate(() => {
      const productLink = document.querySelector('a[href*="/products/"]');
      return productLink ? productLink.href : null;
    });

    if (firstProductUrl) {
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(2000);
      await moveCursorToElement(page, 'button[name="add"]');
      await wait(1000);

      // Simulate Add to Cart
      await showTextOverlay(page, '🛒 Product Added to Cart', 2000);
      await page.evaluate(() => {
        const addBtn = document.querySelector('button[name="add"], .product-form__submit');
        if (addBtn) addBtn.click();
      });
      await wait(3000);

      // === SCENE 4: CART ABANDONMENT ===
      console.log('Scene 4: Cart Abandonment → Automation Trigger');
      await showTextOverlay(page, '⏱️ Cart Abandoned - Automation Triggered', 2500);
      await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(2000);

      // === SCENE 5: EMAIL AUTOMATION SIMULATION ===
      console.log('Scene 5: Email Recovery Automation');
      await page.evaluate(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px;
          background: linear-gradient(135deg, #FF3131 0%, #cc2828 100%);
          color: white; padding: 20px 30px; border-radius: 12px;
          box-shadow: 0 10px 30px rgba(255, 49, 49, 0.3);
          z-index: 10000; font-family: 'Archivo', Arial, sans-serif;
          font-size: 16px; font-weight: 600;
          animation: slideIn 0.5s ease-out;
        `;
        notification.innerHTML = `
          📧 Automated Email Sent!<br>
          <span style="font-size: 14px; font-weight: 400;">Complete your order - 10% OFF code: CART10</span>
        `;
        document.body.appendChild(notification);
      });
      await showTextOverlay(page, '📧 Smart Recovery: Email Sent Automatically', 3000);
      await wait(2000);

      // === SCENE 6: RETURN TO CART ===
      console.log('Scene 6: Customer Returns via Email');
      await showTextOverlay(page, '✅ Customer Returns from Email Link', 2500);
      await page.goto(`${SITE_URL}/cart`, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(2000);
      await moveCursorToElement(page, 'button[name="checkout"], .cart__checkout');
      await wait(1500);

      // === SCENE 7: VIP PROGRAM SHOWCASE ===
      console.log('Scene 7: VIP Program Benefits');
      await page.evaluate(() => {
        const vipNotice = document.createElement('div');
        vipNotice.style.cssText = `
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: #2ecc71; color: white; padding: 15px 30px;
          border-radius: 8px; font-family: 'Archivo', Arial, sans-serif;
          font-size: 14px; font-weight: 600; z-index: 10000;
        `;
        vipNotice.innerHTML = '⭐ Discount applied! Join VIP for 20% OFF future orders';
        document.body.appendChild(vipNotice);
      });
      await showTextOverlay(page, '⭐ VIP Program: Exclusive Benefits Unlocked', 3000);
      await wait(2000);
    }

    // === FINAL: SYSTEM SUMMARY ===
    await showTextOverlay(page, '🤖 Henderson Smart System - Automated Success', 3000);
    await wait(1000);

    console.log('✅ Flywheel video completed!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    await recorder.stop();
    await browser.close();
  }

  const outputPath = path.join(OUTPUT_DIR, VIDEO_FILENAME);
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log('================================================================================');
    console.log('✅ VIDEO B2 GENERATED');
    console.log('================================================================================');
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📦 Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🎯 Strategy: System-Centric (AI-First Flywheel)`);
    console.log(`💡 Use Case: Tech-forward positioning, automation showcase`);
    console.log('================================================================================\n');
    return outputPath;
  } else {
    throw new Error('Video file not created');
  }
}

async function main() {
  try {
    ensureOutputDir();
    await generatePromoVideo();
    console.log('✅ VIDEO B2 COMPLETE\n');
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main();
