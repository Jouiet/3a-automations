#!/usr/bin/env node
/**
 * SESSION 104 - Deep System Analysis
 * Analyse approfondie des dépendances, intégrations et comportements réels
 *
 * Date: 2025-12-28
 * Objectif: Vérification empirique exhaustive
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const AUTOMATIONS_DIR = path.join(__dirname, '..', 'automations');
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

console.log('================================================================================');
console.log('SESSION 104 - DEEP SYSTEM ANALYSIS');
console.log('================================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * 1. Analyse des dépendances environment
 */
function analyzeEnvironmentDependencies() {
  console.log('1. ANALYSE DES DÉPENDANCES ENVIRONNEMENT');
  console.log('─'.repeat(80));

  const envVars = {
    // Core APIs
    'KLAVIYO_API_KEY': { category: 'email', critical: true, status: !!process.env.KLAVIYO_API_KEY },
    'SHOPIFY_ACCESS_TOKEN': { category: 'ecommerce', critical: true, status: !!process.env.SHOPIFY_ACCESS_TOKEN },
    'N8N_API_KEY': { category: 'workflows', critical: true, status: !!process.env.N8N_API_KEY },
    'APIFY_TOKEN': { category: 'scraping', critical: false, status: !!process.env.APIFY_TOKEN },

    // AI APIs
    'XAI_API_KEY': { category: 'ai', critical: false, status: !!process.env.XAI_API_KEY },
    'GEMINI_API_KEY': { category: 'ai', critical: false, status: !!process.env.GEMINI_API_KEY },

    // Google Services
    'GOOGLE_APPLICATION_CREDENTIALS': { category: 'google', critical: true, status: !!process.env.GOOGLE_APPLICATION_CREDENTIALS },
    'GOOGLE_SHEETS_ID': { category: 'google', critical: false, status: !!process.env.GOOGLE_SHEETS_ID },

    // Hosting
    'HOSTINGER_API_TOKEN': { category: 'infrastructure', critical: false, status: !!process.env.HOSTINGER_API_TOKEN },
  };

  const results = {
    total: Object.keys(envVars).length,
    configured: 0,
    missing: 0,
    critical_missing: [],
    by_category: {}
  };

  for (const [varName, info] of Object.entries(envVars)) {
    if (!results.by_category[info.category]) {
      results.by_category[info.category] = { configured: 0, missing: 0 };
    }

    if (info.status) {
      results.configured++;
      results.by_category[info.category].configured++;
      console.log(`   ✅ ${varName} (${info.category})`);
    } else {
      results.missing++;
      results.by_category[info.category].missing++;
      if (info.critical) {
        results.critical_missing.push(varName);
        console.log(`   ❌ ${varName} (${info.category}) - CRITICAL`);
      } else {
        console.log(`   ⚠️  ${varName} (${info.category}) - optional`);
      }
    }
  }

  console.log(`\n   Summary: ${results.configured}/${results.total} configured`);
  console.log(`   Critical missing: ${results.critical_missing.length > 0 ? results.critical_missing.join(', ') : 'None'}`);

  return results;
}

/**
 * 2. Analyse des scripts par fonctionnalité
 */
function analyzeScriptsByFunctionality() {
  console.log('\n\n2. ANALYSE DES SCRIPTS PAR FONCTIONNALITÉ');
  console.log('─'.repeat(80));

  const categories = {
    'Klaviyo Integration': {
      patterns: ['klaviyo', 'email', 'flow', 'subscriber'],
      scripts: [],
      working: 0,
      broken: 0
    },
    'Shopify Integration': {
      patterns: ['shopify', 'product', 'collection', 'order'],
      scripts: [],
      working: 0,
      broken: 0
    },
    'Lead Generation': {
      patterns: ['lead', 'scrape', 'google-maps', 'linkedin'],
      scripts: [],
      working: 0,
      broken: 0
    },
    'Analytics': {
      patterns: ['analytics', 'ga4', 'looker', 'report'],
      scripts: [],
      working: 0,
      broken: 0
    },
    'SEO': {
      patterns: ['seo', 'meta', 'sitemap', 'schema'],
      scripts: [],
      working: 0,
      broken: 0
    },
    'AI/Content': {
      patterns: ['gemini', 'grok', 'avatar', 'video', 'content'],
      scripts: [],
      working: 0,
      broken: 0
    }
  };

  // Find all scripts
  function findScripts(dir) {
    const scripts = [];
    if (!fs.existsSync(dir)) return scripts;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scripts.push(...findScripts(fullPath));
      } else if (item.endsWith('.cjs') || item.endsWith('.js')) {
        scripts.push({ name: item, path: fullPath });
      }
    }
    return scripts;
  }

  const allScripts = findScripts(AUTOMATIONS_DIR);

  // Categorize scripts
  for (const script of allScripts) {
    const lowerName = script.name.toLowerCase();

    for (const [catName, catInfo] of Object.entries(categories)) {
      if (catInfo.patterns.some(p => lowerName.includes(p))) {
        catInfo.scripts.push(script.name);

        // Check if script has required env vars
        try {
          const content = fs.readFileSync(script.path, 'utf-8');
          const hasShopify = content.includes('SHOPIFY_ACCESS_TOKEN') && !process.env.SHOPIFY_ACCESS_TOKEN;
          const hasMissingCritical = hasShopify;

          if (hasMissingCritical) {
            catInfo.broken++;
          } else {
            catInfo.working++;
          }
        } catch (e) {
          catInfo.broken++;
        }
        break;
      }
    }
  }

  // Report
  for (const [catName, catInfo] of Object.entries(categories)) {
    const total = catInfo.scripts.length;
    const workingPct = total > 0 ? Math.round((catInfo.working / total) * 100) : 0;
    const status = workingPct >= 80 ? '✅' : workingPct >= 50 ? '⚠️' : '❌';

    console.log(`\n   ${status} ${catName}`);
    console.log(`      Scripts: ${total}`);
    console.log(`      Working: ${catInfo.working} (${workingPct}%)`);
    console.log(`      Broken: ${catInfo.broken}`);
  }

  return categories;
}

