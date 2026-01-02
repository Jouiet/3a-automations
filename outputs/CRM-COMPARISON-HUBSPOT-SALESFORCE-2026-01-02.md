# Analyse Comparative CRM: HubSpot vs Salesforce vs Klaviyo

**Date:** 2026-01-02
**Auteur:** 3A Automation
**Objectif:** Déterminer si nos workflows Klaviyo peuvent être répliqués pour HubSpot et Salesforce

---

## Executive Summary

| Critère | Klaviyo | HubSpot | Salesforce MC |
|---------|---------|---------|---------------|
| **Marché cible** | E-commerce B2C | B2B + B2C | Enterprise |
| **Prix minimum (automation)** | $20/mo | $890/mo (Pro) | $1,250/mo |
| **API Access** | Tous les plans | Tous les plans | Tous les plans |
| **Workflows/Flows API** | Oui | Pro+ seulement | Oui |
| **Complexité setup** | Faible | Moyenne | Haute (3-6 mois) |
| **npm SDK officiel** | Non officiel | Oui (@hubspot/api-client) | Community (sfmc-sdk) |
| **Fit PME B2B** | Faible | Fort | Faible (overengineered) |

**VERDICT GLOBAL:** HubSpot est le choix évident pour PME B2B. Salesforce MC est overkill.

---

## 1. Inventaire Workflows Klaviyo Actuels

### 1.1 Flows Email (9 automations)

| ID | Workflow | Type | Réplicable HubSpot? | Réplicable Salesforce? |
|----|----------|------|---------------------|------------------------|
| welcome-series | Welcome Series (5 emails) | klaviyo-flow | ✅ Workflows (Pro+) | ✅ Journey Builder |
| abandoned-cart | Abandoned Cart (3 emails) | klaviyo-flow | ✅ Workflows (Pro+) | ✅ Journey Builder |
| browse-abandonment | Browse Abandonment (2 emails) | klaviyo-flow | ✅ Workflows (Pro+) | ✅ Journey Builder |
| post-purchase | Post-Purchase (5 emails) | klaviyo-flow | ✅ Workflows (Pro+) | ✅ Journey Builder |
| win-back | Win-Back (3 emails) | klaviyo-flow | ✅ Workflows (Pro+) | ✅ Journey Builder |
| vip-tiers | VIP Tiers (4 segments) | klaviyo-segment | ✅ Lists API | ✅ Data Extensions |
| flows-audit | Flow Audit | script | ✅ Adaptable | ✅ Adaptable |
| ab-sender-rotation | A/B Sender Rotation | script | ✅ Adaptable | ✅ Adaptable |
| audit-klaviyo-flows-v2 | Audit V2 | script | ✅ Adaptable | ✅ Adaptable |

### 1.2 Lead Gen Pipelines (4 automations)

| ID | Workflow | Type | Réplicable HubSpot? | Réplicable Salesforce? |
|----|----------|------|---------------------|------------------------|
| hot-warm-cold | HOT/WARM/COLD Segmentation | klaviyo-segment | ✅ Contact Properties + Lists | ✅ Data Extensions |
| geo-segmentation | Geo-Segmentation | script | ✅ Adaptable | ✅ Adaptable |
| linkedin-to-klaviyo-pipeline | LinkedIn → CRM | script | ✅ Contacts API | ✅ REST API |
| google-maps-to-klaviyo-pipeline | Google Maps → CRM | script | ✅ Contacts API | ✅ REST API |

---

## 2. Analyse API Comparative

### 2.1 HubSpot API

