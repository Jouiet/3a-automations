# Token Optimization Rules

## CRITICAL: Ces règles économisent 82% des coûts tokens

### INTERDIT - Gaspillage Massif

```
❌ Task(Explore) pour lister fichiers → Utiliser ls/Glob
❌ Task(Explore) pour compter → Utiliser wc
❌ Task(Explore) pour chercher pattern → Utiliser Grep
❌ Read() sans limit → Toujours spécifier limit sauf besoin réel
❌ 3 agents parallèles pour tâches liées → 1 agent séquentiel
❌ Lire automations-registry.json → Lire registry-index.json (98% plus petit)
```

### OBLIGATOIRE - Bonnes Pratiques

```
✅ Bash(ls -la *.cjs) pour lister (~50 tokens)
✅ Grep(pattern) pour chercher (~100 tokens)
✅ Read(limit: 100) pour headers (~2k tokens)
✅ Task(model: 'haiku') pour exploration simple
✅ registry-index.json (1.3KB) au lieu de registry complet (75KB)
```

### Matrice Décision

| Besoin | Outil Correct | Coût |
|--------|---------------|------|
| Lister fichiers | `ls`, `Glob` | ~50 tokens |
| Chercher texte | `Grep` | ~100 tokens |
| Header script | `Read(limit:100)` | ~2k tokens |
| Stats fichiers | `wc`, `du` | ~30 tokens |
| Question simple | `Task(haiku)` | ~5k tokens |
| Analyse contexte | `Task(Explore, haiku)` | ~30k tokens |
| Raisonnement | `Task(opus)` | ~100k tokens |

### Index Disponibles

| Fichier | Taille | Usage |
|---------|--------|-------|
| `automations/registry-index.json` | 1.3KB | Catégories, ports, scripts health |
| `automations/automations-registry.json` | 75KB | UNIQUEMENT si détail complet requis |
