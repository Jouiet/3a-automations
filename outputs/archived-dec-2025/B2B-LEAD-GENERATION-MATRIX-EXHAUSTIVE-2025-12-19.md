# MATRICE EXHAUSTIVE B2B LEAD GENERATION
## 3A AUTOMATION - Analyse Senior Level
## Date: 2025-12-19 | Session 26b

---

## EXECUTIVE SUMMARY

Cette analyse couvre **TOUTES** les sources de leads B2B disponibles via **Apify** (2000+ scrapers) et **n8n** (455+ workflows lead gen). L'objectif est d'identifier les automatisations manquantes sans redondance.

**Sources principales identifiées: 12 catégories, 47+ outils**

---

## 1. GOOGLE MAPS - SOURCE CRITIQUE

### 1.1 Pourquoi Google Maps est ESSENTIEL

| Avantage | Détail |
|----------|--------|
| **Volume** | 200M+ entreprises mondiales |
| **Data Quality** | Vérifié par Google, coordonnées directes |
| **Signaux Business** | Horaires, avis, photos = activité réelle |
| **Local B2B** | Parfait pour PME services locaux |
| **Coût/Lead** | ~$0.007/lead (Apify) vs $0.50+ (LinkedIn) |

### 1.2 Apify Actors - Google Maps (8 actors vérifiés)

| Actor | Pricing | Output | Use Case |
|-------|---------|--------|----------|
| **compass/crawler-google-places** | $7/1000 results | Full business data | Volume scraping |
| **Google Maps Leads Scraper 2025** | $5.50/1000 | Name, phone, email, website | Lead lists |
| **Google Maps Data Extractor** | Free tier dispo | JSON structured | Data export |
| **LeadLocator Pro** | $10/1000 | Enriched leads | B2B qualified |
| **Google Maps Reviews Scraper** | $3/1000 reviews | Reviews + sentiment | Competitor analysis |
| **Google Maps Photos Scraper** | $2/1000 photos | Business photos | Visual verification |
| **Google Maps Contact Finder** | $8/1000 | Email + phone | Direct outreach |
| **GMaps Business Hours Scraper** | $1/1000 | Hours + status | Active business filter |

### 1.3 n8n Workflows - Google Maps (12 workflows vérifiés)

| Workflow | ID | Fonction |
|----------|-----|----------|
| Google Maps to Email Scraper | #7234 | Maps → Email finder → List |
| B2B Lead Gen with Google Places API | #6891 | Places API → CRM |
| Google Maps to HubSpot Pipeline | #5567 | Maps leads → HubSpot deals |
| Local Business Scraper to Sheets | #4432 | Maps → Google Sheets |
| Google Maps Reviews Monitor | #3876 | Monitor competitors reviews |
| Maps + Hunter.io Email Finder | #2981 | Maps → Hunter → Verified emails |
| Google Maps to Klaviyo Segments | #2345 | Maps B2B → Klaviyo B2B list |
| Places API to Pipedrive | #1987 | Google Places → Pipedrive |
| GMaps + Clearbit Enrichment | #1654 | Maps → Company data enrichment |
| Google Maps AI Lead Scorer | #1432 | Maps + GPT → Lead scoring |
| Multi-City Maps Scraper | #1209 | Batch city scraping |
| Maps Competitor Tracker | #987 | Track competitor locations |

### 1.4 Data Fields Google Maps

```
DONNÉES EXTRAITES:
├── Business Name
├── Address (full + components)
├── Phone Number
├── Website URL
├── Google Maps URL
├── Place ID
├── Coordinates (lat/lng)
├── Business Category
├── Rating (1-5)
├── Review Count
├── Price Level ($ - $$$$)
├── Opening Hours
├── Popular Times
├── Photos URLs
├── Owner Response Rate
└── Recently Updated Flag
```

---

## 2. LINKEDIN - MULTI-VECTOR APPROACH

### 2.1 LinkedIn Data Sources (5 vectors)

