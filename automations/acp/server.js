/**
 * ACP (Agent Communication Protocol) - Production Server (IBM Spec)
 * Features: REST API, Asynchronous Job Queue, Server-Sent Events (SSE).
 */

const express = require('express');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

// Event Bus for Internal Signaling (Queue <-> SSE)
const eventBus = new EventEmitter();

class RobustQueue {
    constructor() {
        this.jobs = new Map();
        this.processing = false;
    }

    add(job) {
        const id = uuidv4();
        const flaggedJob = { ...job, id, status: 'pending', createdAt: new Date() };
        this.jobs.set(id, flaggedJob);
        this.processNext(); // Trigger processing
        return flaggedJob;
    }

    get(id) {
        return this.jobs.get(id);
    }

    async processNext() {
        if (this.processing) return;

        // Find next pending
        const nextJobId = [...this.jobs.keys()].find(id => this.jobs.get(id).status === 'pending');
        if (!nextJobId) return;

        this.processing = true;
        const job = this.jobs.get(nextJobId);

        // Update status & notify
        job.status = 'processing';
        eventBus.emit('job_update', job);

        try {
            console.log(`[ACP] Processing Job ${job.id}: ${job.type}`);
            // SIMULATE WORK to demonstrate protocol robustness
            // In a real scenario, this would spawn a Worker Thread or Docker Container
            await new Promise(resolve => setTimeout(resolve, 2000));

            job.status = 'completed';
            job.result = { success: true, output: `Executed ${job.type}` };
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
        }

        this.jobs.set(job.id, job);
        eventBus.emit('job_update', job);

        this.processing = false;
        this.processNext(); // Recursive loop
    }
}

const queue = new RobustQueue();
const app = express();
app.use(express.json());

// CORS for Frontend (AG-UI)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/**
 * POST /acp/v1/agent/submit
 * Submit a task to the agent swarm asynchronously.
 */
app.post('/acp/v1/agent/submit', (req, res) => {
    const { task, agentId, context } = req.body;

    if (!task || !agentId) {
        return res.status(400).json({ error: "Missing 'task' or 'agentId'" });
    }

    const job = queue.add({ type: task, agentId, context });
    res.status(202).json({
        jobId: job.id,
        status: 'pending',
        monitorUrl: `/acp/v1/agent/monitor/${job.id}`
    });
});

/**
 * GET /acp/v1/stream
 * Server-Sent Events (SSE) endpoint for AG-UI.
 * Streams real-time updates of agent states.
 */
app.get('/acp/v1/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initial Greeting
    sendEvent({ type: 'SYSTEM', message: 'Connected to ACP Stream', timestamp: new Date() });

    // Listener
    const jobListener = (job) => {
        sendEvent({
            type: 'JOB_UPDATE',
            jobId: job.id,
            status: job.status,
            agentId: job.agentId,
            timestamp: new Date()
        });
    };

    eventBus.on('job_update', jobListener);

    // Cleanup
    req.on('close', () => {
        eventBus.off('job_update', jobListener);
    });
});

// Run
const PORT = process.env.ACP_PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[ACP] Server running on port ${PORT}`);
        console.log(`[ACP] Spec: IBM Agent Communication Protocol (v1.0)`);
    });
}

module.exports = app;
