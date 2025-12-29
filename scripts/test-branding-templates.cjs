#!/usr/bin/env node
/**
 * TEST BRANDING TEMPLATES - Vérification EXHAUSTIVE
 * Vérifie la conformité au guide branding.md
 *
 * Règles vérifiées:
 * 1. NOUS (jamais "je")
 * 2. Signature = "L'équipe 3A Automation"
 * 3. Tagline = "Automation. Analytics. AI."
 * 4. URL = "https://3a-automation.com"
 * 5. Pas de hype words
 * 6. Structure correcte
 * 7. Placeholders présents
 * 8. Tone professionnel
 */

// ========================================
// BRANDING OFFICIEL (Source: docs/branding.md)
// ========================================

const BRANDING = {
  // Identité
  name: "3A Automation",
  fullName: "3A Automation",
  tagline: "Automation. Analytics. AI.",
  website: "https://3a-automation.com",

  // Couleurs principales
  colors: {
    primary: "#4FBAF1",      // Cyan Primary
    primaryDark: "#2B6685",  // Teal Blue
    secondary: "#191E35",    // Navy Deep
    textLight: "#E4F4FC",    // Ice White
    success: "#10B981",      // Green
  },

  // Signature email
  signature: "L'équipe 3A Automation",

  // Mots-clés de marque
  keywords: ["Automation", "Analytics", "AI", "3A", "API", "Integration", "Workflow"],

  // Mots interdits (hype)
  forbidden_hype: [
    "révolutionnaire", "incroyable", "extraordinaire", "magique",
    "meilleur du monde", "garantie", "secret", "miracle",
    "explosif", "inégalé", "unique au monde"
  ],

  // Ton interdit (première personne)
  forbidden_je: [" je ", "j'", " mon ", " ma ", " mes "],
};

// ========================================
// EMAIL TEMPLATES (from pipeline)
// ========================================

