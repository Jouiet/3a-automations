# Règles Core - Chargées TOUJOURS

## Architecture
```
automations/
├── automations-registry.json  # SOURCE OF TRUTH (121 automations)
├── agency/core/               # 103 workflows .cjs (verified S191ter)
├── agency/tests/              # 78 S8 tests + verify-agent-ops.cjs
└── generic/                   # Utilitaires
```

## Compteurs Vérifiés (Session 191ter - 06/02/2026)
| Composant | Count | Vérification |
|:----------|:-----:|:-------------|
| Workflows Core | 103 | `ls agency/core/*.cjs \| wc -l` |
| Registry | 121 | `jq '.automations \| length'` |
| --health endpoints | 57 | Individual execution |
| Sensors | 19 | 12 OK, 1 degraded, 1 warning, 1 error, 4 blocked |
| Tests | 177 | 78 S8 + 99 MCP (100%) |
| Agent Ops Modules | 15 | verify-agent-ops.cjs |
| MCP Tools | 124 | 121 automations + 3 meta |
| HTML Pages | 83 | `find landing-page-hostinger -name "*.html"` |

## Standards Code
- CommonJS (.cjs), 2 espaces, single quotes
- Credentials: `process.env.*` (jamais hardcodé)
- Erreurs: `console.error('❌ ...')`
- Succès: `console.log('✅ ...')`

## Validation Credentials
```javascript
if (!process.env.API_KEY) {
  console.error('❌ API_KEY non défini');
  process.exit(1);
}
```

## Deploy
`git push origin main` → GitHub Action → Hostinger VPS 1168256
