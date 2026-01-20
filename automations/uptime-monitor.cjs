/**
 * REAL SYSTEM MONITOR
 * Usage: node uptime-monitor.cjs
 * Output: JSON
 */
const os = require('os');
const dns = require('dns').promises;

(async () => {
    try {
        // 1. Connectivity Check
        const start = Date.now();
        await dns.lookup('google.com');
        const latency = Date.now() - start;

        // 2. Resource Check
        const freeMem = os.freemem() / (1024 * 1024); // MB
        const totalMem = os.totalmem() / (1024 * 1024); // MB
        const load = os.loadavg()[0]; // 1 min load

        const metrics = {
            status: "online",
            uptime_seconds: os.uptime(),
            latency_ms: latency,
            memory_usage_mb: Math.round(totalMem - freeMem),
            memory_free_mb: Math.round(freeMem),
            cpu_load: load.toFixed(2),
            timestamp: new Date().toISOString()
        };

        console.log(JSON.stringify(metrics));
        process.exit(0);
    } catch (e) {
        console.error(JSON.stringify({ status: "error", message: e.message }));
        process.exit(1);
    }
})();
