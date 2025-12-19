# PLAN D'ACTION MVP - JO-AAA
## Document Exécutable - Décembre 2025
## Objectif: Premier client payant en 4 semaines

---

## CONTEXTE

```
SITUATION AU 19 DÉCEMBRE 2025 (Mise à jour Session 21c):
├── Opérateur: Solo (1 personne)
├── Temps: 20h/semaine
├── Cash flow: €0
├── Budget: €50
├── Clients: 0 actifs (3 restart 25/01/2026)
├── Hébergement: Hostinger (VPS 1168256 + n8n + website)
├── GitHub: github.com/Jouiet/3a-automations ✅ (PRIVÉ)
├── Branding: 3A-BRANDING-GUIDE.md ✅
├── **SITE LIVE: https://3a-automation.com** ✅
│
├── SERVICES AGENCE CONFIGURÉS (Session 21c):
│   ├── ✅ GitHub Token (RENOUVELÉ - ghp_8qa6eZ...)
│   ├── ✅ Google Cloud SA (testé)
│   ├── ✅ Google Sheets (R/W testé)
│   ├── ✅ GA4 (Property 516832662, testé)
│   ├── ✅ Gemini (clé sauvée)
│   ├── ✅ xAI/Grok (clé sauvée, crédits requis)
│   ├── ✅ Hostinger API (testé)
│   ├── ✅ n8n instance (accessible, API key à générer)
│   ├── ✅ Apify (NOUVEAU - apify_api_1AN2ir...)
│   └── ✅ Klaviyo (pk_d73c1cb...)
│
├── CONFIG RATE: 83% (10/12 services)
├── MCPs FONCTIONNELS: 9/12
└── Objectif: Cash flow + préparation restart
```

---

## PHASE 1: FONDATION TECHNIQUE (Semaine 1: 17-23 Déc)

### Jour 1: Configuration Critique (4h)

#### Tâche 1.1: Confirmer restart clients (30 min)
```
ACTION: Envoyer email aux 3 clients

TEMPLATE EMAIL:
───────────────────────────────────────────────────────────
Objet: Confirmation reprise 25 janvier 2026

Bonjour [Prénom],

Je prépare notre reprise de collaboration prévue pour le 25 janvier 2026.

Peux-tu me confirmer:
1. Que cette date te convient toujours?
2. S'il y a des besoins particuliers pour la reprise?
3. Si tu as des projets spécifiques en tête pour Q1 2026?

Je prépare une mise à jour de notre stack automation pour être
100% opérationnel dès le jour J.

À très vite,
[Ton nom]
───────────────────────────────────────────────────────────

ENVOYER À:
□ Henderson Shop - Contact: [email]
□ Alpha Medical - Contact: [email]
□ MyDealz - Contact: [email]
```

#### Tâche 1.2: Créer Google Service Account (1h30) ✅ COMPLÉTÉ (Session 21b)
```
STATUT SESSION 21b (18/12/2025):
├── ✅ Projet: a-automation-agency (ID: 359870692708)
├── ✅ Service Account: id-a-automation-service@a-automation-agency.iam.gserviceaccount.com
├── ✅ JSON: /Users/mac/.config/google/3a-automation-service-account.json
├── ✅ Permissions: 600 (sécurisé)
├── ✅ APIs activées: Analytics Data, Sheets, Admin
└── ✅ Test authentification: PASS
```

#### Tâche 1.3: Créer fichier .env (1h) ✅ COMPLÉTÉ + MÀJ Session 21b
```
FICHIER: /Users/mac/Desktop/JO-AAA/.env

STATUT SESSION 21b (18/12/2025):
├── ✅ 25 variables configurées (38%)
├── ✅ GitHub Token: testé OK
├── ✅ Google Cloud SA: configuré + JSON
├── ✅ Google Sheets: Spreadsheet ID sauvé, R/W testé
├── ✅ GA4: Property 516832662, Stream 13160825497, G-87F6FDJG45
├── ✅ Gemini: clé sauvée (quota free tier)
├── ✅ xAI/Grok: clé sauvée (crédits requis)
├── ✅ Hostinger: API testée OK (VPS 1168256)
├── ✅ n8n: instance accessible (API key à générer)
├── ⏳ Shopify: dev store agence à créer
├── ⏳ Klaviyo: compte agence à créer
└── ✅ Sécurité: .env dans .gitignore, clés retirées des .md
```

