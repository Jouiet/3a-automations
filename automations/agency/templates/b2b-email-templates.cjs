#!/usr/bin/env node
/**
 * B2B EMAIL TEMPLATES - 3A Automation
 *
 * Module partagé pour tous les workflows leads PME/B2B
 * Source de vérité pour le branding et les templates segmentés
 *
 * UTILISATION:
 * const { EMAIL_TEMPLATES, detectSegment, personalizeEmail, BRANDING } = require('./templates/b2b-email-templates.cjs');
 *
 * SEGMENTS:
 * - decision_maker: CEO, Founder, Director
 * - marketing: CMO, Marketing Manager, Growth
 * - sales: Commercial, BDM, Sales
 * - tech: CTO, Developer, Engineer
 * - hr: RH, Recruiter, Talent
 * - other: Fallback générique
 *
 * BRANDING:
 * - Signature: "L'équipe 3A Automation"
 * - Tagline: "Automation. Analytics. AI."
 * - URL: "https://3a-automation.com"
 * - Ton: NOUS (jamais "je")
 *
 * Created: 2025-12-29 | Session 112
 * Version: 1.0.0
 * Tests: scripts/test-branding-templates.cjs (119/119)
 */

// ============================================================================
// BRANDING OFFICIEL (Source: docs/branding.md)
// ============================================================================

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

// ============================================================================
// SEGMENT KEYWORDS (Détection automatique du persona)
// ============================================================================

const SEGMENT_KEYWORDS = {
  decision_maker: [
    'ceo', 'cfo', 'coo', 'founder', 'co-founder', 'owner',
    'director', 'managing director', 'president', 'vp',
    'vice president', 'partner', 'associé', 'gérant',
    'dirigeant', 'pdg', 'dg', 'directeur général'
  ],
  marketing: [
    'marketing', 'growth', 'brand', 'cmo', 'chief marketing',
    'content', 'seo', 'digital', 'acquisition', 'performance',
    'email marketing', 'crm manager', 'automation'
  ],
  sales: [
    'sales', 'commercial', 'business development', 'bdm',
    'account executive', 'account manager', 'revenue',
    'partnerships', 'ventes', 'responsable commercial'
  ],
  tech: [
    'developer', 'engineer', 'cto', 'tech', 'software',
    'devops', 'data', 'it manager', 'architect',
    'développeur', 'ingénieur', 'technique', 'informatique'
  ],
  hr: [
    'hr', 'human resources', 'recruiter', 'talent',
    'people', 'rh', 'ressources humaines', 'recrutement',
    'onboarding', 'formation', 'drh'
  ],
};

// ============================================================================
// SEGMENT LISTS (Listes Klaviyo par segment)
// ============================================================================

const SEGMENT_LISTS = {
  decision_maker: '3A-Outreach-DecisionMakers',
  marketing: '3A-Outreach-Marketing',
  sales: '3A-Outreach-Sales',
  tech: '3A-Outreach-Tech',
  hr: '3A-Outreach-HR',
  other: '3A-Outreach-General',
};

// ============================================================================
// EMAIL TEMPLATES (6 segments B2B)
// Source: linkedin-to-klaviyo-pipeline.cjs (testé 119/119)
// ============================================================================

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
• Workflows Node.js natifs et scripts maintenables
• Architecture event-driven et scalable
• Documentation technique complète

Notre stack : Node.js, Apify, Claude, Gemini, Klaviyo, Shopify.

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

// ============================================================================
// WELCOME SERIES TEMPLATES (5 emails segmentés)
// ============================================================================

