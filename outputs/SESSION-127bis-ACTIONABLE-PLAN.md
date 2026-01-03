# Session 127bis - Plan Actionnable
**Date:** 03/01/2026
**Focus:** Workflow Gaps Analysis - 8 catégories manquantes identifiées

---

## ÉTAT ACTUEL VÉRIFIÉ

| Métrique | Valeur |
|----------|--------|
| Automations registry | 89 (v2.3.0) |
| Scripts résilients | 10 |
| Catégories existantes | 11 |
| **Catégories manquantes** | **8 (critiques)** |
| Overall Audit Score | 92% |
| Security Backend | 92% ✅ |

---

## PHASE 1: CRITIQUE (Semaines 1-2)

### 1. SMS Automation (2-3 jours)

**Script:** `sms-automation-resilient.cjs`

**Provider:** Omnisend SMS API (déjà intégré v1.1.0)

**Flows à implémenter:**
- Abandoned Cart SMS (15-30min après abandon)
- Shipping Notification SMS
- Order Confirmation SMS

**Benchmark:** 98% open rate, 21-32% conversion

```bash
# Test après création
node automations/agency/core/sms-automation-resilient.cjs --health
node automations/agency/core/sms-automation-resilient.cjs --test-abandoned-cart
```

### 2. 3-Email Abandoned Cart Series (1 jour)

**Modifier:** `email-personalization-resilient.cjs`

**Séquence:**
- Email 1: 1h après abandon (reminder)
- Email 2: 24h après (social proof)
- Email 3: 72h après (discount)

**Benchmark:** +69% orders vs 1 email (Klaviyo)

### 3. Churn Prediction (2-3 jours)

**Script:** `churn-prediction-resilient.cjs`

**Méthode:**
1. Rule-based RFM scoring (start)
2. AI enhancement (future)

**Signals:**
- Days since last purchase > 90
- Purchase frequency decline > 50%
- Email engagement decline
- Support ticket patterns

**Benchmark:** -25% churn rate

---

## PHASE 2: HAUTE (Semaines 3-4)

### 4. Review Request Automation (1-2 jours)

**Script:** `review-request-automation.cjs`

**Trigger:** 7-14 jours après livraison (via Shopify webhook)

**Flow:**
1. Check order delivered
2. Send review request email
3. Incentive for photo review
4. Alert if <3 stars

**Benchmark:** +270% reviews

### 5. Lead Qualification Chatbot (2-3 jours)

**Modifier:** `voice-api-resilient.cjs`

**Questions qualification:**
- Budget range
- Timeline
- Decision maker?
- Current tools

**Actions:**
- Score lead (0-100)
- Push to HubSpot avec score
- Trigger appropriate nurture

**Benchmark:** +70% conversion, -95% qualification time

### 6. At-Risk Customer Flow (2 jours)

**Dépend de:** #3 Churn Prediction

**Trigger:** Churn score > 70%

**Actions:**
- Personal email from founder
- Special discount
- VIP call offer

**Benchmark:** +260% conversion at-risk

---

## PHASE 3: MOYENNE (Semaines 5-8)

### 7. Birthday/Anniversary Flow (1 jour)

**Script:** `birthday-anniversary-flow.cjs`

**Trigger:** Date-based (requires customer birthdate collection)

**Flow:**
- 7 jours avant: teaser
- Jour J: gift/discount
- 3 jours après: reminder

**Benchmark:** +342% revenue per email

### 8. Referral Program (2-3 jours)

**Script:** `referral-program-automation.cjs`

**Features:**
- Unique referral link generation
- Double-sided rewards
- Tracking dashboard

**Benchmark:** +16% CLV, -80% acquisition cost

### 9. Price Drop Alerts (1-2 jours)

**Script:** `price-drop-alerts.cjs`

**Requires:** Wishlist functionality

**Trigger:** Product price decrease

**Benchmark:** 8.8% conversion

### 10. Replenishment Reminders (2 jours)

**Script:** `replenishment-reminder.cjs`

**Applicable:** Cosmetics, supplements, pet food, etc.

**Logic:** Based on product consumption cycle

**Benchmark:** +90% repeat purchase

---

## MÉTRIQUES DE SUCCÈS

| KPI | Baseline | Target Post-Phase 1 | Target Post-Phase 2 |
|-----|----------|---------------------|---------------------|
| Cart Recovery | 10-15% | 25-30% | 30-35% |
| Churn Rate | TBD | -15% | -25% |
| Review Count | TBD | +100% | +270% |
| Lead Qual Time | 60 min | 15 min | 5 min |
| Email ROI | 36:1 | 40:1 | 45:1 |

---

## DÉPENDANCES

| Script | Dépend de |
|--------|-----------|
| sms-automation | Omnisend SMS (✅ déjà intégré) |
| churn-prediction | RFM data in Shopify/Klaviyo |
| review-request | Shopify webhooks (✅ déjà configurés) |
| birthday-flow | Customer birthdate collection (à implémenter) |
| referral-program | Unique link generation logic |
| price-drop | Wishlist functionality (à implémenter) |
| replenishment | Product cycle data (à définir par client) |

---

## VALIDATION

### Avant chaque implémentation

1. Créer script avec --health check
2. Tester en mode dry-run
3. Vérifier fallback chain fonctionne
4. Documenter dans registry

### Après chaque implémentation

```bash
# Health check obligatoire
node automations/agency/core/[script].cjs --health

# Test avec données réelles
node automations/agency/core/[script].cjs --test

# Commit si 100% succès
git add automations/agency/core/[script].cjs
git commit -m "feat(automation): Add [script] with [X] providers fallback"
```

---

## PRIORITÉS IMMÉDIATES (Cette session/Demain)

- [ ] Créer `sms-automation-resilient.cjs` avec Omnisend API
- [ ] Modifier `email-personalization-resilient.cjs` pour 3-email series
- [ ] Créer `churn-prediction-resilient.cjs` avec RFM scoring

---

*Session 127bis - Généré 03/01/2026*
