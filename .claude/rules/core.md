# Règles Core - Chargées TOUJOURS

## Architecture
```
automations/
├── automations-registry.json  # SOURCE OF TRUTH
├── agency/core/               # 35 scripts .cjs
└── generic/                   # Utilitaires
```

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
