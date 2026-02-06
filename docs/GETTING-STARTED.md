# Getting Started - 3A Automation Developer Guide
> Quick onboarding for new developers | 06/02/2026 | Session 191ter

---

## Prerequisites

| Tool | Version | Check |
|:-----|:--------|:------|
| Node.js | 18+ | `node --version` |
| Git | 2.x | `git --version` |
| npm | 9+ | `npm --version` |

**Environment:** Copy `.env.example` to `.env` and fill in credentials. See `CLAUDE.md > BLOCKERS` for required keys.

---

## Architecture

```
JO-AAA/
├── automations/
│   ├── agency/core/           # 103 workflows (.cjs)
│   ├── agency/tests/          # 78 S8 tests
│   ├── 3a-global-mcp/        # MCP server (124 tools, 99/99 tests)
│   ├── a2a/                   # A2A protocol server
│   └── automations-registry.json  # SOURCE OF TRUTH (121 automations)
├── dashboard/                 # Next.js 14 + Shadcn UI (port 3000)
├── landing-page-hostinger/    # Static site (83 HTML pages)
├── voice-assistant/           # Voice widget frontend
├── knowledge_base/            # Knowledge bases (FR/EN/AR/ES/Darija)
├── data/                      # Runtime data (events, learning queue)
├── docs/                      # Documentation (see DOCS-INDEX.md)
├── CLAUDE.md                  # Main config (scores, state, counts)
└── .claude/rules/             # Auto-loaded rules (core, scripts, factuality)
```

---

## Quick Start

### 1. Install dependencies

```bash
cd dashboard && npm install && cd ..
```

### 2. Start Dashboard (port 3000)

```bash
cd dashboard && npm run dev
```

| Role | Email | Password | URL |
|:-----|:------|:---------|:----|
| Admin | `admin@3a-automation.com` | `Admin3A2025` | `/admin` |
| Client | `client@demo.3a-automation.com` | `DemoClient2026` | `/client` |

### 3. Start Voice Services (optional)

```bash
node automations/agency/core/voice-api-resilient.cjs       # Port 3004
node automations/agency/core/grok-voice-realtime.cjs       # Port 3007
node automations/agency/core/voice-telephony-bridge.cjs    # Port 3009 (needs TELNYX_API_KEY)
```

### 4. Run Tests

```bash
# S8 Tests (78 tests)
node --test automations/agency/tests/*.test.cjs

# MCP Tests (99 tests)
node automations/3a-global-mcp/verify-core.js

# All 177 tests combined
node --test automations/agency/tests/*.test.cjs && node automations/3a-global-mcp/verify-core.js
```

---

## Key Commands

```bash
# Health check any workflow
node automations/agency/core/SCRIPT-NAME.cjs --health

# Credential validation
node credential-validator.cjs --check

# Voice services status
node startup-orchestrator.cjs --status

# HITL (Human-in-the-Loop)
node automations/agency/core/SCRIPT.cjs --list-pending
node automations/agency/core/SCRIPT.cjs --approve=<id>
node automations/agency/core/SCRIPT.cjs --reject=<id>

# Stitch API
node automations/agency/core/stitch-api.cjs list

# Registry count
node -e "const r=require('./automations/automations-registry.json');console.log(r.automations.length)"
```

---

## Code Conventions

| Rule | Example |
|:-----|:--------|
| Format | CommonJS (`.cjs`), 2 spaces, single quotes |
| Credentials | `process.env.API_KEY` (never hardcoded) |
| Errors | `console.error('...')` |
| Success | `console.log('...')` |
| Health check | Every workflow supports `--health` flag |
| HITL | Every workflow supports `--list-pending`, `--approve`, `--reject` |

```javascript
// Standard credential check pattern
if (!process.env.API_KEY) {
  console.error('API_KEY not set');
  process.exit(1);
}
```

---

## Sources de Reference

| Document | Role |
|:---------|:-----|
| `CLAUDE.md` | Config, scores, runtime state, engineering counts |
| `docs/DOCS-INDEX.md` | Index of all 58+ docs with freshness labels |
| `docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md` | Full tech stack, layer architecture |
| `docs/AI-PROVIDER-STRATEGY.md` | AI model fallback chains |
| `docs/reference/mcps-status.md` | MCP servers (13 total: 7 global + 6 project) |
| `docs/reference/infrastructure.md` | VPS, Docker, deploy |
| `docs/reference/pricing.md` | Client pricing packs |
| `automations/automations-registry.json` | Source of truth: 121 automations |
| `data/pressure-matrix.json` | Sensor health data |

---

## Verified Counts (Session 191ter - 06/02/2026)

| Component | Count | Verification |
|:----------|:------|:-------------|
| Workflows Core | 103 | `ls automations/agency/core/*.cjs \| wc -l` |
| Automations Registry | 121 | `jq '.automations \| length' automations/automations-registry.json` |
| MCP Tools | 124 | 121 automations + 3 meta |
| Tests Total | 177/177 | 78 S8 + 99 MCP |
| --health Endpoints | 57/57 | All respond |
| Sensors | 19 (12 OK) | Individual `--health` checks |
| Agent Ops Modules | 15 | `node verify-agent-ops.cjs` |
| Dashboard APIs | 8/8 | HTTP checks on localhost:3000 |
| HTML Pages | 83 | Landing page Hostinger |
| MCP Servers | 13 | 7 global + 6 project |

---

*Guide created: 06/02/2026 - Session 191ter*
