# Token Optimization

## Règle Utilisateur
**PAS d'agents Claude** - consomme trop de tokens. Travail en direct uniquement.

## Règles d'Optimisation

### 1. Outils directs vs Agents
```
PRÉFÉRER:
- Grep "pattern"             → Recherche contenu
- Read file_path             → Lecture ciblée
- Glob "**/*.cjs"            → Listing fichiers

ÉVITER:
- Task(Explore) pour recherches simples
- Agents parallèles (consomment 100k+ tokens chacun)
```

### 2. Limiter lectures fichiers
```
Read(limit:100)  → Premières lignes seulement
Read(offset:X)   → Section spécifique
```

### 3. Index léger Registry
| Fichier | Taille | Ratio |
|:--------|:------:|:-----:|
| `registry-index.json` | 1,358 bytes | - |
| `registry.json` | 74,704 bytes | - |
| **Ratio** | **55x** | ✅ |

Lire `automations/registry-index.json` (1.3KB) avant `automations-registry.json` (75KB).

## Règles Claude Code
1. **Recherche codebase**: Utiliser Grep/Glob avant Task(Explore)
2. **Fichiers volumineux**: `Read(limit:100)` pour aperçu
3. **Registry**: Lire `registry-index.json` avant `registry.json`
4. **Agents**: Interdit sauf demande explicite utilisateur

*Màj: 06/02/2026 - Session 191ter*
