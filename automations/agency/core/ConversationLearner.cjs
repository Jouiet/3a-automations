#!/usr/bin/env node
/**
 * ConversationLearner.cjs - Knowledge Base Enrichment via Conversations
 * 3A Automation - Session 178 (SOTA Architecture)
 *
 * ROLE: Extract candidate facts from Voice AI conversations for KB enrichment.
 * CRITICAL: All extracted facts require HUMAN VALIDATION before KB injection.
 * 
 * Architecture:
 * 1. Voice Conversation → ContextBox (session state)
 * 2. ConversationLearner → extracts patterns/facts/gaps
 * 3. Learning Queue → stores candidates for review
 * 4. Human Validation → approves/rejects/modifies
 * 5. KB Enrichment → versioned injection
 * 
 * ZERO AUTO-INJECTION: Prevents KB contamination with unverified data.
 * 
 * Based on: Anthropic Context Engineering (2025) + Human-in-the-Loop patterns
 */

const fs = require('fs');
const path = require('path');
const ContextBox = require('./ContextBox.cjs');

// Configuration
const LEARNING_CONFIG = {
    queueDir: path.join(process.cwd(), 'data', 'learning'),
    queueFile: 'learning_queue.jsonl',
    archiveDir: 'archive',
    minConfidence: 0.5,           // Minimum confidence to queue
    maxQueueSize: 1000,           // Prevent unbounded growth
    factTypes: ['gap', 'correction', 'insight', 'faq', 'feature_request']
};

// Ensure directories exist
if (!fs.existsSync(LEARNING_CONFIG.queueDir)) {
    fs.mkdirSync(LEARNING_CONFIG.queueDir, { recursive: true });
}

/**
 * Pattern definitions for fact extraction
 * These patterns identify potential KB enrichment opportunities
 */
const EXTRACTION_PATTERNS = {
    // Pattern: Question not answered satisfactorily
    unansweredQuestion: {
        type: 'gap',
        indicators: [
            /je ne trouve pas/i,
            /je n'ai pas trouvé/i,
            /couldn't find/i,
            /i don't know/i,
            /je ne sais pas/i,
            /pas d'information/i,
            /no information/i
        ],
        confidence: 0.7
    },

    // Pattern: Client correction
    clientCorrection: {
        type: 'correction',
        indicators: [
            /non,? c'est/i,
            /actually,? it's/i,
            /ce n'est pas correct/i,
            /that's not right/i,
            /en fait/i,
            /actually/i
        ],
        confidence: 0.8
    },

    // Pattern: Recurring question (FAQ candidate)
    frequentQuestion: {
        type: 'faq',
        indicators: [
            /comment (?:faire|puis-je)/i,
            /how (?:do|can) i/i,
            /est-ce que/i,
            /is it possible/i,
            /c'est quoi/i,
            /what is/i
        ],
        confidence: 0.6
    },

    // Pattern: Feature request
    featureRequest: {
        type: 'feature_request',
        indicators: [
            /j'aimerais/i,
            /i would like/i,
            /ce serait bien/i,
            /it would be nice/i,
            /vous devriez/i,
            /you should/i,
            /pouvez-vous ajouter/i,
            /can you add/i
        ],
        confidence: 0.75
    },

    // Pattern: Specific use case insight
    useCaseInsight: {
        type: 'insight',
        indicators: [
            /dans mon cas/i,
            /in my case/i,
            /pour mon business/i,
            /for my business/i,
            /nous utilisons/i,
            /we use/i
        ],
        confidence: 0.65
    }
};

/**
 * ConversationLearner - Main Class
 */
class ConversationLearner {
    constructor(options = {}) {
        this.config = { ...LEARNING_CONFIG, ...options };
        this.queuePath = path.join(this.config.queueDir, this.config.queueFile);
    }

