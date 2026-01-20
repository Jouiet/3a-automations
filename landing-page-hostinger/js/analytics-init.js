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
