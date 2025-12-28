# 3A Automation - Claude Code Memory
## Version: 16.0 | Date: 2025-12-28 | Session: 109

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (78, v1.9.0) |
| History | `HISTORY.md` (Sessions 0-109) |

## Session 109 - AUDIT BOTTOM-UP BRUTAL

| Fait | Valeur Vérifiée |
|------|-----------------|
| Pages HTML | **39** (19 FR + 20 EN) - PAS 32 |
| n8n Workflows | 9 déployés, **0 fonctionnels** |
| Infrastructure | 3 containers RUNNING |
| Booking API | 180 slots OK |

### PROBLÈME CRITIQUE: n8n

Tous les 9 workflows sont "actifs" dans l'UI mais **100% échouent à l'exécution**.

```
ERREURS (logs réels):
├── "Cannot read properties of undefined (reading 'name')"
├── "The workflow has issues and cannot be executed"
└── Cause: Connexions JSON corrompues
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
