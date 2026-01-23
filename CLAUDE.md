# 3A Automation
>
> Version: 58.0 | 23/01/2026 | Session 143 (Validation + Documentation)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## Métriques VÉRIFIÉES (23/01/2026 - Session 143)

| Élément | Valeur | Status |
| :--- | :--- | :--- |
| Scripts Core | 81 | ✅ |
| Automations Registry | 119 | ✅ |
| Automations Catalog | 119 | ✅ SYNCED |
| HTML Pages | 66 | ✅ |
| Scripts --health | 22 | ✅ |
| Sensors | 20 | 6 OK, 10 PARTIAL, 4 BLOCKED |
| Stylelint Issues | 0 | ✅ |
| CSS Version | v=35.0 | ✅ Cohérent (66 fichiers) |
| Design Validation | PASS | ✅ All checks |
| Testimonials | 26 refs | ✅ |

## SESSION 143 - VALIDATION (23/01/2026)

| Vérification | Résultat | Status |
| :--- | :--- | :--- |
| validate-design-system.cjs | PASS (44 warnings H1) | ✅ |
| design-auto-fix.cjs --check | ALL CHECKS PASSED | ✅ |
| CSS version consistency | v=35.0 (66 fichiers) | ✅ |
| Category icons CSS | 13/13 classes | ✅ |
| SVG colors | currentColor | ✅ |

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