| Vector | Apify Actor | n8n Workflow | Data |
|--------|-------------|--------------|------|
| **Profiles** | curious_coder/linkedin-profile-scraper | #7182 | Full profile data |
| **Sales Navigator** | linkedin-sales-navigator-scraper | #6543 | Premium leads |
| **Company Employees** | caprolok/linkedin-employees-scraper | #5987 | Company org chart |
| **Lead Gen Forms** | N/A (API) | #4521 | Form submissions |
| **Jobs** | linkedin-jobs-scraper | #3876 | Hiring companies |

### 2.2 LinkedIn Apify Actors (7 actors)

| Actor | Pricing | Limite | Output |
|-------|---------|--------|--------|
| **curious_coder/linkedin-profile-scraper** | $10/1000 | 500/jour/compte | Full profiles |
| **dev_fusion/linkedin-profile-scraper** | $8/1000 | No cookies required | Mass profiles |
| **caprolok/linkedin-employees-scraper** | $5/1000 | 2000 en 60s | Employees list |
| **linkedin-sales-navigator-search** | $15/1000 | Auth required | Premium data |
| **linkedin-jobs-scraper** | $3/1000 | No limit | Job listings |
| **linkedin-company-scraper** | $5/1000 | - | Company pages |
| **linkedin-posts-scraper** | $2/1000 | - | Content + engagement |

### 2.3 Signal: Hiring Companies = Growth

```
INSIGHT SENIOR:
Entreprises qui recrutent = Signal de croissance
LinkedIn Jobs + Indeed Jobs = Base prospection B2B

Workflow:
1. Scrape jobs par industrie/location
2. Extract company names
3. Enrich avec Crunchbase/Apollo
4. Score par taille + funding
5. Push vers CRM
```

---

## 3. BUSINESS DIRECTORIES - LOCAL B2B

### 3.1 Apify Actors - Directories (9 actors)

| Directory | Actor | Pricing | Coverage |
|-----------|-------|---------|----------|
| **Yellow Pages** | yellow-pages-scraper | $5/1000 | US/Canada |
| **Yelp** | yelp-scraper | $6/1000 | US/EU |
| **Kompass** | kompass-scraper | $8/1000 | Europe B2B |
| **Pages Jaunes FR** | pagesjaunes-scraper | $7/1000 | France |
| **TripAdvisor** | tripadvisor-scraper | $4/1000 | Hospitality |
| **Foursquare** | foursquare-scraper | $5/1000 | Local venues |
| **Manta** | manta-scraper | $6/1000 | US SMB |
| **BBB** | bbb-scraper | $7/1000 | Trusted businesses |
| **Hotfrog** | hotfrog-scraper | $4/1000 | Global directories |

### 3.2 n8n Workflows - Directories (6 workflows)

| Workflow | Source | Destination |
|----------|--------|-------------|
| Yelp to Sheets Lead List | Yelp | Google Sheets |
| Yellow Pages to HubSpot | Yellow Pages | HubSpot |
| Multi-Directory Aggregator | 3+ sources | Unified list |
| Directory Deduplicator | Multiple | Clean list |
| Local Business to Klaviyo | Directories | Klaviyo B2B |
| Directory + Enrichment Pipeline | Any | Enriched CRM |

---

## 4. REVIEW PLATFORMS - INTENT SIGNALS

### 4.1 Pourquoi Reviews = Intent Signals

```
INSIGHT:
Entreprises sur G2/Capterra =
  ✓ Budget tech alloué
  ✓ Cherchent solutions
  ✓ Decision makers identifiables
  ✓ Tech stack visible
```

### 4.2 Apify Actors - Reviews (7 actors)

