#!/usr/bin/env node
/**
 * Startup Orchestrator - v3.0 Engineering
 * 3A Automation - Session 178ter
 *
 * Auto-starts all voice services with health monitoring
 * Validates credentials before startup
 * Reports status to pressure-matrix
 *
 * Usage:
 *   node startup-orchestrator.cjs --start     # Start all services
 *   node startup-orchestrator.cjs --status    # Check status
 *   node startup-orchestrator.cjs --stop      # Stop all services
 *   node startup-orchestrator.cjs --health    # Health check
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Service definitions
const SERVICES = [
    {
        name: 'voice-api',
        script: 'voice-api-resilient.cjs',
        args: ['--server'],
        port: 3004,
        healthPath: '/health',
        required_creds: ['XAI_API_KEY', 'GEMINI_API_KEY']
    },
    {
        name: 'grok-realtime',
        script: 'grok-voice-realtime.cjs',
        args: ['--server'],
        port: 3007,
        healthPath: '/health',
        required_creds: ['XAI_API_KEY']
    },
    {
        name: 'telephony-bridge',
        script: 'voice-telephony-bridge.cjs',
        args: ['--server'],
        port: 3009,
        healthPath: '/health',
        required_creds: ['ELEVENLABS_API_KEY']
    }
];

// Configuration
const CONFIG = {
    startupTimeout: 30000,    // 30s max per service
    healthCheckInterval: 5000, // 5s between checks
    maxRetries: 3,
    pidDir: path.join(__dirname, '.pids')
};

// Ensure PID directory exists
if (!fs.existsSync(CONFIG.pidDir)) {
    fs.mkdirSync(CONFIG.pidDir, { recursive: true });
}

/**
 * Validate credentials for a service
 */
function validateCredentials(service) {
    const missing = service.required_creds.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error(`❌ ${service.name}: Missing credentials: ${missing.join(', ')}`);
        return false;
    }
    return true;
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
    return new Promise(resolve => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Wait for service to be healthy
 */
async function waitForHealth(service, timeout = CONFIG.startupTimeout) {
    const start = Date.now();
    const url = `http://localhost:${service.port}${service.healthPath}`;

    while (Date.now() - start < timeout) {
        try {
            const healthy = await new Promise((resolve) => {
                const req = http.get(url, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.setTimeout(2000, () => {
                    req.destroy();
                    resolve(false);
                });
            });

            if (healthy) return true;
        } catch (e) {
            // Continue waiting
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

/**
 * Start a single service
 */
async function startService(service) {
    console.log(`🚀 Starting ${service.name}...`);

    // Validate credentials
    if (!validateCredentials(service)) {
        return { success: false, error: 'missing_credentials' };
    }

    // Check if already running
    if (await isPortInUse(service.port)) {
        console.log(`✅ ${service.name} already running on port ${service.port}`);
        return { success: true, status: 'already_running' };
    }

    // Start the service
    const scriptPath = path.join(__dirname, service.script);
    const child = spawn('node', [scriptPath, ...service.args], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
    });

    // Save PID
    const pidFile = path.join(CONFIG.pidDir, `${service.name}.pid`);
    fs.writeFileSync(pidFile, child.pid.toString());

    // Detach
    child.unref();

    // Log output for debugging
    child.stdout.on('data', (data) => {
        console.log(`[${service.name}] ${data.toString().trim()}`);
    });
    child.stderr.on('data', (data) => {
        console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
    });

    // Wait for health
    const healthy = await waitForHealth(service);
    if (healthy) {
        console.log(`✅ ${service.name} started successfully on port ${service.port}`);
        return { success: true, pid: child.pid };
    } else {
        console.error(`❌ ${service.name} failed to start within timeout`);
        return { success: false, error: 'startup_timeout' };
    }
}

/**
 * Stop a single service
 */
async function stopService(service) {
    const pidFile = path.join(CONFIG.pidDir, `${service.name}.pid`);

    if (!fs.existsSync(pidFile)) {
        console.log(`⚠️ ${service.name}: No PID file found`);
        return { success: true, status: 'not_running' };
    }

    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));

    try {
        process.kill(pid, 'SIGTERM');
        fs.unlinkSync(pidFile);
        console.log(`🛑 ${service.name} stopped (PID: ${pid})`);
        return { success: true };
    } catch (e) {
        if (e.code === 'ESRCH') {
            fs.unlinkSync(pidFile);
            console.log(`⚠️ ${service.name}: Process not found (already stopped)`);
            return { success: true, status: 'already_stopped' };
        }
        console.error(`❌ ${service.name}: Failed to stop: ${e.message}`);
        return { success: false, error: e.message };
    }
}

/**
 * Get status of all services
 */
async function getStatus() {
    const results = [];

    for (const service of SERVICES) {
        const running = await isPortInUse(service.port);
        const pidFile = path.join(CONFIG.pidDir, `${service.name}.pid`);
        const pid = fs.existsSync(pidFile) ? fs.readFileSync(pidFile, 'utf8') : null;

        results.push({
            name: service.name,
            port: service.port,
            status: running ? 'running' : 'stopped',
            pid: pid || null
        });
    }

    return results;
}

/**
 * Update pressure matrix with service status
 */
async function updatePressureMatrix(status) {
    const matrixPath = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

    if (!fs.existsSync(matrixPath)) return;

    try {
        const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

        // Calculate voice pressure based on service health
        const runningCount = status.filter(s => s.status === 'running').length;
        const pressure = 100 - (runningCount / SERVICES.length) * 100;

        if (!matrix.sectors.technology) {
            matrix.sectors.technology = {};
        }

        matrix.sectors.technology.voice_services = {
            pressure: Math.round(pressure),
            trend: pressure > 50 ? 'DOWN' : 'STABLE',
            last_check: new Date().toISOString(),
            sensor_data: {
                services_healthy: runningCount,
                services_total: SERVICES.length,
                details: status
            }
        };

        matrix.last_updated = new Date().toISOString();
        fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2));
        console.log(`📊 Pressure matrix updated (voice_services: ${pressure}%)`);
    } catch (e) {
        console.warn(`⚠️ Failed to update pressure matrix: ${e.message}`);
    }
}