const EMAIL_TEMPLATES = {
  decision_maker: {
    subject: "{{first_name}} - Automatisation pour {{company}}",
    body: `Bonjour {{first_name}},

Nous avons identifié {{company}} comme une entreprise qui pourrait bénéficier de nos solutions d'automatisation.

3A Automation aide les dirigeants e-commerce et PME B2B à :
• Automatiser les tâches répétitives (reporting, emails, data sync)
• Récupérer 10-15h par semaine sur les processus manuels
• Connecter leurs outils existants sans friction

Résultat typique : nos clients obtiennent un ROI de 25%+ sur leur revenue email et éliminent les tâches manuelles chronophages.

Seriez-vous disponible pour un échange de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  marketing: {
    subject: "{{first_name}} - Automatisation marketing pour {{company}}",
    body: `Bonjour {{first_name}},

En tant que professionnel du marketing chez {{company}}, vous connaissez le temps perdu sur les tâches répétitives.

3A Automation accompagne les équipes marketing pour :
• Automatiser newsletters et séquences email (gain: 8h/semaine)
• Synchroniser CRM ↔ Outils marketing en temps réel
• Créer des dashboards analytics automatisés
• Optimiser les flows Klaviyo et HubSpot

Notre expertise : Klaviyo, HubSpot, et les intégrations e-commerce.

Intéressé(e) par une démo de 15 minutes adaptée à {{company}} ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  sales: {
    subject: "{{first_name}} - Automatisation prospection {{company}}",
    body: `Bonjour {{first_name}},

Les équipes commerciales perdent en moyenne 20% de leur temps sur des tâches administratives.

3A Automation propose des solutions pour :
• Automatiser la prospection LinkedIn et l'enrichissement de leads
• Créer des séquences d'emails de suivi personnalisées
• Synchroniser automatiquement les données CRM
• Déclencher des relances intelligentes basées sur l'engagement

Résultat typique : +30% de temps dédié à la vente pure.

Souhaitez-vous voir comment {{company}} pourrait en bénéficier ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  tech: {
    subject: "{{first_name}} - APIs & Automations pour {{company}}",
    body: `Bonjour {{first_name}},

En tant que profil tech chez {{company}}, vous apprécierez notre approche technique :

• Intégrations API robustes (REST, webhooks, GraphQL)
• Workflows n8n et scripts Node.js maintenables
• Architecture event-driven et scalable
• Documentation technique complète

Notre stack : n8n, Apify, Claude, Gemini, Klaviyo, Shopify.

Résultat : 90% de réduction du temps d'intégration grâce à notre approche hybride code + low-code.

Seriez-vous disponible pour un échange technique de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  hr: {
    subject: "{{first_name}} - Automatisation RH pour {{company}}",
    body: `Bonjour {{first_name}},

Les équipes RH passent des heures sur des tâches répétitives :

• Tri de CVs et réponses automatiques → Automatisable
• Planification d'entretiens → Automatisable
• Onboarding des nouveaux collaborateurs → Automatisable
• Processus de recrutement et suivi des candidatures → Automatisable

Nos clients RH ont réduit de 60% leur temps admin grâce à nos automations.

Intéressé(e) par une discussion sur les besoins de {{company}} ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  other: {
    subject: "{{first_name}} - Automatisation pour {{company}}",
    body: `Bonjour {{first_name}},

3A Automation est une agence spécialisée en automatisation AI pour l'e-commerce et les PME B2B.

Nos domaines d'expertise :
• Email & Marketing Automation (Klaviyo, HubSpot)
• Intégrations et synchronisation de données
• Lead Generation & Nurturing automatisé
• Workflows métier sur mesure

Nos clients récupèrent 10-20h/semaine et augmentent leur revenue email de 25%+.

Seriez-vous disponible pour un échange de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },
};

// ========================================
// PERSONA REQUIREMENTS (What each segment should emphasize)
// ========================================

const PERSONA_REQUIREMENTS = {
  decision_maker: {
    must_contain: ["dirigeants", "ROI", "revenue", "clients"],
    should_mention: ["15 minutes", "25%"],
    target_pain: "temps perdu sur tâches manuelles"
  },
  marketing: {
    must_contain: ["Klaviyo", "marketing", "email", "analytics"],
    should_mention: ["8h/semaine", "HubSpot"],
    target_pain: "tâches répétitives marketing"
  },
  sales: {
    must_contain: ["prospection", "CRM", "vente", "leads"],
    should_mention: ["30%", "LinkedIn"],
    target_pain: "temps administratif vs vente"
  },
  tech: {
    must_contain: ["API", "n8n", "technique", "stack"],
    should_mention: ["Node.js", "webhooks"],
    target_pain: "intégrations complexes"
  },
  hr: {
    must_contain: ["RH", "CV", "recrutement", "onboarding"],
    should_mention: ["60%", "entretiens"],
    target_pain: "tâches admin RH"
  },
  other: {
    must_contain: ["e-commerce", "PME B2B", "expertise"],
    should_mention: ["10-20h", "25%"],
    target_pain: "automatisation générique"
  }
};

// ========================================
// VERIFICATION TESTS
// ========================================

const TESTS = [
  // RÈGLE 1: NOUS (jamais "je")
  {
    name: 'Pas de " je " (première personne)',
    test: (template) => !template.body.toLowerCase().includes(' je ') &&
                        !template.body.toLowerCase().startsWith('je '),
    category: 'branding'
  },
  {
    name: 'Pas de "j\'" (première personne)',
    test: (template) => !template.body.toLowerCase().includes("j'"),
    category: 'branding'
  },
  {
    name: 'Pas de "mon/ma/mes" (possessif singulier)',
    test: (template) => !template.body.toLowerCase().match(/\b(mon|ma|mes)\b/),
    category: 'branding'
  },

  // RÈGLE 2: Signature
  {
    name: 'Signature = "L\'équipe 3A Automation"',
    test: (template) => template.body.includes("L'équipe 3A Automation"),
    category: 'branding'
  },

  // RÈGLE 3: Tagline
  {
    name: 'Tagline = "Automation. Analytics. AI."',
    test: (template) => template.body.includes('Automation. Analytics. AI.'),
    category: 'branding'
  },

  // RÈGLE 4: URL
  {
    name: 'URL = "https://3a-automation.com"',
    test: (template) => template.body.includes('https://3a-automation.com'),
    category: 'branding'
  },
  {
    name: 'Template termine par URL',
    test: (template) => template.body.trim().endsWith('https://3a-automation.com'),
    category: 'branding'
  },

  // RÈGLE 5: Structure
  {
    name: 'Commence par "Bonjour"',
    test: (template) => template.body.startsWith('Bonjour'),
    category: 'structure'
  },
  {
    name: 'Contient "Cordialement,"',
    test: (template) => template.body.includes('Cordialement,'),
    category: 'structure'
  },

  // RÈGLE 6: Placeholders
  {
    name: 'Placeholder {{first_name}} présent',
    test: (template) => template.body.includes('{{first_name}}') || template.subject.includes('{{first_name}}'),
    category: 'personalization'
  },
  {
    name: 'Placeholder {{company}} présent',
    test: (template) => template.body.includes('{{company}}') || template.subject.includes('{{company}}'),
    category: 'personalization'
  },

  // RÈGLE 7: Ton professionnel
  {
    name: 'Pas de mots hype (révolutionnaire, incroyable...)',
    test: (template) => {
      const lowerBody = template.body.toLowerCase();
      return !BRANDING.forbidden_hype.some(word => lowerBody.includes(word.toLowerCase()));
    },
    category: 'tone'
  },
  {
    name: 'Pas de "!" excessifs (max 2)',
    test: (template) => (template.body.match(/!/g) || []).length <= 2,
    category: 'tone'
  },
  {
    name: 'Mention de "3A Automation" dans le corps',
    test: (template) => template.body.includes('3A Automation'),
    category: 'branding'
  },

  // RÈGLE 8: Proposition de valeur
  {
    name: 'Contient résultat mesurable (%, h/semaine, etc.)',
    test: (template) => template.body.match(/\d+%|\d+h\/semaine|\d+-\d+h|\d+ minutes/),
    category: 'value_prop'
  },
  {
    name: 'Contient call-to-action (question finale)',
    test: (template) => template.body.includes('?') &&
                        (template.body.includes('disponible') ||
                         template.body.includes('Intéressé') ||
                         template.body.includes('Souhaitez')),
    category: 'value_prop'
  },
];

// ========================================
// PERSONA-SPECIFIC TESTS
// ========================================

function getPersonaTests(segment) {
  const requirements = PERSONA_REQUIREMENTS[segment];
  if (!requirements) return [];

  const tests = [];

  // Must contain tests
  requirements.must_contain.forEach(term => {
    tests.push({
      name: `Contient "${term}" (spécifique ${segment})`,
      test: (template) => template.body.toLowerCase().includes(term.toLowerCase()),
      category: 'persona'
    });
  });

  return tests;
}

// ========================================
// RUN TESTS
// ========================================

console.log('='.repeat(70));
console.log('TEST BRANDING TEMPLATES - VÉRIFICATION EXHAUSTIVE');
console.log('Source: docs/branding.md + personas 3A Automation');
console.log('='.repeat(70));

let totalPass = 0;
let totalFail = 0;
const allFailures = [];
const categoryStats = {};

for (const [segment, template] of Object.entries(EMAIL_TEMPLATES)) {
  console.log(`\n📧 Segment: ${segment.toUpperCase()}`);
  console.log('-'.repeat(50));

  // Combine general tests + persona-specific tests
  const allTests = [...TESTS, ...getPersonaTests(segment)];

  let passed = 0;
  let failed = 0;

  for (const testCase of allTests) {
    try {
      const result = testCase.test(template);

      // Track by category
      if (!categoryStats[testCase.category]) {
        categoryStats[testCase.category] = { passed: 0, failed: 0 };
      }

      if (result) {
        console.log(`  ✅ ${testCase.name}`);
        passed++;
        totalPass++;
        categoryStats[testCase.category].passed++;
      } else {
        console.log(`  ❌ ${testCase.name}`);
        failed++;
        totalFail++;
        categoryStats[testCase.category].failed++;
        allFailures.push({ segment, test: testCase.name, category: testCase.category });
      }
    } catch (e) {
      console.log(`  ⚠️ ${testCase.name} - Erreur: ${e.message}`);
      failed++;
      totalFail++;
      allFailures.push({ segment, test: testCase.name, error: e.message });
    }
  }

  console.log(`  → ${segment}: ${passed}/${passed + failed}`);
}

// ========================================
// SUMMARY
// ========================================

console.log('\n' + '='.repeat(70));
console.log('RÉSULTAT PAR CATÉGORIE');
console.log('='.repeat(70));

for (const [category, stats] of Object.entries(categoryStats)) {
  const total = stats.passed + stats.failed;
  const pct = Math.round(stats.passed / total * 100);
  const icon = pct === 100 ? '✅' : pct >= 80 ? '⚠️' : '❌';
  console.log(`${icon} ${category.toUpperCase()}: ${stats.passed}/${total} (${pct}%)`);
}

console.log('\n' + '='.repeat(70));
const percentage = Math.round(totalPass / (totalPass + totalFail) * 100);
console.log(`RÉSULTAT GLOBAL: ${totalPass}/${totalPass + totalFail} (${percentage}%)`);
console.log('='.repeat(70));

if (allFailures.length > 0) {
  console.log('\n❌ ÉCHECS DÉTAILLÉS:');
  allFailures.forEach(f => {
    console.log(`  - [${f.segment}] ${f.test}${f.error ? ` (${f.error})` : ''}`);
  });
  process.exit(1);
}

console.log('\n✅ 100% RÉUSSITE - TEMPLATES CONFORMES AU BRANDING');
