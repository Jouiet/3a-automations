# Standards de Code - JO-AAA

## Langage et Format

### JavaScript/Node.js
- Format: CommonJS (.cjs) pour compatibilité Node.js
- Indentation: 2 espaces
- Quotes: Single quotes pour strings
- Semicolons: Toujours

### Configuration
- TOUJOURS utiliser process.env pour credentials
- JAMAIS hardcoder tokens, API keys, domaines
- Fichier .env pour configuration locale
- Variables d'environnement préfixées par service (SHOPIFY_*, KLAVIYO_*, etc.)

### Structure Script
```javascript
#!/usr/bin/env node
/**
 * DESCRIPTION DU SCRIPT
 * Date: YYYY-MM-DD
 * Version: X.X
 */

require('dotenv').config();

// Configuration
const CONFIG = {
  apiKey: process.env.SERVICE_API_KEY,
  // ...
};

// Validation
if (!CONFIG.apiKey) {
  console.error('❌ SERVICE_API_KEY non défini');
  process.exit(1);
}

// Main logic
async function main() {
  // ...
}

main().catch(console.error);
```

## Gestion d'Erreurs

- Toujours valider les variables d'environnement au démarrage
- Messages d'erreur clairs avec emoji ❌
- Exit codes appropriés (0 = succès, 1 = erreur)
- Try/catch pour toutes les opérations async

## Output

- Utiliser console.log pour résultats
- Utiliser console.error pour erreurs
- Format: Emoji + message descriptif
- Exemples: ✅ ❌ ⚠️ 📊 🔍 📁

## Tests

- Tester avec données réelles avant déploiement
- Vérifier chaque fonctionnalité individuellement
- Documenter les cas d'usage testés
