#!/usr/bin/env node
/**
 * test-all-apis.cjs
 * Test de toutes les APIs configurées dans .env
 *
 * Usage: node automations/generic/test-all-apis.cjs
 *
 * @author 3A Automation
 * @date 2025-12-18
 */

// Chercher .env à la racine du projet (2 niveaux au-dessus: generic -> automations -> root)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const https = require('https');
const http = require('http');

// Configuration des APIs à tester
const APIS = [
  {
    name: 'Shopify',
    envVars: ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ACCESS_TOKEN'],
    test: async () => {
      const store = process.env.SHOPIFY_STORE_DOMAIN;
      const token = process.env.SHOPIFY_ACCESS_TOKEN;
      const version = process.env.SHOPIFY_API_VERSION || '2024-01';

      if (!store || !token) return { status: 'MISSING_CREDENTIALS' };

      return httpRequest({
        hostname: store,
        path: `/admin/api/${version}/shop.json`,
        headers: { 'X-Shopify-Access-Token': token }
      });
    }
  },
  {
    name: 'Klaviyo',
    envVars: ['KLAVIYO_API_KEY'],
    test: async () => {
      const apiKey = process.env.KLAVIYO_API_KEY;

      if (!apiKey) return { status: 'MISSING_CREDENTIALS' };

      return httpRequest({
        hostname: 'a.klaviyo.com',
        path: '/api/lists/',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': '2024-10-15',
          'Accept': 'application/json'
        }
      });
    }
  },

  {
    name: 'xAI (Grok)',
    envVars: ['XAI_API_KEY'],
    test: async () => {
      const apiKey = process.env.XAI_API_KEY;

      if (!apiKey) return { status: 'MISSING_CREDENTIALS' };

      return httpRequest({
        hostname: 'api.x.ai',
        path: '/v1/models',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
    }
  },
  {
    name: 'Google Analytics',
    envVars: ['GA4_PROPERTY_ID', 'GOOGLE_APPLICATION_CREDENTIALS'],
    test: async () => {
      const propertyId = process.env.GA4_PROPERTY_ID;
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!propertyId) return { status: 'MISSING_CREDENTIALS', detail: 'GA4_PROPERTY_ID manquant' };
      if (!credPath) return { status: 'MISSING_CREDENTIALS', detail: 'GOOGLE_APPLICATION_CREDENTIALS manquant' };

      // Vérifier si le fichier existe
      const fs = require('fs');
      if (!fs.existsSync(credPath)) {
        return { status: 'MISSING_FILE', detail: `Service Account non trouvé: ${credPath}` };
      }

      return { status: 'OK', detail: 'Credentials présentes (test API nécessite implémentation OAuth)' };
    }
  },
  {
    name: 'Meta (Facebook)',
    envVars: ['META_ACCESS_TOKEN'],
    test: async () => {
      const token = process.env.META_ACCESS_TOKEN;

      if (!token) return { status: 'MISSING_CREDENTIALS' };

      return httpRequest({
        hostname: 'graph.facebook.com',
        path: `/v18.0/me?access_token=${token}`,
        headers: { 'Accept': 'application/json' }
      });
    }
  },
  {
    name: 'Apify',
    envVars: ['APIFY_TOKEN'],
    test: async () => {
      const token = process.env.APIFY_TOKEN;

      if (!token) return { status: 'MISSING_CREDENTIALS' };
      if (token.includes('YOUR_') || token.includes('xxx')) {
        return { status: 'PLACEHOLDER', detail: 'Token contient placeholder' };
      }

      return httpRequest({
        hostname: 'api.apify.com',
        path: '/v2/users/me',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    }
  }
];

// Helper pour requêtes HTTP/HTTPS
function httpRequest(options) {
  return new Promise((resolve) => {
    const protocol = options.protocol === 'http:' ? http : https;
    const reqOptions = {
      hostname: options.hostname,
      port: options.port || (options.protocol === 'http:' ? 80 : 443),
      path: options.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ status: 'OK', httpCode: res.statusCode });
        } else if (res.statusCode === 401) {
          resolve({ status: 'UNAUTHORIZED', httpCode: 401, detail: 'Token invalide ou expiré' });
        } else if (res.statusCode === 403) {
          resolve({ status: 'FORBIDDEN', httpCode: 403, detail: 'Accès refusé (crédits requis?)' });
        } else {
          resolve({ status: 'ERROR', httpCode: res.statusCode, detail: data.substring(0, 100) });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 'CONNECTION_ERROR', detail: e.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', detail: 'Délai dépassé (10s)' });
    });

    req.end();
  });
}

// Main
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       TEST TOUTES APIs - 3A Automation                        ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');

  const results = [];

  for (const api of APIS) {
    process.stdout.write(`Testing ${api.name}... `);

    const result = await api.test();
    results.push({ name: api.name, ...result });

    // Status emoji
    let emoji;
    switch (result.status) {
      case 'OK': emoji = '✅'; break;
      case 'MISSING_CREDENTIALS': emoji = '⚠️'; break;
      case 'MISSING_FILE': emoji = '❌'; break;
      case 'PLACEHOLDER': emoji = '⚠️'; break;
      case 'UNAUTHORIZED': emoji = '🔒'; break;
      case 'FORBIDDEN': emoji = '🚫'; break;
      case 'TIMEOUT': emoji = '⏱️'; break;
      default: emoji = '❌';
    }

    console.log(`${emoji} ${result.status}${result.detail ? ` - ${result.detail}` : ''}`);
  }

  // Résumé
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('RÉSUMÉ');
  console.log('───────────────────────────────────────────────────────────────');

  const ok = results.filter(r => r.status === 'OK').length;
  const missing = results.filter(r => r.status === 'MISSING_CREDENTIALS' || r.status === 'MISSING_FILE').length;
  const errors = results.filter(r => !['OK', 'MISSING_CREDENTIALS', 'MISSING_FILE', 'PLACEHOLDER'].includes(r.status)).length;

  console.log(`✅ Fonctionnels: ${ok}/${results.length}`);
  console.log(`⚠️ Non configurés: ${missing}/${results.length}`);
  console.log(`❌ Erreurs: ${errors}/${results.length}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');

  // Return results for programmatic use
  return {
    timestamp: new Date().toISOString(),
    summary: { ok, missing, errors, total: results.length },
    results
  };
}

main()
  .then(results => {
    // Save results to outputs
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '..', '..', 'outputs');
    const outputPath = path.join(outputDir, `api-test-${new Date().toISOString().split('T')[0]}.json`);

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Résultats sauvegardés: ${outputPath}`);
  })
  .catch(console.error);
