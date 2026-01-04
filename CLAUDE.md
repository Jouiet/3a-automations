# 3A Automation
> Version: 43.1 | 04/01/2026 | Optimized Memory

## Identité
- **Type**: AI Automation Agency (E-commerce B2C + PME B2B)
- **Sites**: 3a-automation.com | dashboard.3a-automation.com

## Métriques
| Élément | Valeur |
|---------|--------|
| Automations | 99 (Registry v2.7.0) |
| Scripts --health | 22 |
| MCPs | 11/11 |
| SEO/AEO | 88%/100% |

## Règles Strictes
1. **Factuality**: Vérifier AVANT d'affirmer
2. **Source**: `automations-registry.json`
3. **Code**: Complet uniquement (0 TODO/placeholder)
4. **Format**: CommonJS (.cjs), process.env

## AI Fallback
Grok 4.1 → GPT-5.2 → Gemini 3 → Claude Sonnet 4 → Local

## Commandes
```bash
node scripts/forensic-audit-complete.cjs  # Audit
git push origin main                       # Deploy
```

## Références (charger via @)
- Détails projet: @docs/session-history/
- Voice AI: @.claude/rules/voice-ai.md
- Scripts: @.claude/rules/scripts.md
- Infra: @docs/reference/infrastructure.md
