# 3A Automation - Project Architecture

## Directory Structure

```
/Users/mac/Desktop/JO-AAA/           <- AGENCY (public Git repo)
├── automations/                     <- 99 automations
│   ├── automations-registry.json    <- SOURCE OF TRUTH
│   ├── agency/core/                 <- Internal agency tools
│   ├── templates/                   <- Reusable client templates
│   └── generic/                     <- Shared utilities
├── landing-page-hostinger/          <- Site 63 pages (FR/EN)
├── dashboard/                       <- Next.js 14 admin
├── scripts/                         <- Session tools
├── docs/                            <- Documentation
├── outputs/                         <- Reports
└── .env                             <- Agency credentials ONLY

/Users/mac/Projects/clients/         <- CLIENTS (private Git repos)
├── henderson/                       <- 114 scripts (Git repo)
│   ├── .git/                        <- Version controlled
│   ├── .gitignore                   <- Ignores .env
│   └── .env.example                 <- Template (no secrets)
├── mydealz/                         <- 59 scripts (Git repo)
│   ├── .git/
│   ├── .gitignore
│   └── .env.example
└── alpha-medical/                   <- 45 scripts (Git repo)
    ├── .git/
    ├── .gitignore
    └── .env.example
```

## Key Principles

1. **Agency code = Public** - JO-AAA repo on GitHub
2. **Client code = Private** - Individual Git repos per client
3. **Credentials isolation** - Each project has its own .env (never committed)
4. **Off Desktop** - Client repos in /Projects/ (not Desktop) for safety

## Identity

**3A = Automation, Analytics, AI**
- Agence d'Automatisation AI
- Markets: E-commerce & PME B2B
- Target: €10k-500k revenue
- Regions: Maghreb, Europe, International
- Tone: NOUS (jamais "je")

## Critical Rules

1. **Agency/Client Separation** - Never mix credentials
2. **Factuality** - Verify empirically before claiming
3. **Source of Truth** - automations-registry.json
4. **Code Standards** - CommonJS (.cjs), process.env
5. **No Placeholders** - Complete code only
