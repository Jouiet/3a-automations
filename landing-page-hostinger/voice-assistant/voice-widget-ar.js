/**
 * 3A Automation - Voice Assistant Widget (Arabic - MSA)
 * Version: 1.0
 *
 * Floating widget for AI voice assistant - Arabic Modern Standard version
 * Uses Web Speech API (free) + text fallback
 * RTL support enabled
 */

(function() {
  'use strict';

  // Configuration - 3A Automation Branding
  const CONFIG = {
    apiEndpoint: '/voice-assistant/api.php',
    welcomeMessage: 'مرحباً! أنا مساعد 3A Automation. كيف يمكنني مساعدتك اليوم؟',
    welcomeMessageTextOnly: 'مرحباً! أنا مساعد 3A Automation. اكتب سؤالك وسأرد عليك فوراً.',
    placeholder: 'اكتب سؤالك...',
    position: 'bottom-left',  // RTL: position on left
    primaryColor: '#4FBAF1',
    primaryDark: '#2B6685',
    accentColor: '#10B981',
    darkBg: '#191E35'
  };

  // === GA4 ANALYTICS TRACKING ===
  function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'voice_assistant',
        language: 'ar',
        ...params
      });
    }
    if (typeof dataLayer !== 'undefined' && Array.isArray(dataLayer)) {
      dataLayer.push({
        event: eventName,
        event_category: 'voice_assistant',
        language: 'ar',
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

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const needsTextFallback = !hasSpeechRecognition || isFirefox || isSafari;

  function createWidget() {
    if (document.getElementById('voice-assistant-widget')) {
      console.log('[3A Voice] Widget already exists, skipping duplicate creation');
      return;
    }
    const widget = document.createElement('div');
    widget.id = 'voice-assistant-widget';
    // RTL: Position on left side
    widget.style.cssText = 'position:fixed;bottom:30px;left:25px;z-index:99999;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;direction:rtl;';
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
          left: 25px;
          z-index: 99999;
          direction: rtl;
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
          left: 0;
          width: 360px;
          max-height: 500px;
          background: var(--va-dark);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          direction: rtl;
          text-align: right;
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
          flex-direction: row-reverse;
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
          margin-right: auto;
          margin-left: 0;
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
        .va-message.user { flex-direction: row; }
        .va-message.assistant { flex-direction: row-reverse; }
        .va-message-content {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
        }
        .va-message.assistant .va-message-content { background: rgba(255,255,255,0.1); color: #e5e5e5; }
        .va-message.user .va-message-content { background: var(--va-primary); color: white; }
        .va-input-area { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px; flex-direction: row-reverse; }
        .va-input {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 10px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          direction: rtl;
          text-align: right;
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
        .va-send-btn svg { width: 20px; height: 20px; fill: white; transform: scaleX(-1); }
        .va-typing { display: flex; gap: 4px; padding: 10px 14px; direction: ltr; }
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
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(-20px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes notifSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(-20px) scale(0.9); }
        }
        @media (max-width: 480px) { .va-panel { width: calc(100vw - 40px); left: -10px; } }
      </style>

      <button class="va-trigger" id="va-trigger" aria-label="فتح المساعد الصوتي">
        <img src="/logo.png" alt="3A" style="width:40px;height:40px;object-fit:contain;border-radius:8px;" />
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <img src="/logo.png" alt="3A" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />
          </div>
          <div class="va-header-text">
            <h3>مساعد 3A</h3>
            <p>${needsTextFallback ? 'اكتب سؤالك' : 'تحدث أو اكتب'}</p>
          </div>
          <button class="va-close" id="va-close" aria-label="إغلاق">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="va-messages" id="va-messages"></div>

        <div class="va-input-area">
          <input type="text" class="va-input" id="va-input" placeholder="${CONFIG.placeholder}">
          ${!needsTextFallback && hasSpeechRecognition ? `
          <button class="va-mic-btn" id="va-mic" aria-label="تفعيل الميكروفون">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
          </button>
          ` : ''}
          <button class="va-send-btn" id="va-send" aria-label="إرسال">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div class="va-cta">
          <a href="/ar/contact.html">اطلب تدقيقاً مجانياً</a>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    initEventListeners();

    setTimeout(() => {
      if (!isOpen) showNotificationBubble();
    }, 2000);
  }

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
        <span class="va-notif-title">هل تحتاج مساعدة؟</span>
        <span class="va-notif-sub">أنا هنا لخدمتك</span>
      </div>
    `;
    bubble.style.cssText = `
      position: absolute; bottom: 75px; left: 0;
      display: flex; align-items: center; gap: 10px;
      background: rgba(25, 30, 53, 0.95);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(79, 186, 241, 0.3);
      padding: 12px 16px; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 186, 241, 0.15);
      animation: notifSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer; white-space: nowrap; z-index: 9999;
      direction: rtl;
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
    arrow.style.cssText = `position: absolute; bottom: -6px; left: 24px; width: 12px; height: 12px; background: rgba(25, 30, 53, 0.95); border-left: 1px solid rgba(79, 186, 241, 0.3); border-bottom: 1px solid rgba(79, 186, 241, 0.3); transform: rotate(-45deg);`;
    bubble.appendChild(arrow);
    trigger.parentNode.appendChild(bubble);
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
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    synthesis.speak(utterance);
  }

  function initSpeechRecognition() {
    if (!hasSpeechRecognition) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
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
      addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو استخدام نموذج الاتصال.', 'assistant');
    }
  }

  // === INTELLIGENT RESPONSE SYSTEM ===

  let conversationContext = {
    industry: null,
    need: null,
    stage: 'discovery',
    lastTopic: null,
    bookingFlow: {
      active: false,
      step: null,
      data: {
        name: null,
        email: null,
        datetime: null,
        service: 'استشارة'
      }
    }
  };

  // === BOOKING SYSTEM ===
  const BOOKING_API = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec';
  const BOOKING_KEYWORDS = ['موعد', 'حجز', 'اجتماع', 'مكالمة', 'تحدث', 'نقاش', 'appointment', 'booking'];

  let availableSlotsCache = { slots: [], timestamp: 0 };
  const CACHE_TTL = 5 * 60 * 1000;

  function isBookingIntent(text) {
    const lower = text.toLowerCase();
    return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function fetchAvailableSlots() {
    const now = Date.now();
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
        const formattedSlots = result.data.slots.slice(0, 6).map(slot => {
          const date = new Date(slot.start);
          return {
            date: date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' }),
            iso: slot.start
          };
        });
        availableSlotsCache = { slots: formattedSlots, timestamp: now };
        return formattedSlots;
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }

    return getStaticSlots();
  }

  function getStaticSlots() {
    const now = new Date();
    const slots = [];
    for (let d = 1; d <= 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const day = date.getDay();
      if (day >= 0 && day <= 4) { // Sunday to Thursday for Arabic markets
        date.setHours(10, 0, 0, 0);
        slots.push({
          date: date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: '10:00',
          iso: date.toISOString()
        });
        if (slots.length >= 3) break;
      }
    }
    return slots;
  }

  function getNextSlotSuggestion() {
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
    const booking = conversationContext.bookingFlow;

    if (userMessage.includes('إلغاء') || userMessage.includes('لا') || userMessage.includes('توقف')) {
      trackEvent('voice_booking_cancelled', { step: booking.step });
      booking.active = false;
      booking.step = null;
      booking.data = { name: null, email: null, datetime: null, service: 'استشارة' };
      return "لا مشكلة، تم إلغاء الحجز. كيف يمكنني مساعدتك؟";
    }

    if (booking.step === 'name') {
      const name = userMessage.trim();
      if (name.length < 2) {
        return "لم أفهم اسمك. هل يمكنك تكراره؟";
      }
      booking.data.name = name;
      booking.step = 'email';
      return "شكراً " + name + "! ما هو بريدك الإلكتروني للتأكيد؟";
    }

    if (booking.step === 'email') {
      const email = userMessage.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return "هذا البريد الإلكتروني غير صالح. هل يمكنك التحقق منه؟ (مثال: example@email.com)";
      }
      booking.data.email = email;
      booking.step = 'datetime';

      const slots = await fetchAvailableSlots();
      const displaySlots = slots.slice(0, 3);

      if (displaySlots.length === 0) {
        return "عذراً، لا توجد مواعيد متاحة هذا الأسبوع. يمكنك مراسلتنا على contact@3a-automation.com";
      }

      return "ممتاز! إليك المواعيد المتاحة:\n\n" +
        displaySlots.map((s, i) => (i + 1) + ". " + s.date + " الساعة " + s.time).join("\n") +
        "\n\nرد بالرقم (1، 2، أو 3).";
    }

    if (booking.step === 'datetime') {
      const slots = getNextSlotSuggestion();
      let selectedSlot = null;

      if (userMessage.includes('1') || userMessage.includes('الأول') || userMessage.includes('واحد')) {
        selectedSlot = slots[0];
      } else if (userMessage.includes('2') || userMessage.includes('الثاني') || userMessage.includes('اثنين')) {
        selectedSlot = slots[1];
      } else if (userMessage.includes('3') || userMessage.includes('الثالث') || userMessage.includes('ثلاثة')) {
        selectedSlot = slots[2];
      }

      if (selectedSlot) {
        booking.data.datetime = selectedSlot.iso;
        booking.step = 'confirm';
        trackEvent('voice_booking_slot_selected', {
          slot_date: selectedSlot.date,
          slot_time: selectedSlot.time
        });
        return "رائع! إليك الملخص:\n\n" +
          "الاسم: " + booking.data.name + "\n" +
          "البريد: " + booking.data.email + "\n" +
          "التاريخ: " + selectedSlot.date + " الساعة " + selectedSlot.time + "\n\n" +
          "هل تؤكد هذا الموعد؟ (نعم/لا)";
      }

      return "لم أفهم. رد بـ 1 أو 2 أو 3 لاختيار الموعد.";
    }

    if (booking.step === 'confirm') {
      if (userMessage.includes('نعم') || userMessage.includes('موافق') || userMessage.includes('أكيد') || userMessage.includes('تمام')) {
        booking.step = 'submitting';
        return null;
      }
      return "قل 'نعم' للتأكيد أو 'إلغاء' للبدء من جديد.";
    }

    return null;
  }

  function getClientTimezone() {
    if (window.GeoLocale && typeof window.GeoLocale.getTimezone === 'function') {
      return window.GeoLocale.getTimezone();
    }
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
      notes: 'حجز عبر المساعد الصوتي (AR)',
      timezone: clientTz.iana || `UTC${clientTz.offset > 0 ? '-' : '+'}${Math.abs(clientTz.offset / 60)}`
    });

    booking.active = false;
    booking.step = null;

    if (result.success) {
      trackEvent('voice_booking_completed', {
        service: booking.data.service,
        datetime: booking.data.datetime
      });
      return "تم تأكيد موعدك! ستصلك رسالة تأكيد على " + booking.data.email + ".\n\nنراك قريباً!";
    } else {
      trackEvent('voice_booking_failed', {
        error: result.message
      });
      return "عذراً، حدثت مشكلة: " + result.message + "\n\nيمكنك الحجز مباشرة على /ar/booking.html";
    }
  }

  function detectIndustry(text) {
    const industries = {
      'construction': ['بناء', 'مقاولات', 'عقارات', 'تجديد', 'إنشاءات'],
      'ecommerce': ['تجارة إلكترونية', 'متجر', 'شوبيفاي', 'ووكومرس', 'بيع أونلاين'],
      'b2b': ['b2b', 'شركات', 'مؤسسات', 'أعمال'],
      'saas': ['برمجيات', 'تطبيق', 'ستارتب', 'تقنية'],
      'services': ['خدمات', 'وكالة', 'استشارات', 'فريلانس']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(kw => text.includes(kw))) return industry;
    }
    return null;
  }

  function detectNeed(text) {
    const needs = {
      'leads': ['عملاء', 'زبائن', 'محتملين', 'استقطاب'],
      'email': ['إيميل', 'بريد', 'نشرة', 'تسويق'],
      'analytics': ['تحليلات', 'بيانات', 'تقارير', 'إحصائيات'],
      'automation': ['أتمتة', 'توفير وقت', 'تلقائي'],
      'quote': ['سعر', 'تكلفة', 'عرض سعر', 'ميزانية']
    };

    for (const [need, keywords] of Object.entries(needs)) {
      if (keywords.some(kw => text.includes(kw))) return need;
    }
    return null;
  }

  const industryResponses = {
    construction: {
      intro: 'للبناء والمقاولات، نقدم حلولاً متخصصة: استقطاب العملاء عبر خرائط جوجل، متابعة العروض تلقائياً، وطلب التقييمات بعد المشاريع.',
      services: 'خدمات الأتمتة للبناء تشمل:\n• استخراج بيانات المشاريع من خرائط جوجل\n• متابعة المناقصات تلقائياً\n• تذكيرات العروض المجدولة\n• رسائل رضا العملاء\n• طلب تقييمات جوجل تلقائياً',
      leads: 'لاستقطاب عملاء البناء، نستخدم خرائط جوجل لتحديد المشاريع الجارية والشركات. يمكننا أيضاً متابعة المناقصات الحكومية تلقائياً.'
    },
    b2b: {
      intro: 'للأعمال B2B، نركز على تأهيل العملاء المحتملين تلقائياً، تقييم الجودة، وسلاسل الرعاية لتحويل العملاء البارِدين إلى مشترين.',
      services: 'خدمات الأتمتة B2B تشمل:\n• تقييم العملاء المحتملين تلقائياً\n• سلاسل رعاية (5-10 رسائل)\n• مزامنة CRM (HubSpot، Pipedrive)\n• تنبيهات المبيعات الفورية\n• تأهيل العملاء تلقائياً',
      leads: 'لاستقطاب عملاء B2B، نُعد تدفقات استقطاب من LinkedIn والنماذج، ونؤهل تلقائياً حسب معاييرك. العملاء الساخنون يطلقون تنبيهات فورية.'
    },
    ecommerce: {
      intro: 'للتجارة الإلكترونية، نحن خبراء في Klaviyo وShopify. تدفقاتنا الآلية تسترجع 5-15% من السلات المهجورة وتحقق متوسط 42$ لكل 1$ مستثمر.',
      services: 'خدمات الأتمتة للتجارة الإلكترونية:\n• استرجاع السلات المهجورة (3 رسائل)\n• سلسلة ترحيب للعملاء الجدد\n• تدفقات ما بعد الشراء للاحتفاظ\n• تنبيهات توفر المنتجات\n• تقسيم RFM\n• استعادة العملاء الخاملين',
      leads: 'في التجارة الإلكترونية، "العملاء المحتملون" هم زوارك. نُعد تتبعاً كاملاً، نوافذ ذكية، وتدفقات تحويل.'
    },
    saas: {
      intro: 'لـ SaaS، نُعد الإعداد الآلي، منع التسرب، ورسائل تبني الميزات لتعظيم الاحتفاظ.',
      services: 'خدمات الأتمتة SaaS:\n• إعداد متسلسل\n• منع التسرب (المستخدمون المعرضون للخطر)\n• رسائل تبني الميزات\n• استطلاعات NPS تلقائية\n• محفزات الترقية الذكية'
    },
    services: {
      intro: 'لمقدمي الخدمات، نُعد أتمتة التنقيب، تذكيرات المواعيد، وطلب الشهادات بعد الخدمة.',
      services: 'خدمات الأتمتة للخدمات:\n• تنقيب آلي\n• رعاية عملاء طويلة المدى\n• تذكيرات المواعيد\n• طلب الشهادات\n• الفوترة التلقائية'
    }
  };

  const topicResponses = {
    process: {
      keywords: ['كيف', 'طريقة', 'خطوات', 'شرح', 'آلية'],
      response: `هكذا نعمل:\n\n1. **نموذج التشخيص** (5 دقائق)\nصف عملك وأهدافك\n\n2. **تقرير مخصص** (24-48 ساعة)\nnرسل لك 3 توصيات أولوية\n\n3. **عرض مخصص**\nإذا أعجبك، نرسل عرض سعر مفصل\n\n4. **تنفيذ جاهز**\nنُعد كل شيء - لا تحتاج مهارات تقنية\n\nبدون مكالمات إلزامية - كل شيء كتابي إذا فضلت!`
    },
    pricing: {
      keywords: ['سعر', 'تكلفة', 'ميزانية', 'عرض', 'كم'],
      response: `أسعارنا ثابتة وشفافة:\n\n**باقات لمرة واحدة:**\nمن مشاريع بسيطة إلى نشر كامل\n\n**اشتراكات شهرية:**\nصيانة وتحسين مستمر\n\nالتدقيق مجاني ويساعدك على اختيار الباقة المناسبة.\n\nشاهد أسعارنا على /ar/pricing.html أو اطلب عرضاً مخصصاً!`
    },
    audit: {
      keywords: ['تدقيق', 'مجاني', 'تشخيص', 'تحليل'],
      response: `التدقيق مجاني 100%!\n\n**ما تحصل عليه:**\n• تحليل عملياتك الحالية\n• تحديد فرص الأتمتة\n• تقدير العائد المحتمل\n• توصيات مخصصة\n\n**المدة:** 24-48 ساعة بعد النموذج\n\nهل تريد رابط النموذج؟`
    },
    automations: {
      keywords: ['أتمتة', 'آلي', 'تدفقات', 'ماذا يمكنكم'],
      response: `نقدم كتالوجاً شاملاً من الأتمتة:\n\n**التسويق بالبريد:**\nترحيب، سلة مهجورة، ما بعد الشراء، استعادة\n\n**استقطاب العملاء:**\nالتقاط، تقييم، تأهيل، رعاية\n\n**التحليلات:**\nلوحات معلومات، تنبيهات، تقارير آلية\n\n**التجارة الإلكترونية:**\nمزامنة المنتجات، تنبيهات المخزون، التقييمات\n\n**الذكاء الاصطناعي:**\nفيديوهات تسويقية، أفاتار ذكي، صوت ذكي\n\nما النوع الذي يهمك أكثر؟`
    },
    leads: {
      keywords: ['عملاء', 'زبائن', 'محتملين', 'استقطاب'],
      response: null
    },
    difference: {
      keywords: ['فرق', 'لماذا أنتم', 'ميزة', 'مختلف'],
      response: `ما يميزنا:\n\n• **وكالة متخصصة**\nتعمل مباشرة مع خبراء، ليس مندوبي مبيعات\n\n• **أسعار عادلة**\nشفافة وتنافسية\n\n• **تخصص**\nخبراء أتمتة التسويق - ليس عموميين\n\n• **نتائج قابلة للقياس**\nعائد مثبت في كل مشروع\n\n• **مرونة**\nبدون التزام طويل المدى إلزامي`
    },
    guarantee: {
      keywords: ['ضمان', 'مخاطر', 'لا يعمل', 'راضي'],
      response: `ضماننا بسيط:\n\n• **راضٍ أو نكرر**\nإذا لم تعمل الأتمتة كما توقعت، نصلحها حتى ترضى.\n\n• **توثيق كامل**\nتحتفظ بالسيطرة، حتى بدوننا.\n\n• **بدون التزام**\nالباقات لمرة واحدة. الاشتراكات قابلة للإلغاء في أي وقت.\n\nهل تريد البدء بالتدقيق المجاني؟`
    },
    timeline: {
      keywords: ['متى', 'كم يستغرق', 'مدة', 'وقت'],
      response: `المدد تختلف حسب المشروع:\n\n• **مشروع بسيط:** 48-72 ساعة\n• **مشروع عادي:** 5-7 أيام\n• **مشروع كامل:** 10-14 يوم\n• **التدقيق المجاني:** 24-48 ساعة\n\nهذا يشمل المراجعات. خدمة عاجلة متاحة إذا احتجت.`
    },
    yes: {
      keywords: ['نعم', 'أكيد', 'موافق', 'تمام', 'ممتاز', 'أريد'],
      response: null
    },
    no: {
      keywords: ['لا', 'ليس الآن', 'لاحقاً', 'أفكر'],
      response: `لا مشكلة! خذ وقتك.\n\nالتدقيق المجاني متاح دائماً. يمكنك أيضاً مراسلتنا على contact@3a-automation.com.\n\nلا تتردد في العودة إذا كانت لديك أسئلة!`
    },
    greetings: {
      keywords: ['مرحبا', 'أهلا', 'السلام', 'صباح', 'مساء'],
      response: `مرحباً! أنا مساعد 3A Automation.\n\nيمكنني مساعدتك في:\n• أتمتة تسويقك (بريد، عملاء)\n• فهم خدماتنا\n• الحصول على تدقيق مجاني\n\nما هو مجال عملك؟`
    },
    thanks: {
      keywords: ['شكرا', 'ممتاز', 'رائع', 'جميل'],
      response: `عفواً!\n\nإذا كنت مستعداً للتحرك، ننصح بالتدقيق المجاني — إنها أفضل طريقة لترى ما يمكننا فعله لك.\n\nأسئلة أخرى؟ نحن هنا!`
    }
  };

  async function getAIResponse(userMessage) {
    // === BOOKING FLOW ===
    if (conversationContext.bookingFlow.active) {
      const bookingResponse = await handleBookingFlow(userMessage);
      if (conversationContext.bookingFlow.step === 'submitting') {
        return await processBookingConfirmation();
      }
      if (bookingResponse) {
        return bookingResponse;
      }
    }

    if (isBookingIntent(userMessage)) {
      conversationContext.bookingFlow.active = true;
      conversationContext.bookingFlow.step = 'name';
      trackEvent('voice_booking_started', { step: 'name' });
      return "رائع! سأساعدك في حجز موعد.\n\nأولاً، ما اسمك؟";
    }

    const detectedIndustry = detectIndustry(userMessage);
    if (detectedIndustry) conversationContext.industry = detectedIndustry;

    const detectedNeed = detectNeed(userMessage);
    if (detectedNeed) conversationContext.need = detectedNeed;

    if (topicResponses.yes.keywords.some(kw => userMessage.includes(kw))) {
      if (conversationContext.lastTopic === 'process') {
        return `ممتاز! للبدء:\n• اذهب إلى /ar/contact.html\n\nاملأ النموذج (5 دقائق) وسنرسل التقرير في 24-48 ساعة.\n\nأي أسئلة قبل البدء؟`;
      }
      if (conversationContext.lastTopic === 'audit') {
        return `رائع! للتدقيق المجاني:\n• اذهب إلى /ar/contact.html\n\nسنرسل التقرير مع 3 توصيات في 24-48 ساعة.\n\nأو راسلنا مباشرة على contact@3a-automation.com مع رابط موقعك!`;
      }
      return `ممتاز! الخطوة التالية هي التدقيق المجاني.\n\n• املأ النموذج على /ar/contact.html\n• أو البريد: contact@3a-automation.com\n\nنرد خلال 24 ساعة!`;
    }

    for (const [topic, data] of Object.entries(topicResponses)) {
      if (data.keywords.some(kw => userMessage.includes(kw))) {
        conversationContext.lastTopic = topic;

        if (topic === 'leads' && conversationContext.industry) {
          const industryData = industryResponses[conversationContext.industry];
          if (industryData && industryData.leads) {
            return industryData.leads + '\n\nهل تريد معرفة المزيد عن الأسعار؟';
          }
        }

        if (data.response) return data.response;
      }
    }

    if (conversationContext.industry) {
      const industryData = industryResponses[conversationContext.industry];
      if (industryData) {
        if (userMessage.includes('خدمة') || userMessage.includes('أتمتة') || userMessage.includes('ماذا')) {
          conversationContext.lastTopic = 'services';
          return industryData.services + '\n\nما الذي يهمك أكثر؟';
        }
        if (!conversationHistory.some(m => m.content.includes(industryData.intro.substring(0, 30)))) {
          return industryData.intro + '\n\nما احتياجك الرئيسي؟';
        }
      }
    }

    if (conversationContext.need === 'quote') {
      conversationContext.lastTopic = 'pricing';
      return topicResponses.pricing.response;
    }

    if (conversationContext.industry) {
      return `لعملك في مجال ${conversationContext.industry.toUpperCase()}، يمكننا تقديم حلول متعددة.\n\nلنبدأ بالتدقيق المجاني: سنرسل لك تقريراً مخصصاً مع 3 توصيات أولوية في 24-48 ساعة.\n\nمهتم؟`;
    }

    return `لمساعدتك بشكل أفضل، هل يمكنك إخباري:\n\n• ما هو مجال عملك؟\n• ما احتياجك الرئيسي؟ (عملاء، بريد، تحليلات...)\n\nأو اطلب التدقيق المجاني مباشرة وسنرد بتوصيات مخصصة!`;
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
