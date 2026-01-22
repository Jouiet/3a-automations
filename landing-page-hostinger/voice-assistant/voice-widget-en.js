/**
 * 3A Automation - Voice Assistant Widget (English)
 * Version: 1.0
 *
 * Floating widget for AI voice assistant - English version
 * Uses Web Speech API (free) + text fallback
 */

(function() {
  'use strict';

  // Configuration - 3A Automation Branding
  const CONFIG = {
    apiEndpoint: '/voice-assistant/api.php',
    welcomeMessage: 'Hello! I\'m the 3A Automation assistant. How can I help you today?',
    welcomeMessageTextOnly: 'Hello! I\'m the 3A Automation assistant. Type your question and I\'ll respond instantly.',
    placeholder: 'Ask your question...',
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
        ...params
      });
    }
    // Fallback dataLayer if gtag not available
    if (typeof dataLayer !== 'undefined' && Array.isArray(dataLayer)) {
      dataLayer.push({
        event: eventName,
        event_category: 'voice_assistant',
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

      <button class="va-trigger" id="va-trigger" aria-label="Open voice assistant">
        <img src="/logo.png" alt="3A" />
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <img src="/logo.png" alt="3A" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />
          </div>
          <div class="va-header-text">
            <h3>3A Assistant</h3>
            <p>${needsTextFallback ? 'Type your question' : 'Speak or type'}</p>
          </div>
          <button class="va-close" id="va-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="va-messages" id="va-messages"></div>

        <div class="va-input-area">
          <input type="text" class="va-input" id="va-input" placeholder="${CONFIG.placeholder}">
          ${!needsTextFallback && hasSpeechRecognition ? `
          <button class="va-mic-btn" id="va-mic" aria-label="Enable microphone">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
          </button>
          ` : ''}
          <button class="va-send-btn" id="va-send" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div class="va-cta">
          <a href="/en/contact.html">Request a free audit</a>
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
        <span class="va-notif-title">Need help?</span>
        <span class="va-notif-sub">I'm here for you</span>
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
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    synthesis.speak(utterance);
  }

  function initSpeechRecognition() {
    if (!hasSpeechRecognition) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
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
      addMessage('Sorry, an error occurred. Please try again or use the contact form.', 'assistant');
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
        service: 'Consultation'
      }
    }
  };

  // === BOOKING SYSTEM ===
  const BOOKING_API = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec';
  const BOOKING_KEYWORDS = ['appointment', 'book', 'booking', 'schedule', 'call', 'meeting', 'talk', 'discuss'];

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
        // Format slots for display
        const formattedSlots = result.data.slots.slice(0, 6).map(slot => {
          const date = new Date(slot.start);
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
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
          date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: '10:00 AM',
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

    if (lower.includes('cancel') || lower.includes('no') || lower.includes('stop')) {
      trackEvent('voice_booking_cancelled', { step: booking.step });
      booking.active = false;
      booking.step = null;
      booking.data = { name: null, email: null, datetime: null, service: 'Consultation' };
      return "No problem, booking cancelled. How can I help you?";
    }

    if (booking.step === 'name') {
      const name = userMessage.trim();
      if (name.length < 2) {
        return "I didn't catch your name. Could you repeat it?";
      }
      booking.data.name = name;
      booking.step = 'email';
      return "Thanks " + name + "! What's your email address for the confirmation?";
    }

    // Step: Collect email - Fetch real slots from API
    if (booking.step === 'email') {
      const email = userMessage.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return "This email doesn't seem valid. Can you check it? (format: example@email.com)";
      }
      booking.data.email = email;
      booking.step = 'datetime';

      // Fetch real slots from Google Calendar
      const slots = await fetchAvailableSlots();
      const displaySlots = slots.slice(0, 3);

      if (displaySlots.length === 0) {
        return "Sorry, no slots available this week. Please email contact@3a-automation.com to schedule a meeting.";
      }

      return "Perfect! Here are the next available slots:\n\n" +
        displaySlots.map((s, i) => (i + 1) + ". " + s.date + " at " + s.time).join("\n") +
        "\n\nReply with the number (1, 2, or 3).";
    }

    // Step: Collect datetime - Use cached slots
    if (booking.step === 'datetime') {
      const slots = getNextSlotSuggestion(); // Uses cache from fetchAvailableSlots
      let selectedSlot = null;

      if (lower.includes('1') || lower.includes('first')) {
        selectedSlot = slots[0];
      } else if (lower.includes('2') || lower.includes('second')) {
        selectedSlot = slots[1];
      } else if (lower.includes('3') || lower.includes('third')) {
        selectedSlot = slots[2];
      }

      if (selectedSlot) {
        booking.data.datetime = selectedSlot.iso;
        booking.step = 'confirm';
        trackEvent('voice_booking_slot_selected', {
          slot_date: selectedSlot.date,
          slot_time: selectedSlot.time
        });
        return "Great! Here's the summary:\n\n" +
          "Name: " + booking.data.name + "\n" +
          "Email: " + booking.data.email + "\n" +
          "Date: " + selectedSlot.date + " at " + selectedSlot.time + "\n\n" +
          "Confirm this appointment? (yes/no)";
      }

      return "I didn't understand. Reply 1, 2, or 3 to choose a slot.";
    }

    if (booking.step === 'confirm') {
      if (lower.includes('yes') || lower.includes('ok') || lower.includes('confirm')) {
        booking.step = 'submitting';
        return null;
      }
      return "Say 'yes' to confirm or 'cancel' to start over.";
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
      notes: 'Booking via voice assistant',
      timezone: clientTz.iana || `UTC${clientTz.offset > 0 ? '-' : '+'}${Math.abs(clientTz.offset / 60)}`
    });

    booking.active = false;
    booking.step = null;

    if (result.success) {
      trackEvent('voice_booking_completed', {
        service: booking.data.service,
        datetime: booking.data.datetime
      });
      return "Your appointment is confirmed! You'll receive a confirmation email at " + booking.data.email + ".\n\nSee you soon!";
    } else {
      trackEvent('voice_booking_failed', {
        error: result.message
      });
      return "Sorry, there was an issue: " + result.message + "\n\nYou can book directly at /en/booking.html";
    }
  }

  // Industry detection
  function detectIndustry(text) {
    const lower = text.toLowerCase();
    const industries = {
      'construction': ['construction', 'building', 'contractor', 'renovation', 'real estate'],
      'ecommerce': ['e-commerce', 'ecommerce', 'online store', 'shopify', 'woocommerce', 'online shop'],
      'b2b': ['b2b', 'business', 'professional', 'corporate', 'enterprise', 'saas'],
      'saas': ['saas', 'software', 'app', 'startup', 'tech'],
      'services': ['service', 'agency', 'consultant', 'freelance', 'professional services'],
      'retail': ['retail', 'store', 'shop', 'brick and mortar']
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
      'leads': ['lead', 'prospect', 'customer', 'acquisition', 'find customers'],
      'email': ['email', 'newsletter', 'klaviyo', 'emailing', 'marketing'],
      'analytics': ['analytics', 'data', 'dashboard', 'report', 'ga4'],
      'automation': ['automate', 'automation', 'workflow', 'save time'],
      'quote': ['quote', 'price', 'cost', 'budget', 'pricing']
    };

    for (const [need, keywords] of Object.entries(needs)) {
      if (keywords.some(kw => lower.includes(kw))) return need;
    }
    return null;
  }

  // Industry-specific responses
  const industryResponses = {
    construction: {
      intro: 'For construction, we offer specific solutions: lead capture via Google Maps, automated quote follow-ups, and post-project review requests.',
      services: 'Our construction automations include:\n• Google Maps scraping for new projects\n• Automated bid monitoring\n• Scheduled quote follow-ups\n• Post-project satisfaction emails\n• Automatic Google review requests',
      leads: 'For construction leads, we use Google Maps scraping to identify ongoing projects and companies hiring. We can also monitor public bids automatically.'
    },
    b2b: {
      intro: 'For B2B, we focus on automatic lead qualification, lead scoring, and nurturing sequences to convert cold prospects into customers.',
      services: 'Our B2B automations include:\n• Automatic lead scoring\n• Nurturing sequences (5-10 emails)\n• CRM sync (HubSpot, Pipedrive)\n• Real-time sales alerts\n• Automatic lead qualification',
      leads: 'For B2B lead generation, we configure capture workflows from LinkedIn, web forms, and automatically qualify based on your criteria. Hot leads trigger instant alerts.'
    },
    ecommerce: {
      intro: 'For e-commerce, we\'re Klaviyo and Shopify experts. Our automated flows recover 5-15% of abandoned carts and generate an average of $42 for every $1 invested.',
      services: 'Our e-commerce automations include:\n• Abandoned cart recovery (3 emails)\n• Welcome series for new customers\n• Post-purchase flows for retention\n• Automatic back-in-stock alerts\n• RFM segmentation\n• Winback for dormant customers',
      leads: 'For e-commerce, "leads" are your visitors. We set up complete tracking, smart popups, and conversion flows to turn visitors into buyers.'
    },
    saas: {
      intro: 'For SaaS, we configure automated onboarding, churn prevention, and feature adoption emails to maximize retention.',
      services: 'Our SaaS automations include:\n• Sequenced onboarding\n• Churn prevention (at-risk users)\n• Feature adoption emails\n• Automatic NPS surveys\n• Smart upsell triggers'
    },
    services: {
      intro: 'For service providers, we configure prospecting automation, appointment reminders, and post-mission testimonial requests.',
      services: 'Our services automations include:\n• Automated prospecting\n• Long-cycle lead nurturing\n• Appointment reminders\n• Testimonial requests\n• Automatic invoicing'
    }
  };

  // Topic responses
  // Responses by topic - OUTCOMES FOCUSED (no prices, no tech details)
  const topicResponses = {
    process: {
      keywords: ['process', 'how does it work', 'steps', 'explain', 'how do you'],
      response: `Here's how it works:\n\n1. **Diagnostic form** (5 min)\nDescribe your business and goals\n\n2. **Personalized Report** (24-48h)\nWe send you 3 priority recommendations\n\n3. **Custom Proposal**\nIf interested, we send a detailed quote tailored to your needs\n\n4. **Turnkey Implementation**\nWe configure everything - no technical skills needed\n\nNo mandatory calls - all written if you prefer!`
    },
    pricing: {
      keywords: ['price', 'cost', 'budget', 'quote', 'how much', 'pricing'],
      response: `Our pricing is fixed and transparent:\n\n**ONE-TIME PACKS:**\nFrom simple projects to complete deployments\n\n**MONTHLY RETAINERS:**\nOngoing maintenance and optimization\n\nThe audit is FREE and helps you choose the right package.\n\nSee our pricing at /en/pricing.html or request a custom quote!`
    },
    audit: {
      keywords: ['audit', 'free', 'diagnostic', 'analysis'],
      response: `The audit is 100% free!\n\n**What you get:**\n• Analysis of your current processes\n• Automation opportunities identified\n• Estimated ROI potential\n• Personalized recommendations\n\n**Timeframe:** 24-48h after the form\n\nWould you like me to send you the form link?`
    },
    automations: {
      keywords: ['automation', 'automations', 'workflow', 'flows', 'what can you'],
      response: `We offer a comprehensive automation catalog:\n\n**Email Marketing:**\nWelcome, Abandoned cart, Post-purchase, Winback\n\n**Lead Generation:**\nCapture, Scoring, Qualification, Nurturing\n\n**Analytics:**\nDashboards, Alerts, Automated reports\n\n**E-commerce:**\nProduct sync, Stock alerts, Reviews\n\n**AI & Video:**\nMarketing videos, AI Avatar, Voice AI\n\nWhich type interests you most?`
    },
    leads: {
      keywords: ['lead', 'prospect', 'customer', 'acquisition', 'find customers'],
      response: null // Will be replaced by industry-specific
    },
    difference: {
      keywords: ['difference', 'why you', 'agency', 'advantage', 'unique'],
      response: `What makes us different:\n\n• **Specialized agency**\nYou work directly with experts, not salespeople\n\n• **Fair pricing**\nTransparent, competitive rates\n\n• **Specialization**\nMarketing automation experts - not generalists\n\n• **Measurable results**\nProven ROI on every project\n\n• **Flexibility**\nNo long-term commitment required`
    },
    guarantee: {
      keywords: ['guarantee', 'risk', 'not work', 'satisfied'],
      response: `Our guarantee is simple:\n\n• **Satisfied or we iterate**\nIf automations don't work as expected, we fix until you're satisfied.\n\n• **Complete documentation**\nYou keep control, even without us.\n\n• **No commitment**\nPacks are one-time. Retainers cancelable anytime.\n\nWant to start with the free audit?`
    },
    timeline: {
      keywords: ['timeline', 'when', 'how long', 'duration', 'time'],
      response: `Timelines vary by project:\n\n• **Simple project:** 48-72h\n• **Standard project:** 5-7 days\n• **Complete project:** 10-14 days\n• **Free audit:** 24-48h\n\nThese include revisions. Rush available if needed.`
    },
    yes: {
      keywords: ['yes', 'sure', 'ok', 'let\'s go', 'interested', 'i want'],
      response: null // Depends on context
    },
    no: {
      keywords: ['no', 'not now', 'later', 'thinking'],
      response: `No problem! Take your time.\n\nThe free audit is always available. You can also email us at contact@3a-automation.com.\n\nFeel free to come back if you have questions!`
    },
    greetings: {
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      response: `Hello! I'm the 3A Automation assistant.\n\nI can help you:\n• Automate your marketing (emails, leads)\n• Understand our services\n• Get a free audit\n\nWhat industry are you in?`
    },
    thanks: {
      keywords: ['thanks', 'thank you', 'great', 'perfect', 'awesome'],
      response: `You're welcome!\n\nIf you're ready to take action, we recommend the free audit — it's the best way to see what we can do for you.\n\nMore questions? We're here!`
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
      return "Great! I'll help you book an appointment.\n\nFirst, what's your name?";
    }

    // Update context
    const detectedIndustry = detectIndustry(userMessage);
    if (detectedIndustry) conversationContext.industry = detectedIndustry;

    const detectedNeed = detectNeed(userMessage);
    if (detectedNeed) conversationContext.need = detectedNeed;

    // Check for confirmation ("yes")
    if (topicResponses.yes.keywords.some(kw => lower.includes(kw))) {
      if (conversationContext.lastTopic === 'process') {
        return `Perfect! To get started:\n• Go to /en/contact.html\n\nFill out the form (5 min) and we'll send the report in 24-48h.\n\nAny questions before starting?`;
      }
      if (conversationContext.lastTopic === 'audit') {
        return `Great! For your free audit:\n• Go to /en/contact.html\n\nWe'll send the report with 3 recommendations in 24-48h.\n\nOr email us directly at contact@3a-automation.com with your website link!`;
      }
      return `Excellent! Next step is the free audit.\n\n• Fill out the form at /en/contact.html\n• Or email: contact@3a-automation.com\n\nWe'll respond within 24h!`;
    }

    // Check enriched topics
    for (const [topic, data] of Object.entries(topicResponses)) {
      if (data.keywords.some(kw => lower.includes(kw))) {
        conversationContext.lastTopic = topic;

        // Special case: leads -> adapt to industry
        if (topic === 'leads' && conversationContext.industry) {
          const industryData = industryResponses[conversationContext.industry];
          if (industryData && industryData.leads) {
            return industryData.leads + '\n\nWould you like to know more about pricing?';
          }
        }

        if (data.response) return data.response;
      }
    }

    // Industry-specific response
    if (conversationContext.industry) {
      const industryData = industryResponses[conversationContext.industry];
      if (industryData) {
        if (lower.includes('service') || lower.includes('automation') || lower.includes('what')) {
          conversationContext.lastTopic = 'services';
          return industryData.services + '\n\nWhat interests you most?';
        }
        if (!conversationHistory.some(m => m.content.includes(industryData.intro.substring(0, 30)))) {
          return industryData.intro + '\n\nWhat\'s your main need?';
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
      return `For your ${conversationContext.industry.toUpperCase()} business, we can offer several solutions.\n\nLet's start with the free audit: we'll send you a personalized report with 3 priority recommendations in 24-48h.\n\nInterested?`;
    }

    // True default - qualification question
    return `To help you better, could you tell me:\n\n• What industry are you in?\n• What's your main need? (leads, email, analytics...)\n\nOr just request the free audit directly and we'll get back to you with personalized recommendations!`;
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
