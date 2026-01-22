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

### Sensors (12 total)
| Status | Count | Sensors |
|--------|-------|---------|
| ✅ OK | 3 | retention, product-seo, lead-velocity |
| ⚠️ PARTIEL | 4 | ga4, lead-scoring, bigquery, google-ads-planner |
| ❌ BROKEN | 5 | gsc, meta-ads, tiktok, apify, google-trends |

### Blockers Sensors
| Sensor | Problème | Fix |
|--------|----------|-----|
| gsc-sensor | API non activée | Activer dans Cloud Console |
| ~~lead-velocity~~ | ~~BUG: leads.filter~~ | ✅ FIXÉ |
| meta-ads | Credentials vides | Configurer .env |
| tiktok-ads | Credentials vides | Configurer .env |
| apify-trends | Trial expiré | Payer |
| google-trends | Detection blocked | Stealth ou API |

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
