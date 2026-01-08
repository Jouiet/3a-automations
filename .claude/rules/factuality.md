# Règles de Factualité

> Toute affirmation doit être vérifiable empiriquement.

## Avant Toute Affirmation
1. Scripts "production-ready" → Vérifier fonctionnement
2. "X clients" → Vérifier actifs et payants
3. "Stack complet" → Auditer chaque composant

## INTERDIT
- ❌ Claims sans test empirique
- ❌ Wishful thinking

## AUTORISÉ (Vérifié 05/01/2026 - Session 136)
- ✅ 22 scripts avec --health
- ✅ 118 automations registry v2.7.0
- ✅ 94 cartes affichées sur site (5 internes/doublons exclus)
- ✅ 11/11 MCPs fonctionnels
- ✅ AEO 100%, SEO 88%
- ✅ Security 100% (CSP + all headers deployed)

## Écart Registry vs Affichées (5)
| Automation | Raison exclusion |
|------------|------------------|
| Geo Segment Generic | Doublon Geo-Segmentation |
| Enable Apify Schedulers | Script technique interne |
| Audit Klaviyo Flows V2 | Doublon Audit Email |
| Parse Warehouse Csv | Script technique interne |
| Newsletter Automation | Catégorie marketing vide |

## Source de Vérité
`automations-registry.json` v2.7.0
