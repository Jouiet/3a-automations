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
2. ❌ "Spécialisés Shopify/Klaviyo/Hostinger" → Nous supportons TOUTES plateformes (E-commerce B2C + PME B2B)
3. ❌ "207 scripts réutilisables" → 99 dans le registry (automations-registry.json v2.7.0)
4. ❌ "Production-ready" → Sans test empirique préalable
5. ❌ "100% secure" → CSP header MANQUANT (Session 132)
6. ❌ "SEO parfait" → 22 academy pages sans Schema.org

## Ce Qui Est AUTORISÉ (Vérifié Session 132 - 03/01/2026)

1. ✅ "MCPs 11/11 fonctionnels (100%)"
2. ✅ "23 scripts résilients multi-provider" (20 + 3 dropshipping)
3. ✅ "99 automations dans le registry v2.7.0"
4. ✅ "AAA - Agence d'Automatisation AI spécialisée E-commerce (B2C) et PME (B2B), TOUTES plateformes"
5. ✅ "AEO 100% - llms.txt conforme, AI crawlers autorisés"
6. ✅ "Performance 92% - TTFB 316ms"

## Workflow de Vérification

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

## Métriques Actuelles (Vérifiées 04/01/2026 - Session 133 DROPSHIPPING AUDIT)

| Métrique | Valeur | Source |
|----------|--------|--------|
| Scripts natifs résilients | **23** (20 + 3 dropshipping) | automations/agency/core/ |
| Automations registry | **99** | automations-registry.json (v2.7.0) |
| MCPs fonctionnels | 11/11 (100%) | 05-mcps-status.md |
| Docker containers (3A) | 4 + 2 shared | Hostinger VPS 1168256 |
| **SEO Score** | **88%** | Session 132 audit |
| **AEO Score** | **100%** ✅ | llms.txt + AI crawlers |
| **Performance** | **92%** | TTFB 316ms (curl) |
| **Accessibility** | **~65%** ⚠️ | 26 heading issues |
| **Security** | **86%** ⚠️ | CSP MISSING |
| **Marketing** | **78%** | 0 trust signals |
| **i18n** | **95%** | hreflang 100% |
| **Overall** | **82%** | Session 132 |
| APIs opérationnelles | Shopify ✅, Klaviyo ✅, Apify ✅, Hostinger ✅ | Test API |

**Source de vérité:** `.claude/rules/01-project-status.md`
**Dernière session:** Session 133 - Dropshipping Forensic Audit (04/01/2026)

### Session 133 - Dropshipping Scripts Status (P0 FIXES COMPLETE)

| Script | Production-Ready | Status |
|--------|-----------------|--------|
| cjdropshipping-automation.cjs | **90%** ✅ | CORS fixed, TEST MODE |
| bigbuy-supplier-sync.cjs | **85%** | CORS fixed, searchProducts API issue |
| dropshipping-order-flow.cjs | **95%** ✅ | Shopify/WooCommerce APIs, persistence, CORS |

**P0 Fixes (04/01/2026):**
- `updateStorefrontTracking()`: Shopify Admin API 2024-01 + WooCommerce REST
- File persistence: `data/dropshipping/` (JSON, atomic writes)
- CORS whitelist: 3a-automation.com, dashboard, storefronts

---

**Rappel:** La vérité brutale est préférable à une fiction confortable.
