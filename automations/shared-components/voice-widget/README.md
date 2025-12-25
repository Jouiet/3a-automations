# Voice Widget - Generic Component

Composant voice widget generique et configurable pour integration multi-projets.

## Structure

```
voice-widget/
├── config.example.js         # Template de configuration
├── config-3a-automation.js   # Config pour 3A Automation
├── config-cinematicads.js    # Config pour CinematicAds
└── README.md                 # Cette doc
```

## Usage

### 1. Copier la configuration

```bash
cp config.example.js config.js
```

### 2. Personnaliser config.js

Modifier les sections:
- `BRAND`: Nom, URL, email
- `COLORS`: Theme couleurs
- `TEXT_FR` / `TEXT_EN`: Messages UI
- `PROMPT_FR` / `PROMPT_EN`: System prompts
- `KNOWLEDGE`: Base de connaissances

### 3. Integrer dans le projet

```html
<script src="config.js"></script>
<script src="voice-widget-generic.js"></script>
```

## Configurations Pre-faites

### 3A Automation
- Fichier: `config-3a-automation.js`
- Couleurs: Bleu (#4FBAF1)
- 77 automations, 10 categories

### CinematicAds
- Fichier: `config-cinematicads.js`
- Couleurs: Violet (#8B5CF6)
- 4 workflows video IA

## Migration depuis voice-widget.js

Le widget original 3A (`landing-page-hostinger/voice-assistant/voice-widget.js`)
contient la configuration hardcodee. Pour migrer:

1. Extraire CONFIG vers `config-3a-automation.js`
2. Remplacer les constantes par `VOICE_WIDGET_CONFIG.*`
3. Charger config.js avant le widget

## API Backend

Le widget attend une API compatible avec:

```
POST /api/voice
Content-Type: application/json

{
  "message": "User message",
  "language": "fr"
}

Response:
{
  "response": "Assistant response",
  "success": true
}
```

## Evenements GA4

Evenements trackes automatiquement:
- `voice_widget_open`: Widget ouvert
- `voice_widget_message`: Message envoye
- `voice_widget_error`: Erreur
- `voice_widget_booking`: Demande RDV

## Prochaines etapes

- [ ] Creer `voice-widget-generic.js` (widget configurable)
- [ ] Deployer sur CinematicAds
- [ ] Ajouter support WebSocket pour Grok Voice
