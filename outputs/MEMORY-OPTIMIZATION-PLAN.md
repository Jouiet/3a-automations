# Plan d'Optimisation Mémoire Claude - 3A Automation
## Date: 04/01/2026 | Session: 133bis-opt

---

## Diagnostic

| Métrique | Avant | Après (cible) | Réduction |
|----------|-------|---------------|-----------|
| Caractères totaux | 39,265 | ~15,000 | **-62%** |
| Tokens estimés | ~9,800 | ~3,750 | **-62%** |
| Fichiers rules/ | 11 | 4-5 | **-55%** |
| Chargement conditionnel | 0% | 60% | +60% |

---

## Nouvelle Architecture

```
.claude/
├── CLAUDE.md                    # ~800 tokens (compact, essentiel)
└── rules/
    ├── core.md                  # Règles TOUJOURS nécessaires (~500 tokens)
    ├── factuality.md            # Garder tel quel (~600 tokens)
    │
    ├── voice-ai.md              # paths: **/voice*,**/audio* SEULEMENT
    ├── dropshipping.md          # paths: **/dropship*,**/cj*,**/bigbuy*
    └── scripts.md               # paths: automations/**

docs/                            # DÉPLACÉ (chargé à la demande via @docs/)
├── session-history/             # Historique complet
├── infrastructure.md            # Détails infra
├── mcps-reference.md            # Référence MCPs complète
└── pricing-detailed.md          # Détails tarifs
```

---

## Fichiers Optimisés

### 1. CLAUDE.md (NOUVEAU - 800 tokens max)

```markdown
# 3A Automation
Version: 43.0 | 04/01/2026

## Identité
- **Agence**: AI Automation Agency (E-commerce B2C + PME B2B)
- **Site**: https://3a-automation.com
- **Dashboard**: https://dashboard.3a-automation.com

## Métriques Clés
- **Automations**: 99 (Registry v2.7.0)
- **Scripts résilients**: 22 avec --health
- **MCPs**: 11/11 fonctionnels
- **SEO/AEO**: 88%/100%

## Règles Strictes
1. Vérifier AVANT d'affirmer (factuality)
2. Source de vérité: automations-registry.json
3. Code complet uniquement (pas de TODO/placeholder)
4. CommonJS (.cjs), process.env pour credentials

## Commandes
- Validation: `node scripts/forensic-audit-complete.cjs`
- Deploy: `git push origin main`

## Références
- Détails: @docs/session-history/
- Infra: @docs/infrastructure.md
- Scripts: @.claude/rules/scripts.md
```

### 2. .claude/rules/core.md (NOUVEAU - 500 tokens)

```markdown
# Règles Core - Chargées TOUJOURS

## Architecture
```
automations/
├── automations-registry.json  # SOURCE OF TRUTH
├── agency/core/               # 35 scripts .cjs
├── templates/                 # Reusables
└── generic/                   # Utilitaires
```

## Standards Code
- Format: CommonJS (.cjs)
- Credentials: process.env.* (jamais hardcodé)
- Erreurs: console.error avec emoji ❌
- Succès: console.log avec emoji ✅

## AI Providers (Fallback)
Grok 4.1 → GPT-5.2 → Gemini 3 → Claude Sonnet 4 → Local

## Deploy
`git push origin main` → GitHub Action → Hostinger
```

### 3. .claude/rules/voice-ai.md (CONDITIONNEL)

```markdown
---
paths: "**/voice*", "**/audio*", "**/grok*", "**/tts*"
---

# Voice AI (chargé conditionnellement)
[Contenu actuel de 06-voice-ai.md]
```

### 4. .claude/rules/dropshipping.md (CONDITIONNEL)

```markdown
---
paths: "**/dropship*", "**/cj*", "**/bigbuy*", "**/supplier*"
---

# Dropshipping Scripts
[Contenu extrait de 01-project-status.md section dropshipping]
```

---

## Fichiers à SUPPRIMER/DÉPLACER

| Fichier Actuel | Action | Raison |
|----------------|--------|--------|
| 01-project-status.md | Réduire 90% | Historique → docs/ |
| 02-pricing.md | Déplacer docs/ | Rarement nécessaire |
| 03-commands.md | Fusionner core.md | Trop petit seul |
| 04-architecture.md | Fusionner core.md | Redondant avec CLAUDE.md |
| 05-mcps-status.md | Déplacer docs/ | Info statique |
| 06-voice-ai.md | Conditionnel | 177 lignes rarement utilisées |
| 07-native-scripts.md | Conditionnel | Détails techniques |
| infrastructure.md | Déplacer docs/ | Info statique |
| mcps.md | Supprimer | Duplique 05-mcps-status.md |

---

## Gains Estimés

| Scénario | Tokens Chargés | Réduction |
|----------|----------------|-----------|
| Session coding normal | ~3,750 | **-62%** |
| Session voice AI | ~5,250 | **-46%** |
| Session dropshipping | ~4,500 | **-54%** |
| Session complète | ~9,800 | 0% (inchangé) |

---

## Implémentation

### Phase 1: Réorganisation (immédiate)
1. Créer docs/ structure
2. Déplacer contenu historique
3. Créer CLAUDE.md optimisé
4. Créer core.md fusionné

### Phase 2: Conditionnels (après validation)
1. Ajouter frontmatter paths:
2. Tester chargement conditionnel
3. Valider fonctionnement

### Phase 3: Cleanup
1. Supprimer fichiers redondants
2. Valider 0 régression
3. Documenter nouvelle structure

---

## Sources
- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code Memory Docs](https://code.claude.com/docs/en/memory)
- [ClaudeLog Token Optimization](https://claudelog.com/faqs/how-to-optimize-claude-code-token-usage/)
- [Memory Management Guide](https://cuong.io/blog/2025/06/15-claude-code-best-practices-memory-management)
