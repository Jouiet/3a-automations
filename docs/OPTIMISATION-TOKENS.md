# OPTIMISATION CONSOMMATION TOKENS
## Diagnostic et Solutions - Session 138
### Date: 22 Janvier 2026

---

# 1. DIAGNOSTIC: Pourquoi 276k tokens pour explorer?

## 1.1 Données Observées

```
3 Explore agents:
├── Deep inventory all scripts: 92.1k tokens
├── Deep inventory all skills: 92.1k tokens
└── Map all interconnections: 92.2k tokens
TOTAL: 276.4k tokens
```

**Coût estimé:**
- Input (conversation héritée): ~$4.32
- Output (92k × 3 agents): ~$20.72
- **TOTAL: ~$25 pour une exploration**

## 1.2 Causes Racines

### Cause #1: Contexte Hérité (150k+ tokens)

Chaque agent Task/Explore hérite du **contexte complet** de la conversation:
- Messages précédents
- Fichiers déjà lus
- Documentation générée

```
Agent Context = Conversation (~150k) + Prompt (~1k) + Files Read (~50k)
             = ~200k tokens INPUT par agent
```

### Cause #2: Lecture Fichiers Entiers

| Script | Taille | Tokens | Info Utile | Gaspillage |
|--------|--------|--------|------------|------------|
| blog-generator-resilient.cjs | 47KB | 12k | ~2k (header) | 83% |
| voice-api-resilient.cjs | 46KB | 11.5k | ~2k (header) | 83% |
| registry.json | 75KB | 18.7k | ~5k (structure) | 73% |

### Cause #3: Agents Parallèles Redondants

3 agents lisant les mêmes fichiers indépendamment:
```
Agent 1 lit: registry.json (18.7k) + 5 scripts (~50k)
Agent 2 lit: registry.json (18.7k) + 5 scripts (~50k)
Agent 3 lit: registry.json (18.7k) + 5 scripts (~50k)

Redondance: 3× la même donnée = 206k tokens dupliqués
```

### Cause #4: Explore vs Outils Directs

| Tâche | Avec Explore | Avec Bash/Glob | Ratio |
|-------|--------------|----------------|-------|
| Lister scripts | 92k tokens | ~100 tokens | 920× |
| Compter lignes | 92k tokens | ~50 tokens | 1840× |
| Trouver pattern | 92k tokens | ~200 tokens | 460× |

---

# 2. SOLUTIONS IMPLÉMENTABLES

## Solution A: Utiliser Outils Directs (Impact Immédiat)

**AVANT (Explore agent):**
```
Task(subagent_type='Explore', prompt='Find all scripts with --health')
→ 92k tokens
```

**APRÈS (Bash direct):**
```bash
grep -l "\-\-health" automations/agency/core/*.cjs
→ ~100 tokens
```

**Règle:** Utiliser Explore UNIQUEMENT quand:
1. Question ouverte nécessitant raisonnement
2. Recherche multi-fichiers complexe
3. Analyse contextuelle requise

## Solution B: Lire Headers Seulement (Impact: -80% tokens)

**AVANT:**
```javascript
Read({ file_path: 'script.cjs' })  // 1000 lignes
→ 12k tokens
```

**APRÈS:**
```javascript
Read({ file_path: 'script.cjs', limit: 100 })  // Header seulement
→ 2.4k tokens
```

**Règle:** Toujours spécifier `limit` sauf si contenu entier requis.

## Solution C: Séquentiel vs Parallèle pour Même Contexte

**AVANT (3 agents parallèles):**
```
Agent 1: contexte + fichiers = 200k
Agent 2: contexte + fichiers = 200k
Agent 3: contexte + fichiers = 200k
TOTAL INPUT: 600k tokens
```

**APRÈS (1 agent séquentiel):**
```
Agent 1: contexte + fichiers = 200k
         puis continue avec même contexte
TOTAL INPUT: 200k tokens (3× moins)
```

**Règle:** Un seul agent pour tâches liées, parallèle uniquement pour tâches 100% indépendantes.

## Solution D: Créer Index Légers

**Problème:** Lire registry.json (75KB) à chaque exploration

**Solution:** Créer `registry-index.json` (~5KB):
```json
{
  "totalCount": 119,
  "categories": {
    "lead-gen": 26,
    "content": 19,
    "shopify": 14,
    "email": 11,
    "seo": 10
  },
  "scripts": {
    "blog-generator-resilient.cjs": { "lines": 1258, "port": 3003, "healthCheck": true },
    "churn-prediction-resilient.cjs": { "lines": 1014, "port": 3010, "healthCheck": true }
  }
}
```

