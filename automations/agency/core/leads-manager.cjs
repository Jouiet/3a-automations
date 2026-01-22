/**
 * Leads Manager - Persistent SQLite Storage (L5)
 * Replaces ephemeral JSON mocks with a robust, queryable database.
 * 
 * @version 1.0.0
 * @date 2026-01-20
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Database Path
const DB_DIR = path.join(__dirname, '../../../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'leads_pipeline.db');

class LeadsManager {
    constructor() {
        this.db = new Database(DB_PATH);
        this.initSchema();
        console.log(`[LeadsManager] SQLite connected: ${DB_PATH}`);
    }

    initSchema() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                company TEXT,
                source TEXT,
                activity_score INTEGER DEFAULT 0,
                lead_score INTEGER,
                status TEXT DEFAULT 'new',
                
                -- Engagement Metrics
                email_opens INTEGER DEFAULT 0,
                email_clicks INTEGER DEFAULT 0,
                website_visits INTEGER DEFAULT 0,
                form_submissions INTEGER DEFAULT 0,
                demo_requests INTEGER DEFAULT 0,
                
                -- Metadata
                tags TEXT, -- JSON array
                raw_data TEXT, -- JSON object
                
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);
            CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
        `);
    }

    addLead(lead) {
        const id = lead.id || uuidv4();
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO leads (
                id, name, email, company, source, activity_score, lead_score, status,
                email_opens, email_clicks, website_visits, form_submissions, demo_requests,
                tags, raw_data, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, CURRENT_TIMESTAMP
            )
        `);

        stmt.run(
            id,
            lead.name || null,
            lead.email,
            lead.company || null,
            lead.source || 'manual',
            lead.activity_score || 0,
            lead.lead_score || null,
            lead.status || 'new',
            lead.email_opens || 0,
            lead.email_clicks || 0,
            lead.website_visits || 0,
            lead.form_submissions || 0,
            lead.demo_requests || 0,
            JSON.stringify(lead.tags || []),
            JSON.stringify(lead)
        );

        return id;
    }

    getLead(id) {
        const stmt = this.db.prepare('SELECT * FROM leads WHERE id = ?');
        const lead = stmt.get(id);
        return this.hydrate(lead);
    }

    getAllLeads() {
        const stmt = this.db.prepare('SELECT * FROM leads');
        const leads = stmt.all();
        return leads.map(l => this.hydrate(l));
    }

    updateScore(id, score, weights) {
        const stmt = this.db.prepare(`
            UPDATE leads 
            SET lead_score = ?, raw_data = json_patch(raw_data, ?), updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        // We patch the raw_data to include the scoring weights history if needed, 
        // but for now just storing the score is sufficient.
        // SQLite json_patch might not be enabled in all builds, so let's stick to standard update.

        const updateStmt = this.db.prepare(`
            UPDATE leads SET lead_score = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `);
        updateStmt.run(score, id);
    }

    hydrate(lead) {
        if (!lead) return null;
        if (lead.tags) lead.tags = JSON.parse(lead.tags);
        if (lead.raw_data) {
            const raw = JSON.parse(lead.raw_data);
            // Merge raw data but prefer structured columns
            return { ...raw, ...lead };
        }
        return lead;
    }
}

module.exports = new LeadsManager();