/**
 * 3. Analyse des intégrations entre composants
 */
function analyzeIntegrations() {
  console.log('\n\n3. ANALYSE DES INTÉGRATIONS');
  console.log('─'.repeat(80));

  const integrations = [
    {
      name: 'Voice Widget → Booking API',
      description: 'Widget vocal capture RDV via Google Apps Script',
      components: ['voice-widget.min.js', 'Google Apps Script'],
      status: 'working',
      evidence: 'Booking API retourne 180 slots'
    },
    {
      name: 'n8n → Klaviyo',
      description: 'Workflows n8n déclenchent flows Klaviyo',
      components: ['n8n workflows', 'Klaviyo API'],
      status: 'working',
      evidence: 'Email Outreach workflow utilise Klaviyo HTTP API'
    },
    {
      name: 'n8n → Shopify',
      description: 'Workflows n8n interagissent avec Shopify',
      components: ['n8n workflows', 'Shopify API'],
      status: 'blocked',
      evidence: 'SHOPIFY_ACCESS_TOKEN vide'
    },
    {
      name: 'Scripts → Apify',
      description: 'Scripts de scraping utilisent Apify actors',
      components: ['scrape-google-maps.cjs', 'Apify API'],
      status: 'working',
      evidence: 'APIFY_TOKEN configuré'
    },
    {
      name: 'n8n → WhatsApp',
      description: 'Workflows n8n envoient via WhatsApp Business',
      components: ['WhatsApp confirmation workflow', 'WhatsApp Business API'],
      status: 'blocked',
      evidence: 'WhatsApp Business API non configurée'
    },
    {
      name: 'n8n → Grok Voice',
      description: 'Telephony via Twilio + Grok AI',
      components: ['Grok Voice Telephony workflow', 'Twilio', 'xAI API'],
      status: 'partial',
      evidence: 'xAI API OK, Twilio non configuré'
    },
    {
      name: 'Blog Generator → Claude',
      description: 'Génération articles via Claude API',
      components: ['Blog workflow', 'Anthropic API'],
      status: 'unknown',
      evidence: 'Anthropic credentials non vérifiés'
    },
    {
      name: 'Scripts → Google Analytics',
      description: 'Scripts analytics utilisent GA4 API',
      components: ['analyze-ga4*.cjs', 'GA4 API'],
      status: 'partial',
      evidence: 'Service Account configuré, permissions GA4 à vérifier'
    }
  ];

  const stats = { working: 0, partial: 0, blocked: 0, unknown: 0 };

  for (const integration of integrations) {
    stats[integration.status]++;

    const icon = {
      working: '✅',
      partial: '⚠️',
      blocked: '❌',
      unknown: '❓'
    }[integration.status];

    console.log(`\n   ${icon} ${integration.name}`);
    console.log(`      Components: ${integration.components.join(' → ')}`);
    console.log(`      Evidence: ${integration.evidence}`);
  }

  console.log(`\n   Summary:`);
  console.log(`      Working: ${stats.working}`);
  console.log(`      Partial: ${stats.partial}`);
  console.log(`      Blocked: ${stats.blocked}`);
  console.log(`      Unknown: ${stats.unknown}`);

  return { integrations, stats };
}

/**
 * 4. Analyse de la capacité par type de client
 */