#### Tâche 1.4: Tester MCPs Google (1h) ✅ COMPLÉTÉ (Session 21b)
```
STATUT SESSION 21b (18/12/2025):

1. Google Sheets MCP ✅
   ├── Spreadsheet: 3A Automation - Leads & CRM
   ├── ID: 1b8k9EKo-6_O6Ay_z-Hrr1OrqBdjtjzF8JYwLgOnpM8g
   ├── Test lecture: ✅ PASS
   └── Test écriture: ✅ PASS

2. Google Analytics MCP ✅
   ├── Property ID: 516832662
   ├── Stream ID: 13160825497
   ├── Measurement ID: G-87F6FDJG45
   ├── Service Account ajouté avec rôle "Lecteur"
   └── Test API: ✅ PASS (users, sessions, pageviews)

3. Scripts de test créés:
   ├── scripts/test-google-auth.cjs
   ├── scripts/test-google-sheets.cjs
   └── scripts/test-ga4.cjs
```

---

### Jour 2-3: Refactoring Scripts Critiques (8h)

#### Tâche 2.1: Refactorer forensic_flywheel_analysis_complete.cjs (4h)
```
OBJECTIF: Script réutilisable pour tout client Shopify

MODIFICATIONS REQUISES:
1. Remplacer hardcoded credentials par process.env
2. Paramétrer le domaine Shopify
3. Ajouter gestion d'erreurs
4. Créer output PDF

FICHIER: /Users/mac/Desktop/JO-AAA/AGENCY-CORE-SCRIPTS-V3/forensic_flywheel_analysis_complete.cjs

VOIR: Section IMPLÉMENTATION pour le refactoring complet
```

#### Tâche 2.2: Refactorer audit-klaviyo-flows.cjs (2h)
```
OBJECTIF: Audit Klaviyo réutilisable

FICHIER: À localiser dans agency-scripts-Q1-GOLD/
```

#### Tâche 2.3: Tester les scripts (2h)
```
MÉTHODE DE TEST:

1. Créer boutique Shopify de test
   └── shopify.com → Start free trial (3 jours)
   └── Ajouter 5-10 produits de test

2. Exécuter forensic_flywheel_analysis
   └── node forensic_flywheel_analysis_complete.cjs --store test-store.myshopify.com
   └── Vérifier output

3. Documenter bugs trouvés
```

---

### Jour 4-5: Setup Commercial (8h)

#### Tâche 4.1: Créer landing page Hostinger (4h)
```
STRUCTURE PAGE:

1. HERO SECTION
   ├── Headline: "J'automatise votre boutique Shopify"
   ├── Subheadline: "Gagnez 10-20h/semaine. Augmentez vos revenus email de 25%+"
   └── CTA: "Réserver un audit gratuit" → Calendly

2. PROBLÈME / SOLUTION
   ├── "Vous perdez du temps sur..."
   │   ├── Emails manuels
   │   ├── Sync leads
   │   └── SEO répétitif
   └── "Je m'en occupe automatiquement"

3. SERVICES (cards)
   ├── Audit Gratuit - €0
   ├── Email Machine - €500
   ├── SEO Quick Fix - €300-500
   └── Lead Sync - €400

4. PREUVE SOCIALE
   └── "3 boutiques e-commerce automatisées"
   └── (Témoignages à ajouter plus tard)

5. CTA FINAL
   └── "Réservez votre audit gratuit"
   └── Calendly embed

6. FOOTER
   └── Contact email
   └── LinkedIn (optionnel)

TECH STACK HOSTINGER:
├── WordPress + Elementor (gratuit)
├── OU HTML simple
└── Formulaire: Calendly embed
```

