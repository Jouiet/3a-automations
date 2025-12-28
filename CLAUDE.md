# 3A Automation - Claude Code Memory
## Version: 15.3 | Date: 2025-12-28 | Session: 105

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (78, v1.9.0) |
| History | `HISTORY.md` (Sessions 0-105) |

## Session 105 Fixes

| Fix | Details |
|-----|---------|
| Email Outreach Workflow | responseMode: lastNode→responseNode |
| n8n Deploy Script | PATCH→PUT method |
| Workflows Cleanup | AI Avatar/Video supprimés (webapp externe) |
| Blocker Identifié | n8n Google Sheets OAuth2 non configuré |

## Memory Structure

This project uses **modular rules** in `.claude/rules/`:

| File | Content |
|------|---------|
| `01-project-status.md` | Current state, URLs, blockers |
| `02-pricing.md` | Packs, retainers, currencies |
| `03-commands.md` | Scripts, deploy, assets |
| `04-architecture.md` | Directory structure, identity |
| `05-mcps-status.md` | MCP status (10/17 working) |
| `06-voice-ai.md` | Widget, Grok telephony |
| `07-n8n-workflows.md` | 10 active workflows |
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
