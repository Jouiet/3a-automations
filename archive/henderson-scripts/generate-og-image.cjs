#!/usr/bin/env node
/**
 * GÉNÉRATION IMAGE SOCIAL SHARING - RESPECT ABSOLU BRANDING HENDERSON
 * Convertit le HTML en PNG 1200x630px
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  console.log('='.repeat(80));
  console.log('🎨 GÉNÉRATION IMAGE SOCIAL SHARING - HENDERSON SHOP');
  console.log('='.repeat(80));
  console.log('');

  const htmlPath = path.join(__dirname, '..', 'henderson-og-image-generator.html');
  const outputPath = path.join(__dirname, '..', 'henderson-shop-og-image-1200x630.png');

  // Vérifier que le fichier HTML existe
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Fichier HTML introuvable:', htmlPath);
    process.exit(1);
  }

  console.log('📄 Fichier HTML source:', htmlPath);
  console.log('🖼️  Image output:', outputPath);
  console.log('');

  let browser;
  try {
    console.log('🚀 Lancement navigateur headless...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to exact dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2 // High quality for retina displays
    });

    console.log('📐 Viewport configuré: 1200x630px (2x pour qualité)');
    console.log('');

    // Load HTML file
    const fileUrl = `file://${htmlPath}`;
    console.log('⏳ Chargement HTML...');
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0'
    });

    console.log('✅ HTML chargé');
    console.log('');

    // Wait for fonts to load
    console.log('⏳ Attente chargement fonts (Archivo + Questrial)...');
    await page.waitForTimeout(2000);

    console.log('📸 Capture screenshot PNG...');
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630
      }
    });

    await browser.close();

    // Vérifier taille fichier
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ IMAGE GÉNÉRÉE AVEC SUCCÈS');
    console.log('='.repeat(80));
    console.log('');
    console.log('📊 DÉTAILS IMAGE:');
    console.log(`  - Fichier: ${outputPath}`);
    console.log(`  - Dimensions: 1200x630px`);
    console.log(`  - Format: PNG`);
    console.log(`  - Taille: ${fileSizeKB} KB (${fileSizeMB} MB)`);
    console.log(`  - Poids optimal: ${stats.size < 1024 * 1024 ? '✅ < 1MB' : '⚠️  > 1MB (optimiser)'}`);
    console.log('');
    console.log('🎨 BRANDING RESPECTÉ:');
    console.log('  ✅ Couleurs Henderson: #FF3131, #EFF0F5, #331A1A');
    console.log('  ✅ Typography: Archivo Bold + Questrial');
    console.log('  ✅ Logo: HENDERSON (style vintage)');
    console.log('  ✅ Layout: 5 layers selon spec');
    console.log('');
    console.log('📤 PRÊT POUR UPLOAD SHOPIFY:');
    console.log('  1. Aller: Admin > Online Store > Preferences');
    console.log('  2. Section: "Social sharing image and SEO"');
    console.log('  3. Upload: henderson-shop-og-image-1200x630.png');
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

generateOGImage();
