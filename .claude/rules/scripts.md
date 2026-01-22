---
paths:
  - "automations/**"
  - "**/core/*.cjs"
---

# Native Scripts

## Status VÉRIFIÉ (22/01/2026)

### Scripts Core
| Category | Count | Status |
|----------|-------|--------|
| Total core | 73 | `ls agency/core/*.cjs` |
| Avec --health | 22 | Testables |
| Resilient | 7 | Multi-AI fallback |

### Sensors (14 total - Session 139)
| Status | Count | Sensors |
|--------|-------|---------|
| ✅ OK | 10 | ga4, retention, product-seo, lead-scoring, lead-velocity, bigquery, google-ads-planner, **shopify**, **klaviyo**, **google-trends** |
| ⚠️ CREDS | 2 | meta-ads, tiktok-ads |
| ❌ BLOCKED | 2 | gsc (API disabled), apify (trial expired) |

### New Sensors (Session 139)
| Sensor | Description |
|--------|-------------|
| shopify-sensor | Store health, orders, inventory |
| klaviyo-sensor | Email flows, campaigns |
| google-trends (REWRITTEN) | AI-powered market analysis (Grok→OpenAI→Gemini) |

### Blockers Sensors
| Sensor | Problème | Fix |
|--------|----------|-----|
| gsc-sensor | API non activée | [Activer](https://console.developers.google.com/apis/api/searchconsole.googleapis.com) |
| meta-ads | Credentials vides | Configurer META_ACCESS_TOKEN |
| tiktok-ads | Credentials vides | Configurer TIKTOK_ACCESS_TOKEN |
| apify-trends | Trial expiré | [Payer](https://console.apify.com/billing) |

## Key Scripts
| Script | Usage | Port |
|--------|-------|------|
| blog-generator-resilient.cjs | Content + social | 3003 |
| voice-api-resilient.cjs | Text gen | 3004 |
| email-personalization-resilient.cjs | Emails | 3006 |
| churn-prediction-resilient.cjs | Analytics | - |
| uptime-monitor.cjs | Monitoring | - |

## Health Check Pattern
```bash
node automations/agency/core/SCRIPT.cjs --health
```

## Fallback Pattern (All Resilient Scripts)
```javascript
providers: ['grok', 'openai', 'gemini', 'anthropic']
// Auto-rotate on failure
```
