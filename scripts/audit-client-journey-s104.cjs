#!/usr/bin/env node
/**
 * AUDIT CLIENT JOURNEY - Session 104
 * Date: 2025-12-28
 *
 * Vérifie empiriquement la capacité réelle à servir des clients
 * Test rigoureux de chaque composant du système
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuration
const AUTOMATIONS_REGISTRY = path.join(__dirname, '../automations/automations-registry.json');
const AUTOMATIONS_DIR = path.join(__dirname, '../automations');

const results = {
  timestamp: new Date().toISOString(),
  summary: {},
  registryValidation: {},
  scriptsExistence: { existing: [], missing: [] },
  apisStatus: {},
  clientScenarios: [],
  voiceWidgetAudit: {},
  implementationMethodology: {},
  recommendations: []
};

// Couleurs console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * PHASE 1: Validation du Registry
 */
async function validateRegistry() {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 1: VALIDATION DU REGISTRY', 'bold');
  log('═'.repeat(60), 'blue');

  const registry = JSON.parse(fs.readFileSync(AUTOMATIONS_REGISTRY, 'utf8'));

  results.registryValidation = {
    version: registry.version,
    totalCount: registry.totalCount,
    lastUpdated: registry.lastUpdated,
    automationsCount: registry.automations.length,
    match: registry.totalCount === registry.automations.length
  };

  log(`\n📋 Registry v${registry.version}`, 'blue');
  log(`   Total déclaré: ${registry.totalCount}`);
  log(`   Automations réelles: ${registry.automations.length}`);
  log(`   Match: ${results.registryValidation.match ? '✅ OUI' : '❌ NON'}`);

  // Catégoriser par type
  const byType = {};
  const byCategory = {};

  registry.automations.forEach(auto => {
    byType[auto.type] = (byType[auto.type] || 0) + 1;
    byCategory[auto.category] = (byCategory[auto.category] || 0) + 1;
  });

  log('\n📊 Par type:', 'yellow');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    log(`   ${type}: ${count}`);
  });

  log('\n📊 Par catégorie:', 'yellow');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    log(`   ${cat}: ${count}`);
  });

  results.registryValidation.byType = byType;
  results.registryValidation.byCategory = byCategory;

  return registry;
}

/**
 * PHASE 2: Vérification existence des scripts
 */
async function verifyScriptsExistence(registry) {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 2: VÉRIFICATION EXISTENCE DES SCRIPTS', 'bold');
  log('═'.repeat(60), 'blue');

  const withScript = registry.automations.filter(a => a.script);
  const withoutScript = registry.automations.filter(a => !a.script);

  log(`\n📂 Automations avec script: ${withScript.length}`);
  log(`📂 Automations sans script: ${withoutScript.length}`);

  let existing = 0;
  let missing = 0;

  for (const auto of withScript) {
    const scriptPath = path.join(AUTOMATIONS_DIR, auto.script);
    const exists = fs.existsSync(scriptPath);

    if (exists) {
      existing++;
      results.scriptsExistence.existing.push({
        id: auto.id,
        script: auto.script
      });
    } else {
      missing++;
      results.scriptsExistence.missing.push({
        id: auto.id,
        script: auto.script,
        expectedPath: scriptPath
      });
      log(`   ❌ MANQUANT: ${auto.id} → ${auto.script}`, 'red');
    }
  }

  log(`\n✅ Scripts existants: ${existing}/${withScript.length}`, existing === withScript.length ? 'green' : 'yellow');
  log(`❌ Scripts manquants: ${missing}`, missing > 0 ? 'red' : 'green');

  results.scriptsExistence.summary = {
    total: withScript.length,
    existing,
    missing,
    percentage: ((existing / withScript.length) * 100).toFixed(1)
  };

  return results.scriptsExistence;
}

/**
 * PHASE 3: Test des APIs critiques
 */