**Sources:** [HubSpot Developer Docs](https://developers.hubspot.com/docs/api-reference/overview), [APIs by Tier](https://developers.hubspot.com/apisbytier)

#### SDK Officiel
```bash
npm install @hubspot/api-client
```

#### APIs Disponibles par Tier

| API | Free | Starter | Pro | Enterprise |
|-----|------|---------|-----|------------|
| Contacts CRUD | ✅ | ✅ | ✅ | ✅ |
| Companies CRUD | ✅ | ✅ | ✅ | ✅ |
| Deals CRUD | ✅ | ✅ | ✅ | ✅ |
| Lists API | ✅ | ✅ | ✅ | ✅ |
| Email Send | ❌ | ✅ | ✅ | ✅ |
| **Workflows API** | ❌ | ✅ (basique) | ✅ | ✅ |
| Sequences API | ❌ | ❌ | ✅ | ✅ |
| Marketing Emails | ❌ | ✅ | ✅ | ✅ |

#### Limitations CRITIQUES
- **Workflows API = Starter+ minimum** ($50/mo)
- **Sequences (email automation) = Sales Hub Pro+** ($890/mo)
- **API Rate Limit:** 100 req/10 sec (150 avec private apps)
- **Search:** Max 3 FilterGroups x 3 Filters

#### Exemple Code
```javascript
const hubspot = require('@hubspot/api-client');
const client = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Créer contact
const contact = await client.crm.contacts.basicApi.create({
  properties: { email: 'test@example.com', firstname: 'Jean' }
});

// Rechercher contacts
const results = await client.crm.contacts.searchApi.doSearch({
  filterGroups: [{ filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: '@company.com' }] }],
  properties: ['email', 'firstname', 'lastname'],
  limit: 100
});
```

### 2.2 Salesforce Marketing Cloud API

**Sources:** [SFMC APIs Overview](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/apis-overview.html)

#### SDK Community
```bash
npm install sfmc-sdk
# ou
npm install sfmc-fuelsdk-node
```

#### APIs Disponibles

| API | Type | Usage |
|-----|------|-------|
| REST API | JSON/HTTP | Triggered Sends, Contacts, Content |
| SOAP API | XML | Email Studio, Automations, Tracking |
| Journey Builder API | REST | Customer Journeys |
| Transactional API | REST | Real-time email/SMS |

#### Limitations CRITIQUES
- **Prix minimum:** $1,250/mo (Growth), $2,000/mo (Basic with automation)
- **Developer API Access:** +$1,400/user/mo (optionnel)
- **Implementation:** 3-6 mois typiquement
- **Compétences requises:** SQL pour segmentation avancée
- **Rate Limits:** 2,500-1,000,000 calls/jour selon plan

#### Verdict Salesforce MC
```
OVERKILL pour PME B2B.
- Setup complexity: HAUTE
- Prix: PROHIBITIF
- ROI: Négatif pour <$50k MRR
```

### 2.3 Klaviyo API (Référence)

**Source:** [Klaviyo Developer Docs](https://developers.klaviyo.com/)

#### SDK
```bash
npm install klaviyo-api  # Community package
```

#### APIs Disponibles (tous les plans)

| API | Endpoint | Usage |
|-----|----------|-------|
| Profiles | /api/profiles | Contacts CRUD |
| Lists | /api/lists | List management |
| Segments | /api/segments | Dynamic segmentation |
| Flows | /api/flows | Automation flows |
| Campaigns | /api/campaigns | Email campaigns |
| Metrics | /api/metrics | Analytics |
| Events | /api/events | Custom events |

---

## 3. Mapping Workflows: Klaviyo → HubSpot

### 3.1 Scripts à Adapter

| Script Klaviyo | Script HubSpot Équivalent | Effort |
|----------------|---------------------------|--------|
| `linkedin-to-klaviyo-pipeline.cjs` | `linkedin-to-hubspot-pipeline.cjs` | 4h |
| `google-maps-to-klaviyo-pipeline.cjs` | `google-maps-to-hubspot-pipeline.cjs` | 4h |
| `geo-segment-profiles.cjs` | `hubspot-geo-segment.cjs` | 3h |
| `audit-klaviyo-flows.cjs` | `audit-hubspot-workflows.cjs` | 6h |

### 3.2 Équivalences API

| Klaviyo | HubSpot | Notes |
|---------|---------|-------|
| `POST /api/profiles` | `crm.contacts.basicApi.create()` | Direct |
| `POST /api/lists/{id}/relationships/profiles` | `crm.lists.membershipsApi.add()` | Direct |
| `GET /api/segments` | `crm.lists.listsApi.getAll()` | HubSpot = static lists + active lists |
| `GET /api/flows` | Workflows API (Pro+) | Tier restriction |
| `POST /api/events` | `events.eventsApi.create()` | Custom events |

### 3.3 Limitations HubSpot vs Klaviyo

| Feature | Klaviyo | HubSpot |
|---------|---------|---------|
| E-commerce tracking natif | ✅ Shopify, WooCommerce | ⚠️ Intégrations tierces |
| Abandoned cart trigger | ✅ Natif | ⚠️ Shopify sync requis |
| Browse abandonment | ✅ Natif | ⚠️ Tracking JS requis |
| SMS dans flows | ✅ Natif | ⚠️ Add-on requis |
| Product recommendations | ✅ AI natif | ❌ Non disponible |

---

## 4. Top 5 Workflows B2B PME - ANALYSE DÉTAILLÉE

### DISTINCTION CRITIQUE: B2B ≠ B2C

| Critère | B2C (Klaviyo) | B2B (HubSpot/Salesforce) |
|---------|---------------|--------------------------|
| Cycle de vente | Court (minutes-jours) | Long (semaines-mois) |
| Décideur | 1 personne | Buying committee (3-7 personnes) |
| Trigger principal | Comportement achat | Engagement content + intent signals |
| Métrique clé | Revenue/transaction | Pipeline value, MQL→SQL conversion |
| Automatisation | Cart abandonment, browse | Lead scoring, deal stage progression |

---

## 4.1 HubSpot: Top 5 Workflows B2B PME

**Source:** [Essential HubSpot Workflows 2025](https://huble.com/blog/10-hubspot-workflows-to-implement), [B2B Lead Generation](https://www.sagemarketing.io/blog/10-hubspot-automation-workflows-for-b2b-lead-generation/)

### Workflow #1: Lead Scoring + MQL Qualification

**Importance B2B:** 81% des acheteurs B2B rencontrent des barrières d'achat. Le scoring identifie les leads prêts.

```
TRIGGER: Toute interaction (email, page, form, meeting)

SCORING RULES:
+5 pts  → Page view (pricing, case studies)
+10 pts → Email click
+20 pts → Content download (whitepaper, ebook)
+30 pts → Demo request form
+50 pts → Meeting scheduled
-10 pts → 30 jours sans activité

THRESHOLD ACTIONS:
Score ≥ 80 → Lifecycle = MQL → Notify Sales → Create Deal
Score 40-79 → Add to Nurture Sequence
Score < 40 → Educational content only
```

**API HubSpot:**
```javascript
// Update lead score property
await client.crm.contacts.basicApi.update(contactId, {
  properties: {
    lead_score: currentScore + points,
    hs_lead_status: score >= 80 ? 'MQL' : 'Nurturing'
  }
});
```

**Tier requis:** Marketing Hub Pro ($890/mo) ou Sales Hub Pro ($450/mo)

---

### Workflow #2: Lead Routing Intelligent

**Importance B2B:** Réponse <5 min = 4x plus de qualification. Le routing automatique élimine les délais.

```
TRIGGER: New contact created (form, import, API)

ROUTING RULES:
1. IF country IN [France, Belgium, Switzerland] → Assign to Sales Rep FR
2. IF company_size > 50 employees → Assign to Enterprise Team
3. IF industry = "SaaS" → Assign to Tech Specialist
4. IF source = "LinkedIn" → Assign to SDR LinkedIn
5. DEFAULT → Round-robin assignment

ACTIONS:
1. Assign owner based on rules
2. Create task: "Follow up within 4 hours"
3. Send internal Slack notification
4. Log activity: "Lead assigned via automation"
```

**API HubSpot:**
```javascript
// Intelligent routing
const rules = [
  { condition: contact.country === 'France', owner: 'rep_fr_id' },
  { condition: contact.company_size > 50, owner: 'enterprise_team_id' }
];

const assignedOwner = rules.find(r => r.condition)?.owner || roundRobin();
await client.crm.contacts.basicApi.update(contactId, {
  properties: { hubspot_owner_id: assignedOwner }
});
```

**Tier requis:** CRM Free (routing manuel) ou Starter ($50/mo) pour automation

---

### Workflow #3: Deal Stage Progression

**Importance B2B:** 35% plus de deals closés avec sales automation (HubSpot data).

```
TRIGGER: Deal stage change

STAGE ACTIONS:
"Appointment Scheduled":
  → Create prep task (1 day before)
  → Send confirmation email to prospect

"Qualified to Buy":
  → Send case study email (industry-specific)
  → Notify sales manager

"Proposal Sent":
  → Create follow-up task (3 days)
  → Send reminder email if no response (7 days)

"Negotiation":
  → Create urgency task
  → Send comparison guide

"Closed Won":
  → Trigger onboarding sequence
  → Update contact lifecycle = Customer
  → Create CS handoff task

"Closed Lost":
  → Log lost reason
  → Add to re-engagement list (90 days)
  → Schedule "check-in" task (6 months)
```

**API HubSpot:**
```javascript
// Deal stage webhook handler
app.post('/webhook/deal-stage', async (req, res) => {
  const { dealId, stage } = req.body;

  if (stage === 'closedwon') {
    // Trigger onboarding
    await client.crm.deals.associationsApi.create(dealId, 'contacts', contactId, 'customer');
    await createOnboardingTasks(dealId);
  }
});
```

**Tier requis:** Sales Hub Pro ($450/mo) ou Marketing Hub Pro ($890/mo)

---

### Workflow #4: B2B Nurture Sequence (Lead → MQL)

**Importance B2B:** Lead nurturing = 50% plus de leads sales-ready à 33% moins de coût.

```
TRIGGER: Contact lifecycle = Lead + score < 80

SEQUENCE (21 jours):
Day 0: Welcome email
  - Subject: "Bienvenue chez [Company]"
  - Content: Value proposition + 1 quick win

Day 3: Educational content
  - Subject: "3 erreurs à éviter en [Industry]"
  - Content: Thought leadership, no CTA

Day 7: Case study
  - Subject: "Comment [Similar Company] a augmenté de X%"
  - Content: Résultats concrets, metrics

Day 14: Soft CTA
  - Subject: "Une question rapide..."
  - Content: "Avez-vous besoin d'aide avec X?"
  - CTA: Reply or book call

Day 21: Hard CTA (if no engagement)
  - Subject: "Dernière chance: [Offer]"
  - Content: Urgency + clear CTA
  - CTA: Schedule demo

BRANCHING:
IF email opened Day 7 → Skip to Day 14 (faster path)
IF form submitted → Exit sequence, route to sales
IF no opens after 3 emails → Add to re-engagement (60 days)
```

**API HubSpot:**
```javascript
// Enroll in sequence
await client.automation.sequencesApi.enroll({
  sequenceId: 'nurture_sequence_id',
  contactId: contactId,
  senderId: salesRepId
});
```

**Tier requis:** Sales Hub Pro ($450/mo) pour Sequences

---

### Workflow #5: Meeting Automation + Follow-up

**Importance B2B:** Post-meeting follow-up = clé de la conversion. 80% des deals nécessitent 5+ follow-ups.

```
TRIGGER: Meeting booked via HubSpot Meetings

PRE-MEETING (automated):
-24h: Send reminder email with agenda
-1h: Slack notification to sales rep

POST-MEETING (automated):
+1h: Create follow-up task
+2h: Send thank-you email with meeting notes template
+3 days: Check if deal created
  IF no deal → Create reminder task
  IF deal created → Add to pipeline automation

NO-SHOW HANDLING:
IF meeting marked as no-show:
  → Send reschedule email
  → Create task: "Attempt reschedule within 48h"
  → If 2+ no-shows → Flag as unresponsive
```

**API HubSpot:**
```javascript
// Post-meeting automation
const meeting = await client.crm.objects.meetings.basicApi.getById(meetingId);

if (meeting.properties.hs_meeting_outcome === 'COMPLETED') {
  // Create follow-up task
  await client.crm.objects.tasks.basicApi.create({
    properties: {
      hs_task_subject: `Follow-up: ${meeting.properties.hs_meeting_title}`,
      hs_task_status: 'NOT_STARTED',
      hs_task_priority: 'HIGH',
      hs_timestamp: Date.now() + 86400000 // +1 day
    }
  });
}
```

**Tier requis:** Sales Hub Starter ($20/mo) pour Meetings, Pro ($450/mo) pour automation complète

---

## 4.2 Salesforce: Top 5 Workflows B2B PME

**Source:** [SFMC B2B Guide](https://www.metromaxsolutions.com/salesforce-marketing-cloud-for-b2b-unlocking-automation-abm-and-lead-nurturing-beyond-retail/), [Account Engagement Guide](https://genesysgrowth.com/blog/salesforce-account-engagement-(pardot)-complete-guide)

### Workflow #1: Einstein Lead Scoring (AI-Powered)

```
CONFIGURATION:
1. Enable Einstein Lead Scoring in Setup
2. Train model on historical conversion data
3. Define scoring signals:
   - Email engagement
   - Web activity
   - Content downloads
   - Meeting attendance

AUTOMATION:
Score ≥ 75 → Auto-assign to AE
Score 50-74 → Add to SDR queue
Score < 50 → Marketing nurture
```

**Limites:** Disponible uniquement avec Sales Cloud Einstein ($50/user/mo add-on)

---

### Workflow #2: Journey Builder Multi-Channel

```
JOURNEY: "New Lead to Qualified Opportunity"

ENTRY: Lead created in Sales Cloud

DAY 0: Email → Welcome + Value Prop
DAY 2: SMS → "Quick question about your needs"
DAY 5: Email → Case Study (industry-specific)
DAY 7: AI Decision Point:
  - IF high engagement → Fast track to sales
  - IF medium → Continue journey
  - IF low → Re-engagement path
DAY 10: Email → Demo invitation
DAY 14: IF no response → Exit to re-engagement journey
```

**Prix:** Journey Builder inclus dans Marketing Cloud Growth ($1,250/mo)

---

### Workflow #3: Account-Based Marketing (ABM)

```
TARGET: High-value accounts (>$100k potential)

MULTI-STAKEHOLDER JOURNEY:
1. Identify buying committee (CEO, CFO, CTO)
2. Personalize content per role:
   - CEO → ROI, strategic vision
   - CFO → Cost savings, TCO
   - CTO → Technical capabilities, integration
3. Coordinate touchpoints across stakeholders
4. Track account-level engagement score
5. Alert sales when account score threshold met
```

**Prix:** Account Engagement (Pardot) $1,250/mo ou Marketing Cloud Account Edition

---

### Workflow #4: Opportunity Stage Automation

```
TRIGGER: Opportunity stage change (Sales Cloud)

ACTIONS:
Stage = "Discovery":
  → Send discovery questionnaire
  → Create qualification task

Stage = "Proposal":
  → Generate proposal document (CPQ)
  → Schedule review meeting

Stage = "Negotiation":
  → Alert sales manager
  → Send competitive comparison

Stage = "Closed Won":
  → Trigger implementation kickoff
  → Update contact to "Customer"
  → Create onboarding case
```

**Prix:** Sales Cloud Process Builder inclus, Marketing Cloud pour emails

---

### Workflow #5: Re-Engagement (Closed Lost Recovery)

```
TRIGGER: Opportunity marked "Closed Lost"

WAIT: 90 days

JOURNEY:
Day 90: Email → "Things have changed since we last spoke"
Day 97: Email → New feature announcement
Day 104: Email → Special offer for returning prospects
Day 120: IF engagement → Route back to sales
        IF no engagement → Archive contact
```

**Prix:** Marketing Cloud Journey Builder ou Account Engagement

---

## 4.3 Tableau Comparatif: HubSpot vs Salesforce pour B2B PME

| Workflow | HubSpot Tier | HubSpot Prix | Salesforce Tier | Salesforce Prix |
|----------|--------------|--------------|-----------------|-----------------|
| Lead Scoring | Pro | $450-890/mo | Einstein | $50/user add-on |
| Lead Routing | Starter | $50/mo | Process Builder | Inclus Sales Cloud |
| Deal Stage Automation | Pro | $450/mo | Process Builder | Inclus Sales Cloud |
| Nurture Sequences | Sales Pro | $450/mo | Account Engagement | $1,250/mo |
| Meeting Automation | Starter | $20/mo | High Velocity Sales | $75/user/mo |
| ABM | Enterprise | $3,600/mo | Account Engagement | $1,250/mo |

### Verdict TCO pour PME B2B (10-50 employés)

| Scénario | HubSpot | Salesforce |
|----------|---------|------------|
| **Minimum viable B2B** | $470/mo (Sales Pro + Marketing Starter) | $1,400/mo (Sales Cloud + Account Engagement) |
| **Full B2B automation** | $1,340/mo (Sales Pro + Marketing Pro) | $2,500/mo+ (Sales + Marketing Cloud) |
| **Implementation** | 2-4 semaines | 3-6 mois |
| **Training required** | Modéré | Extensif (SQL, AMPscript) |

**RECOMMANDATION PME B2B (<€50k MRR):** HubSpot
**RECOMMANDATION Enterprise (>€100k MRR):** Salesforce (si équipe technique dédiée)

---

## 5. Coût Total de Possession (TCO)

### 5.1 HubSpot

| Item | Mensuel | Annuel |
|------|---------|--------|
| Marketing Hub Starter | $20 | $240 |
| Marketing Hub Pro (automation) | $890 | $10,680 |
| Sales Hub Pro (sequences) | $450 | $5,400 |
| **Total PME (Pro)** | **$1,340** | **$16,080** |
| Onboarding fee (one-time) | - | $3,000 |

### 5.2 Salesforce Marketing Cloud

| Item | Mensuel | Annuel |
|------|---------|--------|
| Growth Package | $1,250 | $15,000 |
| Plus Package | $4,400 | $52,800 |
| Developer API Access | $1,400/user | $16,800/user |
| **Total PME** | **$2,650+** | **$31,800+** |
| Implementation (typical) | - | $10,000-50,000 |

### 5.3 Klaviyo (Comparaison)

| Profiles | Mensuel | Annuel |
|----------|---------|--------|
| 500 | $20 | $240 |
| 2,500 | $60 | $720 |
| 10,000 | $150 | $1,800 |
| 50,000 | $720 | $8,640 |

---

## 6. Verdict Final

### 6.1 Peut-on répliquer les workflows Klaviyo?

| Pour HubSpot | Verdict |
|--------------|---------|
| Lead pipelines (LinkedIn, Google Maps) | ✅ OUI - Contacts API (Free) |
| Segmentation (HOT/WARM/COLD) | ✅ OUI - Lists API (Free) |
| Email sequences | ⚠️ PRO REQUIS ($890/mo) |
| Audit scripts | ✅ OUI - Adaptable |
| E-commerce flows | ⚠️ PARTIEL - Intégrations requises |

| Pour Salesforce MC | Verdict |
|--------------------|---------|
| Tous workflows | ✅ OUI techniquement |
| Mais... | ❌ OVERKILL pour PME |
| Prix | ❌ PROHIBITIF ($1,250+/mo minimum) |
| Complexité | ❌ 3-6 mois implementation |

### 6.2 Recommandation Stratégique

```
POUR PME B2B (€10k-500k revenue):

1. HubSpot Free CRM + Starter Marketing ($45/mo)
   - Contacts, Companies, Deals: INCLUS
   - Basic email marketing: INCLUS
   - Simple automations: INCLUS
   - ❌ Advanced workflows: NON

2. HubSpot Pro Bundle (~$1,340/mo)
   - Full marketing automation: INCLUS
   - Sales sequences: INCLUS
   - Lead scoring: INCLUS
   - Reporting avancé: INCLUS
   - RECOMMANDÉ si budget > €1,500/mo

3. Salesforce MC: NON RECOMMANDÉ
   - Overkill pour PME
   - ROI négatif sous €50k MRR
   - Compétences SQL requises
```

### 6.3 Action Items

| Priorité | Action | Effort | Dépendance |
|----------|--------|--------|------------|
| P1 | Créer `hubspot-lead-pipeline.cjs` | 8h | HubSpot account |
| P1 | Créer `hubspot-geo-segment.cjs` | 4h | HubSpot account |
| P2 | Créer `audit-hubspot-workflows.cjs` | 6h | HubSpot Pro |
| P3 | Adapter B2B email templates | 4h | - |
| P4 | Documentation client HubSpot | 4h | - |

---

## 7. Sources

### HubSpot
- [HubSpot API Reference](https://developers.hubspot.com/docs/api-reference/overview)
- [HubSpot APIs by Tier](https://developers.hubspot.com/apisbytier)
- [Automation API v4 (Beta)](https://developers.hubspot.com/docs/api/automation/workflows)
- [@hubspot/api-client npm](https://www.npmjs.com/package/@hubspot/api-client)
- [HubSpot Pricing 2025](https://hubxpert.com/hubspot-pricing-2025)

### Salesforce
- [SFMC APIs Overview](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/apis-overview.html)
- [SFMC REST API](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/rest-api-overview.html)
- [sfmc-sdk npm](https://www.npmjs.com/package/sfmc-sdk)
- [SFMC Pricing 2025](https://www.trustradius.com/products/salesforce-marketing-cloud/pricing)

### Comparaisons
- [Klaviyo vs HubSpot 2025](https://flowium.com/blog/hubspot-vs-klaviyo/)
- [SFMC vs HubSpot 2025](https://routine-automation.com/blog/salesforce-marketing-cloud-vs-hubspot)
- [B2B Lead Generation 2025](https://monday.com/blog/crm-and-sales/lead-generation-automation/)

---

**Conclusion:** Pour les PME B2B, HubSpot est le choix rationnel. Salesforce MC est réservé aux entreprises avec >$50k MRR et équipe technique dédiée. Nos scripts Klaviyo peuvent être adaptés pour HubSpot avec ~26h d'effort total.
