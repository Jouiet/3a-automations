# ÉVALUATION COMPARATIVE: Desktop vs Documents Fork
## Analyse Factuelle des Différences
### Date: 22 Janvier 2026 | Session 138

---

## OBJECTIF

Ce document compare **FACTUELLEMENT** les deux versions du système 3A Automation:
- **Desktop/JO-AAA**: Version de travail principale (ce dépôt)
- **Documents/JO-AAA**: Fork externe avec audit indépendant

**IMPORTANT**: Chaque système peut être CORRECT dans son propre contexte. Ce document identifie les DIFFÉRENCES, pas les "erreurs".

---

## 1. COMPARAISON QUANTITATIVE

### 1.1 Scripts Core

| Métrique | Desktop | Documents | Verdict |
|----------|---------|-----------|---------|
| Scripts `.cjs` dans `agency/core/` | **73** | **73** | IDENTIQUE |

### 1.2 Skills (Personas Agents)

| Métrique | Desktop | Documents | Écart |
|----------|---------|-----------|-------|
| Dossiers dans `.agent/skills/` | **41** | **42** | -1 |

**Skill manquant dans Desktop**: À identifier via diff des dossiers.

### 1.3 Registry (automations-registry.json)

| Métrique | Desktop | Documents | Problème |
|----------|---------|-----------|----------|
| `totalCount` déclaré | **174** | **119** | Desktop INCOHÉRENT |
| Array `.automations.length` | **119** | **119** | IDENTIQUE |
| Écart interne | **+55 fantômes** | **0** | BUG Desktop |

**CONSTAT**: Desktop a un bug dans le champ `totalCount` (174) qui ne correspond pas à la réalité (119). Documents est cohérent.

### 1.4 Gateways

| Métrique | Desktop | Documents | Verdict |
|----------|---------|-----------|---------|
| Fichiers dans `gateways/` | **3** | **3** | IDENTIQUE |

### 1.5 Forensic Engine

| Métrique | Desktop | Documents | Verdict |
|----------|---------|-----------|---------|
| Scripts dans `forensic-engine/core/` | **8** | **8** | IDENTIQUE |

### 1.6 Sensors

| Métrique | Desktop | Documents | Notes |
|----------|---------|-----------|-------|
| Fichiers avec "sensor" | **15** | Non vérifié | Claim externe: 12 |

### 1.7 Documentation

| Métrique | Desktop | Documents | Écart |
|----------|---------|-----------|-------|
| Fichiers `.md` dans `docs/` | **26** | **27** | +1 Documents |

---

## 2. ANOMALIES DÉTECTÉES

### 2.1 BUG Desktop: totalCount Registry

```json
// Desktop automations-registry.json
{
  "totalCount": 174,  // FAUX
  "automations": [...] // 119 éléments réels
}

// Documents automations-registry.json
{
  "totalCount": 119,  // CORRECT
  "automations": [...] // 119 éléments réels
}
```

**ACTION**: ✅ CORRIGÉ - `totalCount` mis à jour à 119 dans cette session.

### 2.2 Écart Skills: 41 vs 42

Desktop manque 1 skill par rapport à Documents.

**Dossiers Skills Desktop (41)**:
```
accountant, agency, architect, bridge_slack, bridge_voice, cleaner,
collector, concierge, content_director, contractor, counselor, dental,
devops, dispatcher, ecommerce_b2c, funeral, gemini_skill_creator, ...
```

**À VÉRIFIER**: Quel skill existe dans Documents mais pas Desktop?

---

## 3. CLAIMS EXTERNES vs RÉALITÉ DESKTOP

L'audit externe (Documents/JO-AAA) fait les claims suivants. Vérification contre Desktop:

### 3.1 Architecture Claims

| Claim Externe | Valeur | Desktop Vérifié | Match |
|---------------|--------|-----------------|-------|
| Scripts Core | 73 | **73** | ✅ |
| Skills | 42 | **41** | ⚠️ -1 |
| Sensors | 12 | **15** (avec "sensor" dans nom) | ⚠️ Définition? |
| Gateways | 3 | **3** | ✅ |
| Forensic Scripts | 9 | **8** | ⚠️ -1 |
| MCPs Configurés | 10 | À vérifier | - |
| Automations Registry | 119 | **119** (array) | ✅ |
| Landing Pages | 64 | À vérifier | - |

