# Règles de Factualité

> Toute affirmation doit être vérifiable empiriquement.

## Avant Toute Affirmation
1. Scripts "production-ready" → Vérifier fonctionnement
2. "X clients" → Vérifier actifs et payants
3. "Stack complet" → Auditer chaque composant

## INTERDIT
- ❌ Claims sans test empirique
- ❌ Wishful thinking

## VÉRIFIÉ EMPIRIQUEMENT (Session 144bis - 23/01/2026 10:00 UTC)

### Métriques Core
| Métrique | Valeur | Méthode Vérification |
|----------|--------|----------------------|
| Scripts core | 81 | `ls agency/core/*.cjs` |
| Scripts --health | 22 | `grep -l "\-\-health"` |
| Automations registry | **121** | `jq '.automations \| length'` (+voice-agent-b2b, kb-services) |
| Automations catalog | **121** | ✅ **SYNCED** |
| Skills | 41 | `ls -d .agent/skills/*/` (all tagged with provider) |
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

### FIXES APPLIQUÉS (Session 142 - 23/01/2026)
| Issue | Fix | Status |
|-------|-----|--------|
| "174" sur toutes pages | 60+ fichiers HTML + JSON corrigés | ✅ FIXÉ |
| Scripts sans defer | defer ajouté à TOUS les scripts | ✅ FIXÉ |
| Testimonials absents | Section ajoutée FR+EN | ✅ FIXÉ |
| Booking success visible | CSS `.booking-success { display: none }` | ✅ FIXÉ |
| Paths JS relatifs | Absolute paths `/data/...` | ✅ FIXÉ |
| llms.txt incohérent | Corrigé 119 automations + 22 agents | ✅ FIXÉ |

### ISSUES RESTANTES (Session 142)
| Issue | Impact | Status |
|-------|--------|--------|
| CORS ipapi.co | Geo-location bloqué | ⚠️ P3 |
| CSP inline handlers | Warning console | ⚠️ P3 |
| Font preload warning | Performance minor | ⚠️ P3 |

### Infrastructure
- Site principal: ✅ 200 OK
- Dashboard: ✅ 200 OK

## Source de Vérité
`automations-registry.json` v3.0.0 (totalCount: 119)
