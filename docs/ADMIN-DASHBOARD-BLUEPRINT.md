# 3A AUTOMATION - Admin Dashboard Blueprint
## Version: 1.0.0 | Date: 2025-12-23 | Session: 80

---

## ARCHITECTURE TECHNIQUE

### Stack Technologique (2025 Best Practices)

```
FRONTEND:
├── Framework: Next.js 14+ (App Router)
├── UI Library: Shadcn/UI + Tailwind CSS v4
├── State: Zustand / TanStack Query
├── Charts: Recharts / Tremor
├── Forms: React Hook Form + Zod
├── Auth: NextAuth.js v5 / Clerk
└── Deploy: Vercel (Edge Functions)

BACKEND:
├── API: Next.js API Routes + tRPC
├── Database: PostgreSQL (Supabase)
├── ORM: Prisma / Drizzle
├── Cache: Redis (Upstash)
├── Queue: BullMQ / Inngest
└── Storage: Cloudflare R2

INTEGRATIONS:
├── Native Scripts: 10 resilient automations (automations/agency/core/)
├── Apify: Web scraping
├── Klaviyo: Email marketing
├── GA4: Analytics
├── Grok/Claude: AI processing
└── WhatsApp: Notifications
```

---

## MODULES DASHBOARD

### 1. Overview / Home
```
┌─────────────────────────────────────────────────────────────┐
│  METRICS TEMPS REEL                                         │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Leads Today │  Revenue MTD │  Active      │  Conversion   │
│     +12      │   €4,890     │  Workflows   │     3.2%      │
│   ↑ 15%      │   ↑ 23%      │    5/5 OK    │   ↑ 0.5%      │
└──────────────┴──────────────┴──────────────┴───────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GRAPHIQUE: Leads par source (30 jours)                     │
│  [LinkedIn] [Meta Ads] [Google Ads] [Organic] [Referral]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ALERTES & NOTIFICATIONS                                    │
│  ⚠️ 3 leads non contactes > 24h                            │
│  ✅ Workflow WhatsApp: 42/42 envoyes                        │
│  🔴 Apify credits: 15% restant                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Lead Management
```
FONCTIONNALITES:
├── Liste leads avec filtres (source, status, score)
├── Lead scoring automatique (AI-powered)
├── Timeline d'interactions
├── One-click actions (email, WhatsApp, call)
├── Bulk actions (assign, tag, export)
└── Pipeline view (Kanban)

STATUTS:
├── New → Contacted → Qualified → Proposal → Won/Lost
└── Auto-progression via native scripts (automations/agency/core/)

DATA MODEL:
Lead {
  id, name, email, phone, company,
  source, score, status, assignedTo,
  interactions[], tags[], notes,
  createdAt, updatedAt, convertedAt
}
```

### 3. Automation Hub
```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOWS ACTIFS                                           │
├─────────────────────────────────────────────────────────────┤
│  ☑ LinkedIn Lead Scraper        │ Every 6h  │ 234 leads/wk │
│  ☑ Email Outreach Sequence      │ Daily     │ 89% delivery │
│  ☑ WhatsApp Booking Reminders   │ Triggered │ 12 sent/day  │
│  ☑ Lead Scoring AI              │ Real-time │ 156 scored   │
│  ☐ Grok Voice Telephony         │ Paused    │ - - -        │
└─────────────────────────────────────────────────────────────┘

CONTROLS:
├── Enable/Disable workflows
├── View execution logs
├── Manual trigger
├── Edit parameters
└── Clone workflow
```

### 4. Analytics & Reports
```
DASHBOARDS:
├── Lead Funnel Analysis
├── Source Attribution
├── Campaign Performance
├── Revenue Tracking
├── Conversion Rates
└── Custom Reports Builder

EXPORTS:
├── PDF Reports (auto-generated)
├── CSV/Excel data export
├── API access for BI tools
└── Scheduled email reports
```

### 5. Client Portal (Future)
```
CLIENT ACCESS:
├── View their automations
├── See performance metrics
├── Download reports
├── Submit support tickets
└── Billing & invoices
```

---

## LEAD GENERATION ENGINE

### Architecture Aggressive

```
                    ┌─────────────────────┐
                    │   LEAD SOURCES      │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   LinkedIn    │   │    Google     │   │     Meta      │
│   Scraping    │   │     Ads       │   │     Ads       │
│   (Apify)     │   │   (Webhook)   │   │   (Webhook)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │  NATIVE ENRICHMENT  │
                    │   + AI SCORING      │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Email      │   │   LinkedIn    │   │   WhatsApp    │
│   Sequence    │   │   Connect     │   │   Message     │
│   (Klaviyo)   │   │   Request     │   │   (Business)  │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   CRM / DASHBOARD   │
                    │   (Lead tracking)   │
                    └─────────────────────┘
