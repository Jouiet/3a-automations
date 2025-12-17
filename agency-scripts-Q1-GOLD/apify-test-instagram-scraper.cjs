const https = require('https');

const APIFY_TOKEN = 'apify_api_CjGBvorJEO5VIu5MEqTMkhepvLpQxY1c0Rx0';

// Instagram Hashtag Scraper Actor (1.6M+ runs)
const ACTOR_ID = 'reGe1ST3OBgYZSsZJ';

// Test configuration - 30 leads from motorcycle hashtags
const INPUT = {
  hashtags: [
    'motorcyclegear',
    'motorcyclesafety',
    'dailyrider'
  ],
  resultsLimit: 30, // 10 per hashtag
  searchType: 'hashtag',
  searchLimit: 30,
  addParentData: false,
  extendOutputFunction: '',
  extendScraperFunction: '',
  customData: {},
  proxy: {
    useApifyProxy: true,
    apifyProxyGroups: ['RESIDENTIAL']
  }
};

console.log('=== APIFY INSTAGRAM SCRAPER TEST ===');
console.log('Actor:', ACTOR_ID);
console.log('Target hashtags:', INPUT.hashtags.join(', '));
console.log('Results limit:', INPUT.resultsLimit, 'leads');
console.log('Expected cost: ~$0.30 (30 leads × $0.01)');
console.log('');

// Step 1: Start actor run
const runPayload = JSON.stringify(INPUT);

const runOptions = {
  hostname: 'api.apify.com',
  path: `/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(runPayload)
  }
};

console.log('Starting Instagram scraper run...');

const runReq = https.request(runOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 201) {
      const response = JSON.parse(data);
      const runId = response.data.id;
      const datasetId = response.data.defaultDatasetId;

      console.log('✅ Run started successfully');
      console.log('Run ID:', runId);
      console.log('Dataset ID:', datasetId);
      console.log('Status:', response.data.status);
      console.log('');
      console.log('⏳ Scraper is running... This will take 2-5 minutes.');
      console.log('');
      console.log('Monitor progress:');
      console.log(`https://console.apify.com/actors/${ACTOR_ID}/runs/${runId}`);
      console.log('');
      console.log('--- WAIT 3-5 MINUTES, THEN RUN: ---');
      console.log(`node scripts/apify-check-instagram-results.cjs ${datasetId}`);
      console.log('');

      // Save run details for checking results later
      const fs = require('fs');
      fs.writeFileSync(
        '/Users/mac/Desktop/henderson-shopify/apify-instagram-run.json',
        JSON.stringify({
          runId,
          datasetId,
          startedAt: new Date().toISOString(),
          status: 'RUNNING',
          input: INPUT
        }, null, 2)
      );
      console.log('✅ Run details saved to: apify-instagram-run.json');

    } else {
      console.log('❌ Failed to start run');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

runReq.on('error', (e) => console.error('Error:', e));
runReq.write(runPayload);
runReq.end();
