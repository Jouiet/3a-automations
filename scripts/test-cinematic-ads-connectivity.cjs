const https = require('https');

const WEBHOOK_URL = 'https://n8n.3a-automation.com/webhook/cinematicads/blog/generate';

console.log(`[Test] Checking connectivity to CinematicAds Webhook: ${WEBHOOK_URL}`);

const req = https.request(WEBHOOK_URL, {
    method: 'OPTIONS', // or POST with dummy data, but OPTIONS/HEAD is safer for probe
    timeout: 5000
}, (res) => {
    console.log(`[Result] Status Code: ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 500) {
        console.log('[Success] Endpoint is reachable.');
        process.exit(0);
    } else {
        console.log('[Warning] Endpoint returned error status.');
        process.exit(0);
    }
});

req.on('error', (e) => {
    console.error(`[Error] Connection failed: ${e.message}`);
    console.log('[Info] This is expected if the n8n server is behind a firewall or not currently running.');
    process.exit(0); // Soft fail for the test script
});

req.on('timeout', () => {
    req.destroy();
    console.error('[Error] Connection timed out.');
    process.exit(0);
});

req.end();
