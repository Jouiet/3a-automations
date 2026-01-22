// General UI Initialization & Lazy Loading
(function () {
    // 1. Voice Assistant Lazy Loader
    var voiceLoaded = false;
    function loadVoiceWidget() {
        if (voiceLoaded) return;
        voiceLoaded = true;
        var s = document.createElement('script');
        // Determine language from HTML tag
        var lang = document.documentElement.lang || 'fr';
        s.src = (lang === 'en') ? '/voice-assistant/voice-widget-en.js?v=24.0' : '/voice-assistant/voice-widget.js?v=24.0';
        s.defer = true;
        document.body.appendChild(s);
    }

    // Load after 10s or on interaction
    setTimeout(loadVoiceWidget, 10000);
    ['scroll', 'click', 'touchstart', 'keydown'].forEach(function (e) {
        window.addEventListener(e, loadVoiceWidget, { once: true, passive: true });
    });

    // 2. Multi-Market Currency Handler
    document.addEventListener('DOMContentLoaded', function () {
        function updateCurrencyAttr(currency) {
            document.documentElement.setAttribute('data-currency', currency);
        }

        document.addEventListener('geo-locale-ready', function (e) {
            updateCurrencyAttr(e.detail.currency);
        });

        document.addEventListener('currency-changed', function (e) {
            updateCurrencyAttr(e.detail.currency);
        });

        const savedCurrency = localStorage.getItem('user-currency');
        if (savedCurrency) {
            updateCurrencyAttr(savedCurrency);
        }
    });

    // 3. Mobile Menu Toggle (if script.js is not handle it)
    document.addEventListener('DOMContentLoaded', function () {
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const navMenu = document.getElementById('nav-menu');
        if (mobileBtn && navMenu) {
            mobileBtn.addEventListener('click', function () {
                mobileBtn.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    });
})();
