/**
 * 3A Automation - Lightweight Scripts
 * Version: 1.0 - Performance Optimized
 * Date: 18 Décembre 2025
 * For secondary pages (no heavy animations)
 */

document.addEventListener('DOMContentLoaded', function() {

  // ───────────────────────────────────────────────────────────────────────────
  // MOBILE NAVIGATION TOGGLE
  // ───────────────────────────────────────────────────────────────────────────
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when clicking a nav link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SMOOTH SCROLL
  // ───────────────────────────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // HEADER SCROLL EFFECT (simplified)
  // ───────────────────────────────────────────────────────────────────────────
  const header = document.querySelector('.header');

  if (header) {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset;
          if (scrollY > 100) {
            header.style.background = 'rgba(25, 30, 53, 0.98)';
            header.style.boxShadow = '0 4px 30px rgba(79, 186, 241, 0.1)';
          } else {
            header.style.background = 'rgba(25, 30, 53, 0.95)';
            header.style.boxShadow = 'none';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COOKIE CONSENT - RGPD COMPLIANCE
  // ───────────────────────────────────────────────────────────────────────────
  const cookieBanner = document.getElementById('cookie-consent');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieReject = document.getElementById('cookie-reject');

  const COOKIE_CONSENT_KEY = '3a_cookie_consent';

  // Check if user already made a choice
  const cookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (!cookieConsent && cookieBanner) {
    setTimeout(() => {
      cookieBanner.style.display = 'block';
    }, 1000);
  } else if (cookieConsent === 'accepted') {
    enableTracking();
  }

  function setCookieConsent(value) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    if (cookieBanner) {
      cookieBanner.style.display = 'none';
    }
  }

  function enableTracking() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'cookie_consent_granted',
      'consent_type': 'all'
    });
  }

  function disableTracking() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'cookie_consent_rejected',
      'consent_type': 'none'
    });
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      setCookieConsent('accepted');
      enableTracking();
    });
  }

  if (cookieReject) {
    cookieReject.addEventListener('click', () => {
      setCookieConsent('rejected');
      disableTracking();
    });
  }

  console.log('3A Automation - Lite Scripts v1.0 Initialized');

});
