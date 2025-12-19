#!/usr/bin/env node

/**
 * Generate Complete Sitemap URLs Report
 *
 * Extracts ALL URLs from all sitemaps for Google Search Console verification
 */

const https = require('https');
const fs = require('fs');

const SITEMAPS = [
  {
    name: 'products',
    url: 'https://www.hendersonshop.com/sitemap_products_1.xml?from=8667563917364&to=8691770523700'
  },
  {
    name: 'pages',
    url: 'https://www.hendersonshop.com/sitemap_pages_1.xml?from=115684016180&to=116644905012'
  },
  {
    name: 'collections',
    url: 'https://www.hendersonshop.com/sitemap_collections_1.xml?from=296014315572&to=309438545972'
  },
  {
    name: 'blogs',
    url: 'https://www.hendersonshop.com/sitemap_blogs_1.xml'
  }
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractUrls(xml) {
  const regex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

async function generateReport() {
  console.log('======================================================================');
  console.log('GOOGLE SEARCH CONSOLE - COMPLETE SITEMAP URLS REPORT');
  console.log('======================================================================\n');

  const allUrls = {};
  const stats = {};

  for (const sitemap of SITEMAPS) {
    console.log(`📥 Fetching ${sitemap.name} sitemap...`);

    const xml = await fetchUrl(sitemap.url);
    const urls = extractUrls(xml);

    allUrls[sitemap.name] = urls;
    stats[sitemap.name] = urls.length;

    console.log(`   ✅ ${urls.length} URLs extracted\n`);

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Calculate total
  const totalUrls = Object.values(stats).reduce((sum, count) => sum + count, 0);

  console.log('======================================================================');
  console.log('📊 SITEMAP STATISTICS');
  console.log('======================================================================\n');

  Object.entries(stats).forEach(([type, count]) => {
    const percentage = ((count / totalUrls) * 100).toFixed(1);
    console.log(`  ${type.padEnd(15)}: ${count.toString().padStart(3)} URLs (${percentage.padStart(5)}%)`);
  });

  console.log(`  ${'TOTAL'.padEnd(15)}: ${totalUrls.toString().padStart(3)} URLs\n`);

  // Generate detailed breakdown
  console.log('======================================================================');
  console.log('📋 URLS BY TYPE');
  console.log('======================================================================\n');

  // Pages (show all - small number)
  console.log(`PAGES (${allUrls.pages.length} URLs):`);
  console.log('─'.repeat(70));
  allUrls.pages.forEach((url, i) => {
    const path = url.replace('https://www.hendersonshop.com', '');
    console.log(`${(i + 1).toString().padStart(2)}. ${path}`);
  });

  // Blogs (show all)
  console.log(`\nBLOGS (${allUrls.blogs.length} URLs):`);
  console.log('─'.repeat(70));
  allUrls.blogs.forEach((url, i) => {
    const path = url.replace('https://www.hendersonshop.com', '');
    console.log(`${(i + 1).toString().padStart(2)}. ${path}`);
  });

  // Collections (show sample)
  console.log(`\nCOLLECTIONS (${allUrls.collections.length} URLs):`);
  console.log('─'.repeat(70));
  console.log('Sample of first 10:');
  allUrls.collections.slice(0, 10).forEach((url, i) => {
    const path = url.replace('https://www.hendersonshop.com', '');
    console.log(`${(i + 1).toString().padStart(2)}. ${path}`);
  });
  if (allUrls.collections.length > 10) {
    console.log(`   ... and ${allUrls.collections.length - 10} more collections`);
  }

  // Products (show sample)
  console.log(`\nPRODUCTS (${allUrls.products.length} URLs):`);
  console.log('─'.repeat(70));
  console.log('Sample of first 10:');
  allUrls.products.slice(0, 10).forEach((url, i) => {
    const path = url.replace('https://www.hendersonshop.com', '');
    console.log(`${(i + 1).toString().padStart(2)}. ${path}`);
  });
  if (allUrls.products.length > 10) {
    console.log(`   ... and ${allUrls.products.length - 10} more products`);
  }

  // Save complete report
  const report = {
    generated_at: new Date().toISOString(),
    sitemap_index: 'https://www.hendersonshop.com/sitemap.xml',
    total_urls: totalUrls,
    breakdown: stats,
    urls: allUrls
  };

  const jsonFile = 'GOOGLE_SEARCH_CONSOLE_ALL_URLS.json';
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));

  // Save flat list for easy comparison
  const flatList = Object.entries(allUrls).flatMap(([type, urls]) =>
    urls.map(url => ({ type, url }))
  );

  const csvFile = 'GOOGLE_SEARCH_CONSOLE_ALL_URLS.csv';
  const csvContent = 'Type,URL\n' + flatList.map(item => `${item.type},${item.url}`).join('\n');
  fs.writeFileSync(csvFile, csvContent);

  console.log('\n======================================================================');
  console.log('✅ REPORT GENERATED');
  console.log('======================================================================\n');

  console.log(`💾 JSON report saved: ${jsonFile}`);
  console.log(`💾 CSV report saved: ${csvFile}\n`);

  console.log('NEXT STEPS TO VERIFY GOOGLE SEARCH CONSOLE:');
  console.log('─'.repeat(70));
  console.log('1. Open: https://search.google.com/search-console');
  console.log('2. Select property: www.hendersonshop.com');
  console.log('3. Go to: Indexing → Sitemaps');
  console.log('4. Verify main sitemap is submitted:');
  console.log('   https://www.hendersonshop.com/sitemap.xml\n');
  console.log('5. Go to: Indexing → Pages');
  console.log('6. Check "Why pages aren\'t indexed" section');
  console.log(`7. Compare indexed count vs expected: ${totalUrls} URLs\n`);
  console.log('8. Export indexed URLs from GSC and compare with:');
  console.log(`   ${csvFile}\n`);

  console.log('FACTUAL RESULTS:');
  console.log('─'.repeat(70));
  console.log(`✅ Total URLs in sitemaps: ${totalUrls}`);
  console.log(`✅ Products: ${stats.products}`);
  console.log(`✅ Pages: ${stats.pages}`);
  console.log(`✅ Collections: ${stats.collections}`);
  console.log(`✅ Blogs: ${stats.blogs}`);
  console.log(`✅ All URLs extracted and saved\n`);
  console.log('❌ GSC indexing status: Requires manual verification');
  console.log('   (No Google Search Console API credentials available)\n');
}

generateReport().catch(error => {
  console.error('❌ ERROR:', error.message);
  process.exit(1);
});
