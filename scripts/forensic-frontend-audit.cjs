#!/usr/bin/env node
/**
 * Forensic Frontend Audit - Complete Analysis
 * SEO/AEO, Copy, Schema, Meta, Value Prop, Conversion
 * @version 1.0.0
 * @date 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const EXPECTED_AUTOMATIONS = 77;

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: []
};

function addIssue(severity, category, file, message, fix) {
  issues[severity].push({ category, file, message, fix });
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('🔍 FORENSIC FRONTEND AUDIT\n');
console.log('=' .repeat(70) + '\n');

// ========== 1. AUTOMATION COUNT CONSISTENCY ==========
console.log('📊 1. AUTOMATION COUNT CONSISTENCY\n');

const htmlFiles = findHtmlFiles(SITE_DIR);
const countPatterns = [/(\d+)\s*automation/gi, /(\d+)\s*workflow/gi, /(\d+)\s*scripts/gi];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  for (const pattern of countPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const count = parseInt(match[1]);
      if (count > 50 && count < 100 && count !== EXPECTED_AUTOMATIONS) {
        addIssue('high', 'Count Mismatch', relPath,
          `Found "${match[0]}" but expected ${EXPECTED_AUTOMATIONS}`,
          `Replace ${count} with ${EXPECTED_AUTOMATIONS}`);
      }
    }
  }
}

// Check llms.txt
const llmsTxt = fs.readFileSync(path.join(SITE_DIR, 'llms.txt'), 'utf8');
const llmsMatch = llmsTxt.match(/(\d+)\s*automatisation/i);
if (llmsMatch && parseInt(llmsMatch[1]) !== EXPECTED_AUTOMATIONS) {
  addIssue('high', 'AEO', 'llms.txt',
    `llms.txt says "${llmsMatch[0]}" but should be ${EXPECTED_AUTOMATIONS}`,
    `Update llms.txt with correct count`);
}

// ========== 2. META DESCRIPTIONS ==========
console.log('📝 2. META DESCRIPTIONS\n');

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  const metaMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (!metaMatch) {
    addIssue('critical', 'SEO', relPath, 'Missing meta description', 'Add meta description');
  } else {
    const desc = metaMatch[1];
    if (desc.length < 120) {
      addIssue('medium', 'SEO', relPath, `Meta description too short: ${desc.length} chars (min 120)`, 'Expand description');
    } else if (desc.length > 160) {
      addIssue('low', 'SEO', relPath, `Meta description too long: ${desc.length} chars (max 160)`, 'Shorten description');
    }
  }
}

// ========== 3. SCHEMA.ORG ==========
console.log('🏷️ 3. SCHEMA.ORG MARKUP\n');

const schemaTypes = ['Organization', 'LocalBusiness', 'Service', 'FAQPage', 'Article', 'BreadcrumbList'];
const pagesWithSchema = [];
const pagesWithoutSchema = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  if (content.includes('application/ld+json')) {
    pagesWithSchema.push(relPath);

    // Check for FAQPage on relevant pages
    if ((relPath.includes('pricing') || relPath.includes('services') || relPath.includes('audit'))
        && !content.includes('FAQPage')) {
      addIssue('medium', 'Schema', relPath, 'Missing FAQPage schema on Q&A-relevant page', 'Add FAQPage structured data');
    }
  } else {
    pagesWithoutSchema.push(relPath);
    if (!relPath.includes('404') && !relPath.includes('legal')) {
      addIssue('high', 'Schema', relPath, 'Missing Schema.org markup', 'Add JSON-LD structured data');
    }
  }
}

// ========== 4. TITLE TAGS ==========
console.log('📌 4. TITLE TAGS\n');

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch) {
    addIssue('critical', 'SEO', relPath, 'Missing title tag', 'Add title tag');
  } else {
    const title = titleMatch[1];
    if (title.length < 30) {
      addIssue('medium', 'SEO', relPath, `Title too short: ${title.length} chars`, 'Expand title');
    } else if (title.length > 65) {
      addIssue('low', 'SEO', relPath, `Title too long: ${title.length} chars`, 'Shorten title');
    }
    if (!title.includes('3A') && !title.includes('Automation')) {
      addIssue('medium', 'Branding', relPath, 'Title missing brand name', 'Add brand to title');
    }
  }
}

// ========== 5. OG TAGS ==========
console.log('📱 5. OPEN GRAPH TAGS\n');

const ogRequired = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  for (const tag of ogRequired) {
    if (!content.includes(`property="${tag}"`)) {
      addIssue('medium', 'Social', relPath, `Missing ${tag}`, `Add ${tag} meta tag`);
    }
  }
}

// ========== 6. TWITTER CARDS ==========
console.log('🐦 6. TWITTER CARDS\n');

const twitterRequired = ['twitter:card', 'twitter:title', 'twitter:description'];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  for (const tag of twitterRequired) {
    if (!content.includes(`name="${tag}"`)) {
      addIssue('low', 'Social', relPath, `Missing ${tag}`, `Add ${tag} meta tag`);
    }
  }
}

// ========== 7. CTA ANALYSIS ==========
console.log('🎯 7. CTA (Call-to-Action) ANALYSIS\n');

const ctaPatterns = [
  /audit.gratuit|free.audit/gi,
  /contact|contactez/gi,
  /réserver|book|booking/gi,
  /demander|request|get.started/gi
];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  // Skip legal pages
  if (relPath.includes('legal') || relPath.includes('404')) continue;

  let hasCTA = false;
  for (const pattern of ctaPatterns) {
    if (pattern.test(content)) {
      hasCTA = true;
      break;
    }
  }

  if (!hasCTA) {
    addIssue('high', 'Conversion', relPath, 'No clear CTA found', 'Add call-to-action buttons');
  }
}

// ========== 8. IMAGE ALT TAGS ==========
console.log('🖼️ 8. IMAGE ALT TAGS\n');

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  const imgTags = content.match(/<img[^>]+>/gi) || [];
  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      addIssue('high', 'A11y/SEO', relPath, 'Image missing alt attribute', 'Add alt text to images');
    } else if (img.includes('alt=""') || img.includes("alt=''")) {
      // Empty alt is ok for decorative images
    }
  }
}

// ========== 9. HREFLANG ==========
console.log('🌍 9. HREFLANG TAGS\n');

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(SITE_DIR, file);

  if (!content.includes('hreflang="fr"') || !content.includes('hreflang="en"')) {
    addIssue('medium', 'i18n', relPath, 'Missing hreflang tags', 'Add fr/en hreflang links');
  }

  if (!content.includes('hreflang="x-default"')) {
    addIssue('low', 'i18n', relPath, 'Missing x-default hreflang', 'Add x-default hreflang');
  }
}

// ========== 10. VALUE PROPOSITION ==========
console.log('💎 10. VALUE PROPOSITION KEYWORDS\n');

const vpKeywords = {
  fr: ['gratuit', 'résultats', 'automatisation', 'temps', 'roi', 'croissance'],
  en: ['free', 'results', 'automation', 'time', 'roi', 'growth']
};

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8').toLowerCase();
  const relPath = path.relative(SITE_DIR, file);

  const isEnglish = relPath.startsWith('en/') || relPath.includes('/en/');
  const keywords = isEnglish ? vpKeywords.en : vpKeywords.fr;

  let vpScore = 0;
  for (const kw of keywords) {
    if (content.includes(kw)) vpScore++;
  }

  if (vpScore < 2 && !relPath.includes('legal') && !relPath.includes('404')) {
    addIssue('medium', 'Marketing', relPath, `Low value prop score: ${vpScore}/${keywords.length}`, 'Add more value proposition keywords');
  }
}

// ========== REPORT ==========
console.log('\n' + '=' .repeat(70));
console.log('📋 AUDIT REPORT\n');

const counts = {
  critical: issues.critical.length,
  high: issues.high.length,
  medium: issues.medium.length,
  low: issues.low.length,
  info: issues.info.length
};

console.log(`🔴 CRITICAL: ${counts.critical}`);
console.log(`🟠 HIGH:     ${counts.high}`);
console.log(`🟡 MEDIUM:   ${counts.medium}`);
console.log(`🟢 LOW:      ${counts.low}`);
console.log(`ℹ️  INFO:     ${counts.info}`);
console.log(`─────────────────`);
console.log(`TOTAL:       ${counts.critical + counts.high + counts.medium + counts.low}`);

if (counts.critical > 0) {
  console.log('\n🔴 CRITICAL ISSUES:');
  for (const issue of issues.critical) {
    console.log(`   [${issue.category}] ${issue.file}: ${issue.message}`);
  }
}

if (counts.high > 0) {
  console.log('\n🟠 HIGH PRIORITY ISSUES:');
  for (const issue of issues.high) {
    console.log(`   [${issue.category}] ${issue.file}: ${issue.message}`);
  }
}

if (counts.medium > 0) {
  console.log('\n🟡 MEDIUM PRIORITY ISSUES:');
  for (const issue of issues.medium.slice(0, 10)) {
    console.log(`   [${issue.category}] ${issue.file}: ${issue.message}`);
  }
  if (issues.medium.length > 10) {
    console.log(`   ... and ${issues.medium.length - 10} more`);
  }
}

// Save report
const report = {
  date: new Date().toISOString(),
  summary: counts,
  total: counts.critical + counts.high + counts.medium + counts.low,
  issues
};

fs.writeFileSync(
  path.join(__dirname, '..', 'outputs', 'frontend-forensic-audit.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Full report: outputs/frontend-forensic-audit.json');
console.log('\n' + '=' .repeat(70));

if (counts.critical === 0 && counts.high === 0) {
  console.log('✅ AUDIT PASSED (no critical or high issues)');
} else {
  console.log('❌ AUDIT FAILED - Fix critical and high issues');
  process.exit(1);
}