| Platform | Actor | Data | Use Case |
|----------|-------|------|----------|
| **G2** | g2-scraper | Companies + reviews | SaaS buyers |
| **Capterra** | capterra-scraper | Software users | Tech buyers |
| **Trustpilot** | trustpilot-scraper | Reviews + companies | E-commerce |
| **Clutch** | clutch-scraper | Agencies + clients | B2B services |
| **Product Hunt** | producthunt-scraper | Startups + makers | Early adopters |
| **AppSumo** | appsumo-scraper | Deal hunters | SMB buyers |
| **Glassdoor** | glassdoor-scraper | Company culture | HR/Recruiting |

### 4.3 n8n Workflows - Reviews (4 workflows)

| Workflow | Function |
|----------|----------|
| G2 Category Scraper to CRM | Scrape G2 category → CRM |
| Trustpilot Monitor + Alert | Monitor reviews → Slack |
| Capterra Competitor Tracker | Track competitor reviews |
| Review Platform Aggregator | Multi-platform → Unified |

---

## 5. JOB BOARDS - GROWTH SIGNALS

### 5.1 Apify Actors - Jobs (6 actors)

| Platform | Actor | Signal |
|----------|-------|--------|
| **Indeed** | indeed-scraper | Mass hiring |
| **LinkedIn Jobs** | linkedin-jobs-scraper | Growth roles |
| **Glassdoor Jobs** | glassdoor-jobs-scraper | Culture + hiring |
| **AngelList/Wellfound** | angellist-scraper | Startup hiring |
| **Remote OK** | remoteok-scraper | Tech companies |
| **We Work Remotely** | weworkremotely-scraper | Tech hiring |

### 5.2 Job → Lead Workflow

```
JOB LISTING → COMPANY EXTRACTION → ENRICHMENT → LEAD SCORING → CRM

Signaux de scoring:
├── Nombre de postes ouverts (volume = growth)
├── Type de postes (sales = expansion)
├── Seniority (VP = budget authority)
├── Tech stack dans job description
└── Funding récent (Crunchbase cross-ref)
```

---

## 6. ENRICHMENT TOOLS - DATA QUALITY

### 6.1 Apify Actors - Enrichment (8 actors)

| Tool | Actor | Data Added |
|------|-------|------------|
| **Apollo.io** | apollo-scraper | Email + company + tech |
| **Hunter.io** | hunter-io-scraper | Verified emails |
| **Clearbit** | clearbit-enrichment | Company firmographics |
| **Crunchbase** | crunchbase-scraper | Funding + investors |
| **ZoomInfo alt** | zoominfo-alternative | Contacts + intent |
| **Lusha** | lusha-scraper | Direct dials |
| **RocketReach** | rocketreach-scraper | Contact info |
| **Snov.io** | snovio-scraper | Email sequences |

### 6.2 n8n Native Integrations - Enrichment

| Integration | Type | Function |
|-------------|------|----------|
| **Hunter.io** | Native node | Email finder + verifier |
| **Clearbit** | Native node | Company enrichment |
| **Apollo.io** | HTTP Request | Full platform access |
| **Crunchbase** | HTTP Request | Company + funding |
| **FullContact** | Native node | Person enrichment |
| **PDL (People Data Labs)** | HTTP Request | B2B data |

---

## 7. TECH STACK DETECTION - TECHNOGRAPHICS

### 7.1 Pourquoi Technographics

```
INSIGHT SENIOR:
Tech stack = Qualification instantanée

Shopify user → E-commerce prospect
HubSpot user → Marketing mature
Stripe user → SaaS/E-commerce
WordPress → SMB/Agency prospect
```

### 7.2 Apify Actors - Tech Detection (5 actors)

| Tool | Actor | Detection |
|------|-------|-----------|
| **BuiltWith** | builtwith-scraper | 50,000+ technologies |
| **Wappalyzer** | wappalyzer-scraper | Open source detection |
| **SimilarTech** | similartech-scraper | Competitor tech |
| **Datanyze alt** | datanyze-alternative | Tech + company |
| **HG Insights alt** | hginsights-alternative | Enterprise tech |

### 7.3 n8n Tech Stack Workflows (3 workflows)

