/**
 * agentic-transparency.js
 * Injects real-world verified data into the UI for "Brutally Honest" transparency.
 */

async function initAgenticTransparency() {
    console.log("Initializing Agentic Transparency...");

    // Initial Load
    await updateAgenticStatus();
    await updateMcpLogs();

    // Periodic Polling (every 5 seconds)
    setInterval(updateAgenticStatus, 5000);
    setInterval(updateMcpLogs, 3000);
}

async function updateAgenticStatus() {
    try {
        const response = await fetch('data/agentic-status.json');
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

    } catch (e) {
        console.warn("Failed to update agentic status.", e);
    }
}

async function updateMcpLogs() {
    try {
        const response = await fetch('data/mcp-logs.json');
        if (!response.ok) return;
        const logs = await response.json();

        // Dashboard Tool Logs
        const toolLogsContainer = document.getElementById('tool-logs');
        if (toolLogsContainer) {
            renderLogs(toolLogsContainer, logs, true);
        }

        // Global Mini-log (if exists on other pages)
        const miniLog = document.getElementById('mini-mcp-log');
        if (miniLog) {
            renderLogs(miniLog, logs.slice(0, 3), false);
        }

    } catch (e) {
        // Silently fail for logs as they might not exist yet
    }
}

function renderLogs(container, logs, fullDetail) {
    const content = logs.map(log => `
        <div class="log-entry ${log.status === 'SUCCESS' ? 'success' : ''}">
            <span class="log-time">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span class="log-agent">${log.agent}</span>: 
            <span class="log-action">${log.action}</span>
            ${fullDetail ? `<div class="log-details" style="font-size: 0.75rem; opacity: 0.6;">${JSON.stringify(log.details)}</div>` : ''}
        </div>
    `).join('');

    if (container.innerHTML !== content) {
        container.innerHTML = content;
    }
}

document.addEventListener('DOMContentLoaded', initAgenticTransparency);
