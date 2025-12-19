#!/usr/bin/env node
/**
 * MARKETING VIDEO C2 - COMPLETE CUSTOMER JOURNEY
 * Strategy: HYBRID (Product Discovery + Smart Workflows)
 * Angle: End-to-end shopping experience with automation
 * Target Persona: All rider personas
 * Duration: ~50 seconds
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.hendersonshop.com';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'henderson-C2-customer-journey.mp4';
const BRAND_COLOR = '#FF3131';

console.log('MARKETING VIDEO C2 - COMPLETE CUSTOMER JOURNEY\n');

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
      styleElement.innerHTML = `.mouse-helper { pointer-events: none; position: absolute; z-index: 100000; top: 0; left: 0; width: 50px; height: 50px; background: rgba(255, 49, 49, 0.3); border: 5px solid #FF3131; border-radius: 50%; margin-left: -25px; margin-top: -25px; transition: all 0.15s ease; box-shadow: 0 0 20px rgba(255, 49, 49, 0.6); }`;
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
    await recorder.start(outputPath);

    console.log('Scene 1: Homepage - Journey Starts');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await showTextOverlay(page, '🏍️ Your Henderson Journey Starts Here', 2500);
    await wait(1000);

    console.log('Scene 2: Browse Collections');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(1500);
    await moveCursorToElement(page, 'a[href*="/collections/"]');
    await wait(1000);

    console.log('Scene 3: Product Discovery');
    await page.goto(`${SITE_URL}/collections/helmets`, { waitUntil: 'networkidle2', timeout: 30000 });
    await showTextOverlay(page, '🪖 Discover Premium Gear', 2500);
    await wait(1500);
    await highlightElement(page, 'a[href*="/products/"]:first-of-type', 2000);
    await moveCursorToElement(page, 'a[href*="/products/"]:first-of-type');
    await wait(1000);

    console.log('Scene 4: Product Details');
    const firstProductUrl = await page.evaluate(() => {
      const productLink = document.querySelector('a[href*="/products/"]');
      return productLink ? productLink.href : null;
    });

    if (firstProductUrl) {
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await showTextOverlay(page, '✨ Safety-Certified Quality', 2500);
      await wait(1500);
      await moveCursorToElement(page, '.product__media img');
      await wait(1000);
      await highlightElement(page, '.product__title, h1', 1500);
      await page.evaluate(() => window.scrollBy(0, 500));
      await wait(1500);

      console.log('Scene 5: Add to Cart');
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(1000);
      await showTextOverlay(page, '🛒 Add to Cart - Secure Checkout', 2000);
      await highlightElement(page, 'button[name="add"], .product-form__submit', 2000);

      console.log('Scene 6: Welcome Email Simulation');
      await page.evaluate(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px;
          background: linear-gradient(135deg, #FF3131 0%, #cc2828 100%);
          color: white; padding: 20px 30px; border-radius: 12px;
          box-shadow: 0 10px 30px rgba(255, 49, 49, 0.3);
          z-index: 10000; font-family: 'Archivo', Arial, sans-serif;
          font-size: 16px; font-weight: 600;
        `;
        notification.innerHTML = `
          📧 Welcome Email Sent!<br>
          <span style="font-size: 14px; font-weight: 400;">15% OFF your first order - Code: WELCOME15</span>
        `;
        document.body.appendChild(notification);
      });
      await showTextOverlay(page, '📧 Welcome Discount - Automated', 2500);
      await wait(2000);

      console.log('Scene 7: VIP Program');
      await page.evaluate(() => {
        const vipNotice = document.createElement('div');
        vipNotice.style.cssText = `
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: #2ecc71; color: white; padding: 15px 30px;
          border-radius: 8px; font-family: 'Archivo', Arial, sans-serif;
          font-size: 14px; font-weight: 600; z-index: 10000;
        `;
        vipNotice.innerHTML = '⭐ Join VIP: 20% OFF + Exclusive Access';
        document.body.appendChild(vipNotice);
      });
      await showTextOverlay(page, '⭐ VIP Program: Exclusive Member Benefits', 2500);
      await wait(2000);
    }

    await showTextOverlay(page, '✨ Start Your Henderson Journey Today', 3000);
    await wait(1000);

    console.log('✅ Customer journey video completed!\n');

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
    console.log(`✅ VIDEO C2 GENERATED (${(stats.size / (1024 * 1024)).toFixed(2)} MB)\n`);
    return outputPath;
  } else {
    throw new Error('Video file not created');
  }
}

async function main() {
  try {
    ensureOutputDir();
    await generatePromoVideo();
    console.log('✅ VIDEO C2 COMPLETE\n');
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main();
