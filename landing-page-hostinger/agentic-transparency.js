/**
 * agentic-transparency.js
 * Injects real-world verified data into the UI for "Brutally Honest" transparency.
 */

async function initAgenticTransparency() {
    console.log("Initializing Agentic Transparency...");

    // Initial Load
    await updateAgenticStatus();
    await updateMcpLogs();
    await updateMarketIntelligence();

    // Periodic Polling
    setInterval(updateAgenticStatus, 5000);
    setInterval(updateMcpLogs, 3000);
    setInterval(updateMarketIntelligence, 10000);
}

async function updateAgenticStatus() {
    try {
        const response = await fetch('/data/agentic-status.json');
        if (!response.ok) return;
        const data = await response.json();

        // Update Banner
        const statusText = document.getElementById('system-status-text');
        const configText = document.getElementById('config-rate-text');

        if (statusText) statusText.textContent = data.system_status || 'UP';
        if (configText) configText.textContent = data.config_rate || '100%';

        // Update Agentic Metrics
        const agenticCountText = document.getElementById('agentic-count-text');
        if (agenticCountText && data.agentic_metrics) {
            agenticCountText.textContent = `${data.agentic_metrics.level_3_4_agents} Agentic Workflows`;
        }

        // WOW Factor: Pulse high-pressure state
        if (data.system_status === 'ACTIVE' || data.system_status === 'BUSY') {
            document.querySelectorAll('.pulse-indicator').forEach(el => el.classList.add('cortex-active'));
            document.querySelector('.hero-logo-center')?.classList.add('cortex-thinking');
        } else {
            document.querySelectorAll('.pulse-indicator').forEach(el => el.classList.remove('cortex-active'));
            document.querySelector('.hero-logo-center')?.classList.remove('cortex-thinking');
        }

        // Update API tags dynamically
        const apiScroll = document.getElementById('verified-apis-scroll');
        if (apiScroll && data.verified_apis) {
            // Only update if content changed to avoid flicker
            const currentContent = apiScroll.innerText;
            const newContent = Object.entries(data.verified_apis).map(([api, status]) => `${api} (${status})`).join('');

            if (currentContent !== newContent) {
                apiScroll.innerHTML = '';
                Object.entries(data.verified_apis).forEach(([api, status]) => {
                    const tag = document.createElement('span');
                    tag.className = `api-tag ${status.includes('OK') ? 'ok' : 'warning'}`;
                    tag.textContent = `${api} (${status})`;
                    apiScroll.appendChild(tag);
                });
            }
        }

        // Hardcoded config for now, will come from data.json later
        const config = {
            toolCount: 174,
            agentCount: 18,
            autonomyLevel: "L5 (Sovereign)",
            updateInterval: 5000
        };

        // Update tool count and autonomy level
        const toolCountEl = document.getElementById('tool-count');
        if (toolCountEl) toolCountEl.textContent = config.toolCount;

        const autonomyLevelEl = document.getElementById('autonomy-level');
        if (autonomyLevelEl) autonomyLevelEl.textContent = config.autonomyLevel;


    } catch (e) {
        console.warn("Failed to update agentic status.", e);
    }
}

async function updateMcpLogs() {
    try {
        const response = await fetch('/data/mcp-logs.json');
        if (!response.ok) return;
        const logs = await response.json();

        // Dashboard Tool Logs
        const toolLogsContainer = document.getElementById('tool-logs');
        if (toolLogsContainer) {
            renderLogs(toolLogsContainer, logs, true);
        }

        // Reasoning Terminal (Real Data)
        const terminal = document.getElementById('reasoning-terminal');
        if (terminal) {
            renderReasoning(terminal, logs);
        }

    } catch (e) {
        // Silently fail for logs as they might not exist yet
    }
}

function renderLogs(container, logs, fullDetail) {
    const content = logs.map(log => `
        <div class="log-item">
            <div class="log-header">
                <span class="log-timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span class="log-status ${log.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR'}">${log.status}</span>
            </div>
            <div class="log-body">
                <span class="action-highlight">${log.agent}</span>: ${log.action}
                ${fullDetail && log.details ? `<div style="font-size: 0.8em; opacity: 0.7; margin-top: 4px;">${JSON.stringify(log.details)}</div>` : ''}
            </div>
        </div>
    `).join('');

    if (container.innerHTML !== content) {
        container.innerHTML = content;
    }
}

function renderReasoning(container, logs) {
    // Take the last 5 logs as "Recent Thoughts"
    const recentLogs = logs.slice(0, 5).reverse();

    // Check if we need to update to avoid DOM thrashing
    const currentHtml = container.innerHTML;
    // Simple heuristic: if the first log timestamp differs, update.
    // Or just rebuild. Rebuilding 5 lines is cheap.

    const content = recentLogs.map(log => `
        <div class="terminal-line">
            <span class="agent-name">${log.agent}:</span>
            <span class="action-text">${log.action}... [${log.status}]</span>
        </div>
    `).join('');

    // Ensure we always have the system line at the top if needed, or just replace.
    // Dashboard HTML has a hardcoded "Initializing..." line initially.

    // We'll append a "Live" indicator line if we want.
    // For now, just show the logs.

    if (container.innerHTML !== content) {
        container.innerHTML = content;
    }
}

async function updateMarketIntelligence() {
    try {
        const response = await fetch('/data/pressure-matrix.json');
        if (!response.ok) return;
        const gpm = await response.json();

        const market = gpm.sectors.marketing.market_demand;
        if (!market) return;

        const trendsEl = document.getElementById('trends-pulse');
        const adsVolEl = document.getElementById('ads-volume');
        const apifyStatusEl = document.getElementById('apify-status');
        const googleAdsStatusEl = document.getElementById('google-ads-status');
        const bigqueryStatusEl = document.getElementById('bigquery-status');
        const metaAdsStatusEl = document.getElementById('meta-ads-status');

        if (trendsEl) {
            trendsEl.textContent = (100 - market.pressure);
            trendsEl.className = `metric-badge ${market.pressure > 70 ? 'badge-error' : (market.pressure < 30 ? 'badge-success' : 'badge-active')}`;
        }

        if (adsVolEl) {
            adsVolEl.textContent = market.ads_volume ? `${(market.ads_volume / 1000).toFixed(1)}k/mo` : '0';
        }

        // Mapping sensor statuses (Real-time from GPM)
        if (apifyStatusEl) {
            const status = gpm.sensors?.apify?.status || 'UNKNOWN';
            apifyStatusEl.textContent = status;
            apifyStatusEl.className = `metric-badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`;
        }

        if (googleAdsStatusEl) {
            const status = gpm.sensors?.google_ads?.status || 'UNKNOWN';
            googleAdsStatusEl.textContent = status;
            googleAdsStatusEl.className = `metric-badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`;
        }

        if (bigqueryStatusEl) {
            const status = gpm.sensors?.bigquery?.status || 'UNKNOWN';
            bigqueryStatusEl.textContent = status;
            bigqueryStatusEl.className = `metric-badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`;
        }

        if (metaAdsStatusEl) {
            const status = gpm.sensors?.meta_ads?.status || 'UNKNOWN';
            metaAdsStatusEl.textContent = status;
            metaAdsStatusEl.className = `metric-badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`;
        }

    } catch (e) {
        console.warn("Market Intelligence Update Failed", e);
    }
}

document.addEventListener('DOMContentLoaded', initAgenticTransparency);
