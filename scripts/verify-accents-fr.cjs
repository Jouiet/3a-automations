#!/usr/bin/env node
/**
 * VÉRIFICATION ACCENTS FRANÇAIS - 3A Automation
 * Vérifie que les accents sont correctement présents
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Patterns de VRAIES erreurs à chercher (mots français sans accent)
// Exclure les contextes JavaScript/CSS
const REAL_ERRORS = [
  // Mots qui devraient TOUJOURS avoir accent en français
  { pattern: /\b[Mm]ethode\b/g, correct: 'Méthode/méthode', context: 'titre ou texte' },
  { pattern: /\b[Ss]ecurite\b/g, correct: 'Sécurité/sécurité', context: 'titre ou texte' },
  { pattern: /\b[Ss]ysteme\b/g, correct: 'Système/système', context: 'titre ou texte' },
  { pattern: /\b[Pp]robleme\b/g, correct: 'Problème/problème', context: 'titre ou texte' },
  { pattern: /\b[Ss]trategie\b/g, correct: 'Stratégie/stratégie', context: 'titre ou texte' },
  { pattern: /\b[Ee]quipe\b/g, correct: 'Équipe/équipe', context: 'titre ou texte' },
  { pattern: /\b[Ee]tape\b/g, correct: 'Étape/étape', context: 'titre ou texte' },
  { pattern: /\b[Pp]eriode\b/g, correct: 'Période/période', context: 'titre ou texte' },
  { pattern: /\b[Qq]ualite\b/g, correct: 'Qualité/qualité', context: 'titre ou texte' },
  { pattern: /\b[Ee]fficacite\b/g, correct: 'Efficacité/efficacité', context: 'titre ou texte' },
  { pattern: /\b[Ss]ociete\b/g, correct: 'Société/société', context: 'titre ou texte' },
  { pattern: /\b[Aa]ctivite\b/g, correct: 'Activité/activité', context: 'titre ou texte' },
  { pattern: /\b[Rr]ealite\b/g, correct: 'Réalité/réalité', context: 'titre ou texte' },
  { pattern: /\b[Vv]erite\b/g, correct: 'Vérité/vérité', context: 'titre ou texte' },
  { pattern: /\b[Ll]iberte\b/g, correct: 'Liberté/liberté', context: 'titre ou texte' },
  { pattern: /\b[Dd]ifficulte\b/g, correct: 'Difficulté/difficulté', context: 'titre ou texte' },
  { pattern: /\b[Nn]ecessaire\b/g, correct: 'Nécessaire/nécessaire', context: 'titre ou texte' },
  { pattern: /\b[Gg]eneral\b/g, correct: 'Général/général', context: 'titre ou texte' },
  { pattern: /\b[Ss]pecialise\b/g, correct: 'Spécialisé/spécialisé', context: 'titre ou texte' },
  { pattern: /\b[Ii]ntegre\b/g, correct: 'Intégré/intègre', context: 'titre ou texte' },
  { pattern: /\b[Pp]roprietaire\b/g, correct: 'Propriétaire/propriétaire', context: 'titre ou texte' },
  { pattern: /\b[Cc]ontrole\b/g, correct: 'Contrôle/contrôle', context: 'titre ou texte' },
  { pattern: /\b[Dd]onnees\b/g, correct: 'Données/données', context: 'titre ou texte' },
  { pattern: /\b[Oo]pportunite\b/g, correct: 'Opportunité/opportunité', context: 'titre ou texte' },
  { pattern: /\b[Dd]etail\b(?![s]?\s*[=:;{}()])/g, correct: 'Détail/détail', context: 'texte (pas JS)' },
  { pattern: /\b[Rr]esultat\b/g, correct: 'Résultat/résultat', context: 'titre ou texte' },
  { pattern: /\b[Ee]lement\b/g, correct: 'Élément/élément', context: 'titre ou texte' },
  { pattern: /\b[Ee]venement\b/g, correct: 'Événement/événement', context: 'titre ou texte' },
  { pattern: /\b[Ee]volution\b/g, correct: 'Évolution/évolution', context: 'titre ou texte' },
  { pattern: /\b[Oo]peration\b/g, correct: 'Opération/opération', context: 'titre ou texte' },
  { pattern: /\b[Rr]eference\b/g, correct: 'Référence/référence', context: 'titre ou texte' },
  { pattern: /\b[Pp]resentation\b/g, correct: 'Présentation/présentation', context: 'titre ou texte' },
  { pattern: /\b[Pp]reparation\b/g, correct: 'Préparation/préparation', context: 'titre ou texte' },
  { pattern: /\b[Dd]eveloppement\b/g, correct: 'Développement/développement', context: 'titre ou texte' },
];

// Pages FR
const FR_PAGES = [
  '404.html', 'a-propos.html', 'automations.html', 'cas-clients.html',
  'contact.html', 'index.html', 'legal/mentions-legales.html',
  'legal/politique-confidentialite.html', 'pricing.html',
  'services/audit-gratuit.html', 'services/ecommerce.html',
  'services/flywheel-360.html', 'services/pme.html'
];

function extractTextContent(html) {
  // Enlever scripts et styles
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  return text;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  VÉRIFICATION ACCENTS FRANÇAIS - 3A Automation');
console.log('  Date: ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

let totalErrors = 0;
let pagesWithErrors = 0;

for (const page of FR_PAGES) {
  const filePath = path.join(SITE_DIR, page);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${page}: Non trouvé`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const text = extractTextContent(html);
  let pageErrors = 0;
  let pageErrorDetails = [];

  for (const { pattern, correct, context } of REAL_ERRORS) {
    const matches = text.match(pattern);
    if (matches) {
      pageErrors += matches.length;
      pageErrorDetails.push(`${matches[0]} → ${correct} (${matches.length}x)`);
    }
  }

  if (pageErrors > 0) {
    console.log(`❌ ${page}: ${pageErrors} erreur(s)`);
    for (const detail of pageErrorDetails) {
      console.log(`   - ${detail}`);
    }
    totalErrors += pageErrors;
    pagesWithErrors++;
  } else {
    console.log(`✅ ${page}: OK`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  RÉSUMÉ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`  Pages vérifiées: ${FR_PAGES.length}`);
console.log(`  Erreurs trouvées: ${totalErrors}`);
console.log(`  Pages avec erreurs: ${pagesWithErrors}`);
console.log('');

if (totalErrors === 0) {
  console.log('  ✅ TOUTES LES PAGES SONT CORRECTES');
} else {
  console.log('  ❌ CORRECTIONS NÉCESSAIRES');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

process.exit(totalErrors > 0 ? 1 : 0);
