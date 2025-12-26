# Voice AI Architecture - 3A Automation
## Version: 1.0.0 | Date: 2025-12-26 | Session: 96

---

## RÉSUMÉ EXÉCUTIF

### État Actuel (Vérifié 26/12/2025)

| Composant | Status | Notes |
|-----------|--------|-------|
| Voice Widget Web | ✅ OPÉRATIONNEL | Web Speech API, 33 keywords, booking flow |
| Dial.Plus Agent | ✅ OPÉRATIONNEL | +1 775 254 7428, knowledge base uploadée |
| Grok Voice Phone | ❌ BLOQUÉ | xAI API OK, carrier manquant |
| Knowledge Base | ✅ UPLOADÉ | dialplus-knowledge-base.txt sur Dial.Plus |

---

## ARCHITECTURE VOIX

### 1. Voice Widget Web (Browser-Based)

```
TECHNOLOGIE: Web Speech API (natif browser, GRATUIT)
STATUS: LIVE sur 28 pages

Fichiers:
├── landing-page-hostinger/voice-assistant/voice-widget.js
├── landing-page-hostinger/voice-assistant/voice-widget-en.js
├── landing-page-hostinger/voice-assistant/knowledge.json
└── landing-page-hostinger/voice-assistant/knowledge-base.js

Fonctionnalités:
├── Reconnaissance vocale (SpeechRecognition API)
├── Synthèse vocale (SpeechSynthesis API)
├── 33 keywords FR + EN
├── Booking flow intégré (Google Apps Script)
├── Fallback texte pour Firefox/Safari
└── GA4 tracking intégré

Limitations:
├── Nécessite navigateur compatible (Chrome/Edge principalement)
├── Pas de téléphonie (web uniquement)
└── Réponses par keyword matching (pas d'IA conversationnelle)
```

### 2. Dial.Plus Agent (Usage Interne)

```
PLATEFORME: https://app.dial.plus
PHONE: +1 775 254 7428
PRICING: $19-99/mois selon plan
STATUS: OPÉRATIONNEL pour 3A

Fonctionnalités Dial.Plus:
├── AI Agent intégré
├── Réponses basées sur knowledge base uploadé
├── Analytics d'appels
├── Transfert vers humain
├── 40+ pays disponibles
└── Multi-langue automatique

Usage:
├── Appels entrants 3A Automation
├── Qualification leads
├── Prise de rendez-vous
└── Support client de base

⚠️ LIMITATION: Pas d'API développeur pour white-label/revente
```

### 3. Grok Voice Phone (Pour Clients - À DÉPLOYER)

```
STATUS: BLOQUÉ - Carrier téléphonique manquant

xAI Grok Voice Agent API:
├── Lancé: 17 décembre 2025
├── Prix: $0.05/minute flat rate
├── Latence: <1 seconde TTFA
├── Langues: 100+ avec accents natifs
├── Benchmark: #1 Big Bench Audio
├── Voix: Sal, Rex, Eve, Leo, Mika, Valentin
└── XAI_API_KEY: ✅ Configuré dans .env

Formats Audio Supportés:
├── PCM (Linear16): 8kHz-48kHz, haute qualité
├── G.711 μ-law: Optimisé téléphonie US
└── G.711 A-law: Standard téléphonie internationale

Carriers Supportés Nativement:
├── Twilio (intégration native)
└── Vonage (intégration native)

Alternatives Compatibles:
├── Telnyx ($0.005/min, réseau propre, -25-45% vs Twilio)
├── Plivo (-35% vs Twilio, HIPAA ready)
├── SignalWire (programmabilité profonde)
└── Bandwidth (carrier ownership, 911)

Workflow n8n Prêt:
├── Fichier: automations/agency/n8n-workflows/grok-voice-telephony.json
├── Webhooks: /voice/inbound, /voice/stream, /voice/booking-complete
├── Intégration: Google Calendar + WhatsApp confirmation
└── Status: Non déployé (carrier manquant)
```

---

## COMPARATIF CARRIERS

