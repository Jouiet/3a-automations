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
    placeholder: 'Ask your question...',
    position: 'bottom-right',
    primaryColor: '#4FBAF1',      // 3A Primary Blue
    primaryDark: '#2B6685',       // 3A Primary Dark
    accentColor: '#10B981',       // 3A Accent Green
    darkBg: '#191E35'             // 3A Secondary (Dark)
  };

  let isOpen = false;
  let isListening = false;
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let conversationHistory = [];

  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;

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
        }
        .va-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(79, 186, 241, 0.6);
        }
        .va-trigger svg { width: 28px; height: 28px; fill: white; }
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
        @media (max-width: 480px) { .va-panel { width: calc(100vw - 40px); right: -10px; } }
      </style>

      <button class="va-trigger" id="va-trigger" aria-label="Open voice assistant">
        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
          </div>
          <div class="va-header-text">
            <h3>3A Assistant</h3>
            <p>${hasSpeechRecognition ? 'Speak or type' : 'Type your question'}</p>
          </div>
          <button class="va-close" id="va-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="va-messages" id="va-messages"></div>

        <div class="va-input-area">
          <input type="text" class="va-input" id="va-input" placeholder="${CONFIG.placeholder}">
          ${hasSpeechRecognition ? `
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

  function showNotificationBubble() {
    const trigger = document.getElementById('va-trigger');
    const bubble = document.createElement('div');
    bubble.innerHTML = '👋 Need help?';
    bubble.style.cssText = `
      position: absolute; bottom: 70px; right: 0;
      background: white; color: #333;
      padding: 8px 12px; border-radius: 8px;
      font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeIn 0.3s ease; cursor: pointer;
    `;
    trigger.parentNode.appendChild(bubble);
    bubble.addEventListener('click', togglePanel);
    setTimeout(() => {
      bubble.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => bubble.remove(), 300);
    }, 5000);
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

  async function getAIResponse(userMessage) {
    const responses = {
      'audit': 'Our e-commerce audit is 100% free! Fill out the form at the bottom of the page, and you\'ll receive a detailed PDF report within 24-48h with 3 actionable quick wins.',
      'price': 'Our pricing: Quick Win at $420 (1 flow), Essentials at $855 (3 flows + A/B tests), or Growth at $1,610 (5 flows + dashboard). Start with the free audit to see what fits you best!',
      'cost': 'Our pricing: Quick Win at $420 (1 flow), Essentials at $855 (3 flows + A/B tests), or Growth at $1,610 (5 flows + dashboard). Start with the free audit to see what fits you best!',
      'how much': 'Our pricing: Quick Win at $420 (1 flow), Essentials at $855 (3 flows + A/B tests), or Growth at $1,610 (5 flows + dashboard). Start with the free audit to see what fits you best!',
      'free': 'Yes! The e-commerce audit is completely free. Form → PDF report in 24-48h → 3 priority recommendations. No commitment required.',
      'email': 'I specialize in email automation with Klaviyo. Automated flows: welcome series, abandoned cart, post-purchase, winback. Average ROI: $42 for every $1 invested.',
      'klaviyo': 'Confirmed Klaviyo expert! I set up your automated flows: welcome series, abandoned cart, post-purchase, winback. Request the free audit to see your opportunities.',
      'shopify': 'I integrate Shopify with Klaviyo to sync your customers, orders, and products. Complete automation of your email marketing.',
      'hello': 'Hello! I\'m the 3A Automation assistant. I can help you with e-commerce automation. How can I assist you?',
      'hi': 'Hi! How can I help with your e-commerce? Free audit, email automation, analytics... I\'m here to help!',
      'help': 'I can help you with: email automation (Klaviyo), analytics (GA4), free e-commerce audit, or answer questions about our services.',
      'contact': 'To contact us: email contact@3a-automation.com or fill out the form on this page. Response guaranteed within 24h.',
      'thanks': 'You\'re welcome! Don\'t hesitate if you have more questions. And remember to request your free audit!',
      'thank': 'You\'re welcome! Don\'t hesitate if you have more questions. And remember to request your free audit!',
      'how': 'The process is simple: 1) Fill out the form (5 min), 2) Receive your PDF report (24-48h), 3) We discuss recommendations via email. No mandatory calls!',
      'retainer': 'Our monthly retainers: Maintenance $315/month (3h), Optimization $530/month (5h), Growth $960/month (10h). After an initial setup pack.',
      'monthly': 'Our monthly retainers: Maintenance $315/month (3h), Optimization $530/month (5h), Growth $960/month (10h). Ideal for ongoing optimization.',
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return 'Great question! For a personalized answer, I recommend requesting your free audit. You\'ll receive a detailed report within 24-48h. Would you like me to explain the process?';
  }

  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('va-panel');
    if (isOpen) {
      panel.classList.add('open');
      if (conversationHistory.length === 0) addMessage(CONFIG.welcomeMessage, 'assistant');
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
