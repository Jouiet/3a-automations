// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * Création automatique des métafields MyDealz dans Shopify
 * Utilise l'API Admin pour créer toutes les définitions de métafields
 */

import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger configuration
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) config[match[1]] = match[2];
});

// Charger les métafields
const metafieldsConfig = JSON.parse(
  readFileSync(join(__dirname, '..', 'config', 'metafields.json'), 'utf8')
);

console.log('='.repeat(70));
console.log('CREATION DES METAFIELDS MYDEALZ');
console.log('='.repeat(70));
console.log('');
console.log(`Store: ${config.SHOPIFY_STORE_URL}`);
console.log(`Total metafields: ${metafieldsConfig.metafields.length}`);
console.log('');

let successCount = 0;
let errorCount = 0;
let skipCount = 0;

// Fonction pour créer un métafield via API
function createMetafield(metafield, index) {
  return new Promise((resolve) => {
    // Convertir la configuration au format GraphQL Shopify
    const shopifyType = convertToShopifyType(metafield.type);

    const mutation = `
      mutation CreateMetafieldDefinition {
        metafieldDefinitionCreate(
          definition: {
            name: "${metafield.name}"
            namespace: "${metafield.namespace}"
            key: "${metafield.key}"
            description: "${metafield.description}"
            type: "${shopifyType}"
            ownerType: PRODUCT
            ${metafield.validation ? `validations: [${formatValidations(metafield.validation, metafield.type)}]` : ''}
          }
        ) {
          createdDefinition {
            id
            name
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const postData = JSON.stringify({ query: mutation });

    const options = {
      hostname: config.SHOPIFY_STORE_URL,
      path: `/admin/api/${config.SHOPIFY_API_VERSION}/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.data?.metafieldDefinitionCreate?.createdDefinition) {
            console.log(`✅ [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name}`);
            successCount++;
          } else if (response.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
            const errors = response.data.metafieldDefinitionCreate.userErrors;
            if (errors[0].message.includes('already exists') || errors[0].message.includes('taken')) {
              console.log(`⏭️  [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name} (already exists)`);
              skipCount++;
            } else {
              console.log(`❌ [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name}`);
              console.log(`   Error: ${errors[0].message}`);
              errorCount++;
            }
          } else {
            console.log(`❌ [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name}`);
            console.log(`   Unknown error:`, response);
            errorCount++;
          }
        } catch (e) {
          console.log(`❌ [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name}`);
          console.log(`   Parse error:`, e.message);
          errorCount++;
        }

        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ [${index + 1}/${metafieldsConfig.metafields.length}] ${metafield.name}`);
      console.log(`   Network error:`, error.message);
      errorCount++;
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Convertir types vers format Shopify
function convertToShopifyType(type) {
  const typeMap = {
    'number_integer': 'number_integer',
    'money': 'money',
    'date_time': 'date_time',
    'boolean': 'boolean',
    'single_line_text_field': 'single_line_text_field',
    'url': 'url',
    'list.single_line_text_field': 'list.single_line_text_field'
  };
  return typeMap[type] || type;
}

// Formatter les validations
function formatValidations(validation, type) {
  const rules = [];

  if (type === 'number_integer') {
    if (validation.min !== undefined) {
      rules.push(`{ name: "min", value: "${validation.min}" }`);
    }
    if (validation.max !== undefined) {
      rules.push(`{ name: "max", value: "${validation.max}" }`);
    }
  }

  if (type === 'single_line_text_field' && validation.max) {
    rules.push(`{ name: "max", value: "${validation.max}" }`);
  }

  return rules.join(', ');
}

// Créer les métafields séquentiellement (pour éviter rate limiting)
async function createAllMetafields() {
  for (let i = 0; i < metafieldsConfig.metafields.length; i++) {
    await createMetafield(metafieldsConfig.metafields[i], i);
    // Pause de 500ms entre chaque requête pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('RESULTAT:');
  console.log(`  ✅ Créés: ${successCount}`);
  console.log(`  ⏭️  Déjà existants: ${skipCount}`);
  console.log(`  ❌ Erreurs: ${errorCount}`);
  console.log(`  📊 Total: ${metafieldsConfig.metafields.length}`);
  console.log('='.repeat(70));
  console.log('');

  if (successCount > 0 || skipCount === metafieldsConfig.metafields.length) {
    console.log('✅ TOUS LES METAFIELDS SONT PRETS DANS SHOPIFY!');
    console.log('');
    console.log('Vous pouvez maintenant:');
    console.log('  1. Aller dans Shopify Admin > Settings > Custom data > Products');
    console.log('  2. Voir tous les métafields MyDealz configurés');
    console.log('  3. Commencer à les utiliser sur vos produits');
  } else if (errorCount > 0) {
    console.log('⚠️  Certains métafields n\'ont pas pu être créés.');
    console.log('Vérifiez les erreurs ci-dessus et réessayez.');
  }
  console.log('');
}

// Exécuter
createAllMetafields();