// CLI
async function main() {
    require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === '--start') {
        console.log('\n🔧 Starting Voice Services...\n');

        const results = [];
        for (const service of SERVICES) {
            const result = await startService(service);
            results.push({ ...service, ...result });
        }

        const status = await getStatus();
        await updatePressureMatrix(status);

        console.log('\n📊 Summary:');
        console.table(status);
        return;
    }

    if (command === '--stop') {
        console.log('\n🛑 Stopping Voice Services...\n');

        for (const service of SERVICES) {
            await stopService(service);
        }

        const status = await getStatus();
        await updatePressureMatrix(status);
        return;
    }

    if (command === '--status') {
        const status = await getStatus();
        console.log('\n📊 Voice Services Status:\n');
        console.table(status);
        return;
    }

    if (command === '--health') {
        const status = await getStatus();
        const healthy = status.filter(s => s.status === 'running').length;
        const total = status.length;

        console.log(JSON.stringify({
            status: healthy === total ? 'ok' : healthy > 0 ? 'degraded' : 'error',
            service: 'startup-orchestrator',
            version: '1.0.0',
            services: {
                healthy,
                total,
                details: status
            },
            timestamp: new Date().toISOString()
        }, null, 2));
        return;
    }

    // Help
    console.log(`
Startup Orchestrator - Voice Services Manager

Usage:
  node startup-orchestrator.cjs --start     Start all services
  node startup-orchestrator.cjs --stop      Stop all services
  node startup-orchestrator.cjs --status    Check status
  node startup-orchestrator.cjs --health    Health check (JSON)

Services managed:
${SERVICES.map(s => `  - ${s.name} (port ${s.port})`).join('\n')}
`);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});

module.exports = { SERVICES, startService, stopService, getStatus };
