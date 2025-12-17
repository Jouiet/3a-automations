# AI MEDIA PRODUCTION SYSTEM - FEEDBACK & QA

## Système de Vérification Empirique des Prompts
### Version: 1.0 | Date: 18/12/2025

---

## RÈGLE D'OR

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRÉER → EXÉCUTER → VÉRIFIER → ITÉRER                                      │
│                                                                              │
│  ✅ Score ≥ 80% → Prompt VALIDÉ → Tâche suivante                           │
│  ❌ Score < 80% → CORRIGER → Ré-exécuter → Vérifier à nouveau              │
│                                                                              │
│  PAS DE CONFIANCE AVEUGLE - VÉRIFICATION EMPIRIQUE OBLIGATOIRE             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. GRILLE D'ÉVALUATION (Scoring Rubric)

### 1.1 Critères de Notation (sur 10)

| Critère | Poids | Description |
|---------|-------|-------------|
| **Pertinence** | 25% | Le résultat correspond-il à la demande? |
| **Qualité technique** | 20% | Résolution, composition, clarté |
| **Cohérence marque 3A** | 20% | Respecte les couleurs (#4FBAF1, #191E35), style futuriste/sobre |
| **Utilisabilité** | 20% | Peut être utilisé directement sans retouche majeure? |
| **Originalité** | 15% | Pas générique, distinctif |

### 1.2 Calcul du Score Final

```
Score = (Pertinence × 0.25) + (Qualité × 0.20) + (Cohérence × 0.20) + (Utilisabilité × 0.20) + (Originalité × 0.15)

Exemple:
- Pertinence: 9/10
- Qualité: 8/10
- Cohérence: 7/10
- Utilisabilité: 8/10
- Originalité: 6/10

Score = (9×0.25) + (8×0.20) + (7×0.20) + (8×0.20) + (6×0.15)
Score = 2.25 + 1.60 + 1.40 + 1.60 + 0.90 = 7.75/10 = 77.5%

→ < 80% = ITÉRER
```

---

## 2. BIBLIOTHÈQUE DE PROMPTS 3A AUTOMATION

### 2.1 CATÉGORIE: Hero Images & Banners

#### PROMPT-HERO-001: Homepage Hero Background
```
ID: PROMPT-HERO-001
Version: 1.0
Tool: Leonardo.ai / Midjourney
Status: 🔴 À TESTER

PROMPT:
"Abstract futuristic technology background, dark navy blue (#191E35) base,
cyan (#4FBAF1) glowing circuit lines and data streams, subtle grid pattern,
geometric shapes floating, clean minimalist composition, no text,
ultra high resolution, 16:9 aspect ratio, professional corporate tech aesthetic,
subtle purple (#8B5CF6) accents, depth of field effect"

NEGATIVE PROMPT:
"text, logos, people, faces, cluttered, bright colors, cartoonish,
low quality, blurry, watermark"

PARAMÈTRES:
- Resolution: 1920x1080 (hero) / 1200x630 (OG image)
- Style: Photorealistic / Digital Art
- Guidance: 7-8

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
│ Test 2 │ Date:      │ Score:    │ Notes:                     │
│ Test 3 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘

ITÉRATIONS:
- v1.0: Initial prompt
- v1.1: [changes made]
- v1.2: [changes made]
```

#### PROMPT-HERO-002: Service Cards Icons
```
ID: PROMPT-HERO-002
Version: 1.0
Tool: Leonardo.ai
Status: 🔴 À TESTER

PROMPT:
"Minimalist icon set for automation services, glowing cyan (#4FBAF1) lines
on dark background, single color outline style, representing:
[SPECIFY: shopping cart / email envelope / analytics chart / AI brain],
clean vector-like aesthetic, consistent 2px stroke weight,
centered composition, 512x512, no gradients, futuristic tech style"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.2 CATÉGORIE: Persona Illustrations

#### PROMPT-PERSONA-001: PME E-commerce Owner (Maroc)
```
ID: PROMPT-PERSONA-001
Version: 1.0
Tool: Leonardo.ai / Midjourney
Status: 🔴 À TESTER

PROMPT:
"Professional portrait of Moroccan business owner, mid-30s,
confident expression, modern office environment with laptop showing
e-commerce dashboard, navy blue (#191E35) color scheme,
soft professional lighting, business casual attire,
clean background, authentic not stock photo feeling,
4:5 aspect ratio for website testimonial section"

NEGATIVE PROMPT:
"cartoon, illustration, fake smile, over-processed,
obvious stock photo pose, cluttered background"

USE CASE:
- Testimonials section
- Case studies
- About page

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

#### PROMPT-PERSONA-002: Healthcare Admin (EU)
```
ID: PROMPT-PERSONA-002
Version: 1.0
Tool: Leonardo.ai
Status: 🔴 À TESTER

PROMPT:
"Professional healthcare administrator, European, 40s,
in modern medical office setting, reviewing analytics on tablet,
clean white and cyan (#4FBAF1) color accents,
professional attire, warm but corporate lighting,
represents efficiency and trust, 4:5 aspect ratio"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.3 CATÉGORIE: Service Illustrations

#### PROMPT-SERVICE-001: Automation Workflow Visual
```
ID: PROMPT-SERVICE-001
Version: 1.0
Tool: Leonardo.ai
Status: 🔴 À TESTER

PROMPT:
"Abstract visualization of automated workflow, connected nodes
with glowing cyan (#4FBAF1) lines, dark navy background (#191E35),
flowing data streams between icons representing: email, shopping cart,
analytics chart, AI chip, isometric perspective,
clean tech aesthetic, no text, professional infographic style,
16:9 aspect ratio"

USE CASE:
- Services page header
- How it works section
- Process visualization

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

#### PROMPT-SERVICE-002: Flywheel Diagram
```
ID: PROMPT-SERVICE-002
Version: 1.0
Tool: Leonardo.ai / Canva AI
Status: 🔴 À TESTER

PROMPT:
"Circular flywheel business diagram, 4 segments: Acquisition (magnifying glass),
Conversion (shopping cart), Retention (heart), Advocacy (megaphone),
rotating arrows connecting segments, glowing cyan (#4FBAF1) accents,
dark navy center (#191E35) with 'ROI' text,
clean modern infographic style, 1:1 aspect ratio"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.4 CATÉGORIE: Tech Stack Visuals

#### PROMPT-TECH-001: Integration Ecosystem
```
ID: PROMPT-TECH-001
Version: 1.0
Tool: Leonardo.ai
Status: 🔴 À TESTER

PROMPT:
"Technology integration ecosystem visualization, central hub with
orbiting connected platforms, icons for: Shopify, Klaviyo, GA4, n8n, Claude AI,
glowing connection lines in cyan (#4FBAF1), dark space-like background (#191E35),
constellation-style layout, professional tech aesthetic,
subtle purple (#8B5CF6) secondary accents, 16:9"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.5 CATÉGORIE: Video Scripts (Kling/Leonardo Video)

#### PROMPT-VIDEO-001: Hero Section Animation
```
ID: PROMPT-VIDEO-001
Version: 1.0
Tool: Kling AI / Leonardo Motion
Status: 🔴 À TESTER

PROMPT:
"Slow zoom into abstract technology visualization,
glowing cyan data streams flowing across dark navy background,
subtle particle effects, circuit board patterns emerging,
smooth camera movement, 5-10 second loop,
cinematic quality, no jarring transitions"

PARAMETERS:
- Duration: 5-10 seconds
- Loop: Yes (seamless)
- Resolution: 1920x1080
- FPS: 30

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

#### PROMPT-VIDEO-002: Product Demo Intro
```
ID: PROMPT-VIDEO-002
Version: 1.0
Tool: Kling AI
Status: 🔴 À TESTER

PROMPT:
"Professional screen recording style animation,
laptop screen showing dashboard with analytics charts animating,
numbers counting up, graphs filling in,
clean modern UI, cyan (#4FBAF1) accent highlights,
smooth transitions between metrics, 15 second clip"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.6 CATÉGORIE: Social Media Content

#### PROMPT-SOCIAL-001: LinkedIn Post Visual
```
ID: PROMPT-SOCIAL-001
Version: 1.0
Tool: Leonardo.ai / Canva
Status: 🔴 À TESTER

PROMPT:
"Professional LinkedIn post graphic, clean minimalist design,
single powerful statistic or tip displayed prominently,
dark navy background (#191E35), cyan (#4FBAF1) accent elements,
subtle tech pattern overlay, 1200x1200 square format,
space for text overlay, branded but not logo-heavy"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

#### PROMPT-SOCIAL-002: Case Study Carousel Frame
```
ID: PROMPT-SOCIAL-002
Version: 1.0
Tool: Leonardo.ai
Status: 🔴 À TESTER

PROMPT:
"LinkedIn carousel slide template, before/after comparison layout,
left side: red (#EF4444) accent for 'problem',
right side: green (#10B981) accent for 'solution',
dark navy background, clean data visualization space,
1080x1080, professional corporate aesthetic"

TEST RESULTS:
┌──────────────────────────────────────────────────────────────┐
│ Test 1 │ Date:      │ Score:    │ Notes:                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. PROTOCOLE DE TEST

### 3.1 Checklist Pré-Exécution

```
□ Prompt ID assigné
□ Tool sélectionné (Leonardo/Kling/Midjourney/Grok)
□ Paramètres définis (resolution, style, guidance)
□ Negative prompt préparé
□ Use case documenté
□ Critères de succès définis
```

### 3.2 Processus d'Exécution

```
ÉTAPE 1: Générer 3-4 variations
ÉTAPE 2: Évaluer chaque variation avec la grille (Section 1.1)
ÉTAPE 3: Calculer score moyen
ÉTAPE 4: Décision:
         - Score ≥ 80% → VALIDÉ → Sauvegarder meilleure version
         - Score < 80% → ITÉRER → Modifier prompt → Retour ÉTAPE 1
ÉTAPE 5: Documenter résultats dans le tableau
ÉTAPE 6: Maximum 3 itérations avant escalade/changement d'approche
```

### 3.3 Template de Rapport de Test

```markdown
## TEST REPORT - [PROMPT-ID]

**Date:** YYYY-MM-DD
**Testeur:** [Nom]
**Tool:** [Leonardo/Kling/etc.]

### Variations Générées
- Variation A: [screenshot/link]
- Variation B: [screenshot/link]
- Variation C: [screenshot/link]

### Scores

| Variation | Pertinence | Qualité | Cohérence | Utilisabilité | Originalité | TOTAL |
|-----------|------------|---------|-----------|---------------|-------------|-------|
| A         | /10        | /10     | /10       | /10           | /10         | %     |
| B         | /10        | /10     | /10       | /10           | /10         | %     |
| C         | /10        | /10     | /10       | /10           | /10         | %     |

### Décision
- [ ] VALIDÉ (≥80%) - Meilleure variation: [A/B/C]
- [ ] ITÉRER (<80%) - Modifications proposées:

### Notes d'Itération
- Problème identifié:
- Modification au prompt:
- Résultat attendu:
```

---

## 4. TABLEAU DE SUIVI GLOBAL

### 4.1 Status des Prompts

| ID | Catégorie | Status | Score | Itérations | Validé |
|----|-----------|--------|-------|------------|--------|
| PROMPT-HERO-001 | Hero | 🔴 À tester | - | 0 | ❌ |
| PROMPT-HERO-002 | Icons | 🔴 À tester | - | 0 | ❌ |
| PROMPT-PERSONA-001 | Persona | 🔴 À tester | - | 0 | ❌ |
| PROMPT-PERSONA-002 | Persona | 🔴 À tester | - | 0 | ❌ |
| PROMPT-SERVICE-001 | Service | 🔴 À tester | - | 0 | ❌ |
| PROMPT-SERVICE-002 | Flywheel | 🔴 À tester | - | 0 | ❌ |
| PROMPT-TECH-001 | Tech | 🔴 À tester | - | 0 | ❌ |
| PROMPT-VIDEO-001 | Video | 🔴 À tester | - | 0 | ❌ |
| PROMPT-VIDEO-002 | Video | 🔴 À tester | - | 0 | ❌ |
| PROMPT-SOCIAL-001 | Social | 🔴 À tester | - | 0 | ❌ |
| PROMPT-SOCIAL-002 | Social | 🔴 À tester | - | 0 | ❌ |

### 4.2 Légende Status

```
🔴 À tester    - Prompt créé, pas encore exécuté
🟡 En test     - Exécution en cours
🟠 Itération   - Score <80%, en cours de modification
🟢 Validé      - Score ≥80%, prêt à utiliser
⚫ Abandonné   - 3+ itérations sans succès, nouvelle approche nécessaire
```

---

## 5. RÈGLES D'ITÉRATION

### 5.1 Modifications Progressives

```
ITÉRATION 1: Ajustements mineurs
- Modifier adjectifs/descripteurs
- Ajuster paramètres (guidance, style)
- Affiner negative prompt

ITÉRATION 2: Modifications modérées
- Restructurer la composition du prompt
- Changer l'ordre des éléments
- Ajouter/retirer des détails spécifiques

ITÉRATION 3: Changement majeur
- Réécrire complètement le prompt
- Changer d'outil (Leonardo → Midjourney)
- Simplifier drastiquement l'approche

APRÈS 3 ITÉRATIONS:
- Escalader (demander feedback externe)
- Changer d'approche (photo stock, illustration manuelle)
- Documenter l'échec pour apprentissage
```

### 5.2 Patterns de Succès Documentés

```
CE QUI FONCTIONNE:
+ Couleurs hex spécifiques (#4FBAF1, #191E35)
+ Descriptions de composition claires
+ Negative prompts détaillés
+ Aspect ratio explicite
+ Style reference (futuriste, minimaliste, tech)

CE QUI NE FONCTIONNE PAS:
- Prompts trop longs (>150 mots)
- Demandes contradictoires
- Termes vagues ("beau", "professionnel" seuls)
- Trop d'éléments dans une seule image
- Manque de contexte de marque
```

---

## 6. INTÉGRATION AVEC LE WORKFLOW

### 6.1 Quand Utiliser ce Système

```
AVANT de créer du contenu visuel:
1. Vérifier si un prompt validé existe déjà
2. Si oui → Utiliser le prompt validé
3. Si non → Créer nouveau prompt → Suivre protocole de test

APRÈS génération:
1. Évaluer avec la grille
2. Documenter dans le tableau
3. Si <80% → Itérer avant utilisation
```

### 6.2 Assets Validés (À compléter)

```
/assets/validated/
├── hero/
│   └── [images validées score ≥80%]
├── icons/
│   └── [icons validées]
├── personas/
│   └── [illustrations personas]
├── services/
│   └── [visuels services]
├── social/
│   └── [templates social media]
└── video/
    └── [clips vidéo validés]
```

---

## 7. MÉTRIQUES DE PERFORMANCE

### 7.1 KPIs du Système

| Métrique | Target | Actuel |
|----------|--------|--------|
| Taux de validation 1ère itération | >50% | - |
| Taux de validation global | >80% | - |
| Itérations moyennes par prompt | <2 | - |
| Prompts abandonnés | <10% | - |

### 7.2 Rapport Hebdomadaire

```
Semaine du: [DATE]

Prompts testés: X
Prompts validés: X (Y%)
En itération: X
Abandonnés: X

Top performer: [PROMPT-ID] - Score: X%
Problématique: [PROMPT-ID] - Issue: [description]

Actions next week:
- [ ]
- [ ]
```

---

*Document créé: 18/12/2025*
*Prochaine révision: Après premiers tests*
*Méthode: Vérification empirique, pas de confiance aveugle*