const WELCOME_TEMPLATES = {
  // Email 1 - Day 0: Bienvenue immédiate
  email1: {
    delay: 0,
    subject: "Bienvenue chez 3A Automation, {{first_name}}!",
    body: `Bonjour {{first_name}},

Nous sommes ravis de vous compter parmi notre communauté.

3A Automation accompagne les e-commerces et PME B2B dans leur transformation digitale via l'automatisation intelligente.

Ce que nous offrons :
• Automatisation des tâches répétitives (gain: 10-20h/semaine)
• Intégrations Klaviyo, Shopify, HubSpot, GA4
• Solutions AI pour l'email marketing et la prospection

Dans les prochains jours, nous partagerons des ressources concrètes pour maximiser votre ROI.

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  // Email 2 - Day 2: Cas concrets
  email2: {
    delay: 2,
    subject: "Comment nos clients gagnent 10h/semaine",
    body: `Bonjour {{first_name}},

Nos clients obtiennent des résultats mesurables :

📊 Résultats typiques :
• +25% de revenue email avec Klaviyo optimisé
• -60% de temps admin avec des automations sur mesure
• 10-15h/semaine récupérées sur les tâches manuelles

💡 Exemple concret :
Une PME e-commerce a automatisé ses emails de relance panier abandonné et a vu son taux de récupération passer de 5% à 18%.

Nous pouvons analyser vos process actuels gratuitement.

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  // Email 3 - Day 4: Quick wins
  email3: {
    delay: 4,
    subject: "Les 3 automatisations les plus demandées",
    body: `Bonjour {{first_name}},

Voici les 3 automatisations que nos clients déploient en priorité :

1️⃣ Séquences email automatisées (Klaviyo/HubSpot)
   → Setup en 1 semaine, ROI dès le premier mois

2️⃣ Sync CRM ↔ Outils marketing
   → Fin des données en double, vue client 360°

3️⃣ Reporting automatique
   → Dashboards mis à jour sans intervention humaine

Chaque automation peut être déployée en moins d'une semaine.

Seriez-vous intéressé(e) par l'une de ces solutions ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  // Email 4 - Day 7: Guide expertise
  email4: {
    delay: 7,
    subject: "Guide: Automatisation E-commerce 2026",
    body: `Bonjour {{first_name}},

Les tendances automation qui fonctionnent actuellement :

🚀 Ce qui génère des résultats :
• Personnalisation email basée sur le comportement
• Workflows trigger-based (pas de batch)
• Intégration AI dans les séquences de nurturing
• Attribution multi-touch automatisée

📈 Notre stack recommandé :
Klaviyo + Node.js + Apify + Claude/Gemini

Nous utilisons cette combinaison pour nos propres opérations et celles de nos clients.

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  // Email 5 - Day 14: Offre spéciale
  email5: {
    delay: 14,
    subject: "[Exclusif] Audit gratuit pour {{company}}",
    body: `Bonjour {{first_name}},

En tant que nouvel abonné, nous vous proposons un audit gratuit de vos process actuels.

🎁 L'offre inclut :
• Analyse de vos workflows existants (30 min)
• Identification des 3 quick wins à fort ROI
• Estimation du temps récupérable
• Roadmap personnalisée

Aucun engagement. Nous voulons simplement vous montrer ce qui est possible.

Réservez votre créneau : https://3a-automation.com/booking

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },
};

// ============================================================================
// OUTREACH SERIES TEMPLATES (3 emails par segment)
// ============================================================================

/**
 * Génère les templates outreach adaptés au segment
 */
function generateOutreachSeries(segment = 'other') {
  const baseTemplate = EMAIL_TEMPLATES[segment] || EMAIL_TEMPLATES.other;

  return {
    // Email 1 - Day 0: Premier contact personnalisé
    email1: {
      delay: 0,
      subject: baseTemplate.subject,
      body: baseTemplate.body,
    },

    // Email 2 - Day 3: Follow-up avec valeur ajoutée
    email2: {
      delay: 3,
      subject: "{{first_name}} - Cas d'usage pour {{company}}",
      body: `Bonjour {{first_name}},

Suite à notre précédent message, nous voulions partager un exemple concret.

📊 Résultat client similaire à {{company}} :
• Secteur : E-commerce/PME B2B
• Problème : Tâches manuelles chronophages
• Solution : Automatisation personnalisée 3A
• Résultat : 15h/semaine récupérées, +25% revenue email

Nous pouvons adapter cette approche à vos besoins spécifiques.

Seriez-vous disponible pour un échange de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
    },

    // Email 3 - Day 5: Dernier message
    email3: {
      delay: 5,
      subject: "{{first_name}} - Audit gratuit pour {{company}}?",
      body: `Bonjour {{first_name}},

Nous vous proposons un audit gratuit de 30 minutes pour identifier :

✅ Les tâches automatisables dans votre workflow actuel
✅ Les quick wins à fort ROI (déployables en moins d'une semaine)
✅ Une roadmap concrète pour {{company}}

Aucun engagement de votre part. Nous voulons simplement vous montrer les possibilités.

Réservez votre créneau : https://3a-automation.com/booking

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Détecte le segment B2B basé sur le titre/position
 */
function detectSegment(profile) {
  const title = (profile.headline || profile.position || profile.title || profile.jobTitle || '').toLowerCase();

  for (const [segment, keywords] of Object.entries(SEGMENT_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return segment;
    }
  }

  return 'other';
}

/**
 * Personnalise un template avec les données du profil
 */
function personalizeEmail(template, profile) {
  const firstName = profile.firstName || profile.first_name || profile.fullName?.split(' ')[0] || 'there';
  const company = profile.company || profile.organization || profile.companyName || 'votre entreprise';

  let subject = template.subject
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{company\}\}/g, company);

  let body = template.body
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{company\}\}/g, company);

  return { subject, body };
}

/**
 * Retourne le nom d'affichage du segment
 */
function getSegmentDisplayName(segment) {
  const names = {
    decision_maker: 'Décideurs',
    marketing: 'Marketing',
    sales: 'Commercial',
    tech: 'Tech',
    hr: 'RH',
    other: 'Général',
  };
  return names[segment] || 'Général';
}

/**
 * Valide qu'un email respecte le branding
 */
function validateBranding(emailBody) {
  const errors = [];

  // Règle 1: Pas de "je"
  if (emailBody.toLowerCase().match(/\b(je|j'|mon|ma|mes)\b/)) {
    errors.push('Utilise "je/mon/ma/mes" - doit utiliser NOUS');
  }

  // Règle 2: Signature
  if (!emailBody.includes("L'équipe 3A Automation")) {
    errors.push('Signature manquante: "L\'équipe 3A Automation"');
  }

  // Règle 3: Tagline
  if (!emailBody.includes('Automation. Analytics. AI.')) {
    errors.push('Tagline manquante: "Automation. Analytics. AI."');
  }

  // Règle 4: URL
  if (!emailBody.includes('https://3a-automation.com')) {
    errors.push('URL manquante: "https://3a-automation.com"');
  }

  // Règle 5: Structure
  if (!emailBody.startsWith('Bonjour')) {
    errors.push('Doit commencer par "Bonjour"');
  }
  if (!emailBody.includes('Cordialement,')) {
    errors.push('"Cordialement," manquant');
  }

  // Règle 6: Hype words
  for (const hype of BRANDING.forbidden_hype) {
    if (emailBody.toLowerCase().includes(hype)) {
      errors.push(`Mot hype interdit: "${hype}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide TOUS les templates EMAIL_TEMPLATES et WELCOME_TEMPLATES
 * @returns {boolean} - true si 100% valides
 */
function validateAllTemplates() {
  let allValid = true;
  let totalTemplates = 0;
  let validTemplates = 0;

  // Validate EMAIL_TEMPLATES (6 segments)
  for (const [segment, template] of Object.entries(EMAIL_TEMPLATES)) {
    totalTemplates++;
    const result = validateBranding(template.body);
    if (result.valid) {
      validTemplates++;
    } else {
      allValid = false;
      console.log(`   ❌ EMAIL_TEMPLATES.${segment}: ${result.errors.join(', ')}`);
    }
  }

  // Validate WELCOME_TEMPLATES (5 emails)
  for (const [emailKey, emailData] of Object.entries(WELCOME_TEMPLATES)) {
    if (emailData && emailData.body) {
      totalTemplates++;
      const result = validateBranding(emailData.body);
      if (result.valid) {
        validTemplates++;
      } else {
        allValid = false;
        console.log(`   ❌ WELCOME_TEMPLATES.${emailKey}: ${result.errors.join(', ')}`);
      }
    }
  }

  console.log(`   📊 Branding: ${validTemplates}/${totalTemplates} templates valides`);
  return allValid;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants
  BRANDING,
  SEGMENT_KEYWORDS,
  SEGMENT_LISTS,
  EMAIL_TEMPLATES,
  WELCOME_TEMPLATES,

  // Functions
  detectSegment,
  personalizeEmail,
  getSegmentDisplayName,
  generateOutreachSeries,
  validateBranding,
  validateAllTemplates,
};
