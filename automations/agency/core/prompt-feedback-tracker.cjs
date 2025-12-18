#!/usr/bin/env node
/**
 * AI PROMPTS FEEDBACK TRACKER
 * ============================
 * Système de vérification empirique des prompts AI
 *
 * Usage:
 *   node scripts/prompt-feedback-tracker.cjs add <prompt-id>
 *   node scripts/prompt-feedback-tracker.cjs test <prompt-id>
 *   node scripts/prompt-feedback-tracker.cjs score <prompt-id> <p> <q> <c> <u> <o>
 *   node scripts/prompt-feedback-tracker.cjs status
 *   node scripts/prompt-feedback-tracker.cjs report
 */

const fs = require('fs');
const path = require('path');

// Database file
const DB_FILE = path.join(__dirname, '../data/prompt-results.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize or load database
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
  return {
    prompts: {},
    tests: [],
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    }
  };
}

function saveDB(db) {
  db.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Calculate weighted score
function calculateScore(scores) {
  const weights = {
    pertinence: 0.25,
    qualite: 0.20,
    coherence: 0.20,
    utilisabilite: 0.20,
    originalite: 0.15
  };

  const score =
    (scores.pertinence * weights.pertinence) +
    (scores.qualite * weights.qualite) +
    (scores.coherence * weights.coherence) +
    (scores.utilisabilite * weights.utilisabilite) +
    (scores.originalite * weights.originalite);

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

// Status emoji based on score
function getStatus(score, iterations) {
  if (score === null) return '🔴 À tester';
  if (score >= 8) return '🟢 Validé';
  if (iterations >= 3) return '⚫ Abandonné';
  return '🟠 Itération';
}

// Commands
const commands = {
  add: (args) => {
    const [promptId, category, tool] = args;
    if (!promptId) {
      console.log('Usage: add <prompt-id> [category] [tool]');
      return;
    }

    const db = loadDB();
    if (db.prompts[promptId]) {
      console.log(`❌ Prompt ${promptId} existe déjà`);
      return;
    }

    db.prompts[promptId] = {
      id: promptId,
      category: category || 'general',
      tool: tool || 'leonardo',
      status: 'pending',
      iterations: 0,
      currentScore: null,
      bestScore: null,
      tests: [],
      created: new Date().toISOString(),
      validated: false
    };

    saveDB(db);
    console.log(`✅ Prompt ${promptId} ajouté`);
    console.log(`   Catégorie: ${category || 'general'}`);
    console.log(`   Tool: ${tool || 'leonardo'}`);
  },

  test: (args) => {
    const [promptId] = args;
    if (!promptId) {
      console.log('Usage: test <prompt-id>');
      return;
    }

    const db = loadDB();
    if (!db.prompts[promptId]) {
      console.log(`❌ Prompt ${promptId} non trouvé. Utilisez 'add' d'abord.`);
      return;
    }

    const prompt = db.prompts[promptId];
    prompt.status = 'testing';
    prompt.iterations++;

    const testId = `${promptId}-test-${prompt.iterations}`;
    const test = {
      id: testId,
      promptId,
      iteration: prompt.iterations,
      timestamp: new Date().toISOString(),
      scores: null,
      finalScore: null,
      notes: ''
    };

    prompt.tests.push(testId);
    db.tests.push(test);

    saveDB(db);
    console.log(`\n🧪 TEST INITIÉ: ${testId}`);
    console.log(`   Itération: ${prompt.iterations}`);
    console.log(`\n   Prochaine étape: Exécuter le prompt dans ${prompt.tool}`);
    console.log(`   Puis: node scripts/prompt-feedback-tracker.cjs score ${promptId} <p> <q> <c> <u> <o>`);
    console.log(`\n   Où:`);
    console.log(`   p = Pertinence (1-10)`);
    console.log(`   q = Qualité technique (1-10)`);
    console.log(`   c = Cohérence marque (1-10)`);
    console.log(`   u = Utilisabilité (1-10)`);
    console.log(`   o = Originalité (1-10)`);
  },

  score: (args) => {
    const [promptId, p, q, c, u, o, notes] = args;
    if (!promptId || !p || !q || !c || !u || !o) {
      console.log('Usage: score <prompt-id> <pertinence> <qualite> <coherence> <utilisabilite> <originalite> [notes]');
      console.log('Exemple: score PROMPT-HERO-001 9 8 7 8 6 "Bon résultat mais couleurs légèrement off"');
      return;
    }

    const db = loadDB();
    if (!db.prompts[promptId]) {
      console.log(`❌ Prompt ${promptId} non trouvé`);
      return;
    }

    const scores = {
      pertinence: parseFloat(p),
      qualite: parseFloat(q),
      coherence: parseFloat(c),
      utilisabilite: parseFloat(u),
      originalite: parseFloat(o)
    };

    // Validate scores
    for (const [key, value] of Object.entries(scores)) {
      if (isNaN(value) || value < 1 || value > 10) {
        console.log(`❌ Score invalide pour ${key}: ${value}. Doit être entre 1 et 10.`);
        return;
      }
    }

    const finalScore = calculateScore(scores);
    const prompt = db.prompts[promptId];

    // Find the latest test for this prompt
    const testId = prompt.tests[prompt.tests.length - 1];
    const test = db.tests.find(t => t.id === testId);

    if (test) {
      test.scores = scores;
      test.finalScore = finalScore;
      test.notes = notes || '';
    }

    prompt.currentScore = finalScore;
    if (!prompt.bestScore || finalScore > prompt.bestScore) {
      prompt.bestScore = finalScore;
    }

    // Determine status
    const scorePercent = finalScore * 10;
    const validated = scorePercent >= 80;

    prompt.validated = validated;
    prompt.status = validated ? 'validated' : (prompt.iterations >= 3 ? 'abandoned' : 'needs_iteration');

    saveDB(db);

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  RÉSULTAT: ${promptId}`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`\n  SCORES:`);
    console.log(`  ├─ Pertinence:     ${scores.pertinence}/10  (×0.25)`);
    console.log(`  ├─ Qualité:        ${scores.qualite}/10  (×0.20)`);
    console.log(`  ├─ Cohérence:      ${scores.coherence}/10  (×0.20)`);
    console.log(`  ├─ Utilisabilité:  ${scores.utilisabilite}/10  (×0.20)`);
    console.log(`  └─ Originalité:    ${scores.originalite}/10  (×0.15)`);
    console.log(`\n  SCORE FINAL: ${finalScore}/10 (${scorePercent}%)`);
    console.log(`  SEUIL: 80%`);
    console.log(`  ITÉRATION: ${prompt.iterations}/3`);
    console.log(`\n  ${'─'.repeat(56)}`);

    if (validated) {
      console.log(`  ✅ VALIDÉ - Score ≥ 80%`);
      console.log(`  → Prompt prêt à utiliser en production`);
    } else if (prompt.iterations >= 3) {
      console.log(`  ⚫ ABANDONNÉ - 3 itérations sans succès`);
      console.log(`  → Considérer une nouvelle approche`);
    } else {
      console.log(`  🟠 ITÉRATION REQUISE - Score < 80%`);
      console.log(`  → Modifier le prompt et relancer: test ${promptId}`);
      console.log(`  → Itérations restantes: ${3 - prompt.iterations}`);
    }
    console.log(`${'═'.repeat(60)}\n`);
  },

  status: () => {
    const db = loadDB();
    const prompts = Object.values(db.prompts);

    if (prompts.length === 0) {
      console.log('Aucun prompt enregistré. Utilisez "add" pour commencer.');
      return;
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  TABLEAU DE BORD - AI PROMPTS FEEDBACK SYSTEM`);
    console.log(`${'═'.repeat(70)}\n`);

    // Stats
    const validated = prompts.filter(p => p.validated).length;
    const pending = prompts.filter(p => p.status === 'pending').length;
    const iterating = prompts.filter(p => p.status === 'needs_iteration').length;
    const abandoned = prompts.filter(p => p.status === 'abandoned').length;

    console.log(`  STATISTIQUES:`);
    console.log(`  ├─ Total prompts:  ${prompts.length}`);
    console.log(`  ├─ 🟢 Validés:     ${validated} (${Math.round(validated/prompts.length*100)||0}%)`);
    console.log(`  ├─ 🔴 À tester:    ${pending}`);
    console.log(`  ├─ 🟠 En itération: ${iterating}`);
    console.log(`  └─ ⚫ Abandonnés:   ${abandoned}`);

    console.log(`\n  ${'─'.repeat(66)}`);
    console.log(`  | ID                  | Catégorie  | Score | Iter | Status        |`);
    console.log(`  ${'─'.repeat(66)}`);

    prompts.forEach(p => {
      const status = getStatus(p.currentScore, p.iterations);
      const scoreStr = p.currentScore !== null ? `${(p.currentScore * 10).toFixed(0)}%` : '-';
      console.log(`  | ${p.id.padEnd(19)} | ${(p.category || '-').padEnd(10)} | ${scoreStr.padStart(5)} | ${String(p.iterations).padStart(4)} | ${status.padEnd(13)} |`);
    });

    console.log(`  ${'─'.repeat(66)}\n`);
  },

  report: () => {
    const db = loadDB();
    const prompts = Object.values(db.prompts);

    console.log(`\n# RAPPORT - AI PROMPTS FEEDBACK SYSTEM`);
    console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);

    // Summary
    const validated = prompts.filter(p => p.validated);
    const avgScore = validated.length > 0
      ? validated.reduce((sum, p) => sum + p.bestScore, 0) / validated.length
      : 0;

    console.log(`## Résumé`);
    console.log(`- Prompts testés: ${prompts.filter(p => p.iterations > 0).length}`);
    console.log(`- Prompts validés: ${validated.length}`);
    console.log(`- Score moyen (validés): ${(avgScore * 10).toFixed(1)}%`);
    console.log(`- Taux de validation: ${prompts.length > 0 ? Math.round(validated.length / prompts.length * 100) : 0}%`);

    console.log(`\n## Détails par Prompt\n`);

    prompts.forEach(p => {
      const status = getStatus(p.currentScore, p.iterations);
      console.log(`### ${p.id}`);
      console.log(`- Catégorie: ${p.category}`);
      console.log(`- Tool: ${p.tool}`);
      console.log(`- Status: ${status}`);
      console.log(`- Meilleur score: ${p.bestScore !== null ? `${(p.bestScore * 10).toFixed(0)}%` : 'N/A'}`);
      console.log(`- Itérations: ${p.iterations}`);
      console.log('');
    });

    console.log(`\n## Actions Recommandées\n`);

    const needsIteration = prompts.filter(p => p.status === 'needs_iteration');
    if (needsIteration.length > 0) {
      console.log(`### Prompts à Itérer (${needsIteration.length})`);
      needsIteration.forEach(p => {
        console.log(`- [ ] ${p.id} (Score actuel: ${(p.currentScore * 10).toFixed(0)}%)`);
      });
    }

    const pending = prompts.filter(p => p.status === 'pending');
    if (pending.length > 0) {
      console.log(`\n### Prompts à Tester (${pending.length})`);
      pending.forEach(p => {
        console.log(`- [ ] ${p.id}`);
      });
    }
  },

  help: () => {
    console.log(`
AI PROMPTS FEEDBACK TRACKER
============================

COMMANDES:
  add <id> [category] [tool]  Ajouter un nouveau prompt
  test <id>                   Initier un test pour un prompt
  score <id> p q c u o [notes] Enregistrer les scores (1-10 chacun)
  status                      Voir le tableau de bord
  report                      Générer un rapport détaillé
  help                        Afficher cette aide

WORKFLOW:
  1. add PROMPT-HERO-001 hero leonardo
  2. test PROMPT-HERO-001
  3. [Exécuter le prompt dans l'outil AI]
  4. score PROMPT-HERO-001 9 8 7 8 6
  5. Si score < 80%, modifier le prompt et répéter depuis étape 2

CRITÈRES DE SCORING (1-10):
  p = Pertinence (25%)       - Correspond à la demande?
  q = Qualité (20%)          - Résolution, composition, clarté
  c = Cohérence (20%)        - Respecte les couleurs/style 3A?
  u = Utilisabilité (20%)    - Utilisable directement?
  o = Originalité (15%)      - Distinctif, pas générique?

SEUIL DE VALIDATION: Score final ≥ 80%
MAX ITÉRATIONS: 3 avant abandon
    `);
  }
};

// Main
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  commands.help();
} else {
  commands[command](args);
}
