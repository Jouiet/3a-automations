# 3A Automation
>
> Version: 74.0 | 24/01/2026 | Session 147 - **HERO ANIMATION v4.0** (NO SCROLL DEPENDENCY)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

## SESSION 147 - HERO ANIMATION RÉÉCRITURE COMPLÈTE (24/01/2026)

### PROBLÈME INITIAL
Animation hero était:
1. En BAS au lieu du hero (causé par GSAP `pin: true`)
2. Contrôlée par le SCROLL (causé par `scrub: 0.5`)
3. `height: 200vh` pour scroll-pinning (architecture scroll-based)

### CAUSE RACINE PROFONDE
**Architecture entière basée sur GSAP ScrollTrigger** - concept "Apple-style scroll animation" où l'animation progresse avec le scroll. L'utilisateur voulait simplement une vidéo en boucle.

### SOLUTION: RÉÉCRITURE COMPLÈTE

| Élément | AVANT (scroll-based) | APRÈS (auto-loop) |
| :--- | :--- | :--- |
| Script | `scroll-animation.js` (294 lignes) | `hero-animation.js` (160 lignes) |
| Librairies | GSAP + ScrollTrigger (2 CDN) | AUCUNE |
| height CSS | `200vh` (scroll-pinning) | `100vh` (viewport) |
| Animation | Synchronisée au scroll | Auto-loop 30fps |
| Démarrage | Quand utilisateur scrolle | IMMÉDIAT |

### Fichiers Modifiés

| Action | Fichier |
| :--- | :--- |
| **NOUVEAU** | `scripts/hero-animation.js` |
| **SUPPRIMÉ** | `scripts/scroll-animation.js` |
| **SUPPRIMÉ** | GSAP CDN scripts (2 balises) |
| **MODIFIÉ** | `styles.css` (.hero-animation) |
| **MODIFIÉ** | `index.html` FR + EN |

### Validation Finale

```bash
# Console v4.0:
[HeroAnimation] Started with 240 frames at 30 fps ✅
```

### CSS Version: v=57.0 (70 fichiers synchronisés)

---

## SESSION 146bis - WHISK METHODOLOGY + REMOTION (23/01/2026)

### Whisk Methodology v1.0 - AJOUTÉ

| Élément | Status | Location |
| :--- | :--- | :--- |
| **Méthodologie 7 étapes** | ✅ Documentée | `ETAGERE-TECHNOLOGIQUE` |
| Standards qualité inputs | ✅ PNG/JPEG specs | Subject/Scene/Style |
| Checklist pré-génération | ✅ Exportable | Markdown template |
| Workflow hybride Whisk→Remotion | ✅ Diagramme | Flow complet |
| Erreurs courantes | ✅ 5 identifiées | Solutions incluses |

### Contraintes Whisk Vérifiées

| Contrainte | Valeur | Impact |
| :--- | :--- | :--- |
| API publique | ❌ **AUCUNE** | Manuel seulement |
| Durée animation | **8 sec max** | 720p MP4 |
| Sujets fiables | **4 max** | >4 = incohérent |
| Rate limiting | **30-45 sec** | Entre prompts |

### Limites par Abonnement Google

| Tier | Crédits AI/mois | Whisk | Flow |
| :--- | :--- | :--- | :--- |
| FREE | 100 | Veo 3.1 Fast | Veo 3.1 Fast |
| **AI Pro** | 1,000 | **Veo 3** | Veo 3.1 |
| **AI Ultra** | 25,000 | **Veo 3** | Veo 3.1 (highest) |

**Status 3A VÉRIFIÉ (Screenshot 23/01/2026):**
```
Forfait: Google AI Pro (2 To) - 119,99 MAD/mois
├── Whisk: Veo 3
├── Flow: Veo 3.1 (accès étendu)
├── Gemini App: Veo 3.1 (accès limité)
├── Crédits AI: 1,000/mois
└── Storage: 2 To (Photos, Drive, Gmail)
```

