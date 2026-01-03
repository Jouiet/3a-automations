# Règles de Factualité - JO-AAA

## Principe Fondamental

> Toute affirmation doit être vérifiable empiriquement.
> Pas de wishful thinking. Pas de claims non prouvés.

## Avant Toute Affirmation

1. **Scripts "production-ready"** → Vérifier qu'ils fonctionnent réellement
2. **MCPs "configurés"** → Vérifier les credentials et tester
3. **"X clients"** → Vérifier qu'ils sont actifs et payants
4. **"Revenue €X"** → Vérifier les paiements reçus
5. **"Stack complet"** → Auditer chaque composant

## Documents de Référence

Avant de faire des claims, consulter:
- `BUSINESS-MODEL-FACTUEL-2025.md` - Faits vérifiés sur notre modèle
- `FORENSIC-AUDIT-TRUTH-2025-12-16.md` - Audit réel de notre stack
- `AAA-ACTION-PLAN-MVP-2025.md` - Plan exécutable avec métriques

## Ce Qui Est INTERDIT

1. ❌ "Consultant solo" → Nous sommes AAA (AI Automation Agency)
2. ❌ "207 scripts réutilisables" → 88 dans le registry (automations-registry.json)
3. ❌ "Production-ready" → Sans test empirique préalable

## Ce Qui Est AUTORISÉ (Vérifié Session 127 - 03/01/2026)

1. ✅ "MCPs 11/11 fonctionnels (100%)"
2. ✅ "10 scripts résilients multi-provider"
3. ✅ "88 automations dans le registry"
4. ✅ "Agence d'Automatisation AI (AAA) spécialisée Shopify/Klaviyo/Hostinger"

## Workflow de Vérification

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

## Métriques Actuelles (Vérifiées 03/01/2026 - Session 127)

| Métrique | Valeur | Source |
|----------|--------|--------|
| Scripts natifs résilients | 10 | automations/agency/core/ |
| Automations registry | 88 | automations-registry.json (v2.3.0) |
| MCPs fonctionnels | 11/11 (100%) | 05-mcps-status.md |
| Docker containers | 6 RUNNING | Hostinger VPS 1168256 |
| Sécurité backend | 92% | docker-compose env vars |
| APIs opérationnelles | Shopify ✅, Klaviyo ✅, Apify ✅, Hostinger ✅ | Test API |

**Source de vérité:** `.claude/rules/01-project-status.md`

---

**Rappel:** La vérité brutale est préférable à une fiction confortable.