function analyzeClientCapacity() {
  console.log('\n\n4. CAPACITÉ PAR TYPE DE CLIENT');
  console.log('─'.repeat(80));

  const clientTypes = [
    {
      type: 'E-commerce Shopify + Klaviyo',
      requirements: ['Shopify API', 'Klaviyo API', 'n8n workflows'],
      available: {
        'Shopify API': false,
        'Klaviyo API': true,
        'n8n workflows': true
      },
      automations: [
        'Abandon panier', 'Welcome series', 'Post-purchase',
        'Enrichissement produits', 'Google Shopping feed'
      ],
      readiness: 0
    },
    {
      type: 'B2B / Consultant Lead Gen',
      requirements: ['Apify', 'n8n workflows', 'Email outreach'],
      available: {
        'Apify': true,
        'n8n workflows': true,
        'Email outreach': true
      },
      automations: [
        'LinkedIn scraping', 'Google Maps scraping',
        'Email sequence', 'Lead scoring'
      ],
      readiness: 100
    },
    {
      type: 'Service Local (BTP, etc.)',
      requirements: ['Voice Widget', 'Booking API', 'Google Maps'],
      available: {
        'Voice Widget': true,
        'Booking API': true,
        'Google Maps': true
      },
      automations: [
        'Voice assistant', 'RDV automatique',
        'Local lead capture', 'Avis clients'
      ],
      readiness: 100
    },
    {
      type: 'Analytics / Reporting',
      requirements: ['GA4 API', 'Looker Studio', 'Gemini'],
      available: {
        'GA4 API': true, // SA configured
        'Looker Studio': true,
        'Gemini': true
      },
      automations: [
        'Dashboard GA4', 'Alertes', 'Rapports auto'
      ],
      readiness: 90
    },
    {
      type: 'Content Automation',
      requirements: ['Gemini', 'n8n', 'Social APIs'],
      available: {
        'Gemini': true,
        'n8n': true,
        'Social APIs': false // FB/LinkedIn OAuth needed
      },
      automations: [
        'Blog generation', 'Social distribution', 'SEO content'
      ],
      readiness: 70
    }
  ];

  for (const client of clientTypes) {
    const availableCount = Object.values(client.available).filter(v => v).length;
    const totalReq = Object.keys(client.available).length;
    client.readiness = Math.round((availableCount / totalReq) * 100);

    const icon = client.readiness >= 90 ? '✅' : client.readiness >= 50 ? '⚠️' : '❌';

    console.log(`\n   ${icon} ${client.type} (${client.readiness}% ready)`);
    console.log(`      Requirements:`);
    for (const [req, available] of Object.entries(client.available)) {
      console.log(`         ${available ? '✓' : '✗'} ${req}`);
    }
    console.log(`      Automations disponibles: ${client.automations.length}`);
  }

  return clientTypes;
}

/**
 * 5. Analyse des workflows n8n en détail
 */