### Remotion Studio

| Élément | Status | Location |
| :--- | :--- | :--- |
| **Remotion Studio** | ✅ Production | `automations/remotion-studio/` |
| 4 Compositions | ✅ Prêtes | PromoVideo, DemoVideo, AdVideo, Testimonial |
| 5 Composants | ✅ Réutilisables | TitleSlide, FeatureCard, LogoReveal, etc. |
| AI Assets | ✅ Multi-provider | fal.ai FLUX + Replicate fallback |
| Claude Skill | ✅ Documenté | `.claude/skills/remotion-video/SKILL.md` |

### Commandes Remotion

```bash
cd automations/remotion-studio
npm install                    # Install (une fois)
npm run dev                    # Preview (localhost:3000)
npm run render:promo           # → out/promo.mp4 (30s)
npm run render:ad              # → out/ad.mp4 (15s portrait)
```

### Workflow Hybride Whisk → Remotion

```
WHISK (Manual) → Download Assets → REMOTION (Compose) → Output MP4
     │                │                    │                │
     │ Subject/Scene  │ /assets/whisk/     │ TitleSlide     │ promo.mp4
     │ Style          │ PNG/MP4            │ FeatureCard    │ ad.mp4
     │ Refine         │ Named convention   │ AI overlays    │ demo.mp4
```

**Avantage hybride**: Créativité Whisk + Contrôle précis Remotion = Vidéos uniques

### Transferts Video Production

| Direction | Technologie | Priorité | Status |
| :--- | :--- | :--- | :--- |
| 3A → MyDealz | Remotion + Whisk methodology | HIGH | ⏳ Pending |
| 3A → Alpha Medical | Remotion + Whisk methodology | HIGH | ⏳ Pending |

### Documentation Mise à Jour

- ✅ **`docs/WHISK-REMOTION-METHODOLOGY.md`** - **NOUVEAU** Document dédié complet (10 sections)
- ✅ `docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md` - Méthodologie Whisk complète ajoutée
- ✅ `docs/ANALYSE-TRANSFERT-DESIGN-AUTOMATION-SHOPIFY.md` - Section 9 ajoutée
- ✅ `docs/PLAN-INTEGRATION-MYDEALZ-ALPHAMEDICAL-SESSION-141.md` - Session 146 ajoutée
- ✅ `CLAUDE.md` - Workflow hybride + contraintes documentées

---

## SESSION 145ter - COMPLETE CARD CSS + SVG SAFETY (23/01/2026)

### All Component Cards CSS Added (+500 lines)

| Component | Classes Added | Usage |
| :--- | :--- | :--- |
| Blog Cards | `.blog-card`, `.related-card` | Blog index + articles |
| Case Cards | `.case-card` | cas-clients.html |
| Process Cards | `.process-card`, `.process-icon` | Methodology sections |
| Security Cards | `.security-card`, `.security-icon` | Compliance sections |
| Tech Cards | `.tech-card` | investisseurs.html |
| Investor Cards | `.investor-card` | investisseurs.html |
| KPI Cards | `.kpi-card` | flywheel-360.html |
| Summary Cards | `.summary-card`, `.summary-icon` | Legal pages |
| Generic Icons | `.brain-icon`, `.section-icon`, `.right-icon` | Various |

### SVG Safety Net Added
```css
/* Global SVG constraint for inline icons */
.card svg:not([width]),
.icon svg:not([width]),
[class*="-card"] svg:not([width]),
[class*="-icon"] svg:not([width]) {
  max-width: 48px;
  max-height: 48px;
}
```

### Metrics Session 145ter
- CSS Lines: 10,498 → **10,998** (+500)
- CSS Version: v=43.0 → **v=54.0** (Session 147)
- Validator Errors: 15 → **0**
- Validator Warnings: 20 → **5** (minor)

---