#### Tâche 4.2: Configurer Calendly (30 min)
```
SETUP:

1. Créer compte Calendly (gratuit)
   └── calendly.com

2. Créer event type
   ├── Nom: "Audit E-commerce Gratuit"
   ├── Durée: 30 min
   ├── Description: "Discussion sur votre boutique Shopify
   │   et identification des opportunités d'automation"
   └── Questions:
       ├── URL de votre boutique Shopify
       ├── Chiffre d'affaires mensuel approximatif
       └── Principal défi actuel

3. Récupérer lien d'intégration
   └── Pour embed sur landing page

4. Connecter à Google Calendar
```

#### Tâche 4.3: Lister contacts warm network (1h30)
```
TEMPLATE LISTE:

| # | Nom | Relation | E-commerce? | Contact | Statut |
|---|-----|----------|-------------|---------|--------|
| 1 | [Nom] | Ancien collègue | Oui/Non/Inconnu | [email/LinkedIn] | À contacter |
| 2 | ... | ... | ... | ... | ... |

SOURCES DE CONTACTS:
├── LinkedIn (1er degré)
├── Anciens collègues
├── Amis entrepreneurs
├── Groupes Facebook e-commerce
├── Groupes LinkedIn Shopify
└── Contacts clients existants (referrals)

OBJECTIF: 20 contacts minimum
```

#### Tâche 4.4: Préparer message outreach (2h)
```
TEMPLATE MESSAGE LINKEDIN:

───────────────────────────────────────────────────────────
Salut [Prénom],

Je lance un nouveau service d'audit automation pour
boutiques Shopify et je cherche 3 personnes pour tester
mon process.

En échange de 30 min de ton temps, je te livre:
• Analyse complète de ta boutique
• 3-5 quick wins avec ROI estimé
• Rapport PDF que tu gardes

Pas de pitch, pas d'engagement.
Ça t'intéresse?

[Ton prénom]
───────────────────────────────────────────────────────────

TEMPLATE MESSAGE EMAIL:

───────────────────────────────────────────────────────────
Objet: Audit e-commerce gratuit - 3 places

Salut [Prénom],

Je lance un service d'automation pour boutiques Shopify.

Pour valider mon approche, j'offre un audit complet
gratuit aux 3 premières personnes intéressées.

Ce que tu obtiens:
• Analyse de ta boutique (produits, orders, emails)
• 3-5 quick wins identifiés avec ROI
• Rapport PDF de 5-10 pages

Ce que ça te coûte:
• 30 min de call pour me montrer ta boutique

Intéressé? Réponds à cet email ou réserve directement:
[Lien Calendly]

[Ton prénom]

PS: Je prends seulement 3 boutiques pour garantir la qualité.
───────────────────────────────────────────────────────────

VARIANTE POUR GROUPES:

───────────────────────────────────────────────────────────
[Post dans groupe Shopify/E-commerce]

🔍 3 audits e-commerce GRATUITS disponibles

Je suis consultant automation Shopify et je cherche
3 boutiques pour tester mon nouveau service d'audit.

Ce que j'analyse:
• Performance produits
• Email marketing (Klaviyo ou autre)
• Opportunités d'automation

Ce que tu obtiens:
• Rapport PDF avec 3-5 quick wins
• ROI estimé pour chaque action
• 30 min de call pour discuter

Conditions:
• Boutique Shopify active
• 30 min de ton temps

Intéressé? Commente "AUDIT" ou DM moi.
───────────────────────────────────────────────────────────
```

---

## PHASE 2: OUTREACH (Semaine 2-3: 24 Déc - 6 Jan)

### Semaine 2 (24-30 Déc) - 15h adaptées vacances

#### Tâches quotidiennes
```
LUNDI 23 (3h):
□ Envoyer 5 messages LinkedIn
□ Poster dans 1 groupe e-commerce
□ Répondre aux messages reçus

MARDI 24 - MERCREDI 25 (Noël):
□ Pause ou light (1h max)
□ Répondre aux messages urgents

JEUDI 26 - VENDREDI 27 (4h):
□ Envoyer 5 messages LinkedIn/email
□ Follow-up messages non répondus (J+3)
□ Continuer refactoring scripts

SAMEDI 28 - DIMANCHE 29 (4h):
□ Refactoring scripts
□ Préparer audits si prospects confirmés

LUNDI 30 (3h):
□ Envoyer 5 messages
□ Planifier calls audit semaine suivante
```

