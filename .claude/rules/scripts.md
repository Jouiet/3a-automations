---
paths:
  - "automations/**"
  - "**/core/*.cjs"
---

# Native Scripts

## Status (22 with --health)
| Category | Count |
|----------|-------|
| OPERATIONAL | 16 + 3 dropshipping |
| TEST MODE | 2 (hubspot, omnisend) |
| BLOCKED | 3 (whatsapp, telephony, sms) |

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
