# 3A Automation - Project Architecture

## Directory Structure

```
/Users/mac/Desktop/JO-AAA/           <- AGENCY
├── automations/                     <- 78 automations
│   ├── automations-registry.json    <- SOURCE OF TRUTH
│   ├── agency/core/                 <- Internal tools
│   ├── clients/                     <- Client templates
│   └── generic/                     <- Utilities
├── landing-page-hostinger/          <- Site 32 pages
├── dashboard/                       <- Next.js 14 admin
├── scripts/                         <- Session tools
├── docs/                            <- Documentation
├── outputs/                         <- Reports
└── .env                             <- Credentials

/Users/mac/Desktop/clients/          <- CLIENTS (isolated)
├── henderson/                       <- 114 scripts
├── mydealz/                         <- 59 scripts
└── alpha-medical/                   <- 7 scripts
```

## Identity

**3A = Automation, Analytics, AI**
- Solo automation & marketing consultant
- Target: SMEs €10k-500k revenue
- Markets: Maghreb, Europe, International

## Critical Rules

1. **Agency/Client Separation** - Never mix credentials
2. **Factuality** - Verify empirically before claiming
3. **Source of Truth** - automations-registry.json
4. **Code Standards** - CommonJS (.cjs), process.env
5. **No Placeholders** - Complete code only
