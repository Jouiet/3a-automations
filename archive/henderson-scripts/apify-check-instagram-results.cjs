const https = require('https');
const fs = require('fs');

const APIFY_TOKEN = 'apify_api_CjGBvorJEO5VIu5MEqTMkhepvLpQxY1c0Rx0';

// Get dataset ID from command line or run file
const datasetId = process.argv[2] || (() => {
  try {
    const runData = JSON.parse(
      fs.readFileSync('/Users/mac/Desktop/henderson-shopify/apify-instagram-run.json', 'utf8')
    );
    return runData.datasetId;
  } catch (e) {
    console.error('❌ No dataset ID provided and no run file found');
    console.error('Usage: node apify-check-instagram-results.cjs [DATASET_ID]');
    process.exit(1);
  }
})();

console.log('=== CHECKING INSTAGRAM SCRAPER RESULTS ===');
console.log('Dataset ID:', datasetId);
console.log('');

// Fetch dataset items
const options = {
  hostname: 'api.apify.com',
  path: `/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const items = JSON.parse(data);

      console.log('✅ Results fetched successfully');
      console.log('Total leads:', items.length);
      console.log('');

      if (items.length === 0) {
        console.log('⚠️  No results yet. Scraper may still be running.');
        console.log('Wait 2-3 more minutes and try again.');
        return;
      }

      // Analyze leads
      const qualified = items.filter(lead => {
        const bio = (lead.biography || '').toLowerCase();
        const hasKeyword = ['rider', 'motorcycle', 'bike', 'commute', 'gear', 'moto']
          .some(kw => bio.includes(kw));
        const hasFollowers = (lead.followersCount || 0) >= 100;
        return hasKeyword && hasFollowers;
      });

      console.log('=== LEAD QUALITY ANALYSIS ===');
      console.log('Total scraped:', items.length);
      console.log('Qualified leads:', qualified.length, `(${Math.round(qualified.length/items.length*100)}%)`);
      console.log('');

      // Breakdown by persona
      const personas = {
        'Daily Commuter': 0,
        'Beginner Rider': 0,
        'Sport Rider': 0,
        'Other': 0
      };

      qualified.forEach(lead => {
        const bio = (lead.biography || '').toLowerCase();
        if (['commute', 'daily', 'work', 'traffic'].some(kw => bio.includes(kw))) {
          personas['Daily Commuter']++;
        } else if (['new rider', 'beginner', 'learning', 'first bike'].some(kw => bio.includes(kw))) {
          personas['Beginner Rider']++;
        } else if (['sport', 'track', 'racing', 'fast'].some(kw => bio.includes(kw))) {
          personas['Sport Rider']++;
        } else {
          personas['Other']++;
        }
      });

      console.log('=== PERSONA BREAKDOWN ===');
      Object.entries(personas).forEach(([persona, count]) => {
        console.log(`${persona}:`, count, `(${Math.round(count/qualified.length*100)}%)`);
      });
      console.log('');

      // Show sample leads
      console.log('=== SAMPLE LEADS (Top 5 Qualified) ===');
      qualified.slice(0, 5).forEach((lead, i) => {
        console.log(`\n${i + 1}. @${lead.username}`);
        console.log('   Name:', lead.fullName || 'N/A');
        console.log('   Followers:', lead.followersCount || 0);
        console.log('   Bio:', (lead.biography || '').substring(0, 100) + '...');
      });

      console.log('');
      console.log('=== COST ANALYSIS ===');
      const cost = items.length * 0.01;
      console.log('Leads scraped:', items.length);
      console.log('Cost per lead: $0.01');
      console.log('Total cost: $' + cost.toFixed(2));
      console.log('');

      console.log('=== NEXT STEPS ===');
      console.log('1. ✅ Instagram scraper works (qualified leads:', qualified.length + ')');
      console.log('2. ⏳ Deploy Google Apps Script webhook');
      console.log('3. ⏳ Configure Apify webhook to trigger on run completion');
      console.log('4. ⏳ Test end-to-end: Apify → Google Sheets → Shopify');
      console.log('');

      // Save results
      const resultsFile = '/Users/mac/Desktop/henderson-shopify/apify-instagram-test-results.json';
      fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        datasetId,
        total: items.length,
        qualified: qualified.length,
        qualificationRate: Math.round(qualified.length/items.length*100),
        personas,
        cost,
        sample: qualified.slice(0, 5)
      }, null, 2));
      console.log('✅ Results saved to:', resultsFile);

    } else {
      console.log('❌ Failed to fetch results');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e));
req.end();
