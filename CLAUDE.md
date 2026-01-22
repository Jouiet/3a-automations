# 3A Automation
>
> Version: 53.0 | 22/01/2026 | Session 140 (UI/UX Forensic + Human In The Loop)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## Métriques VÉRIFIÉES (22/01/2026)

| Élément | Valeur | Status |
| :--- | :--- | :--- |
| Automations Registry | 119 | Registry v3.0.0 ✅ |
| Automations Catalog | **77** | ⚠️ DÉSYNC (devrait être 119) |
| HTML Pages | 64 | FR:32 + EN:32 |
| Scripts --health | 22 | Testables |
| Sensors | 20 | 8 OK, 8 PARTIAL, 4 BLOCKED |

## SESSION 140 FIXES (22/01/2026)

| Fix | Impact | Status |
| :--- | :--- | :--- |
| Jargon L5/MCP/Zapier | Copie accessible | ✅ FIXÉ |
| Data 18→22 agents | Cohérence données | ✅ FIXÉ |
| Human In The Loop | Rassure décideurs | ✅ FIXÉ |
| "(100% Autonome)" → "(Vous Gardez le Contrôle)" | Hero FR/EN | ✅ FIXÉ |

## ISSUES NON TRAITÉES (Session 140)

| Issue | Impact | Priorité |
| :--- | :--- | :--- |
| automations-catalog.json 77 vs 119 | Data sync | **P1** |
| 5 scripts render-blocking | CWV LCP/FID | P2 |
| Pas de FAQ page | SEO/UX | P2 |
| Pas de testimonials | Social proof | P2 |
| Footer logo bug | UI/UX | P2 |

## BLOCKERS RESTANTS

| Problème | Impact | Action |
| :--- | :--- | :--- |
| GSC API disabled | Sensor SEO cassé | Activer dans Cloud Console |
| 36 credentials vides | Features inutilisables | Configurer .env |
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
