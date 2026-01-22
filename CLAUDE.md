# 3A Automation
>
> Version: 50.0 | 22/01/2026 | Session 139

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## Métriques VÉRIFIÉES (22/01/2026)

| Élément | Valeur | Status |
| :--- | :--- | :--- |
| Automations | 119 | Registry v3.0.0 |
| Scripts core | 81 | Vérifiés |
| Scripts --health | 22 | Testables |
| Skills | 41 | Dossiers |
| MCPs | 10 | Configurés |
| Sensors | **20** | 8 OK, 8 PARTIAL, 4 BLOCKED |
| Credentials | 57 set / 36 vides | ⚠️ BLOQUEUR |

## BLOCKERS CRITIQUES

| Problème | Impact | Action |
| :--- | :--- | :--- |
| ~~Dashboard 502~~ | ~~Pas de démo possible~~ | ✅ FIXÉ (port 3001→3000) |
| GSC API disabled | Sensor cassé | Activer dans Cloud Console |
| ~~lead-velocity BUG~~ | ~~Sensor cassé~~ | ✅ FIXÉ (.filter() sur scores) |
| ~~google-trends blocked~~ | ~~Trends cassé~~ | ✅ FIXÉ (AI-powered rewrite) |
| 36 credentials vides | Features inutilisables | Configurer .env |
| Apify trial expiré | Trends cassé | Payer ou alternative |

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
