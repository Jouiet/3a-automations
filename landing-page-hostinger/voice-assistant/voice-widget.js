/**
 * 3A Automation - Voice Assistant Widget
 * Version: 1.0
 *
 * Widget flottant pour assistant vocal IA
 * Utilise Web Speech API (gratuit) + fallback texte
 *
 * Usage: Ajouter <script src="/voice-assistant/voice-widget.js"></script>
 */

(function() {
  'use strict';

  // Configuration - 3A Automation Branding
  const CONFIG = {
    apiEndpoint: '/voice-assistant/api.php', // Backend API
    welcomeMessage: 'Bonjour ! Je suis l\'assistant 3A Automation. Comment puis-je vous aider ?',
    placeholder: 'Posez votre question...',
    position: 'bottom-right',
    primaryColor: '#4FBAF1',      // 3A Primary Blue
    primaryDark: '#2B6685',       // 3A Primary Dark
    accentColor: '#10B981',       // 3A Accent Green
    darkBg: '#191E35'             // 3A Secondary (Dark)
  };

  // System prompt pour l'assistant (mise à jour auto via knowledge.json)
  const SYSTEM_PROMPT = `Tu es l'assistant vocal de 3A Automation.

IDENTITÉ:
- Consultant automation pour PME (tous secteurs)
- Expert Klaviyo, Shopify, Analytics, Voice AI
- Site: 3a-automation.com
- 60 automatisations disponibles dans 9 catégories

CATÉGORIES D'AUTOMATISATIONS:
- Lead Generation & Acquisition (Facebook Ads, Google Ads, TikTok)
- Email/SMS Marketing (Klaviyo flows, segmentation)
- E-commerce Automation (Shopify, inventaire, commandes)
- Analytics & Reporting (GA4, pixels, dashboards)
- SEO & Content (alt text, sitemaps, optimisation)
- Voice AI & Booking (prise de RDV vocale, calendrier)
- CRM & Customer Data (segmentation, profils)
- Geo-Targeting (multi-langue, multi-devise)

SERVICES (nouveaux prix):
- Audit gratuit: Formulaire → Rapport PDF 24-48h
- Quick Win: 390€ (1 flow optimisé) + BONUS Voice AI
- Essentials: 790€ (3 flows + A/B tests) + BONUS Voice AI + WhatsApp
- Growth: 1490€ (5 flows + dashboard) + BONUS complet
- Retainers: 290-890€/mois

SECTEURS SERVIS:
- E-commerce / Shopify
- Restaurants / Food
- Médecins / Cabinets médicaux
- Architectes / BTP
- Comptables / Services B2B

STYLE:
- Réponses courtes (2-3 phrases max)
- Propose toujours l'audit gratuit
- Pas de jargon technique
- Ton professionnel mais accessible

OBJECTIF:
- Qualifier le prospect (secteur, besoin)
- Proposer l'audit gratuit
- Rediriger vers le formulaire contact ou la prise de RDV vocale`;

  // Knowledge base (chargé dynamiquement)
  let knowledgeBase = null;
  async function loadKnowledgeBase() {
    try {
      const response = await fetch('/voice-assistant/knowledge.json');
      if (response.ok) {
        knowledgeBase = await response.json();
        console.log('Knowledge base loaded:', knowledgeBase.totalAutomations, 'automations');
      }
    } catch (e) {
      console.log('Knowledge base not available, using defaults');
    }
  }
  loadKnowledgeBase();

  // === GA4 ANALYTICS TRACKING ===
  function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'voice_assistant',
        ...params
      });
    }
    // Fallback dataLayer si gtag pas dispo
    if (typeof dataLayer !== 'undefined' && Array.isArray(dataLayer)) {
      dataLayer.push({
        event: eventName,
        event_category: 'voice_assistant',
        ...params
      });
    }
  }

  // État du widget
  let isOpen = false;
  let isListening = false;
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let conversationHistory = [];

  // Vérifier support Web Speech API
  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;

  // Créer le widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'voice-assistant-widget';
    widget.innerHTML = `
      <style>
        #voice-assistant-widget {
          --va-primary: ${CONFIG.primaryColor};
          --va-primary-dark: ${CONFIG.primaryDark};
          --va-accent: ${CONFIG.accentColor};
          --va-dark: ${CONFIG.darkBg};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 99999;
        }

        .va-trigger {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--va-primary) 0%, var(--va-primary-dark) 50%, var(--va-accent) 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(79, 186, 241, 0.4);
          transition: all 0.3s ease;
          position: relative;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .va-trigger::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--va-primary), var(--va-accent));
          opacity: 0;
          z-index: -1;
          animation: pulse-ring 2s ease-out infinite;
        }

        .va-trigger::after {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border-radius: 50%;
          border: 2px solid var(--va-primary);
          opacity: 0;
          animation: pulse-ring-outer 2s ease-out infinite 0.5s;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(79, 186, 241, 0.4); transform: scale(1); }
          50% { box-shadow: 0 4px 30px rgba(79, 186, 241, 0.7); transform: scale(1.02); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes pulse-ring-outer {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .va-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(79, 186, 241, 0.6);
          animation: none;
        }

        .va-trigger:hover::before,
        .va-trigger:hover::after {
          animation: none;
          opacity: 0;
        }

        .va-trigger img {
          width: 40px;
          height: 40px;
          object-fit: contain;
          border-radius: 8px;
        }

        .va-trigger.listening {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 186, 241, 0.7); }
          50% { box-shadow: 0 0 0 15px rgba(79, 186, 241, 0); }
        }

        .va-panel {
          display: none;
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 360px;
          max-height: 500px;
          background: var(--va-dark);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .va-panel.open {
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .va-header {
          padding: 16px;
          background: linear-gradient(135deg, var(--va-primary) 0%, var(--va-primary-dark) 50%, var(--va-accent) 100%);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .va-header-icon {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .va-header-icon svg {
          width: 24px;
          height: 24px;
          fill: white;
        }

        .va-header-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .va-header-text p {
          margin: 2px 0 0;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .va-close {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          opacity: 0.8;
        }

        .va-close:hover {
          opacity: 1;
        }

        .va-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          max-height: 300px;
        }

        .va-message {
          margin-bottom: 12px;
          display: flex;
          gap: 8px;
        }

        .va-message.user {
          flex-direction: row-reverse;
        }

        .va-message-content {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }

        .va-message.assistant .va-message-content {
          background: rgba(255,255,255,0.1);
          color: #e5e5e5;
        }

        .va-message.user .va-message-content {
          background: var(--va-primary);
          color: white;
        }

        .va-input-area {
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 8px;
        }

        .va-input {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 10px 16px;
          color: white;
          font-size: 14px;
          outline: none;
        }

        .va-input::placeholder {
          color: rgba(255,255,255,0.5);
        }

        .va-input:focus {
          border-color: var(--va-primary);
        }

        .va-mic-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${hasSpeechRecognition ? 'var(--va-primary)' : 'rgba(255,255,255,0.1)'};
          border: none;
          cursor: ${hasSpeechRecognition ? 'pointer' : 'not-allowed'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .va-mic-btn:hover {
          ${hasSpeechRecognition ? 'transform: scale(1.1);' : ''}
        }

        .va-mic-btn.listening {
          background: #ef4444;
          animation: pulse 1s infinite;
        }

        .va-mic-btn svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .va-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--va-primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .va-send-btn:hover {
          transform: scale(1.1);
        }

        .va-send-btn svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .va-typing {
          display: flex;
          gap: 4px;
          padding: 10px 14px;
        }

        .va-typing span {
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .va-typing span:nth-child(2) { animation-delay: 0.2s; }
        .va-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        .va-cta {
          padding: 12px 16px;
          background: rgba(79, 186, 241, 0.1);
          border-top: 1px solid rgba(79, 186, 241, 0.2);
        }

        .va-cta a {
          display: block;
          text-align: center;
          padding: 10px;
          background: var(--va-primary);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .va-cta a:hover {
          background: var(--va-primary-dark);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }

        @keyframes notifSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes notifSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
        }

        @media (max-width: 480px) {
          .va-panel {
            width: calc(100vw - 40px);
            right: -10px;
          }
        }
      </style>

      <button class="va-trigger" id="va-trigger" aria-label="Ouvrir l'assistant vocal">
        <img src="/logo.png" alt="3A" />
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <img src="/logo.png" alt="3A" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />
          </div>
          <div class="va-header-text">
            <h3>Assistant 3A</h3>
            <p>${hasSpeechRecognition ? 'Parlez ou écrivez' : 'Écrivez votre question'}</p>
          </div>
          <button class="va-close" id="va-close" aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="va-messages" id="va-messages"></div>

        <div class="va-input-area">
          <input type="text" class="va-input" id="va-input" placeholder="${CONFIG.placeholder}">
          ${hasSpeechRecognition ? `
          <button class="va-mic-btn" id="va-mic" aria-label="Activer le micro">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
          </button>
          ` : ''}
          <button class="va-send-btn" id="va-send" aria-label="Envoyer">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div class="va-cta">
          <a href="/contact.html">Demander un audit gratuit</a>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    initEventListeners();

    // Message de bienvenue après 2 secondes
    setTimeout(() => {
      if (!isOpen) {
        showNotificationBubble();
      }
    }, 2000);
  }

  // Notification bubble - Premium UI/UX
  function showNotificationBubble() {
    const trigger = document.getElementById('va-trigger');
    const bubble = document.createElement('div');
    bubble.className = 'va-notification';
    bubble.innerHTML = `
      <div class="va-notif-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="va-notif-text">
        <span class="va-notif-title">Besoin d'aide ?</span>
        <span class="va-notif-sub">Je suis là pour vous</span>
      </div>
    `;
    bubble.style.cssText = `
      position: absolute;
      bottom: 75px;
      right: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(25, 30, 53, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(79, 186, 241, 0.3);
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 186, 241, 0.15);
      animation: notifSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      white-space: nowrap;
      z-index: 9999;
    `;

    // Icon styles
    const icon = bubble.querySelector('.va-notif-icon');
    if (icon) {
      icon.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, rgba(79, 186, 241, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4FBAF1;
        flex-shrink: 0;
      `;
    }

    // Text container styles
    const textContainer = bubble.querySelector('.va-notif-text');
    if (textContainer) {
      textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
      `;
    }

    // Title styles
    const title = bubble.querySelector('.va-notif-title');
    if (title) {
      title.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: #E4F4FC;
        letter-spacing: -0.01em;
      `;
    }

    // Subtitle styles
    const sub = bubble.querySelector('.va-notif-sub');
    if (sub) {
      sub.style.cssText = `
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 400;
      `;
    }

    // Arrow pointer
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: -6px;
      right: 24px;
      width: 12px;
      height: 12px;
      background: rgba(25, 30, 53, 0.95);
      border-right: 1px solid rgba(79, 186, 241, 0.3);
      border-bottom: 1px solid rgba(79, 186, 241, 0.3);
      transform: rotate(45deg);
    `;
    bubble.appendChild(arrow);

    trigger.parentNode.appendChild(bubble);

    // Hover effect
    bubble.addEventListener('mouseenter', () => {
      bubble.style.borderColor = 'rgba(79, 186, 241, 0.6)';
      bubble.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(79, 186, 241, 0.25)';
    });
    bubble.addEventListener('mouseleave', () => {
      bubble.style.borderColor = 'rgba(79, 186, 241, 0.3)';
      bubble.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 186, 241, 0.15)';
    });

    bubble.addEventListener('click', togglePanel);

    setTimeout(() => {
      bubble.style.animation = 'notifSlideOut 0.3s ease forwards';
      setTimeout(() => bubble.remove(), 300);
    }, 6000);
  }

  // Ajouter un message à la conversation
  function addMessage(text, type = 'assistant') {
    const messagesContainer = document.getElementById('va-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `va-message ${type}`;
    messageDiv.innerHTML = `<div class="va-message-content">${text}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Synthèse vocale pour les réponses assistant
    if (type === 'assistant' && hasSpeechSynthesis) {
      speak(text);
    }

    // Stocker dans l'historique
    conversationHistory.push({ role: type === 'user' ? 'user' : 'assistant', content: text });
  }

  // Afficher l'indicateur de frappe
  function showTyping() {
    const messagesContainer = document.getElementById('va-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'va-message assistant';
    typingDiv.id = 'va-typing';
    typingDiv.innerHTML = `<div class="va-message-content"><div class="va-typing"><span></span><span></span><span></span></div></div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('va-typing');
    if (typing) typing.remove();
  }

  // Synthèse vocale
  function speak(text) {
    if (!hasSpeechSynthesis) return;

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthesis.speak(utterance);
  }

  // Reconnaissance vocale
  function initSpeechRecognition() {
    if (!hasSpeechRecognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('va-input').value = transcript;
      sendMessage(transcript);
    };

    recognition.onend = () => {
      isListening = false;
      document.getElementById('va-mic')?.classList.remove('listening');
      document.getElementById('va-trigger').classList.remove('listening');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      document.getElementById('va-mic')?.classList.remove('listening');
    };
  }

  function toggleListening() {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      isListening = true;
      document.getElementById('va-mic').classList.add('listening');
      document.getElementById('va-trigger').classList.add('listening');
    }
  }

  // Envoyer un message
  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');
    document.getElementById('va-input').value = '';
    showTyping();

    try {
      const response = await getAIResponse(text);
      hideTyping();
      addMessage(response, 'assistant');
    } catch (error) {
      hideTyping();
      addMessage('Désolé, une erreur est survenue. Veuillez réessayer ou utiliser le formulaire de contact.', 'assistant');
    }
  }

  // === SYSTÈME DE RÉPONSE INTELLIGENT ===

  // Contexte conversationnel
  let conversationContext = {
    industry: null,        // B2B, e-commerce, BTP, etc.
    companySize: null,     // PME, startup, etc.
    need: null,            // leads, email, analytics
    budget: null,          // identifié ou non
    stage: 'discovery',    // discovery, qualification, proposal
    lastTopic: null,       // dernier sujet abordé
    // === BOOKING FLOW ===
    bookingFlow: {
      active: false,
      step: null,          // 'name', 'email', 'datetime', 'confirm'
      data: {
        name: null,
        email: null,
        datetime: null,
        service: 'Consultation'
      }
    }
  };

  // === BOOKING SYSTEM ===
  const BOOKING_API = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec';
  const BOOKING_KEYWORDS = ['rdv', 'rendez-vous', 'rendez vous', 'reserver', 'reservation', 'prendre rdv', 'booking', 'appel', 'discuter', 'parler'];

  // Cache pour les créneaux disponibles (5 min TTL)
  let availableSlotsCache = { slots: [], timestamp: 0 };
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function isBookingIntent(text) {
    const lower = text.toLowerCase();
    return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Récupère les créneaux réels depuis l'API Google Calendar
  async function fetchAvailableSlots() {
    const now = Date.now();
    // Utiliser le cache si valide
    if (availableSlotsCache.slots.length > 0 && (now - availableSlotsCache.timestamp) < CACHE_TTL) {
      return availableSlotsCache.slots;
    }

    try {
      const response = await fetch(BOOKING_API + '?action=availability', {
        method: 'GET',
        mode: 'cors'
      });
      const result = await response.json();

      if (result.success && result.data && result.data.slots) {
        // Formater les créneaux pour l'affichage
        const formattedSlots = result.data.slots.slice(0, 6).map(slot => {
          const date = new Date(slot.start);
          return {
            date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
            time: slot.time,
            iso: slot.start
          };
        });
        // Mettre en cache
        availableSlotsCache = { slots: formattedSlots, timestamp: now };
        return formattedSlots;
      }
    } catch (error) {
      console.error('Erreur fetch créneaux:', error);
    }

    // Fallback: créneaux statiques si API indisponible
    return getStaticSlots();
  }

  // Créneaux statiques (fallback)
  function getStaticSlots() {
    const now = new Date();
    const slots = [];
    for (let d = 1; d <= 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const day = date.getDay();
      if (day >= 1 && day <= 5) { // Lun-Ven
        date.setHours(10, 0, 0, 0);
        slots.push({
          date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
          time: '10:00',
          iso: date.toISOString()
        });
        if (slots.length >= 3) break;
      }
    }
    return slots;
  }

  // Compatibilité: garde la fonction sync pour les usages existants
  function getNextSlotSuggestion() {
    // Retourne le cache s'il existe, sinon slots statiques
    if (availableSlotsCache.slots.length > 0) {
      return availableSlotsCache.slots.slice(0, 3);
    }
    return getStaticSlots();
  }

  async function submitBooking(data) {
    try {
      const response = await fetch(BOOKING_API, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Booking error:', error);
      return { success: false, message: error.message };
    }
  }

  async function handleBookingFlow(userMessage) {
    const lower = userMessage.toLowerCase();
    const booking = conversationContext.bookingFlow;

    // Cancel booking
    if (lower.includes('annuler') || lower.includes('non') || lower.includes('stop')) {
      trackEvent('voice_booking_cancelled', { step: booking.step });
      booking.active = false;
      booking.step = null;
      booking.data = { name: null, email: null, datetime: null, service: 'Consultation' };
      return "Pas de probleme, reservation annulee. Comment puis-je vous aider autrement ?";
    }

    // Step: Collect name
    if (booking.step === 'name') {
      const name = userMessage.trim();
      if (name.length < 2) {
        return "Je n'ai pas compris votre nom. Pouvez-vous me le redonner ?";
      }
      booking.data.name = name;
      booking.step = 'email';
      return "Merci " + name + " ! Quelle est votre adresse email pour recevoir la confirmation ?";
    }

    // Step: Collect email - Fetch real slots from API
    if (booking.step === 'email') {
      const email = userMessage.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return "Cette adresse email ne semble pas valide. Pouvez-vous la verifier ? (format: exemple@email.com)";
      }
      booking.data.email = email;
      booking.step = 'datetime';

      // Fetch créneaux réels depuis Google Calendar
      const slots = await fetchAvailableSlots();
      const displaySlots = slots.slice(0, 3);

      if (displaySlots.length === 0) {
        return "Desole, il n'y a pas de creneaux disponibles cette semaine. Envoyez un email a contact@3a-automation.com pour convenir d'un rendez-vous.";
      }

      return "Parfait ! Voici les prochains creneaux disponibles :\n\n" +
        displaySlots.map((s, i) => (i + 1) + ". " + s.date + " a " + s.time).join("\n") +
        "\n\nRepondez avec le numero (1, 2 ou 3) ou proposez une autre date.";
    }

    // Step: Collect datetime - Use cached slots
    if (booking.step === 'datetime') {
      const slots = getNextSlotSuggestion(); // Uses cache from fetchAvailableSlots
      let selectedSlot = null;

      if (lower.includes('1') || lower.includes('premier')) {
        selectedSlot = slots[0];
      } else if (lower.includes('2') || lower.includes('deux')) {
        selectedSlot = slots[1];
      } else if (lower.includes('3') || lower.includes('trois')) {
        selectedSlot = slots[2];
      }

      if (selectedSlot) {
        booking.data.datetime = selectedSlot.iso;
        booking.step = 'confirm';
        trackEvent('voice_booking_slot_selected', {
          slot_date: selectedSlot.date,
          slot_time: selectedSlot.time
        });
        return "Parfait ! Voici le recapitulatif :\n\n" +
          "Nom: " + booking.data.name + "\n" +
          "Email: " + booking.data.email + "\n" +
          "Date: " + selectedSlot.date + " a " + selectedSlot.time + "\n\n" +
          "Confirmez-vous ce rendez-vous ? (oui/non)";
      }

      return "Je n'ai pas compris votre choix. Repondez 1, 2 ou 3 pour choisir un creneau.";
    }

    // Step: Confirm
    if (booking.step === 'confirm') {
      if (lower.includes('oui') || lower.includes('ok') || lower.includes('confirme')) {
        booking.step = 'submitting';
        return null; // Will be handled async
      }
      return "Dites 'oui' pour confirmer ou 'annuler' pour recommencer.";
    }

    return null;
  }

  async function processBookingConfirmation() {
    const booking = conversationContext.bookingFlow;
    const result = await submitBooking({
      name: booking.data.name,
      email: booking.data.email,
      datetime: booking.data.datetime,
      service: booking.data.service,
      phone: '',
      notes: 'Reservation via assistant vocal'
    });

    booking.active = false;
    booking.step = null;

    if (result.success) {
      trackEvent('voice_booking_completed', {
        service: booking.data.service,
        datetime: booking.data.datetime
      });
      return "Votre rendez-vous est confirme ! Vous allez recevoir un email de confirmation a " + booking.data.email + ".\n\nA bientot !";
    } else {
      trackEvent('voice_booking_failed', {
        error: result.message
      });
      return "Desole, il y a eu un probleme : " + result.message + "\n\nVous pouvez reserver directement sur /booking.html";
    }
  }

  // Détection d'industrie
  function detectIndustry(text) {
    const lower = text.toLowerCase();
    const industries = {
      'btp': ['btp', 'construction', 'batiment', 'chantier', 'artisan', 'renovation', 'travaux'],
      'ecommerce': ['e-commerce', 'ecommerce', 'boutique', 'shopify', 'vente en ligne', 'magasin en ligne'],
      'b2b': ['b2b', 'btob', 'entreprise', 'professionnel', 'corporate', 'industrie'],
      'saas': ['saas', 'software', 'application', 'startup', 'tech', 'logiciel'],
      'services': ['service', 'prestataire', 'consultant', 'agence', 'freelance', 'cabinet'],
      'retail': ['retail', 'magasin', 'point de vente', 'commerce']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return industry;
      }
    }
    return null;
  }

  // Détection de besoin
  function detectNeed(text) {
    const lower = text.toLowerCase();
    const needs = {
      'leads': ['lead', 'prospect', 'client', 'acquisition', 'prospection', 'trouver des clients'],
      'email': ['email', 'mail', 'newsletter', 'klaviyo', 'emailing'],
      'analytics': ['analytics', 'données', 'dashboard', 'rapport', 'statistiques', 'ga4'],
      'automation': ['automatiser', 'automatisation', 'workflow', 'gagner du temps'],
      'devis': ['devis', 'prix', 'tarif', 'combien', 'coût', 'budget']
    };

    for (const [need, keywords] of Object.entries(needs)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return need;
      }
    }
    return null;
  }

  // Réponses par industrie
  const industryResponses = {
    btp: {
      intro: 'Pour le BTP, je propose des solutions spécifiques : capture de leads chantiers via Google Maps et annuaires, relances automatiques de devis, et demandes d\'avis post-travaux.',
      services: 'Mes automatisations BTP incluent :\n• Scraping Google Maps pour nouveaux chantiers\n• Veille appels d\'offres automatique\n• Relances devis programmées\n• Emails satisfaction post-travaux\n• Demandes avis Google automatiques',
      leads: 'Pour générer des leads BTP, j\'utilise le scraping Google Maps pour identifier les chantiers en cours et les entreprises qui recrutent. Je peux aussi surveiller les appels d\'offres publics automatiquement.'
    },
    b2b: {
      intro: 'Pour le B2B, je me concentre sur la qualification automatique des leads, le lead scoring, et les séquences de nurturing pour convertir les prospects froids en clients.',
      services: 'Mes automatisations B2B incluent :\n• Lead scoring automatique\n• Séquences nurturing (5-10 emails)\n• Sync CRM (HubSpot, Pipedrive)\n• Alertes commerciales temps réel\n• Qualification automatique des leads',
      leads: 'Pour la génération de leads B2B, je configure des workflows de capture depuis LinkedIn, les formulaires web, et je qualifie automatiquement selon vos critères. Les leads chauds sont alertés en temps réel.'
    },
    ecommerce: {
      intro: 'Pour l\'e-commerce, je suis expert Klaviyo et Shopify. Mes flows automatisés récupèrent 5-15% des paniers abandonnés et génèrent en moyenne 42€ pour 1€ investi.',
      services: 'Mes automatisations e-commerce incluent :\n• Abandon de panier (3 emails)\n• Welcome series nouveaux clients\n• Post-purchase pour fidéliser\n• Back-in-stock automatique\n• Segmentation RFM\n• Winback clients dormants',
      leads: 'Pour l\'e-commerce, les "leads" sont vos visiteurs. Je configure le tracking complet, les popups intelligents, et les flows de conversion pour transformer les visiteurs en acheteurs.'
    },
    saas: {
      intro: 'Pour les SaaS, je configure l\'onboarding automatisé, la prévention du churn, et les emails de feature adoption pour maximiser la rétention.',
      services: 'Mes automatisations SaaS incluent :\n• Onboarding séquencé\n• Churn prevention (users à risque)\n• Feature adoption emails\n• NPS automatique\n• Upsell triggers intelligents'
    },
    services: {
      intro: 'Pour les prestataires de services, je configure l\'automatisation de la prospection, les rappels rendez-vous, et les demandes de témoignages post-mission.',
      services: 'Mes automatisations services incluent :\n• Prospection automatisée\n• Nurturing leads longs\n• Rappels rendez-vous\n• Demandes de témoignages\n• Facturation automatique'
    }
  };

  // Réponses enrichies par topic
  const topicResponses = {
    processus: {
      keywords: ['processus', 'comment ça marche', 'fonctionnement', 'étapes', 'déroulement', 'explique'],
      response: `Voici comment ça se passe :\n\n1️⃣ **Formulaire diagnostic** (5 min)\nVous me décrivez votre activité et vos besoins\n\n2️⃣ **Rapport PDF** (24-48h)\nJe vous envoie 3 recommandations prioritaires\n\n3️⃣ **Proposition** \nSi ça vous intéresse, je vous envoie un devis détaillé\n\n4️⃣ **Implémentation**\nJe configure tout, vous n'avez rien à faire de technique\n\n✅ Pas d'appel obligatoire, tout par écrit si vous préférez !`
    },
    pricing: {
      keywords: ['prix', 'tarif', 'combien', 'coût', 'budget', 'devis', 'cher'],
      response: `Voici mes tarifs :\n\n**PACKS ONE-TIME:**\n• Quick Win: 390€ (1 flow, ~4h)\n• Essentials: 790€ (3 flows + A/B tests)\n• Growth: 1490€ (5 flows + dashboard)\n\n**RETAINERS MENSUELS:**\n• Maintenance: 290€/mois (3h)\n• Optimization: 490€/mois (5h)\n• Growth: 890€/mois (10h)\n\n💡 L'audit est GRATUIT et vous aide à choisir. Quel est votre besoin principal ?`
    },
    audit: {
      keywords: ['audit', 'gratuit', 'diagnostic', 'analyse'],
      response: `L'audit e-commerce est 100% gratuit !\n\n📋 **Ce que vous recevez:**\n• Analyse de vos automatisations actuelles\n• 3 quick wins prioritaires\n• Estimation du ROI potentiel\n• Recommandations personnalisées\n\n⏱️ **Délai:** 24-48h après le formulaire\n\n👉 Voulez-vous que je vous envoie le lien du formulaire ?`
    },
    automatisations: {
      keywords: ['automatisation', 'automatisations', 'workflow', 'flows', 'quoi automatiser'],
      response: `J'ai 50 automatisations prêtes à déployer :\n\n📧 **Email Marketing:**\nWelcome, Abandon panier, Post-achat, Winback\n\n🎯 **Lead Generation:**\nCapture, Scoring, Qualification, Nurturing\n\n📊 **Analytics:**\nDashboards, Alertes, Rapports auto\n\n🛒 **E-commerce:**\nSync produits, Stock alerts, Reviews\n\nQuel type vous intéresse le plus ?`
    },
    leads: {
      keywords: ['lead', 'prospect', 'client', 'acquisition', 'trouver des clients'],
      response: null // Sera remplacé par réponse industry-specific
    },
    difference: {
      keywords: ['différence', 'pourquoi vous', 'agence', 'freelance', 'avantage'],
      response: `Ce qui me différencie :\n\n✅ **Consultant solo, pas agence**\nPas de commercial, pas de junior - vous travaillez avec l'expert directement\n\n✅ **Prix justes**\nPas de marge agence (30-50% en moins)\n\n✅ **Spécialisation**\nExpert Klaviyo, Shopify, n8n - pas généraliste\n\n✅ **Résultats prouvés**\n42+ clients servis, ROI moyen 42:1 sur email\n\n✅ **Flexibilité**\nPas d'engagement long terme obligatoire`
    },
    garantie: {
      keywords: ['garantie', 'risque', 'marche pas', 'satisfait'],
      response: `Ma garantie est simple :\n\n🔒 **Satisfait ou on itère**\nSi les automatisations ne fonctionnent pas comme prévu, je corrige jusqu'à satisfaction - pas de limite de révisions.\n\n📝 **Documentation complète**\nVous gardez le contrôle, même sans moi.\n\n🚪 **Pas d'engagement**\nLes packs sont one-time. Les retainers sont résiliables à tout moment.\n\nVoulez-vous commencer par l'audit gratuit pour voir le potentiel ?`
    },
    delai: {
      keywords: ['délai', 'temps', 'quand', 'combien de temps', 'durée'],
      response: `Les délais dépendent du pack :\n\n⚡ **Quick Win (390€):** 1 semaine\n📦 **Essentials (790€):** 2 semaines\n🚀 **Growth (1490€):** 3 semaines\n\n📋 **Audit gratuit:** 24-48h\n\nCes délais incluent les révisions. Je peux accélérer si urgence (supplément 20%).`
    },
    oui: {
      keywords: ['oui', 'd\'accord', 'ok', 'allons-y', 'intéressé', 'je veux'],
      response: null // Dépend du contexte
    },
    non: {
      keywords: ['non', 'pas maintenant', 'plus tard', 'je réfléchis'],
      response: `Pas de problème ! Prenez votre temps. \n\nSi vous changez d'avis, l'audit gratuit reste disponible. Vous pouvez aussi m'envoyer un email à contact@3a-automation.com.\n\n📌 Et n'hésitez pas à revenir ici si vous avez d'autres questions !`
    },
    salutations: {
      keywords: ['bonjour', 'salut', 'hello', 'hi', 'coucou', 'bonsoir'],
      response: `Bonjour ! 👋 Je suis l'assistant 3A Automation.\n\nJe peux vous aider à :\n• Automatiser votre marketing (emails, leads)\n• Comprendre nos services et tarifs\n• Obtenir un audit gratuit\n\nQuel est votre secteur d'activité ?`
    },
    remerciements: {
      keywords: ['merci', 'super', 'génial', 'parfait', 'excellent'],
      response: `Avec plaisir ! 😊\n\nSi vous êtes prêt à passer à l'action, je vous recommande de demander l'audit gratuit - c'est le meilleur moyen de voir concrètement ce qu'on peut faire pour vous.\n\n📧 Autre question ? Je suis là !`
    }
  };

  // Obtenir réponse intelligente
  async function getAIResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // === BOOKING FLOW - Priorité absolue si actif ===
    if (conversationContext.bookingFlow.active) {
      const bookingResponse = await handleBookingFlow(userMessage);
      if (conversationContext.bookingFlow.step === 'submitting') {
        // Confirmation async
        return await processBookingConfirmation();
      }
      if (bookingResponse) {
        return bookingResponse;
      }
    }

    // Détecter intention de réservation
    if (isBookingIntent(lower)) {
      conversationContext.bookingFlow.active = true;
      conversationContext.bookingFlow.step = 'name';
      trackEvent('voice_booking_started', { step: 'name' });
      return "Super ! Je vais vous aider a reserver un rendez-vous.\n\nPour commencer, quel est votre nom ?";
    }

    // Mise à jour du contexte
    const detectedIndustry = detectIndustry(userMessage);
    if (detectedIndustry) {
      conversationContext.industry = detectedIndustry;
    }

    const detectedNeed = detectNeed(userMessage);
    if (detectedNeed) {
      conversationContext.need = detectedNeed;
    }

    // Vérifier si c'est une confirmation ("oui")
    if (topicResponses.oui.keywords.some(kw => lower.includes(kw))) {
      // Répondre en fonction du dernier sujet
      if (conversationContext.lastTopic === 'processus') {
        return `Parfait ! Pour démarrer, rendez-vous sur notre page contact :\n👉 /contact.html\n\nRemplissez le formulaire (5 min) et je vous envoie le rapport sous 24-48h.\n\nDes questions avant de commencer ?`;
      }
      if (conversationContext.lastTopic === 'audit') {
        return `Super ! Pour votre audit gratuit :\n👉 Rendez-vous sur /contact.html\n\nJe vous envoie le rapport avec 3 recommandations sous 24-48h.\n\n📧 Ou envoyez-moi directement un email à contact@3a-automation.com avec le lien de votre site !`;
      }
      return `Excellent ! La prochaine étape c'est l'audit gratuit.\n\n👉 Remplissez le formulaire sur /contact.html\n📧 Ou email: contact@3a-automation.com\n\nJe vous réponds sous 24h !`;
    }

    // Vérifier les topics enrichis
    for (const [topic, data] of Object.entries(topicResponses)) {
      if (data.keywords.some(kw => lower.includes(kw))) {
        conversationContext.lastTopic = topic;

        // Cas spécial: leads -> adapter selon l'industrie
        if (topic === 'leads' && conversationContext.industry) {
          const industryData = industryResponses[conversationContext.industry];
          if (industryData && industryData.leads) {
            return industryData.leads + '\n\nVoulez-vous en savoir plus sur les tarifs ?';
          }
        }

        if (data.response) {
          return data.response;
        }
      }
    }

    // Réponse spécifique à l'industrie détectée
    if (conversationContext.industry) {
      const industryData = industryResponses[conversationContext.industry];
      if (industryData) {
        // Si on parle de services/automatisations
        if (lower.includes('service') || lower.includes('automatisation') || lower.includes('quoi')) {
          conversationContext.lastTopic = 'services';
          return industryData.services + '\n\nQu\'est-ce qui vous intéresse le plus ?';
        }
        // Réponse intro industrie
        if (!conversationHistory.some(m => m.content.includes(industryData.intro.substring(0, 30)))) {
          return industryData.intro + '\n\nQuel est votre besoin principal ?';
        }
      }
    }

    // Si on a détecté un besoin mais pas encore répondu spécifiquement
    if (conversationContext.need === 'devis') {
      conversationContext.lastTopic = 'pricing';
      return topicResponses.pricing.response;
    }

    // Réponse par défaut intelligente basée sur le contexte
    if (conversationContext.industry) {
      return `Pour votre activité ${conversationContext.industry.toUpperCase()}, je peux vous proposer plusieurs solutions.\n\nCommençons par l'audit gratuit : je vous envoie un rapport personnalisé avec 3 recommandations prioritaires sous 24-48h.\n\n👉 Ça vous intéresse ?`;
    }

    // Vraie réponse par défaut - poser une question de qualification
    return `Pour mieux vous aider, pouvez-vous me dire :\n\n• Quel est votre secteur d'activité ?\n• Quel est votre besoin principal ? (leads, email, analytics...)\n\nOu si vous préférez, demandez directement l'audit gratuit et je vous recontacte avec des recommandations personnalisées !`;
  }

  // Toggle panel
  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('va-panel');

    if (isOpen) {
      panel.classList.add('open');
      if (conversationHistory.length === 0) {
        addMessage(CONFIG.welcomeMessage, 'assistant');
      }
      document.getElementById('va-input').focus();
    } else {
      panel.classList.remove('open');
      if (synthesis) synthesis.cancel();
    }
  }

  // Event listeners
  function initEventListeners() {
    document.getElementById('va-trigger').addEventListener('click', togglePanel);
    document.getElementById('va-close').addEventListener('click', togglePanel);

    document.getElementById('va-send').addEventListener('click', () => {
      sendMessage(document.getElementById('va-input').value);
    });

    document.getElementById('va-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage(e.target.value);
      }
    });

    if (hasSpeechRecognition) {
      initSpeechRecognition();
      document.getElementById('va-mic').addEventListener('click', toggleListening);
    }
  }

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
