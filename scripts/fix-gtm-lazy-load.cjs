#!/usr/bin/env node
/**
 * FIX GTM LAZY LOADING
 * Remplace le chargement synchrone GTM/GA4 par lazy loading
 * Date: 2025-12-20
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

// Old GTM pattern (synchrone)
const OLD_GTM_PATTERN = /<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':\s*new Date\(\)\.getTime\(\),event:'gtm\.js'\}\);var f=d\.getElementsByTagName\(s\)\[0\],\s*j=d\.createElement\(s\),dl=l!='dataLayer'\?'&l='\+l:'';j\.async=true;j\.src=\s*'https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl;f\.parentNode\.insertBefore\(j,f\);\s*\}\)\(window,document,'script','dataLayer','GTM-WLVJQC3M'\);<\/script>\s*<!-- End Google Tag Manager -->\s*<!-- Google Analytics 4 -->\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-87F6FDJG45"><\/script>\s*<script>\s*window\.dataLayer = window\.dataLayer \|\| \[\];\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*gtag\('js', new Date\(\)\);\s*gtag\('config', 'G-87F6FDJG45', \{\s*'anonymize_ip': true,\s*'cookie_flags': 'SameSite=None;Secure'\s*\}\);\s*<\/script>/gs;

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

// Find all HTML files
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

// Main
console.log('=== FIX GTM LAZY LOADING ===\n');

const htmlFiles = findHtmlFiles(SITE_DIR);
let fixed = 0;
let alreadyFixed = 0;
let noGtm = 0;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(SITE_DIR, file);

  // Check if already has lazy loading
  if (content.includes('Lazy Loaded for Performance')) {
    console.log(`✅ ${relativePath} - already lazy loaded`);
    alreadyFixed++;
    continue;
  }

  // Check if has old GTM pattern
  if (!content.includes('googletagmanager.com/gtm.js')) {
    console.log(`⬜ ${relativePath} - no GTM`);
    noGtm++;
    continue;
  }

  // Replace old with new
  const newContent = content.replace(OLD_GTM_PATTERN, NEW_GTM_CODE);

  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`🔧 ${relativePath} - FIXED`);
    fixed++;
  } else {
    // Pattern didn't match exactly, try simpler approach
    console.log(`⚠️  ${relativePath} - pattern mismatch, needs manual review`);
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Fixed: ${fixed}`);
console.log(`Already lazy: ${alreadyFixed}`);
console.log(`No GTM: ${noGtm}`);
console.log(`Total: ${htmlFiles.length}`);

process.exit(fixed > 0 || alreadyFixed > 0 ? 0 : 1);
