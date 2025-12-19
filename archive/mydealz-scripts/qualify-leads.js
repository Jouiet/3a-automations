#!/usr/bin/env node

/**
 * MYDEALZ LEAD QUALIFICATION SCRIPT
 *
 * Used by: .github/workflows/sheets-lead-qualification.yml
 * Schedule: Daily at 3:15 AM UTC
 *
 * Scoring Algorithm (0-100 points):
 * - Location Canada: +30 pts
 * - Location USA: +20 pts
 * - Followers 200-5K: +25 pts (micro-influencer sweet spot)
 * - Followers 5K-50K: +15 pts
 * - Engagement >2%: +25 pts
 * - Engagement 1-2%: +15 pts
 * - Valid email: +20 pts
 *
 * Threshold: ≥50/100 → QUALIFIED
 *
 * Persona Detection (Session 103 - Henderson Learning):
 * Maps interests to customer personas for targeted marketing
 *
 * Created: 2025-12-14 (Session 103)
 * Author: Claude Code
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1uEYLQHfZbw_Y5CCBKU4sIF6RnD1jpWoDmDtDINnjp7w';
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'google-service-account.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// Scoring thresholds
const QUALIFIED_THRESHOLD = 50;

// Target markets
const TIER1_LOCATIONS = ['canada', 'usa', 'united states', 'us'];
const TIER2_LOCATIONS = ['uk', 'united kingdom', 'australia', 'germany', 'france'];

// Persona mapping (from Henderson - Session 103)
const PERSONA_MAPPING = {
    casual: {
        keywords: ['casual', 'everyday', 'comfortable', 'relaxed', 'basic', 'simple'],
        persona: 'Casual Dresser',
        discountCode: 'WELCOME10'
    },
    professional: {
        keywords: ['business', 'office', 'work', 'professional', 'formal', 'corporate'],
        persona: 'Professional',
        discountCode: 'VIP15'
    },
    outdoor: {
        keywords: ['outdoor', 'hiking', 'adventure', 'camping', 'nature', 'mountain'],
        persona: 'Outdoor Explorer',
        discountCode: 'WELCOME10'
    },
    urban: {
        keywords: ['urban', 'street', 'trendy', 'fashion', 'style', 'modern'],
        persona: 'Urban Style',
        discountCode: 'WELCOME10'
    },
    luxury: {
        keywords: ['luxury', 'premium', 'quality', 'designer', 'high-end', 'exclusive'],
        persona: 'Luxury Seeker',
        discountCode: 'VIP-GOLD-20'
    },
    budget: {
        keywords: ['deal', 'discount', 'budget', 'affordable', 'sale', 'value'],
        persona: 'Value Hunter',
        discountCode: 'SAVE15NOW'
    }
};

// ============================================================================
// GOOGLE SHEETS CLIENT
// ============================================================================

async function getGoogleSheetsClient() {
    if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
        throw new Error(`Service account file not found: ${SERVICE_ACCOUNT_FILE}`);
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

// ============================================================================
// LEAD SCORING ALGORITHM
// ============================================================================

function scoreLead(lead) {
    let score = 0;
    const breakdown = [];

    // Location scoring (30 max)
    const location = (lead.location || '').toLowerCase();
    if (TIER1_LOCATIONS.some(loc => location.includes(loc))) {
        if (location.includes('canada')) {
            score += 30;
            breakdown.push('Location Canada: +30');
        } else {
            score += 20;
            breakdown.push('Location USA: +20');
        }
    } else if (TIER2_LOCATIONS.some(loc => location.includes(loc))) {
        score += 10;
        breakdown.push('Location Tier2: +10');
    }

    // Follower count scoring (25 max)
    const followers = parseInt(lead.follower_count) || 0;
    if (followers >= 200 && followers <= 5000) {
        score += 25;
        breakdown.push('Micro-influencer (200-5K): +25');
    } else if (followers > 5000 && followers <= 50000) {
        score += 15;
        breakdown.push('Mid-tier (5K-50K): +15');
    } else if (followers > 50000) {
        score += 5;
        breakdown.push('Large following (50K+): +5');
    }

    // Engagement rate scoring (25 max)
    const engagement = parseFloat(lead.engagement_rate) || 0;
    if (engagement >= 2) {
        score += 25;
        breakdown.push('High engagement (≥2%): +25');
    } else if (engagement >= 1) {
        score += 15;
        breakdown.push('Medium engagement (1-2%): +15');
    }

    // Email validation (20 max)
    const email = lead.email || '';
    if (email && email.includes('@') && !email.includes('test') && !email.includes('example')) {
        score += 20;
        breakdown.push('Valid email: +20');
    }

    return {
        score,
        qualified: score >= QUALIFIED_THRESHOLD,
        breakdown,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : 'D'
    };
}

// ============================================================================
// PERSONA DETECTION
// ============================================================================

function detectPersona(lead) {
    const text = `${lead.bio || ''} ${lead.interests || ''} ${lead.notes || ''}`.toLowerCase();

    let bestMatch = { persona: 'Casual Dresser', discountCode: 'WELCOME10', confidence: 'default' };
    let maxMatches = 0;

    for (const [key, mapping] of Object.entries(PERSONA_MAPPING)) {
        const matches = mapping.keywords.filter(kw => text.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = {
                persona: mapping.persona,
                discountCode: mapping.discountCode,
                confidence: 'high'
            };
        }
    }

    return bestMatch;
}

// ============================================================================
// READ LEADS FROM GOOGLE SHEETS
// ============================================================================

async function readLeadsFromSheets(tabName = 'RAW LEADS') {
    console.log(`📥 Reading leads from ${tabName}...`);

    try {
        const sheets = await getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            console.log('⚠️  No leads found in sheet');
            return [];
        }

        const headers = rows[0];
        const leads = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const lead = {};
            headers.forEach((header, index) => {
                lead[header.toLowerCase().replace(/ /g, '_')] = row[index] || '';
            });
            leads.push(lead);
        }

        console.log(`✅ Read ${leads.length} leads from ${tabName}`);
        return leads;

    } catch (error) {
        console.error(`❌ Error reading leads: ${error.message}`);
        return [];
    }
}

// ============================================================================
// WRITE QUALIFIED LEADS TO SHEETS
// ============================================================================

async function writeQualifiedLeads(leads, tabName = 'QUALIFIED') {
    if (leads.length === 0) {
        console.log('⚠️  No qualified leads to write');
        return;
    }

    console.log(`📤 Writing ${leads.length} qualified leads to ${tabName}...`);

    try {
        const sheets = await getGoogleSheetsClient();

        // Ensure tab exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const tabExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title === tabName
        );

        if (!tabExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: {
                    requests: [{ addSheet: { properties: { title: tabName } } }]
                }
            });
            console.log(`   Created new tab: ${tabName}`);
        }

        // Prepare headers and data
        const headers = [
            'Email', 'Name', 'Location', 'Followers', 'Engagement',
            'Score', 'Grade', 'Persona', 'Discount Code', 'Source',
            'Qualified Date', 'Notes'
        ];

        const rows = leads.map(lead => [
            lead.email || '',
            lead.name || lead.full_name || '',
            lead.location || '',
            lead.follower_count || '',
            lead.engagement_rate || '',
            lead.score || 0,
            lead.grade || 'D',
            lead.persona || 'Casual Dresser',
            lead.discount_code || 'WELCOME10',
            lead.source || 'Unknown',
            new Date().toISOString(),
            lead.notes || ''
        ]);

        // Clear existing data and write new
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A:L`,
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: [headers, ...rows]
            }
        });

        console.log(`✅ Wrote ${leads.length} qualified leads to ${tabName}`);

    } catch (error) {
        console.error(`❌ Error writing qualified leads: ${error.message}`);
        throw error;
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 MYDEALZ LEAD QUALIFICATION SCRIPT');
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🎯 Threshold: ${QUALIFIED_THRESHOLD}/100`);
    console.log('');

    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    try {
        // Step 1: Read leads
        const leads = await readLeadsFromSheets('RAW LEADS');

        if (leads.length === 0) {
            console.log('⚠️  No leads to qualify. Exiting.');
            return;
        }

        console.log('');
        console.log('🔍 Qualifying leads...');

        // Step 2: Score and qualify each lead
        const qualifiedLeads = [];
        const stats = {
            total: leads.length,
            qualified: 0,
            grades: { A: 0, B: 0, C: 0, D: 0 },
            personas: {}
        };

        for (const lead of leads) {
            // Score the lead
            const scoring = scoreLead(lead);

            // Detect persona
            const persona = detectPersona(lead);

            // Enrich lead with scoring data
            lead.score = scoring.score;
            lead.grade = scoring.grade;
            lead.qualified = scoring.qualified;
            lead.persona = persona.persona;
            lead.discount_code = persona.discountCode;

            // Track stats
            stats.grades[scoring.grade]++;
            stats.personas[persona.persona] = (stats.personas[persona.persona] || 0) + 1;

            if (scoring.qualified) {
                stats.qualified++;
                qualifiedLeads.push(lead);
            }
        }

        // Step 3: Write qualified leads
        console.log('');
        await writeQualifiedLeads(qualifiedLeads, 'QUALIFIED');

        // Step 4: Log results
        const logFile = path.join(LOGS_DIR, `qualification_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(logFile, JSON.stringify({
            date: new Date().toISOString(),
            stats,
            qualified_leads: qualifiedLeads.length
        }, null, 2));

        // Summary
        console.log('');
        console.log('═════════════════════════════════════════════════════════════');
        console.log('✅ QUALIFICATION COMPLETED');
        console.log('═════════════════════════════════════════════════════════════');
        console.log(`📊 Total leads processed: ${stats.total}`);
        console.log(`✅ Qualified (≥${QUALIFIED_THRESHOLD}): ${stats.qualified} (${((stats.qualified/stats.total)*100).toFixed(1)}%)`);
        console.log('');
        console.log('📈 Grade Distribution:');
        console.log(`   A (80+): ${stats.grades.A} leads`);
        console.log(`   B (60-79): ${stats.grades.B} leads`);
        console.log(`   C (50-59): ${stats.grades.C} leads`);
        console.log(`   D (<50): ${stats.grades.D} leads`);
        console.log('');
        console.log('👤 Persona Distribution:');
        Object.entries(stats.personas).forEach(([persona, count]) => {
            console.log(`   ${persona}: ${count} leads`);
        });
        console.log('');
        console.log(`📁 Log saved: ${logFile}`);
        console.log('');

    } catch (error) {
        console.error('❌ Qualification failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    scoreLead,
    detectPersona,
    readLeadsFromSheets,
    writeQualifiedLeads,
    QUALIFIED_THRESHOLD,
    PERSONA_MAPPING
};