### 3.2 Commercial Claims (Non Vérifiables Techniquement)

| Claim | Source | Vérifiable? |
|-------|--------|-------------|
| -30% Churn en 60j | benchmark churn-prediction | Non (pas de données client) |
| +1000 leads/mois | google-maps-scraper capacity | Théorique seulement |
| 40 contenus/mois | blog-generator + podcast | Capacité, pas usage réel |
| +25% Open Rate | email-personalization | Non (pas de données client) |

### 3.3 Pricing Claims

| Package | Prix External | Desktop Config | Match |
|---------|---------------|----------------|-------|
| Starter | 497€/mois | Non trouvé | ❓ |
| Growth | 997€/mois | Non trouvé | ❓ |
| Scale | 1997€/mois | Non trouvé | ❓ |
| Enterprise | 3997€/mois | Non trouvé | ❓ |

**NOTE**: Les prix sont dans la doc commerciale, pas dans le code.

---

## 4. ÉLÉMENTS DANS EXTERNAL NON TROUVÉS DANS DESKTOP

### 4.1 Documentation Architecturale

L'audit externe mentionne des composants non documentés dans Desktop:

| Composant | External Doc | Desktop Doc |
|-----------|--------------|-------------|
| Protocols (A2A, ACP, UCP) | Section 2 détaillée | Mentionné brièvement |
| Frameworks (DOE, SFAP, Flywheel) | Section 3 détaillée | DOE dans CLAUDE.md |
| Token Optimization | Section 11 | `.claude/rules/token-optimization.md` ✅ |

### 4.2 Fichiers Code Mentionnés - VÉRIFIÉS

| Fichier External Claim | Existe Desktop? | Statut |
|------------------------|-----------------|--------|
| `automations/a2a/server.js` | **NON** (schema + registry seulement) | ⚠️ Partiel |
| `automations/a2a/agent-card.schema.json` | **OUI** | ✅ |
| `automations/a2a/registry.json` | **OUI** | ✅ |
| `automations/acp/server.js` | **NON** (routes + compat-layer seulement) | ⚠️ Partiel |
| `automations/acp/routes.js` | **OUI** | ✅ |
| `automations/acp/compat-layer.js` | **OUI** | ✅ |
| `automations/ucp-manifest.json` | **OUI** (1.0 KB) | ✅ |

---

## 5. RECOMMANDATIONS

### 5.1 Corrections Desktop (Haute Priorité)

1. **Fixer totalCount**: `automations-registry.json` → 174 → 119
2. **Ajouter skill manquant**: Identifier et copier depuis Documents
3. **Documenter Protocols**: A2A, ACP, UCP méritent documentation Desktop

### 5.2 Synchronisation (Moyenne Priorité)

| Action | Détail |
|--------|--------|
| Comparer forensic scripts | 8 vs 9 - identifier le manquant |
| Vérifier sensors | 12 vs 15 - clarifier définition |
| Aligner docs | 26 vs 27 - identifier doc manquant |

### 5.3 Validation Claims (Basse Priorité)

Les claims commerciaux (ROI, leads, etc.) nécessitent des données clients réels pour validation.

---

## 6. CONCLUSION

| Catégorie | Statut |
|-----------|--------|
| Scripts Core | ✅ SYNCHRONISÉS (73=73) |
| Registry Entries | ✅ SYNCHRONISÉS (119=119) |
| Registry totalCount | ✅ CORRIGÉ (était 174, maintenant 119) |
| Skills | ⚠️ ÉCART -1 |
| Forensic | ⚠️ ÉCART -1 |
| Documentation | ⚠️ Desktop moins complet |

**VERDICT GLOBAL**: Les deux systèmes sont globalement alignés sur le code core. Le fork Documents a:
1. Registry `totalCount` correct
2. +1 skill
3. +1 documentation audit

Desktop doit corriger le bug `totalCount` et évaluer si les écarts skills/forensic sont intentionnels ou à synchroniser.

---

*Document généré: 22/01/2026*
*Méthode: Vérification empirique via commandes shell*