```

### Workflow Details

**1. LinkedIn Scraper (Apify)**
```
Input:
├── Search query: "E-commerce Manager" OR "Digital Marketing"
├── Location: Morocco, France, Belgium, Canada
├── Company size: 11-200 employees
└── Industry: Retail, Fashion, Beauty, Consumer Goods

Output:
├── Name, Title, Company
├── LinkedIn URL
├── Work email (enriched)
├── Company info
└── Score (0-100)

Schedule: Every 6 hours
Limit: 100 profiles/run (avoid LinkedIn limits)
Cost: ~$3/1000 profiles
```

**2. AI Lead Scoring (Claude/Grok)**
```
Scoring Criteria:
├── Title match (E-commerce, Marketing, Growth) → +30 pts
├── Company size (11-200) → +20 pts
├── Industry match (Retail, E-commerce) → +20 pts
├── Location (Morocco, France) → +15 pts
├── Engagement signals → +15 pts
└── Total: 100 pts

Thresholds:
├── Hot (80-100): Immediate outreach
├── Warm (50-79): Sequence nurturing
└── Cold (<50): Low priority
```

**3. Multi-Channel Outreach**
```
Day 0: LinkedIn connection request (personalized)
Day 1: Connection accepted → Welcome message
Day 3: Value-add content (case study)
Day 5: Email outreach (if email available)
Day 7: Follow-up email
Day 10: WhatsApp (if phone available)
Day 14: Final follow-up
```

---

## IMPLEMENTATION STATUS (Updated Session 119 - 02/01/2026)

> **NOTE:** n8n workflows were ALL migrated to native Node.js scripts in Session 115-119.
> See `automations/agency/core/` for 103 workflows including 7 resilient scripts. Stack is 100% Node.js native.

### Phase 1: MVP ✅ COMPLETE (Session 86-88)
```
├── [x] Setup Next.js 14 + Shadcn UI ✅
├── [x] Implement auth (JWT + bcrypt, NO NextAuth) ✅
├── [x] Create lead management CRUD ✅
├── [x] Connect n8n webhooks ✅
├── [x] Basic analytics dashboard ✅
└── [x] Deploy to Hostinger VPS (PM2) ✅ NOT Vercel
```
**URL:** https://dashboard.3a-automation.com

### Phase 2: Automation ✅ COMPLETE (Session 90-94)
```
├── [x] LinkedIn scraper workflow (n8n) ✅
├── [x] AI lead scoring (via Klaviyo properties) ✅
├── [x] Email sequence automation (Klaviyo Welcome Series) ✅
├── [x] WhatsApp integration (n8n workflows) ✅
└── [x] Real-time notifications (webhook events) ✅
```

### Phase 3: Scale ✅ COMPLETE (Session 94-97)
```
├── [x] Advanced analytics (Recharts + n8n API) ✅
├── [x] PDF/CSV report builder ✅
├── [x] Client portal (/client pages) ✅
├── [x] API for integrations (/api/* routes) ✅
└── [x] Performance optimization (lazy load, auto-refresh) ✅
```

### Tech Stack Actuel (NOT as originally planned)
```
ORIGINAL PLAN → ACTUAL IMPLEMENTATION
├── Vercel → Hostinger VPS (PM2)
├── Supabase → Google Sheets (Apps Script CRUD)
├── NextAuth → JWT + bcrypt (simple auth)
└── Apify direct → Native scripts (10 resilient .cjs)
```

---

## COUTS ACTUELS (Factuel - Session 102)

| Service | Plan | Cout/mois |
|---------|------|-----------|
| Hostinger VPS | KVM1 | ~$5 (inclus site + scripts + dashboard) |
| Google Sheets | Free | $0 |
| Native Scripts | Self-hosted | $0 |
| Klaviyo | Starter | $45 |
| Apify | Starter | $49 |
| **TOTAL** | | **~$99/mois** |

---

## METRIQUES CIBLES

| Metrique | Objectif | Timeline |
|----------|----------|----------|
| Leads/semaine | 50+ | Mois 1 |
| Email open rate | >50% | Mois 1 |
| Response rate | >5% | Mois 2 |
| Conversion rate | >2% | Mois 3 |
| CAC | <€200 | Mois 3 |
| Clients/mois | 2-3 | Mois 3 |

---

## SOURCES

- [Shadcn Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- [n8n Lead Gen Workflows](https://n8n.io/workflows/categories/lead-generation/)
- [Apify LinkedIn Scrapers](https://apify.com/curious_coder/linkedin-profile-scraper)
- [B2B SaaS Lead Gen Guide](https://www.gravitatedesign.com/blog/b2b-saas-lead-generation-guide/)
