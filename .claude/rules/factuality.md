# Règles de Factualité

> Toute affirmation doit être vérifiable empiriquement.

## Avant Toute Affirmation
1. Scripts "production-ready" → Vérifier fonctionnement
2. "X clients" → Vérifier actifs et payants
3. "Stack complet" → Auditer chaque composant

## INTERDIT
- ❌ Claims sans test empirique
- ❌ Wishful thinking

## VÉRIFIÉ EMPIRIQUEMENT (Session 141 - 22/01/2026 21:15 UTC)

### Métriques Core
| Métrique | Valeur | Méthode Vérification |
|----------|--------|----------------------|
| Scripts core | 81 | `ls agency/core/*.cjs` |
| Scripts --health | 22 | `grep -l "\-\-health"` |
| Automations registry | 119 | `jq '.automations \| length'` |
| **Automations catalog** | **77** | ⚠️ **DÉSYNC -42** |
| Skills | 41 | `ls -d .agent/skills/*/` |
| Sensors | 20 | `ls *-sensor*.cjs` |
| Credentials SET | 57 | `grep -E "^[A-Z_]+=.+"` |
| Credentials EMPTY | 36 | `grep -E "^[A-Z_]+=$"` |

### Status Sensors (EXÉCUTION RÉELLE 22/01/2026 21:15)
| Sensor | Status | Pressure | Problème |
|--------|--------|----------|----------|
| retention-sensor | ✅ | 0 | OK |
| product-seo-sensor | ✅ | 0 | OK |
| shopify-sensor | ✅ | 75 | 0 products |
| google-trends-sensor | ✅ | 5 | AI-powered OK |
| cost-tracking-sensor | ✅ | 30 | Budget OK |
| lead-velocity-sensor | ✅ | 75 | 2 leads |
| klaviyo-sensor | ⚠️ | 65 | API Error 400 |
| email-health-sensor | ⚠️ | 60 | API Error 400 |
| ga4-sensor | ⚠️ | 50 | ROAS 0.00 |
| google-ads-planner-sensor | ⚠️ | 50 | PASSIVE |
| bigquery-trends-sensor | ⚠️ | - | 0 terms |
| supplier-health-sensor | ⚠️ | 80 | No creds |
| voice-quality-sensor | ⚠️ | 90 | Endpoints DOWN |
| content-performance-sensor | ⚠️ | 90 | WordPress SSL |
| lead-scoring-sensor | ⚠️ | 95 | Critique |
| whatsapp-status-sensor | ❌ | 90 | No token |
| meta-ads-sensor | ❌ | 95 | No credentials |
| tiktok-ads-sensor | ❌ | 95 | No credentials |
| gsc-sensor | ❌ | - | API disabled |
| apify-trends-sensor | ❌ | - | Trial expired |

**Synthèse: 6 OK (30%), 10 PARTIAL (50%), 4 BLOCKED (20%)**

### FIXES APPLIQUÉS (Session 141 - 22/01/2026)
| Issue | Fix | Status |
|-------|-----|--------|
| "174" sur homepage | Remplacé par "119" (FR+EN) | ✅ FIXÉ |
| "18 agents" sur homepage | Remplacé par "22" (FR+EN) | ✅ FIXÉ |
| llms.txt dit 174 | Corrigé vers 119 + 22 agents | ✅ FIXÉ |
| 6 scripts sans defer | defer ajouté à tous | ✅ FIXÉ |
| Testimonials: 0 | Section absente | ⚠️ P3 |

### Infrastructure
- Site principal: ✅ 200 OK
- Dashboard: ✅ 200 OK

## Source de Vérité
`automations-registry.json` v3.0.0 (totalCount: 119)
