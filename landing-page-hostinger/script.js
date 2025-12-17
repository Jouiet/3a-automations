/**
 * AAA Agency - Landing Page Scripts
 * Version: 1.0
 * Date: 17 Décembre 2025
 */

document.addEventListener('DOMContentLoaded', function() {

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
      header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    } else {
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FORM HANDLING
  // ───────────────────────────────────────────────────────────────────────────
  const form = document.querySelector('.contact-form');

  if (form) {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Envoi en cours...';
      submitBtn.disabled = true;

      // Re-enable after form submission (handled by Formspree)
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 3000);
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANIMATION ON SCROLL
  // ───────────────────────────────────────────────────────────────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe cards and steps
  document.querySelectorAll('.service-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

});
