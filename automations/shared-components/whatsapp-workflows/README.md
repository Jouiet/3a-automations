# WhatsApp Workflows - Generic Templates

Workflows n8n generiques pour WhatsApp Business API, configurables via variables d'environnement.

## Structure

```
whatsapp-workflows/
├── booking-confirmation-generic.json  # Confirmation de reservation
├── booking-reminders-generic.json     # Rappels 24h et 1h
└── README.md                          # Cette doc
```

## Prerequis

1. **Compte Meta Business** avec WhatsApp Business API active
2. **n8n instance** avec credentials WhatsApp configures
3. **Templates WhatsApp** approuves par Meta

## Variables d'Environnement

### Requises

| Variable | Description |
|----------|-------------|
| `WHATSAPP_PHONE_NUMBER_ID` | ID du numero WhatsApp Business |
| `WHATSAPP_CRED_ID` | ID des credentials n8n |
| `BOOKING_API_URL` | URL API pour recuperer les reservations |

### Optionnelles

| Variable | Default | Description |
|----------|---------|-------------|
| `TIMEZONE` | UTC | Fuseau horaire |
| `LOCALE` | en-US | Locale pour formatage dates |
| `PHONE_PREFIX` | +1 | Prefixe telephone par defaut |
| `TEMPLATE_NAME` | booking_confirmation | Nom template WhatsApp |
| `TEMPLATE_LANG` | en | Langue template |
| `BRAND_NAME` | Your Brand | Nom de marque |

## Configuration par Projet

### 3A Automation

```bash
TIMEZONE=Africa/Casablanca
LOCALE=fr-FR
PHONE_PREFIX=+212
TEMPLATE_NAME=booking_confirmation
TEMPLATE_LANG=fr
BRAND_NAME=3A Automation
```

### CinematicAds

```bash
TIMEZONE=America/New_York
LOCALE=en-US
PHONE_PREFIX=+1
TEMPLATE_NAME=demo_scheduled
TEMPLATE_LANG=en
BRAND_NAME=CinematicAds
```

## Templates WhatsApp a Creer

### booking_confirmation (FR)

```
Bonjour {{1}}, votre reservation pour {{2}} est confirmee le {{3}}.
A bientot !
- [BRAND_NAME]
```

### demo_scheduled (EN)

```
Hi {{1}}, your {{2}} demo is scheduled for {{3}}.
See you soon!
- [BRAND_NAME]
```

### rappel_24h / reminder_24h

```
Rappel: Votre RDV {{1}} est demain a {{2}}.
---
Reminder: Your {{1}} appointment is tomorrow at {{2}}.
```

### rappel_1h / reminder_1h

```
Votre RDV commence dans {{1}} !
---
Your appointment starts in {{1}}!
```

## Import dans n8n

1. Ouvrir n8n
2. Importer le fichier JSON
3. Configurer les variables d'environnement dans n8n Settings
4. Configurer les credentials WhatsApp
5. Activer le workflow

## Integration avec Booking System

Le workflow attend des donnees au format:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "service": "Consultation",
  "datetime": "2025-12-26T14:00:00Z",
  "id": "booking_123"
}
```

## Prochaines etapes

- [ ] Deployer sur CinematicAds n8n
- [ ] Creer templates WhatsApp pour CinematicAds
- [ ] Configurer API booking CinematicAds
- [ ] Tester flux complet
