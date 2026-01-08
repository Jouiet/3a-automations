# FLYWHEEL E-COMMERCE BLUEPRINT 2026

## AI Agency Automation (AAA) - Architecture de Niveau 4

### Mis à jour: Session 128 (08/01/2026) - MISSION COMPLETE

---

## MISSION COMPLETE (08/01/2026)

```
MIGRATION COMPLETE: n8n → Native Node.js Scripts
├── n8n workflows: 0 (all migrated to native scripts)
├── Native scripts: 8 résilients (automations/agency/core/)
├── Fallback chains: 3+ AI providers per script
└── See: .claude/rules/07-native-scripts.md

AUTOMATION RATE FACTUEL:
├── SYSTEM STATE: Level 4 Autonomous Agentic Engine (AEO Ready)
│   ├── Master-scheduler + scripts .cjs: 17 automations
│   └── Plateforme (Klaviyo/Shopify): 11 automations
├── TOTAL Tool Stack: 118 Verified Tools
│   └── On-demand, templates, external, one-time, conceptual
└── CONCLUSION: 100% de ce qui PEUT être automatisé EST automatisé
```

---

```
                    ╔═══════════════════════════════════════════════════════════════╗
                    ║          FLYWHEEL E-COMMERCE AUTOMATION SYSTEM                ║
                    ║     Acquisition → Conversion → Retention → Advocacy           ║
                    ╚═══════════════════════════════════════════════════════════════╝

                                        ┌─────────────┐
                                        │  ADVOCACY   │
                                        │   (UGC)     │
                                        └──────┬──────┘
                                               │
                              ┌────────────────┴────────────────┐
                              │                                 │
                              ▼                                 │
                    ┌─────────────────┐               ┌─────────┴───────┐
                    │   ACQUISITION   │◄──────────────│    RETENTION    │
                    │  (Paid + SEO)   │               │   (Email/SMS)   │
                    └────────┬────────┘               └─────────────────┘
                             │                                 ▲
                             │                                 │
                             ▼                                 │
                    ┌─────────────────┐                        │
                    │   CONVERSION    │────────────────────────┘
                    │   (Checkout)    │
                    └─────────────────┘
```

---

## TABLE DES MATIERES

