#!/usr/bin/env node
/**
 * audit-klaviyo-flows.cjs
 * Audit complet des flows Klaviyo
 */

// Chercher .env à la racine du projet (3 niveaux au-dessus: klaviyo -> clients -> automations -> root)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.KLAVIYO_API_KEY;
const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'outputs');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('       AUDIT KLAVIYO FLOWS - 3A Automation                     ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (!apiKey) {
  console.error('❌ KLAVIYO_API_KEY requis dans .env');
  process.exit(1);
}

function klaviyoRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'a.klaviyo.com',
      path: `/api${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': '2024-10-15',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runAudit() {
  const auditData = {
    timestamp: new Date().toISOString(),
    flows: [],
    lists: [],
    metrics: [],
    recommendations: []
  };

  try {
    // 1. Flows
    console.log('1/4 - Récupération flows...');
    const flowsResponse = await klaviyoRequest('/flows/');
    const flows = flowsResponse.data || [];
    
    console.log(`   ✅ ${flows.length} flow(s) trouvé(s)`);
    
    auditData.flows = flows.map(f => ({
      id: f.id,
      name: f.attributes.name,
      status: f.attributes.status,
      trigger_type: f.attributes.trigger_type,
      created: f.attributes.created,
      updated: f.attributes.updated
    }));

    // Analyser les flows
    const flowsByStatus = {
      live: flows.filter(f => f.attributes.status === 'live').length,
      draft: flows.filter(f => f.attributes.status === 'draft').length,
      manual: flows.filter(f => f.attributes.status === 'manual').length
    };

    const flowsByTrigger = {};
    flows.forEach(f => {
      const trigger = f.attributes.trigger_type || 'unknown';
      flowsByTrigger[trigger] = (flowsByTrigger[trigger] || 0) + 1;
    });

    // 2. Listes
    console.log('2/4 - Récupération listes...');
    const listsResponse = await klaviyoRequest('/lists/');
    const lists = listsResponse.data || [];
    
    console.log(`   ✅ ${lists.length} liste(s) trouvée(s)`);
    
    auditData.lists = lists.map(l => ({
      id: l.id,
      name: l.attributes.name,
      created: l.attributes.created,
      updated: l.attributes.updated
    }));

    // 3. Métriques (events trackés)
    console.log('3/4 - Récupération métriques...');
    const metricsResponse = await klaviyoRequest('/metrics/');
    const metrics = metricsResponse.data || [];
    
    console.log(`   ✅ ${metrics.length} métrique(s) trouvée(s)`);
    
    auditData.metrics = metrics.slice(0, 20).map(m => ({
      id: m.id,
      name: m.attributes.name,
      integration: m.attributes.integration?.name || 'custom'
    }));

    // 4. Analyse et recommandations
    console.log('4/4 - Génération recommandations...');
    
    // Check flows essentiels
    const essentialFlows = [
      { name: 'Welcome', keywords: ['welcome', 'bienvenue'] },
      { name: 'Cart Abandonment', keywords: ['cart', 'abandon', 'panier'] },
      { name: 'Browse Abandonment', keywords: ['browse', 'viewed'] },
      { name: 'Post-Purchase', keywords: ['post-purchase', 'thank', 'merci'] },
      { name: 'Win-Back', keywords: ['win-back', 'lapsed', 'inactive'] }
    ];

    const missingFlows = [];
    essentialFlows.forEach(essential => {
      const hasFlow = flows.some(f => {
        const flowName = f.attributes.name.toLowerCase();
        return essential.keywords.some(kw => flowName.includes(kw));
      });
      if (!hasFlow) {
        missingFlows.push(essential.name);
      }
    });

    if (missingFlows.length > 0) {
      auditData.recommendations.push({
        priority: 'HIGH',
        category: 'FLOWS',
        issue: `Flows essentiels manquants: ${missingFlows.join(', ')}`,
        action: 'Créer les flows manquants pour capturer le revenue automatisé',
        impact: '+20-40% revenue email automatisé'
      });
    }

    if (flowsByStatus.draft > 0) {
      auditData.recommendations.push({
        priority: 'MEDIUM',
        category: 'FLOWS',
        issue: `${flowsByStatus.draft} flow(s) en brouillon`,
        action: 'Finaliser et activer les flows en brouillon',
        impact: 'Revenue email non capturé'
      });
    }

    if (lists.length < 2) {
      auditData.recommendations.push({
        priority: 'MEDIUM',
        category: 'SEGMENTATION',
        issue: 'Peu de listes pour segmentation',
        action: 'Créer listes VIP, Engaged, At-Risk pour personnalisation',
        impact: '+15-25% engagement email'
      });
    }

    // Sauvegarder JSON
    const jsonFilename = `audit-klaviyo-${new Date().toISOString().split('T')[0]}.json`;
    const jsonPath = path.join(outputDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(auditData, null, 2));
    console.log(`   ✅ JSON: ${jsonPath}`);

    // Afficher résumé
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    RÉSUMÉ AUDIT KLAVIYO                        ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('   FLOWS:');
    console.log(`   └── Total: ${flows.length}`);
    console.log(`   └── Live: ${flowsByStatus.live}`);
    console.log(`   └── Draft: ${flowsByStatus.draft}`);
    console.log('');
    console.log('   LISTES:');
    lists.forEach(l => {
      console.log(`   └── ${l.attributes.name}`);
    });
    console.log('');
    console.log('   FLOWS DÉTECTÉS:');
    flows.forEach(f => {
      const status = f.attributes.status === 'live' ? '✅' : '⚪';
      console.log(`   ${status} ${f.attributes.name} (${f.attributes.status})`);
    });
    console.log('');
    console.log(`   🔴 Recommandations HIGH: ${auditData.recommendations.filter(r => r.priority === 'HIGH').length}`);
    console.log(`   🟡 Recommandations MEDIUM: ${auditData.recommendations.filter(r => r.priority === 'MEDIUM').length}`);
    console.log('');
    
    if (missingFlows.length > 0) {
      console.log('   ⚠️  FLOWS MANQUANTS:');
      missingFlows.forEach(f => console.log(`      - ${f}`));
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ AUDIT KLAVIYO TERMINÉ');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

runAudit();
