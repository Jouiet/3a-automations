/**
 * 3A Automation - Geo-Locale Module
 * Auto-detects user location and applies appropriate language
 * Prices are fixed per currency (no dynamic conversion)
 *
 * Markets:
 * - Morocco/Maghreb: French + MAD
 * - Europe: French + EUR
 * - International: English + USD
 *
 * @version 6.0.0
 * @date 2026-02-06
 */
(function () {
  'use strict';

  const GeoLocale = {

    // Country to locale mapping (comprehensive coverage)
    locales: {
      // 1. Morocco -> French + MAD
      'MA': { lang: 'fr', currency: 'MAD', region: 'maghreb' },

      // 2. Maghreb -> French + EUR
      'DZ': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'TN': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LY': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'MR': { lang: 'fr', currency: 'EUR', region: 'europe' },

      // 3. Europe -> French + EUR
      'FR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'BE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CH': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LU': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'MC': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'DE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'IT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'ES': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'PT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'NL': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'AT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'IE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'GR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'PL': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CZ': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'RO': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'HU': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'DK': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'NO': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'FI': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'HR': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'BG': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SK': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'SI': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LT': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'LV': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'EE': { lang: 'fr', currency: 'EUR', region: 'europe' },

      // 4. Francophone Africa -> French + EUR
      'SN': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CI': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CM': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CG': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'CD': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'ML': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'BF': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'NE': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'TD': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'GN': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'GA': { lang: 'fr', currency: 'EUR', region: 'europe' },
      'MG': { lang: 'fr', currency: 'EUR', region: 'europe' },

      // 5. MENA Gulf -> English + USD
      'AE': { lang: 'en', currency: 'USD', region: 'international' },
      'SA': { lang: 'en', currency: 'USD', region: 'international' },
      'QA': { lang: 'en', currency: 'USD', region: 'international' },
      'KW': { lang: 'en', currency: 'USD', region: 'international' },
      'BH': { lang: 'en', currency: 'USD', region: 'international' },
      'OM': { lang: 'en', currency: 'USD', region: 'international' },
      'JO': { lang: 'en', currency: 'USD', region: 'international' },
      'IQ': { lang: 'en', currency: 'USD', region: 'international' },
      'EG': { lang: 'en', currency: 'USD', region: 'international' },
      'LB': { lang: 'en', currency: 'USD', region: 'international' },

      // 6. Anglophone -> English + USD
      'GB': { lang: 'en', currency: 'USD', region: 'international' },
      'US': { lang: 'en', currency: 'USD', region: 'international' },
      'CA': { lang: 'en', currency: 'USD', region: 'international' },
      'AU': { lang: 'en', currency: 'USD', region: 'international' },
      'NZ': { lang: 'en', currency: 'USD', region: 'international' },
      'IN': { lang: 'en', currency: 'USD', region: 'international' },
      'NG': { lang: 'en', currency: 'USD', region: 'international' },
      'ZA': { lang: 'en', currency: 'USD', region: 'international' },
      'KE': { lang: 'en', currency: 'USD', region: 'international' },
      'GH': { lang: 'en', currency: 'USD', region: 'international' },
      'SG': { lang: 'en', currency: 'USD', region: 'international' },
      'PH': { lang: 'en', currency: 'USD', region: 'international' },
      'MY': { lang: 'en', currency: 'USD', region: 'international' },
    },

    // Default locale for unknown countries
    defaultLocale: { lang: 'en', currency: 'USD', region: 'international' },

    // Storage key
    storageKey: '3a-locale',

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
      // Update data-currency attribute for CSS switching
      document.documentElement.setAttribute('data-currency', currency);
      document.dispatchEvent(new CustomEvent('currency-changed', { detail: { currency } }));
    },

    /**
     * Initialize and return detected/saved locale
     */
    async init() {
      // Always detect current timezone (may change if user travels)
      const currentTimezone = this.getTimezone();

      // Priority 1: Saved preference (but update timezone)
      const saved = this.getSavedLocale();
      if (saved) {
        saved.timezone = currentTimezone; // Always use current timezone
        return saved;
      }

      // Priority 2+ uses currentTimezone
      const timezone = currentTimezone;

      // Priority 2: Geo-detection
      const country = await this.detectCountry();
      if (country) {
        const locale = { ...this.getLocale(country) };
        locale.country = country;
        locale.source = 'geo';
        locale.timezone = timezone;
        this.saveLocale(locale);
        return locale;
      }

      // Priority 3: Browser language
      const browserLang = navigator.language?.substring(0, 2) || 'en';
      let locale;

      if (browserLang === 'fr') {
        locale = { lang: 'fr', currency: 'EUR', region: 'europe', source: 'browser', timezone };
      } else {
        locale = { ...this.defaultLocale, source: 'default', timezone };
      }

      return locale;
    },

    /**
     * Get user timezone using Intl API (reliable, no API call needed)
     * Falls back to UTC offset if Intl unavailable
     */
    getTimezone() {
      try {
        // Modern browsers: use Intl API
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone) {
          return {
            iana: timezone, // e.g., "Africa/Casablanca", "Europe/Paris"
            offset: new Date().getTimezoneOffset(), // minutes from UTC
            offsetHours: -new Date().getTimezoneOffset() / 60 // e.g., +1, -5
          };
        }
      } catch (e) {
        // Fallback for old browsers
      }

      // Fallback: just use offset
      const offset = new Date().getTimezoneOffset();
      return {
        iana: null,
        offset: offset,
        offsetHours: -offset / 60
      };
    },

    /**
     * Check if should show English version
     */
    shouldShowEnglish(locale) {
      return locale.lang === 'en' || locale.region === 'international';
    },

    /**
     * Save locale preference manually (blocks auto-redirect)
     */
    saveManualLocale(lang) {
      const locale = this.getSavedLocale() || { ...this.defaultLocale };
      locale.lang = lang;
      locale.source = 'manual';
      // Force region consistency
      locale.region = (lang === 'fr') ? 'europe' : 'international';
      this.saveLocale(locale);
      console.log(`[GeoLocale] Manual override saved: ${lang}`);
    },

    /**
     * Redirect to appropriate version if needed
     */
    redirectIfNeeded(locale) {
      if (locale.source === 'manual') {
        console.log('[GeoLocale] Skipping auto-redirect due to manual override');
        return;
      }

      const path = window.location.pathname;
      const isEnPage = path.includes('/en/');

      const shouldBeEn = locale.lang === 'en' || locale.region === 'international';
      const shouldBeFr = !shouldBeEn;

      // Logic: 
      // 1. Should be EN but not on EN page
      if (shouldBeEn && !isEnPage) {
        let newPath = '/en' + (path.startsWith('/') ? path : '/' + path);
        window.location.href = newPath.replace(/\/+/g, '/');
      }
      // 2. Should be FR but on EN page
      else if (shouldBeFr && isEnPage) {
        let newPath = path.replace('/en/', '/');
        window.location.href = newPath || '/';
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

      // Perform redirection if needed
      GeoLocale.redirectIfNeeded(locale);

      document.dispatchEvent(new CustomEvent('geo-locale-ready', { detail: locale }));
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FIX SESSION 183bis: Intercept ALL .lang-switch clicks to save manual choice
    // Without this, geo-locale redirects users BACK after clicking language switch
    // ═══════════════════════════════════════════════════════════════════════════
    document.addEventListener('click', function(e) {
      const link = e.target.closest('.lang-switch, .lang-link');
      if (!link) return;

      const href = link.getAttribute('href') || '';

      // Determine target language from href
      let targetLang = 'fr'; // default
      if (href.includes('/en/') || href.startsWith('/en')) {
        targetLang = 'en';
      }

      // Save manual override BEFORE navigation happens
      console.log(`[GeoLocale] Manual switch to: ${targetLang}`);
      GeoLocale.saveManualLocale(targetLang);

      // Let the click proceed normally (browser will navigate)
    });
  }
})();
