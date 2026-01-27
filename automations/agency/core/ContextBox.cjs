/**
 * ContextBox.cjs - Unified Memory Layer for Agent Ops
 * 3A Automation - Session 177 (Agent Ops Transformation)
 *
 * Implements the "Context Box" concept from the Agent Ops manifesto.
 * Provides a persistent, self-healing state manager for customer journeys.
 * Enables horizontal orchestration by sharing context between agents (Acquisition -> Onboarding -> Expansion).
 */

const fs = require('fs');
const path = require('path');

class ContextBox {
    constructor(options = {}) {
        this.storageDir = options.storageDir || path.join(process.cwd(), 'data', 'contexts');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    /**
     * Get the file path for a specific context ID
     */
    _getPath(id) {
        // Sanitize ID to prevent path traversal
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.storageDir, `${safeId}.json`);
    }

    /**
     * Load or initialize a context
     */
    get(id) {
        const filePath = this._getPath(id);
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                console.error(`[ContextBox] Error loading context ${id}: ${e.message}`);
            }
        }

        // Default structure (Context Pillars)
        return {
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pillars: {
                identity: {},      // Who is the user?
                intent: {},        // What do they want?
                qualification: {}, // BANT/MEDDPICC data
                sentiment: [],     // History of sentiment scores
                history: []        // Event log
            },
            status: 'active',
            metadata: {}
        };
    }

    /**
     * Upsert context data
     */
    set(id, data) {
        const current = this.get(id);
        const updated = {
            ...current,
            ...data,
            updated_at: new Date().toISOString()
        };

        // Deep merge logic for pillars if provided
        if (data.pillars) {
            updated.pillars = {
                identity: { ...current.pillars.identity, ...data.pillars.identity },
                intent: { ...current.pillars.intent, ...data.pillars.intent },
                qualification: { ...current.pillars.qualification, ...data.pillars.qualification },
                sentiment: [...current.pillars.sentiment, ...(data.pillars.sentiment || [])],
                history: [...current.pillars.history, ...(data.pillars.history || [])]
            };
        }

        const filePath = this._getPath(id);
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
        return updated;
    }

    /**
     * Append an event to the journey history
     */
    logEvent(id, agentName, event, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            agent: agentName,
            event,
            ...details
        };

        return this.set(id, {
            pillars: {
                history: [entry]
            }
        });
    }

    /**
     * Handoff context to a new agent
     */
    handoff(id, fromAgent, toAgent, reason = '') {
        console.log(`[ContextBox] HANDOFF: ${id} from ${fromAgent} to ${toAgent} | Reason: ${reason}`);
        return this.logEvent(id, fromAgent, 'HANDOFF', {
            target: toAgent,
            reason
        });
    }
}

// Singleton instance for the system
const instance = new ContextBox();
module.exports = instance;