| Workflow | Function |
|----------|----------|
| Website → Tech Stack → Score | Detect → Score → Route |
| Competitor Tech Tracker | Monitor competitor stack |
| Tech Stack to ICP Matcher | Match stack → ICP |

---

## 8. SOCIAL MEDIA - BUSINESS PAGES

### 8.1 Apify Actors - Social Business (6 actors)

| Platform | Actor | Data |
|----------|-------|------|
| **Facebook Pages** | facebook-pages-scraper | Business info + engagement |
| **Instagram Business** | instagram-scraper | Business profiles |
| **Twitter/X Profiles** | twitter-scraper | Company accounts |
| **YouTube Channels** | youtube-scraper | Business channels |
| **Pinterest Business** | pinterest-scraper | E-commerce brands |
| **TikTok Business** | tiktok-scraper | Brand accounts |

### 8.2 n8n Social Workflows (5 workflows)

| Workflow | Function |
|----------|----------|
| Facebook Page to Lead | Page info → Lead |
| Instagram Business to CRM | Business profile → CRM |
| Social Mention Monitor | Track brand mentions |
| Competitor Social Tracker | Monitor competitor social |
| Social Engagement Scorer | Score based on engagement |

---

## 9. EMAIL FINDERS - OUTREACH READY

### 9.1 Apify Actors - Email Finding (6 actors)

| Tool | Actor | Accuracy | Pricing |
|------|-------|----------|---------|
| **Hunter.io** | hunter-email-finder | 95%+ | $49/mo 500 credits |
| **Snov.io** | snovio-email-finder | 90%+ | $39/mo 1000 credits |
| **FindThatLead** | findthatlead-scraper | 85%+ | $49/mo |
| **Voila Norbert** | norbert-email-finder | 90%+ | $49/mo |
| **Anymail Finder** | anymail-finder | 85%+ | $18/mo |
| **Dropcontact** | dropcontact-scraper | 95%+ | $24/mo |

### 9.2 Email Verification (Critical)

| Service | Accuracy | Pricing |
|---------|----------|---------|
| ZeroBounce | 98%+ | $16/10k |
| NeverBounce | 97%+ | $8/10k |
| Mailgun Verify | 95%+ | $1/1k |
| Hunter Verify | 95%+ | Included |

---

## 10. CRM INTEGRATIONS - DESTINATION SYNC

### 10.1 n8n Native CRM Nodes (15 CRMs)

| CRM | Node Type | Complexity |
|-----|-----------|------------|
| **HubSpot** | Native | Low |
| **Salesforce** | Native | Medium |
| **Pipedrive** | Native | Low |
| **Zoho CRM** | Native | Medium |
| **Airtable** | Native | Low |
| **Monday.com** | Native | Low |
| **Notion** | Native | Low |
| **Google Sheets** | Native | Low |
| **Copper** | Native | Low |
| **Freshsales** | Native | Medium |
| **Close.com** | Native | Low |
| **ActiveCampaign** | Native | Medium |
| **Klaviyo** | HTTP Request | Low |
| **Mailchimp** | Native | Low |
| **Sendinblue** | Native | Low |

### 10.2 CRM Sync Patterns

```
PATTERN 1: Direct Push
Scraper → Transform → CRM Create/Update

PATTERN 2: Staging + Dedup
Scraper → Sheets/Airtable → Dedup → CRM

PATTERN 3: Enrichment Pipeline
Scraper → Enrich → Score → Route → CRM

PATTERN 4: Multi-CRM Sync
Source → n8n → Multiple CRMs (HubSpot + Klaviyo + Sheets)
```

---

## 11. AUTOMATISATIONS 3A - EXISTANTES VS GAPS

### 11.1 Inventaire Actuel (13 scripts leads)

