# 3A Automation
>
> Version: 55.0 | 22/01/2026 | Session 141 (Audit Forensique Empirique)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## Métriques VÉRIFIÉES EMPIRIQUEMENT (22/01/2026 21:15 UTC)

| Élément | Valeur | Méthode | Status |
| :--- | :--- | :--- | :--- |
| Scripts Core | 81 | `ls agency/core/*.cjs` | ✅ |
| Automations Registry | 119 | `jq '.automations \| length'` | ✅ |
| Automations Catalog | **77** | `jq '.automations \| length'` | ❌ **DÉSYNC -42** |
| HTML Pages | 66 | `find -name "*.html"` | ✅ |
| Scripts --health | 22 | `grep -l "\-\-health"` | ✅ |
| Sensors | 20 | `ls *-sensor*.cjs` | 6 OK, 10 PARTIAL, 4 BLOCKED |
| Credentials SET | 57 | `grep -E "^[A-Z_]+=.+"` | ✅ |
| Credentials EMPTY | 36 | `grep -E "^[A-Z_]+=$"` | ⚠️ |

## SESSION 141 - FAITS VÉRIFIÉS (22/01/2026)

| Issue | Claim Session 140bis | Réalité Empirique | Action |
| :--- | :--- | :--- | :--- |
| Catalog sync | "✅ FIXÉ 119" | ❌ **Toujours 77** | Sync requis |
| Scripts defer | "✅ FIXÉ" | ❌ **6 sans defer** | Ajouter defer |
| FAQ pages | "✅ FIXÉ" | ✅ Existent | OK |
| Testimonials | "✅ FIXÉ" | ❌ **0 matches** | Ajouter section |
| llms.txt | Non mentionné | ❌ **Dit 174 (=119)** | Corriger |

## SENSORS - EXÉCUTION RÉELLE (20 total)

| Status | Count | Sensors (Pressure) |
| :--- | :--- | :--- |
| ✅ OK | 6 | retention(0), product-seo(0), shopify(75), google-trends(5), cost-tracking(30), lead-velocity(75) |
| ⚠️ PARTIAL | 10 | klaviyo(65), email-health(60), ga4(50), google-ads-planner(50), bigquery(-), supplier-health(80), voice-quality(90), content-perf(90), lead-scoring(95) |
| ❌ BLOCKED | 4 | gsc(API disabled), meta-ads(95), tiktok-ads(95), apify(trial expired) |

## BLOCKERS P0 (Critiques)

| Problème | Impact | Action |
| :--- | :--- | :--- |
| **Catalog 77 vs 119** | 42 automations non affichées | Sync catalog avec registry |
| **llms.txt 174 vs 119** | AEO incohérent | Corriger à 119 |
| **6 scripts sans defer** | CWV dégradé | Ajouter defer |
| GSC API disabled | Sensor SEO cassé | Activer Cloud Console |
| 36 credentials vides | 60% features OFF | Configurer .env |
| Apify trial expiré | Trends cassé | Payer ($49/mois) |

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