Source: [Twilio Alternatives 2025](https://textellent.com/blog/twilio-alternatives/)

| Carrier | Prix/min | Avantage Principal | Idéal Pour |
|---------|----------|-------------------|------------|
| **Telnyx** | $0.005 | Réseau propre, -25-45% | IVR complexe, haute qualité |
| **Plivo** | -35% vs Twilio | Simple, HIPAA ready | Startups, volumes modérés |
| **SignalWire** | Variable | Programmabilité profonde | Équipes dev avancées |
| **Bandwidth** | Variable | Carrier ownership, 911 | Apps publiques, ridesharing |
| Twilio | ~$0.01+ | Écosystème, documentation | Standard industry |
| Vonage | Variable | Historique entreprise | Clients existants Vonage |

**Recommandation 3A:** Telnyx pour le meilleur rapport qualité/prix/contrôle

---

## KNOWLEDGE BASE DIAL.PLUS

### Fichier Créé

```
automations/shared-components/dialplus-knowledge-base.json
```

### Contenu

| Section | Description |
|---------|-------------|
| identity | Nom, email, site, téléphone |
| positioning | Cible, différenciateur, proposition de valeur |
| pricing | 3 packs setup + 2 retainers + conditions |
| automations | 77 automatisations en 10 catégories |
| industries | 5 secteurs avec services spécifiques |
| process | 4 étapes sans appel obligatoire |
| faq | 9 questions fréquentes avec réponses |
| objection_handling | 6 objections courantes avec réponses |
| booking | Jours, heures, durée, URL |
| call_flow | Script d'appel structuré |
| voice_agent_instructions | Ton, limites, redirections |

### Comment Uploader sur Dial.Plus

1. Aller sur https://app.dial.plus
2. Sélectionner l'agent 3A Automation
3. Section "Knowledge Base" ou "Documents"
4. Uploader `dialplus-knowledge-base.json`
5. Tester avec un appel de vérification

---

## STRATÉGIE RECOMMANDÉE

### Usage Interne 3A

```
Dial.Plus (+1 775 254 7428)
├── Qualifier les leads entrants
├── Prendre des RDV
├── Répondre aux questions basiques
└── Transférer vers Jonathan si complexe
```

### Produit à Vendre aux Clients

```
Option A: Setup Dial.Plus (No-Code)
├── Configurer un agent Dial.Plus pour le client
├── Uploader leur knowledge base personnalisée
├── Former le client à l'interface
├── Prix suggéré: Pack Quick Win (390€) + retainer optionnel
└── Marge: 100% (Dial.Plus payé par le client)

Option B: Grok Voice + Telnyx (Full Control)
├── Acheter numéro Telnyx pour le client
├── Déployer workflow n8n grok-voice-telephony.json
├── Knowledge base sur-mesure
├── White-label complet
├── Prix suggéré: Pack Growth (1399€)
└── Coût récurrent: ~$0.06/min (Grok $0.05 + Telnyx $0.01)
```

---

## ACTIONS REQUISES

| # | Action | Priorité | Status |
|---|--------|----------|--------|
| 1 | Uploader knowledge base sur Dial.Plus | P0 | ✅ FAIT |
| 2 | Tester appels entrants Dial.Plus | P0 | 🔄 À TESTER |
| 3 | Créer compte Telnyx (alternative Twilio) | P1 | ⏳ Pending |
| 4 | Configurer workflow n8n avec Telnyx | P1 | ⏳ Pending |
| 5 | Tester appel Grok Voice end-to-end | P1 | ⏳ Pending |
| 6 | Documenter procédure setup client | P2 | ⏳ Pending |

---

## RÉFÉRENCES

- [xAI Grok Voice Agent API](https://x.ai/news/grok-voice-agent-api) - Documentation officielle
- [Dial.Plus](https://www.dial.plus) - Plateforme AI Phone
- [Telnyx Voice API](https://telnyx.com/products/voice-api) - Alternative Twilio
- [Plivo vs Twilio](https://www.plivo.com/blog/telnyx-vs-twilio/) - Comparatif

---

*Document créé Session 96 - 26/12/2025*
*Source de vérité: automations/shared-components/dialplus-knowledge-base.json*
