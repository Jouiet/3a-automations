#!/usr/bin/env node

/**
 * 📥 FACEBOOK LEAD ADS → GOOGLE SHEETS IMPORTER
 *
 * Objectif: Importer automatiquement les leads depuis Facebook Lead Ads
 * vers Google Sheets avec nettoyage et structuration
 *
 * Sources supportées:
 * - Facebook Lead Ads API (direct)
 * - Facebook CSV export (manuel)
 * - Excel/XLSX files
 *
 * Date: 2025-11-25
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Security utilities for retry logic
const { retryWithExponentialBackoff } = require('../../lib/security-utils.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1GT279HlOvgoRY1PjlD8WkynxrtO5ejxZ01n57Y_uD4A';
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || path.join(__dirname, '../apify-automation/google-service-account.json');

// Standard columns structure (based on typical lead management needs)
const STANDARD_COLUMNS = [
    'Lead ID',           // Unique identifier
    'Timestamp',         // When lead was captured
    'Source',            // Facebook Lead Ads, Manual Import, etc.
    'Campaign Name',     // FB campaign name
    'Ad Name',           // FB ad name
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Location',          // City, Country
    'Interest',          // Product interest (winter coats, bags, etc.)
    'Budget',            // If collected
    'Lead Quality',      // Score 1-10
    'Status',            // New, Contacted, Qualified, Customer, Dead
    'Notes',
    'Assigned To',       // Sales rep
    'Last Contact',      // Date
    'Next Follow-up'     // Date
];

// ============================================================================
// GOOGLE SHEETS AUTHENTICATION
// ============================================================================

async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

// ============================================================================
// IMPORT FROM FACEBOOK CSV EXPORT
// ============================================================================

async function importFromFacebookCSV(csvFilePath) {
    console.log(`📂 Importing leads from Facebook CSV: ${csvFilePath}`);

    // Read CSV file (Facebook exports as CSV)
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Parse CSV (simple implementation - assumes comma-separated)
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const leads = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const lead = {};
        headers.forEach((header, index) => {
            lead[header] = values[index] || '';
        });
        leads.push(lead);
    }

    console.log(`✅ Parsed ${leads.length} leads from CSV`);
    return leads;
}

// ============================================================================
// IMPORT FROM EXCEL/XLSX
// ============================================================================

async function importFromExcel(xlsxFilePath) {
    console.log(`📊 Importing leads from Excel: ${xlsxFilePath}`);

    const workbook = XLSX.readFile(xlsxFilePath);
    const sheetName = workbook.SheetNames[0]; // First sheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const leads = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Parsed ${leads.length} leads from Excel`);
    return leads;
}

// ============================================================================
// CLEAN & VALIDATE LEADS
// ============================================================================

function cleanEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim();
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function cleanPhone(phone) {
    if (!phone) return '';
    // Remove all non-numeric characters except +
    return phone.replace(/[^\d+]/g, '');
}

function validatePhone(phone) {
    // Basic validation: at least 10 digits
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

function removeDuplicates(leads, keyField = 'email') {
    const seen = new Set();
    return leads.filter(lead => {
        const key = lead[keyField];
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function cleanLeads(rawLeads) {
    console.log(`🧹 Cleaning ${rawLeads.length} leads...`);

    const cleaned = rawLeads.map(lead => {
        // Clean email
        if (lead.email || lead.Email) {
            lead.email = cleanEmail(lead.email || lead.Email);
        }

        // Clean phone
        if (lead.phone || lead.Phone || lead['phone number']) {
            lead.phone = cleanPhone(lead.phone || lead.Phone || lead['phone number']);
        }

        // Standardize names
        lead.firstName = lead.first_name || lead['First Name'] || lead.firstName || '';
        lead.lastName = lead.last_name || lead['Last Name'] || lead.lastName || '';

        return lead;
    });

    // Remove duplicates
    const unique = removeDuplicates(cleaned, 'email');

    console.log(`✅ Cleaned leads: ${unique.length} unique (${rawLeads.length - unique.length} duplicates removed)`);
    return unique;
}

// ============================================================================
// STRUCTURE LEADS TO STANDARD FORMAT
// ============================================================================

function structureLeads(cleanedLeads, source = 'Manual Import') {
    console.log(`📋 Structuring ${cleanedLeads.length} leads to standard format...`);

    const structured = cleanedLeads.map((lead, index) => {
        return {
            'Lead ID': `LEAD-${Date.now()}-${index}`,
            'Timestamp': lead.created_time || new Date().toISOString(),
            'Source': source,
            'Campaign Name': lead.campaign_name || lead['Campaign Name'] || '',
            'Ad Name': lead.ad_name || lead['Ad Name'] || '',
            'First Name': lead.firstName || '',
            'Last Name': lead.lastName || '',
            'Email': lead.email || '',
            'Phone': lead.phone || '',
            'Location': lead.city || lead.country || '',
            'Interest': lead.interest || lead.product || '',
            'Budget': lead.budget || '',
            'Lead Quality': calculateLeadQuality(lead),
            'Status': 'New',
            'Notes': '',
            'Assigned To': '',
            'Last Contact': '',
            'Next Follow-up': ''
        };
    });

    console.log(`✅ Structured ${structured.length} leads`);
    return structured;
}

// ============================================================================
// LEAD QUALITY SCORING (1-10)
// ============================================================================

function calculateLeadQuality(lead) {
    let score = 5; // Base score

    // Email provided and valid (+2)
    if (lead.email && validateEmail(lead.email)) score += 2;

    // Phone provided and valid (+1)
    if (lead.phone && validatePhone(lead.phone)) score += 1;

    // Complete name (+1)
    if (lead.firstName && lead.lastName) score += 1;

    // Location provided (+1)
    if (lead.city || lead.country) score += 1;

    // Interest/product specified (+1)
    if (lead.interest || lead.product) score += 1;

    // Budget specified (+2)
    if (lead.budget && lead.budget !== 'Not specified') score += 2;

    return Math.min(score, 10); // Cap at 10
}

// ============================================================================
// EXPORT TO GOOGLE SHEETS
// ============================================================================

async function exportToGoogleSheets(structuredLeads, tabName = 'RAW LEADS') {
    console.log(`📤 Exporting ${structuredLeads.length} leads to Google Sheets...`);
    console.log(`   Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log(`   Tab: ${tabName}`);

    // Wrap in retry with exponential backoff for race condition recovery
    return await retryWithExponentialBackoff(async () => {
        const sheets = await getGoogleSheetsClient();

        // Prepare data for Google Sheets (2D array)
        const headers = STANDARD_COLUMNS;
        const rows = structuredLeads.map(lead => {
            return headers.map(col => lead[col] || '');
        });

        // Check if tab exists, create if not
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: GOOGLE_SHEET_ID,
        });

        const tabExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title === tabName
        );

        if (!tabExists) {
            console.log(`   Creating new tab: ${tabName}`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: GOOGLE_SHEET_ID,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: { title: tabName }
                        }
                    }]
                }
            });
        }

        // Write headers (if empty)
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${tabName}!A1:Z1`,
        });

        if (!existingData.data.values || existingData.data.values.length === 0) {
            console.log(`   Writing headers to ${tabName}`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: GOOGLE_SHEET_ID,
                range: `${tabName}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });
        }

        // Append data
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${tabName}!A2`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: rows
            }
        });

        console.log(`✅ Exported ${rows.length} leads to ${tabName}`);
        console.log(`   Range: ${response.data.updates.updatedRange}`);

        return response.data;
    }, {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
    });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📥 FACEBOOK LEAD ADS → GOOGLE SHEETS IMPORTER');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('');

    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node import-facebook-lead-ads.js <file-path> [source-name]');
        console.log('');
        console.log('Examples:');
        console.log('  node import-facebook-lead-ads.js leads.csv "Facebook Lead Ads - Winter Campaign"');
        console.log('  node import-facebook-lead-ads.js leads.xlsx "Manual Import"');
        console.log('');
        process.exit(1);
    }

    const filePath = args[0];
    const source = args[1] || 'Manual Import';

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    try {
        // Step 1: Import from file
        let rawLeads;
        if (filePath.endsWith('.csv')) {
            rawLeads = await importFromFacebookCSV(filePath);
        } else if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
            rawLeads = await importFromExcel(filePath);
        } else {
            console.error('❌ Unsupported file format. Use .csv or .xlsx');
            process.exit(1);
        }

        // Step 2: Clean leads
        const cleanedLeads = cleanLeads(rawLeads);

        // Step 3: Structure to standard format
        const structuredLeads = structureLeads(cleanedLeads, source);

        // Step 4: Export to Google Sheets
        await exportToGoogleSheets(structuredLeads, 'RAW LEADS');

        console.log('');
        console.log('═════════════════════════════════════════════════════════════');
        console.log('✅ IMPORT COMPLETED SUCCESSFULLY');
        console.log('═════════════════════════════════════════════════════════════');
        console.log(`📊 Total leads imported: ${structuredLeads.length}`);
        console.log(`📧 Emails valid: ${structuredLeads.filter(l => validateEmail(l.Email)).length}`);
        console.log(`📞 Phones valid: ${structuredLeads.filter(l => validatePhone(l.Phone)).length}`);
        console.log(`⭐ Avg quality score: ${(structuredLeads.reduce((sum, l) => sum + parseInt(l['Lead Quality']), 0) / structuredLeads.length).toFixed(1)}/10`);
        console.log('');

    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    importFromFacebookCSV,
    importFromExcel,
    cleanLeads,
    structureLeads,
    exportToGoogleSheets,
};
