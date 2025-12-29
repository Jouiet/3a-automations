# 3A Automation - Claude Code Memory
## Version: 19.0 | Date: 2025-12-29 | Session: 114

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (82, v2.0.0) |
| History | `HISTORY.md` (Sessions 0-114) |
| Shopify | guqsu3-yj.myshopify.com (dev store) |

## Session 114 - LEAD GEN PIPELINES OPERATIONNELS

### FAITS VÉRIFIÉS (Bottom-up)

| Métrique | Valeur | Source |
|----------|--------|--------|
| Marchés configurés | **31 pays** | `config/markets.cjs` |
| Phase 1 active | **14 pays** (MENA + Europe) | MARKET_GROUPS.phase1_active |
| Devises | **3 (MAD/EUR/USD)** | Standardisé |
| Listes Klaviyo | **15 créées** | API Klaviyo verified |
| GitHub Actions | **1 workflow cron** | `.github/workflows/lead-generation.yml` |
| Scripts lead gen | **4 fonctionnels** | Testés dry-run |

### BLOCKER CRITIQUE

```
⛔ APIFY: Crédits $0.01 restant
   Action: https://console.apify.com/billing
   Impact: LinkedIn + Google Maps pipelines BLOQUÉS
```

### LEAD GEN ARCHITECTURE

```
FICHIERS CRÉÉS SESSION 114:
├── automations/agency/config/markets.cjs    # 31 marchés, 3 devises
├── automations/agency/lead-gen-scheduler.cjs # Scheduler centralisé
├── scripts/setup-klaviyo-lists.cjs          # Création listes
└── .github/workflows/lead-generation.yml    # Cron automation

ROTATION PHASE 1 (6 mois - MENA + Europe):
  Dim: Morocco, Tunisia, Algeria
  Lun: France, Belgium, Switzerland
  Mar: UAE, Saudi Arabia
  Mer: Germany, Netherlands
  Jeu: Spain, Italy, Portugal
  Ven: Egypt, Morocco
  Sam: France, UAE

USA/UK/Oceania = PHASE 2 (après stabilisation)
```

### LISTES KLAVIYO (15)

```
LinkedIn (6):
  RPHxM8 - Decision Makers
  XcZciz - Marketing
  WzY9FW - Sales
  Ynq3cr - Tech
  XKnYzN - HR
  R85eP7 - Other

Google Maps (6):
  YhLLR3 - Decision Makers
  TsSUAP - Marketing
  X3JFBM - Sales
  SPRRYc - Tech
  ScQPmz - HR
  RzPLJW - Local Business

General (3):
  VaFxKU - Newsletter
  SKeBCN - Welcome Series
  S8dz2b - B2B Outreach
```

### n8n WORKFLOWS (5 actifs)

| Workflow | Status | Blocker |
|----------|--------|---------|
| Blog Generator | ✅ OK | - |
| Product Photos | ✅ OK | - |
| Grok Voice | ⛔ | Twilio credentials |
| WhatsApp Confirm | ⛔ | Meta Business |
| WhatsApp Remind | ⛔ | Meta Business |

## Memory Structure

Modular rules in `.claude/rules/`:

| File | Content |
|------|---------|
| `01-project-status.md` | État actuel, blockers |
| `02-pricing.md` | MAD/EUR/USD |
| `07-n8n-workflows.md` | 5 workflows |
| `code-standards.md` | CommonJS (.cjs) |
| `factuality.md` | Vérification empirique |

## Critical Rules

1. **Factuality** - Vérifier AVANT d'affirmer
2. **Source of Truth** - `automations-registry.json`
3. **No Placeholders** - Code complet uniquement
4. **3 Devises** - MAD, EUR, USD
5. **Phase 1** - MENA + Europe (6 mois)

## Deploy

```bash
git push origin main  # GitHub Action → Hostinger
```

---

*For session history, see HISTORY.md. For details, see .claude/rules/*
