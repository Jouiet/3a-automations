/**
 * agentic-transparency.js
 * Injects real-world verified data into the UI for "Brutally Honest" transparency.
 */

async function initAgenticTransparency() {
    console.log("Initializing Agentic Transparency...");

    try {
        const response = await fetch('data/agentic-status.json');
        const data = await response.json();

        // Update Banner
        const statusText = document.getElementById('system-status-text');
        const configText = document.getElementById('config-rate-text');

        if (statusText) statusText.textContent = data.system_status;
        if (configText) configText.textContent = data.config_rate;

        // Update API tags dynamically
        const apiScroll = document.getElementById('verified-apis-scroll');
        if (apiScroll && data.verified_apis) {
            apiScroll.innerHTML = '';
            Object.entries(data.verified_apis).forEach(([api, status]) => {
                const tag = document.createElement('span');
                tag.className = `api-tag ${status.includes('OK') ? 'ok' : 'warning'}`;
                tag.textContent = `${api} (${status})`;
                apiScroll.appendChild(tag);
            });
        }

    } catch (e) {
        console.warn("Failed to load agentic status data. Using fallback labels.", e);
    }
}

document.addEventListener('DOMContentLoaded', initAgenticTransparency);
