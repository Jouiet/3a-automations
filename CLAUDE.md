# 3A Automation
>
> Version: 67.0 | 23/01/2026 | Session 145 (CSS Fix + Deployment Success)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## SESSION 145 - DEPLOYMENT FIX (23/01/2026)

### CSS Version Sync Fix
| Issue | Cause | Fix |
| :--- | :--- | :--- |
| CI Failing | 37 files with v=37.0 not committed | Committed all CSS version bumps |
| Deployment blocked | Design validation failed | Fixed, deployment successful |

### Verified LIVE on 3a-automation.com
- ✅ Hybrid Architecture section deployed (FR+EN)
- ✅ 3 glassmorphism cards visible
- ✅ "AI proposes, code disposes" tagline
- ✅ Salesforce 116-day pivot reference
- ✅ "0 uncontrolled decisions" metric

### Commits Session 145
```
0cac3a1 fix(css): Sync CSS version to v=38.0 across all files
```

---

## SESSION 144 - CONTENU & ÉTAGÈRE TECHNOLOGIQUE (23/01/2026)

### Content Strategy (Leçons Salesforce)
Analyse de 4 documents sur fiabilité IA → Contenu marketing créé:

| Type | FR | EN | Status |
| :--- | :--- | :--- | :--- |
| Blog Article | `automatisation-fiable-lecons-salesforce-2026.html` | `reliable-automation-salesforce-lessons-2026.html` | ✅ |
| Academy Course | `academy/courses/architecture-hybride.html` | `en/academy/courses/hybrid-architecture.html` | ✅ |

**Concepts documentés:** Déterministe vs Probabiliste, Piège 80/20, Architecture Hybride (3 couches)

### Étagère Technologique - Transferts Session 144

| Direction | Technologies | Status |
| :--- | :--- | :--- |
| 3A → MyDealz | omnisend-sensor, ga4-sensor, retention-sensor | ✅ |
| 3A → Alpha | Multi-AI Fallback, Design System, GA4 Sensor | ✅ |
| Alpha → 3A | Theme Check CI, Flywheel pattern (concepts) | ⏳ |

### MyDealz Sensors (VÉRIFIÉ)

| Sensor | Fichier | Status |
| :--- | :--- | :--- |
| Shopify | `sensors/shopify-sensor.cjs` | ✅ |
| Omnisend | `sensors/omnisend-sensor.cjs` | ✅ (pas Klaviyo!) |
| GA4 | `sensors/ga4-sensor.cjs` | ✅ |
| Retention | `sensors/retention-sensor.cjs` | ✅ |
| Sync | `sensors/sync-to-3a.cjs` | ✅ |

## Métriques VÉRIFIÉES (23/01/2026 - Session 144)

| Élément | Valeur | Status |
| :--- | :--- | :--- |
| Scripts Core | 81 | ✅ |
| Automations Registry | **121** | ✅ SYNCED (+2) |
| Automations Catalog | **121** | ✅ SYNCED |
| HTML Pages | **70** | ✅ (+4 blog/academy) |
| Blog Articles FR | 5 | ✅ |
| Academy Courses | 8 | ✅ (1 FR + 7 EN) |
| Sitemap URLs | **68** | ✅ FIXED (+2 academy)
| Scripts --health | 22 | ✅ |
| Sensors 3A | 20 | 6 OK, 10 PARTIAL, 4 BLOCKED |
| Sensors MyDealz | 5 | ✅ Transferred |
| Stylelint Issues | 0 | ✅ |
| CSS Version | **v=38.0** | ✅ Auto-bumped |
| Design Validation | PASS | ✅ All checks |
| Homepage Hybrid Section | FR+EN | ✅ Added |

## SESSION 143 - AUDIT DESIGN UI/UX (23/01/2026)

| Vérification | Résultat | Status |
| :--- | :--- | :--- |
| validate-design-system.cjs | 0 errors, 0 warnings | ✅ |
| design-auto-fix.cjs --check | ALL CHECKS PASSED | ✅ |
| CSS version | v=37.0 (66 fichiers) | ✅ |
| Design Score | 85/100 EXCELLENT | ✅ |
| Glassmorphism | 28 instances | ✅ |
| CSS Variables | 1126 uses | ✅ |
| font-display: swap | Via Google Fonts | ✅ |
| Pre-commit hook | Loop fixed | ✅ |

**Audit complet**: `docs/DESIGN-AUDIT-SESSION-143.md`

### Alpha Medical - Twin Sovereignty Architecture

| Catégorie | Fichier | Status |
| :--- | :--- | :--- |
| Theme Check | `.theme-check.yml` | ✅ CRÉÉ |
| CI/CD | `theme-check.yml`, `sensor-monitor.yml` | ✅ CRÉÉ |
| MCP | `.mcp.json` | ✅ CRÉÉ |
| Sensors | `shopify-sensor.cjs`, `klaviyo-sensor.cjs`, `retention-sensor.cjs` | ✅ CRÉÉ |
| GPM Local | `data/pressure-matrix.json` | ✅ CRÉÉ |
| Pre-commit | `.husky/pre-commit` | ✅ CRÉÉ |
| Sync-to-3A | `sensors/sync-to-3a.cjs` | ✅ CRÉÉ |
| 3A Proxy | `automations/subsidiaries/alpha-medical-proxy.cjs` | ✅ CRÉÉ |