### Semaine 3 (31 Déc - 6 Jan) - 20h

#### Tâches clés
```
31 DÉC - 1 JAN:
□ Light work / pause

2-3 JAN (8h):
□ Livrer 1-2 audits gratuits
□ Créer rapport PDF professionnel
□ Présenter findings en call

4-5 JAN (6h):
□ Follow-up audits
□ Proposer service payant
□ Négocier/closer 1 client

6 JAN (6h):
□ Onboarding premier client payant
□ Planifier livraison
□ Collecter acompte (50%)
```

---

## PHASE 3: CONSOLIDATION (Semaine 4-5: 7-24 Jan)

### Semaine 4 (7-13 Jan) - 20h

```
OBJECTIFS:
□ Livrer service au premier client payant (10h)
□ Collecter testimonial/feedback (1h)
□ Préparer documentation clients existants (5h)
□ Continuer outreach (4h)
```

### Semaine 5 (14-24 Jan) - 20h

```
OBJECTIFS:
□ Finaliser livraison premier client (5h)
□ Préparer onboarding Henderson/Alpha/MyDealz (10h)
   ├── Vérifier accès Shopify
   ├── Vérifier accès Klaviyo
   ├── Préparer checklist démarrage
   └── Planifier calls kickoff 25/01
□ Documenter process pour répétabilité (5h)
```

---

## IMPLÉMENTATION TECHNIQUE

### Fichier .env

```bash
# /Users/mac/Desktop/JO-AAA/.env
# Configuration JO-AAA - Multi-client

# ═══════════════════════════════════════════════════════════════════
# GOOGLE SERVICES
# ═══════════════════════════════════════════════════════════════════
GOOGLE_APPLICATION_CREDENTIALS=/Users/mac/.config/google/service-account.json
GA4_PROPERTY_ID=
GOOGLE_SHEETS_SPREADSHEET_ID=

# ═══════════════════════════════════════════════════════════════════
# SHOPIFY - CLIENT ACTIF
# Changer ces valeurs pour chaque client
# ═══════════════════════════════════════════════════════════════════
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ACCESS_TOKEN=
SHOPIFY_API_VERSION=2024-01

# ═══════════════════════════════════════════════════════════════════
# KLAVIYO
# ═══════════════════════════════════════════════════════════════════
KLAVIYO_API_KEY=
KLAVIYO_PRIVATE_KEY=

# ═══════════════════════════════════════════════════════════════════
# META/FACEBOOK
# ═══════════════════════════════════════════════════════════════════
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
META_PAGE_ID=

# ═══════════════════════════════════════════════════════════════════
# APIFY
# ═══════════════════════════════════════════════════════════════════
APIFY_TOKEN=

# ═══════════════════════════════════════════════════════════════════
# N8N
# ═══════════════════════════════════════════════════════════════════
N8N_HOST=
N8N_API_KEY=

# ═══════════════════════════════════════════════════════════════════
# AI SERVICES
# ═══════════════════════════════════════════════════════════════════
XAI_API_KEY=xai-xxx...  # ⚠️ CONFIGURÉ mais nécessite crédits ($5 min)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# ═══════════════════════════════════════════════════════════════════
# OUTPUT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════
OUTPUT_DIR=/Users/mac/Desktop/JO-AAA/outputs
LOG_LEVEL=info
```

### Script de test .env

