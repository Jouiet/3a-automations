// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * MYDEALZ MARKETING VIDEO C - CATEGORY BREADTH
 * Strategy: Multi-Product Discovery (Diversity, Navigation, AI-Curated Selection)
 * Angle: "203+ Premium Products Across 11 Categories"
 * Target Persona: Explorers, gift shoppers, multi-category buyers
 * Duration: ~45 seconds
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://mydealz.shop';
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');
const VIDEO_FILENAME = 'mydealz-C-category-breadth.mp4';
const BRAND_NAVY = '#040462';
const BRAND_GOLD = '#D4AF37';

console.log('MYDEALZ VIDEO C - CATEGORY BREADTH\n');

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
      styleElement.innerHTML = `.mouse-helper { pointer-events: none; position: absolute; z-index: 100000; top: 0; left: 0; width: 60px; height: 60px; background: rgba(212, 175, 55, 0.3); border: 5px solid #D4AF37; border-radius: 50%; margin-left: -30px; margin-top: -30px; transition: all 0.15s ease; box-shadow: 0 0 30px rgba(212, 175, 55, 0.6); }`;
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
    overlay.style.cssText = `position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: rgba(4, 4, 98, 0.9); color: white; padding: 20px 40px; font-size: 28px; font-weight: 600; border-radius: 12px; z-index: 99999; font-family: 'Poppins', Arial, sans-serif; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); border: 2px solid #D4AF37;`;
    document.body.appendChild(overlay);
  }, text);
  await wait(duration);
  await page.evaluate(() => { const overlay = document.querySelector('.scene-overlay'); if (overlay) overlay.remove(); });
  await wait(300);
}

async function highlightElement(page, selector, duration = 2000) {
  const highlighted = await page.evaluate((sel, goldColor) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    element.style.outline = `5px solid ${goldColor}`;
    element.style.outlineOffset = '8px';
    element.style.boxShadow = `0 0 40px rgba(212, 175, 55, 0.6)`;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }, selector, BRAND_GOLD);
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
    await page.mouse.move(elementCoords.x, elementCoords.y, { steps: 60 });
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

    console.log('Scene 1: Homepage - Category Diversity');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await showTextOverlay(page, '🏪 203+ Premium Products Across 11 Categories', 2500);
    await wait(1000);

    console.log('Scene 2: Navigation Menu - Show Categories');
    await moveCursorToElement(page, 'nav a[href*="/collections/"]:first-of-type');
    await wait(1000);
    await showTextOverlay(page, '📂 Fashion • Bags • Tech • Office • Home & More', 2500);
    await wait(1500);

    console.log('Scene 3: Electronics Category');
    await page.evaluate(() => window.scrollBy(0, 800));
    await wait(1500);
    await showTextOverlay(page, '🎧 Electronics: Headphones, Webcams, Gaming Gear', 2500);
    await wait(1500);

    // Highlight electronics products
    await moveCursorToElement(page, 'a[href*="/products/"]:first-of-type');
    await wait(1000);
    await highlightElement(page, 'a[href*="/products/"]:first-of-type', 2000);

    console.log('Scene 4: Fashion Category');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(1500);
    await showTextOverlay(page, '👔 Fashion: Fur Coats, Jackets, Premium Apparel', 2500);
    await wait(1500);
    await moveCursorToElement(page, 'a[href*="/products/"]:nth-of-type(3)');
    await wait(1000);
    await highlightElement(page, 'a[href*="/products/"]:nth-of-type(3)', 2000);

    console.log('Scene 5: Office & Bags Category');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(1500);
    await showTextOverlay(page, '💼 Office: Briefcases, Desk Stands, Laminators', 2500);
    await wait(1500);
    await moveCursorToElement(page, 'a[href*="/products/"]:nth-of-type(5)');
    await wait(1000);
    await highlightElement(page, 'a[href*="/products/"]:nth-of-type(5)', 2000);

    console.log('Scene 6: VIP Program Benefits');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => window.scrollBy(0, 1400));
    await wait(1500);

    // Show VIP notice
    await page.evaluate(() => {
      const vipNotice = document.createElement('div');
      vipNotice.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #D4AF37; color: #040462; padding: 15px 30px;
        border-radius: 8px; font-family: 'Poppins', Arial, sans-serif;
        font-size: 14px; font-weight: 600; z-index: 10000;
        box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
      `;
      vipNotice.innerHTML = '⭐ Join VIP: 10-20% OFF + Exclusive Access';
      document.body.appendChild(vipNotice);
    });
    await showTextOverlay(page, '⭐ VIP Program: Bronze, Silver, Gold Tiers', 2500);
    await wait(2000);

    console.log('Scene 7: Final CTA');
    await showTextOverlay(page, '✨ Discover Your Perfect Deal - Browse 203+ Products', 3000);
    await wait(1000);

    console.log('✅ Video C completed!\n');

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
    console.log(`✅ VIDEO C GENERATED (${(stats.size / (1024 * 1024)).toFixed(2)} MB)\n`);
    return outputPath;
  } else {
    throw new Error('Video file not created');
  }
}

async function main() {
  try {
    ensureOutputDir();
    await generatePromoVideo();
    console.log('✅ VIDEO C COMPLETE\n');
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main();
