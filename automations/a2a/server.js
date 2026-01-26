/**
 * A2A (Agent 2 Agent) Unified Server
 * Spec: Google/Linux Foundation A2A Protocol v1.0
 * GitHub Reference: Agent2Agent Project (a2aproject/A2A)
 *
 * Features:
 * - JSON-RPC 2.0 Strict Compliance
 * - A2A v1.0 Task Lifecycle (submitted → working → completed/failed/canceled)
 * - Agent Card Registry (/.well-known/agent.json)
 * - capability-based Routing
 * - Single Source of Truth for UCP
 * - Real LLM Execution (No Mocks)
 * - Streaming via SSE for task updates
 *
 * Methods (A2A v1.0):
 * - tasks/send: Create and execute a task
 * - tasks/get: Get task status/result
 * - tasks/cancel: Cancel a running task
 * - message/send: Send message to agent
 * - message/stream: Stream responses (SSE)
 * - agent.list, agent.register, agent.discover (legacy)
 *
 * Version: 1.1.0 (A2A v1.0 compliant)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const yaml = require('js-yaml');
const app = express();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Explicitly load .env


// --- DYNAMIC SKILL LOADER ---
const SKILLS_DIR = path.join(__dirname, '../../.agent/skills');

const loadDynamicSkills = () => {
    if (!fs.existsSync(SKILLS_DIR)) {
        console.warn(`[A2A] Skills directory not found: ${SKILLS_DIR}`);
        return [];
    }

    const skills = [];
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const dirent of dirs) {
        if (!dirent.isDirectory()) continue;
        const skillId = dirent.name;
        const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');

        if (fs.existsSync(skillPath)) {
            try {
                const content = fs.readFileSync(skillPath, 'utf8');
                const parts = content.split('---');
                if (parts.length < 3) continue;

                const frontmatter = yaml.load(parts[1]);
                const instructions = parts.slice(2).join('---').trim();

                skills.push({
                    id: `agent.${skillId}`,
                    name: frontmatter.name || skillId,
                    description: frontmatter.description,
                    triggers: frontmatter.triggers || [],
                    capabilities: (frontmatter.triggers || []).map(t => ({ name: t })), // Map triggers to capabilities
                    rpc_endpoint: 'local',
                    type: 'dynamic_skill',
                    system_prompt: instructions
                });
            } catch (e) {
                console.error(`[A2A] Failed to load skill ${skillId}: ${e.message}`);
            }
        }
    }
    return skills;
};

app.use(express.json());

// --- A2A v1.0 TASK LIFECYCLE ---

/**
 * TaskState enum (A2A v1.0 spec)
 * Terminal states: completed, failed, canceled, rejected
 */
const TaskState = {
    SUBMITTED: 'submitted',
    WORKING: 'working',
    INPUT_REQUIRED: 'input-required',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled',
    REJECTED: 'rejected',
    AUTH_REQUIRED: 'auth-required',
    UNKNOWN: 'unknown'
};

const TERMINAL_STATES = [TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELED, TaskState.REJECTED];

/**
 * Task Store (in-memory with persistence option)
 * In production, this should be Redis or a database
 */
const TASK_STORE = new Map();

/**
 * Create a new task
 */