## SESSION 145bis - ACADEMY CSS + VALIDATION (23/01/2026)

### Critical Bug Fixed: Giant SVG Icons on Academy Page

| Issue | Root Cause | Fix |
| :--- | :--- | :--- |
| SVG icons 1152px instead of 28px | CSS truncated in production | Synced CSS versions |
| Missing .course-card, .guide-card | 16 CSS classes undefined | Added ~100 lines CSS |
| CI blocking deployments | CSS version mismatch | Synced to v=42.0 |

### Validation System Improvements

**NEW VALIDATORS ADDED:**
1. `validateHTMLClassesHaveCSS()` - Detects HTML classes without CSS
2. `validateSVGSizeConstraints()` - Detects unconstrained inline SVGs

---

## SESSION 145 - DEPLOYMENT FIX (23/01/2026)

### Verified LIVE on 3a-automation.com
- ✅ Hybrid Architecture section deployed (FR+EN)
- ✅ 3 glassmorphism cards visible
- ✅ "AI proposes, code disposes" tagline
- ✅ Salesforce 116-day pivot reference

### Commits Session 145
```
0cac3a1 fix(css): Sync CSS version to v=38.0 across all files
```

---

## SESSION 144 - CONTENU & ÉTAGÈRE TECHNOLOGIQUE (23/01/2026)

### Content Strategy (Leçons Salesforce)
Analyse de 4 documents sur fiabilité IA → Contenu marketing créé:

| Type | FR | EN | Status |
| :--- | :--- | :--- | :--- |
| Blog Article | `automatisation-fiable-lecons-salesforce-2026.html` | `reliable-automation-salesforce-lessons-2026.html` | ✅ |
| Academy Course | `academy/courses/architecture-hybride.html` | `en/academy/courses/hybrid-architecture.html` | ✅ |

**Concepts documentés:** Déterministe vs Probabiliste, Piège 80/20, Architecture Hybride (3 couches)

### Étagère Technologique - Transferts Session 144

| Direction | Technologies | Status | Réalité |
| :--- | :--- | :--- | :--- |
| 3A → MyDealz | omnisend-sensor, ga4-sensor, retention-sensor | ✅ Créés | ⚠️ Non testés |
| 3A → Alpha | Multi-AI Fallback | ❌ **0 usages** | Code mort |
| 3A → Alpha | Design System | ⚠️ Template only | Pas de DESIGN-SYSTEM.md |
| 3A → Alpha | GA4 Sensor | ✅ Créé | ⚠️ Non testé |
| Alpha → 3A | Theme Check CI | ✅ | Fonctionne |

### MyDealz Sensors (VÉRIFIÉ)

| Sensor | Fichier | Status |
| :--- | :--- | :--- |
| Shopify | `sensors/shopify-sensor.cjs` | ✅ |
| Omnisend | `sensors/omnisend-sensor.cjs` | ✅ (pas Klaviyo!) |
| GA4 | `sensors/ga4-sensor.cjs` | ✅ |
| Retention | `sensors/retention-sensor.cjs` | ✅ |
| Sync | `sensors/sync-to-3a.cjs` | ✅ |

## Métriques VÉRIFIÉES (23/01/2026 - Session 144)

| Élément | Valeur | Status |
| :--- | :--- | :--- |
| Scripts Core | 81 | ✅ |
| Automations Registry | **121** | ✅ SYNCED (+2) |
| Automations Catalog | **121** | ✅ SYNCED |
| HTML Pages | **70** | ✅ (+4 blog/academy) |
| Blog Articles FR | 5 | ✅ |
| Academy Courses | 8 | ✅ (1 FR + 7 EN) |
| Sitemap URLs | **68** | ✅ FIXED (+2 academy)
| Scripts --health | 22 | ✅ |
| Sensors 3A | 20 | 6 OK, 10 PARTIAL, 4 BLOCKED |
| Sensors MyDealz | 5 | ✅ Transferred |
| Stylelint Issues | 0 | ✅ |
| CSS Version | **v=54.0** | ✅ Auto-bumped (Session 147) |
| CSS Lines | **10,498** | ✅ Complete (+163 Academy) |
| Design Validation | PASS | ✅ All checks (20 warnings) |
| Homepage Hybrid Section | FR+EN | ✅ Added |
| **Remotion Studio** | **Production** | ✅ NEW S146 |
| Remotion Compositions | 4 | ✅ NEW S146 |
| Remotion Components | 5 | ✅ NEW S146 |

