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
4. ✅ "3 MCPs fonctionnels (Klaviyo, Shopify, n8n)"

## Workflow de Vérification

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

## Métriques Actuelles (Vérifiées 17/12/2025)

| Métrique | Documenté | Réalité vérifiée | Source |
|----------|-----------|------------------|--------|
| Scripts totaux | 207 | ~198 | FORENSIC-AUDIT |
| Scripts réutilisables | 120 | ~25 génériques | FORENSIC-AUDIT |
| Scripts configurables | - | ~33 (process.env) | FORENSIC-AUDIT |
| Scripts hardcoded | - | ~140 | FORENSIC-AUDIT |
| MCPs configurés | 8-10 | 6 déclarés | MCP-INTEGRATION |
| MCPs fonctionnels | - | 3 (Klaviyo, Shopify, n8n) | FORENSIC-AUDIT |
| MCPs cassés | - | 2 (Google SA manquant) | FORENSIC-AUDIT |
| MCPs placeholder | - | 1 (Apify) | FORENSIC-AUDIT |
| Readiness global | 68% | ~25% | FORENSIC-AUDIT |
| Fichier .env | Requis | INEXISTANT | FORENSIC-AUDIT |

**Source de vérité:** `FORENSIC-AUDIT-TRUTH-2025-12-16.md`

---

**Rappel:** La vérité brutale est préférable à une fiction confortable.