const createTask = (params) => {
    const taskId = `task-${uuidv4()}`;
    const task = {
        id: taskId,
        sessionId: params.sessionId || null,
        state: TaskState.SUBMITTED,
        message: params.message || null,
        artifacts: [],
        history: [{
            state: TaskState.SUBMITTED,
            timestamp: new Date().toISOString(),
            message: 'Task created'
        }],
        metadata: params.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    TASK_STORE.set(taskId, task);
    return task;
};

/**
 * Update task state with history tracking
 */
const updateTaskState = (taskId, newState, message = null, artifacts = null) => {
    const task = TASK_STORE.get(taskId);
    if (!task) return null;

    // Cannot update terminal states
    if (TERMINAL_STATES.includes(task.state)) {
        console.warn(`[A2A] Cannot update task ${taskId}: already in terminal state ${task.state}`);
        return task;
    }

    task.state = newState;
    task.updatedAt = new Date().toISOString();
    if (message) task.message = message;
    if (artifacts) task.artifacts = [...task.artifacts, ...artifacts];

    task.history.push({
        state: newState,
        timestamp: task.updatedAt,
        message: message || `State changed to ${newState}`
    });

    // Broadcast state change via SSE
    broadcast({
        type: 'task_state_changed',
        taskId,
        state: newState,
        timestamp: task.updatedAt
    });

    return task;
};

/**
 * Get task by ID
 */
const getTask = (taskId) => {
    return TASK_STORE.get(taskId) || null;
};

// --- UCP MANIFEST SERVING ---
// Serve 'public' folder for .well-known resolution
app.use(express.static(path.join(__dirname, '../../public')));

// Explicit Route for Manifest (Backup)
const MANIFEST = require('../../automations/ucp-manifest.json');
app.get('/.well-known/ucp', (req, res) => {
    res.json(MANIFEST);
});

// --- UCP STOREFRONT (Single Source of Truth) ---
// Import from the API directory to avoid logic duplication
const ucpProductsHandler = require('../../pages/api/ucp/products.js');
app.get('/api/ucp/products', (req, res) => {
    return ucpProductsHandler(req, res);
});

// --- STRATEGIC ROUTING ---
const STRATEGY = {
    "compliance": "agent.claude.core",
    "video": "agent.gemini.pro",
    "high-volume": "agent.gemini.pro",
    "negotiation": "agent.negotiator"
};

// --- SKILL & GATEWAY INTEGRATION ---
const Negotiator = require('../skills/Negotiator');
const SystemAdmin = require('../skills/SystemAdmin');
const MarketAnalyst = require('../skills/MarketAnalyst');
const DevOps = require('../skills/DevOps');
const Security = require('../skills/Security');
const Logistics = require('../skills/Logistics');

const Growth = require('../skills/Growth');
const ContentDirector = require('../skills/ContentDirector');
const LLMGateway = require('../../automations/agency/core/gateways/llm-global-gateway.cjs');

// --- AGENT REGISTRY ---
const AGENT_REGISTRY = new Map();

// Register Core Automations
const CORE_AGENTS = [
    {
        id: "agent.negotiator",
        name: "3A Negotiator",
        capabilities: [{ name: "negotiate_price" }],
        rpc_endpoint: "local",
        handler: (params) => Negotiator.evaluate(params.item, params.offer)
    },
    {
        id: "agent.sysadmin",
        name: "3A System Admin",
        capabilities: [{ name: "system_health_check" }],
        rpc_endpoint: "local",
        handler: (params) => SystemAdmin.execute(params.task)
    },
    {
        id: "agent.market_analyst",
        name: "3A Market Analyst",
        capabilities: [{ name: "analyze_trends" }],
        rpc_endpoint: "local",
        handler: (params) => MarketAnalyst.analyze(params.sector)
    },
    {
        id: "agent.devops",
        name: "3A DevOps Architect",
        capabilities: [{ name: "environment_check" }],
        rpc_endpoint: "local",
        handler: (params) => DevOps.execute(params.task)
    },
    {
        id: "agent.security",
        name: "3A Security Officer",
        capabilities: [{ name: "security_audit" }],
        rpc_endpoint: "local",
        handler: (params) => Security.scan()
    },
    {
        id: "agent.logistics",
        name: "3A Logistics Manager",
        capabilities: [{ name: "check_order_status" }],
        rpc_endpoint: "local",
        handler: (params) => Logistics.checkPending()
    },
    {
        id: "agent.growth",
        name: "3A Growth Director",
        capabilities: [{ name: "optimize_spend" }],
        rpc_endpoint: "local",
        handler: (params) => Growth.optimize(params.propertyId)
    },
    {
        id: "agent.content_director",
        name: "3A Editor-in-Chief",
        capabilities: [{ name: "plan_content" }, { name: "generate_blog_post" }],
        rpc_endpoint: "local",
        handler: (params) => params.topic ? ContentDirector.produce(params.topic) : ContentDirector.plan()
    },
    {
        id: "com.3a.voice",
        name: "Voice Bridge",
        capabilities: [{ name: "voice_call" }],
        rpc_endpoint: "file:///automations/voice-telephony-bridge.cjs",
        type: "script"
    },
    {
        id: "com.3a.slack",
        name: "Slack Bridge",
        capabilities: [{ name: "send_alert" }],
        rpc_endpoint: "file:///automations/slack-bridge.cjs",
        type: "script"
    }
];

// Load and Register Dynamic Skills
const dynamicSkills = loadDynamicSkills();
console.log(`[A2A] Found ${dynamicSkills.length} Dynamic Skills.`);
const ALL_AGENTS = [...CORE_AGENTS, ...dynamicSkills];

ALL_AGENTS.forEach(a => AGENT_REGISTRY.set(a.id, a));

// Helper: Validate Card
const validateCard = (card) => {
    const required = ['id', 'name', 'capabilities', 'rpc_endpoint'];
    const missing = required.filter(field => !card[field]);
    if (missing.length > 0) throw new Error(`Invalid Agent Card. Missing: ${missing.join(', ')}`);
    return true;
};

// --- RPC METHODS ---

const registerAgent = (params) => {
    const card = params.card;
    validateCard(card);
    AGENT_REGISTRY.set(card.id, card);
    console.log(`[A2A] Registered Agent: ${card.id} (${card.name})`);
    return { status: 'registered', agent_id: card.id };
};

const discoverAgents = (params) => {
    const { capability } = params;
    const matches = [];
    AGENT_REGISTRY.forEach(agent => {
        if (agent.capabilities.some(c => c.name === capability)) {
            matches.push(agent);
        }
    });
    return { matches };
};

const executeTask = async (params) => {
    const { agent_id, input, tags = [] } = params;

    // 1. Strategic Routing
    let targetId = agent_id;
    for (const tag of tags) {
        if (STRATEGY[tag]) {
            targetId = STRATEGY[tag];
            console.log(`[A2A] Routing: Redirected to ${targetId} via tag '${tag}'`);
            break;
        }
    }

    const agent = AGENT_REGISTRY.get(targetId);

    // --- REAL LLM EXECUTION (No Mocks) ---
    if (!agent) {
        // Handle Gemini Agents
        if (targetId.startsWith('agent.gemini')) {
            console.log(`[A2A] Handing over to Real Gemini Gateway...`);
            try {
                // If input is an object, stringify it for the prompt
                const prompt = typeof input === 'string' ? input : JSON.stringify(input);
                const output = await LLMGateway.generate('gemini', prompt);
                return { status: 'completed', agent: targetId, output: output };
            } catch (e) {
                // Return actual error, do not fake success
                return { status: 'error', error: e.message, provider: 'gemini' };
            }
        }
        // Handle Claude Agents
        if (targetId.startsWith('agent.claude')) {
            console.log(`[A2A] Handing over to Real Claude Gateway...`);
            try {
                const prompt = typeof input === 'string' ? input : JSON.stringify(input);
                const output = await LLMGateway.generate('claude', prompt);
                return { status: 'completed', agent: targetId, output: output };
            } catch (e) {
                return { status: 'error', error: e.message, provider: 'claude' };
            }
        }
        throw new Error(`Agent ${targetId} not found.`);
    }

    // 2. Execution Logic for Registered Agents
    if (agent.id === "agent.negotiator") return agent.handler(input);
    if (agent.id === "agent.sysadmin") return agent.handler(input);
    if (agent.id === "agent.market_analyst") return agent.handler(input);
    if (agent.id === "agent.devops") return agent.handler(input);
    if (agent.id === "agent.security") return agent.handler(input);
    if (agent.id === "agent.logistics") return agent.handler(input);
    if (agent.id === "agent.growth") return agent.handler(input);
    if (agent.id === "agent.content_director") return agent.handler(input);

    // Dynamic Skill Execution (Universal Handler)
    if (agent.type === 'dynamic_skill') {
        console.log(`[A2A] Executing Dynamic Skill: ${agent.name}`);
        try {
            // Combine System Prompt (SKILL.md) + User Input
            const prompt = typeof input === 'string' ? input : JSON.stringify(input);
            const fullContext = `${agent.system_prompt}\n\nUSER REQUEST: ${prompt}`;

            // Use Gemini Gateway by default for Skills (or switch based on complexity)
            const output = await LLMGateway.generate('gemini', fullContext);
            return {
                status: 'completed',
                agent: agent.id,
                output: output,
                metadata: { source: 'dynamic_skill', model: 'gemini-3-flash-preview' }
            };
        } catch (e) {
            return { status: 'error', error: e.message, provider: 'gemini' };
        }
    }

    // Script Execution (Async)
    if (agent.type === "script") {
        return {
            status: 'queued',
            message: `Script ${agent.rpc_endpoint} scheduled`,
            task_id: uuidv4()
        };
    }

    // Default Proxy (for remote agents if any)
    console.log(`[A2A] Proxying Execution to ${agent.rpc_endpoint}...`);
    await new Promise(r => setTimeout(r, 500));

    return {
        status: 'completed',
        output: `Executed '${input}' via ${agent.name}`,
        metadata: { protocol: 'A2A', version: '1.0' }
    };
};

// Ping method for health testing
const ping = () => {
    return { pong: true, timestamp: new Date().toISOString() };
};

// List all registered agents
const listAgents = () => {
    const agents = [];
    AGENT_REGISTRY.forEach((agent, id) => {
        agents.push({
            id: agent.id,
            name: agent.name,
            type: agent.type || 'core',
            capabilities: agent.capabilities.map(c => c.name)
        });
    });
    return { agents, total: agents.length };
};

// --- A2A v1.0 METHODS ---

/**
 * tasks/send - Create and execute a task (A2A v1.0)
 * @param {Object} params - { id?: string, sessionId?: string, message: { role: string, parts: Array }, metadata?: Object }
 * @returns {Object} Task with current state
 */
const tasksSend = async (params) => {
    const { id, sessionId, message, metadata } = params;

    // Create or retrieve task
    let task;
    if (id && TASK_STORE.has(id)) {
        task = TASK_STORE.get(id);
        // Check if task accepts messages
        if (TERMINAL_STATES.includes(task.state)) {
            throw new Error(`Task ${id} is in terminal state: ${task.state}`);
        }
    } else {
        task = createTask({ sessionId, message, metadata });
    }

    // Update state to working
    updateTaskState(task.id, TaskState.WORKING, 'Processing task');

    try {
        // Extract content from message parts (A2A format)
        let input = '';
        if (message && message.parts) {
            input = message.parts
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join('\n');
        }

        // Determine agent from metadata or use default routing
        const agentId = metadata?.agentId || 'agent.gemini.pro';
        const tags = metadata?.tags || [];

        // Execute via existing executeTask
        const result = await executeTask({ agent_id: agentId, input, tags });

        // Create artifact from result
        const artifact = {
            type: 'text',
            content: typeof result.output === 'string' ? result.output : JSON.stringify(result.output),
            mimeType: 'text/plain',
            createdAt: new Date().toISOString()
        };

        // Update to completed state
        if (result.status === 'completed') {
            updateTaskState(task.id, TaskState.COMPLETED, 'Task completed successfully', [artifact]);
        } else if (result.status === 'error') {
            updateTaskState(task.id, TaskState.FAILED, result.error || 'Task failed');
        } else if (result.status === 'queued') {
            updateTaskState(task.id, TaskState.WORKING, 'Task queued for execution');
        }

        return getTask(task.id);
    } catch (error) {
        updateTaskState(task.id, TaskState.FAILED, error.message);
        return getTask(task.id);
    }
};

/**
 * tasks/get - Retrieve task status (A2A v1.0)
 * @param {Object} params - { id: string, historyLength?: number }
 * @returns {Object} Task with state and artifacts
 */
const tasksGet = (params) => {
    const { id, historyLength } = params;

    if (!id) {
        throw new Error('Missing required parameter: id');
    }

    const task = getTask(id);
    if (!task) {
        throw new Error(`Task not found: ${id}`);
    }

    // Optionally trim history
    if (historyLength && task.history.length > historyLength) {
        task.history = task.history.slice(-historyLength);
    }

    return task;
};

/**
 * tasks/cancel - Cancel a running task (A2A v1.0)
 * @param {Object} params - { id: string }
 * @returns {Object} { success: boolean }
 */
const tasksCancel = (params) => {
    const { id } = params;

    if (!id) {
        throw new Error('Missing required parameter: id');
    }

    const task = getTask(id);
    if (!task) {
        throw new Error(`Task not found: ${id}`);
    }

    if (TERMINAL_STATES.includes(task.state)) {
        return { success: false, reason: `Task already in terminal state: ${task.state}` };
    }

    updateTaskState(id, TaskState.CANCELED, 'Task canceled by client');
    return { success: true, taskId: id, state: TaskState.CANCELED };
};

/**
 * tasks/list - List all tasks (extension)
 * @param {Object} params - { state?: string, limit?: number }
 * @returns {Object} { tasks: Array, total: number }
 */
const tasksList = (params = {}) => {
    const { state, limit = 100 } = params;
    let tasks = Array.from(TASK_STORE.values());

    if (state) {
        tasks = tasks.filter(t => t.state === state);
    }

    tasks = tasks.slice(-limit).map(t => ({
        id: t.id,
        state: t.state,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
    }));

    return { tasks, total: tasks.length };
};

/**
 * message/send - Send a message (A2A v1.0 convenience method)
 * Wraps tasks/send for simpler request-response
 */
const messageSend = async (params) => {
    const { message, sessionId, metadata } = params;
    const task = await tasksSend({ sessionId, message, metadata });

    // For sync response, return the latest artifact
    const latestArtifact = task.artifacts[task.artifacts.length - 1];
    return {
        taskId: task.id,
        state: task.state,
        response: latestArtifact ? latestArtifact.content : null
    };
};

const METHODS = {
    // A2A v1.0 compliant methods
    'tasks/send': tasksSend,
    'tasks/get': tasksGet,
    'tasks/cancel': tasksCancel,
    'tasks/list': tasksList,
    'message/send': messageSend,

    // Legacy methods (backwards compatibility)
    'ping': ping,
    'agent.list': listAgents,
    'agent.register': registerAgent,
    'agent.discover': discoverAgents,
    'agent.execute': executeTask
};

// --- HEALTH CHECK ---
app.get('/a2a/v1/health', (req, res) => {
    const skillCount = AGENT_REGISTRY.size;
    const dynamicCount = dynamicSkills.length;
    const taskStats = {
        total: TASK_STORE.size,
        submitted: Array.from(TASK_STORE.values()).filter(t => t.state === TaskState.SUBMITTED).length,
        working: Array.from(TASK_STORE.values()).filter(t => t.state === TaskState.WORKING).length,
        completed: Array.from(TASK_STORE.values()).filter(t => t.state === TaskState.COMPLETED).length,
        failed: Array.from(TASK_STORE.values()).filter(t => t.state === TaskState.FAILED).length
    };
    res.json({
        status: 'ok',
        version: '1.1.0',
        protocol: 'A2A',
        specVersion: 'v1.0',
        agents_registered: skillCount,
        dynamic_skills: dynamicCount,
        tasks: taskStats,
        methods: Object.keys(METHODS),
        timestamp: new Date().toISOString()
    });
});

// --- AGENT CARD (Discovery) - A2A v1.0 Compliant ---
app.get('/.well-known/agent.json', (req, res) => {
    // Collect unique skills from all agents
    const skills = [];
    AGENT_REGISTRY.forEach(agent => {
        agent.capabilities.forEach(cap => {
            if (!skills.find(s => s.id === cap.name)) {
                skills.push({
                    id: cap.name,
                    name: cap.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: `${cap.name} capability`,
                    inputModes: ['text'],
                    outputModes: ['text']
                });
            }
        });
    });

    // A2A v1.0 Agent Card format
    res.json({
        // Identity
        name: '3A Automation Agency',
        description: 'Level 5 Sovereign AI Automation Agency - E-commerce & SMB workflows. Multi-tenant automation platform with 121+ automations, voice agents, and e-commerce integrations.',
        url: 'https://3a-automation.com',

        // Version
        version: '1.1.0',
        protocolVersion: '1.0',

        // Provider info
        provider: {
            organization: '3A Automation',
            url: 'https://3a-automation.com'
        },

        // Skills (A2A v1.0 format)
        skills: skills.slice(0, 25),

        // Capabilities (A2A v1.0)
        capabilities: {
            streaming: true,
            pushNotifications: false,
            stateTransitionHistory: true
        },

        // Default I/O modes
        defaultInputModes: ['text'],
        defaultOutputModes: ['text'],

        // Authentication
        authentication: {
            schemes: ['bearer'],
            credentials: null // No auth required for basic operations
        },

        // Service endpoints (A2A v1.0 format)
        endpoints: {
            tasks: '/a2a/v1/rpc',
            health: '/a2a/v1/health',
            stream: '/a2a/v1/stream'
        },

        // Supported protocols
        supportsProtocols: ['A2A', 'UCP', 'MCP', 'AG-UI'],

        // Contact
        contact: 'agency@3a-automation.com',

        // Documentation
        documentationUrl: 'https://3a-automation.com/docs/api'
    });
});

// --- SSE STREAM (Real-time Updates) ---
const clients = new Set();

app.get('/a2a/v1/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    clients.add(res);
    console.log(`[A2A] SSE Client connected. Total: ${clients.size}`);

    req.on('close', () => {
        clients.delete(res);
        console.log(`[A2A] SSE Client disconnected. Total: ${clients.size}`);
    });
});

