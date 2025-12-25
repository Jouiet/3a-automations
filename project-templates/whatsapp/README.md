# WhatsApp Business Templates

> Generic WhatsApp automation via Meta Business API

## Prerequisites

1. **Meta Business Account** - https://business.facebook.com
2. **WhatsApp Business API** - https://developers.facebook.com/docs/whatsapp
3. **Approved Message Templates** - Required for automated messages

## Available Templates

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `booking-confirmation-generic.json` | Instant booking confirmation | Webhook |
| `booking-reminders-generic.json` | 24h + 1h reminders | Schedule |

## Setup Guide

### 1. Meta Business Setup

1. Create Meta Business Account
2. Add WhatsApp Business API
3. Get Phone Number ID and Access Token
4. Create message templates (see below)

### 2. Create WhatsApp Templates

In Meta Business Suite > WhatsApp > Message Templates:

**booking_confirmation (French)**
```
Category: UTILITY
Body: Bonjour {{1}}, votre rendez-vous pour {{2}} est confirme le {{3}} a {{4}}. A bientot !
```

**booking_reminder_24h (French)**
```
Category: UTILITY
Body: Bonjour {{1}}, rappel: votre {{2}} est demain, le {{3}} a {{4}}. A demain !
```

**booking_reminder_1h (French)**
```
Category: UTILITY
Body: {{1}}, votre {{2}} commence dans 1 heure ({{3}} a {{4}}). On vous attend !
```

### 3. Environment Variables

```env
# Required
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx

# For reminders
BOOKING_API_URL=https://your-api.com/bookings
BOOKING_API_KEY=your-api-key

# Optional
BRAND_NAME=YourBrand
PHONE_PREFIX=33
LOCALE=fr-FR
TIMEZONE=Europe/Paris
TEMPLATE_LANGUAGE=fr
```

### 4. Import to n8n

```bash
n8n import:workflow --input=booking-confirmation-generic.json
n8n import:workflow --input=booking-reminders-generic.json
```

## Webhook Payload Format

### Booking Confirmation

```bash
POST /webhook/whatsapp/booking/confirm
Content-Type: application/json

{
  "name": "Jean Dupont",
  "phone": "+33612345678",
  "date": "2025-01-15",
  "time": "14:30",
  "service": "Consultation",
  "notes": "Premier rendez-vous"
}
```

### Booking API Response (for reminders)

Your booking API should return:

```json
{
  "bookings": [
    {
      "id": "booking-123",
      "name": "Jean Dupont",
      "phone": "+33612345678",
      "datetime": "2025-01-15T14:30:00",
      "service": "Consultation",
      "reminder24hSent": false,
      "reminder1hSent": false
    }
  ]
}
```

## Multi-Language Support

### English Templates

**booking_confirmation (English)**
```
Category: UTILITY
Body: Hi {{1}}, your {{2}} is confirmed for {{3}} at {{4}}. See you then!
```

**booking_reminder_24h (English)**
```
Category: UTILITY
Body: Hi {{1}}, reminder: your {{2}} is tomorrow, {{3}} at {{4}}. See you soon!
```

Update env:
```env
TEMPLATE_LANGUAGE=en
LOCALE=en-US
```

## Cost Estimates

| Message Type | Cost (approx) |
|--------------|---------------|
| Template (business-initiated) | $0.05 - $0.15 |
| User-initiated reply | Free (24h window) |

## Troubleshooting

### Template Not Approved

- Check for prohibited content
- Ensure utility category is appropriate
- Wait 24-48h for review

### Messages Not Delivered

- Verify phone number format (E.164: +33612345678)
- Check template variable count matches
- Verify access token is valid

### Rate Limits

- Tier 1: 1,000 messages/day
- Tier 2: 10,000 messages/day
- Higher tiers available with history

## Support

- Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
- 3A Automation: contact@3a-automation.com
