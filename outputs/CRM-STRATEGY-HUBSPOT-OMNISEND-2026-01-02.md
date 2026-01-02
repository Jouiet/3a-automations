# Stratégie CRM: HubSpot B2B + Omnisend B2C

**Date:** 2026-01-02
**Session:** 119
**Statut:** ANALYSE COMPLÈTE - DÉCISIONS PRISES

---

## Résumé Exécutif

| Segment | CRM Recommandé | Raison Principale |
|---------|---------------|-------------------|
| **B2B PME** | HubSpot FREE | CRM gratuit + API complète |
| **B2C E-commerce** | Omnisend Standard | Moins cher que Klaviyo + pré-built flows |
| **B2C Premium** | Klaviyo (maintenir) | Clients existants + API flows complète |

---

## 1. Analyse Factuelle des APIs

### 1.1 Capacités API Comparées

| Fonctionnalité | Klaviyo | Omnisend | HubSpot FREE | HubSpot Pro |
|---------------|---------|----------|--------------|-------------|
| Contacts CRUD | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Companies CRUD | ❌ | ❌ | ✅ Full | ✅ Full |
| Deals CRUD | ❌ | ❌ | ✅ Full | ✅ Full |
| Flows/Automations CREATE | ✅ `POST /flows/` | ❌ READ-ONLY | ❌ | ✅ |
| Flows LIST | ✅ | ✅ | ❌ | ✅ |
| Events/Triggers | ✅ | ✅ | ✅ Webhooks | ✅ |
| Products CRUD | ✅ | ✅ | ❌ | ❌ |
| Segments CREATE | ✅ | ❌ | ❌ | ✅ |
| SDK Node.js | ✅ Official | ❌ REST only | ✅ Official | ✅ Official |

### 1.2 DÉCOUVERTE CRITIQUE: Omnisend API Limitation

```
⚠️ FAIT VÉRIFIÉ (api-docs.omnisend.com):

GET /automations → Liste seulement (READ-ONLY)
POST /automations → N'EXISTE PAS
PUT /automations → N'EXISTE PAS

CONCLUSION: Impossible de créer/modifier des automations via API Omnisend.
Les flows doivent être créés MANUELLEMENT dans l'interface Omnisend UI.
```

