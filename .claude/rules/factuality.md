# Règles de Factualité

> Toute affirmation doit être vérifiable empiriquement.

## Avant Toute Affirmation
1. Scripts "production-ready" → Vérifier fonctionnement
2. "X clients" → Vérifier actifs et payants
3. "Stack complet" → Auditer chaque composant

## INTERDIT
- ❌ Claims sans test empirique
- ❌ Wishful thinking

## VÉRIFIÉ EMPIRIQUEMENT (22/01/2026 - Session 139)

### Métriques Core
| Métrique | Valeur | Méthode Vérification |
|----------|--------|----------------------|
| Scripts core | 75 | `ls agency/core/*.cjs` |
| Scripts --health | 22 | `grep -l "\-\-health"` |
| Automations registry | 119 | `jq '.automations \| length'` |
| Skills | 41 | `ls -d .agent/skills/*/` |
| MCPs configurés | 10 | `jq '.mcpServers \| keys'` |
| Sensors | 14 | `ls *-sensor*.cjs` (10 OK, 4 blocked) |

### Status Sensors (TESTÉ 22/01/2026)
| Sensor | Status | Problème |
|--------|--------|----------|
| ga4-sensor | ⚠️ | ROAS 0.00 (store inactif) |
| gsc-sensor | ❌ | API non activée |
| meta-ads-sensor | ❌ | Credentials vides |
| tiktok-ads-sensor | ❌ | Credentials vides |
| retention-sensor | ✅ | Fonctionne |
| product-seo-sensor | ✅ | Fonctionne |
| lead-scoring-sensor | ⚠️ | Pressure 95 |
| lead-velocity-sensor | ✅ | **FIXÉ** (handle {scores:[]} format) |
| apify-trends-sensor | ❌ | Trial expiré |
| google-trends-sensor | ❌ | Blocked |
| bigquery-trends-sensor | ⚠️ | 0 results |
| google-ads-planner-sensor | ⚠️ | PASSIVE mode |

### Credentials .env
- SET: 57 credentials
- EMPTY: 36 credentials (Meta, TikTok, Google Ads, WhatsApp, LinkedIn, etc.)

### Infrastructure
- Site principal: ✅ 200 OK
- Dashboard: ✅ 200 OK (**FIXÉ** - port 3001→3000)

## Source de Vérité
`automations-registry.json` v3.0.0 (totalCount: 119)
