window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
(function () {
    var loaded = false;
    function loadAnalytics() {
        if (loaded) return;
        loaded = true;
        var gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WLVJQC3M';
        document.head.appendChild(gtmScript);
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var ga4Script = document.createElement('script');
        ga4Script.async = true;
        ga4Script.src = 'https://www.googletagmanager.com/gtag/js?id=G-87F6FDJG45';
        ga4Script.onload = function () {
            gtag('js', new Date());
            gtag('config', 'G-87F6FDJG45', { 'anonymize_ip': true });
        };
        document.head.appendChild(ga4Script);
    }
    setTimeout(loadAnalytics, 3000);
    ['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(function (e) {
        document.addEventListener(e, loadAnalytics, { once: true, passive: true });
    });
})();

// Core Web Vitals Reporter - sends LCP, INP, CLS to GA4
(function () {
    function sendCWV(name, value, rating) {
        if (typeof gtag === 'function') {
            gtag('event', name, {
                value: Math.round(name === 'CLS' ? value * 1000 : value),
                event_category: 'Web Vitals',
                event_label: rating,
                non_interaction: true
            });
        }
    }
    function getRating(name, value) {
        var thresholds = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25] };
        var t = thresholds[name];
        if (!t) return 'unknown';
        return value <= t[0] ? 'good' : value <= t[1] ? 'needs-improvement' : 'poor';
    }
    // LCP
    if (typeof PerformanceObserver !== 'undefined') {
        try {
            new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                var last = entries[entries.length - 1];
                if (last) sendCWV('LCP', last.startTime, getRating('LCP', last.startTime));
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}
        // CLS
        try {
            var clsValue = 0;
            new PerformanceObserver(function (list) {
                list.getEntries().forEach(function (entry) {
                    if (!entry.hadRecentInput) clsValue += entry.value;
                });
            }).observe({ type: 'layout-shift', buffered: true });
            addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'hidden') {
                    sendCWV('CLS', clsValue, getRating('CLS', clsValue));
                }
            }, { once: true });
        } catch (e) {}
        // INP
        try {
            var inpValue = 0;
            new PerformanceObserver(function (list) {
                list.getEntries().forEach(function (entry) {
                    var duration = entry.duration || entry.processingEnd - entry.startTime;
                    if (duration > inpValue) inpValue = duration;
                });
            }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
            addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'hidden' && inpValue > 0) {
                    sendCWV('INP', inpValue, getRating('INP', inpValue));
                }
            }, { once: true });
        } catch (e) {}
    }
})();
