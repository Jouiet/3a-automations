# 3A Automation - Claude Code Memory
## Version: 18.0 | Date: 2025-12-29 | Session: 114

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (82, v2.0.0) |
| History | `HISTORY.md` (Sessions 0-114) |
| Shopify | guqsu3-yj.myshopify.com ✅ (137 scopes) |

## Session 114 - SYSTEM HEALTH CHECK + N8N CLEANUP

| Fait | Valeur Vérifiée |
|------|-----------------|
| APIs Health | **9/9 (100%)** via `scripts/system-health-check.cjs` |
| Scripts natifs | **70 fichiers** (.cjs/.js) |
| n8n Workflows | **6 (5 actifs, 1 inactif)** - 3 supprimés (scripts natifs) |
| Shopify | **✅ Connecté** (137 scopes, basic plan, MAD) |

### HEALTH CHECK (100%)

```
n8n          ✅ 5/6 active
Klaviyo      ✅ 3 lists
Shopify      ✅ basic - MAD
xAI (Grok)   ✅ 11 models
Apify        ✅ OK
Gemini       ✅ 50 models
GitHub       ✅ OK
Hostinger    ✅ running
Booking      ✅ OK
```

### N8N WORKFLOWS (6)

```
ACTIFS (5):
├── Blog Article Generator          → Claude API
├── Enhance Product Photos          → Gemini API
├── Grok Voice Telephony            → BLOQUÉ: Twilio credentials
├── WhatsApp Booking Confirmation   → BLOQUÉ: WhatsApp API
└── WhatsApp Booking Reminders      → BLOQUÉ: WhatsApp API

INACTIF (1):
└── Newsletter 3A Automation        → PRÊT: API credits requis

SUPPRIMÉS (remplacés par scripts natifs):
├── Klaviyo Welcome Series          → email-automation-unified.cjs
├── Email Outreach Sequence         → email-automation-unified.cjs
└── LinkedIn Lead Scraper           → linkedin-lead-automation.cjs
```

## Memory Structure

This project uses **modular rules** in `.claude/rules/`:

| File | Content |
|------|---------|
| `01-project-status.md` | Current state, URLs, blockers |
| `02-pricing.md` | Packs, retainers, currencies |
| `03-commands.md` | Scripts, deploy, assets |
| `04-architecture.md` | Directory structure, identity |
| `05-mcps-status.md` | MCP status |
| `06-voice-ai.md` | Widget, Grok telephony |
| `07-n8n-workflows.md` | Workflow status (9 deployed, 0 functional) |
| `code-standards.md` | CommonJS, process.env |
| `factuality.md` | Verification rules |
| `infrastructure.md` | VPS, Docker, Traefik |
| `mcps.md` | MCP configuration |

## Critical Rules

1. **Factuality** - Verify empirically before claiming
2. **Source of Truth** - `automations-registry.json` for counts
3. **No Placeholders** - Complete code or nothing
4. **Agency/Client Separation** - Never mix credentials
5. **Code Standards** - CommonJS (.cjs), process.env

## Session Protocol

| Trigger | Action |
|---------|--------|
| 30min elapsed | `/cost` check |
| >50k tokens | `/compact` |
| Topic change | `/clear` |
| Session end | Update HISTORY.md |

## Deploy

```bash
git push origin main  # GitHub Action → Hostinger
```

---

*For session history, see HISTORY.md. For details, see .claude/rules/*