async function testAPIs() {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 3: TEST DES APIs CRITIQUES', 'bold');
  log('═'.repeat(60), 'blue');

  const apis = {
    klaviyo: {
      envKey: 'KLAVIYO_API_KEY',
      configured: false,
      tested: false,
      works: false
    },
    googleSheets: {
      envKey: 'GOOGLE_APPLICATION_CREDENTIALS',
      configured: false,
      tested: false,
      works: false
    },
    shopify: {
      envKey: 'SHOPIFY_ACCESS_TOKEN',
      configured: false,
      tested: false,
      works: false
    },
    ga4: {
      envKey: 'GA4_PROPERTY_ID',
      configured: false,
      tested: false,
      works: false
    },
    xai: {
      envKey: 'XAI_API_KEY',
      configured: false,
      tested: false,
      works: false
    },
    gemini: {
      envKey: 'GEMINI_API_KEY',
      configured: false,
      tested: false,
      works: false
    }
  };

  for (const [name, config] of Object.entries(apis)) {
    const value = process.env[config.envKey];
    config.configured = !!(value && value.length > 5 && !value.includes('xxx'));

    const status = config.configured ? '✅ Configuré' : '❌ Non configuré';
    log(`\n${name.toUpperCase()}: ${status}`, config.configured ? 'green' : 'red');

    if (config.configured) {
      // Test réel des APIs
      try {
        switch(name) {
          case 'klaviyo':
            config.tested = true;
            const klaviyoRes = await fetch('https://a.klaviyo.com/api/lists', {
              headers: {
                'Authorization': `Klaviyo-API-Key ${value}`,
                'revision': '2024-02-15'
              }
            });
            config.works = klaviyoRes.ok;
            log(`   Test API: ${config.works ? '✅ OK' : '❌ ÉCHEC'} (${klaviyoRes.status})`, config.works ? 'green' : 'red');
            break;

          case 'googleSheets':
            config.tested = true;
            const saExists = fs.existsSync(value);
            config.works = saExists;
            log(`   Service Account: ${saExists ? '✅ Fichier existe' : '❌ Fichier manquant'}`, saExists ? 'green' : 'red');
            break;

          case 'xai':
            config.tested = true;
            const xaiRes = await fetch('https://api.x.ai/v1/models', {
              headers: { 'Authorization': `Bearer ${value}` }
            });
            config.works = xaiRes.ok;
            log(`   Test API: ${config.works ? '✅ OK' : '❌ ÉCHEC'} (${xaiRes.status})`, config.works ? 'green' : 'red');
            break;

          case 'gemini':
            config.tested = true;
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${value}`);
            config.works = geminiRes.ok;
            log(`   Test API: ${config.works ? '✅ OK' : '❌ ÉCHEC'} (${geminiRes.status})`, config.works ? 'green' : 'red');
            break;

          default:
            log(`   Test non implémenté`, 'yellow');
        }
      } catch (err) {
        log(`   Erreur test: ${err.message}`, 'red');
      }
    }
  }

  results.apisStatus = apis;
  return apis;
}

/**
 * PHASE 4: Simulation des scénarios clients
 */
async function simulateClientScenarios() {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 4: SIMULATION DES SCÉNARIOS CLIENTS', 'bold');
  log('═'.repeat(60), 'blue');

  const scenarios = [
    {
      name: 'E-commerce Shopify + Klaviyo',
      description: 'Client e-commerce veut automatiser ses emails',
      requirements: ['Shopify', 'Klaviyo'],
      automationsNeeded: ['welcome-series', 'abandoned-cart', 'post-purchase'],
      status: 'pending'
    },
    {
      name: 'B2B Lead Generation',
      description: 'Client B2B veut générer des leads LinkedIn',
      requirements: ['Apify ou scraping'],
      automationsNeeded: ['sourcing-linkedin', 'lead-scoring', 'email-outreach-sequence'],
      status: 'pending'
    },
    {
      name: 'BTP Local',
      description: 'Artisan BTP veut trouver des clients locaux',
      requirements: ['Google Maps scraping', 'Email'],
      automationsNeeded: ['sourcing-google-maps', 'geo-segmentation'],
      status: 'pending'
    },
    {
      name: 'Voice AI Integration',
      description: 'Client veut le voice widget sur son site',
      requirements: ['Customisation widget', 'Calendar API'],
      automationsNeeded: ['voice-ai-web-widget'],
      status: 'pending'
    },
    {
      name: 'Analytics Dashboard',
      description: 'Client veut un dashboard unifié',
      requirements: ['GA4', 'Google Sheets'],
      automationsNeeded: ['ga4-source-report', 'looker-dashboard'],
      status: 'pending'
    }
  ];

  for (const scenario of scenarios) {
    log(`\n📋 ${scenario.name}`, 'yellow');
    log(`   Description: ${scenario.description}`);

    let canDeliver = true;
    const issues = [];

    // Vérifier les requirements
    for (const req of scenario.requirements) {
      const reqLower = req.toLowerCase();
      if (reqLower.includes('shopify') && !results.apisStatus.shopify?.configured) {
        canDeliver = false;
        issues.push('❌ Shopify non configuré');
      }
      if (reqLower.includes('klaviyo') && !results.apisStatus.klaviyo?.works) {
        canDeliver = false;
        issues.push('❌ Klaviyo non fonctionnel');
      }
      if (reqLower.includes('ga4') && !results.apisStatus.ga4?.configured) {
        canDeliver = false;
        issues.push('❌ GA4 non configuré');
      }
    }

    // Vérifier si les automations existent
    for (const autoId of scenario.automationsNeeded) {
      const exists = results.scriptsExistence.existing.some(s => s.id === autoId);
      if (!exists) {
        // Vérifier si c'est un type sans script (klaviyo-flow, etc.)
        const registry = JSON.parse(fs.readFileSync(AUTOMATIONS_REGISTRY, 'utf8'));
        const auto = registry.automations.find(a => a.id === autoId);
        if (!auto) {
          issues.push(`⚠️ Automation non trouvée: ${autoId}`);
        } else if (auto.script && !results.scriptsExistence.existing.some(s => s.id === autoId)) {
          issues.push(`⚠️ Script manquant: ${autoId}`);
        }
      }
    }

    scenario.status = canDeliver && issues.length === 0 ? 'ready' : (issues.length > 2 ? 'blocked' : 'partial');
    scenario.issues = issues;

    const statusEmoji = scenario.status === 'ready' ? '✅' : (scenario.status === 'partial' ? '⚠️' : '❌');
    log(`   Status: ${statusEmoji} ${scenario.status.toUpperCase()}`, scenario.status === 'ready' ? 'green' : (scenario.status === 'partial' ? 'yellow' : 'red'));

    if (issues.length > 0) {
      issues.forEach(issue => log(`      ${issue}`, 'red'));
    }

    results.clientScenarios.push(scenario);
  }

  return scenarios;
}

/**
 * PHASE 5: Audit Voice Widget
 */
async function auditVoiceWidget() {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 5: AUDIT VOICE WIDGET', 'bold');
  log('═'.repeat(60), 'blue');

  const widgetPath = path.join(__dirname, '../landing-page-hostinger/voice-assistant/voice-widget.min.js');
  const knowledgePath = path.join(__dirname, '../landing-page-hostinger/voice-assistant/knowledge.json');

  const widgetExists = fs.existsSync(widgetPath);
  const knowledgeExists = fs.existsSync(knowledgePath);

  log(`\n📦 Widget minifié: ${widgetExists ? '✅ Existe' : '❌ Manquant'}`, widgetExists ? 'green' : 'red');
  log(`📚 Knowledge base: ${knowledgeExists ? '✅ Existe' : '❌ Manquant'}`, knowledgeExists ? 'green' : 'red');

  // Vérifier l'intégration sur les pages
  const pagesDir = path.join(__dirname, '../landing-page-hostinger');
  const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
  let pagesWithWidget = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    if (content.includes('voice-widget')) {
      pagesWithWidget++;
    }
  }

  log(`\n📄 Pages avec widget: ${pagesWithWidget}/${htmlFiles.length}`, 'yellow');

  // Vérifier le booking endpoint
  const bookingUrl = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec';
  let bookingWorks = false;

  try {
    const response = await fetch(`${bookingUrl}?action=availability`);
    bookingWorks = response.ok;
    log(`\n📅 Booking API: ${bookingWorks ? '✅ Répond' : '❌ Échec'} (${response.status})`, bookingWorks ? 'green' : 'red');
  } catch (err) {
    log(`\n📅 Booking API: ❌ Erreur: ${err.message}`, 'red');
  }

  results.voiceWidgetAudit = {
    widgetExists,
    knowledgeExists,
    pagesWithWidget,
    totalPages: htmlFiles.length,
    bookingApiWorks: bookingWorks
  };

  // Analyse des limitations
  log('\n⚠️ LIMITATIONS IDENTIFIÉES:', 'yellow');
  log('   • Web Speech API: Chrome/Edge uniquement (Firefox/Safari = texte)');
  log('   • Booking: Dépend de Google Apps Script (latence possible)');
  log('   • Personnalisation: Nécessite modification du code source');

  results.voiceWidgetAudit.limitations = [
    'Web Speech API limité à Chrome/Edge',
    'Booking dépend de Google Apps Script',
    'Personnalisation nécessite modification code'
  ];

  return results.voiceWidgetAudit;
}

/**
 * PHASE 6: Méthodologie d'implémentation
 */
async function analyzeImplementationMethodology() {
  log('\n' + '═'.repeat(60), 'blue');
  log('PHASE 6: MÉTHODOLOGIE D\'IMPLÉMENTATION', 'bold');
  log('═'.repeat(60), 'blue');

  const methodology = {
    voiceWidget: {
      name: 'Voice Widget chez Client',
      steps: [
        '1. Copier voice-widget.min.js sur le serveur client',
        '2. Créer config.js avec personnalisation (couleurs, textes)',
        '3. Ajouter script dans <body> des pages',
        '4. Configurer Google Apps Script pour booking (si différent)',
        '5. Créer knowledge.json avec données client',
        '6. Tester sur Chrome/Edge',
        '7. Ajouter fallback texte pour Firefox/Safari'
      ],
      effort: 'Moyen (2-4h)',
      prerequisites: ['Accès FTP/SSH au site client', 'Google Calendar client (si booking)'],
      blockers: ['Pas de templates de config prêts', 'Personnalisation manuelle requise']
    },
    klaviyoFlows: {
      name: 'Flows Klaviyo',
      steps: [
        '1. Accès admin Klaviyo client',
        '2. Exporter templates depuis compte demo',
        '3. Importer dans compte client',
        '4. Adapter contenu (logo, textes, liens)',
        '5. Configurer triggers (Shopify events)',
        '6. Activer en mode test',
        '7. Valider et activer en production'
      ],
      effort: 'Faible (1-2h par flow)',
      prerequisites: ['Accès Klaviyo client', 'Intégration Shopify active'],
      blockers: []
    },
    n8nWorkflows: {
      name: 'Workflows n8n',
      steps: [
        '1. Exporter workflow JSON depuis n8n agence',
        '2. Importer dans n8n client OU utiliser n8n agence',
        '3. Configurer credentials client',
        '4. Adapter les webhooks URLs',
        '5. Tester en mode manuel',
        '6. Activer production'
      ],
      effort: 'Moyen à élevé (2-8h selon complexité)',
      prerequisites: ['n8n client OU partage n8n agence', 'Credentials APIs client'],
      blockers: ['Client doit avoir n8n ou utiliser notre instance']
    },
    scriptsCustom: {
      name: 'Scripts .cjs Personnalisés',
      steps: [
        '1. Copier script depuis repo agence',
        '2. Créer .env client avec credentials',
        '3. Installer dépendances npm',
        '4. Adapter configurations spécifiques',
        '5. Tester en dry-run',
        '6. Configurer cron ou scheduler',
        '7. Monitorer les premières exécutions'
      ],
      effort: 'Élevé (4-8h)',
      prerequisites: ['Serveur client avec Node.js', 'Accès SSH', 'Credentials APIs'],
      blockers: ['Beaucoup de scripts hardcodés', 'Pas de système de config générique']
    }
  };

  for (const [key, method] of Object.entries(methodology)) {
    log(`\n📌 ${method.name}`, 'yellow');
    log(`   Effort: ${method.effort}`);
    log(`   Prérequis: ${method.prerequisites.join(', ') || 'Aucun'}`);
    if (method.blockers.length > 0) {
      log(`   ⚠️ Blockers: ${method.blockers.join(', ')}`, 'red');
    }
  }

  results.implementationMethodology = methodology;
  return methodology;
}

/**
 * PHASE 7: Génération du rapport final
 */
async function generateFinalReport() {
  log('\n' + '═'.repeat(60), 'blue');
  log('RAPPORT FINAL - AUDIT CLIENT JOURNEY S104', 'bold');
  log('═'.repeat(60), 'blue');

  // Calcul des métriques
  const scriptsScore = parseFloat(results.scriptsExistence.summary.percentage) || 0;
  const apisConfigured = Object.values(results.apisStatus).filter(a => a.configured).length;
  const apisWorking = Object.values(results.apisStatus).filter(a => a.works).length;
  const scenariosReady = results.clientScenarios.filter(s => s.status === 'ready').length;

  log('\n📊 MÉTRIQUES CLÉS:', 'bold');
  log(`   Scripts existants: ${results.scriptsExistence.summary.existing}/${results.scriptsExistence.summary.total} (${scriptsScore}%)`);
  log(`   APIs configurées: ${apisConfigured}/6`);
  log(`   APIs fonctionnelles: ${apisWorking}/6`);
  log(`   Scénarios prêts: ${scenariosReady}/${results.clientScenarios.length}`);
  log(`   Voice Widget: ${results.voiceWidgetAudit.widgetExists && results.voiceWidgetAudit.bookingApiWorks ? '✅ Opérationnel' : '⚠️ Partiel'}`);

  // Score global
  const globalScore = (
    (scriptsScore * 0.3) +
    ((apisWorking / 6) * 100 * 0.3) +
    ((scenariosReady / results.clientScenarios.length) * 100 * 0.25) +
    (results.voiceWidgetAudit.bookingApiWorks ? 100 : 0) * 0.15
  );

  log(`\n🎯 SCORE GLOBAL: ${globalScore.toFixed(1)}%`, globalScore >= 70 ? 'green' : (globalScore >= 50 ? 'yellow' : 'red'));

  // Recommandations
  log('\n💡 RECOMMANDATIONS PRIORITAIRES:', 'yellow');

  if (!results.apisStatus.shopify?.configured) {
    results.recommendations.push('CRITIQUE: Créer Shopify Dev Store sur partners.shopify.com');
    log('   1. CRITIQUE: Créer Shopify Dev Store', 'red');
  }

  if (results.scriptsExistence.missing.length > 0) {
    results.recommendations.push(`Créer ${results.scriptsExistence.missing.length} scripts manquants`);
    log(`   2. Créer ${results.scriptsExistence.missing.length} scripts manquants`, 'yellow');
  }

  if (!results.apisStatus.googleSheets?.works) {
    results.recommendations.push('Configurer Google Service Account correctement');
    log('   3. Configurer Google Service Account', 'yellow');
  }

  results.recommendations.push('Créer templates de configuration pour déploiement client');
  log('   4. Créer templates de config pour déploiement client', 'yellow');

  results.recommendations.push('Documenter le processus d\'onboarding client');
  log('   5. Documenter le processus d\'onboarding client', 'yellow');

  results.summary = {
    scriptsScore,
    apisConfigured,
    apisWorking,
    scenariosReady,
    globalScore: globalScore.toFixed(1),
    date: new Date().toISOString()
  };

  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '../outputs/audit-client-journey-s104.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'blue');

  return results;
}

// Main
async function main() {
  log('\n' + '╔'.padEnd(59, '═') + '╗', 'bold');
  log(' ║   AUDIT CLIENT JOURNEY - 3A AUTOMATION - SESSION 104   ║', 'bold');
  log(' ╚' + '═'.repeat(58) + '╝', 'bold');
  log(`\n📅 Date: ${new Date().toISOString()}`);
  log(`📂 Working dir: ${process.cwd()}`);

  try {
    const registry = await validateRegistry();
    await verifyScriptsExistence(registry);
    await testAPIs();
    await simulateClientScenarios();
    await auditVoiceWidget();
    await analyzeImplementationMethodology();
    await generateFinalReport();

    log('\n' + '═'.repeat(60), 'green');
    log('AUDIT TERMINÉ AVEC SUCCÈS', 'green');
    log('═'.repeat(60), 'green');

    process.exit(0);
  } catch (error) {
    log(`\n❌ ERREUR FATALE: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
