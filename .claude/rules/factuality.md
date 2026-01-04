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

## Ce Qui Est AUTORISÉ (Vérifié Session 133bis - 04/01/2026)

1. ✅ "MCPs 11/11 fonctionnels (100%)"
2. ✅ "22 scripts avec --health" (empiriquement vérifié)
3. ✅ "35 scripts .cjs dans core/"
4. ✅ "99 automations dans le registry v2.7.0"
5. ✅ "AAA - Agence d'Automatisation AI spécialisée E-commerce (B2C) et PME (B2B), TOUTES plateformes"
6. ✅ "AEO 100% - llms.txt conforme, AI crawlers autorisés"
7. ✅ "Performance 92% - TTFB 316ms"

## Workflow de Vérification

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

## Métriques Actuelles (04/01/2026 - Session 133bis VERIFIED)

| Métrique | Valeur | Source | Vérification |
|----------|--------|--------|--------------|
| Scripts avec --health | **22** | core/*.cjs | `grep -l "\-\-health"` |
| Scripts .cjs total | **35** | core/ | `ls -la | wc -l` |
| Automations registry | **99** | v2.7.0 | 64/64 valid |
| MCPs | 11/11 (100%) | 05-mcps-status.md | Tested |
| SEO | **88%** | Schema.org gaps | Audit |
| AEO | **100%** ✅ | llms.txt | Verified |
| Performance | **92%** | TTFB 316ms | curl |
| Security | **86%** ⚠️ | CSP MISSING | Headers |
| **Overall** | **82%** | Session 132 | Audit |

**Source de vérité:** `automations-registry.json` v2.7.0 + `.claude/rules/01-project-status.md`

---

**Rappel:** La vérité brutale est préférable à une fiction confortable.