## SESSION 143 - AUDIT DESIGN UI/UX (23/01/2026)

| Vérification | Résultat | Status |
| :--- | :--- | :--- |
| validate-design-system.cjs | 0 errors, 0 warnings | ✅ |
| design-auto-fix.cjs --check | ALL CHECKS PASSED | ✅ |
| CSS version | v=37.0 (66 fichiers) | ✅ |
| Design Score | 85/100 EXCELLENT | ✅ |
| Glassmorphism | 28 instances | ✅ |
| CSS Variables | 1126 uses | ✅ |
| font-display: swap | Via Google Fonts | ✅ |
| Pre-commit hook | Loop fixed | ✅ |

**Audit complet**: `docs/DESIGN-AUDIT-SESSION-143.md`

### Alpha Medical - AUDIT FACTUEL (23/01/2026 19:00 UTC)

**VERDICT: 37.5% SUCCÈS (6/16 implémentations fonctionnelles)**

| Catégorie | Fichier | Créé | Fonctionne | Preuve |
| :--- | :--- | :--- | :--- | :--- |
| Theme Check | `.theme-check.yml` | ✅ | ✅ | 1/3 runs SUCCESS |
| CI/CD theme-check | `theme-check.yml` | ✅ | ✅ | GitHub Actions |
| CI/CD sensor-monitor | `sensor-monitor.yml` | ✅ | ❌ **0 runs** | Jamais exécuté |
| MCP | `.mcp.json` | ✅ | ✅ | JSON valide |
| Shopify Sensor | `shopify-sensor.cjs` | ✅ | ❌ **401/403** | products=0 (réel=90) |
| Klaviyo Sensor | `klaviyo-sensor.cjs` | ✅ | ❌ **401** | flows=0 (réel=5) |
| Retention Sensor | `retention-sensor.cjs` | ✅ | ⚠️ Non testé | 0 runs |
| GA4 Sensor | `ga4-sensor.cjs` | ✅ | ⚠️ Non testé | 0 runs |
| Sync-to-3A | `sync-to-3a.cjs` | ✅ | ⚠️ Non testé | 0 runs |
| GPM Local | `pressure-matrix.json` | ✅ | ❌ **Données fausses** | 0 products |
| Pre-commit | `.husky/pre-commit` | ✅ | ✅ | Hook actif |
| Resilient AI | `resilient-ai-fallback.cjs` | ✅ | ❌ **0 usages** | grep=0 imports |
| RAG KB Builder | `knowledge_base_builder.py` | ✅ | ❌ **401** | Test exécution |
| RAG KB Simple | `knowledge_base_simple.py` | ✅ | ❌ **401** | Test exécution |

**BLOCKERS CRITIQUES:**
- `SHOPIFY_ADMIN_ACCESS_TOKEN` → **403 Forbidden** (6 workflows bloqués)
- `KLAVIYO_PRIVATE_API_KEY` → **401 Unauthorized** (9 workflows bloqués)

**GitHub Actions: 85% ÉCHEC (17/20 runs)**

**CE QUI FONCTIONNE:**
1. ✅ Theme Check CI (1 success)
2. ✅ llms.txt auto-update (2 succès)
3. ✅ Documentation (ANALYSE-TRANSFERT 15K)

**CE QUI NE FONCTIONNE PAS:**
- 5 sensors créés mais **0% fonctionnels**
- 2 scripts RAG créés mais **échouent 401**
- 1 resilient-ai-fallback **jamais utilisé (0 imports)**

