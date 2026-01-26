/**
 * 3A Automation - Voice Assistant Widget (Spanish)
 * Version: 1.0
 *
 * Floating widget for AI voice assistant - Spanish version
 * Uses Web Speech API (free) + text fallback
 */

(function() {
  'use strict';

  // Configuration - 3A Automation Branding
  const CONFIG = {
    apiEndpoint: '/voice-assistant/api.php',
    welcomeMessage: 'Hola! Soy el asistente de 3A Automation. ¿En qué puedo ayudarte hoy?',
    welcomeMessageTextOnly: 'Hola! Soy el asistente de 3A Automation. Escribe tu pregunta y te respondo al instante.',
    placeholder: 'Haz tu pregunta...',
    position: 'bottom-right',
    primaryColor: '#4FBAF1',      // 3A Primary Blue
    primaryDark: '#2B6685',       // 3A Primary Dark
    accentColor: '#10B981',       // 3A Accent Green
    darkBg: '#191E35'             // 3A Secondary (Dark)
  };

  // === GA4 ANALYTICS TRACKING ===
  function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'voice_assistant',
        language: 'es',
        ...params
      });
    }
    // Fallback dataLayer if gtag not available
    if (typeof dataLayer !== 'undefined' && Array.isArray(dataLayer)) {
      dataLayer.push({
        event: eventName,
        event_category: 'voice_assistant',
        language: 'es',
        ...params
      });
    }
  }

  let isOpen = false;
  let isListening = false;
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let conversationHistory = [];

  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;

  // Browser detection for fallback
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const needsTextFallback = !hasSpeechRecognition || isFirefox || isSafari;

  function createWidget() {
    // Prevent duplicate widget creation
    if (document.getElementById('voice-assistant-widget')) {
      console.log('[3A Voice] Widget already exists, skipping duplicate creation');
      return;
    }
    const widget = document.createElement('div');
    widget.id = 'voice-assistant-widget';
    // Critical: Set positioning inline to guarantee fixed position even if CSS fails
    widget.style.cssText = 'position:fixed;bottom:30px;right:25px;z-index:99999;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;';
    widget.innerHTML = `
      <style>
        #voice-assistant-widget {
          --va-primary: ${CONFIG.primaryColor};
          --va-primary-dark: ${CONFIG.primaryDark};
          --va-accent: ${CONFIG.accentColor};
          --va-dark: ${CONFIG.darkBg};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: fixed;
          bottom: 30px;
          right: 25px;
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
        .va-trigger img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
        .va-trigger.listening { animation: pulse 1.5s infinite; }
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
        .va-header-icon svg { width: 24px; height: 24px; fill: white; }
        .va-header-text h3 { margin: 0; font-size: 16px; font-weight: 600; color: white; }
        .va-header-text p { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.8); }
        .va-close {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          opacity: 0.8;
        }
        .va-close:hover { opacity: 1; }
        .va-messages { flex: 1; overflow-y: auto; padding: 16px; max-height: 300px; }
        .va-message { margin-bottom: 12px; display: flex; gap: 8px; }
        .va-message.user { flex-direction: row-reverse; }
        .va-message-content {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        .va-message.assistant .va-message-content { background: rgba(255,255,255,0.1); color: #e5e5e5; }
        .va-message.user .va-message-content { background: var(--va-primary); color: white; }
        .va-input-area { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px; }
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
        .va-input::placeholder { color: rgba(255,255,255,0.5); }
        .va-input:focus { border-color: var(--va-primary); }
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
        .va-mic-btn.listening { background: #ef4444; animation: pulse 1s infinite; }
        .va-mic-btn svg { width: 20px; height: 20px; fill: white; }
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
        .va-send-btn:hover { transform: scale(1.1); }
        .va-send-btn svg { width: 20px; height: 20px; fill: white; }
        .va-typing { display: flex; gap: 4px; padding: 10px 14px; }
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
        .va-cta { padding: 12px 16px; background: rgba(79, 186, 241, 0.1); border-top: 1px solid rgba(79, 186, 241, 0.2); }
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
        .va-cta a:hover { background: var(--va-primary-dark); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(20px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes notifSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(20px) scale(0.9); }
        }
        @media (max-width: 480px) { .va-panel { width: calc(100vw - 40px); right: -10px; } }
      </style>

      <button class="va-trigger" id="va-trigger" aria-label="Abrir asistente de voz">
        <img src="/logo.png" alt="3A" style="width:40px;height:40px;object-fit:contain;border-radius:8px;" />
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <img src="/logo.png" alt="3A" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />
          </div>
          <div class="va-header-text">
            <h3>Asistente 3A</h3>
            <p>${needsTextFallback ? 'Escribe tu pregunta' : 'Habla o escribe'}</p>
          </div>
          <button class="va-close" id="va-close" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="va-messages" id="va-messages"></div>

        <div class="va-input-area">
          <input type="text" class="va-input" id="va-input" placeholder="${CONFIG.placeholder}">
          ${!needsTextFallback && hasSpeechRecognition ? `
          <button class="va-mic-btn" id="va-mic" aria-label="Activar micrófono">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
          </button>
          ` : ''}
          <button class="va-send-btn" id="va-send" aria-label="Enviar">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div class="va-cta">
          <a href="/es/contact.html">Solicita una auditoría gratuita</a>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    initEventListeners();

    setTimeout(() => {
      if (!isOpen) showNotificationBubble();
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
        <span class="va-notif-title">¿Necesitas ayuda?</span>
        <span class="va-notif-sub">Estoy aquí para ti</span>
      </div>
    `;
    bubble.style.cssText = `
      position: absolute; bottom: 75px; right: 0;
      display: flex; align-items: center; gap: 10px;
      background: rgba(25, 30, 53, 0.95);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(79, 186, 241, 0.3);
      padding: 12px 16px; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 186, 241, 0.15);
      animation: notifSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer; white-space: nowrap; z-index: 9999;
    `;
    const icon = bubble.querySelector('.va-notif-icon');
    if (icon) icon.style.cssText = `width: 32px; height: 32px; background: linear-gradient(135deg, rgba(79, 186, 241, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #4FBAF1; flex-shrink: 0;`;
    const textContainer = bubble.querySelector('.va-notif-text');
    if (textContainer) textContainer.style.cssText = `display: flex; flex-direction: column; gap: 2px;`;
    const title = bubble.querySelector('.va-notif-title');
    if (title) title.style.cssText = `font-size: 14px; font-weight: 600; color: #E4F4FC; letter-spacing: -0.01em;`;
    const sub = bubble.querySelector('.va-notif-sub');
    if (sub) sub.style.cssText = `font-size: 11px; color: rgba(255, 255, 255, 0.7); font-weight: 400;`;
    const arrow = document.createElement('div');
    arrow.style.cssText = `position: absolute; bottom: -6px; right: 24px; width: 12px; height: 12px; background: rgba(25, 30, 53, 0.95); border-right: 1px solid rgba(79, 186, 241, 0.3); border-bottom: 1px solid rgba(79, 186, 241, 0.3); transform: rotate(45deg);`;
    bubble.appendChild(arrow);
    trigger.parentNode.appendChild(bubble);
    bubble.addEventListener('mouseenter', () => { bubble.style.borderColor = 'rgba(79, 186, 241, 0.6)'; bubble.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(79, 186, 241, 0.25)'; });
    bubble.addEventListener('mouseleave', () => { bubble.style.borderColor = 'rgba(79, 186, 241, 0.3)'; bubble.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 186, 241, 0.15)'; });
    bubble.addEventListener('click', togglePanel);
    setTimeout(() => { bubble.style.animation = 'notifSlideOut 0.3s ease forwards'; setTimeout(() => bubble.remove(), 300); }, 6000);
  }

  function addMessage(text, type = 'assistant') {
    const messagesContainer = document.getElementById('va-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `va-message ${type}`;
    messageDiv.innerHTML = `<div class="va-message-content">${text}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (type === 'assistant' && hasSpeechSynthesis) speak(text);
    conversationHistory.push({ role: type === 'user' ? 'user' : 'assistant', content: text });
  }

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

  function speak(text) {
    if (!hasSpeechSynthesis) return;
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    synthesis.speak(utterance);
  }

  function initSpeechRecognition() {
    if (!hasSpeechRecognition) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
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
    recognition.onerror = () => {
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
      addMessage('Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo o usa el formulario de contacto.', 'assistant');
    }
  }

  // === INTELLIGENT RESPONSE SYSTEM ===

  // Conversation context
  let conversationContext = {
    industry: null,
    need: null,
    stage: 'discovery',
    lastTopic: null,
    // === BOOKING FLOW ===
    bookingFlow: {
      active: false,
      step: null,
      data: {
        name: null,
        email: null,
        datetime: null,
        service: 'Consulta'
      }
    }
  };

  // === BOOKING SYSTEM ===
  const BOOKING_API = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec';
  const BOOKING_KEYWORDS = ['cita', 'reservar', 'reserva', 'agendar', 'llamada', 'reunión', 'hablar', 'discutir', 'appointment', 'meeting'];

  // Cache for available slots (5 min TTL)
  let availableSlotsCache = { slots: [], timestamp: 0 };
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function isBookingIntent(text) {
    const lower = text.toLowerCase();
    return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Fetch real slots from Google Calendar API
  async function fetchAvailableSlots() {
    const now = Date.now();
    // Use cache if valid
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
        // Format slots for display in Spanish
        const formattedSlots = result.data.slots.slice(0, 6).map(slot => {
          const date = new Date(slot.start);
          return {
            date: date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' }),
            iso: slot.start
          };
        });
        // Cache it
        availableSlotsCache = { slots: formattedSlots, timestamp: now };
        return formattedSlots;
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }

    // Fallback: static slots if API unavailable
    return getStaticSlots();
  }

  // Static slots (fallback)
  function getStaticSlots() {
    const now = new Date();
    const slots = [];
    for (let d = 1; d <= 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const day = date.getDay();
      if (day >= 1 && day <= 5) {
        date.setHours(10, 0, 0, 0);
        slots.push({
          date: date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: '10:00',
          iso: date.toISOString()
        });
        if (slots.length >= 3) break;
      }
    }
    return slots;
  }

  // Compatibility: keep sync function for existing usage
  function getNextSlotSuggestion() {
    // Return cache if exists, otherwise static slots
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

    if (lower.includes('cancelar') || lower.includes('no') || lower.includes('parar') || lower.includes('cancel')) {
      trackEvent('voice_booking_cancelled', { step: booking.step });
      booking.active = false;
      booking.step = null;
      booking.data = { name: null, email: null, datetime: null, service: 'Consulta' };
      return "Sin problema, reserva cancelada. ¿En qué más puedo ayudarte?";
    }

    if (booking.step === 'name') {
      const name = userMessage.trim();
      if (name.length < 2) {
        return "No he entendido tu nombre. ¿Podrías repetirlo?";
      }
      booking.data.name = name;
      booking.step = 'email';
      return "¡Gracias " + name + "! ¿Cuál es tu correo electrónico para la confirmación?";
    }

    // Step: Collect email - Fetch real slots from API
    if (booking.step === 'email') {
      const email = userMessage.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return "Este correo no parece válido. ¿Puedes verificarlo? (formato: ejemplo@email.com)";
      }
      booking.data.email = email;
      booking.step = 'datetime';

      // Fetch real slots from Google Calendar
      const slots = await fetchAvailableSlots();
      const displaySlots = slots.slice(0, 3);

      if (displaySlots.length === 0) {
        return "Lo siento, no hay horarios disponibles esta semana. Puedes escribirnos a contact@3a-automation.com para agendar una reunión.";
      }

      return "¡Perfecto! Aquí están los próximos horarios disponibles:\n\n" +
        displaySlots.map((s, i) => (i + 1) + ". " + s.date + " a las " + s.time).join("\n") +
        "\n\nResponde con el número (1, 2 o 3).";
    }

    // Step: Collect datetime - Use cached slots
    if (booking.step === 'datetime') {
      const slots = getNextSlotSuggestion(); // Uses cache from fetchAvailableSlots
      let selectedSlot = null;

      if (lower.includes('1') || lower.includes('primer') || lower.includes('uno')) {
        selectedSlot = slots[0];
      } else if (lower.includes('2') || lower.includes('segund') || lower.includes('dos')) {
        selectedSlot = slots[1];
      } else if (lower.includes('3') || lower.includes('tercer') || lower.includes('tres')) {
        selectedSlot = slots[2];
      }

      if (selectedSlot) {
        booking.data.datetime = selectedSlot.iso;
        booking.step = 'confirm';
        trackEvent('voice_booking_slot_selected', {
          slot_date: selectedSlot.date,
          slot_time: selectedSlot.time
        });
        return "¡Genial! Aquí está el resumen:\n\n" +
          "Nombre: " + booking.data.name + "\n" +
          "Correo: " + booking.data.email + "\n" +
          "Fecha: " + selectedSlot.date + " a las " + selectedSlot.time + "\n\n" +
          "¿Confirmas esta cita? (sí/no)";
      }

      return "No he entendido. Responde 1, 2 o 3 para elegir un horario.";
    }

    if (booking.step === 'confirm') {
      if (lower.includes('sí') || lower.includes('si') || lower.includes('ok') || lower.includes('confirmar') || lower.includes('yes')) {
        booking.step = 'submitting';
        return null;
      }
      return "Di 'sí' para confirmar o 'cancelar' para empezar de nuevo.";
    }

    return null;
  }

  // Get client timezone for booking
  function getClientTimezone() {
    // Priority 1: Use GeoLocale if available
    if (window.GeoLocale && typeof window.GeoLocale.getTimezone === 'function') {
      return window.GeoLocale.getTimezone();
    }
    // Priority 2: Direct detection
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return { iana: tz, offset: new Date().getTimezoneOffset() };
    } catch (e) {
      return { iana: null, offset: new Date().getTimezoneOffset() };
    }
  }

  async function processBookingConfirmation() {
    const booking = conversationContext.bookingFlow;
    const clientTz = getClientTimezone();

    const result = await submitBooking({
      name: booking.data.name,
      email: booking.data.email,
      datetime: booking.data.datetime,
      service: booking.data.service,
      phone: '',
      notes: 'Reserva via asistente de voz (ES)',
      timezone: clientTz.iana || `UTC${clientTz.offset > 0 ? '-' : '+'}${Math.abs(clientTz.offset / 60)}`
    });

    booking.active = false;
    booking.step = null;

    if (result.success) {
      trackEvent('voice_booking_completed', {
        service: booking.data.service,
        datetime: booking.data.datetime
      });
      return "¡Tu cita está confirmada! Recibirás un correo de confirmación en " + booking.data.email + ".\n\n¡Hasta pronto!";
    } else {
      trackEvent('voice_booking_failed', {
        error: result.message
      });
      return "Lo siento, ha habido un problema: " + result.message + "\n\nPuedes reservar directamente en /es/booking.html";
    }
  }

  // Industry detection
  function detectIndustry(text) {
    const lower = text.toLowerCase();
    const industries = {
      'construction': ['construcción', 'construccion', 'edificio', 'contratista', 'renovación', 'renovacion', 'inmobiliaria', 'obra'],
      'ecommerce': ['e-commerce', 'ecommerce', 'tienda online', 'shopify', 'woocommerce', 'tienda en línea', 'comercio electrónico'],
      'b2b': ['b2b', 'negocio', 'profesional', 'corporativo', 'empresa', 'saas'],
      'saas': ['saas', 'software', 'app', 'aplicación', 'startup', 'tech', 'tecnología'],
      'services': ['servicio', 'agencia', 'consultor', 'freelance', 'servicios profesionales'],
      'retail': ['retail', 'tienda', 'comercio', 'minorista']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(kw => lower.includes(kw))) return industry;
    }
    return null;
  }

  // Need detection
  function detectNeed(text) {
    const lower = text.toLowerCase();
    const needs = {
      'leads': ['lead', 'prospecto', 'cliente', 'adquisición', 'encontrar clientes', 'captar clientes'],
      'email': ['email', 'newsletter', 'klaviyo', 'emailing', 'marketing', 'correo'],
      'analytics': ['analytics', 'analítica', 'datos', 'dashboard', 'informe', 'ga4', 'estadísticas'],
      'automation': ['automatizar', 'automatización', 'workflow', 'ahorrar tiempo', 'flujo'],
      'quote': ['presupuesto', 'precio', 'costo', 'coste', 'tarifa', 'cuánto cuesta']
    };

    for (const [need, keywords] of Object.entries(needs)) {
      if (keywords.some(kw => lower.includes(kw))) return need;
    }
    return null;
  }

  // Industry-specific responses
  const industryResponses = {
    construction: {
      intro: 'Para construcción, ofrecemos soluciones específicas: captación de leads via Google Maps, seguimiento automático de presupuestos y solicitud de reseñas post-proyecto.',
      services: 'Nuestras automatizaciones para construcción incluyen:\n• Scraping de Google Maps para nuevos proyectos\n• Monitoreo automático de licitaciones\n• Seguimiento programado de presupuestos\n• Emails de satisfacción post-proyecto\n• Solicitud automática de reseñas Google',
      leads: 'Para leads de construcción, usamos scraping de Google Maps para identificar proyectos en curso y empresas contratando. También podemos monitorear licitaciones públicas automáticamente.'
    },
    b2b: {
      intro: 'Para B2B, nos enfocamos en cualificación automática de leads, lead scoring y secuencias de nurturing para convertir prospectos fríos en clientes.',
      services: 'Nuestras automatizaciones B2B incluyen:\n• Lead scoring automático\n• Secuencias de nurturing (5-10 emails)\n• Sincronización CRM (HubSpot, Pipedrive)\n• Alertas de ventas en tiempo real\n• Cualificación automática de leads',
      leads: 'Para generación de leads B2B, configuramos flujos de captación desde LinkedIn, formularios web, y cualificamos automáticamente según tus criterios. Los leads calientes disparan alertas instantáneas.'
    },
    ecommerce: {
      intro: 'Para e-commerce, somos expertos en Klaviyo y Shopify. Nuestros flujos automatizados recuperan 5-15% de carritos abandonados y generan un promedio de $42 por cada $1 invertido.',
      services: 'Nuestras automatizaciones e-commerce incluyen:\n• Recuperación de carritos abandonados (3 emails)\n• Serie de bienvenida para nuevos clientes\n• Flujos post-compra para retención\n• Alertas automáticas de stock\n• Segmentación RFM\n• Winback para clientes dormidos',
      leads: 'Para e-commerce, los "leads" son tus visitantes. Configuramos tracking completo, popups inteligentes y flujos de conversión para transformar visitantes en compradores.'
    },
    saas: {
      intro: 'Para SaaS, configuramos onboarding automatizado, prevención de churn y emails de adopción de funciones para maximizar la retención.',
      services: 'Nuestras automatizaciones SaaS incluyen:\n• Onboarding secuenciado\n• Prevención de churn (usuarios en riesgo)\n• Emails de adopción de funciones\n• Encuestas NPS automáticas\n• Triggers de upsell inteligentes'
    },
    services: {
      intro: 'Para proveedores de servicios, configuramos automatización de prospección, recordatorios de citas y solicitud de testimonios post-servicio.',
      services: 'Nuestras automatizaciones de servicios incluyen:\n• Prospección automatizada\n• Nurturing de leads de ciclo largo\n• Recordatorios de citas\n• Solicitud de testimonios\n• Facturación automática'
    }
  };

  // Topic responses
  const topicResponses = {
    process: {
      keywords: ['proceso', 'cómo funciona', 'como funciona', 'pasos', 'explica', 'cómo hacéis'],
      response: `Así es como funciona:\n\n1. **Formulario de diagnóstico** (5 min)\nDescribe tu negocio y objetivos\n\n2. **Informe personalizado** (24-48h)\nTe enviamos 3 recomendaciones prioritarias\n\n3. **Propuesta a medida**\nSi te interesa, enviamos presupuesto detallado\n\n4. **Implementación llave en mano**\nConfiguramos todo - no necesitas conocimientos técnicos\n\n¡Sin llamadas obligatorias - todo por escrito si prefieres!`
    },
    pricing: {
      keywords: ['precio', 'costo', 'coste', 'presupuesto', 'tarifa', 'cuánto cuesta', 'cuanto cuesta'],
      response: `Nuestros precios son fijos y transparentes:\n\n**PACKS ÚNICOS:**\nDesde proyectos simples hasta despliegues completos\n\n**RETAINERS MENSUALES:**\nMantenimiento y optimización continua\n\nLa auditoría es GRATIS y te ayuda a elegir el pack adecuado.\n\n¡Consulta nuestros precios en /es/pricing.html o solicita un presupuesto personalizado!`
    },
    audit: {
      keywords: ['auditoría', 'auditoria', 'gratis', 'diagnóstico', 'diagnostico', 'análisis', 'analisis'],
      response: `¡La auditoría es 100% gratis!\n\n**Lo que obtienes:**\n• Análisis de tus procesos actuales\n• Oportunidades de automatización identificadas\n• ROI potencial estimado\n• Recomendaciones personalizadas\n\n**Plazo:** 24-48h después del formulario\n\n¿Quieres que te envíe el enlace del formulario?`
    },
    automations: {
      keywords: ['automatización', 'automatizacion', 'automatizaciones', 'workflow', 'flujos', 'qué podéis'],
      response: `Ofrecemos un catálogo completo de automatizaciones:\n\n**Email Marketing:**\nBienvenida, Carrito abandonado, Post-compra, Winback\n\n**Generación de Leads:**\nCaptación, Scoring, Cualificación, Nurturing\n\n**Analytics:**\nDashboards, Alertas, Informes automatizados\n\n**E-commerce:**\nSincronización de productos, Alertas de stock, Reseñas\n\n**IA y Vídeo:**\nVídeos marketing, Avatar IA, Voz IA\n\n¿Qué tipo te interesa más?`
    },
    leads: {
      keywords: ['lead', 'prospecto', 'cliente', 'adquisición', 'encontrar clientes'],
      response: null // Will be replaced by industry-specific
    },
    difference: {
      keywords: ['diferencia', 'por qué vosotros', 'agencia', 'ventaja', 'único'],
      response: `Lo que nos diferencia:\n\n• **Agencia especializada**\nTrabajas directamente con expertos, no comerciales\n\n• **Precios justos**\nTarifas transparentes y competitivas\n\n• **Especialización**\nExpertos en automatización de marketing - no generalistas\n\n• **Resultados medibles**\nROI demostrado en cada proyecto\n\n• **Flexibilidad**\nSin compromiso a largo plazo obligatorio`
    },
    guarantee: {
      keywords: ['garantía', 'garantia', 'riesgo', 'no funciona', 'satisfecho'],
      response: `Nuestra garantía es simple:\n\n• **Satisfecho o iteramos**\nSi las automatizaciones no funcionan como esperado, las arreglamos hasta que estés satisfecho.\n\n• **Documentación completa**\nMantienes el control, incluso sin nosotros.\n\n• **Sin compromiso**\nPacks únicos. Retainers cancelables en cualquier momento.\n\n¿Quieres empezar con la auditoría gratuita?`
    },
    timeline: {
      keywords: ['plazo', 'cuándo', 'cuando', 'cuánto tiempo', 'cuanto tiempo', 'duración', 'duracion'],
      response: `Los plazos varían según el proyecto:\n\n• **Proyecto simple:** 48-72h\n• **Proyecto estándar:** 5-7 días\n• **Proyecto completo:** 10-14 días\n• **Auditoría gratuita:** 24-48h\n\nEstos incluyen revisiones. Disponible servicio urgente si lo necesitas.`
    },
    yes: {
      keywords: ['sí', 'si', 'claro', 'ok', 'vale', 'interesado', 'quiero', 'adelante'],
      response: null // Depends on context
    },
    no: {
      keywords: ['no', 'ahora no', 'luego', 'pensando', 'después'],
      response: `¡Sin problema! Tómate tu tiempo.\n\nLa auditoría gratuita siempre está disponible. También puedes escribirnos a contact@3a-automation.com.\n\n¡No dudes en volver si tienes preguntas!`
    },
    greetings: {
      keywords: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'qué tal', 'hey'],
      response: `¡Hola! Soy el asistente de 3A Automation.\n\nPuedo ayudarte a:\n• Automatizar tu marketing (emails, leads)\n• Entender nuestros servicios\n• Obtener una auditoría gratuita\n\n¿En qué sector trabajas?`
    },
    thanks: {
      keywords: ['gracias', 'genial', 'perfecto', 'estupendo', 'muy bien'],
      response: `¡De nada!\n\nSi estás listo para actuar, te recomendamos la auditoría gratuita — es la mejor manera de ver lo que podemos hacer por ti.\n\n¿Más preguntas? ¡Aquí estamos!`
    }
  };

  // Get intelligent response
  async function getAIResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // === BOOKING FLOW - Top priority if active ===
    if (conversationContext.bookingFlow.active) {
      const bookingResponse = await handleBookingFlow(userMessage);
      if (conversationContext.bookingFlow.step === 'submitting') {
        return await processBookingConfirmation();
      }
      if (bookingResponse) {
        return bookingResponse;
      }
    }

    // Detect booking intent
    if (isBookingIntent(lower)) {
      conversationContext.bookingFlow.active = true;
      conversationContext.bookingFlow.step = 'name';
      trackEvent('voice_booking_started', { step: 'name' });
      return "¡Genial! Te ayudo a reservar una cita.\n\nPrimero, ¿cuál es tu nombre?";
    }

    // Update context
    const detectedIndustry = detectIndustry(userMessage);
    if (detectedIndustry) conversationContext.industry = detectedIndustry;

    const detectedNeed = detectNeed(userMessage);
    if (detectedNeed) conversationContext.need = detectedNeed;

    // Check for confirmation ("yes")
    if (topicResponses.yes.keywords.some(kw => lower.includes(kw))) {
      if (conversationContext.lastTopic === 'process') {
        return `¡Perfecto! Para empezar:\n• Ve a /es/contact.html\n\nRellena el formulario (5 min) y te enviamos el informe en 24-48h.\n\n¿Alguna pregunta antes de empezar?`;
      }
      if (conversationContext.lastTopic === 'audit') {
        return `¡Genial! Para tu auditoría gratuita:\n• Ve a /es/contact.html\n\nTe enviamos el informe con 3 recomendaciones en 24-48h.\n\n¡O escríbenos directamente a contact@3a-automation.com con el enlace de tu web!`;
      }
      return `¡Excelente! El siguiente paso es la auditoría gratuita.\n\n• Rellena el formulario en /es/contact.html\n• O email: contact@3a-automation.com\n\n¡Respondemos en 24h!`;
    }

    // Check enriched topics
    for (const [topic, data] of Object.entries(topicResponses)) {
      if (data.keywords.some(kw => lower.includes(kw))) {
        conversationContext.lastTopic = topic;

        // Special case: leads -> adapt to industry
        if (topic === 'leads' && conversationContext.industry) {
          const industryData = industryResponses[conversationContext.industry];
          if (industryData && industryData.leads) {
            return industryData.leads + '\n\n¿Quieres saber más sobre los precios?';
          }
        }

        if (data.response) return data.response;
      }
    }

    // Industry-specific response
    if (conversationContext.industry) {
      const industryData = industryResponses[conversationContext.industry];
      if (industryData) {
        if (lower.includes('servicio') || lower.includes('automatización') || lower.includes('qué')) {
          conversationContext.lastTopic = 'services';
          return industryData.services + '\n\n¿Qué te interesa más?';
        }
        if (!conversationHistory.some(m => m.content.includes(industryData.intro.substring(0, 30)))) {
          return industryData.intro + '\n\n¿Cuál es tu necesidad principal?';
        }
      }
    }

    // If quote need detected
    if (conversationContext.need === 'quote') {
      conversationContext.lastTopic = 'pricing';
      return topicResponses.pricing.response;
    }

    // Smart default based on context
    if (conversationContext.industry) {
      return `Para tu negocio de ${conversationContext.industry.toUpperCase()}, podemos ofrecer varias soluciones.\n\nEmpecemos con la auditoría gratuita: te enviamos un informe personalizado con 3 recomendaciones prioritarias en 24-48h.\n\n¿Te interesa?`;
    }

    // True default - qualification question
    return `Para ayudarte mejor, ¿podrías decirme:\n\n• ¿En qué sector trabajas?\n• ¿Cuál es tu necesidad principal? (leads, email, analytics...)\n\n¡O solicita directamente la auditoría gratuita y te respondemos con recomendaciones personalizadas!`;
  }

  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('va-panel');
    if (isOpen) {
      panel.classList.add('open');
      if (conversationHistory.length === 0) {
        const welcomeMsg = needsTextFallback ? CONFIG.welcomeMessageTextOnly : CONFIG.welcomeMessage;
        addMessage(welcomeMsg, 'assistant');
      }
      document.getElementById('va-input').focus();
    } else {
      panel.classList.remove('open');
      if (synthesis) synthesis.cancel();
    }
  }

  function initEventListeners() {
    document.getElementById('va-trigger').addEventListener('click', togglePanel);
    document.getElementById('va-close').addEventListener('click', togglePanel);
    document.getElementById('va-send').addEventListener('click', () => {
      sendMessage(document.getElementById('va-input').value);
    });
    document.getElementById('va-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage(e.target.value);
    });
    if (hasSpeechRecognition) {
      initSpeechRecognition();
      document.getElementById('va-mic').addEventListener('click', toggleListening);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
