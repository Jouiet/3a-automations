/**
 * 3A Automation - Ultra Futuristic Scripts
 * Version: 3.0
 * Date: 17 Décembre 2025
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
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // HEADER SCROLL EFFECT
  // ───────────────────────────────────────────────────────────────────────────
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.background = 'rgba(25, 30, 53, 0.98)';
      header.style.boxShadow = '0 4px 30px rgba(79, 186, 241, 0.1)';
    } else {
      header.style.background = 'rgba(25, 30, 53, 0.9)';
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FORM HANDLING - Multi-Fallback System
  // Priorité: 1. Webhook n8n → 2. Mailto fallback
  // ───────────────────────────────────────────────────────────────────────────
  const form = document.getElementById('audit-form');
  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');

  // Configuration
  const FORM_CONFIG = {
    webhookUrl: 'https://n8n.srv1168256.hstgr.cloud/webhook/audit-request',
    fallbackEmail: 'contact@3a-automation.com',
    timeout: 5000 // 5 seconds
  };

  if (form) {
    // Set timestamp on load
    const timestampField = document.getElementById('form-timestamp');
    if (timestampField) {
      timestampField.value = new Date().toISOString();
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const btnText = submitBtn.querySelector('.btn-text');
      const originalText = btnText ? btnText.textContent : submitBtn.textContent;

      // Hide previous messages
      if (formSuccess) formSuccess.style.display = 'none';
      if (formError) formError.style.display = 'none';

      // Loading state
      if (btnText) {
        btnText.textContent = 'Envoi en cours...';
      } else {
        submitBtn.textContent = 'Envoi en cours...';
      }
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Add metadata
      data.timestamp = new Date().toISOString();
      data.userAgent = navigator.userAgent;
      data.referrer = document.referrer || 'direct';
      data.page = window.location.href;

      // Try webhook first, then fallback to mailto
      let success = false;

      try {
        // Method 1: Try webhook with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FORM_CONFIG.timeout);

        const response = await fetch(FORM_CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          success = true;
        }
      } catch (webhookError) {
        console.log('Webhook unavailable, using mailto fallback');
      }

      // Fallback: Open mailto with pre-filled data
      if (!success) {
        const subject = encodeURIComponent(`[3A Automation] ${data.subject || 'Demande'} - ${data.name}`);
        const body = encodeURIComponent(
          `Nom: ${data.name || 'Non spécifié'}\n` +
          `Email: ${data.email || 'Non spécifié'}\n` +
          `Entreprise: ${data.company || 'Non spécifié'}\n` +
          `Site web: ${data.website || 'Non spécifié'}\n` +
          `Sujet: ${data.subject || 'Non spécifié'}\n` +
          `Plateforme: ${data.platform || 'Non spécifié'}\n` +
          `Pays: ${data.country || 'Non spécifié'}\n` +
          `\n--- Message ---\n${data.message || data.challenges || 'Pas de message'}\n` +
          `\n--- Métadonnées ---\n` +
          `Source: ${data.source || 'website'}\n` +
          `Page: ${data.page}\n` +
          `Date: ${data.timestamp}`
        );

        // Open mailto
        window.location.href = `mailto:${FORM_CONFIG.fallbackEmail}?subject=${subject}&body=${body}`;
        success = true; // Consider it success since user can send
      }

      if (success) {
        // Success
        form.style.display = 'none';
        if (formSuccess) {
          formSuccess.style.display = 'flex';
          formSuccess.classList.add('animated');
        }

        // Track conversion (GA4)
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'engagement',
            event_label: data.subject || data.service || 'audit-request',
            value: 1
          });
        }

        // Reset form for potential future use
        form.reset();
      } else {
        // Show error message
        if (formError) {
          formError.style.display = 'flex';
          formError.classList.add('animated');
        }
      }

      // Restore button
      if (btnText) {
        btnText.textContent = originalText;
      } else {
        submitBtn.textContent = originalText;
      }
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCROLL-TRIGGERED ANIMATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('[data-animate]');
    const staggerElements = document.querySelectorAll('[data-animate-stagger]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
    staggerElements.forEach(el => observer.observe(el));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // ELEMENT ANIMATIONS ON SCROLL
  // ───────────────────────────────────────────────────────────────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe various elements for fade-in animation
  const animatedElements = document.querySelectorAll(
    '.service-card-ultra, .flywheel-stage, .process-step-ultra, .tech-item, .feature-card, .flow-card'
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    fadeInObserver.observe(el);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // STAT COUNTER ANIMATION
  // ───────────────────────────────────────────────────────────────────────────
  const animateCounter = (element, target) => {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      element.textContent = current + (element.dataset.suffix || '');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target + (element.dataset.suffix || '');
      }
    };

    requestAnimationFrame(updateCounter);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        if (target) {
          animateCounter(entry.target, target);
        }
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number-ultra[data-count]').forEach(stat => {
    statObserver.observe(stat);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FLYWHEEL STAGE HOVER EFFECTS
  // ───────────────────────────────────────────────────────────────────────────
  const flywheelStages = document.querySelectorAll('.flywheel-stage');
  const flywheelHub = document.querySelector('.flywheel-center-hub');

  flywheelStages.forEach(stage => {
    stage.addEventListener('mouseenter', () => {
      // Highlight the stage
      flywheelStages.forEach(s => {
        if (s !== stage) {
          s.style.opacity = '0.5';
        }
      });

      // Pulse the hub
      if (flywheelHub) {
        flywheelHub.style.transform = 'translate(-50%, -50%) scale(1.1)';
      }
    });

    stage.addEventListener('mouseleave', () => {
      flywheelStages.forEach(s => {
        s.style.opacity = '1';
      });

      if (flywheelHub) {
        flywheelHub.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TECH ORBITAL PAUSE ON HOVER
  // ───────────────────────────────────────────────────────────────────────────
  const orbitalRings = document.querySelectorAll('.orbital-ring');

  orbitalRings.forEach(ring => {
    ring.addEventListener('mouseenter', () => {
      ring.style.animationPlayState = 'paused';
    });

    ring.addEventListener('mouseleave', () => {
      ring.style.animationPlayState = 'running';
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PARALLAX EFFECT FOR CYBER GLOWS
  // ───────────────────────────────────────────────────────────────────────────
  const glows = document.querySelectorAll('.cyber-glow');

  if (glows.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;

      glows.forEach((glow, index) => {
        const speed = 0.1 + (index * 0.05);
        glow.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FORM FIELD ANIMATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const formFields = document.querySelectorAll('.form-field input, .form-field textarea');

  formFields.forEach(field => {
    field.addEventListener('focus', () => {
      field.parentElement.classList.add('focused');
    });

    field.addEventListener('blur', () => {
      if (!field.value) {
        field.parentElement.classList.remove('focused');
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TYPING EFFECT FOR HERO TITLE (Optional)
  // ───────────────────────────────────────────────────────────────────────────
  const typeWriter = (element, text, speed = 50) => {
    let i = 0;
    element.textContent = '';

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };

    type();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CURSOR GLOW EFFECT (Subtle)
  // ───────────────────────────────────────────────────────────────────────────
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  cursorGlow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(79, 186, 241, 0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
  `;
  document.body.appendChild(cursorGlow);

  let cursorTimeout;
  document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
    cursorGlow.style.opacity = '1';

    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
      cursorGlow.style.opacity = '0';
    }, 1000);
  });

  // Hide cursor glow on mobile
  if ('ontouchstart' in window) {
    cursorGlow.style.display = 'none';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COOKIE CONSENT - RGPD COMPLIANCE
  // ───────────────────────────────────────────────────────────────────────────
  const cookieBanner = document.getElementById('cookie-consent');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieReject = document.getElementById('cookie-reject');

  const COOKIE_CONSENT_KEY = '3a_cookie_consent';
  const COOKIE_CONSENT_DURATION = 365; // days

  // Check if user already made a choice
  const cookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (!cookieConsent && cookieBanner) {
    // Show banner after 1 second
    setTimeout(() => {
      cookieBanner.style.display = 'block';
    }, 1000);
  } else if (cookieConsent === 'accepted') {
    // Enable tracking
    enableTracking();
  }

  function setCookieConsent(value) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    if (cookieBanner) {
      cookieBanner.style.animation = 'slideUp 0.3s ease reverse forwards';
      setTimeout(() => {
        cookieBanner.style.display = 'none';
      }, 300);
    }
  }

  function enableTracking() {
    // Enable GA4 tracking
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }

    // Push consent event to dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'cookie_consent_granted',
      'consent_type': 'all'
    });
  }

  function disableTracking() {
    // Disable GA4 tracking
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    }

    // Push rejection event to dataLayer
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

  // ───────────────────────────────────────────────────────────────────────────
  // INITIALIZE
  // ───────────────────────────────────────────────────────────────────────────
  animateOnScroll();

  console.log('3A Automation - Ultra Futuristic Site Initialized');

});
