const fs = require('fs');
const path = require('path');

/**
 * Unified Telemetry Utility for 3A Global Agentic Engine
 * Writes logs to a central JSON file and standard STDOUT.
 */
function logTelemetry(agentName, action, details, status = 'SUCCESS') {
    const logPath = path.join(__dirname, '../../../logs/telemetry.json');
    let logs = [];

    try {
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            logs = JSON.parse(content || '[]');
        }
    } catch (e) {
        logs = [];
    }

    const entry = {
        timestamp: new Date().toISOString(),
        agent: agentName,
        action,
        details,
        status
    };

    // Log to STDOUT for transmissibility
    console.log(`[Telemetry] ${agentName} | ${action} | ${status} | ${JSON.stringify(details)}`);

    // Append to cumulative log (limit to last 100 entries)
    logs.unshift(entry);
    try {
        fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 100), null, 2));
    } catch (e) {
        console.error(`[Telemetry ERROR] Failed to write to ${logPath}: ${e.message}`);
    }
}

module.exports = { logTelemetry };
