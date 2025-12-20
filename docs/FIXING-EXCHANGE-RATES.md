# DOCUMENTATION: Correction des Taux de Change Hardcodés

## Date: 20-12-2025

---

## 1. Problème

Le fichier `landing-page-hostinger/geo-locale.js` contient un objet `exchangeRates` avec des taux de change inscrits en dur.

```javascript
// Fichier: landing-page-hostinger/geo-locale.js

// ...
exchangeRates: {
  EUR: 1.00,
  USD: 1.08,
  MAD: 10.90,
  GBP: 0.83
},
// ...
```

Ceci représente un risque majeur car les prix affichés aux utilisateurs internationaux peuvent être incorrects si ces taux ne sont pas mis à jour manuellement et fréquemment.

## 2. Solution

La solution consiste à remplacer ces valeurs statiques par un appel à une API de taux de change externe, avec un système de cache pour ne pas surcharger l'API et pour garantir un affichage rapide.

Nous utiliserons l'API gratuite de `fawazahmed0/exchange-api` qui ne requiert pas de clé d'API.

L'URL de l'API est : `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json`

## 3. Implémentation (Guide)

Voici les étapes pour modifier le fichier `geo-locale.js`.

### Étape 1: Ajouter une fonction pour récupérer les taux de change

Ajoutez une nouvelle fonction `fetchExchangeRates` à l'objet `GeoLocale`. Cette fonction tentera de récupérer les taux depuis le `localStorage` (cache). Si le cache est vide ou expiré, elle appellera l'API externe.

```javascript
// ... (dans l'objet GeoLocale)

/**
 * Fetch exchange rates from API or cache
 */
async fetchExchangeRates() {
  const cacheKey = '3a-exchange-rates';
  const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedData && (new Date().getTime() - cachedData.timestamp < cacheDuration)) {
      console.log('Using cached exchange rates.');
      this.exchangeRates = cachedData.rates;
      return;
    }
  } catch (e) {
    // Cache is invalid or doesn't exist
  }

  try {
    console.log('Fetching fresh exchange rates...');
    const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();

    // L'API retourne les taux sous la clé "eur"
    const rates = {
      EUR: 1.00,
      USD: data.eur.usd,
      MAD: data.eur.mad,
      GBP: data.eur.gbp,
    };
    
    this.exchangeRates = rates;
    
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: new Date().getTime(),
      rates: rates
    }));

  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback static rates.', error);
    // En cas d'erreur, on garde les taux hardcodés comme solution de secours
  }
},

// ... (reste de l'objet GeoLocale)
```

### Étape 2: Modifier la fonction `init` pour appeler `fetchExchangeRates`

La fonction `init` doit être mise à jour pour s'assurer que les taux de change sont récupérés avant de faire toute autre chose.

```javascript
// ... (dans l'objet GeoLocale)

/**
 * Initialize and return detected/saved locale
 */
async init() {
  // D'ABORD: récupérer les taux de change
  await this.fetchExchangeRates();

  // Priority 1: Saved preference
  const saved = this.getSavedLocale();
  if (saved) {
    this.updatePrices(saved.currency);
    return saved;
  }

  // Priority 2: Geo-detection
  const country = await this.detectCountry();
  if (country) {
    const locale = { ...this.getLocale(country) };
    locale.country = country;
    locale.source = 'geo';
    this.saveLocale(locale);
    this.updatePrices(locale.currency);
    return locale;
  }

  // Priority 3: Browser language
  const browserLang = navigator.language?.substring(0, 2) || 'en';
  const locale = browserLang === 'fr'
    ? { lang: 'fr', currency: 'EUR', region: 'europe', source: 'browser' }
    : { ...this.defaultLocale, source: 'default' };

  this.updatePrices(locale.currency);
  return locale;
},

// ... (reste de l'objet GeoLocale)
```

### Code Final Recommandé

Voici à quoi ressemblerait le début du fichier `geo-locale.js` après modification. La section `exchangeRates` statique est conservée comme *fallback* en cas d'échec de l'appel API.

```javascript
(function() {
  'use strict';

  const GeoLocale = {
    // Fallback exchange rates (base: EUR) - Updated 2025-12-19
    exchangeRates: {
      EUR: 1.00,
      USD: 1.08,
      MAD: 10.90,
      GBP: 0.83
    },

    // ... (currencySymbols, locales, etc.)

    /**
     * Fetch exchange rates from API or cache
     */
    async fetchExchangeRates() {
      const cacheKey = '3a-exchange-rates';
      const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

      try {
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (cachedData && (new Date().getTime() - cachedData.timestamp < cacheDuration)) {
          console.log('Using cached exchange rates.');
          this.exchangeRates = cachedData.rates;
          return;
        }
      } catch (e) {
        // Cache is invalid or doesn't exist
      }

      try {
        console.log('Fetching fresh exchange rates...');
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');
        if (!response.ok) throw new Error('Failed to fetch rates');
        const data = await response.json();

        // L'API retourne les taux sous la clé "eur"
        const rates = {
          EUR: 1.00,
          USD: data.eur.usd,
          MAD: data.eur.mad,
          GBP: data.eur.gbp,
        };
        
        this.exchangeRates = rates;
        
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: new Date().getTime(),
          rates: rates
        }));

      } catch (error) {
        console.error('Failed to fetch exchange rates, using fallback static rates.', error);
        // En cas d'erreur, on garde les taux hardcodés comme solution de secours
      }
    },

    /**
     * Convert amount from EUR to target currency
     */
    convert(amountEUR, toCurrency) {
      // ... (aucune modification nécessaire ici)
    },
    
    // ...

    /**
     * Initialize and return detected/saved locale
     */
    async init() {
      // D'ABORD: récupérer les taux de change
      await this.fetchExchangeRates();

      // ... (le reste de la fonction init comme avant)
    },

    // ... (le reste du fichier)
  };

  // ...
})();
```

Cette approche résout le problème des taux hardcodés tout en étant résiliente (elle se rabat sur les taux statiques en cas d'erreur) et performante (grâce au cache).
