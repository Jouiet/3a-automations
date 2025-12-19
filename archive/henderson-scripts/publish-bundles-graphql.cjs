const https = require('https');

const SHOPIFY_STORE = 'jqp1x4-7e.myshopify.com';
const ACCESS_TOKEN = '[SHOPIFY_TOKEN_REDACTED]';
const ONLINE_STORE_PUBLICATION_ID = '140777816116';

const BUNDLES = [
  8691764682804, 8691770523700, 8691722412084, 8691756588084,
  8691759865908, 8691748757556, 8691753443380, 8691750461492,
  8691761700916, 8691755179060, 8691754033204, 8691757801524,
  8691750625332, 8691751903284
];

function publishProductGraphQL(productId) {
  return new Promise((resolve, reject) => {
    const gqlProductId = `gid://shopify/Product/${productId}`;
    const gqlPublicationId = `gid://shopify/Publication/${ONLINE_STORE_PUBLICATION_ID}`;
    
    const query = {
      query: `
        mutation publishToChannel($productId: ID!, $publicationId: ID!) {
          publishablePublish(
            id: $productId,
            input: {
              publicationId: $publicationId
            }
          ) {
            publishable {
              ... on Product {
                id
                title
                publishedOnCurrentPublication
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        productId: gqlProductId,
        publicationId: gqlPublicationId
      }
    };

    const payload = JSON.stringify(query);
    
    const options = {
      hostname: SHOPIFY_STORE,
      path: '/admin/api/2025-10/graphql.json',
      method: 'POST',
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
        const response = JSON.parse(data);
        if (response.data && response.data.publishablePublish) {
          const result = response.data.publishablePublish;
          if (result.userErrors && result.userErrors.length > 0) {
            resolve({ success: false, productId, errors: result.userErrors });
          } else {
            resolve({ success: true, productId, published: result.publishable.publishedOnCurrentPublication });
          }
        } else if (response.errors) {
          resolve({ success: false, productId, errors: response.errors });
        } else {
          resolve({ success: false, productId, errors: ['Unknown error'] });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

async function publishAll() {
  console.log('=== PUBLISHING BUNDLES VIA GRAPHQL ===');
  console.log('Total bundles:', BUNDLES.length);
  console.log('');

  const results = [];
  
  for (const productId of BUNDLES) {
    const result = await publishProductGraphQL(productId);
    results.push(result);
    
    if (result.success) {
      console.log('✅ Product', productId, '- Published:', result.published);
    } else {
      console.log('❌ Product', productId, '- FAILED');
      console.log('   Errors:', JSON.stringify(result.errors, null, 2));
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Success:', results.filter(r => r.success).length);
  console.log('Failed:', results.filter(r => !r.success).length);
  
  return results;
}

publishAll().catch(console.error);
