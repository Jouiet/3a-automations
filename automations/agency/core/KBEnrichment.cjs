#!/usr/bin/env node
/**
 * KBEnrichment.cjs - Knowledge Base Enrichment via Learning Loop
 * 3A Automation - Session 179 (Agent Ops v3.0)
 *
 * ROLE: Process approved facts from ConversationLearner → inject into KB
 * CRITICAL: Only processes APPROVED facts (HITL validation required)
 *
 * Architecture:
 * 1. Read approved facts from learning_queue.jsonl
 * 2. Transform to KB chunk format
 * 3. Version control (kb_versions/)
 * 4. Inject into knowledge base
 * 5. Log audit trail
 *
 * Sources:
 * - Anthropic Context Engineering (2025)
 * - Knowledge Graph RAG patterns
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    learningDir: path.join(process.cwd(), 'data', 'learning'),
    kbDir: path.join(process.cwd(), 'knowledge_base'),
    versionsDir: path.join(process.cwd(), 'knowledge_base', 'versions'),
    auditFile: path.join(process.cwd(), 'data', 'learning', 'kb_enrichment_audit.jsonl'),
    maxChunksPerRun: 50,      // Limit chunks per enrichment run
    minConfidence: 0.6        // Minimum confidence for approved facts
};

// Ensure directories exist
[CONFIG.learningDir, CONFIG.versionsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Fact type to KB chunk type mapping
 */
const FACT_TO_CHUNK_TYPE = {
    gap: 'knowledge_gap_filled',
    correction: 'knowledge_correction',
    insight: 'customer_insight',
    faq: 'faq_entry',
    feature_request: 'feature_feedback'
};

/**
 * Read learning queue
 */
function readLearningQueue() {
    const queuePath = path.join(CONFIG.learningDir, 'learning_queue.jsonl');
    if (!fs.existsSync(queuePath)) {
        return [];
    }

    try {
        const content = fs.readFileSync(queuePath, 'utf8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(f => f !== null);
    } catch (e) {
        console.error('[KBEnrichment] Error reading queue:', e.message);
        return [];
    }
}

/**
 * Write updated learning queue
 */
function writeLearningQueue(facts) {
    const queuePath = path.join(CONFIG.learningDir, 'learning_queue.jsonl');
    const content = facts.map(f => JSON.stringify(f)).join('\n');
    fs.writeFileSync(queuePath, content + (content ? '\n' : ''));
}

/**
 * Read existing KB chunks
 */
function readKBChunks() {
    const chunksPath = path.join(CONFIG.kbDir, 'chunks.json');
    if (!fs.existsSync(chunksPath)) {
        return [];
    }

    try {
        return JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
    } catch {
        return [];
    }
}

/**
 * Create versioned backup of KB
 */
function createKBVersion(chunks, reason) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionFile = path.join(CONFIG.versionsDir, `kb_v${timestamp}.json`);

    const versionData = {
        timestamp: new Date().toISOString(),
        reason,
        chunkCount: chunks.length,
        chunks
    };

    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
    console.log(`[KBEnrichment] Version saved: ${versionFile}`);

    // Cleanup old versions (keep last 20)
    const versions = fs.readdirSync(CONFIG.versionsDir)
        .filter(f => f.startsWith('kb_v') && f.endsWith('.json'))
        .sort()
        .reverse();

    if (versions.length > 20) {
        versions.slice(20).forEach(f => {
            fs.unlinkSync(path.join(CONFIG.versionsDir, f));
        });
        console.log(`[KBEnrichment] Cleaned ${versions.length - 20} old versions`);
    }

    return versionFile;
}

/**
 * Transform approved fact to KB chunk
 */
function factToChunk(fact) {
    const chunkType = FACT_TO_CHUNK_TYPE[fact.type] || 'learned_fact';

    return {
        id: `learned_${fact.id}`,
        type: chunkType,
        title: fact.extractedFact ? fact.extractedFact.substring(0, 100) : `${fact.type} from conversation`,
        text: [
            fact.extractedFact || '',
            fact.userMessage ? `User: ${fact.userMessage}` : '',
            fact.aiResponse ? `AI: ${fact.aiResponse}` : '',
            fact.modifiedFact || ''
        ].filter(Boolean).join(' | '),
        source: {
            type: 'conversation_learning',
            sessionId: fact.source?.sessionId || fact.id,
            pattern: fact.pattern,
            timestamp: fact.createdAt
        },
        metadata: {
            confidence: fact.confidence,
            factType: fact.type,
            learnedAt: new Date().toISOString(),
            reviewedBy: fact.reviewedBy || 'system',
            originalId: fact.id
        },
        tenant_id: fact.tenant_id || 'agency_internal',
        // For TF-IDF indexing
        keywords: extractKeywords(fact)
    };
}

