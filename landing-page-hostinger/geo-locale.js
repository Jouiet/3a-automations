/**
 * 3A Automation - Geo-Locale & Currency Module
 * Auto-detects user location and applies appropriate language/currency
 * Includes real-time currency conversion
 *
 * Markets:
 * - Morocco/Maghreb: French + MAD
 * - Europe: French + EUR
 * - International: English + USD
 *
 * @version 2.0.0
 * @date 2025-12-19
 */
(function() {
  'use strict';

  const GeoLocale = {
    // Exchange rates (base: EUR) - Updated 2025-12-20
    // Adjusted for fixed pricing tiers
    exchangeRates: {
      EUR: 1.00,
      USD: 1.15,
      MAD: 10.25,
      GBP: 0.85
    },

    // Rate cache key
    ratesKey: '3a-exchange-rates',
    ratesCacheMs: 24 * 60 * 60 * 1000, // 24 hours

    // Currency symbols
    currencySymbols: {
      EUR: '€',
      USD: '$',
      MAD: 'DH',
      GBP: '£'
    },

    // Country to locale mapping
    locales: {
      // Maghreb → French + MAD
      'MA': { lang: 'fr', currency: 'MAD', region: 'maghreb' },
      'DZ': { lang: 'fr', currency: 'MAD', region: 'maghreb' },
      'TN': { lang: 'fr', currency: 'MAD', region: 'maghreb' },

      // French-speaking Europe → French + EUR
      'FR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'BE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CH': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LU': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'MC': { lang: 'fr', currency: 'EUR', region: 'europe' },

      // Other Europe → French + EUR
      'DE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'AT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'IT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'ES': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'PT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'NL': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'IE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'FI': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'GR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'MT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CY': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SK': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SI': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'EE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LV': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'HR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'PL': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CZ': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'HU': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'RO': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'BG': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'DK': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'NO': { lang: 'fr', currency: 'EUR', region: 'europe' },

      // UK → English + USD
      'GB': { lang: 'en', currency: 'USD', region: 'international' },

      // Canada → French or English + USD
      'CA': { lang: 'fr', currency: 'USD', region: 'international' },

      // Default: International → English + USD
      'US': { lang: 'en', currency: 'USD', region: 'international' },
    },

    // Default locale for unknown countries
    defaultLocale: { lang: 'en', currency: 'USD', region: 'international' },

    // Storage key
    storageKey: '3a-locale',

    /**
     * Convert amount from EUR to target currency
     */
    convert(amountEUR, toCurrency) {
      const rate = this.exchangeRates[toCurrency] || 1;
      return Math.round(amountEUR * rate);
    },

    /**
     * Format price with currency symbol
     */
    formatPrice(amount, currency) {
      const symbol = this.currencySymbols[currency] || currency;
      if (currency === 'MAD') {
        return `${amount.toLocaleString('fr-MA')} ${symbol}`;
      } else if (currency === 'EUR') {
        return `${amount.toLocaleString('fr-FR')}${symbol}`;
      } else {
        return `${symbol}${amount.toLocaleString('en-US')}`;
      }
    },

    /**
     * Get converted and formatted price
     */
    getPrice(amountEUR, currency) {
      const converted = this.convert(amountEUR, currency);
      return this.formatPrice(converted, currency);
    },

    /**
     * Update all prices on page based on currency
     * Elements should have data-price-eur attribute with EUR value
     */
    updatePrices(currency) {
      document.querySelectorAll('[data-price-eur]').forEach(el => {
        const eurAmount = parseFloat(el.dataset.priceEur);
        if (!isNaN(eurAmount)) {
          el.textContent = this.getPrice(eurAmount, currency);
        }
      });
    },

    /**
     * Detect country from IP using ipapi.co (free, no API key)
     */
    async detectCountry() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          return data.country_code || null;
        }
      } catch (e) {
        // Silently fail - will use default
      }
      return null;
    },

    /**
     * Get locale for a country code
     */
    getLocale(countryCode) {
      return this.locales[countryCode] || this.defaultLocale;
    },

    /**
     * Get saved locale preference
     */
    getSavedLocale() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save locale preference
     */
    saveLocale(locale) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(locale));
      } catch (e) {
        // Storage unavailable
      }
    },

    /**
     * Set currency preference manually
     */
    setCurrency(currency) {
      const locale = this.getSavedLocale() || this.defaultLocale;
      locale.currency = currency;
      locale.source = 'manual';
      this.saveLocale(locale);
      this.updatePrices(currency);
      document.dispatchEvent(new CustomEvent('currency-changed', { detail: { currency } }));
    },

    /**
     * Initialize and return detected/saved locale
     */
    async init() {
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

    /**
     * Check if should show English version
     */
    shouldShowEnglish(locale) {
      return locale.lang === 'en' || locale.region === 'international';
    },

    /**
     * Redirect to English version if needed
     */
    redirectIfNeeded(locale, enPath) {
      if (this.shouldShowEnglish(locale) && !window.location.pathname.includes('/en/')) {
        window.location.href = enPath;
      }
    }
  };

  // Expose globally
  window.GeoLocale = GeoLocale;

  // Auto-init if not deferred
  if (!document.currentScript?.hasAttribute('data-defer')) {
    GeoLocale.init().then(locale => {
      document.documentElement.setAttribute('data-locale', JSON.stringify(locale));
      document.documentElement.setAttribute('data-currency', locale.currency);
      document.dispatchEvent(new CustomEvent('geo-locale-ready', { detail: locale }));
    });
  }
})();