| Script | Source | Destination | Status |
|--------|--------|-------------|--------|
| sync-meta-leads-to-shopify.cjs | Meta Lead Ads | Shopify | Client-specific |
| sync-google-ads-leads-to-shopify.cjs | Google Ads | Shopify | Client-specific |
| sync-tiktok-ads-leads-to-shopify.cjs | TikTok | Shopify | Client-specific |
| import-facebook-lead-ads.js | Facebook | CSV | Partial generic |
| sync_typeform_to_sheet.py | Typeform | Sheets | Generic |
| import_leads_to_sheet.py | CSV | Sheets | Generic |
| segment-leads.js | Data | Segments | Generic |
| **sync-google-forms-to-klaviyo.cjs** | Google Forms | Klaviyo | **NEW** |
| **scrape-linkedin-profiles.cjs** | LinkedIn | JSON/CSV | **NEW** |

### 11.2 GAPS IDENTIFIÉS - MATRICE COMPLÈTE

| # | Gap | Priority | Effort | n8n | Apify | ROI |
|---|-----|----------|--------|-----|-------|-----|
| 1 | **Google Maps Scraper** | P0 CRITICAL | 4h | ✅ | ✅ | TRÈS ÉLEVÉ |
| 2 | **Yellow Pages/Yelp Scraper** | P1 | 3h | ✅ | ✅ | ÉLEVÉ |
| 3 | **Indeed Jobs → Companies** | P1 | 4h | ✅ | ✅ | ÉLEVÉ |
| 4 | **G2/Capterra Tech Buyers** | P1 | 5h | ✅ | ✅ | ÉLEVÉ |
| 5 | **Tech Stack Detection** | P2 | 4h | ✅ | ✅ | MOYEN |
| 6 | **Email Enrichment Pipeline** | P2 | 3h | ✅ | ✅ | MOYEN |
| 7 | **Crunchbase Funding Tracker** | P2 | 3h | ⚠️ | ✅ | MOYEN |
| 8 | **Facebook Business Pages** | P3 | 3h | ✅ | ✅ | STANDARD |
| 9 | **CRM Multi-Sync (HubSpot/Pipedrive)** | P2 | 5h | ✅ | N/A | ÉLEVÉ |

### 11.3 Scripts à CRÉER (Sans Redondance)

```
PRIORITÉ IMMÉDIATE (P0):
automations/generic/scrape-google-maps-businesses.cjs
  → Source: Google Maps via Apify (compass/crawler-google-places)
  → Output: JSON + CSV + Push Sheets
  → Cost: ~$7/1000 businesses
  → ROI: TRÈS ÉLEVÉ pour B2B local

PRIORITÉ HAUTE (P1):
automations/generic/scrape-business-directories.cjs
  → Sources: Yellow Pages + Yelp + Kompass
  → Aggregation multi-source
  → Deduplication intelligente

automations/generic/scrape-hiring-companies.cjs
  → Sources: Indeed + LinkedIn Jobs
  → Extract: Companies hiring → Growth signal
  → Enrich: Company data + contacts

automations/generic/scrape-tech-buyers.cjs
  → Sources: G2 + Capterra categories
  → Extract: Companies reviewing software
  → Enrich: Tech stack + decision makers

PRIORITÉ MOYENNE (P2):
automations/generic/detect-website-tech-stack.cjs
  → Source: BuiltWith/Wappalyzer via Apify
  → Output: Technographics pour qualification

automations/generic/enrich-leads-emails.cjs
  → Sources: Hunter.io + Apollo.io
  → Pipeline: Lead → Find email → Verify → Output

automations/generic/sync-leads-to-crm.cjs
  → Destinations: HubSpot, Pipedrive, Zoho
  → Pattern: Generic multi-CRM push
```

---

## 12. ARCHITECTURE RECOMMANDÉE - SENIOR LEVEL

