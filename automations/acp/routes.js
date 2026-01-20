/**
 * ACP (Agent Communication Protocol) - Standardized REST Routes
 * Specification: Open Agent Interface (OAI) compliant
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory job store (replace with Redis/DB in production)
const jobStore = new Map();

/**
 * POST /agent/tasks
 * Trigger an agentic workflow.
 * 
 * Payload:
 * {
 *   "agent_id": "agency-sales",
 *   "input": "Call lead +33612345678",
 *   "context": { "user_id": "123" }
 * }
 */
router.post('/tasks', async (req, res) => {
    const { agent_id, input, context } = req.body;
    const task_id = uuidv4();

    // 1. Validate Agent Existence
    // (In a real system, check against A2A Registry)

    // 2. Spawn Agent Process (Simulation)
    const job = {
        id: task_id,
        agent_id,
        status: 'queued',
        created_at: new Date().toISOString(),
        result: null
    };

    jobStore.set(task_id, job);

    // Simulate async processing
    setTimeout(() => {
        jobStore.set(task_id, { ...job, status: 'completed', result: "Task executed successfully (Simulated)" });
    }, 2000);

    return res.status(202).json({
        task_id,
        status: 'queued',
        url: `/agent/tasks/${task_id}`
    });
});

/**
 * GET /agent/tasks/:task_id
 * Poll for task status.
 */
router.get('/tasks/:task_id', (req, res) => {
    const { task_id } = req.params;
    const job = jobStore.get(task_id);

    if (!job) {
        return res.status(404).json({ error: "Task not found" });
    }

    return res.json(job);
});

/**
 * GET /agent/capabilities
 * Discovery endpoint for UCP/ACP.
 */
router.get('/capabilities', (req, res) => {
    // Return capabilities based on registered Skills
    const capabilities = [
        { id: 'agency-sales', protocol: 'ACP', description: 'Qualify leads' },
        { id: 'contractor-sales', protocol: 'ACP', description: 'Book estimates' }
    ];
    return res.json({ capabilities });
});

module.exports = router;