/**
 * Extract keywords from fact for search indexing
 */
function extractKeywords(fact) {
    const text = [
        fact.extractedFact,
        fact.userMessage,
        fact.pattern
    ].filter(Boolean).join(' ').toLowerCase();

    // Simple keyword extraction (stopwords removal)
    const stopwords = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
        'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
        'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as'
    ]);

    const words = text.match(/\b[a-zA-Z\u00C0-\u017F]{3,}\b/g) || [];
    return [...new Set(words.filter(w => !stopwords.has(w)))].slice(0, 20);
}

/**
 * Log enrichment to audit trail
 */
function logAudit(action, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        ...data
    };

    fs.appendFileSync(CONFIG.auditFile, JSON.stringify(entry) + '\n');
}

/**
 * Process approved facts and inject into KB
 * @returns {object} Processing results
 */
async function processApprovedFacts() {
    console.log('[KBEnrichment] Starting enrichment process...');

    const allFacts = readLearningQueue();
    const approvedFacts = allFacts.filter(f =>
        f.status === 'approved' &&
        f.confidence >= CONFIG.minConfidence &&
        !f.injectedToKB
    );

    if (approvedFacts.length === 0) {
        console.log('[KBEnrichment] No approved facts to process');
        return { processed: 0, skipped: 0 };
    }

    console.log(`[KBEnrichment] Found ${approvedFacts.length} approved facts to process`);

    // Limit per run
    const toProcess = approvedFacts.slice(0, CONFIG.maxChunksPerRun);

    // Read existing KB
    const existingChunks = readKBChunks();

    // Create version backup before modification
    createKBVersion(existingChunks, `Pre-enrichment backup (${toProcess.length} facts)`);

    // Transform facts to chunks
    const newChunks = toProcess.map(factToChunk);

    // Check for duplicates (by original ID)
    const existingIds = new Set(existingChunks.map(c => c.metadata?.originalId).filter(Boolean));
    const uniqueNewChunks = newChunks.filter(c => !existingIds.has(c.metadata?.originalId));

    if (uniqueNewChunks.length === 0) {
        console.log('[KBEnrichment] All facts already in KB (duplicates)');
        return { processed: 0, skipped: toProcess.length };
    }

    // Merge chunks
    const mergedChunks = [...existingChunks, ...uniqueNewChunks];

    // Save updated KB
    const chunksPath = path.join(CONFIG.kbDir, 'chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(mergedChunks, null, 2));

    // Mark facts as injected
    const processedIds = new Set(uniqueNewChunks.map(c => c.metadata?.originalId));
    const updatedFacts = allFacts.map(f => {
        if (processedIds.has(f.id)) {
            return {
                ...f,
                injectedToKB: true,
                injectedAt: new Date().toISOString()
            };
        }
        return f;
    });

    writeLearningQueue(updatedFacts);

    // Log audit
    logAudit('kb_enrichment', {
        factsProcessed: uniqueNewChunks.length,
        factsSkipped: toProcess.length - uniqueNewChunks.length,
        totalKBChunks: mergedChunks.length,
        factIds: [...processedIds]
    });

    console.log(`[KBEnrichment] Enrichment complete:`);
    console.log(`   - Processed: ${uniqueNewChunks.length} facts`);
    console.log(`   - Skipped (duplicates): ${toProcess.length - uniqueNewChunks.length}`);
    console.log(`   - Total KB chunks: ${mergedChunks.length}`);

    return {
        processed: uniqueNewChunks.length,
        skipped: toProcess.length - uniqueNewChunks.length,
        totalChunks: mergedChunks.length
    };
}

/**
 * Get enrichment statistics
 */
function getStats() {
    const allFacts = readLearningQueue();
    const chunks = readKBChunks();

    const learnedChunks = chunks.filter(c =>
        c.type && Object.values(FACT_TO_CHUNK_TYPE).includes(c.type)
    );

    // Read audit log
    let auditEntries = [];
    if (fs.existsSync(CONFIG.auditFile)) {
        try {
            const content = fs.readFileSync(CONFIG.auditFile, 'utf8');
            auditEntries = content
                .split('\n')
                .filter(Boolean)
                .map(line => {
                    try { return JSON.parse(line); } catch { return null; }
                })
                .filter(Boolean);
        } catch { /* ignore */ }
    }

    // Count versions
    let versionCount = 0;
    if (fs.existsSync(CONFIG.versionsDir)) {
        versionCount = fs.readdirSync(CONFIG.versionsDir)
            .filter(f => f.startsWith('kb_v') && f.endsWith('.json'))
            .length;
    }

    return {
        queue: {
            total: allFacts.length,
            pending: allFacts.filter(f => f.status === 'pending').length,
            approved: allFacts.filter(f => f.status === 'approved').length,
            rejected: allFacts.filter(f => f.status === 'rejected').length,
            injected: allFacts.filter(f => f.injectedToKB).length
        },
        kb: {
            totalChunks: chunks.length,
            learnedChunks: learnedChunks.length,
            learnedPercentage: chunks.length > 0
                ? Math.round((learnedChunks.length / chunks.length) * 100)
                : 0
        },
        versions: versionCount,
        auditEntries: auditEntries.length,
        lastEnrichment: auditEntries.length > 0
            ? auditEntries[auditEntries.length - 1].timestamp
            : null
    };
}

/**
 * Rollback to a specific KB version
 */
function rollback(versionFile) {
    const versionPath = path.join(CONFIG.versionsDir, versionFile);
    if (!fs.existsSync(versionPath)) {
        throw new Error(`Version not found: ${versionFile}`);
    }

    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

    // Create backup of current state
    const currentChunks = readKBChunks();
    createKBVersion(currentChunks, `Pre-rollback backup to ${versionFile}`);

    // Restore
    const chunksPath = path.join(CONFIG.kbDir, 'chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(versionData.chunks, null, 2));

    logAudit('kb_rollback', {
        versionFile,
        restoredChunks: versionData.chunkCount,
        originalTimestamp: versionData.timestamp
    });

    console.log(`[KBEnrichment] Rolled back to: ${versionFile}`);
    console.log(`   - Restored ${versionData.chunkCount} chunks`);

    return versionData;
}

/**
 * List available KB versions
 */
function listVersions() {
    if (!fs.existsSync(CONFIG.versionsDir)) {
        return [];
    }

    return fs.readdirSync(CONFIG.versionsDir)
        .filter(f => f.startsWith('kb_v') && f.endsWith('.json'))
        .map(f => {
            const filePath = path.join(CONFIG.versionsDir, f);
            const stats = fs.statSync(filePath);
            let chunkCount = 0;
            let reason = '';
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                chunkCount = data.chunkCount || 0;
                reason = data.reason || '';
            } catch { /* ignore */ }

            return {
                file: f,
                created: stats.mtime,
                size: stats.size,
                chunkCount,
                reason
            };
        })
        .sort((a, b) => b.created - a.created);
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--process') || args.includes('-p')) {
        processApprovedFacts()
            .then(result => {
                console.log('\nResult:', JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(err => {
                console.error('Error:', err.message);
                process.exit(1);
            });
    } else if (args.includes('--stats') || args.includes('-s')) {
        const stats = getStats();
        console.log('\n=== KB Enrichment Stats ===\n');
        console.log(JSON.stringify(stats, null, 2));
    } else if (args.includes('--versions') || args.includes('-v')) {
        const versions = listVersions();
        console.log('\n=== KB Versions ===\n');
        versions.forEach(v => {
            console.log(`${v.file}`);
            console.log(`   Created: ${v.created.toISOString()}`);
            console.log(`   Chunks: ${v.chunkCount}`);
            console.log(`   Reason: ${v.reason || 'N/A'}`);
            console.log('');
        });
    } else if (args.includes('--rollback')) {
        const versionIndex = args.indexOf('--rollback') + 1;
        const versionFile = args[versionIndex];
        if (!versionFile) {
            console.error('Usage: --rollback <version_file>');
            process.exit(1);
        }
        try {
            rollback(versionFile);
        } catch (err) {
            console.error('Rollback failed:', err.message);
            process.exit(1);
        }
    } else if (args.includes('--health')) {
        const stats = getStats();
        const health = {
            status: 'ok',
            service: 'KBEnrichment',
            version: '1.0.0',
            stats,
            timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(health, null, 2));
    } else {
        console.log(`
KBEnrichment v1.0.0 - Knowledge Base Enrichment via Learning Loop

Usage:
  node KBEnrichment.cjs --process      Process approved facts → KB
  node KBEnrichment.cjs --stats        Show enrichment statistics
  node KBEnrichment.cjs --versions     List KB versions
  node KBEnrichment.cjs --rollback <file>  Rollback to version
  node KBEnrichment.cjs --health       Health check (JSON)

Workflow:
  1. ConversationLearner extracts facts from Voice AI
  2. Human validates facts (approve/reject)
  3. KBEnrichment processes APPROVED facts
  4. Facts are versioned and injected into KB
  5. Audit trail logged for compliance

Features:
  - Versioned KB backups (auto-cleanup old versions)
  - Duplicate detection (by original fact ID)
  - Audit trail (kb_enrichment_audit.jsonl)
  - Rollback capability
`);
    }
}

module.exports = {
    processApprovedFacts,
    getStats,
    rollback,
    listVersions,
    factToChunk,
    readLearningQueue,
    readKBChunks
};