    /**
     * Extract candidate facts from a conversation session
     * @param {string} sessionId - ContextBox session ID
     * @returns {Array} - Array of candidate facts
     */
    extractCandidateFacts(sessionId) {
        const context = ContextBox.get(sessionId);
        const history = context.pillars?.history || [];
        const candidates = [];

        // Need at least 2 messages to analyze
        if (history.length < 2) return candidates;

        // Analyze each message pair (user + AI response)
        for (let i = 0; i < history.length - 1; i++) {
            const current = history[i];
            const next = history[i + 1];

            // Skip non-message events
            if (current.event !== 'MESSAGE' && !current.content) continue;

            const userContent = current.content || '';
            const aiContent = next.content || next.summary || '';

            // Check each pattern
            for (const [patternName, pattern] of Object.entries(EXTRACTION_PATTERNS)) {
                for (const regex of pattern.indicators) {
                    // Check user message
                    if (regex.test(userContent)) {
                        candidates.push({
                            id: `LRN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                            type: pattern.type,
                            pattern: patternName,
                            source: {
                                sessionId,
                                messageIndex: i,
                                timestamp: current.timestamp
                            },
                            userMessage: userContent.substring(0, 500),
                            aiResponse: aiContent.substring(0, 500),
                            extractedFact: this._summarizeFact(userContent, pattern.type),
                            confidence: pattern.confidence,
                            status: 'pending',
                            createdAt: new Date().toISOString()
                        });
                        break; // One match per pattern per message
                    }

                    // Check AI response for gaps
                    if (pattern.type === 'gap' && regex.test(aiContent)) {
                        candidates.push({
                            id: `LRN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                            type: 'gap',
                            pattern: 'ai_limitation',
                            source: {
                                sessionId,
                                messageIndex: i,
                                timestamp: next.timestamp
                            },
                            userMessage: userContent.substring(0, 500),
                            aiResponse: aiContent.substring(0, 500),
                            extractedFact: `AI could not answer: "${userContent.substring(0, 200)}"`,
                            confidence: 0.85, // High confidence for explicit gaps
                            status: 'pending',
                            createdAt: new Date().toISOString()
                        });
                        break;
                    }
                }
            }
        }

        // Deduplicate similar facts
        return this._deduplicateFacts(candidates);
    }

    /**
     * Summarize the fact from a message
     */
    _summarizeFact(message, type) {
        const cleanMessage = message.substring(0, 200).replace(/\n/g, ' ').trim();

        switch (type) {
            case 'gap':
                return `Knowledge gap: "${cleanMessage}"`;
            case 'correction':
                return `Client correction: "${cleanMessage}"`;
            case 'faq':
                return `Potential FAQ: "${cleanMessage}"`;
            case 'feature_request':
                return `Feature request: "${cleanMessage}"`;
            case 'insight':
                return `Use case insight: "${cleanMessage}"`;
            default:
                return `Observation: "${cleanMessage}"`;
        }
    }

