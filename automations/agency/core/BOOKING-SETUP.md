# 3A Automation - Booking System Setup

## Architecture

```
[User] → [booking.html] → [Google Apps Script] → [Google Calendar]
                                              → [Email Confirmation]
```

**100% gratuit, sans serveur externe!**

## Installation (5 minutes)

### 1. Créer le Google Apps Script

1. Aller sur https://script.google.com
2. Cliquer **"Nouveau projet"**
3. Renommer le projet: `3A Booking System`
4. Supprimer le contenu par défaut
5. Copier-coller le contenu de `google-apps-script-booking.js`

### 2. Configurer les permissions

Le script a besoin d'accès à:
- Google Calendar (créer des événements)
- Gmail (envoyer des confirmations)

Ces permissions sont demandées automatiquement au premier déploiement.

### 3. Déployer en Web App

1. Cliquer **"Déployer"** → **"Nouveau déploiement"**
2. Type: **"Application Web"**
3. Configuration:
   - Description: `Booking API v1.0`
   - Exécuter en tant que: **Moi**
   - Accès: **Tout le monde**
4. Cliquer **"Déployer"**
5. **Copier l'URL** (format: `https://script.google.com/macros/s/XXXX/exec`)

### 4. Mettre à jour le site

Modifier `booking.html` et `en/booking.html`:

```javascript
const CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/VOTRE_ID/exec',
  // ...
};
```

### 5. Tester

1. Ouvrir https://3a-automation.com/booking.html
2. Sélectionner une date et un créneau
3. Remplir le formulaire
4. Soumettre
5. Vérifier:
   - Événement créé dans Google Calendar
   - Email de confirmation reçu
   - Email de notification admin reçu

## Configuration avancée

### Modifier les heures d'ouverture

Dans `google-apps-script-booking.js`:

```javascript
BUSINESS_HOURS: {
  1: { start: 9, end: 18 },  // Lundi
  2: { start: 9, end: 18 },  // Mardi
  3: { start: 9, end: 18 },  // Mercredi
  4: { start: 9, end: 18 },  // Jeudi
  5: { start: 9, end: 18 },  // Vendredi
  6: null,                    // Samedi (fermé)
  0: null                     // Dimanche (fermé)
}
```

### Modifier l'email de notification

```javascript
NOTIFICATION_EMAIL: 'votre@email.com'
```

### Modifier la durée des créneaux

```javascript
SLOT_DURATION: 30  // minutes
```

## Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/exec` | Créer une réservation |
| GET | `/exec?action=availability` | Obtenir les créneaux disponibles |
| GET | `/exec?action=health` | Vérifier le status |

## Dépannage

### "Permission denied"
→ Re-déployer et accepter les permissions

### "Script function not found"
→ Vérifier que doPost et doGet existent

### "CORS error"
→ Utiliser `Content-Type: text/plain` dans les requêtes

### Les emails ne partent pas
→ Vérifier le quota Gmail (limite: 100/jour en compte gratuit)

## Coûts

**$0** - Entièrement gratuit avec:
- Google Apps Script
- Google Calendar
- Gmail (100 emails/jour)

## Fichiers

```
automations/agency/core/
├── google-apps-script-booking.js  ← Code à copier dans Apps Script
├── BOOKING-SETUP.md               ← Ce fichier
└── google-calendar-booking.cjs    ← Module Node.js (optionnel)

landing-page-hostinger/
├── booking.html                   ← Page booking FR
└── en/booking.html                ← Page booking EN
```