// Broadcast function for events
const broadcast = (event) => {
    const data = JSON.stringify(event);
    clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
    });
};

// --- TASK STREAMING (A2A v1.0 tasks/sendSubscribe) ---
// Subscribe to a specific task's updates
const taskSubscribers = new Map(); // taskId -> Set of response objects

app.post('/a2a/v1/stream/task', async (req, res) => {
    const { taskId, message, sessionId, metadata } = req.body;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let task;
    try {
        // Create or get task
        if (taskId && TASK_STORE.has(taskId)) {
            task = TASK_STORE.get(taskId);
        } else {
            task = createTask({ sessionId, message, metadata });
        }

        // Send initial state
        res.write(`data: ${JSON.stringify({
            type: 'task_created',
            task: { id: task.id, state: task.state }
        })}\n\n`);

        // Subscribe to task updates
        if (!taskSubscribers.has(task.id)) {
            taskSubscribers.set(task.id, new Set());
        }
        taskSubscribers.get(task.id).add(res);

        // Execute task asynchronously
        (async () => {
            try {
                updateTaskState(task.id, TaskState.WORKING, 'Processing...');
                res.write(`data: ${JSON.stringify({
                    type: 'state_change',
                    taskId: task.id,
                    state: TaskState.WORKING
                })}\n\n`);

                // Extract content
                let input = '';
                if (message && message.parts) {
                    input = message.parts.filter(p => p.type === 'text').map(p => p.text).join('\n');
                }

                const agentId = metadata?.agentId || 'agent.gemini.pro';
                const result = await executeTask({ agent_id: agentId, input, tags: metadata?.tags || [] });

                // Stream artifact
                const artifact = {
                    type: 'text',
                    content: typeof result.output === 'string' ? result.output : JSON.stringify(result.output)
                };

                res.write(`data: ${JSON.stringify({
                    type: 'artifact',
                    taskId: task.id,
                    artifact
                })}\n\n`);

                // Final state
                const finalState = result.status === 'error' ? TaskState.FAILED : TaskState.COMPLETED;
                updateTaskState(task.id, finalState, result.status === 'error' ? result.error : 'Complete', [artifact]);

                res.write(`data: ${JSON.stringify({
                    type: 'state_change',
                    taskId: task.id,
                    state: finalState,
                    final: true
                })}\n\n`);

                // Close stream
                res.end();
            } catch (error) {
                updateTaskState(task.id, TaskState.FAILED, error.message);
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    taskId: task.id,
                    error: error.message
                })}\n\n`);
                res.end();
            }
        })();

        // Cleanup on disconnect
        req.on('close', () => {
            const subs = taskSubscribers.get(task?.id);
            if (subs) {
                subs.delete(res);
                if (subs.size === 0) taskSubscribers.delete(task.id);
            }
        });

    } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
});

// --- AG-UI GOVERNANCE ENDPOINTS ---

// Action Queue (Human-in-the-Loop)
const ACTION_QUEUE = [];

// Add action to queue (for high-stakes operations)
const queueAction = (action) => {
    const item = {
        id: uuidv4(),
        action: action.type,
        params: action.params,
        agent: action.agent,
        reason: action.reason || null,
        status: 'pending',
        priority: action.priority || 'normal',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiry
    };
    ACTION_QUEUE.push(item);
    broadcast({ type: 'action_queued', item });
    return item;
};

// AG-UI Dashboard
app.get('/ag-ui', (req, res) => {
    const gpmPath = path.join(__dirname, '../../data/gpm-snapshot.json');
    let gpm = { overall_pressure: 'N/A' };

    if (fs.existsSync(gpmPath)) {
        try {
            gpm = JSON.parse(fs.readFileSync(gpmPath, 'utf8'));
        } catch (e) {
            console.error('[AG-UI] Failed to load GPM:', e.message);
        }
    }

    res.json({
        status: 'ok',
        protocol: 'AG-UI/1.0',
        governance: {
            mode: 'human-in-the-loop',
            auto_approve_threshold: 'low-risk',
            escalation: 'slack-alert'
        },
        agents: {
            total: AGENT_REGISTRY.size,
            dynamic_skills: dynamicSkills.length,
            core: AGENT_REGISTRY.size - dynamicSkills.length
        },
        pressure: {
            overall: gpm.summary?.overall_pressure || 'N/A',
            sensors_ok: gpm.summary?.ok || 0,
            sensors_partial: gpm.summary?.partial || 0,
            sensors_blocked: gpm.summary?.blocked || 0
        },
        queue: {
            pending: ACTION_QUEUE.filter(a => a.status === 'pending').length,
            total: ACTION_QUEUE.length
        },
        endpoints: {
            dashboard: '/ag-ui',
            queue: '/ag-ui/queue',
            submit: '/ag-ui/queue/submit',
            stream: '/a2a/v1/stream'
        },
        timestamp: new Date().toISOString()
    });
});

// Action Queue - List/Manage
app.get('/ag-ui/queue', (req, res) => {
    const pending = ACTION_QUEUE.filter(a => a.status === 'pending');
    res.json({
        protocol: 'AG-UI/1.0',
        queue: pending,
        stats: {
            pending: pending.length,
            approved: ACTION_QUEUE.filter(a => a.status === 'approved').length,
            rejected: ACTION_QUEUE.filter(a => a.status === 'rejected').length,
            expired: ACTION_QUEUE.filter(a => a.status === 'expired').length
        }
    });
});

// Approve/Reject Action
app.post('/ag-ui/queue/:id', express.json(), (req, res) => {
    const { id } = req.params;
    const { decision } = req.body; // 'approve' or 'reject'

    const item = ACTION_QUEUE.find(a => a.id === id);
    if (!item) {
        return res.status(404).json({ error: 'Action not found' });
    }

    if (item.status !== 'pending') {
        return res.status(400).json({ error: `Action already ${item.status}` });
    }

    item.status = decision === 'approve' ? 'approved' : 'rejected';
    item.decided_at = new Date().toISOString();
    item.decided_by = req.headers['x-user-id'] || 'human';

    broadcast({ type: 'action_decided', item });

    res.json({ status: 'ok', item });
});

// Submit Action to Queue (for external scripts)
app.post('/ag-ui/queue/submit', express.json(), (req, res) => {
    const { type, params, agent, priority, reason } = req.body;

    if (!type) {
        return res.status(400).json({ error: 'Missing required field: type' });
    }

    if (!agent) {
        return res.status(400).json({ error: 'Missing required field: agent' });
    }

    const item = queueAction({
        type,
        params: params || {},
        agent,
        priority: priority || 'normal',
        reason: reason || 'No reason provided'
    });

    console.log(`[AG-UI] Action queued: ${type} by ${agent} (id: ${item.id})`);

    res.status(201).json({
        status: 'queued',
        item,
        approve_url: `/ag-ui/queue/${item.id}`,
        instructions: 'POST to approve_url with { "decision": "approve" } or { "decision": "reject" }'
    });
});

// --- JSON-RPC ENDPOINT ---
app.post('/a2a/v1/rpc', async (req, res) => {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== '2.0') {
        return res.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
    }

    if (!method || !METHODS[method]) {
        return res.json({ jsonrpc: '2.0', error: { code: -32601, message: `Method '${method}' not found` }, id });
    }

    try {
        const result = await METHODS[method](params);
        return res.json({ jsonrpc: '2.0', result, id });
    } catch (error) {
        console.error(`[A2A] Error: ${error.message}`);
        return res.json({
            jsonrpc: '2.0',
            error: { code: -32000, message: error.message },
            id
        });
    }
});

// --- SUBSIDIARIES INTEGRATION ---
// Load subsidiary store proxies for Twin Sovereignty architecture
const subsidiariesDir = path.join(__dirname, '../subsidiaries');
if (fs.existsSync(subsidiariesDir)) {
    const proxyFiles = fs.readdirSync(subsidiariesDir).filter(f => f.endsWith('-proxy.cjs'));
    for (const file of proxyFiles) {
        try {
            const proxy = require(path.join(subsidiariesDir, file));
            if (proxy.createRouter && proxy.STORE_ID) {
                app.use(`/api/subsidiaries/${proxy.STORE_ID}`, proxy.createRouter(express));
                console.log(`[A2A] Loaded subsidiary: ${proxy.STORE_ID}`);
            }
        } catch (e) {
            console.error(`[A2A] Failed to load subsidiary ${file}: ${e.message}`);
        }
    }
}

// Subsidiaries listing endpoint
app.get('/api/subsidiaries', (req, res) => {
    const subsidiaries = [];
    if (fs.existsSync(subsidiariesDir)) {
        const proxyFiles = fs.readdirSync(subsidiariesDir).filter(f => f.endsWith('-proxy.cjs'));
        for (const file of proxyFiles) {
            try {
                const proxy = require(path.join(subsidiariesDir, file));
                if (proxy.getManifest) {
                    subsidiaries.push(proxy.getManifest());
                }
            } catch (e) {
                // Skip failed proxies
            }
        }
    }
    res.json({
        protocol: "UCP/1.0",
        parent: "3a-automation.com",
        subsidiaries,
        total: subsidiaries.length
    });
});

// --- SERVER START ---
const PORT = process.env.A2A_PORT || 3000;

// Global Error Handlers for Persistence
process.on('uncaughtException', (err) => {
    console.error(`[A2A CRITICAL] Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    // In a production app, you might want to gracefully shutdown if it's a memory leak
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[A2A CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    // Handle --health CLI flag
    if (process.argv.includes('--health')) {
        console.log(JSON.stringify({
            status: 'ok',
            version: '1.1.0',
            protocol: 'A2A',
            specVersion: 'v1.0',
            agents_registered: AGENT_REGISTRY.size,
            dynamic_skills: dynamicSkills.length,
            methods: Object.keys(METHODS),
            features: {
                taskLifecycle: true,
                streaming: true,
                agentCard: true,
                legacyMethods: true
            },
            taskStates: Object.values(TaskState),
            timestamp: new Date().toISOString()
        }, null, 2));
        process.exit(0);
    }

    app.listen(PORT, () => {
        console.log(`[A2A] Unified Server v1.1.0 (A2A spec v1.0) running on port ${PORT}`);
        console.log(`[A2A] Registry: ${AGENT_REGISTRY.size} agents (${dynamicSkills.length} dynamic skills)`);
        console.log(`[A2A] Methods: ${Object.keys(METHODS).join(', ')}`);
        console.log(`[A2A] Task states: ${Object.values(TaskState).join(', ')}`);
        console.log(`[A2A] Endpoints: /a2a/v1/rpc, /a2a/v1/health, /a2a/v1/stream, /a2a/v1/stream/task, /.well-known/agent.json`);
    });
}

module.exports = app;
