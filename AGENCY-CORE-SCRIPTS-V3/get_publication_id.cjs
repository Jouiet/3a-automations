// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SHOP = process.env.SHOPIFY_STORE_URL;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2025-10';

async function getPublicationId() {
  const query = `
  {
    publications(first: 10) {
      nodes {
        id
        name
      }
    }
  }
  `;

  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();

  console.log('Publications:');
  console.log(JSON.stringify(result, null, 2));
}

getPublicationId().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
