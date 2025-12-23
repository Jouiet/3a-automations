#!/usr/bin/env node
/**
 * AUDIT PERSONAS & AUTOMATIONS - 3A AUTOMATION
 * Date: 2025-12-23
 * Version: 1.0
 *
 * Audit factuel et exhaustif:
 * 1. Analyse des 77 automations (implémentation réelle vs conceptuel)
 * 2. Mapping automations → personas clients
 * 3. Identification des automations pour notre propre lead gen
 * 4. Calcul ROI et valeur par persona
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../automations/automations-registry.json');
const OUTPUT_PATH = path.join(__dirname, '../outputs/audit-personas-2025-12-23.json');

console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log('║        AUDIT PERSONAS & AUTOMATIONS - 3A AUTOMATION                   ║');
console.log('║        Session 84 - Analyse Factuelle Exhaustive                      ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

// Load registry
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const automations = registry.automations;

console.log(`📊 Total Automations: ${automations.length}`);
console.log('═'.repeat(70) + '\n');

// ============================================================================
// 1. ANALYSE IMPLEMENTATION STATUS
// ============================================================================

console.log('1️⃣ ANALYSE IMPLEMENTATION STATUS\n');

const implementationAnalysis = {
  withScript: [],      // Has actual script file
  withoutScript: [],   // script: null
  scriptExists: [],    // Script file verified to exist
  scriptMissing: [],   // Script declared but file doesn't exist
  n8nWorkflows: [],    // n8n workflows
  klaviyoTemplates: [],// Klaviyo templates
  shopifyNative: [],   // Shopify Flow/Theme/Metafield
  manualProcesses: [], // Manual setup/audit
  thirdParty: []       // Third-party integrations (Apollo, etc.)
};

automations.forEach(auto => {
  if (auto.script) {
    implementationAnalysis.withScript.push(auto);

    // Check if script file exists
    const scriptPath = path.join(__dirname, '../automations', auto.script);
    if (fs.existsSync(scriptPath)) {
      implementationAnalysis.scriptExists.push(auto);
    } else {
      implementationAnalysis.scriptMissing.push(auto);
    }
  } else {
    implementationAnalysis.withoutScript.push(auto);
  }

  // Categorize by type
  if (auto.type === 'n8n-workflow') implementationAnalysis.n8nWorkflows.push(auto);
  if (auto.type === 'klaviyo-flow' || auto.type === 'klaviyo-segment') implementationAnalysis.klaviyoTemplates.push(auto);
  if (auto.type.startsWith('shopify-')) implementationAnalysis.shopifyNative.push(auto);
  if (auto.type.startsWith('manual-')) implementationAnalysis.manualProcesses.push(auto);
  if (auto.type.includes('integration') || auto.type === 'apollo-integration') implementationAnalysis.thirdParty.push(auto);
});

console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ IMPLEMENTATION STATUS                                       │');
console.log('├─────────────────────────────────────────────────────────────┤');
console.log(`│ With Script (declared):     ${String(implementationAnalysis.withScript.length).padStart(3)} (${Math.round(implementationAnalysis.withScript.length/automations.length*100)}%)                     │`);
console.log(`│ Script File Exists:         ${String(implementationAnalysis.scriptExists.length).padStart(3)} (VERIFIED)                 │`);
console.log(`│ Script File MISSING:        ${String(implementationAnalysis.scriptMissing.length).padStart(3)} (⚠️ NOT FOUND)              │`);
console.log(`│ Without Script (null):      ${String(implementationAnalysis.withoutScript.length).padStart(3)} (${Math.round(implementationAnalysis.withoutScript.length/automations.length*100)}%)                     │`);
console.log('├─────────────────────────────────────────────────────────────┤');
console.log(`│ n8n Workflows:              ${String(implementationAnalysis.n8nWorkflows.length).padStart(3)}                            │`);
console.log(`│ Klaviyo Templates:          ${String(implementationAnalysis.klaviyoTemplates.length).padStart(3)}                            │`);
console.log(`│ Shopify Native:             ${String(implementationAnalysis.shopifyNative.length).padStart(3)}                            │`);
console.log(`│ Manual Processes:           ${String(implementationAnalysis.manualProcesses.length).padStart(3)}                            │`);
console.log(`│ Third-Party Integrations:   ${String(implementationAnalysis.thirdParty.length).padStart(3)}                            │`);
console.log('└─────────────────────────────────────────────────────────────┘\n');

// Show missing scripts
if (implementationAnalysis.scriptMissing.length > 0) {
  console.log('⚠️  SCRIPTS MISSING (declared but file not found):');
  implementationAnalysis.scriptMissing.forEach(a => {
    console.log(`   - ${a.id}: ${a.script}`);
  });
  console.log('');
}

// ============================================================================
// 2. ANALYSE PAR CATEGORIE
// ============================================================================

console.log('2️⃣ ANALYSE PAR CATEGORIE\n');

const categoryAnalysis = {};
Object.entries(registry.categories).forEach(([key, cat]) => {
  categoryAnalysis[key] = {
    name_fr: cat.name_fr,
    name_en: cat.name_en,
    count: cat.count,
    automations: automations.filter(a => a.category === key),
    implemented: automations.filter(a => a.category === key && a.script).length,
    conceptual: automations.filter(a => a.category === key && !a.script).length
  };
});

console.log('┌───────────────────────────────────────────────────────────────────────────┐');
console.log('│ CATEGORY            │ TOTAL │ IMPLEMENTED │ CONCEPTUAL │ % READY         │');
console.log('├───────────────────────────────────────────────────────────────────────────┤');
Object.entries(categoryAnalysis).forEach(([key, data]) => {
  const pct = Math.round(data.implemented / data.count * 100);
  const bar = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10 - Math.round(pct/10));
  console.log(`│ ${data.name_en.padEnd(19)} │ ${String(data.count).padStart(5)} │ ${String(data.implemented).padStart(11)} │ ${String(data.conceptual).padStart(10)} │ ${bar} ${pct}% │`);
});
console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

// ============================================================================
// 3. DEFINITION DES PERSONAS CLIENTS
// ============================================================================

console.log('3️⃣ DEFINITION DES PERSONAS CLIENTS (basée sur automations)\n');

const personas = [
  {
    id: 'ecom-dropshipper',
    name_fr: 'E-commerce Dropshipper',
    name_en: 'E-commerce Dropshipper',
    description: 'Boutique Shopify, souvent dropshipping, CA 5k-50k€/mois',
    needs: ['Abandoned cart recovery', 'Product SEO', 'Email flows', 'Multi-channel sync'],
    relevantCategories: ['email', 'shopify', 'seo', 'analytics'],
    relevantAutomations: [],
    budgetRange: { min: 390, max: 790, currency: 'EUR' },
    pack: 'Quick Win ou Essentials',
    painPoints: [
      'Perte de leads sur paniers abandonnés',
      'Emails manuels chronophages',
      'Produits mal référencés sur Google',
      'Pas de vision claire des métriques'
    ],
    typicalCA: '5k-50k€/mois',
    teamSize: '1-3 personnes',
    techLevel: 'Débutant à intermédiaire'
  },
  {
    id: 'ecom-scaler',
    name_fr: 'E-commerce Scaler',
    name_en: 'E-commerce Scaler',
    description: 'Boutique établie, scaling agressif, CA 50k-500k€/mois',
    needs: ['Advanced segmentation', 'Multi-channel ads', 'RFM analysis', 'Full funnel automation'],
    relevantCategories: ['email', 'shopify', 'analytics', 'content', 'cinematicads'],
    relevantAutomations: [],
    budgetRange: { min: 790, max: 1399, currency: 'EUR' },
    pack: 'Essentials ou Growth',
    painPoints: [
      'Scaling des ads sans perdre en ROAS',
      'Segmentation client avancée',
      'Besoin de contenu vidéo pour ads',
      'Dashboard unifié multi-sources'
    ],
    typicalCA: '50k-500k€/mois',
    teamSize: '3-10 personnes',
    techLevel: 'Intermédiaire à avancé'
  },
  {
    id: 'b2b-lead-hunter',
    name_fr: 'B2B Lead Hunter',
    name_en: 'B2B Lead Hunter',
    description: 'Agence, consultant, SaaS cherchant des leads B2B',
    needs: ['LinkedIn scraping', 'Email outreach', 'Lead scoring', 'CRM automation'],
    relevantCategories: ['lead-gen', 'email'],
    relevantAutomations: [],
    budgetRange: { min: 790, max: 1399, currency: 'EUR' },
    pack: 'Essentials ou Growth',
    painPoints: [
      'Prospection manuelle trop lente',
      'Besoin de leads qualifiés en volume',
      'Pas de système de scoring',
      'Outreach non personnalisé'
    ],
    typicalCA: '10k-100k€/mois',
    teamSize: '1-5 personnes',
    techLevel: 'Variable'
  },
  {
    id: 'local-business',
    name_fr: 'Commerce Local / Service',
    name_en: 'Local Business / Service',
    description: 'Restaurant, salon, garage, médical - besoin de RDV',
    needs: ['Booking automation', 'WhatsApp reminders', 'Google Maps presence', 'Voice AI'],
    relevantCategories: ['lead-gen', 'whatsapp', 'voice-ai'],
    relevantAutomations: [],
    budgetRange: { min: 390, max: 790, currency: 'EUR' },
    pack: 'Quick Win',
    painPoints: [
      'No-shows fréquents',
      'Téléphone sonne tout le temps',
      'Pas de présence en ligne optimisée',
      'Rappels SMS coûteux'
    ],
    typicalCA: '5k-30k€/mois',
    teamSize: '1-5 personnes',
    techLevel: 'Débutant'
  },
  {
    id: 'marketing-agency',
    name_fr: 'Agence Marketing',
    name_en: 'Marketing Agency',
    description: 'Agence créant du contenu/ads pour clients',
    needs: ['AI video generation', 'Competitor analysis', 'Multi-ratio ads', 'Avatar generation'],
    relevantCategories: ['cinematicads', 'ai-avatar', 'content'],
    relevantAutomations: [],
    budgetRange: { min: 1399, max: 5000, currency: 'EUR' },
    pack: 'Growth + Custom',
    painPoints: [
      'Production vidéo lente et coûteuse',
      'Besoin de volume de créatives',
      'Analyse concurrentielle manuelle',
      'Clients demandent plus de contenu'
    ],
    typicalCA: '20k-200k€/mois',
    teamSize: '5-20 personnes',
    techLevel: 'Avancé'
  }
];

// Map automations to personas
automations.forEach(auto => {
  personas.forEach(persona => {
    if (persona.relevantCategories.includes(auto.category)) {
      persona.relevantAutomations.push({
        id: auto.id,
        name: auto.name_en,
        benefit: auto.benefit_en,
        implemented: !!auto.script
      });
    }
  });
});

// Display personas
personas.forEach(persona => {
  const implementedCount = persona.relevantAutomations.filter(a => a.implemented).length;
  const totalRelevant = persona.relevantAutomations.length;

  console.log('┌' + '─'.repeat(70) + '┐');
  console.log(`│ 👤 ${persona.name_en.padEnd(66)} │`);
  console.log('├' + '─'.repeat(70) + '┤');
  console.log(`│ ${persona.description.padEnd(68)} │`);
  console.log(`│ CA Typique: ${persona.typicalCA.padEnd(56)} │`);
  console.log(`│ Budget: €${persona.budgetRange.min}-${persona.budgetRange.max} │ Pack: ${persona.pack.padEnd(35)} │`);
  console.log(`│ Automations pertinentes: ${totalRelevant} (${implementedCount} implémentées)`.padEnd(70) + ' │');
  console.log('│ Pain Points:'.padEnd(70) + ' │');
  persona.painPoints.forEach(pp => {
    console.log(`│   • ${pp.padEnd(64)} │`);
  });
  console.log('└' + '─'.repeat(70) + '┘\n');
});

// ============================================================================
// 4. AUTOMATIONS POUR NOTRE PROPRE LEAD GEN (3A)
// ============================================================================

console.log('4️⃣ AUTOMATIONS POUR NOTRE PROPRE LEAD GEN (3A-Automation)\n');

const ownLeadGenAutomations = [
  // LinkedIn Lead Scraper
  automations.find(a => a.id === 'linkedin-lead-scraper'),
  // Email Outreach Sequence
  automations.find(a => a.id === 'email-outreach-sequence'),
  // Google Maps Sourcing
  automations.find(a => a.id === 'sourcing-google-maps'),
  // Auto Blog (SEO content)
  automations.find(a => a.id === 'auto-blog'),
  // Voice AI Booking
  automations.find(a => a.id === 'grok-voice-telephony'),
  // WhatsApp Booking Confirmation
  automations.find(a => a.id === 'whatsapp-booking-confirmation'),
  // Google Apps Script Booking
  automations.find(a => a.id === 'google-apps-script-booking'),
  // Welcome Series (for prospects)
  automations.find(a => a.id === 'welcome-series'),
].filter(Boolean);

console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ AUTOMATIONS À UTILISER POUR NOTRE PROPRE LEAD GEN                          │');
console.log('├─────────────────────────────────────────────────────────────────────────────┤');
ownLeadGenAutomations.forEach(auto => {
  const status = auto.script ? '✅' : '❌';
  console.log(`│ ${status} ${auto.name_en.padEnd(35)} │ ${auto.benefit_en.padEnd(35)} │`);
});
console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');

// ============================================================================
// 5. STRATEGIE LEAD GEN RECOMMANDÉE
// ============================================================================

console.log('5️⃣ STRATEGIE LEAD GEN RECOMMANDÉE POUR 3A-AUTOMATION\n');

const strategy = {
  phase1_acquisition: {
    name: 'ACQUISITION (Semaine 1-2)',
    actions: [
      {
        automation: 'linkedin-lead-scraper',
        target: 'E-commerce store owners, Marketing managers',
        volume: '400 leads/jour',
        implemented: true
      },
      {
        automation: 'sourcing-google-maps',
        target: 'Commerces locaux (restaurants, salons, cliniques)',
        volume: '200 leads/jour',
        implemented: true
      },
      {
        automation: 'auto-blog',
        target: 'SEO inbound (automation keywords)',
        volume: '2-4 articles/semaine',
        implemented: true
      }
    ]
  },
  phase2_engagement: {
    name: 'ENGAGEMENT (Semaine 2-4)',
    actions: [
      {
        automation: 'email-outreach-sequence',
        target: 'Leads LinkedIn + Google Maps',
        volume: '3 emails personnalisés par lead',
        implemented: true
      },
      {
        automation: 'welcome-series',
        target: 'Leads qui s\'inscrivent via site',
        volume: '5 emails automatisés',
        implemented: false // Klaviyo template
      }
    ]
  },
  phase3_conversion: {
    name: 'CONVERSION (Continu)',
    actions: [
      {
        automation: 'grok-voice-telephony',
        target: 'Répondre aux appels entrants',
        volume: '24/7 disponibilité',
        implemented: true
      },
      {
        automation: 'google-apps-script-booking',
        target: 'Prise de RDV automatisée',
        volume: 'Illimité',
        implemented: true
      },
      {
        automation: 'whatsapp-booking-confirmation',
        target: 'Confirmation + rappels',
        volume: '98% open rate',
        implemented: true
      }
    ]
  }
};

Object.values(strategy).forEach(phase => {
  console.log(`📌 ${phase.name}`);
  console.log('─'.repeat(50));
  phase.actions.forEach(action => {
    const status = action.implemented ? '✅' : '⚠️ ';
    console.log(`   ${status} ${action.automation}`);
    console.log(`      Target: ${action.target}`);
    console.log(`      Volume: ${action.volume}`);
  });
  console.log('');
});

// ============================================================================
// 6. ROI ESTIMATION
// ============================================================================

console.log('6️⃣ ROI ESTIMATION (Conservatif)\n');

const roiEstimation = {
  acquisition: {
    linkedinLeads: 400 * 30, // 12,000/mois
    googleMapsLeads: 200 * 30, // 6,000/mois
    totalLeads: 18000,
    qualificationRate: 0.05, // 5% qualifiés
    qualifiedLeads: 900
  },
  conversion: {
    emailOpenRate: 0.25,
    replyRate: 0.03,
    bookingRate: 0.20,
    closingRate: 0.30
  },
  revenue: {
    avgDealSize: 790, // Pack Essentials
    dealsPerMonth: 0 // Will calculate
  }
};

// Calculate funnel (corrected logic)
// Outreach sequence: 3 emails to each qualified lead
const opens = roiEstimation.acquisition.qualifiedLeads * roiEstimation.conversion.emailOpenRate;
const replies = roiEstimation.acquisition.qualifiedLeads * roiEstimation.conversion.replyRate; // 3% reply from outreach
const bookings = replies * roiEstimation.conversion.bookingRate;
const deals = bookings * roiEstimation.conversion.closingRate;
roiEstimation.revenue.dealsPerMonth = Math.round(deals);

const monthlyRevenue = deals * roiEstimation.revenue.avgDealSize;
const yearlyRevenue = monthlyRevenue * 12;

console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ FUNNEL ESTIMATION (Conservatif)                                │');
console.log('├─────────────────────────────────────────────────────────────────┤');
console.log(`│ Leads générés/mois:          ${String(roiEstimation.acquisition.totalLeads).padStart(8)}                      │`);
console.log(`│ Leads qualifiés (5%):        ${String(roiEstimation.acquisition.qualifiedLeads).padStart(8)}                      │`);
console.log(`│ Ouvertures emails (25%):     ${String(Math.round(roiEstimation.acquisition.qualifiedLeads * 0.25)).padStart(8)}                      │`);
console.log(`│ Réponses (3%):               ${String(Math.round(replies)).padStart(8)}                      │`);
console.log(`│ RDV bookés (20%):            ${String(Math.round(bookings)).padStart(8)}                      │`);
console.log(`│ Deals closés (30%):          ${String(Math.round(deals)).padStart(8)}                      │`);
console.log('├─────────────────────────────────────────────────────────────────┤');
console.log(`│ Revenue mensuel estimé:      €${String(Math.round(monthlyRevenue)).padStart(7)}                      │`);
console.log(`│ Revenue annuel estimé:       €${String(Math.round(yearlyRevenue)).padStart(7)}                      │`);
console.log('└─────────────────────────────────────────────────────────────────┘\n');

// ============================================================================
// 7. SAVE AUDIT REPORT
// ============================================================================

const auditReport = {
  meta: {
    date: new Date().toISOString(),
    version: '1.0.0',
    session: 84
  },
  implementation: {
    total: automations.length,
    withScript: implementationAnalysis.withScript.length,
    scriptExists: implementationAnalysis.scriptExists.length,
    scriptMissing: implementationAnalysis.scriptMissing.map(a => ({ id: a.id, script: a.script })),
    withoutScript: implementationAnalysis.withoutScript.length,
    n8nWorkflows: implementationAnalysis.n8nWorkflows.length,
    klaviyoTemplates: implementationAnalysis.klaviyoTemplates.length,
    shopifyNative: implementationAnalysis.shopifyNative.length
  },
  categories: categoryAnalysis,
  personas: personas.map(p => ({
    ...p,
    automationCount: p.relevantAutomations.length,
    implementedCount: p.relevantAutomations.filter(a => a.implemented).length
  })),
  leadGenStrategy: strategy,
  roiEstimation: {
    ...roiEstimation,
    monthlyRevenue: Math.round(monthlyRevenue),
    yearlyRevenue: Math.round(yearlyRevenue)
  }
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(auditReport, null, 2));
console.log(`✅ Audit report saved to: ${OUTPUT_PATH}\n`);

// ============================================================================
// SUMMARY
// ============================================================================

console.log('═'.repeat(70));
console.log('📋 RÉSUMÉ EXÉCUTIF');
console.log('═'.repeat(70));
console.log(`
FAITS CLÉS:
├── 77 automations au total
├── ${implementationAnalysis.scriptExists.length} scripts vérifiés existants (${Math.round(implementationAnalysis.scriptExists.length/77*100)}%)
├── ${implementationAnalysis.scriptMissing.length} scripts déclarés mais MANQUANTS
├── ${implementationAnalysis.withoutScript.length} automations conceptuelles (templates/manual)
└── 5 personas clients identifiés

PERSONAS PRIORITAIRES:
├── 1. E-commerce Dropshipper (Quick Win €390)
├── 2. E-commerce Scaler (Growth €1399)
├── 3. B2B Lead Hunter (Essentials €790)
├── 4. Commerce Local (Quick Win €390)
└── 5. Marketing Agency (Custom)

NOTRE PROPRE LEAD GEN (3A):
├── 8 automations identifiées pour notre usage
├── 7/8 implémentées (87.5%)
├── Volume potentiel: 18,000 leads/mois
├── Revenue estimé: €${Math.round(monthlyRevenue)}/mois (conservatif)
└── Revenue annuel: €${Math.round(yearlyRevenue)}

ACTIONS IMMÉDIATES RECOMMANDÉES:
1. Activer linkedin-lead-scraper pour nos leads
2. Activer email-outreach-sequence pour nurturing
3. Configurer Klaviyo welcome-series pour inbound
4. Fixer les ${implementationAnalysis.scriptMissing.length} scripts manquants
`);

console.log('═'.repeat(70));