**Architecture**: Alpha Medical GPM → 3A Central GPM (`subsidiaries.alpha-medical`)

**Endpoints 3A**:
- `/api/subsidiaries` - Liste toutes les subsidiaires
- `/api/subsidiaries/alpha-medical/products` - UCP Product Discovery
- `/api/subsidiaries/alpha-medical/health` - Health check

**API Issues**: Shopify 403 (token expiré), Klaviyo 401 (clé invalide)

**Commits**: `89c21c8`, `f61bef4`, `9d00266`

**Analyse**: `docs/ANALYSE-TRANSFERT-DESIGN-AUTOMATION-SHOPIFY.md`

## SESSION 142 - DESIGN SYSTEM (23/01/2026)

| Fix | Details | Status |
| :--- | :--- | :--- |
| Stylelint issues | 55→0 (color: white → var(--text-light)) | ✅ FIXÉ |
| Visual regression | 9 baseline screenshots created | ✅ DONE |
| Pre-commit hook | Blocks invalid commits | ✅ ACTIVE |
| CI/CD validation | deploy-website.yml v3.0 | ✅ CONFIGURED |
| DESIGN-SYSTEM.md | Source of truth unified | ✅ CREATED |
| Booking page CSS | .booking-success display:none | ✅ FIXÉ |

## SESSION 141 - FIXES (22/01/2026)

| Fix | Details | Status |
| :--- | :--- | :--- |
| Homepage "174"→"119" | FR + EN + meta + JSON-LD | ✅ FIXÉ |
| Homepage "18 agents"→"22" | FR + EN + telemetry | ✅ FIXÉ |
| llms.txt | 174→119, 18→22 | ✅ FIXÉ |
| Scripts defer | 6 scripts | ✅ FIXÉ |

## PROTOCOLES - VÉRIFIÉ SESSION 143

| Protocole | Status | Fichier Principal | Endpoints |
| :--- | :--- | :--- | :--- |
| **A2A** | ✅ PRODUCTION | `automations/a2a/server.js` | `/a2a/v1/rpc`, `/.well-known/agent.json` |
| **UCP** | ✅ PRODUCTION | `pages/api/ucp/products.js` | `/.well-known/ucp`, `/api/ucp/products` |
| **ACP** | ✅ FONCTIONNEL | `automations/acp/server.js` | `/acp/v1/agent/submit`, `/acp/v1/stream` |
| **GPM** | ✅ PRODUCTION | `landing-page-hostinger/data/pressure-matrix.json` | 20 sensors, 8 sectors |
| **AG-UI** | ✅ PRODUCTION | `automations/a2a/server.js:416-518` | `/ag-ui`, `/ag-ui/queue` |

**Agents enregistrés**: 43 (10 core + 41 dynamic skills)

## SENSORS - EXÉCUTION RÉELLE (20 total)

| Status | Count | Sensors (Pressure) |
| :--- | :--- | :--- |
| ✅ OK | 6 | retention(0), product-seo(0), shopify(75), google-trends(5), cost-tracking(30), lead-velocity(75) |
| ⚠️ PARTIAL | 10 | klaviyo(65), email-health(60), ga4(50), google-ads-planner(50), bigquery(-), supplier-health(80), voice-quality(90), content-perf(90), lead-scoring(95) |
| ❌ BLOCKED | 4 | gsc(API disabled), meta-ads(95), tiktok-ads(95), apify(trial expired) |

## BLOCKERS RESTANTS (P1-P2) - USER ACTION REQUIRED

| Problème | Impact | Action | Lien |
| :--- | :--- | :--- | :--- |
| GSC API disabled | Sensor SEO cassé | Activer API | [Cloud Console](https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=359870692708) |
| META_ACCESS_TOKEN vide | Meta Ads cassé | Configurer token | Facebook Business |
| TIKTOK_ACCESS_TOKEN vide | TikTok Ads cassé | Configurer token | TikTok Business |
| Apify trial expiré | Trends cassé | Payer $49/mois | [Apify Billing](https://console.apify.com/billing) |
| 36 credentials vides | 60% features OFF | Configurer .env | - |

## Règles Strictes

1. **Factuality**: 100% (Probes empiriques vs Mocks).
2. **Architecture**: Forensic Engine isolé (`/forensic-engine/`).
3. **Zero Debt**: 0 TODO/placeholder dans le core forensic.
4. **Source**: `SFAP_PROTOCOL_v3_LEVEL5.md.resolved` est la vérité.
5. **Autonomy**: L5 (Sovereign DOE) gère l'orchestration finale.

## AI Fallback (Faldown Protocol)

1. **Protocol**: Secure fallback chain for FRONTIER LLM calls.
2. **Models**:
   - Grok: `grok-4-1-fast-reasoning`
   - OpenAI: `gpt-5.2`
   - Gemini: `gemini-3-flash-preview`
   - Claude: `claude-sonnet-4-20250514` / `claude-opus-4-5-20251101`
3. **Trigger**: Latency > 15s OR Status != 200.

## Commandes

```bash
node scripts/forensic-audit-complete.cjs  # Audit
git push origin main                       # Deploy auto
```

## Références (charger via @)

- Détails projet: @docs/session-history/
- External Workflows: @docs/external_workflows.md
- Voice AI: @.claude/rules/voice-ai.md
- Scripts: @.claude/rules/scripts.md
- Infra: @docs/reference/infrastructure.md
