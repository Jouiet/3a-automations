const https = require('https');

const SHOPIFY_STORE = 'jqp1x4-7e.myshopify.com';
const ACCESS_TOKEN = '[SHOPIFY_TOKEN_REDACTED]';
const ONLINE_STORE_PUBLICATION_ID = 140777816116;

const BUNDLES_TO_PUBLISH = [
  { id: 8691764682804, title: 'Adventure Tourer Kit' },
  { id: 8691770523700, title: 'All-Season Versatile Rider Package' },
  { id: 8691722412084, title: 'Budget Entry Rider Bundle' },
  { id: 8691756588084, title: 'Classic Tourer Package' },
  { id: 8691759865908, title: 'Commuter Essentials' },
  { id: 8691748757556, title: 'Daily Commuter Essential Kit' },
  { id: 8691753443380, title: 'Off-Road Adventure Kit' },
  { id: 8691750461492, title: 'Premium Luxury Touring Collection' },
  { id: 8691761700916, title: 'Sport Rider Kit' },
  { id: 8691755179060, title: 'Sport Rider Pro Kit' },
  { id: 8691754033204, title: 'Urban Professional Commuter Kit' },
  { id: 8691757801524, title: 'Vintage Rider Collection' },
  { id: 8691750625332, title: 'Weekend Cruiser Pack' },
  { id: 8691751903284, title: 'Women Riders Essential Package' }
];

function publishProduct(productId, title) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      product_id: productId
    });

    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/2025-10/publications/${ONLINE_STORE_PUBLICATION_ID}/products/${productId}.json`,
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, title, status: res.statusCode });
        } else {
          resolve({ success: false, title, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

async function publishAllBundles() {
  console.log('=== PUBLISHING BUNDLES TO ONLINE STORE ===');
  console.log('Total bundles:', BUNDLES_TO_PUBLISH.length);
  console.log('Publication ID:', ONLINE_STORE_PUBLICATION_ID);
  console.log('');

  const results = [];
  
  for (const bundle of BUNDLES_TO_PUBLISH) {
    const result = await publishProduct(bundle.id, bundle.title);
    results.push(result);
    
    if (result.success) {
      console.log('✅', result.title, '- Published (HTTP', result.status + ')');
    } else {
      console.log('❌', result.title, '- FAILED (HTTP', result.status + ')');
      console.log('   Error:', result.error);
    }
    
    // Rate limit: wait 0.5s between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Success:', results.filter(r => r.success).length);
  console.log('Failed:', results.filter(r => !r.success).length);
}

publishAllBundles().catch(console.error);
