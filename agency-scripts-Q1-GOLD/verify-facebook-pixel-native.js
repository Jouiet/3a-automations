/**
 * VERIFY FACEBOOK PIXEL - NATIVE SHOPIFY APP
 *
 * Check if Facebook & Instagram app has Pixel configured
 * via Shopify Admin API metafields
 *
 * Date: November 4, 2025
 * Session: 63
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SHOP = process.env.SHOPIFY_STORE_DOMAIN || 'jqp1x4-7e.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-10';

if (!ACCESS_TOKEN) {
  console.error('❌ SHOPIFY_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

// Helper: Make Shopify API request
function shopifyRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}${path}`,
      method: method,
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function verifyFacebookPixel() {
  console.log('\n📊 FACEBOOK PIXEL VERIFICATION - NATIVE APP');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🏪 Store: ${SHOP}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    store: SHOP,
    facebookApp: {
      installed: false,
      pixelConfigured: false,
      pixelId: null,
      metafields: []
    },
    infinitePixelsApp: {
      installed: false,
      fbPixel: false,
      tiktokPixel: false
    },
    recommendations: []
  };

  // ============================================
  // 1. CHECK ALL METAFIELDS FOR FACEBOOK/PIXEL
  // ============================================
  console.log('1️⃣ SCANNING METAFIELDS FOR FACEBOOK PIXEL');

  try {
    const metafields = await shopifyRequest('/metafields.json?limit=250');

    if (metafields.metafields) {
      // Look for Facebook-related metafields
      const fbMetafields = metafields.metafields.filter(m =>
        m.namespace.toLowerCase().includes('facebook') ||
        m.namespace.toLowerCase().includes('fb') ||
        m.namespace.toLowerCase().includes('pixel') ||
        m.namespace.toLowerCase().includes('meta') ||
        m.key.toLowerCase().includes('pixel') ||
        m.key.toLowerCase().includes('facebook')
      );

      console.log(`  Found ${fbMetafields.length} Facebook-related metafields:\n`);

      fbMetafields.forEach(m => {
        console.log(`  📦 Namespace: ${m.namespace}`);
        console.log(`     Key: ${m.key}`);
        console.log(`     Value: ${m.value.substring(0, 100)}${m.value.length > 100 ? '...' : ''}`);
        console.log('');

        report.facebookApp.metafields.push({
          namespace: m.namespace,
          key: m.key,
          value_preview: m.value.substring(0, 200)
        });

        // Try to parse value for pixel ID
        try {
          const parsed = JSON.parse(m.value);

          // Check for pixel ID in various formats
          if (parsed.pixelId || parsed.pixel_id || parsed.fbPixel || parsed.facebook_pixel) {
            const pixelId = parsed.pixelId || parsed.pixel_id || parsed.fbPixel || parsed.facebook_pixel;
            report.facebookApp.pixelId = pixelId;
            report.facebookApp.pixelConfigured = true;
            console.log(`  ✅ PIXEL ID FOUND: ${pixelId}`);
          }
        } catch (e) {
          // Not JSON, check if it's a pixel ID directly (15-16 digits)
          if (/^\d{15,16}$/.test(m.value.trim())) {
            report.facebookApp.pixelId = m.value.trim();
            report.facebookApp.pixelConfigured = true;
            console.log(`  ✅ PIXEL ID FOUND: ${m.value.trim()}`);
          }
        }
      });

      if (fbMetafields.length > 0) {
        report.facebookApp.installed = true;
      }

      // Also check Infinite Pixels metafields
      const infiniteMetafield = metafields.metafields.find(m =>
        m.namespace.toLowerCase().includes('infinite')
      );

      if (infiniteMetafield) {
        report.infinitePixelsApp.installed = true;
        try {
          const config = JSON.parse(infiniteMetafield.value);
          report.infinitePixelsApp.fbPixel = config.fbPixel || false;
          report.infinitePixelsApp.tiktokPixel = config.tiktokPixel || false;
        } catch (e) {
          // Could not parse
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️ ERROR scanning metafields: ${error.message}`);
  }

  // ============================================
  // 2. CHECK THEME ASSETS FOR PIXEL CODE
  // ============================================
  console.log('\n2️⃣ CHECKING THEME FOR FACEBOOK PIXEL SCRIPT');

  try {
    // Get active theme
    const themes = await shopifyRequest('/themes.json');
    const activeTheme = themes.themes?.find(t => t.role === 'main');

    if (activeTheme) {
      console.log(`  Active theme: ${activeTheme.name} (ID: ${activeTheme.id})`);

      // Check theme.liquid for pixel code
      const themeLiquid = await shopifyRequest(`/themes/${activeTheme.id}/assets.json?asset[key]=layout/theme.liquid`);

      if (themeLiquid.asset && themeLiquid.asset.value) {
        const content = themeLiquid.asset.value;

        // Search for Facebook Pixel patterns
        const fbPixelPatterns = [
          /fbq\s*\(/,  // fbq() function
          /facebook\.com\/tr/,  // Facebook pixel endpoint
          /connect\.facebook\.net\/.*\/fbevents\.js/,  // Facebook events script
          /_fbp/,  // Facebook pixel cookie
          /Facebook Pixel/i  // Literal text
        ];

        let pixelFoundInTheme = false;
        fbPixelPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            pixelFoundInTheme = true;
          }
        });

        if (pixelFoundInTheme) {
          console.log(`  ✅ Facebook Pixel code FOUND in theme.liquid`);
          report.facebookApp.pixelConfigured = true;

          // Try to extract pixel ID from code
          const pixelIdMatch = content.match(/fbq\s*\(\s*['"]init['"],\s*['"](\d{15,16})['"]/);
          if (pixelIdMatch) {
            report.facebookApp.pixelId = pixelIdMatch[1];
            console.log(`  ✅ Pixel ID extracted from code: ${pixelIdMatch[1]}`);
          }
        } else {
          console.log(`  ❌ Facebook Pixel code NOT FOUND in theme.liquid`);
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️ ERROR checking theme: ${error.message}`);
  }

  // ============================================
  // 3. SUMMARY & RECOMMENDATIONS
  // ============================================
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(60));

  console.log(`\n📱 NATIVE FACEBOOK & INSTAGRAM APP:`);
  console.log(`   Installed: ${report.facebookApp.installed ? '✅ YES' : '❌ NO (not detected via metafields)'}`);
  console.log(`   Pixel Configured: ${report.facebookApp.pixelConfigured ? '✅ YES' : '❌ NO'}`);
  if (report.facebookApp.pixelId) {
    console.log(`   Pixel ID: ${report.facebookApp.pixelId}`);
  }

  console.log(`\n📊 INFINITE PIXELS APP:`);
  console.log(`   Installed: ${report.infinitePixelsApp.installed ? '✅ YES' : '❌ NO'}`);
  console.log(`   FB Pixel: ${report.infinitePixelsApp.fbPixel ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   TikTok Pixel: ${report.infinitePixelsApp.tiktokPixel ? '✅ Configured' : '❌ Not configured'}`);

  // Recommendations
  if (!report.facebookApp.pixelConfigured && !report.infinitePixelsApp.fbPixel) {
    report.recommendations.push({
      priority: 'CRITICAL',
      task: 'Configure Facebook Pixel',
      options: [
        '1. Use native Facebook & Instagram app (Settings → Facebook Pixel)',
        '2. Use Infinite Pixels app (Apps → Infinite Pixels → Add Pixel)',
        '3. Manual installation in theme.liquid'
      ],
      blocker: 'Cannot run Facebook ads or track conversions without Pixel'
    });
  }

  if (report.facebookApp.pixelConfigured && report.infinitePixelsApp.installed) {
    report.recommendations.push({
      priority: 'MEDIUM',
      task: 'Choose primary Pixel app',
      note: 'Both Facebook native app and Infinite Pixels detected. Using both may cause duplicate tracking.',
      recommendation: 'Use native Facebook & Instagram app (better integration, official)'
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\n⚠️ RECOMMENDATIONS');
    console.log('─'.repeat(60));

    report.recommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority}] ${rec.task}`);
      if (rec.options) {
        console.log(`   Options:`);
        rec.options.forEach(opt => console.log(`   ${opt}`));
      }
      if (rec.note) console.log(`   Note: ${rec.note}`);
      if (rec.recommendation) console.log(`   Recommendation: ${rec.recommendation}`);
      if (rec.blocker) console.log(`   ⚠️ ${rec.blocker}`);
    });
  }

  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    './facebook-pixel-verification.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Report saved: facebook-pixel-verification.json\n');

  return report;
}

// Run verification
verifyFacebookPixel().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