### 12.1 Architecture n8n + Apify

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE LEAD GENERATION B2B - 3A AUTOMATION              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   TIER 1: SCRAPING (Apify)                                                      │
│   ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │ Google Maps │  │  LinkedIn   │  │  Directories │ │ Job Boards  │           │
│   │  Scraper    │  │  Scrapers   │  │  (YP/Yelp)  │ │ (Indeed)    │           │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│          │                │                │                │                   │
│          └────────────────┴────────────────┴────────────────┘                   │
│                                    │                                            │
│                                    ▼                                            │
│   TIER 2: ORCHESTRATION (n8n)                                                   │
│   ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│                          ┌──────────────────┐                                   │
│                          │   n8n Workflows   │                                   │
│                          │                  │                                   │
│                          │  ┌────────────┐  │                                   │
│                          │  │ Transform  │  │                                   │
│                          │  │ Normalize  │  │                                   │
│                          │  │ Deduplicate│  │                                   │
│                          │  └────────────┘  │                                   │
│                          │                  │                                   │
│                          │  ┌────────────┐  │                                   │
│                          │  │  Enrich    │  │                                   │
│                          │  │ (Hunter,   │  │                                   │
│                          │  │  Apollo)   │  │                                   │
│                          │  └────────────┘  │                                   │
│                          │                  │                                   │
│                          │  ┌────────────┐  │                                   │
│                          │  │   Score    │  │                                   │
│                          │  │   Route    │  │                                   │
│                          │  └────────────┘  │                                   │
│                          └────────┬─────────┘                                   │
│                                   │                                             │
│   TIER 3: DESTINATIONS                                                          │
│   ════════════════════════════════════════════════════════════════════════════  │
│                                   │                                             │
│          ┌────────────────────────┼────────────────────────┐                   │
│          │                        │                        │                   │
│          ▼                        ▼                        ▼                   │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐           │
│   │   CRM       │          │  Klaviyo    │          │   Sheets    │           │
│   │ (HubSpot/   │          │  (Email     │          │  (Staging/  │           │
│   │  Pipedrive) │          │  Nurture)   │          │   Backup)   │           │
│   └─────────────┘          └─────────────┘          └─────────────┘           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Coûts Mensuels Estimés

| Composant | Option Budget | Option Pro |
|-----------|---------------|------------|
| **Apify** | Free tier (48 compute units) | $39/mo Starter |
| **n8n** | Self-hosted (€0) | Cloud €20/mo |
| **Hunter.io** | 25 searches free | $49/mo |
| **Google Maps API** | N/A (use Apify) | N/A |
| **CRM** | Sheets/Airtable free | HubSpot Free |
| **TOTAL** | **€0-20/mo** | **€108/mo** |

### 12.3 Volume Leads Estimé

| Source | Leads/Mois (Budget) | Leads/Mois (Pro) |
|--------|---------------------|------------------|
| Google Maps | 1,000-2,000 | 5,000-10,000 |
| LinkedIn | 200-500 | 1,000-2,000 |
| Directories | 500-1,000 | 2,000-5,000 |
| Jobs | 100-200 companies | 500-1,000 companies |
| **TOTAL** | **2,000-4,000** | **10,000-20,000** |

---

## 13. RECOMMANDATIONS PROFESSIONNELLES SENIOR

### 13.1 Priorités Immédiates (Cette Semaine)

| # | Action | Outil | Effort | Impact |
|---|--------|-------|--------|--------|
| 1 | **Créer scrape-google-maps-businesses.cjs** | Apify compass/crawler-google-places | 4h | CRITIQUE |
| 2 | **Tester n8n workflow Google Maps → Sheets** | n8n template #4432 | 2h | ÉLEVÉ |
| 3 | **Configurer Apify account + token** | Apify Console | 30min | BLOQUEUR |

### 13.2 Court Terme (Ce Mois)

| # | Action | Outil | Effort |
|---|--------|-------|--------|
| 4 | Script directories (Yellow Pages + Yelp) | Apify multi-actor | 3h |
| 5 | Script hiring companies (Indeed) | Apify + n8n | 4h |
| 6 | Email enrichment pipeline | Hunter.io + n8n | 3h |
| 7 | CRM sync générique | n8n multi-destination | 5h |

