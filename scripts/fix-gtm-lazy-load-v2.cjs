#!/usr/bin/env node
/**
 * FIX GTM LAZY LOADING v2
 * Version plus robuste avec remplacement par sections
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

// New GTM lazy loading code
const NEW_GTM_CODE = `<!-- Google Tag Manager + GA4 - Lazy Loaded for Performance -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    // Lazy load GTM + GA4 after user interaction or 3s delay
    (function() {
      var loaded = false;
      function loadAnalytics() {
        if (loaded) return;
        loaded = true;

        // Load GTM
        var gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WLVJQC3M';
        document.head.appendChild(gtmScript);
        window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});

        // Load GA4
        var ga4Script = document.createElement('script');
        ga4Script.async = true;
        ga4Script.src = 'https://www.googletagmanager.com/gtag/js?id=G-87F6FDJG45';
        ga4Script.onload = function() {
          gtag('js', new Date());
          gtag('config', 'G-87F6FDJG45', {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
          });
        };
        document.head.appendChild(ga4Script);
      }

      // Load on user interaction (scroll, click, touch) or after 3s
      ['scroll', 'click', 'touchstart', 'keydown'].forEach(function(evt) {
        window.addEventListener(evt, loadAnalytics, {once: true, passive: true});
      });
      setTimeout(loadAnalytics, 3000);
    })();
  </script>`;

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('=== FIX GTM LAZY LOADING v2 ===\n');

const htmlFiles = findHtmlFiles(SITE_DIR);
let fixed = 0;
let alreadyFixed = 0;
let noGtm = 0;
let errors = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(SITE_DIR, file);

  // Already lazy loaded
  if (content.includes('Lazy Loaded for Performance')) {
    console.log(`✅ ${relativePath} - already done`);
    alreadyFixed++;
    continue;
  }

  // No GTM
  if (!content.includes('googletagmanager.com/gtm.js')) {
    console.log(`⬜ ${relativePath} - no GTM`);
    noGtm++;
    continue;
  }

  try {
    // Find and remove GTM block
    const gtmStart = content.indexOf('<!-- Google Tag Manager -->');
    const gtmScriptEnd = content.indexOf('</script>', gtmStart) + '</script>'.length;

    // Find and remove GA4 block (look for it after GTM)
    const ga4Start = content.indexOf('<!-- Google Analytics 4 -->', gtmScriptEnd);
    let ga4End;

    if (ga4Start !== -1) {
      // Find the closing </script> of the config block
      const ga4ScriptStart = content.indexOf('<script>', ga4Start);
      const configScriptStart = content.indexOf('<script>', ga4ScriptStart + 1);
      ga4End = content.indexOf('</script>', configScriptStart) + '</script>'.length;
    } else {
      // GA4 not found separately, just remove GTM
      ga4End = gtmScriptEnd;
    }

    // Also check for End Google Tag Manager comment
    const endComment = content.indexOf('<!-- End Google Tag Manager -->', gtmStart);
    if (endComment !== -1 && endComment < ga4Start) {
      // Update gtmScriptEnd to include the comment
    }

    // Extract what's before and after the GTM/GA4 blocks
    const before = content.substring(0, gtmStart);
    const after = content.substring(ga4End);

    // Rebuild content
    content = before + NEW_GTM_CODE + after;

    // Clean up any double newlines
    content = content.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(file, content);
    console.log(`🔧 ${relativePath} - FIXED`);
    fixed++;
  } catch (e) {
    console.log(`❌ ${relativePath} - ERROR: ${e.message}`);
    errors++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Fixed: ${fixed}`);
console.log(`Already done: ${alreadyFixed}`);
console.log(`No GTM: ${noGtm}`);
console.log(`Errors: ${errors}`);
console.log(`Total: ${htmlFiles.length}`);

if (errors > 0) {
  process.exit(1);
}
