/**
 * Migrate Leads Mock to SQLite
 * One-time script to populate the new production database.
 */

const leadsManager = require('./leads-manager.cjs');
const fs = require('fs');
const path = require('path');

const MOCK_PATH = path.join(__dirname, 'leads-mock.json');
const TEST_PATH = path.join(__dirname, 'test-leads.json');

function migrate() {
    console.log("🚀 Starting Lead Migration to SQLite...");

    let count = 0;
    const sources = [MOCK_PATH, TEST_PATH];

    for (const src of sources) {
        if (fs.existsSync(src)) {
            console.log(`📂 Processing ${path.basename(src)}...`);
            try {
                const leads = JSON.parse(fs.readFileSync(src, 'utf8'));
                // Handle both array input and wrapped input e.g. { leads: [...] }
                const leadArray = Array.isArray(leads) ? leads : (leads.leads || []);

                for (const lead of leadArray) {
                    leadsManager.addLead(lead);
                    process.stdout.write('.');
                    count++;
                }
                console.log(" Done.");
            } catch (e) {
                console.error(`❌ Failed to process ${src}:`, e.message);
            }
        }
    }

    console.log(`\n✅ Migration Complete. ${count} leads ingested into '${leadsManager.db.name}'.`);
}

migrate();
