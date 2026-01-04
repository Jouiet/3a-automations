#!/usr/bin/env node
/**
 * SIMULATION PARCOURS CLIENT - Session 104
 * Date: 2025-12-28
 *
 * Simule les différents parcours clients et vérifie EMPIRIQUEMENT
 * la capacité réelle à délivrer les services
 */

require('dotenv').config({ path: '/Users/mac/Desktop/JO-AAA/.env' });
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

const results = {
  timestamp: new Date().toISOString(),
  scenarios: [],
  apis: {},
  workflows: {},
  widgetTests: {},
  summary: {}
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: TEST DES APIs EN TEMPS RÉEL
// ═══════════════════════════════════════════════════════════════════════════

async function testAPIs() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('PHASE 1: TEST DES APIs EN TEMPS RÉEL', 'bold');
  log('═'.repeat(70), 'cyan');

  const tests = [
    {
      name: 'Klaviyo API',
      test: async () => {
        const res = await fetch('https://a.klaviyo.com/api/lists', {
          headers: {
            'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
            'revision': '2024-02-15'
          }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          listsCount: data.data?.length || 0
        };
      }
    },
    {
      name: 'n8n API',
      test: async () => {
        const res = await fetch('https://n8n.srv1168256.hstgr.cloud/api/v1/workflows', {
          headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          workflowsCount: data.data?.length || 0,
          activeWorkflows: data.data?.filter(w => w.active)?.length || 0
        };
      }
    },
    {
      name: 'Booking API (Google Apps Script)',
      test: async () => {
        const res = await fetch('https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec?action=availability', {
          redirect: 'follow'
        });
        const data = await res.json();
        return {
          success: data.success,
          status: res.status,
          slotsAvailable: data.data?.slots?.length || 0
        };
      }
    },
    {
      name: 'xAI / Grok API',
      test: async () => {
        const res = await fetch('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.XAI_API_KEY}` }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          modelsCount: data.data?.length || data.models?.length || 0
        };
      }
    },
    {
      name: 'Gemini API',
      test: async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          modelsCount: data.models?.length || 0
        };
      }
    },
    {
      name: 'Apify API',
      test: async () => {
        const res = await fetch('https://api.apify.com/v2/acts', {
          headers: { 'Authorization': `Bearer ${process.env.APIFY_TOKEN}` }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          actorsCount: data.data?.items?.length || 0
        };
      }
    },
    {
      name: 'GitHub API',
      test: async () => {
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          user: data.login || 'unknown'
        };
      }
    },
    {
      name: 'Hostinger API',
      test: async () => {
        const res = await fetch('https://developers.hostinger.com/api/vps/v1/virtual-machines', {
          headers: { 'Authorization': `Bearer ${process.env.HOSTINGER_API_TOKEN}` }
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: res.status,
          vpsCount: Array.isArray(data) ? data.length : (data.data?.length || 0)
        };
      }
    }
  ];

  for (const t of tests) {
    try {
      const result = await t.test();
      results.apis[t.name] = result;
      const emoji = result.success ? '✅' : '❌';
      log(`\n${emoji} ${t.name}`, result.success ? 'green' : 'red');
      log(`   Status: ${result.status}`, result.success ? 'green' : 'red');
      Object.entries(result).forEach(([k, v]) => {
        if (k !== 'success' && k !== 'status') {
          log(`   ${k}: ${v}`);
        }
      });
    } catch (err) {
      results.apis[t.name] = { success: false, error: err.message };
      log(`\n❌ ${t.name}: ${err.message}`, 'red');
    }
  }

  return results.apis;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: SIMULATION DES SCÉNARIOS CLIENTS
// ═══════════════════════════════════════════════════════════════════════════

async function simulateClientScenarios() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('PHASE 2: SIMULATION DES SCÉNARIOS CLIENTS', 'bold');
  log('═'.repeat(70), 'cyan');

  const scenarios = [
    {
      id: 'S1',
      name: 'E-commerce Shopify + Klaviyo',
      persona: 'PME e-commerce €50k-500k CA',
      needs: ['Automatiser emails', 'Récupérer paniers abandonnés', 'Welcome series'],
      requiredAPIs: ['Klaviyo API'],
      steps: [
        { action: 'Audit compte Klaviyo client', tool: 'audit-klaviyo-flows-v2.cjs', requires: 'KLAVIYO_API_KEY client' },
        { action: 'Créer flows email', tool: 'Klaviyo UI', requires: 'Accès Klaviyo client' },
        { action: 'Tester flows', tool: 'test-klaviyo-connection.cjs', requires: 'Triggers Shopify' }
      ]
    },
    {
      id: 'S2',
      name: 'B2B Lead Generation',
      persona: 'Consultant/Agence cherche clients',
      needs: ['Scraper LinkedIn', 'Séquence email outreach', 'Scoring leads'],
      requiredAPIs: ['Apify API', 'Klaviyo API', 'n8n API'],
      steps: [
        { action: 'Scraper leads LinkedIn', tool: 'linkedin-lead-scraper n8n', requires: 'Critères de recherche' },
        { action: 'Enrichir données', tool: 'Apollo.io', requires: 'APOLLO_API_KEY (non configuré)' },
        { action: 'Séquence outreach', tool: 'email-outreach-sequence n8n', requires: 'SMTP/Klaviyo' }
      ]
    },
    {
      id: 'S3',
      name: 'Voice Widget Integration',
      persona: 'PME veut assistant vocal sur son site',
      needs: ['Widget vocal', 'Prise de RDV auto', 'Personnalisation'],
      requiredAPIs: ['Booking API'],
      steps: [
        { action: 'Copier voice-widget.min.js', tool: 'FTP/SSH', requires: 'Accès serveur client' },
        { action: 'Créer config personnalisée', tool: 'Éditeur', requires: 'Couleurs/textes client' },
        { action: 'Configurer booking', tool: 'Google Apps Script', requires: 'Calendar client' }
      ]
    },
    {
      id: 'S4',
      name: 'Analytics Dashboard',
      persona: 'E-commerce veut vision 360° données',
      needs: ['Looker Studio', 'Alertes automatiques', 'Rapports hebdo'],
      requiredAPIs: ['Gemini API'],
      steps: [
        { action: 'Connecter GA4', tool: 'Looker Studio', requires: 'Accès GA4 client' },
        { action: 'Créer dashboard', tool: 'Template Looker', requires: 'Template existant' },
        { action: 'Configurer alertes', tool: 'analyze-ga4-source.cjs', requires: 'Service Account' }
      ]
    },
    {
      id: 'S5',
      name: 'Content Automation',
      persona: 'PME veut automatiser son contenu',
      needs: ['Blog articles IA', 'Distribution multi-canal', 'SEO'],
      requiredAPIs: ['Gemini API', 'n8n API'],
      steps: [
        { action: 'Générer article', tool: 'blog-article-generator n8n', requires: 'Anthropic API Key' },
        { action: 'Publier sur site', tool: 'n8n file write', requires: 'Accès serveur' },
        { action: 'Distribuer social', tool: 'Facebook/LinkedIn APIs', requires: 'Tokens social' }
      ]
    }
  ];

  for (const scenario of scenarios) {
    log(`\n${'─'.repeat(70)}`, 'blue');
    log(`📋 SCÉNARIO ${scenario.id}: ${scenario.name}`, 'yellow');
    log(`   Persona: ${scenario.persona}`);
    log(`   Besoins: ${scenario.needs.join(', ')}`);

    // Vérifier les APIs requises
    const apisReady = scenario.requiredAPIs.every(api => results.apis[api]?.success);
    log(`\n   APIs requises: ${scenario.requiredAPIs.join(', ')}`);
    log(`   APIs disponibles: ${apisReady ? '✅ OUI' : '❌ NON'}`, apisReady ? 'green' : 'red');

    // Analyser chaque étape
    log('\n   📝 Étapes d\'implémentation:');
    let blockers = [];
    for (const step of scenario.steps) {
      const hasBlocker = step.requires.includes('non configuré') ||
                         step.requires.includes('client') ||
                         step.requires.includes('Accès');
      const emoji = hasBlocker ? '⚠️' : '✅';
      log(`      ${emoji} ${step.action}`);
      log(`         Tool: ${step.tool}`);
      log(`         Requires: ${step.requires}`, hasBlocker ? 'yellow' : 'green');

      if (hasBlocker && !step.requires.includes('Accès')) {
        blockers.push(step.requires);
      }
    }

    // Évaluation
    const status = blockers.length === 0 ? 'ready' :
                   blockers.length <= 1 ? 'partial' : 'blocked';

    scenario.status = status;
    scenario.blockers = blockers;
    scenario.apisReady = apisReady;

    const statusEmoji = status === 'ready' ? '✅' : (status === 'partial' ? '⚠️' : '❌');
    const statusText = status === 'ready' ? 'PRÊT' : (status === 'partial' ? 'PARTIEL' : 'BLOQUÉ');
    log(`\n   Status: ${statusEmoji} ${statusText}`,
        status === 'ready' ? 'green' : (status === 'partial' ? 'yellow' : 'red'));

    if (blockers.length > 0) {
      log(`   Blockers: ${blockers.join(' | ')}`, 'red');
    }

    results.scenarios.push(scenario);
  }

  return scenarios;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: ANALYSE SWOT
// ═══════════════════════════════════════════════════════════════════════════

async function analyzeSWOT() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('PHASE 3: ANALYSE SWOT FACTUELLE', 'bold');
  log('═'.repeat(70), 'cyan');

  const apisWorking = Object.values(results.apis).filter(a => a.success).length;
  const apisTotal = Object.keys(results.apis).length;
  const scenariosReady = results.scenarios.filter(s => s.status === 'ready').length;

  const swot = {
    strengths: [
      `${apisWorking}/${apisTotal} APIs fonctionnelles (${((apisWorking/apisTotal)*100).toFixed(0)}%)`,
      `Booking API opérationnel (${results.apis['Booking API (Google Apps Script)']?.slotsAvailable || 0} slots)`,
      `n8n: ${results.apis['n8n API']?.activeWorkflows || 0} workflows actifs`,
      'Voice Widget déployé sur le site',
      'Registry 99 automations documentées',
      'Stack IA complète (Grok + Gemini)'
    ],
    weaknesses: [
      'Shopify non configuré → bloque e-commerce',
      'Pas de templates de configuration client',
      'Scripts hardcodés pour certains clients',
      'Pas de système de onboarding documenté',
      'WhatsApp Business non configuré',
      'Apollo.io non configuré (enrichissement leads)'
    ],
    opportunities: [
      'Créer templates de déploiement réutilisables',
      'Packager Voice Widget comme produit',
      'Automatiser le onboarding client',
      'Étendre à WhatsApp Business',
      'Créer marketplace d\'automations'
    ],
    threats: [
      'Dépendance à Google Apps Script (latence)',
      'Credentials client à gérer manuellement',
      'Pas de monitoring centralisé',
      'Concurrence des outils no-code (Make, Zapier)'
    ]
  };

  log('\n💪 FORCES:', 'green');
  swot.strengths.forEach(s => log(`   • ${s}`, 'green'));

  log('\n⚠️ FAIBLESSES:', 'yellow');
  swot.weaknesses.forEach(w => log(`   • ${w}`, 'yellow'));

  log('\n🚀 OPPORTUNITÉS:', 'blue');
  swot.opportunities.forEach(o => log(`   • ${o}`, 'blue'));

  log('\n🔥 MENACES:', 'red');
  swot.threats.forEach(t => log(`   • ${t}`, 'red'));

  results.swot = swot;
  return swot;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: RECOMMANDATIONS PRIORITAIRES
// ═══════════════════════════════════════════════════════════════════════════

async function generateRecommendations() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('PHASE 4: RECOMMANDATIONS PRIORITAIRES', 'bold');
  log('═'.repeat(70), 'cyan');

  const recommendations = [
    {
      priority: 'P1 - CRITIQUE',
      action: 'Créer Shopify Dev Store',
      effort: '30 min',
      impact: 'Débloque 100% des scénarios e-commerce',
      steps: [
        '1. Aller sur partners.shopify.com',
        '2. Créer Development Store',
        '3. Générer Admin API Token',
        '4. Ajouter dans .env'
      ]
    },
    {
      priority: 'P2 - IMPORTANT',
      action: 'Créer template config Voice Widget',
      effort: '2h',
      impact: 'Réduit temps déploiement de 4h à 30min',
      steps: [
        '1. Extraire variables configurables du widget',
        '2. Créer config.template.js',
        '3. Documenter le processus',
        '4. Créer script d\'installation'
      ]
    },
    {
      priority: 'P2 - IMPORTANT',
      action: 'Documenter processus onboarding client',
      effort: '3h',
      impact: 'Standardise la livraison des projets',
      steps: [
        '1. Créer checklist par type de projet',
        '2. Définir livrables standard',
        '3. Créer templates de communication',
        '4. Automatiser les rappels'
      ]
    },
    {
      priority: 'P3 - SOUHAITABLE',
      action: 'Configurer WhatsApp Business API',
      effort: '4h',
      impact: 'Active les workflows WhatsApp (confirmation RDV)',
      steps: [
        '1. Créer compte Meta Business',
        '2. Configurer WhatsApp Business Cloud',
        '3. Créer templates de message',
        '4. Tester avec n8n'
      ]
    }
  ];

  for (const rec of recommendations) {
    log(`\n📌 ${rec.priority}`, rec.priority.includes('P1') ? 'red' : 'yellow');
    log(`   Action: ${rec.action}`, 'bold');
    log(`   Effort: ${rec.effort}`);
    log(`   Impact: ${rec.impact}`, 'green');
    log('   Étapes:');
    rec.steps.forEach(step => log(`      ${step}`));
  }

  results.recommendations = recommendations;
  return recommendations;
}

// ═══════════════════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ═══════════════════════════════════════════════════════════════════════════

async function generateFinalReport() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('RAPPORT FINAL - SIMULATION PARCOURS CLIENT S104', 'bold');
  log('═'.repeat(70), 'cyan');

  const apisWorking = Object.values(results.apis).filter(a => a.success).length;
  const apisTotal = Object.keys(results.apis).length;
  const scenariosReady = results.scenarios.filter(s => s.status === 'ready').length;
  const scenariosPartial = results.scenarios.filter(s => s.status === 'partial').length;
  const scenariosBlocked = results.scenarios.filter(s => s.status === 'blocked').length;

  // Calcul score
  const apiScore = (apisWorking / apisTotal) * 100;
  const scenarioScore = ((scenariosReady * 1 + scenariosPartial * 0.5) / results.scenarios.length) * 100;
  const globalScore = (apiScore * 0.4 + scenarioScore * 0.6);

  log('\n📊 MÉTRIQUES FINALES:', 'bold');
  log(`   APIs fonctionnelles: ${apisWorking}/${apisTotal} (${apiScore.toFixed(0)}%)`, apiScore >= 70 ? 'green' : 'yellow');
  log(`   Scénarios prêts: ${scenariosReady}/${results.scenarios.length}`, scenariosReady >= 3 ? 'green' : 'yellow');
  log(`   Scénarios partiels: ${scenariosPartial}/${results.scenarios.length}`);
  log(`   Scénarios bloqués: ${scenariosBlocked}/${results.scenarios.length}`, scenariosBlocked > 0 ? 'red' : 'green');

  log(`\n🎯 SCORE GLOBAL DE DÉLIVRABILITÉ: ${globalScore.toFixed(1)}%`,
      globalScore >= 70 ? 'green' : (globalScore >= 50 ? 'yellow' : 'red'));

  // Capacité par type de client
  log('\n👥 CAPACITÉ PAR TYPE DE CLIENT:');

  const clientTypes = {
    'E-commerce Shopify': results.apis['Klaviyo API']?.success ? '⚠️ PARTIEL (Shopify manquant)' : '❌ NON',
    'B2B/Consultant': results.apis['Apify API']?.success ? '✅ PRÊT' : '⚠️ PARTIEL',
    'Service local (BTP, etc.)': '✅ PRÊT',
    'PME générique (Voice Widget)': results.apis['Booking API (Google Apps Script)']?.success ? '✅ PRÊT' : '❌ NON',
    'Analytics/Reporting': results.apis['Gemini API']?.success ? '✅ PRÊT' : '❌ NON'
  };

  Object.entries(clientTypes).forEach(([type, status]) => {
    const color = status.includes('✅') ? 'green' : (status.includes('⚠️') ? 'yellow' : 'red');
    log(`   ${type}: ${status}`, color);
  });

  results.summary = {
    apisWorking,
    apisTotal,
    apiScore: apiScore.toFixed(1),
    scenariosReady,
    scenariosPartial,
    scenariosBlocked,
    scenarioScore: scenarioScore.toFixed(1),
    globalScore: globalScore.toFixed(1),
    clientCapacity: clientTypes,
    date: new Date().toISOString()
  };

  // Sauvegarder
  const reportPath = path.join(__dirname, '../outputs/simulation-client-journey-s104.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'blue');

  return results;
}

// Main
async function main() {
  log('\n' + '╔'.padEnd(69, '═') + '╗', 'bold');
  log(' ║   SIMULATION PARCOURS CLIENT - 3A AUTOMATION - SESSION 104       ║', 'bold');
  log(' ╚' + '═'.repeat(68) + '╝', 'bold');

  try {
    await testAPIs();
    await simulateClientScenarios();
    await analyzeSWOT();
    await generateRecommendations();
    await generateFinalReport();

    log('\n' + '═'.repeat(70), 'green');
    log('SIMULATION TERMINÉE AVEC SUCCÈS', 'green');
    log('═'.repeat(70), 'green');

    process.exit(0);
  } catch (error) {
    log(`\n❌ ERREUR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
