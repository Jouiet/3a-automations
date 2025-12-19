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

  // System prompt pour l'assistant
  const SYSTEM_PROMPT = `Tu es l'assistant vocal de 3A Automation.

IDENTITÉ:
- Consultant automation pour PME e-commerce
- Expert Klaviyo, Shopify, Analytics
- Site: 3a-automation.com

SERVICES (nouveaux prix):
- Audit gratuit: Formulaire → Rapport PDF 24-48h
- Quick Win: 390€ (1 flow optimisé)
- Essentials: 790€ (3 flows + A/B tests)
- Growth: 1490€ (5 flows + dashboard)
- Retainers: 290-890€/mois

STYLE:
- Réponses courtes (2-3 phrases max)
- Propose toujours l'audit gratuit
- Pas de jargon technique
- Ton professionnel mais accessible

OBJECTIF:
- Qualifier le prospect
- Proposer l'audit gratuit
- Rediriger vers le formulaire contact`;

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
        }

        .va-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(79, 186, 241, 0.6);
        }

        .va-trigger svg {
          width: 28px;
          height: 28px;
          fill: white;
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

        @media (max-width: 480px) {
          .va-panel {
            width: calc(100vw - 40px);
            right: -10px;
          }
        }
      </style>

      <button class="va-trigger" id="va-trigger" aria-label="Ouvrir l'assistant vocal">
        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
      </button>

      <div class="va-panel" id="va-panel">
        <div class="va-header">
          <div class="va-header-icon">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
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

  // Notification bubble
  function showNotificationBubble() {
    const trigger = document.getElementById('va-trigger');
    const bubble = document.createElement('div');
    bubble.className = 'va-notification';
    bubble.innerHTML = '👋 Besoin d\'aide ?';
    bubble.style.cssText = `
      position: absolute;
      bottom: 70px;
      right: 0;
      background: white;
      color: #333;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeIn 0.3s ease;
      cursor: pointer;
    `;
    trigger.parentNode.appendChild(bubble);

    bubble.addEventListener('click', togglePanel);

    setTimeout(() => {
      bubble.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => bubble.remove(), 300);
    }, 5000);
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

  // Obtenir réponse IA (simulation locale ou API)
  async function getAIResponse(userMessage) {
    // Réponses pré-définies pour les questions courantes (fallback gratuit)
    const responses = {
      'audit': 'Notre audit e-commerce est 100% gratuit ! Remplissez le formulaire en bas de page, et vous recevrez un rapport PDF détaillé sous 24-48h avec 3 quick wins actionnables.',
      'prix': 'Nos tarifs : Quick Win à 390€ (1 flow), Essentials à 790€ (3 flows + A/B tests), ou Growth à 1490€ (5 flows + dashboard). Commencez par l\'audit gratuit pour voir ce qui vous convient !',
      'tarif': 'Nos tarifs : Quick Win à 390€ (1 flow), Essentials à 790€ (3 flows + A/B tests), ou Growth à 1490€ (5 flows + dashboard). Commencez par l\'audit gratuit pour voir ce qui vous convient !',
      'combien': 'Nos tarifs : Quick Win à 390€ (1 flow), Essentials à 790€ (3 flows + A/B tests), ou Growth à 1490€ (5 flows + dashboard). Commencez par l\'audit gratuit pour voir ce qui vous convient !',
      'gratuit': 'Oui ! L\'audit e-commerce est totalement gratuit. Formulaire → Rapport PDF sous 24-48h → 3 recommandations prioritaires. Aucun engagement.',
      'email': 'Je suis spécialisé en email automation avec Klaviyo. Flows automatisés : welcome series, abandoned cart, post-purchase, winback. ROI moyen : 42€ pour 1€ investi.',
      'klaviyo': 'Expert Klaviyo confirmé ! Je configure vos flows automatisés : welcome series, abandoned cart, post-purchase, winback. Demandez l\'audit gratuit pour voir vos opportunités.',
      'shopify': 'J\'intègre Shopify avec Klaviyo pour synchroniser vos clients, commandes et produits. Automation complète de votre email marketing.',
      'bonjour': 'Bonjour ! Je suis l\'assistant 3A Automation. Je peux vous renseigner sur nos services d\'automation e-commerce. Que puis-je faire pour vous ?',
      'salut': 'Salut ! Comment puis-je vous aider avec votre e-commerce ? Audit gratuit, email automation, analytics... je suis là !',
      'aide': 'Je peux vous aider avec : email automation (Klaviyo), analytics (GA4), audit e-commerce gratuit, ou répondre à vos questions sur nos services.',
      'contact': 'Pour nous contacter : email contact@3a-automation.com ou remplissez le formulaire sur cette page. Réponse sous 24h garantie.',
      'merci': 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. Et pensez à demander votre audit gratuit !',
      'comment': 'Le processus est simple : 1) Remplissez le formulaire (5 min), 2) Recevez votre rapport PDF (24-48h), 3) On discute des recommandations par email. Pas d\'appel obligatoire !',
      'retainer': 'Nos retainers mensuels : Maintenance 290€/mois (3h), Optimization 490€/mois (5h), Growth 890€/mois (10h). Après un pack setup initial.',
      'mensuel': 'Nos retainers mensuels : Maintenance 290€/mois (3h), Optimization 490€/mois (5h), Growth 890€/mois (10h). Idéal pour l\'optimisation continue.',
    };

    // Chercher une correspondance
    const lowerMessage = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Réponse par défaut
    return 'Bonne question ! Pour une réponse personnalisée, je vous recommande de demander votre audit gratuit. Vous recevrez un rapport détaillé sous 24-48h. Souhaitez-vous que je vous explique le processus ?';
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