**Source**: Audit interne Alpha Medical 23/01/2026

## SESSION 142 - DESIGN SYSTEM (23/01/2026)

| Fix | Details | Status |
| :--- | :--- | :--- |
| Stylelint issues | 55→0 (color: white → var(--text-light)) | ✅ FIXÉ |
| Visual regression | 9 baseline screenshots created | ✅ DONE |
| Pre-commit hook | Blocks invalid commits | ✅ ACTIVE |
| CI/CD validation | deploy-website.yml v3.0 | ✅ CONFIGURED |
| DESIGN-SYSTEM.md | Source of truth unified | ✅ CREATED |
| Booking page CSS | .booking-success display:none | ✅ FIXÉ |

## SESSION 141 - FIXES (22/01/2026)

| Fix | Details | Status |
| :--- | :--- | :--- |
| Homepage "174"→"119" | FR + EN + meta + JSON-LD | ✅ FIXÉ |
| Homepage "18 agents"→"22" | FR + EN + telemetry | ✅ FIXÉ |
| llms.txt | 174→119, 18→22 | ✅ FIXÉ |
| Scripts defer | 6 scripts | ✅ FIXÉ |

## PROTOCOLES - VÉRIFIÉ SESSION 143

| Protocole | Status | Fichier Principal | Endpoints |
| :--- | :--- | :--- | :--- |
| **A2A** | ✅ PRODUCTION | `automations/a2a/server.js` | `/a2a/v1/rpc`, `/.well-known/agent.json` |
| **UCP** | ✅ PRODUCTION | `pages/api/ucp/products.js` | `/.well-known/ucp`, `/api/ucp/products` |
| **ACP** | ✅ FONCTIONNEL | `automations/acp/server.js` | `/acp/v1/agent/submit`, `/acp/v1/stream` |
| **GPM** | ✅ PRODUCTION | `landing-page-hostinger/data/pressure-matrix.json` | 20 sensors, 8 sectors |
| **AG-UI** | ✅ PRODUCTION | `automations/a2a/server.js:416-518` | `/ag-ui`, `/ag-ui/queue` |

**Agents enregistrés**: 43 (10 core + 41 dynamic skills)

## SENSORS - EXÉCUTION RÉELLE (20 total)

| Status | Count | Sensors (Pressure) |
| :--- | :--- | :--- |
| ✅ OK | 6 | retention(0), product-seo(0), shopify(75), google-trends(5), cost-tracking(30), lead-velocity(75) |
| ⚠️ PARTIAL | 10 | klaviyo(65), email-health(60), ga4(50), google-ads-planner(50), bigquery(-), supplier-health(80), voice-quality(90), content-perf(90), lead-scoring(95) |
| ❌ BLOCKED | 4 | gsc(API disabled), meta-ads(95), tiktok-ads(95), apify(trial expired) |

## BLOCKERS RESTANTS (P1-P2) - USER ACTION REQUIRED

| Problème | Impact | Action | Lien |
| :--- | :--- | :--- | :--- |
| GSC API disabled | Sensor SEO cassé | Activer API | [Cloud Console](https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=359870692708) |
| META_ACCESS_TOKEN vide | Meta Ads cassé | Configurer token | Facebook Business |
| TIKTOK_ACCESS_TOKEN vide | TikTok Ads cassé | Configurer token | TikTok Business |
| Apify trial expiré | Trends cassé | Payer $49/mois | [Apify Billing](https://console.apify.com/billing) |
| 36 credentials vides | 60% features OFF | Configurer .env | - |

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
- **Remotion Video**: @.claude/skills/remotion-video/SKILL.md
- **Étagère Tech**: @docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md
- **Transfert Shopify**: @docs/ANALYSE-TRANSFERT-DESIGN-AUTOMATION-SHOPIFY.md