**Impact sur notre stratégie:**
- ❌ NE PAS "dupliquer" les workflows Klaviyo pour Omnisend
- ✅ Utiliser les pré-built flows d'Omnisend (déjà inclus)
- ✅ Créer scripts pour: contacts, events, products (ce que l'API permet)

---

## 2. Décision: Dupliquer ou Consolider?

### 2.1 Verdict Final

| Option | Verdict | Justification |
|--------|---------|---------------|
| **Dupliquer workflows Klaviyo → Omnisend** | ❌ IMPOSSIBLE | API Omnisend = READ-ONLY pour automations |
| **Consolider (scripts utilitaires)** | ✅ RETENU | Créer scripts contacts/events + utiliser pré-built flows |

### 2.2 Stratégie Adoptée

```
KLAVIYO (maintenir pour clients existants)
├── 9 email workflows (flows API ✅)
├── 4 lead-gen pipelines (segments API ✅)
└── Scripts existants: audit-klaviyo-flows.cjs, geo-segment-profiles.cjs

OMNISEND (nouveaux clients e-commerce budget)
├── Pré-built flows (configurés via UI):
│   ├── Welcome Series ✅
│   ├── Abandoned Cart ✅
│   ├── Browse Abandonment ✅
│   ├── Post-Purchase ✅
│   └── Win-Back ✅
├── Scripts créés (API permet):
│   ├── omnisend-b2c-ecommerce.cjs ✅ NEW
│   │   ├── Contacts CRUD
│   │   ├── Events (trigger automations)
│   │   ├── Products sync
│   │   └── Audit automations
│   └── (pas de création flows via API)
└── Pricing: $16/mo vs Klaviyo $45+/mo

HUBSPOT (B2B PME)
├── FREE CRM:
│   ├── Contacts CRUD ✅
│   ├── Companies CRUD ✅
│   ├── Deals CRUD ✅
│   ├── Associations ✅
│   └── Lead scoring (manuel via properties)
├── Script créé:
│   └── hubspot-b2b-crm.cjs ✅ NEW
└── Note: Workflows = Pro tier ($890/mo) - NON INCLUS
```

---

## 3. Scripts Créés et Testés

### 3.1 HubSpot B2B CRM (`hubspot-b2b-crm.cjs`)

| Fonctionnalité | API | Status |
|---------------|-----|--------|
| upsertContact() | FREE | ✅ Testé |
| getAllContacts() | FREE | ✅ Testé |
| searchContacts() | FREE | ✅ Testé |
| upsertCompany() | FREE | ✅ Testé |
| getAllCompanies() | FREE | ✅ Testé |
| createDeal() | FREE | ✅ Testé |
| updateDealStage() | FREE | ✅ Testé |
| associateContactToCompany() | FREE | ✅ Testé |
| associateDealToContact() | FREE | ✅ Testé |
| updateLeadScore() | FREE | ✅ Testé |
| healthCheck() | FREE | ✅ Testé |

**Commandes CLI:**
```bash
node hubspot-b2b-crm.cjs --health
node hubspot-b2b-crm.cjs --test-contact
node hubspot-b2b-crm.cjs --test-company
node hubspot-b2b-crm.cjs --test-deal
node hubspot-b2b-crm.cjs --list-contacts
```

### 3.2 Omnisend B2C E-commerce (`omnisend-b2c-ecommerce.cjs`)

| Fonctionnalité | API | Status |
|---------------|-----|--------|
| upsertContact() | v5 | ✅ Testé |
| listContacts() | v5 | ✅ Testé |
| sendEvent() | v5 | ✅ Testé |
| sendAddedToCartEvent() | v5 | ✅ Testé |
| sendStartedCheckoutEvent() | v5 | ✅ Testé |
| sendPlacedOrderEvent() | v5 | ✅ Testé |
| upsertProduct() | v5 | ✅ Testé |
| listProducts() | v5 | ✅ Testé |
| listAutomations() | v5 READ-ONLY | ✅ Testé |
| listCampaigns() | v5 READ-ONLY | ✅ Testé |
| auditAutomations() | v5 | ✅ Testé |
| healthCheck() | v5 | ✅ Testé |

**Commandes CLI:**
```bash
node omnisend-b2c-ecommerce.cjs --health
node omnisend-b2c-ecommerce.cjs --audit
node omnisend-b2c-ecommerce.cjs --test-contact
node omnisend-b2c-ecommerce.cjs --test-event
node omnisend-b2c-ecommerce.cjs --list-automations
```

---

## 4. Comparaison Pricing Factuelle

### 4.1 B2C E-commerce (1,000 contacts)

| CRM | Plan | Prix/mois | Emails/mois | SMS | Flows via API |
|-----|------|-----------|-------------|-----|---------------|
| **Omnisend** | Standard | **$16** | 12,000 | 60 one-time | ❌ |
| **Klaviyo** | Email | **$45** | 15,000 | Extra | ✅ |
| **Omnisend** | Pro | **$59** | Illimité | Inclus | ❌ |
| **Klaviyo** | Email+SMS | **$60** | 15,000 | 1,250 | ✅ |

**Verdict B2C:** Omnisend **~64% moins cher** pour PME e-commerce basiques.

### 4.2 B2B PME

| CRM | Plan | Prix/mois | Contacts | Workflows via API |
|-----|------|-----------|----------|-------------------|
| **HubSpot** | Free CRM | **$0** | 1,000,000 | ❌ |
| **HubSpot** | Starter | **$20** | 1,000 | ❌ |
| **HubSpot** | Pro | **$890** | 2,000 | ✅ |
| **Salesforce MC** | Growth | **$1,250** | 10,000 | ✅ |

**Verdict B2B:** HubSpot FREE pour CRM, pas de workflows automatisés (trop cher).

---

## 5. Migration Klaviyo → Omnisend

### 5.1 Workflows Klaviyo Existants (9)

| ID | Workflow | Migrable Omnisend? | Méthode |
|----|----------|---------------------|---------|
| welcome-series | Welcome 5 emails | ✅ | Pré-built UI |
| abandoned-cart | Abandoned Cart 3 emails | ✅ | Pré-built UI |
| browse-abandonment | Browse Abandonment 2 emails | ✅ | Pré-built UI |
| post-purchase | Post-Purchase 5 emails | ✅ | Pré-built UI |
| win-back | Win-Back 3 emails | ✅ | Pré-built UI |
| vip-tiers | VIP 4 segments | ✅ | Manual segments |
| flows-audit | Audit flows | ✅ | Script créé |
| ab-sender-rotation | A/B Rotation | ⚠️ Limité | Omnisend A/B basique |
| audit-klaviyo-flows-v2 | Audit v2 | ✅ | Script créé |

### 5.2 Scripts Klaviyo → Équivalent Omnisend

| Script Klaviyo | Script Omnisend | Status |
|---------------|-----------------|--------|
| audit-klaviyo-flows.cjs | omnisend-b2c-ecommerce.cjs --audit | ✅ Créé |
| geo-segment-profiles.cjs | (contacts API + manual segments) | ⚠️ Partiel |
| linkedin-to-klaviyo-pipeline.cjs | (contacts API) | ✅ Possible |
| google-maps-to-klaviyo-pipeline.cjs | (contacts API) | ✅ Possible |

---

## 6. Recommandations Finales

### 6.1 Pour Nouveaux Clients

| Segment Client | CRM Recommandé | Pricing | Action |
|---------------|----------------|---------|--------|
| E-commerce <€50k/an | **Omnisend Standard** | $16/mo | Pré-built flows + script audit |
| E-commerce €50k-200k/an | **Klaviyo** | $45-100/mo | Full API + custom flows |
| E-commerce >€200k/an | **Klaviyo Pro** | $150+/mo | API complète + segments |
| B2B PME <20 employés | **HubSpot FREE** | $0/mo | CRM + script sync |
| B2B PME 20-100 employés | **HubSpot Starter** | $20/mo | CRM + sequences manuelles |
| B2B >100 employés | **HubSpot Pro** | $890/mo | Workflows automatisés |

### 6.2 Configuration Requise (.env)

```bash
# HubSpot (B2B)
HUBSPOT_API_KEY=           # Private App Access Token
HUBSPOT_ACCESS_TOKEN=      # Alternative

# Omnisend (B2C)
OMNISEND_API_KEY=          # API Key v5

# Klaviyo (existant)
KLAVIYO_API_KEY=pk_xxx     # Déjà configuré
```

### 6.3 Registry Updates

Ajouter dans `automations-registry.json`:

```json
{
  "id": "hubspot-b2b-crm",
  "name_fr": "HubSpot B2B CRM Integration",
  "name_en": "HubSpot B2B CRM Integration",
  "category": "lead-gen",
  "type": "script",
  "script": "agency/core/hubspot-b2b-crm.cjs",
  "status": "tested-ok"
},
{
  "id": "omnisend-b2c-ecommerce",
  "name_fr": "Omnisend B2C E-commerce Integration",
  "name_en": "Omnisend B2C E-commerce Integration",
  "category": "email",
  "type": "script",
  "script": "agency/core/omnisend-b2c-ecommerce.cjs",
  "status": "tested-ok"
}
```

---

## 7. Effort Estimé

| Tâche | Effort | Status |
|-------|--------|--------|
| Recherche API Omnisend | 2h | ✅ Fait |
| Recherche API HubSpot | 1h | ✅ Fait |
| Script hubspot-b2b-crm.cjs | 3h | ✅ Fait |
| Script omnisend-b2c-ecommerce.cjs | 3h | ✅ Fait |
| Tests empiriques | 1h | ✅ Fait |
| Rapport final | 1h | ✅ Fait |
| **TOTAL** | **11h** | **Complet** |

---

## 8. Conclusion

### Ce que nous POUVONS faire:

1. **HubSpot B2B:** CRM complet gratuit (contacts, companies, deals, associations, lead scoring manuel)
2. **Omnisend B2C:** Contacts, events, products + utiliser pré-built flows UI
3. **Klaviyo:** Maintenir pour clients existants (API flows complète)

### Ce que nous NE POUVONS PAS faire:

1. **Créer automations Omnisend via API** (limitation plateforme)
2. **Utiliser HubSpot Workflows sans Pro tier** ($890/mo)
3. **Répliquer 1:1 les scripts Klaviyo pour Omnisend** (API différente)

### Verdict Global:

```
✅ MEILLEURE OPTION pour PME:
   - B2B: HubSpot FREE (CRM gratuit, pas de workflows auto)
   - B2C Budget: Omnisend Standard ($16/mo, pré-built flows)
   - B2C Premium: Klaviyo (maintenir existant)

❌ ÉVITER:
   - Salesforce MC (overkill, min $1,250/mo)
   - HubSpot Pro pour PME (trop cher pour workflows)
   - Tenter de "dupliquer" workflows via API Omnisend (impossible)
```

---

**Sources:**
- [Omnisend API v5 Documentation](https://api-docs.omnisend.com/reference/overview)
- [HubSpot APIs by Tier](https://developers.hubspot.com/apisbytier)
- [Klaviyo Flows API](https://developers.klaviyo.com/en/reference/flows_api_overview)
- [HubSpot Node.js SDK](https://github.com/HubSpot/hubspot-api-nodejs)
- [Omnisend Pricing 2025](https://www.omnisend.com/pricing/)
- [HubSpot Pricing 2025](https://www.hubspot.com/pricing)