**Impact:** 18.7k → 1.2k tokens (93% réduction)

## Solution E: Model Selection (haiku vs opus)

**AVANT:**
```javascript
Task({ subagent_type: 'Explore', model: 'opus' })  // Default
```

**APRÈS:**
```javascript
Task({ subagent_type: 'Explore', model: 'haiku' })  // Simple tasks
```

**Coût:**
- Opus: $15/M input, $75/M output
- Haiku: $0.25/M input, $1.25/M output
- **60× moins cher pour tâches simples**

---

# 3. RÈGLES ANTI-GASPILLAGE

## Checklist Avant Chaque Opération

```
□ Cette tâche peut-elle être faite avec Bash/Grep/Glob?
  → OUI: Utiliser outil direct
  → NON: Continuer

□ Ai-je besoin du fichier ENTIER?
  → NON: Utiliser Read(limit: 100)
  → OUI: Justifier pourquoi

□ Plusieurs agents sont-ils nécessaires?
  → NON: Un seul agent séquentiel
  → OUI: Vérifier qu'ils ne lisent pas les mêmes fichiers

□ L'agent a-t-il besoin du contexte complet?
  → NON: Prompt concis sans référence au contexte
  → OUI: Accepter le coût

□ Opus est-il requis?
  → NON: Utiliser haiku
  → OUI: Justifier (raisonnement complexe uniquement)
```

## Matrice Décision Outil

| Besoin | Outil | Coût Estimé |
|--------|-------|-------------|
| Lister fichiers | `ls`, `Glob` | ~50 tokens |
| Chercher pattern | `Grep` | ~100 tokens |
| Lire header | `Read(limit:100)` | ~2k tokens |
| Compter/Stats | `wc`, `Bash` | ~30 tokens |
| Question simple | `Task(haiku)` | ~5k tokens |
| Analyse complexe | `Task(Explore)` | ~30k tokens |
| Raisonnement profond | `Task(opus)` | ~100k tokens |

---

# 4. IMPACT FINANCIER

## Scénario: Session Documentation (comme aujourd'hui)

**AVANT (sans optimisation):**
```
3 Explore agents parallèles: 276k tokens = ~$25
+ Lecture fichiers entiers: ~100k tokens = ~$9
+ Génération docs: ~50k tokens = ~$4.50
TOTAL: ~$38.50
```

**APRÈS (avec optimisation):**
```
1 agent séquentiel haiku: ~30k tokens = ~$0.50
+ Lecture headers (limit:100): ~20k tokens = ~$1.80
+ Génération docs: ~50k tokens = ~$4.50
TOTAL: ~$6.80
```

**Économie: 82% ($31.70/session)**

## Projection Mensuelle

| Usage | Avant | Après | Économie |
|-------|-------|-------|----------|
| 10 sessions/jour | $385/jour | $68/jour | $317/jour |
| 30 jours | $11,550/mois | $2,040/mois | **$9,510/mois** |

---

# 5. ACTIONS IMMÉDIATES

## Action 1: Créer registry-index.json

```bash
node -e "
const fs = require('fs');
const reg = JSON.parse(fs.readFileSync('automations/automations-registry.json'));
const index = {
  totalCount: reg.automations.length,
  categories: {},
  scripts: {}
};
reg.automations.forEach(a => {
  index.categories[a.category] = (index.categories[a.category] || 0) + 1;
  if (a.script) {
    index.scripts[a.script] = { id: a.id, category: a.category };
  }
});
fs.writeFileSync('automations/registry-index.json', JSON.stringify(index, null, 2));
"
```

## Action 2: Script Headers Index

```bash
for f in automations/agency/core/*.cjs; do
  echo "=== $(basename $f) ===" >> automations/scripts-headers.md
  head -50 "$f" >> automations/scripts-headers.md
  echo "" >> automations/scripts-headers.md
done
```

## Action 3: Ajouter à .claude/rules/

```markdown
# Token Optimization Rules

## NEVER use Explore/Task for:
- Listing files (use ls/Glob)
- Counting (use wc)
- Pattern search (use Grep)
- Simple file info (use Read with limit)

## ALWAYS:
- Specify Read(limit: 100) unless full file needed
- Use haiku for simple exploration
- Use one sequential agent instead of parallel for related tasks
- Reference index files instead of full registry
```

---

*Document généré: 22/01/2026*
*Objectif: Réduire coût tokens de 82%*