1. [KPIs & Benchmarks 2025](#1-kpis--benchmarks-2025)
2. [Phase 1: ACQUISITION](#2-phase-1-acquisition)
3. [Phase 2: CONVERSION](#3-phase-2-conversion)
4. [Phase 3: RETENTION](#4-phase-3-retention)
5. [Phase 4: ADVOCACY](#5-phase-4-advocacy)
6. [Stack Technique Complet](#6-stack-technique-complet)
7. [Scripts d'Automatisation](#7-scripts-dautomatisation)
8. [GitHub Actions Workflows](#8-github-actions-workflows)
9. [ROI Projections](#9-roi-projections)
10. [Modele Agence AAA + Marketing](#10-modele-agence-aaa--marketing)

---

## 1. KPIs & BENCHMARKS 2026

### Benchmarks Industrie E-commerce

| Metric | Mauvais | Moyen | Bon | Excellent |
|--------|---------|-------|-----|-----------|
| **Conversion Rate** | <1.5% | 2-3% | 3-4% | >4% |
| **Cart Abandonment** | >80% | 70-80% | 60-70% | <60% |
| **Email Open Rate** | <15% | 15-25% | 25-35% | >35% |
| **Email Click Rate** | <1.5% | 1.5-3% | 3-5% | >5% |
| **LTV:CAC Ratio** | <2:1 | 2-3:1 | 3-4:1 | >4:1 |
| **Customer Retention** | <20% | 20-30% | 30-40% | >40% |
| **Repeat Purchase Rate** | <15% | 15-25% | 25-35% | >35% |

### ROAS Benchmarks par Plateforme 2025

| Plateforme | ROAS Moyen | ROAS Objectif | CPM Moyen |
|------------|------------|---------------|-----------|
| **Google Ads (PMax)** | 4.5x | >5x | $15-25 |
| **Meta Ads** | 2.2x | >3x | $8-15 |
| **TikTok Ads** | 1.4x | >2x | $7-10 |
| **Email (Klaviyo)** | 38-42x | >40x | N/A |

### Revenue Attribution Target

```
┌─────────────────────────────────────────────────────────────┐
│                    REVENUE MIX OPTIMAL                       │
├─────────────────────────────────────────────────────────────┤
│  Email/SMS Marketing    ████████████████████████░░  30%     │
│  Organic Search (SEO)   ██████████████████░░░░░░░░  22%     │
│  Paid Ads (Meta/Google) █████████████████░░░░░░░░░  20%     │
│  Direct Traffic         ██████████████░░░░░░░░░░░░  15%     │
│  Referral/Affiliates    ████████░░░░░░░░░░░░░░░░░░  8%      │
│  Social Organic         █████░░░░░░░░░░░░░░░░░░░░░  5%      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. PHASE 1: ACQUISITION

### 2.1 Architecture Paid Ads Multi-Canal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACQUISITION FUNNEL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │  META ADS    │    │ GOOGLE ADS   │    │ TIKTOK ADS   │                  │
│   │  CAPI + Pixel│    │   PMax       │    │   Smart+     │                  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              ▼                                               │
│                    ┌─────────────────┐                                       │
│                    │  GTM + GA4      │                                       │
│                    │ Server-Side     │                                       │
│                    └────────┬────────┘                                       │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │ SHOPIFY STORE   │                                       │
│                    │ + Flow Tagging  │                                       │
│                    └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Meta Ads Configuration (CAPI + Advantage+)

**Setup Obligatoire:**

```javascript
// Events CAPI prioritaires (server-side)
const CAPI_EVENTS = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase'       // EMQ > 8.0 requis
];

// Customer Parameters pour EMQ optimal
const CUSTOMER_PARAMS = {
  em: 'hashed_email',      // SHA256
  ph: 'hashed_phone',      // SHA256
  fn: 'hashed_firstname',
  ln: 'hashed_lastname',
  ct: 'city',
  st: 'state',
  zp: 'zip',
  country: 'country_code',
  external_id: 'customer_id',
  fbp: 'fb_pixel_cookie',
  fbc: 'fb_click_cookie'
};
```

**Advantage+ Campaign Structure:**

```
ADVANTAGE+ SHOPPING
├── Budget: $200-500/day minimum
├── Optimization: Purchase (Value)
├── Audience: Broad (AI-optimized)
├── Creative: 5-10 assets minimum
│   ├── 3-5 UGC videos (15-30s)
│   ├── 3-5 Static images
│   └── Dynamic Product Ads (DPA)
└── Existing Customer Budget: 0-20%
```

### 2.3 Google Ads PMax Structure

```
PERFORMANCE MAX CAMPAIGN
├── Asset Groups (par catégorie produit)
│   ├── Headlines: 15 (min 5)
│   ├── Long Headlines: 5
│   ├── Descriptions: 5
│   ├── Images: 20 (min 3)
│   ├── Logos: 5
│   ├── Videos: 5 (YouTube)
│   └── Call to Actions: Purchase
├── Audience Signals
│   ├── Customer Match (past purchasers)
│   ├── Website Visitors (180 days)
│   ├── In-Market Audiences
│   └── Custom Segments
├── Product Feed (Merchant Center)
│   ├── Custom Labels (margin, bestseller)
│   ├── Sale Price
│   └── Product Ratings
└── Bidding: Target ROAS (start 300%)
```

### 2.4 TikTok Smart+ Configuration

```
TIKTOK SMART+ CATALOG
├── Optimization: Value (not Volume)
├── Creative Format: Spark Ads + UGC
├── Targeting: Broad (algorithm)
├── Budget: $100-300/day start
├── Events Priority:
│   1. CompletePayment
│   2. PlaceAnOrder
│   3. AddToCart
└── Creative Rotation: Weekly
```

### 2.5 SEO/AEO Automation

**Schema.org Implementation:**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": ["url1", "url2", "url3"],
  "description": "...",
  "sku": "SKU123",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "seller": {...}
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**AEO Checklist (Verified 08/01/2026):**

- [x] FAQ Schema sur pages services (pricing, ecommerce, voice-ai, smb/pme, flywheel-360, audit)
- [ ] HowTo Schema pour guides (N/A - no tutorial content currently)
- [x] Article Schema pour blog (4 articles FR+EN avec Article schema)
- [x] Organization Schema (34 pages - all pages)
- [x] BreadcrumbList Schema (14 conversion pages - Session 102)
- [x] llms.txt file (v4.0 + llms-full.txt - AI crawlers allowed)
- [x] Sitemap XML optimisé (36 URLs + hreflang alternates)

### 2.6 Apify Competitor Monitoring

```javascript
// Actors Apify pour monitoring
const APIFY_ACTORS = {
  'google-shopping': 'apify/google-shopping-scraper',
  'instagram': 'apify/instagram-scraper',
  'facebook-ads': 'apify/facebook-ads-scraper',
  'amazon-prices': 'junglee/amazon-crawler'
};

// Schedule: Daily at 6am
// Output: Google Sheets via Webhook
```

---

## 3. PHASE 2: CONVERSION

### 3.1 Shopify Flow - Customer Journey Automation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SHOPIFY FLOW AUTOMATION MAP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   TRIGGER: Order Created                                                     │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                                                                  │       │
│   │    IF total_spent >= $2500 ──► Tag: loyalty-platinum            │       │
│   │    │                          └─► Remove: bronze,silver,gold    │       │
│   │    │                                                             │       │
│   │    ELSE IF total_spent >= $1000 ──► Tag: loyalty-gold           │       │
│   │    │                               └─► Remove: bronze,silver     │       │
│   │    │                                                             │       │
│   │    ELSE IF total_spent >= $500 ──► Tag: loyalty-silver          │       │
│   │    │                              └─► Remove: bronze,gold        │       │
│   │    │                                                             │       │
│   │    ELSE ──► Tag: loyalty-bronze                                  │       │
│   │                                                                  │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   TRIGGER: Customer Created                                                  │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                                                                  │       │
│   │    Tag: new_customer, acquisition_date_YYYY-MM                  │       │
│   │    │                                                             │       │
│   │    IF source = meta_ads ──► Tag: source_meta                    │       │
│   │    IF source = google ──► Tag: source_google                    │       │
│   │    IF source = tiktok ──► Tag: source_tiktok                    │       │
│   │    IF source = email ──► Tag: source_email                      │       │
│   │                                                                  │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   TRIGGER: Order Fulfilled                                                   │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                                                                  │       │
│   │    Wait 14 days                                                  │       │
│   │    └─► Send Klaviyo Event: review_request                       │       │
│   │                                                                  │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Checkout Optimization

**Cart Recovery Stack:**

```
ABANDONED CART SEQUENCE
│
├─► T+1h: Shopify Email (native, free)
│   └─► Subject: "You left something behind"
│
├─► T+4h: Klaviyo Email #1
│   └─► Subject: "Still thinking about it?"
│   └─► Include: Product image, price, CTA
│
├─► T+24h: Klaviyo Email #2 + SMS
│   └─► Subject: "Don't miss out - 10% off"
│   └─► Include: Discount code, urgency
│
└─► T+72h: Klaviyo Email #3 (final)
    └─► Subject: "Last chance: Your cart expires"
    └─► Include: Scarcity, social proof

Expected Recovery: 10-15% of abandoned carts
RPR (Revenue Per Recipient): $3.65 avg
```

### 3.3 Dynamic Pricing & Bundles

```javascript
// Bundle Intelligence Script
const BUNDLE_RULES = {
  // Frequently Bought Together
  crossSell: {
    trigger: 'add_to_cart',
    logic: 'ML recommendation',
    discount: '10-15%'
  },

  // Volume Discounts
  volumeDiscount: {
    tiers: [
      { qty: 2, discount: '5%' },
      { qty: 3, discount: '10%' },
      { qty: 5, discount: '15%' }
    ]
  },

  // Subscription Upsell
  subscription: {
    discount: '15%',
    frequency: [30, 60, 90] // days
  }
};
```

---

## 4. PHASE 3: RETENTION

### 4.1 Klaviyo Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KLAVIYO FLOW MATRIX                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ WELCOME SERIES (5 emails, 14 days)                              │       │
│   │ ════════════════════════════════════════════════════════════════│       │
│   │ Day 0: Welcome + Brand Story (no discount)                      │       │
│   │ Day 2: Social Proof + Reviews                                   │       │
│   │ Day 4: Best Sellers Showcase                                    │       │
│   │ Day 7: Educational Content                                      │       │
│   │ Day 14: First Purchase Incentive (10% off)                      │       │
│   │                                                                  │       │
│   │ Expected Performance:                                            │       │
│   │ • Open Rate: 40-50%                                             │       │
│   │ • Click Rate: 5-8%                                              │       │
│   │ • Conversion: 20-40% of subscribers                             │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ POST-PURCHASE (5 emails)                                        │       │
│   │ ════════════════════════════════════════════════════════════════│       │
│   │ Day 0: Order Confirmation                                        │       │
│   │ Day 2: Shipping Update                                           │       │
│   │ Day 7: Product Tips/How-to                                       │       │
│   │ Day 14: Review Request (+ 10% next order)                       │       │
│   │ Day 30: Cross-sell/Replenishment                                │       │
│   │                                                                  │       │
│   │ Expected Performance:                                            │       │
│   │ • Review Submission Rate: 8-15%                                 │       │
│   │ • Repeat Purchase Rate: 25-35%                                  │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ WIN-BACK SERIES (3 emails, 90 days inactive)                    │       │
│   │ ════════════════════════════════════════════════════════════════│       │
│   │ Day 90: "We miss you" + New arrivals                            │       │
│   │ Day 97: Exclusive discount (15% off)                            │       │
│   │ Day 104: Final offer (20% off, urgency)                         │       │
│   │                                                                  │       │
│   │ Expected Performance:                                            │       │
│   │ • Reactivation Rate: 5-10%                                      │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ VIP/LOYALTY TIERS                                               │       │
│   │ ════════════════════════════════════════════════════════════════│       │
│   │ Bronze ($0-499): Standard emails                                │       │
│   │ Silver ($500-999): Early access + 5% off                        │       │
│   │ Gold ($1000-2499): 10% off + Free shipping                      │       │
│   │ Platinum ($2500+): 15% off + Priority support + Exclusives      │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 SMS Marketing (Klaviyo)

```
SMS AUTOMATION RULES
│
├─► Abandoned Cart (T+1h after email)
│   └─► "Hey {first_name}! Your cart is waiting 🛒 {cart_url}"
│
├─► Shipping Notification
│   └─► "Good news! Your order is on its way 📦 Track: {tracking_url}"
│
├─► Flash Sales (VIP only)
│   └─► "VIP Early Access 🔥 24h only - 25% off everything"
│
└─► Birthday
    └─► "Happy Birthday {first_name}! 🎂 Here's 20% off on us"

SMS Benchmarks:
• Open Rate: 98%
• Click Rate: 20-35%
• Opt-out Rate: <2%
```

### 4.3 Replenishment & Subscription

```javascript
// Auto-replenishment triggers
const REPLENISHMENT_CONFIG = {
  // By product category
  categories: {
    'skincare': { days: 60, reminder: 7 },
    'supplements': { days: 30, reminder: 5 },
    'consumables': { days: 45, reminder: 7 }
  },

  // Klaviyo event trigger
  triggerEvent: 'Replenishment Reminder',

  // Discount for subscription conversion
  subscriptionDiscount: 15
};
```

---

## 5. PHASE 4: ADVOCACY

### 5.1 Review Collection Automation

```
REVIEW COLLECTION FLOW
│
├─► Shopify Flow: Order Fulfilled
│   └─► Wait 14 days (product received)
│       └─► Trigger Klaviyo: review_request
│
├─► Klaviyo: Review Request Email
│   └─► Include: Product image, star rating CTA
│   └─► Incentive: 10% off next order
│
├─► Judge.me: Review Widget (Recommandé - $15/mo flat)
│   └─► Auto-publish 4-5 star reviews
│   └─► Flag 1-3 star for response
│   └─► Pas de frais de dépassement (illimité)
│   └─► Alternative: Loox pour produits visuels (photos UGC)
│
└─► Shopify Flow: New Review
    └─► IF rating >= 4
        └─► Tag customer: advocate
        └─► Trigger: referral_program_invite
```

### 5.2 Referral Program

```
REFERRAL STRUCTURE
│
├─► Referrer Reward: $15 store credit
├─► Referee Reward: 15% off first order
├─► Trigger: After 2nd purchase
│
└─► Klaviyo Flow: Referral Invite
    └─► Day 0: "Share the love"
    └─► Day 7: Reminder
    └─► Day 30: Success stories
```

### 5.3 UGC Pipeline

```
UGC AUTOMATION
│
├─► Apify: Instagram Hashtag Scraper
│   └─► Monitor: #brandname, #productname
│   └─► Auto-collect to Google Sheets
│
├─► Review Photos
│   └─► Auto-import to Loox gallery
│   └─► Rights request automation
│
├─► TikTok UGC
│   └─► Spark Ads authorization
│   └─► Creator marketplace outreach
│
└─► Email UGC Request
    └─► Post-purchase: "Share your look"
    └─► Incentive: Feature + Gift card
```

---

## 6. STACK TECHNIQUE COMPLET

### 6.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FULL STACK ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         DATA LAYER                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │ GA4      │ │ Shopify  │ │ Klaviyo  │ │ Meta     │ │ Sheets   │  │    │
│  │  │ BigQuery │ │ Admin API│ │ API      │ │ CAPI     │ │ API      │  │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │    │
│  │       │            │            │            │            │         │    │
│  │       └────────────┴─────┬──────┴────────────┴────────────┘         │    │
│  │                          │                                          │    │
│  │                          ▼                                          │    │
│  │                 ┌─────────────────┐                                 │    │
│  │                 │   Claude 4.5    │                                 │    │
│  │                 │   (MCP Server)  │                                 │    │
│  │                 └────────┬────────┘                                 │    │
│  │                          │                                          │    │
│  └──────────────────────────┼──────────────────────────────────────────┘    │
│                             │                                                │
│  ┌──────────────────────────┼──────────────────────────────────────────┐    │
│  │                   AUTOMATION LAYER                                   │    │
│  │                          │                                          │    │
│  │    ┌─────────────────────┼─────────────────────┐                    │    │
│  │    │                     ▼                     │                    │    │
│  │    │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │                    │    │
│  │    │  │ Shopify  │ │ GitHub   │ │ Apify    │  │                    │    │
│  │    │  │ Flow     │ │ Actions  │ │ Actors   │  │                    │    │
│  │    │  └──────────┘ └──────────┘ └──────────┘  │                    │    │
│  │    └──────────────────────────────────────────┘                    │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      EXECUTION LAYER                                 │    │
│  │                                                                      │    │
│  │   ACQUISITION        CONVERSION         RETENTION        ADVOCACY   │    │
│  │   ┌──────────┐      ┌──────────┐      ┌──────────┐     ┌─────────┐ │    │
│  │   │ Meta Ads │      │ Shopify  │      │ Klaviyo  │     │Judge.me │ │    │
│  │   │ Google   │      │ Checkout │      │ Email    │     │ Reviews │ │    │
│  │   │ TikTok   │      │ DSers    │      │ SMS      │     │ UGC     │ │    │
│  │   │ SEO/AEO  │      │ Bundles  │      │ Flow     │     │ Referral│ │    │
│  │   └──────────┘      └──────────┘      └──────────┘     └─────────┘ │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 MCP Server Configuration

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "pipx",
      "args": ["run", "analytics-mcp"],
      "description": "GA4 Reports & Metrics"
    },
    "google-sheets": {
      "command": "npx",
      "args": ["-y", "google-sheets-mcp"],
      "description": "Data Import/Export"
    },
    "klaviyo": {
      "command": "uvx",
      "args": ["klaviyo-mcp-server@latest"],
      "description": "Email Flows & Campaigns"
    },
    "shopify-admin": {
      "command": "npx",
      "args": ["-y", "@ajackus/shopify-mcp-server"],
      "description": "Products, Orders, Customers"
    },
    "apify": {
      "command": "npx",
      "args": ["-y", "@apify/actors-mcp-server"],
      "description": "Web Scraping & Monitoring"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "description": "Browser Debugging"
    }
  }
}
```

### 6.3 Environment Variables

```bash
# Shopify
SHOPIFY_STORE=store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxx

# Klaviyo
KLAVIYO_API_KEY=pk_xxx
KLAVIYO_PUBLIC_KEY=xxx

# Google
GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json
GOOGLE_PROJECT_ID=project-id
GA4_PROPERTY_ID=123456789

# Meta
META_ACCESS_TOKEN=EAAxxxx
META_PIXEL_ID=123456
META_PAGE_ID=123456

# TikTok
TIKTOK_ACCESS_TOKEN=xxx
TIKTOK_PIXEL_ID=xxx

# Apify
APIFY_TOKEN=apify_api_xxx
```

---

## 7. SCRIPTS D'AUTOMATISATION

### 7.1 Scripts Disponibles (agency-scripts-Q1-GOLD)

| Script | Fonction | Frequency |
|--------|----------|-----------|
| `sync-meta-leads-to-shopify.cjs` | Lead Ads → Customers | Hourly |
| `sync-google-ads-leads-to-shopify.cjs` | Google Leads → Customers | Hourly |
| `sync-tiktok-ads-leads-to-shopify.cjs` | TikTok Leads → Customers | Hourly |
| `audit-klaviyo-flows.cjs` | Flows Health Check | Daily |
| `export-products-csv.cjs` | Feed Export | Daily |
| `generate-taxonomy-csv.cjs` | Category Mapping | Weekly |
| `deploy-collection-descriptions.cjs` | SEO Descriptions | On-demand |
| `enrich-facebook-leads-apollo.py` | Lead Enrichment | Daily |

### 7.2 Scripts Python (alpha-medical-python-agency)

| Script | Fonction | Frequency |
|--------|----------|-----------|
| `configure_klaviyo.py` | Initial Setup | Once |
| `upload_templates_to_klaviyo.py` | Email Templates | On-demand |
| `complete_all_shopify_policies.py` | Legal Pages | Once |
| `start-native-script.sh` | Script Activation | On-demand |
| `setup_google_sheet.py` | Dashboard Setup | Once |

---

## 8. GITHUB ACTIONS WORKFLOWS

### 8.1 Daily Automation

```yaml
# .github/workflows/daily-automation.yml
name: Daily E-commerce Automation

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:

jobs:
  sync-leads:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Sync Meta Leads
        run: node scripts/sync-meta-leads-to-shopify.cjs
        env:
          SHOPIFY_STORE: ${{ secrets.SHOPIFY_STORE }}
          SHOPIFY_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
          META_PAGE_ACCESS_TOKEN: ${{ secrets.META_ACCESS_TOKEN }}

      - name: Sync Google Leads
        run: node scripts/sync-google-ads-leads-to-shopify.cjs
        env:
          GOOGLE_ADS_TOKEN: ${{ secrets.GOOGLE_ADS_TOKEN }}

      - name: Audit Klaviyo Flows
        run: node scripts/audit-klaviyo-flows.cjs
        env:
          KLAVIYO_API_KEY: ${{ secrets.KLAVIYO_API_KEY }}

      - name: Export Products Feed
        run: node scripts/export-products-csv.cjs

      - name: Upload to Google Sheets
        run: node scripts/upload-to-sheets.cjs
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GOOGLE_CREDS }}

  competitor-monitoring:
    runs-on: ubuntu-latest
    steps:
      - name: Run Apify Actors
        run: |
          curl -X POST "https://api.apify.com/v2/schedules/${{ secrets.APIFY_SCHEDULE_ID }}/run?token=${{ secrets.APIFY_TOKEN }}"
```

### 8.2 Weekly SEO Automation

```yaml
# .github/workflows/weekly-seo.yml
name: Weekly SEO Automation

on:
  schedule:
    - cron: '0 3 * * 1'  # Monday 3 AM UTC
  workflow_dispatch:

jobs:
  seo-tasks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Sitemap Report
        run: node scripts/generate-sitemap-urls-report.cjs

      - name: Update Product Taxonomy
        run: node scripts/generate-taxonomy-csv.cjs

      - name: Deploy Collection Descriptions
        run: node scripts/deploy-collection-descriptions.cjs
        env:
          SHOPIFY_STORE: ${{ secrets.SHOPIFY_STORE }}
          SHOPIFY_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}

      - name: Update Alt Text
        run: node scripts/import-alt-text-api.cjs
```

### 8.3 Shopify Theme Deployment

```yaml
# .github/workflows/theme-deploy.yml
name: Shopify Theme Deployment

on:
  push:
    branches: [main]
    paths:
      - 'theme/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Shopify CLI
        uses: shopify/cli-action@v1

      - name: Theme Check
        run: shopify theme check --path theme/

      - name: Deploy to Production
        run: |
          shopify theme push --path theme/ \
            --store ${{ secrets.SHOPIFY_STORE }} \
            --theme ${{ secrets.THEME_ID }}
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
```

---

## 9. ROI PROJECTIONS

### 9.1 Investment vs Returns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROI PROJECTION (12 MONTHS)                           │
│                      SHOPIFY GROW - STACK PROFESSIONNEL                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   COSTS (STACK OPTIMISÉ PRO)                                                 │
│   ═══════════════════════════════════════════════════════════════════════   │
│   Shopify Grow (annual)               $79/mo            $948/yr             │
│   Klaviyo (10k contacts)              $150/mo           $1,800/yr           │
│   Apify (Starter)                     $49/mo            $588/yr             │
│   Judge.me (Awesome)                  $15/mo            $180/yr             │
│   Apps & Tools                        $100/mo           $1,200/yr           │
│   ──────────────────────────────────────────────────────────────────────    │
│   TOTAL STACK COST                    $393/mo           $4,716/yr           │
│                                                                              │
│   AVANTAGES SHOPIFY GROW vs BASIC (+$50/mo = +$600/yr)                      │
│   └─► HTTP Request dans Flow (webhooks Klaviyo, Slack, custom APIs)        │
│   └─► Shipping discount 88% vs 77% (~$1/colis économisé)                   │
│   └─► 5 staff accounts vs 2 (équipe élargie)                                │
│   └─► Break-even shipping: ~50 colis/mois = rentabilisé                     │
│                                                                              │
│   EXPECTED RETURNS (based on benchmarks)                                    │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   Abandoned Cart Recovery (15% rate)                                        │
│   └─► $100k abandoned/mo × 15% = $15,000/mo recovered                       │
│                                                                              │
│   Email Revenue (30% of total)                                              │
│   └─► $500k revenue × 30% = $150,000/mo from email                          │
│                                                                              │
│   Conversion Rate Improvement (+1%)                                          │
│   └─► 2.5% → 3.5% = +40% more conversions                                   │
│                                                                              │
│   LTV Increase (retention +10%)                                              │
│   └─► $150 LTV → $165 LTV = +10% revenue per customer                       │
│                                                                              │
│   ══════════════════════════════════════════════════════════════════════    │
│   PROJECTED ANNUAL ROI: 40-85x stack investment (Pro stack $4.7k/yr)        │
│   ══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│   COMPARATIF: ÉCONOMIES VS ENTERPRISE STACK                                 │
│   ═══════════════════════════════════════════════════════════════════════   │
│   Enterprise (Plus+Loox)              $3,348/mo         $40,176/yr          │
│   Pro (Grow+Judge.me)                 $393/mo           $4,716/yr           │
│   ──────────────────────────────────────────────────────────────────────    │
│   ÉCONOMIE ANNUELLE                   $2,955/mo         $35,460/yr (88%)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Implementation Timeline

```
WEEK 1-2: FOUNDATION
├─► Shopify Flow setup (loyalty tiers, tagging)
├─► Klaviyo integration + core flows
├─► GA4 + GTM server-side setup
└─► Meta CAPI implementation

WEEK 3-4: ACQUISITION
├─► Meta Advantage+ campaign setup
├─► Google PMax configuration
├─► TikTok Smart+ launch
└─► SEO schema deployment

WEEK 5-6: RETENTION
├─► Welcome series optimization
├─► Post-purchase flow refinement
├─► SMS automation setup
└─► Review collection automation

WEEK 7-8: SCALE
├─► A/B testing framework
├─► Competitor monitoring setup
├─► GitHub Actions automation
└─► Performance dashboards

ONGOING: OPTIMIZATION
├─► Weekly: Creative refresh
├─► Bi-weekly: Flow performance review
├─► Monthly: Full funnel audit
└─► Quarterly: Strategy review
```

### 9.3 Success Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEEKLY KPI DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ACQUISITION                          │   CONVERSION                        │
│   ─────────────────────────────────────│───────────────────────────────────  │
│   Traffic:        ████████████  +12%   │   CVR:          ███████████  3.2%  │
│   CAC:            $45 (-8%)            │   AOV:          $125 (+5%)         │
│   ROAS Meta:      2.8x                 │   Cart Abandon: 68% (-3%)          │
│   ROAS Google:    4.2x                 │   Checkout:     72% (+2%)          │
│                                        │                                     │
│   RETENTION                            │   ADVOCACY                          │
│   ─────────────────────────────────────│───────────────────────────────────  │
│   Email Revenue:  28% of total         │   Reviews:      127 new (+15)      │
│   Repeat Rate:    32%                  │   Avg Rating:   4.7/5              │
│   LTV:            $185                 │   Referrals:    45 (+8)            │
│   Churn:          4.2%                 │   UGC Posts:    23 collected       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. MODELE AGENCE AAA + MARKETING

### 10.1 Double Pilier Business Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUAL AGENCY MODEL: AAA + MARKETING                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PILIER 1: AAA SERVICES (Automation AI)                                    │
│   ═══════════════════════════════════════════════════════════════════════   │
│   Revenue Type: One-time setup + Maintenance                                 │
│   Target: PME/E-commerce avec 0-30% automatisation                          │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STARTER      │ GROWTH        │ SCALE                            │       │
│   │ $5-8k setup  │ $10-15k setup │ $20-35k setup                    │       │
│   │ $1.5-2.5k/mo │ $3.5-5k/mo    │ $7-12k/mo maintenance           │       │
│   │              │               │                                   │       │
│   │ • 3 Flows    │ • 6 Flows     │ • 12+ Flows                      │       │
│   │ • 1 MCP      │ • 3 MCPs      │ • Full MCP Stack                 │       │
│   │ • Basic GA4  │ • Full GA4    │ • BigQuery + Looker              │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   PILIER 2: MARKETING SERVICES (Gestion Continue)                           │
│   ═══════════════════════════════════════════════════════════════════════   │
│   Revenue Type: Recurring retainer + Performance bonus                      │
│   Target: Clients post-setup AAA cherchant croissance                       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STARTER      │ GROWTH        │ SCALE                            │       │
│   │ $2-3k/mo     │ $4-6k/mo      │ $8-15k/mo                        │       │
│   │              │               │                                   │       │
│   │ • Email mgmt │ • + Paid Ads  │ • Full funnel                    │       │
│   │ • 2 campaigns│ • 4 campaigns │ • Unlimited campaigns            │       │
│   │ • Monthly    │ • Bi-weekly   │ • Weekly reporting               │       │
│   │   reporting  │   reporting   │ • Dedicated strategist           │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Stack Recommandé pour Agence AAA

```
STACK OPTIMAL (MCP-Ready)
├── Email/SMS: KLAVIYO (MCP disponible, 20% partner rev share)
│   └─► Predictive analytics, AI subject lines
│   └─► Alternative budget: Omnisend (53% moins cher)
│
├── Reviews: JUDGE.ME ($15/mo flat, pas de surcoûts)
│   └─► 5.0/5 rating Shopify (32,973 reviews)
│   └─► Alternative visuelle: Loox (7% submission rate)
│
├── E-commerce: SHOPIFY GROW ($79/mo annual)
│   └─► Flow + HTTP Request (webhooks externes)
│   └─► 88% shipping discount, 5 staff accounts
│   └─► ROI: ~50 colis/mois = surcoût rentabilisé
│
├── Analytics: GA4 + MCP (gratuit)
│   └─► BigQuery export pour clients Scale
│
├── Scraping: APIFY ($49/mo)
│   └─► MCP disponible, competitor monitoring
│
└── Ads: META + GOOGLE + TIKTOK (APIs directes)
    └─► CAPI server-side obligatoire
```

### 10.3 Revenus Réalistes Année 1

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROJECTIONS RÉALISTES ANNÉE 1                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SCÉNARIO CONSERVATEUR (5 clients/an)                                      │
│   ═══════════════════════════════════════════════════════════════════════   │
│   AAA Setup (5 × $7k avg)                         $35,000                   │
│   AAA Maintenance (5 × $2k × 6 mois avg)          $60,000                   │
│   Marketing Retainer (3 × $3k × 8 mois)           $72,000                   │
│   ──────────────────────────────────────────────────────────────────────    │
│   TOTAL ANNÉE 1                                   $167,000                  │
│                                                                              │
│   SCÉNARIO MODÉRÉ (10 clients/an)                                           │
│   ═══════════════════════════════════════════════════════════════════════   │
│   AAA Setup (10 × $10k avg)                       $100,000                  │
│   AAA Maintenance (10 × $3k × 8 mois avg)         $240,000                  │
│   Marketing Retainer (6 × $4k × 10 mois)          $240,000                  │
│   ──────────────────────────────────────────────────────────────────────    │
│   TOTAL ANNÉE 1                                   $580,000                  │
│                                                                              │
│   NOTE: 80-95% des projets AI échouent (MIT 2025, RAND, Gartner)            │
│   Focus sur LIVRAISON et RÉSULTATS mesurables, pas promesses                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SOURCES & REFERENCES

- [Klaviyo Email Automation Best Practices](https://www.klaviyo.com/blog/top-email-automation-examples)
- [Shopify Flow 2025 Updates](https://www.shopify.com/blog/flow-automation-updates-2025)
- [Meta CAPI Best Practices](https://www.triplewhale.com/blog/facebook-capi)
- [Google Performance Max Guide](https://www.datafeedwatch.com/blog/performance-max-campaign-guide)
- [TikTok Smart+ Campaigns](https://megadigital.ai/en/blog/tiktok-smart-campaign/)
- [E-commerce Conversion Benchmarks 2025](https://www.speedcommerce.com/insights/ecommerce-benchmarks-conversion-rates-by-industry-over-by-year/)
- [LTV:CAC Ratio Guide](https://www.admetrics.io/en/post/clv-to-cac-ratio)
- [HubSpot MCP Server](https://developers.hubspot.com/mcp)
- [Apify MCP Documentation](https://docs.apify.com/platform/integrations/mcp)

---

---

## 11. VOICE AI & BOOKING INTEGRATION

### 11.1 Position dans le Flywheel

```
                         VOICE AI BOOKING INTEGRATION
                         ════════════════════════════

                    ┌─────────────────────────────────────┐
                    │         WEBSITE VISITOR             │
                    │     (Any page, any time zone)       │
                    └───────────────┬─────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │      🎤 VOICE AI ASSISTANT          │
                    │  - Web Speech API (gratuit)         │
                    │  - 118 automations catalog           │
                    │  - Sector-specific responses        │
                    │  - Fallback text for Firefox        │
                    └───────────────┬─────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │  ACQUISITION  │     │  CONVERSION   │     │   RETENTION   │
      │ Lead captured │     │ RDV booked    │     │ Email/WhatsApp│
      │ Industry tag  │     │ Google Cal    │     │ reminders     │
      │ Source track  │     │ Confirmation  │     │ Follow-up     │
      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                    ┌─────────────────────────────────────┐
                    │         KLAVIYO PROFILES            │
                    │  - Geo-segmentation (MA/EU/INT)     │
                    │  - Industry segmentation            │
                    │  - Booking history                  │
                    │  - Engagement scoring               │
                    └─────────────────────────────────────┘
```

### 11.2 Data Flow Voice AI → Flywheel

```javascript
// Voice AI Booking Data Flow
const VOICE_BOOKING_INTEGRATION = {
  // 1. ACQUISITION: Voice captures lead
  acquisition: {
    trigger: 'voice_booking_started',
    actions: [
      'Create lead in CRM',
      'Tag with industry',
      'Tag with source (voice)',
      'Track GA4 event'
    ]
  },

  // 2. CONVERSION: Booking confirmed
  conversion: {
    trigger: 'voice_booking_completed',
    actions: [
      'Create Google Calendar event',
      'Send confirmation email',
      'Create Klaviyo profile',
      'Track conversion event'
    ]
  },

  // 3. RETENTION: Follow-up automation
  retention: {
    trigger: 'booking_reminder',
    actions: [
      'Send WhatsApp reminder (24h before)',
      'Send email reminder (1h before)',
      'Post-meeting follow-up',
      'Feedback request'
    ]
  }
};
```

### 11.3 Sector Templates (Booking Config)

| Sector | Hours | Blocked | Duration | Buffer |
|--------|-------|---------|----------|--------|
| **Consultant** | Lun-Ven 9h-18h | 12h-14h | 30min | 0min |
| **Restaurant** | Mar-Dim 11h-23h | 15h-18h | 60min | 15min |
| **Medical** | Lun-Sam 8h-20h | 12h-14h | 20min | 10min |
| **Architect** | Lun-Ven 9h-19h | - | 60min | 0min |
| **E-commerce** | 24/7 | - | 15min | 0min |
| **Nightclub** | Jeu-Sam 20h-4h | - | 30min | 0min |

### 11.4 GA4 Events Tracked

| Event | Trigger | Parameters |
|-------|---------|------------|
| `voice_booking_started` | User initiates booking | step, industry |
| `voice_booking_slot_selected` | Slot chosen | slot_date, slot_time |
| `voice_booking_completed` | Booking confirmed | service, datetime |
| `voice_booking_cancelled` | User cancels | step |
| `voice_booking_failed` | Error occurred | error |

### 11.5 WhatsApp Business API Integration (FREE)

```
WHATSAPP REMINDERS (POST-BOOKING)
│
├─► T-24h: Service conversation (FREE)
│   └─► "Bonjour {name}! Rappel: RDV demain à {time}"
│   └─► Include: Reschedule link, Cancel option
│
├─► T-1h: Service conversation (FREE)
│   └─► "RDV dans 1h! Voici le lien: {meeting_url}"
│
└─► T+24h: Follow-up (FREE if within 24h window)
    └─► "Comment s'est passé votre RDV?"
    └─► Include: Feedback link, Referral offer

Note: Service conversations are FREE since Nov 2024
Marketing messages require template approval + cost
```

### 11.6 Knowledge Base Auto-Sync

```bash
# Sync automations to voice assistant knowledge
node automations/agency/core/sync-knowledge-base.cjs

# Output:
# - knowledge-base/data/catalog.json (full catalog)
# - voice-assistant/knowledge.json (voice-optimized)
#
# Run after adding new automations to keep voice AI updated
```

---

*Document generated by Claude 4.5 Opus - AI Agency Automation Blueprint*
*Last Updated: December 27, 2025 (Session 100)*
*Version: 2.8 - MCP Stack 11/14 (79%) + Voice AI Section +15%*

---

## CHANGELOG

| Version | Date | Modifications |
|---------|------|---------------|
| 2.8 | 27/12/2025 | Session 100: MCP empirical verification (11/14 = 79%), Voice AI section +15% height, "appels inclus" text |
| 2.7 | 26/12/2025 | Session 97: Lead Tracking (Landing→Dashboard CRM), Invoice multi-currency, Conversion tracking VERIFIED |
| 5.0 | 08/01/2026 | Session 128: 118 tools, Level 4 Agentic Engine, 18 agents, Full Sync |
| 2.6 | 26/12/2025 | Session 96: 118 automations, Voice AI Product (Schema.org SoftwareApplication), blueprint protection |
| 2.5 | 23/12/2025 | Session 83: Ultra Forensic 20 categories, 133 issues fixed (0 CRITICAL), 9 MCPs fonctionnels vérifiés, logo paths normalisés |
| 2.4 | 23/12/2025 | Session 82: Forensic frontend audit, AEO optimization, 77 automations |
| 2.3 | 20/12/2025 | Session 61: Voice AI + Booking integration, 72 automations (segmentation v4.0) |
| 2.2 | 20/12/2025 | Session 50: Automations count 45 (vérifié), référence mobile UX |
| 2.1 | 16/12/2025 | Shopify Grow + Klaviyo + Judge.me + Dual Agency Model |