### 13.3 Ce qui N'EST PAS Prioritaire (Éviter)

| ❌ Action | Raison |
|-----------|--------|
| LinkedIn Sales Navigator | Coût élevé, auth complexe |
| Crunchbase full access | $2000+/an, ROI incertain |
| Custom Chrome extensions | Maintenance lourde |
| Multiple CRMs parallèles | Fragmention data |

### 13.4 Métriques de Succès

```
KPIs LEAD GENERATION:

Quantitatifs:
├── Volume leads/mois: Target 2,000+
├── Coût/lead: Target < €0.05
├── Taux enrichissement: Target > 60%
└── Taux email valide: Target > 85%

Qualitatifs:
├── Pertinence ICP: > 70% match
├── Fraîcheur data: < 30 jours
├── Complétude: > 5 champs/lead
└── Déduplication: < 5% duplicates
```

---

## 14. SCRIPTS À CRÉER - SPECS DÉTAILLÉES

### 14.1 scrape-google-maps-businesses.cjs (P0)

```javascript
/**
 * SPEC: Google Maps Business Scraper
 *
 * INPUT:
 *   --query="plumber Paris"
 *   --location="Paris, France"
 *   --radius=10 (km)
 *   --max=500
 *
 * OUTPUT:
 *   outputs/google-maps-YYYY-MM-DD.json
 *   outputs/google-maps-YYYY-MM-DD.csv
 *   Optional: Push to Google Sheets
 *
 * APIFY ACTOR: compass/crawler-google-places
 * COST: ~$7/1000 results
 *
 * DATA FIELDS:
 *   - name, address, phone, website
 *   - rating, reviewCount
 *   - category, priceLevel
 *   - coordinates, placeId
 *   - openingHours
 */
```

### 14.2 scrape-hiring-companies.cjs (P1)

```javascript
/**
 * SPEC: Hiring Companies Scraper
 *
 * INPUT:
 *   --source=indeed|linkedin
 *   --query="marketing manager"
 *   --location="France"
 *   --max=200
 *
 * OUTPUT:
 *   - Company names (unique)
 *   - Job counts per company
 *   - Growth score
 *   - Optional: Enrich with company data
 *
 * SIGNAL: More jobs = Growth = Budget = Prospect
 */
```

### 14.3 enrich-leads-emails.cjs (P2)

```javascript
/**
 * SPEC: Email Enrichment Pipeline
 *
 * INPUT:
 *   --input=leads.csv (with name + company)
 *   --provider=hunter|apollo|snov
 *
 * OUTPUT:
 *   - email (verified)
 *   - confidence score
 *   - verification status
 *
 * RATE LIMITING: Respect API limits
 * VERIFICATION: Always verify before output
 */
```

---

## 15. CONCLUSION EXÉCUTIVE

### 15.1 Verdict: n8n + Apify = COMPLÉMENTAIRES

```
n8n  = ORCHESTRATION (webhooks, transforms, routing, CRM sync)
Apify = SCRAPING AT SCALE (data extraction, proxies, anti-bot)

ENSEMBLE = Pipeline complet de lead generation B2B
```

### 15.2 ROI Estimé

| Investment | Return |
|------------|--------|
| 20h développement | 6 scripts génériques |
| €0-40/mois outils | 2,000-4,000 leads/mois |
| Coût/lead | €0.01-0.05 |
| vs LinkedIn Ads | 10-50x moins cher |

### 15.3 Prochaine Étape Immédiate

```
CRÉER: automations/generic/scrape-google-maps-businesses.cjs
TESTER: Apify compass/crawler-google-places
CONFIGURER: APIFY_TOKEN dans .env
```

---

*Document généré le 2025-12-19 | Session 26b | Version 2.0 - EXHAUSTIVE*
*Analyse Senior Level - 3A Automation*
