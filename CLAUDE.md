# 3A Automation - Claude Code Memory
## Version: 17.0 | Date: 2025-12-29 | Session: 113

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (79, v2.0.0) |
| History | `HISTORY.md` (Sessions 0-113) |

## Session 113 - B2B LEAD WORKFLOWS ALIGNÉS

| Fait | Valeur Vérifiée |
|------|-----------------|
| Lead Workflows | **5 alignés, 100% branding** |
| Scripts natifs | **70 fichiers** (.cjs/.js) |
| n8n Workflows | 9 déployés, **6/9 fonctionnels (67%)** |
| Branding Tests | **119/119 (100%)** |

### B2B LEAD WORKFLOWS (5 Alignés)

```
MODÈLE RÉFÉRENCE: linkedin-to-klaviyo-pipeline.cjs

SCRIPTS ALIGNÉS (Session 112-113):
├── b2b-email-templates.cjs          → Module partagé (6 segments)
├── linkedin-lead-automation.cjs     → Segmentation intégrée ✅
├── email-automation-unified.cjs     → Import templates ✅
├── linkedin-to-klaviyo-pipeline.cjs → Référence modèle ✅
└── google-maps-to-klaviyo-pipeline.cjs → CRÉÉ Session 113 ✅

SEGMENTS B2B (6):
decision_maker | marketing | sales | tech | hr | other

BRANDING VALIDÉ (119/119):
├── Signature "L'équipe 3A Automation"
├── Tagline "Automation, Analytics, AI"
└── URL https://3a-automation.com
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
