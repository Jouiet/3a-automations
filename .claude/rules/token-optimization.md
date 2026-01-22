# Token Optimization Rules
## Mise à jour: 22/01/2026 - Intégrant Best Practices Web-Verified

> Sources: [Anthropic Engineering](https://www.anthropic.com/engineering/code-execution-with-mcp), [Claude Code Docs](https://code.claude.com/docs/en/costs), [ClaudeLog](https://claudelog.com/faqs/how-to-optimize-claude-code-token-usage/)

---

## BENCHMARK: 98.7% Réduction Possible

**Étude Anthropic Engineering (2025):**
- Direct tool calls: **150,000 tokens**
- Code execution pattern: **2,000 tokens**
- Réduction: **98.7%**

---

## RÈGLE #1: Code Execution vs Direct Tools

### MAUVAIS (150k tokens):
```javascript
// L'agent appelle chaque outil directement
// Chaque résultat passe dans le contexte
Task(prompt: "Explore all files and list their purposes")
→ Charge définitions outils + résultats dans contexte
```

### BON (2k tokens):
```javascript
// L'agent écrit du code qui appelle les outils
// Résultats filtrés AVANT retour au contexte
Bash("find . -name '*.cjs' | head -10")  // Exécuté localement
Grep("Purpose|Description")               // Filtré avant contexte
```

---

## RÈGLE #2: Model Selection (Coûts 2026)

| Model | Input/M | Output/M | Quand Utiliser |
|-------|---------|----------|----------------|
| **Haiku 4.5** | $1 | $5 | Listing, comptage, recherche simple |
| **Sonnet 4.5** | $3 | $15 | Génération code, analyse |
| **Opus 4.5** | $5 | $25 | Raisonnement complexe uniquement |

**Règle:** Utiliser Haiku par défaut, monter SEULEMENT si nécessaire.

---

## RÈGLE #3: Prompt Caching (90% savings)

**Comment ça marche:**
- Contenu répété (system prompts, CLAUDE.md) = caché
- Requêtes suivantes = 90% moins cher sur partie cachée

**Maximiser le cache:**
- Garder CLAUDE.md **sous 500 lignes**
- Mettre instructions stables en premier
- Instructions dynamiques en dernier

---

## RÈGLE #4: Extended Thinking Budget

| Tâche | Budget Recommandé |
|-------|-------------------|
| Simple (listing, search) | Désactivé ou 1,024 |
| Modéré (analyse) | 8,000 |
| Complexe (planning) | 16,000 |
| Très complexe | 31,999 (max) |

```bash
# Override via env
MAX_THINKING_TOKENS=1024  # Pour tâches simples
```

---

## RÈGLE #5: MCP Server Management

**Problème:** Chaque MCP activé ajoute définitions d'outils au contexte.

**Solution:**
- Désactiver MCPs non utilisés dans `.mcp.json`
- Ne charger que les outils nécessaires dynamiquement

**MCPs 3A à garder actifs:**
- google-analytics (essentiel)
- klaviyo (essentiel)
- shopify-admin (essentiel)

**MCPs à désactiver si non utilisés:**
- powerbi-remote (rarement utilisé)
- stitch (rarement utilisé)
- meta-ads (credentials manquantes anyway)

---

## RÈGLE #6: Session Management

```
/clear     → Après changement de tâche (évite contexte stale)
/compact   → Quand contexte > 50k tokens
/rename    → Avant /clear pour retrouver session
```

**Coût moyen Claude Code:**
- Par jour: ~$6/dev (90% des users < $12/jour)
- Par mois: ~$100-200/dev avec Sonnet 4.5

---

## MATRICE DÉCISION COMPLÈTE

| Besoin | Outil | Tokens | Coût |
|--------|-------|--------|------|
| Lister fichiers | `ls`, `Glob` | ~50 | $0.00005 |
| Chercher texte | `Grep` | ~100 | $0.0001 |
| Lire header | `Read(limit:100)` | ~2k | $0.002 |
| Stats fichiers | `wc`, `du` | ~30 | $0.00003 |
| Question simple | `Task(haiku)` | ~5k | $0.01 |
| Exploration | `Task(Explore, haiku)` | ~30k | $0.06 |
| Raisonnement | `Task(opus)` | ~100k | $0.50 |

---

## INTERDIT - GASPILLAGE MASSIF

```
❌ Task(Explore) pour lister → ls/Glob (1840× moins cher)
❌ Task(Explore) pour chercher → Grep (920× moins cher)
❌ Read() sans limit → Read(limit:100)
❌ 3 agents parallèles → 1 séquentiel
❌ registry.json (75KB) → registry-index.json (1.3KB)
❌ Tous MCPs activés → Désactiver non utilisés
❌ Opus pour tâches simples → Haiku
```

---

## INDEX FICHIERS LÉGERS

| Fichier | Taille | Tokens | Usage |
|---------|--------|--------|-------|
| `registry-index.json` | 1.3KB | 325 | Catégories, ports |
| `registry.json` | 75KB | 18.7k | JAMAIS sauf besoin complet |
| `CLAUDE.md` | <2KB | <500 | Instructions globales |

---

## ÉCONOMIES THÉORIQUES (Non Testées)

| Métrique | Problème Observé | Théorique Si Règles Suivies |
|----------|------------------|----------------------------|
| Exploration 3 agents | 276k tokens | ~5k tokens (À VÉRIFIER) |
| Coût/session | ~$25 | ~$0.50 (À VÉRIFIER) |

**⚠️ ATTENTION**: Ces économies sont THÉORIQUES basées sur Anthropic Engineering.
Elles n'ont PAS été vérifiées empiriquement dans ce projet.

---

*Sources vérifiées: Anthropic Engineering, Claude Code Docs, ClaudeLog - 22/01/2026*
