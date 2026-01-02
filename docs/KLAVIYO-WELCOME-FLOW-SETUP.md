# Guide: Création du Klaviyo Welcome Flow
## Configuration de la série d'emails automatiques

**Durée:** 30 minutes
**Prérequis:** Accès admin au compte Klaviyo

---

## Contexte

Le script natif `email-personalization-resilient.cjs` crée des profils et déclenche l'événement `welcome_series_started` dans Klaviyo. Cependant, **aucun flow Klaviyo n'existe** pour réagir à cet événement et envoyer les emails.

> **NOTE (Session 119):** Les workflows n8n ont été migrés vers des scripts natifs dans `automations/agency/core/`.

Ce guide explique comment créer ce flow manuellement.

---

## Étape 1: Accéder à Klaviyo

1. Connectez-vous à [klaviyo.com](https://www.klaviyo.com)
2. Compte: **3A Automation** (contact@3a-automation.com)
3. Naviguer vers **Flows** dans le menu latéral

---

## Étape 2: Créer un nouveau Flow

1. Cliquer sur **Create Flow**
2. Sélectionner **Create from Scratch**
3. Nommer le flow: `Welcome Series - 5 Emails`

---

## Étape 3: Configurer le Trigger

1. Dans le panneau trigger, sélectionner **Metric**
2. Chercher et sélectionner: `welcome_series_started`
   - Ce metric est créé automatiquement par l'API (catégorie: API)
   - ID du metric: `RuxrvB`

3. Configuration:
   - Trigger: **Once per person**
   - Flow filters: Aucun (tous les profils)

---

## Étape 4: Ajouter les 5 Emails

### Email 1: Bienvenue (immédiat)

**Délai:** Aucun (envoi immédiat)

**Sujet:** `Bienvenue chez 3A Automation, {{ first_name|default:"" }}!`

**Preheader:** `Votre parcours automation commence maintenant`

**Corps:**
```
Bonjour {{ first_name|default:"" }},

Merci de rejoindre 3A Automation!

Bienvenue dans notre communauté d'automatisation e-commerce et PME.
Notre objectif: vous aider à récupérer 10h+ par semaine grâce à l'automatisation intelligente.

**Ce que vous allez découvrir:**
- Comment automatiser vos tâches répétitives
- Les meilleurs workflows pour votre secteur
- Des cas concrets avec ROI mesuré

À très bientôt,
L'équipe 3A Automation
Automation. Analytics. AI.

P.S. Répondez à cet email si vous avez une question spécifique!
```

---

### Email 2: Social Proof (J+2)

**Délai:** Time Delay → 2 jours

**Sujet:** `Comment nos clients gagnent 10h/semaine`

**Preheader:** `Cas concrets et résultats vérifiés`

**Corps:**
```
Bonjour {{ first_name|default:"" }},

"Avant 3A Automation, je passais 15h/semaine sur le reporting et les relances.
Maintenant c'est 2h max." - Client E-commerce

**Résultats moyens constatés:**
→ 10-15h récupérées par semaine
→ +25% revenus email
→ ROI 42:1 sur les flows Klaviyo

Voulez-vous voir comment ça marche pour votre secteur?

[Voir les cas clients](https://3a-automation.com/cas-clients.html)

Cordialement,
L'équipe 3A Automation
```

---

### Email 3: Best Sellers (J+4)

**Délai:** Time Delay → 2 jours (après Email 2)

**Sujet:** `Les 3 automatisations les plus demandées`

**Preheader:** `Quick wins à déployer en moins d'une semaine`

**Corps:**
```
Bonjour {{ first_name|default:"" }},

Voici les 3 automatisations les plus demandées par nos clients:

**1. Récupération paniers abandonnés**
→ +10-15% revenus email
→ Setup en 48h

**2. Welcome series email**
→ +40% open rate vs emails ponctuels
→ 5 emails automatiques

**3. Reporting automatisé**
→ Dashboard temps réel
→ Alertes intelligentes

Laquelle vous intéresse le plus?

[Réserver un audit gratuit](https://3a-automation.com/booking.html)

L'équipe 3A Automation
```

---

### Email 4: Educational (J+7)

**Délai:** Time Delay → 3 jours (après Email 3)

**Sujet:** `Guide: Automatisation E-commerce 2026`

**Preheader:** `Tendances et stratégies qui fonctionnent`

**Corps:**
```
Bonjour {{ first_name|default:"" }},

Nous venons de publier notre guide complet sur l'automatisation e-commerce en 2026.

**Au sommaire:**
1. Les 5 automations essentielles
2. Stack technique optimal (Shopify + Klaviyo + GA4)
3. Erreurs à éviter absolument
4. ROI attendu par type d'automation

[Lire le guide complet](https://3a-automation.com/blog/automatisation-ecommerce-2026.html)

C'est gratuit, sans inscription.

Bonne lecture!
L'équipe 3A Automation
```

---

### Email 5: Offre (J+14)

**Délai:** Time Delay → 7 jours (après Email 4)

**Sujet:** `[Exclusif] 10% sur votre premier pack automation`

**Preheader:** `Offre réservée aux nouveaux abonnés`

**Corps:**
```
Bonjour {{ first_name|default:"" }},

Ça fait 2 semaines que vous nous suivez. Merci pour votre confiance!

Pour vous remercier, voici une offre exclusive:

**-10% sur votre premier pack**
Code: WELCOME10
Valable 7 jours

**Nos packs:**
- Quick Win (390€ → 351€): 1 automation + Voice AI Booking
- Essentials (790€ → 711€): 3 automations + WhatsApp
- Growth (1399€ → 1259€): 5+ automations + Dashboard

[Voir les tarifs](https://3a-automation.com/pricing.html)

Ou commencez par l'audit gratuit:
[Réserver maintenant](https://3a-automation.com/booking.html)

Cordialement,
L'équipe 3A Automation
3A Automation
```

---

## Étape 5: Structure finale du Flow

```
[TRIGGER: welcome_series_started]
         ↓
    [EMAIL 1: Bienvenue]
         ↓
    [DÉLAI: 2 jours]
         ↓
    [EMAIL 2: Social Proof]
         ↓
    [DÉLAI: 2 jours]
         ↓
    [EMAIL 3: Best Sellers]
         ↓
    [DÉLAI: 3 jours]
         ↓
    [EMAIL 4: Educational]
         ↓
    [DÉLAI: 7 jours]
         ↓
    [EMAIL 5: Offre]
```

---

## Étape 6: Activer le Flow

1. Vérifier tous les emails (preview)
2. Cliquer sur **Review and Turn On**
3. Confirmer l'activation
4. Status: **LIVE**

---

## Étape 7: Tester

```bash
# Option 1: Via script natif (recommandé)
node automations/agency/core/email-personalization-resilient.cjs \
  --test --email="test-flow@votreemail.com" --name="TestFlow"

# Option 2: Via API directe Klaviyo
curl -X POST "https://a.klaviyo.com/api/events/" \
  -H "Authorization: Klaviyo-API-Key $KLAVIYO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "event",
      "attributes": {
        "properties": {},
        "metric": {"data": {"type": "metric", "attributes": {"name": "welcome_series_started"}}},
        "profile": {"data": {"type": "profile", "attributes": {"email": "test-flow@votreemail.com", "first_name": "TestFlow"}}}
      }
    }
  }'
```

Puis vérifier:
1. Profil créé dans Klaviyo → Profiles
2. Event `welcome_series_started` visible sur le profil
3. Email 1 en queue/envoyé dans Flow → Analytics

---

## Troubleshooting

### Le flow ne se déclenche pas
- Vérifier que le metric `welcome_series_started` est bien sélectionné
- Vérifier que le flow est en status LIVE
- Vérifier les filtres (aucun filtre = tous les profils)

### L'email n'est pas envoyé
- Vérifier que l'adresse email est valide
- Vérifier les suppressions (unsubscribed, bounced)
- Vérifier la configuration DKIM/SPF du domaine

### L'event n'apparaît pas
- Vérifier la réponse du script natif (doit inclure `success: true`)
- Vérifier les logs du script (`--verbose` flag pour debug)
- Vérifier la clé API Klaviyo dans `.env`

---

## Maintenance

- **Hebdomadaire:** Vérifier les analytics du flow (open rate, click rate)
- **Mensuel:** Ajuster les contenus basés sur les performances
- **Trimestriel:** A/B test des sujets et timings

---

*Guide créé - Session 104*
*3A Automation - 2025-12-28*