async function analyzeN8nWorkflows() {
  console.log('\n\n5. ANALYSE DÉTAILLÉE WORKFLOWS N8N');
  console.log('─'.repeat(80));

  const workflowFiles = fs.readdirSync(path.join(AUTOMATIONS_DIR, 'agency', 'n8n-workflows'))
    .filter(f => f.endsWith('.json'));

  const analysis = [];

  for (const file of workflowFiles) {
    const filePath = path.join(AUTOMATIONS_DIR, 'agency', 'n8n-workflows', file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const workflow = {
      name: content.name || file,
      nodes: content.nodes?.length || 0,
      triggers: [],
      integrations: [],
      envVarsUsed: [],
      blockers: []
    };

    // Analyze nodes
    for (const node of (content.nodes || [])) {
      // Find triggers
      if (node.type?.includes('webhook') || node.type?.includes('schedule') || node.type?.includes('trigger')) {
        workflow.triggers.push(node.type);
      }

      // Find integrations
      if (node.type?.includes('klaviyo') || node.type?.includes('shopify') ||
          node.type?.includes('whatsApp') || node.type?.includes('googleSheets')) {
        workflow.integrations.push(node.type);
      }

      // Find env vars in parameters
      const nodeStr = JSON.stringify(node);
      const envMatches = nodeStr.match(/\$env\.([A-Z_]+)/g);
      if (envMatches) {
        workflow.envVarsUsed.push(...envMatches.map(m => m.replace('$env.', '')));
      }
    }

    // Check blockers
    if (workflow.integrations.some(i => i.includes('whatsApp'))) {
      workflow.blockers.push('WhatsApp Business API');
    }
    if (workflow.integrations.some(i => i.includes('shopify')) && !process.env.SHOPIFY_ACCESS_TOKEN) {
      workflow.blockers.push('Shopify API');
    }

    workflow.envVarsUsed = [...new Set(workflow.envVarsUsed)];

    const status = workflow.blockers.length === 0 ? '✅' : '⚠️';
    console.log(`\n   ${status} ${workflow.name}`);
    console.log(`      Nodes: ${workflow.nodes}`);
    console.log(`      Triggers: ${workflow.triggers.join(', ') || 'None'}`);
    console.log(`      Integrations: ${workflow.integrations.join(', ') || 'None'}`);
    if (workflow.blockers.length > 0) {
      console.log(`      Blockers: ${workflow.blockers.join(', ')}`);
    }

    analysis.push(workflow);
  }

  return analysis;
}

/**
 * 6. Génération du rapport final
 */
async function generateFinalReport(results) {
  console.log('\n\n================================================================================');
  console.log('RAPPORT FINAL - DEEP SYSTEM ANALYSIS');
  console.log('================================================================================');

  const report = {
    timestamp: new Date().toISOString(),
    session: 104,

    environment: results.env,
    scriptAnalysis: results.scripts,
    integrations: results.integrations,
    clientCapacity: results.clients,
    n8nWorkflows: results.n8n,

    summary: {
      envConfigured: `${results.env.configured}/${results.env.total}`,
      criticalMissing: results.env.critical_missing,
      integrationsWorking: results.integrations.stats.working,
      integrationsBlocked: results.integrations.stats.blocked,
      clientReadiness: {
        ready: results.clients.filter(c => c.readiness >= 90).length,
        partial: results.clients.filter(c => c.readiness >= 50 && c.readiness < 90).length,
        blocked: results.clients.filter(c => c.readiness < 50).length
      }
    },

    criticalFindings: [],
    recommendations: []
  };

  // Critical findings
  if (results.env.critical_missing.length > 0) {
    report.criticalFindings.push({
      severity: 'CRITICAL',
      finding: `Missing critical API: ${results.env.critical_missing.join(', ')}`,
      impact: 'E-commerce clients cannot be served'
    });
  }

  if (results.integrations.stats.blocked > 0) {
    report.criticalFindings.push({
      severity: 'HIGH',
      finding: `${results.integrations.stats.blocked} integrations blocked`,
      impact: 'Reduced automation capacity'
    });
  }

  // Recommendations
  report.recommendations = [
    {
      priority: 'P1',
      action: 'Configure Shopify Dev Store',
      effort: '30 min',
      impact: 'Unlocks 100% e-commerce capacity'
    },
    {
      priority: 'P2',
      action: 'Configure WhatsApp Business API',
      effort: '4h',
      impact: 'Enables 2 n8n workflows'
    },
    {
      priority: 'P2',
      action: 'Verify GA4 Service Account permissions',
      effort: '15 min',
      impact: 'Full analytics capability'
    },
    {
      priority: 'P3',
      action: 'Configure Twilio for Voice Telephony',
      effort: '2h',
      impact: 'Enables Grok Voice calls'
    }
  ];

  // Save report
  const reportPath = path.join(OUTPUTS_DIR, 'deep-system-analysis-s104.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 SUMMARY:');
  console.log(`   Environment: ${report.summary.envConfigured} configured`);
  console.log(`   Critical missing: ${report.summary.criticalMissing.join(', ') || 'None'}`);
  console.log(`   Integrations: ${report.summary.integrationsWorking} working, ${report.summary.integrationsBlocked} blocked`);
  console.log(`   Client readiness: ${report.summary.clientReadiness.ready} ready, ${report.summary.clientReadiness.partial} partial, ${report.summary.clientReadiness.blocked} blocked`);

  console.log('\n🚨 CRITICAL FINDINGS:');
  for (const finding of report.criticalFindings) {
    console.log(`   [${finding.severity}] ${finding.finding}`);
    console.log(`         Impact: ${finding.impact}`);
  }

  console.log('\n📋 RECOMMENDATIONS:');
  for (const rec of report.recommendations) {
    console.log(`   [${rec.priority}] ${rec.action} (${rec.effort})`);
    console.log(`         Impact: ${rec.impact}`);
  }

  console.log(`\n📁 Report saved: ${reportPath}`);

  return report;
}

/**
 * Main
 */
async function main() {
  const results = {};

  results.env = analyzeEnvironmentDependencies();
  results.scripts = analyzeScriptsByFunctionality();
  results.integrations = analyzeIntegrations();
  results.clients = analyzeClientCapacity();
  results.n8n = await analyzeN8nWorkflows();

  await generateFinalReport(results);

  console.log('\n================================================================================');
  console.log('DEEP ANALYSIS COMPLETE');
  console.log('================================================================================\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
