# 3A Automation - Claude Code Memory
## Version: 22.0 | Date: 2025-12-30 | Session: 115

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Site | https://3a-automation.com |
| Dashboard | https://dashboard.3a-automation.com |
| n8n | https://n8n.srv1168256.hstgr.cloud |
| Automations | `automations/automations-registry.json` (82, v2.0.0) |
| History | `HISTORY.md` (Sessions 0-115) |
| Scripts résilients | `automations/agency/core/` (8 scripts) |

## Session 115 - SCRIPTS NATIFS > n8n (VÉRIFIÉ)

### ANALYSE COMPARATIVE FACTUELLE (30/12/2025)

| Critère | n8n Workflows | Scripts Natifs | Verdict |
|---------|---------------|----------------|---------|
| AI Providers | 1 (single point of failure) | 3+ avec fallback | **Script SUPÉRIEUR** |
| Blocage $env | 100% bloqués | 0% (process.env) | **Script SUPÉRIEUR** |
| Social platforms | 2 (FB, LinkedIn) | 3 (+ X/Twitter) | **Script SUPÉRIEUR** |
| Fallback chains | 0 | 3+ par script | **Script SUPÉRIEUR** |
| CLI/Testing | 0 modes | 15+ flags | **Script SUPÉRIEUR** |
| Health checks | 0 | 3 intégrés | **Script SUPÉRIEUR** |
| Lignes de code | ~1,076 | ~2,735 | n8n moins |
| Visual debugging | UI n8n | Console only | n8n mieux |

**VERDICT: Scripts natifs SUPÉRIEURS sur 6/8 critères (robustesse, fonctionnalités, testabilité)**

### FAITS VÉRIFIÉS

| Métrique | Valeur | Changement |
|----------|--------|------------|
| n8n Workflows | **1 restant** | -4 (remplacés par scripts supérieurs) |
| Scripts résilients | **8 fichiers** | +2 nouveaux |
| Social Distribution | **3 plateformes** | +1 (X/Twitter OAuth 1.0a) |
| WhatsApp | Script natif avec fallback | Awaiting credentials |

### SCRIPTS RÉSILIENTS v2 (Session 115)

```
automations/agency/core/
├── blog-generator-resilient.cjs      # v2.1 + 3 AI + 3 Social
├── grok-voice-realtime.cjs           # v2.0 + Gemini TTS fallback
├── whatsapp-booking-notifications.cjs # NEW - remplace 2 n8n
├── voice-api-resilient.cjs           # Grok→Gemini→Claude
├── product-photos-resilient.cjs      # Gemini→fal.ai→Replicate
├── email-personalization-resilient.cjs
├── uptime-monitor.cjs
└── voice-widget-generator.cjs

AVANTAGES FACTUELS vs n8n:
- 0 dépendance $env (n8n Community bloqué)
- Fallback chains automatiques
- 3 AI providers au lieu de 1
- 3 plateformes sociales au lieu de 2
- CLI testing intégré
- Health checks standardisés
```

### n8n ÉTAT FINAL

| Avant Session 115 | Après Session 115 |
|-------------------|-------------------|
| 5 workflows | **1 workflow** |
| 2 fonctionnels | 0 fonctionnel |
| 3 bloqués | 1 bloqué (Twilio) |

```
SUPPRIMÉS (scripts natifs SUPÉRIEURS):
- Blog Article Generator → blog-generator-resilient.cjs (+2 AI providers)
- Enhance Product Photos → product-photos-resilient.cjs (+fallback chain)
- WhatsApp Confirmation → whatsapp-booking-notifications.cjs (+CLI)
- WhatsApp Reminders → whatsapp-booking-notifications.cjs (+dedup)

RESTANT:
- Grok Voice Telephony (⛔ Twilio - credentials externes)
```

### SOCIAL DISTRIBUTION (3 plateformes)

| Plateforme | API | Status |
|------------|-----|--------|
| Facebook | Graph API v22.0 | ⏳ Awaiting credentials |
| LinkedIn | Posts API 202501 | ⏳ Awaiting credentials |
| X/Twitter | API v2 OAuth 1.0a | ⏳ Awaiting credentials |

### VARIABLES .env AJOUTÉES (Session 115)

```bash
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# X/Twitter OAuth 1.0a
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
```

## Memory Structure

Modular rules in `.claude/rules/`:

| File | Content |
|------|---------|
| `01-project-status.md` | État actuel, blockers |
| `02-pricing.md` | MAD/EUR/USD |
| `07-n8n-workflows.md` | 1 workflow restant |
| `code-standards.md` | CommonJS (.cjs) |
| `factuality.md` | Vérification empirique |

## Critical Rules

1. **Factuality** - Vérifier AVANT d'affirmer
2. **Source of Truth** - `automations-registry.json`
3. **No Placeholders** - Code complet uniquement
4. **Scripts > n8n** - Préférer scripts natifs résilients
5. **Phase 1** - MENA + Europe (6 mois)

## Deploy

```bash
git push origin main  # GitHub Action → Hostinger
```

---

*For session history, see HISTORY.md. For details, see .claude/rules/*
