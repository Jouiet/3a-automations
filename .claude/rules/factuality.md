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

1. ❌ "Notre stack d'agence" → Nous sommes consultant solo
2. ❌ "207 scripts réutilisables" → ~25 génériques, reste client-spécifique
3. ❌ "MCPs 100% fonctionnels" → 3/6 fonctionnels actuellement
4. ❌ "Production-ready" → Sans test empirique préalable

## Ce Qui Est AUTORISÉ

1. ✅ "Expertise démontrée sur 3 projets clients"
2. ✅ "~25 scripts génériques testés"
3. ✅ "Consultant automation Shopify/Klaviyo"
4. ✅ "3 MCPs fonctionnels (Klaviyo, Shopify, Hostinger)"

## Workflow de Vérification

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

## Métriques Actuelles (Vérifiées 29/12/2025 - Session 115)

| Métrique | Valeur | Source |
|----------|--------|--------|
| Scripts natifs | ~70 (.cjs/.js) | Comptage fichiers |
| Automations registry | 82 | automations-registry.json |
| security-utils.cjs | 31 exports | Test empirique |
| MCPs fonctionnels | 12+ | 05-mcps-status.md |
| APIs opérationnelles | Shopify ✅, Klaviyo ✅, Apify ✅, Hostinger ✅ | Test API |
| Fichier .env | ✅ Complet | Vérifié |

**Source de vérité:** `.claude/rules/01-project-status.md`

---

**Rappel:** La vérité brutale est préférable à une fiction confortable.