```javascript
// /Users/mac/Desktop/JO-AAA/scripts/test-env.cjs
// Tester que le fichier .env est correctement chargé

require('dotenv').config({ path: '/Users/mac/Desktop/JO-AAA/.env' });

console.log('═══════════════════════════════════════════════════════════');
console.log('TEST CONFIGURATION .ENV');
console.log('═══════════════════════════════════════════════════════════');

const requiredVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'SHOPIFY_STORE_DOMAIN',
  'SHOPIFY_ACCESS_TOKEN',
  'KLAVIYO_API_KEY'
];

const optionalVars = [
  'GA4_PROPERTY_ID',
  'META_ACCESS_TOKEN',
  'APIFY_TOKEN',
  'N8N_HOST'
];

console.log('\n✅ VARIABLES REQUISES:');
requiredVars.forEach(v => {
  const value = process.env[v];
  const status = value ? '✓' : '✗';
  const display = value ? value.substring(0, 20) + '...' : 'NON DÉFINI';
  console.log(`  ${status} ${v}: ${display}`);
});

console.log('\n⚠️ VARIABLES OPTIONNELLES:');
optionalVars.forEach(v => {
  const value = process.env[v];
  const status = value ? '✓' : '○';
  const display = value ? value.substring(0, 20) + '...' : 'non défini';
  console.log(`  ${status} ${v}: ${display}`);
});

console.log('\n═══════════════════════════════════════════════════════════');

// Test Google Service Account
const fs = require('fs');
const googlePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (googlePath && fs.existsSync(googlePath)) {
  console.log('✅ Google Service Account: Fichier trouvé');
  const sa = JSON.parse(fs.readFileSync(googlePath, 'utf8'));
  console.log(`   Client email: ${sa.client_email}`);
} else {
  console.log('❌ Google Service Account: Fichier NON TROUVÉ');
}

console.log('═══════════════════════════════════════════════════════════');
```

---

## CHECKLIST DE VALIDATION

### Fin Semaine 1
```
□ 3 emails de confirmation envoyés aux clients existants
□ Google Service Account créé et testé
□ Fichier .env créé avec variables de base
□ forensic_flywheel_analysis.cjs refactoré
□ Landing page Hostinger en ligne
□ Calendly configuré et intégré
□ Liste 20 contacts warm network
□ Templates messages prêts
```

### Fin Semaine 3
```
□ 15-20 messages outreach envoyés
□ 2-3 audits gratuits livrés
□ 1 client converti (ou en négociation)
□ Premier paiement reçu (idéalement)
```

### Fin Semaine 5 (24 Jan)
```
□ 1 client payant servi
□ 1 testimonial collecté
□ 3 clients existants prêts pour restart
□ Process documenté
□ MVP VALIDÉ
```

---

## MÉTRIQUES DE SUCCÈS

| Métrique | Objectif S1 | Objectif S3 | Objectif S5 |
|----------|-------------|-------------|-------------|
| Emails clients envoyés | 3 | 3 | 3 |
| Confirmations reçues | - | 3 | 3 |
| Outreach messages | 10 | 20 | 25 |
| Audits livrés | 0 | 2-3 | 3-4 |
| Clients convertis | 0 | 1 | 1+ |
| Revenue généré | €0 | €0-500 | €500-1000 |
| Scripts refactorés | 5 | 8 | 10 |

---

## RESSOURCES

### Liens utiles
```
Google Cloud Console: https://console.cloud.google.com
Calendly: https://calendly.com
Shopify Partners: https://partners.shopify.com
Klaviyo: https://www.klaviyo.com
xAI Console: https://console.x.ai
xAI Voice API Docs: https://docs.x.ai/docs/guides/voice
LiveKit xAI Plugin: https://docs.livekit.io/agents/integrations/llm/xai/
```

### KNOWLEDGE BASE RAG (Complété 18/12/2025)
```
PHASE 1 TERMINÉE:
├── knowledge-base/src/document-parser.cjs   → 273 chunks
├── knowledge-base/src/vector-store.cjs      → BM25 (2853 tokens)
├── knowledge-base/src/rag-query.cjs         → Multi-search interface
├── knowledge-base/src/catalog-extractor.cjs → 3 packages, 15 automations
└── scripts/grok-client.cjs v2.0             → RAG-enhanced

USAGE:
node scripts/grok-client.cjs          # Chat avec RAG
node scripts/grok-client.cjs --no-rag # Chat sans RAG
/catalog                              # Voir catalogue
/stats                                # Stats KB
```