    /**
     * Deduplicate similar facts
     */
    _deduplicateFacts(facts) {
        const seen = new Set();
        return facts.filter(fact => {
            const key = `${fact.type}:${fact.userMessage.substring(0, 50)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Submit candidate facts to the validation queue
     * @param {Array} facts - Array of candidate facts
     * @returns {number} - Number of facts queued
     */
    submitForReview(facts) {
        if (!facts || facts.length === 0) return 0;

        // Filter by minimum confidence
        const qualified = facts.filter(f => f.confidence >= this.config.minConfidence);

        // Load existing queue to check size
        const existingQueue = this.getQueue();
        if (existingQueue.length >= this.config.maxQueueSize) {
            console.warn(`[ConversationLearner] Queue full (${this.config.maxQueueSize}). Archiving old entries.`);
            this._archiveOldEntries();
        }

        // Append to queue
        const stream = fs.createWriteStream(this.queuePath, { flags: 'a' });
        let queued = 0;

        for (const fact of qualified) {
            stream.write(JSON.stringify(fact) + '\n');
            queued++;
        }

        stream.end();
        console.log(`[ConversationLearner] Submitted ${queued} candidate facts for human review`);

        return queued;
    }

    /**
     * Get all pending facts in the queue
     */
    getQueue(status = null) {
        if (!fs.existsSync(this.queuePath)) return [];

        try {
            const content = fs.readFileSync(this.queuePath, 'utf8');
            const facts = content.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(f => f !== null);

            if (status) {
                return facts.filter(f => f.status === status);
            }
            return facts;
        } catch (e) {
            console.error(`[ConversationLearner] Error reading queue: ${e.message}`);
            return [];
        }
    }

    /**
     * Update a fact's status (approve/reject/modify)
     * @param {string} factId - The fact ID
     * @param {string} newStatus - 'approved', 'rejected', 'modified'
     * @param {Object} metadata - Additional data (approvedBy, modifiedFact, etc.)
     */
    updateFactStatus(factId, newStatus, metadata = {}) {
        const queue = this.getQueue();
        let updated = false;

        const newQueue = queue.map(fact => {
            if (fact.id === factId) {
                updated = true;
                return {
                    ...fact,
                    status: newStatus,
                    reviewedAt: new Date().toISOString(),
                    ...metadata
                };
            }
            return fact;
        });

        if (updated) {
            // Rewrite queue file
            const content = newQueue.map(f => JSON.stringify(f)).join('\n') + '\n';
            fs.writeFileSync(this.queuePath, content);
            console.log(`[ConversationLearner] Fact ${factId} status updated to: ${newStatus}`);
        }

        return updated;
    }

    /**
     * Get facts approved for KB injection
     */
    getApprovedFacts() {
        return this.getQueue('approved');
    }

    /**
     * Archive old/processed entries
     */
    _archiveOldEntries() {
        const archivePath = path.join(this.config.queueDir, this.config.archiveDir);
        if (!fs.existsSync(archivePath)) {
            fs.mkdirSync(archivePath, { recursive: true });
        }

        const queue = this.getQueue();
        const processed = queue.filter(f => f.status !== 'pending');
        const pending = queue.filter(f => f.status === 'pending').slice(-500); // Keep last 500 pending

        // Archive processed
        if (processed.length > 0) {
            const archiveFile = path.join(archivePath, `archive-${Date.now()}.jsonl`);
            const content = processed.map(f => JSON.stringify(f)).join('\n') + '\n';
            fs.writeFileSync(archiveFile, content);
        }

        // Rewrite queue with only pending
        const newContent = pending.map(f => JSON.stringify(f)).join('\n') + '\n';
        fs.writeFileSync(this.queuePath, newContent);

        console.log(`[ConversationLearner] Archived ${processed.length} processed facts`);
    }

    /**
     * Process a completed voice session
     * Called by ContextBox or Voice API on session end
     */
    processSession(sessionId) {
        console.log(`[ConversationLearner] Processing session: ${sessionId}`);

        const candidates = this.extractCandidateFacts(sessionId);
        if (candidates.length > 0) {
            const queued = this.submitForReview(candidates);
            console.log(`[ConversationLearner] Session ${sessionId}: ${queued} facts queued for review`);
            return queued;
        }

        return 0;
    }

    /**
     * Get queue statistics for dashboard
     */
    getStats() {
        const queue = this.getQueue();
        const byStatus = {};
        const byType = {};

        for (const fact of queue) {
            byStatus[fact.status] = (byStatus[fact.status] || 0) + 1;
            byType[fact.type] = (byType[fact.type] || 0) + 1;
        }

        return {
            total: queue.length,
            byStatus,
            byType,
            oldestPending: queue.find(f => f.status === 'pending')?.createdAt || null,
            config: {
                minConfidence: this.config.minConfidence,
                maxQueueSize: this.config.maxQueueSize
            }
        };
    }
}

// Singleton instance
const instance = new ConversationLearner();

// CLI for testing
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--stats')) {
        console.log('📊 Learning Queue Statistics:');
        console.log(JSON.stringify(instance.getStats(), null, 2));
    } else if (args.includes('--queue')) {
        const status = args.includes('--pending') ? 'pending' : null;
        const queue = instance.getQueue(status);
        console.log(`\n📋 Learning Queue (${status || 'all'}): ${queue.length} items\n`);
        queue.slice(0, 10).forEach((f, i) => {
            console.log(`[${i + 1}] ${f.id} | ${f.type} | ${f.status} | ${f.confidence}`);
            console.log(`    Fact: ${f.extractedFact?.substring(0, 80)}...`);
        });
        if (queue.length > 10) console.log(`... and ${queue.length - 10} more`);
    } else if (args.includes('--process')) {
        const sessionId = args[args.indexOf('--process') + 1];
        if (sessionId) {
            instance.processSession(sessionId);
        } else {
            console.error('Usage: --process <sessionId>');
        }
    } else if (args.includes('--health')) {
        console.log('✅ ConversationLearner: Module OK');
        console.log(`   Queue Path: ${instance.queuePath}`);
        const stats = instance.getStats();
        console.log(`   Queue Size: ${stats.total}`);
        console.log(`   Pending: ${stats.byStatus.pending || 0}`);
    } else {
        console.log(`
ConversationLearner - KB Enrichment via Conversations

Usage:
  node ConversationLearner.cjs --health           Health check
  node ConversationLearner.cjs --stats            Queue statistics
  node ConversationLearner.cjs --queue            List queue items
  node ConversationLearner.cjs --queue --pending  List pending items only
  node ConversationLearner.cjs --process <id>     Process a session
`);
    }
}

module.exports = instance;
module.exports.ConversationLearner = ConversationLearner;
