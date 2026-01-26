---
paths:
  - "automations/**"
  - "**/core/*.cjs"
---

# Native Scripts

## Status VÉRIFIÉ (26/01/2026 - Session 162)

### Scripts Core
| Category | Count | Status |
|----------|-------|--------|
| Total core | **84** | `ls agency/core/*.cjs` (+stitch-api.cjs S162) |
| Avec --health | **23** | Testables (+stitch-api.cjs) |
| Resilient | 7 | Multi-AI fallback |
| Sensors | 20 | Data fetchers → GPM |

### Sensors (20 total - Session 139)
| Status | Count | Sensors |
|--------|-------|---------|
| ✅ OK | 8 | retention, product-seo, lead-velocity, google-trends (AI), shopify, klaviyo, email-health, cost-tracking |
| ⚠️ PARTIAL | 8 | ga4, lead-scoring, bigquery, google-ads-planner, content-performance, supplier-health, whatsapp-status, voice-quality |
| ❌ BLOCKED | 4 | gsc (API disabled), meta-ads (no token), tiktok-ads (no token), apify (trial expired) |

### New Sensors (Session 139) - Per DOE v2 Spec
| Sensor | Description | Priority |
|--------|-------------|----------|
| shopify-sensor | Store health, orders, inventory | HAUTE |
| klaviyo-sensor | Email flows, campaigns | HAUTE |
| google-trends (REWRITTEN) | AI-powered market analysis (Grok→OpenAI→Gemini) | HAUTE |
| email-health-sensor | Bounce/spam/open rates | CRITIQUE |
| content-performance-sensor | WordPress blog metrics | HAUTE |
| supplier-health-sensor | CJ/BigBuy API health | MOYENNE |
| whatsapp-status-sensor | Template approval, quality | MOYENNE |
| voice-quality-sensor | Voice API latency, providers | HAUTE |
| cost-tracking-sensor | API costs, burn rate | MOYENNE |

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
| **stitch-api.cjs** | **UI Generation (MCP)** | - |

## Health Check Pattern
```bash
node automations/agency/core/SCRIPT.cjs --health
```

## Fallback Pattern (All Resilient Scripts)
```javascript
providers: ['grok', 'openai', 'gemini', 'anthropic']
// Auto-rotate on failure
```