### Voice AI - Scope Clarifié (18/12/2025)
```
DUAL PURPOSE (Clarifié par User):
├── Use Case 1: AI SHOPPING ASSISTANT
│   ├── Recherche produits vocale
│   ├── Recommandations
│   ├── Prix, stock, promos
│   └── Guidage checkout
│
├── Use Case 2: SUPPORT CLIENT
│   ├── Suivi commande
│   ├── Livraison
│   ├── Retours/remboursements
│   └── FAQ + escalade

STACK: xAI Grok Voice ($0.05/min)
EFFORT ESTIMÉ: 116-172 heures (6-9 semaines @ 20h/sem)
COÛT OPÉRATIONNEL: ~$0.32/appel

PHASES IMPLÉMENTATION:
□ Phase 1: Voice Gateway + STT + TTS (44-68h)
□ Phase 2: Intent Router + Shopify (36-52h)
□ Phase 3: Shopping + Support modes (36-52h)

PRÉREQUIS:
├── XAI_API_KEY configurée ✅
├── Crédits xAI ($5 minimum) ❌ MANQUANT
├── Knowledge Base RAG ✅ COMPLÉTÉ
├── Shopify MCP ✅ DISPONIBLE
└── Klaviyo MCP ✅ DISPONIBLE
```

### Documents de référence
```
/Users/mac/Desktop/JO-AAA/BUSINESS-MODEL-FACTUEL-2025.md
/Users/mac/Desktop/JO-AAA/FORENSIC-AUDIT-TRUTH-2025-12-16.md
/Users/mac/Desktop/JO-AAA/.env.mcp.example
```

---

## PLAN ACTIONNABLE - FIN SESSION 21c (19/12/2025)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACCOMPLISSEMENTS SESSION 21c                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ SITE 3a-automation.com DÉPLOYÉ ET LIVE                                 │
│      • HTTP/2 200 sur domaine principal ET www                              │
│      • SSL Let's Encrypt fonctionnel                                        │
│      • Container nginx:alpine + Traefik                                     │
│                                                                              │
│   ✅ Repo GitHub PRIVÉ maintenu avec deployment fonctionnel                 │
│      • Token renouvelé: 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            │
│      • Méthode: curl + Authorization header + API tarball                   │
│                                                                              │
│   ✅ Apify MCP CONFIGURÉ                                                    │
│      • Token: apify_api_1AN2ir03QyGoLORkh47gMKPeoBXhWN1EWhpf                │
│                                                                              │
│   ✅ GitHub Actions Workflow créé                                           │
│      • .github/workflows/deploy.yml                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROCHAINES ACTIONS PRIORITAIRES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   □ PRIORITÉ 1 - n8n API Key (5 min)                                        │
│     URL: https://n8n.srv1168256.hstgr.cloud/settings/api                   │
│     Action: Créer clé API pour MCP                                          │
│                                                                              │
│   □ PRIORITÉ 2 - Shopify Partners Dev Store (30 min)                        │
│     URL: https://partners.shopify.com                                       │
│     Action: Créer "3a-automation-dev" pour tests                            │
│                                                                              │
│   □ PRIORITÉ 3 - Activer xAI Crédits ($5)                                   │
│     URL: https://console.x.ai/billing                                       │
│     Action: Acheter crédits pour Voice Agent                                │
│                                                                              │
│   □ PRIORITÉ 4 - Tracking Analytics                                         │
│     Remplacer placeholders dans site:                                       │
│     • GTM-XXXXXXX → ID réel                                                 │
│     • G-XXXXXXXXXX → G-87F6FDJG45                                           │
│                                                                              │
│   □ PRIORITÉ 5 - Emails restart clients                                     │
│     Envoyer confirmation reprise 25/01/2026                                 │
│                                                                              │
│   MÉTRIQUES ACTUELLES:                                                      │
│   ───────────────────────────────────────────────────────────────────────   │
│   • Site: LIVE ✅ (https://3a-automation.com)                               │
│   • Services configurés: 10/12 (83%)                                        │
│   • MCPs fonctionnels: 9/12 (75%)                                           │
│   • Containers VPS: 3 (traefik, n8n, website)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document créé:** 17 Décembre 2025
**Mis à jour:** 19 Décembre 2025 (Session 21c - Site LIVE + GitHub token renouvelé)
**Objectif:** Premier client payant avant le 25 janvier 2026
**Principe:** Actions concrètes, résultats mesurables
