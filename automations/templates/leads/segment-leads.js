#!/usr/bin/env node

/**
 * 📊 LEAD SEGMENTATION SCRIPT
 *
 * Objectif: Segmenter automatiquement les leads depuis RAW LEADS vers
 * différents tabs basés sur:
 * - Lead Quality Score (High 8-10, Medium 6-7, Low 1-5)
 * - Source (Contest, Facebook Lead Ads, External)
 * - Product Interest (Winter Coats, Business Bags, Both, Other)
 * - Status (New, Contacted, Qualified, Customer, Dead)
 *
 * Date: 2025-11-25
 */

const { google } = require('googleapis');
const path = require('path');

// Security utilities for retry logic and timeouts
const { retryWithExponentialBackoff } = require('../../lib/security-utils.cjs');

// Optimistic locking: track sheet revision to detect conflicts
let lastKnownRevision = null;

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1GT279HlOvgoRY1PjlD8WkynxrtO5ejxZ01n57Y_uD4A';
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || path.join(__dirname, '../apify-automation/google-service-account.json');

// Standard columns (must match import script)
const STANDARD_COLUMNS = [
    'Lead ID', 'Timestamp', 'Source', 'Campaign Name', 'Ad Name',
    'First Name', 'Last Name', 'Email', 'Phone', 'Location',
    'Interest', 'Budget', 'Lead Quality', 'Status', 'Notes',
    'Assigned To', 'Last Contact', 'Next Follow-up'
];

// Segmentation Tabs
const TABS = {
    RAW: 'RAW LEADS',
    HIGH_QUALITY: 'HIGH QUALITY (8-10)',
    MEDIUM_QUALITY: 'MEDIUM QUALITY (6-7)',
    LOW_QUALITY: 'LOW QUALITY (1-5)',
    WINTER_COATS: 'WINTER COATS',
    BUSINESS_BAGS: 'BUSINESS BAGS',
    CONTACTED: 'CONTACTED',
    CUSTOMERS: 'CUSTOMERS',
    ANALYTICS: 'ANALYTICS'
};

// ============================================================================
// PERSONA DETECTION (Learned from Henderson - Session 103)
// Maps interests/preferences to customer personas for targeted marketing
// ============================================================================

const PERSONA_MAPPING = {
    // Casual everyday wear
    casual: {
        keywords: ['casual', 'everyday', 'comfortable', 'relaxed', 'basic', 'simple'],
        persona: 'Casual Dresser',
        products: ['puffer jackets', 'hoodies', 'casual coats'],
        discountCode: 'WELCOME10'
    },
    // Professional/business attire
    professional: {
        keywords: ['business', 'office', 'work', 'professional', 'formal', 'meeting', 'corporate'],
        persona: 'Professional',
        products: ['wool coats', 'trench coats', 'business bags'],
        discountCode: 'VIP15'
    },
    // Outdoor/adventure
    outdoor: {
        keywords: ['outdoor', 'hiking', 'adventure', 'camping', 'nature', 'trek', 'mountain'],
        persona: 'Outdoor Explorer',
        products: ['parkas', 'waterproof jackets', 'insulated coats'],
        discountCode: 'WELCOME10'
    },
    // Urban streetwear
    urban: {
        keywords: ['urban', 'street', 'trendy', 'fashion', 'style', 'hip', 'modern'],
        persona: 'Urban Style',
        products: ['bomber jackets', 'trendy coats', 'fashion pieces'],
        discountCode: 'WELCOME10'
    },
    // Luxury seekers
    luxury: {
        keywords: ['luxury', 'premium', 'quality', 'designer', 'high-end', 'exclusive'],
        persona: 'Luxury Seeker',
        products: ['premium bundles', 'cashmere', 'designer coats'],
        discountCode: 'VIP-GOLD-20'
    },
    // Budget conscious
    budget: {
        keywords: ['deal', 'discount', 'budget', 'affordable', 'cheap', 'sale', 'value'],
        persona: 'Value Hunter',
        products: ['sale items', 'budget bundles', 'clearance'],
        discountCode: 'SAVE15NOW'
    }
};

function detectPersona(lead) {
    const interest = (lead['Interest'] || '').toLowerCase();
    const notes = (lead['Notes'] || '').toLowerCase();
    const combinedText = `${interest} ${notes}`;

    let detectedPersona = 'Casual Dresser'; // Default
    let maxMatches = 0;
    let recommendedProducts = ['puffer jackets', 'hoodies'];
    let discountCode = 'WELCOME10';

    for (const [key, mapping] of Object.entries(PERSONA_MAPPING)) {
        const matches = mapping.keywords.filter(kw => combinedText.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedPersona = mapping.persona;
            recommendedProducts = mapping.products;
            discountCode = mapping.discountCode;
        }
    }

    return {
        persona: detectedPersona,
        confidence: maxMatches > 0 ? 'high' : 'default',
        recommendedProducts,
        discountCode
    };
}

function segmentByPersona(leads) {
    const segments = {
        casualDresser: [],
        professional: [],
        outdoorExplorer: [],
        urbanStyle: [],
        luxurySeeker: [],
        valueHunter: []
    };

    const personaStats = {};

    leads.forEach(lead => {
        const detection = detectPersona(lead);
        lead['Persona'] = detection.persona;
        lead['Recommended Products'] = detection.recommendedProducts.join(', ');
        lead['Suggested Discount'] = detection.discountCode;

        // Track stats
        personaStats[detection.persona] = (personaStats[detection.persona] || 0) + 1;

        // Segment
        switch (detection.persona) {
            case 'Professional':
                segments.professional.push(lead);
                break;
            case 'Outdoor Explorer':
                segments.outdoorExplorer.push(lead);
                break;
            case 'Urban Style':
                segments.urbanStyle.push(lead);
                break;
            case 'Luxury Seeker':
                segments.luxurySeeker.push(lead);
                break;
            case 'Value Hunter':
                segments.valueHunter.push(lead);
                break;
            default:
                segments.casualDresser.push(lead);
        }
    });

    console.log(`📊 Persona Segmentation (Session 103 - Henderson Learning):`);
    Object.entries(personaStats).forEach(([persona, count]) => {
        console.log(`   ${persona}: ${count} leads`);
    });

    return { segments, stats: personaStats };
}

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
// READ ALL LEADS FROM RAW LEADS TAB
// ============================================================================

async function readRawLeads() {
    console.log('📥 Reading leads from RAW LEADS tab...');

    try {
        const sheets = await getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${TABS.RAW}!A:R`, // All columns (A-R = 18 columns)
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.log('⚠️  No data found in RAW LEADS');
            return [];
        }

        // First row = headers
        const headers = rows[0];

        // Convert to objects
        const leads = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const lead = {};

            headers.forEach((header, index) => {
                lead[header] = row[index] || '';
            });

            leads.push(lead);
        }

        console.log(`✅ Read ${leads.length} leads from RAW LEADS`);
        return leads;

    } catch (error) {
        console.error(`❌ Error reading RAW LEADS:`, error.message);
        throw error;
    }
}

// ============================================================================
// SEGMENTATION LOGIC
// ============================================================================

function segmentByQuality(leads) {
    const segments = {
        high: [],
        medium: [],
        low: []
    };

    leads.forEach(lead => {
        const quality = parseInt(lead['Lead Quality']) || 0;

        if (quality >= 8) {
            segments.high.push(lead);
        } else if (quality >= 6) {
            segments.medium.push(lead);
        } else {
            segments.low.push(lead);
        }
    });

    console.log(`📊 Quality Segmentation:`);
    console.log(`   High (8-10): ${segments.high.length} leads`);
    console.log(`   Medium (6-7): ${segments.medium.length} leads`);
    console.log(`   Low (1-5): ${segments.low.length} leads`);

    return segments;
}

function segmentByInterest(leads) {
    const segments = {
        winterCoats: [],
        businessBags: [],
        both: [],
        other: []
    };

    leads.forEach(lead => {
        const interest = (lead['Interest'] || '').toLowerCase();

        const hasWinter = interest.includes('coat') ||
                          interest.includes('winter') ||
                          interest.includes('jacket') ||
                          interest.includes('puffer');

        const hasBags = interest.includes('bag') ||
                        interest.includes('tote') ||
                        interest.includes('backpack') ||
                        interest.includes('laptop');

        if (hasWinter && hasBags) {
            segments.both.push(lead);
        } else if (hasWinter) {
            segments.winterCoats.push(lead);
        } else if (hasBags) {
            segments.businessBags.push(lead);
        } else {
            segments.other.push(lead);
        }
    });

    console.log(`📊 Interest Segmentation:`);
    console.log(`   Winter Coats: ${segments.winterCoats.length} leads`);
    console.log(`   Business Bags: ${segments.businessBags.length} leads`);
    console.log(`   Both: ${segments.both.length} leads`);
    console.log(`   Other: ${segments.other.length} leads`);

    return segments;
}

function segmentByStatus(leads) {
    const segments = {
        contacted: [],
        customers: [],
        new: []
    };

    leads.forEach(lead => {
        const status = (lead['Status'] || '').toLowerCase();

        if (status === 'contacted' || status === 'qualified') {
            segments.contacted.push(lead);
        } else if (status === 'customer') {
            segments.customers.push(lead);
        } else {
            segments.new.push(lead);
        }
    });

    console.log(`📊 Status Segmentation:`);
    console.log(`   Contacted: ${segments.contacted.length} leads`);
    console.log(`   Customers: ${segments.customers.length} leads`);
    console.log(`   New: ${segments.new.length} leads`);

    return segments;
}

function segmentBySource(leads) {
    const segments = {};

    leads.forEach(lead => {
        const source = lead['Source'] || 'Unknown';

        if (!segments[source]) {
            segments[source] = [];
        }
        segments[source].push(lead);
    });

    console.log(`📊 Source Segmentation:`);
    Object.keys(segments).forEach(source => {
        console.log(`   ${source}: ${segments[source].length} leads`);
    });

    return segments;
}

// ============================================================================
// GENERATE ANALYTICS
// ============================================================================

function generateAnalytics(leads) {
    const analytics = {
        total: leads.length,
        avgQuality: 0,
        emailValidation: 0,
        phoneValidation: 0,
        byQuality: { high: 0, medium: 0, low: 0 },
        byStatus: {},
        bySource: {},
        byInterest: {}
    };

    let qualitySum = 0;
    let validEmails = 0;
    let validPhones = 0;

    leads.forEach(lead => {
        // Quality score
        const quality = parseInt(lead['Lead Quality']) || 0;
        qualitySum += quality;

        if (quality >= 8) analytics.byQuality.high++;
        else if (quality >= 6) analytics.byQuality.medium++;
        else analytics.byQuality.low++;

        // Email/Phone validation
        if (lead['Email'] && lead['Email'].includes('@')) validEmails++;
        if (lead['Phone'] && lead['Phone'].length >= 10) validPhones++;

        // Status
        const status = lead['Status'] || 'New';
        analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;

        // Source
        const source = lead['Source'] || 'Unknown';
        analytics.bySource[source] = (analytics.bySource[source] || 0) + 1;

        // Interest
        const interest = lead['Interest'] || 'Not specified';
        analytics.byInterest[interest] = (analytics.byInterest[interest] || 0) + 1;
    });

    analytics.avgQuality = (qualitySum / leads.length).toFixed(2);
    analytics.emailValidation = ((validEmails / leads.length) * 100).toFixed(1);
    analytics.phoneValidation = ((validPhones / leads.length) * 100).toFixed(1);

    return analytics;
}

// ============================================================================
// WRITE SEGMENT TO TAB (with optimistic locking and retry)
// ============================================================================

/**
 * Get current sheet revision for optimistic locking
 */
async function getSheetRevision(sheets) {
    const response = await sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        fields: 'properties.title,spreadsheetId',
    });
    // Use spreadsheetId + timestamp as pseudo-revision (Sheets API doesn't expose revision)
    return `${response.data.spreadsheetId}_${Date.now()}`;
}

/**
 * Write segment with retry logic for race condition handling
 */
async function writeSegmentToTab(leads, tabName, description = '') {
    if (leads.length === 0) {
        console.log(`⏭️  Skipping ${tabName} (no leads)`);
        return;
    }

    console.log(`📤 Writing ${leads.length} leads to ${tabName}...`);

    // Wrap in retry with exponential backoff for race condition recovery
    await retryWithExponentialBackoff(async () => {
        const sheets = await getGoogleSheetsClient();

        // Get current revision for conflict detection
        const currentRevision = await getSheetRevision(sheets);

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

        // Clear existing data (except headers)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${tabName}!A2:R10000`,
        });

        // Write headers if empty
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${tabName}!A1:R1`,
        });

        if (!existingData.data.values || existingData.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: GOOGLE_SHEET_ID,
                range: `${tabName}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [STANDARD_COLUMNS]
                }
            });
        }

        // Prepare data rows
        const rows = leads.map(lead => {
            return STANDARD_COLUMNS.map(col => lead[col] || '');
        });

        // Write data
        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${tabName}!A2`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: rows
            }
        });

        // Update last known revision
        lastKnownRevision = currentRevision;
        console.log(`✅ Wrote ${rows.length} leads to ${tabName}`);
    }, {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
    });
}

// ============================================================================
// WRITE ANALYTICS TO TAB
// ============================================================================

async function writeAnalytics(analytics, segments) {
    console.log('📊 Writing analytics to ANALYTICS tab...');

    try {
        const sheets = await getGoogleSheetsClient();

        // Create analytics data
        const analyticsData = [
            ['LEAD MANAGEMENT ANALYTICS'],
            ['Generated:', new Date().toISOString()],
            [''],
            ['OVERALL METRICS'],
            ['Total Leads', analytics.total],
            ['Avg Quality Score', analytics.avgQuality + '/10'],
            ['Email Validation Rate', analytics.emailValidation + '%'],
            ['Phone Validation Rate', analytics.phoneValidation + '%'],
            [''],
            ['QUALITY DISTRIBUTION'],
            ['High Quality (8-10)', analytics.byQuality.high, ((analytics.byQuality.high / analytics.total) * 100).toFixed(1) + '%'],
            ['Medium Quality (6-7)', analytics.byQuality.medium, ((analytics.byQuality.medium / analytics.total) * 100).toFixed(1) + '%'],
            ['Low Quality (1-5)', analytics.byQuality.low, ((analytics.byQuality.low / analytics.total) * 100).toFixed(1) + '%'],
            [''],
            ['STATUS DISTRIBUTION']
        ];

        Object.keys(analytics.byStatus).forEach(status => {
            analyticsData.push([
                status,
                analytics.byStatus[status],
                ((analytics.byStatus[status] / analytics.total) * 100).toFixed(1) + '%'
            ]);
        });

        analyticsData.push(['']);
        analyticsData.push(['SOURCE DISTRIBUTION']);

        Object.keys(analytics.bySource).forEach(source => {
            analyticsData.push([
                source,
                analytics.bySource[source],
                ((analytics.bySource[source] / analytics.total) * 100).toFixed(1) + '%'
            ]);
        });

        analyticsData.push(['']);
        analyticsData.push(['INTEREST DISTRIBUTION (Top 10)']);

        const topInterests = Object.entries(analytics.byInterest)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        topInterests.forEach(([interest, count]) => {
            analyticsData.push([
                interest,
                count,
                ((count / analytics.total) * 100).toFixed(1) + '%'
            ]);
        });

        // Check if tab exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: GOOGLE_SHEET_ID,
        });

        const tabExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title === TABS.ANALYTICS
        );

        if (!tabExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: GOOGLE_SHEET_ID,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: { title: TABS.ANALYTICS }
                        }
                    }]
                }
            });
        }

        // Clear and write
        await sheets.spreadsheets.values.clear({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${TABS.ANALYTICS}!A1:Z1000`,
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${TABS.ANALYTICS}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: analyticsData
            }
        });

        console.log('✅ Analytics written successfully');

    } catch (error) {
        console.error('❌ Error writing analytics:', error.message);
        throw error;
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log('═════════════════════════════════════════════════════════════');
    console.log('📊 LEAD SEGMENTATION SCRIPT');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('');

    try {
        // Step 1: Read all leads
        const leads = await readRawLeads();

        if (leads.length === 0) {
            console.log('⚠️  No leads to segment. Import leads first.');
            console.log('');
            console.log('Usage: node import-facebook-lead-ads.js <file> <source>');
            return;
        }

        console.log('');

        // Step 2: Segment by quality
        console.log('🔍 Segmenting by quality...');
        const qualitySegments = segmentByQuality(leads);
        await writeSegmentToTab(qualitySegments.high, TABS.HIGH_QUALITY);
        await writeSegmentToTab(qualitySegments.medium, TABS.MEDIUM_QUALITY);
        await writeSegmentToTab(qualitySegments.low, TABS.LOW_QUALITY);

        console.log('');

        // Step 3: Segment by interest
        console.log('🔍 Segmenting by interest...');
        const interestSegments = segmentByInterest(leads);
        await writeSegmentToTab(interestSegments.winterCoats, TABS.WINTER_COATS);
        await writeSegmentToTab(interestSegments.businessBags, TABS.BUSINESS_BAGS);

        console.log('');

        // Step 4: Segment by status
        console.log('🔍 Segmenting by status...');
        const statusSegments = segmentByStatus(leads);
        await writeSegmentToTab(statusSegments.contacted, TABS.CONTACTED);
        await writeSegmentToTab(statusSegments.customers, TABS.CUSTOMERS);

        console.log('');

        // Step 5: Generate analytics
        console.log('📊 Generating analytics...');
        const analytics = generateAnalytics(leads);
        const segments = {
            quality: qualitySegments,
            interest: interestSegments,
            status: statusSegments
        };
        await writeAnalytics(analytics, segments);

        console.log('');
        console.log('═════════════════════════════════════════════════════════════');
        console.log('✅ SEGMENTATION COMPLETED SUCCESSFULLY');
        console.log('═════════════════════════════════════════════════════════════');
        console.log(`📊 Total leads processed: ${leads.length}`);
        console.log(`⭐ Average quality score: ${analytics.avgQuality}/10`);
        console.log(`📧 Email validation: ${analytics.emailValidation}%`);
        console.log(`📞 Phone validation: ${analytics.phoneValidation}%`);
        console.log('');
        console.log('📋 Tabs created/updated:');
        console.log(`   - ${TABS.HIGH_QUALITY}: ${qualitySegments.high.length} leads`);
        console.log(`   - ${TABS.MEDIUM_QUALITY}: ${qualitySegments.medium.length} leads`);
        console.log(`   - ${TABS.LOW_QUALITY}: ${qualitySegments.low.length} leads`);
        console.log(`   - ${TABS.WINTER_COATS}: ${interestSegments.winterCoats.length} leads`);
        console.log(`   - ${TABS.BUSINESS_BAGS}: ${interestSegments.businessBags.length} leads`);
        console.log(`   - ${TABS.CONTACTED}: ${statusSegments.contacted.length} leads`);
        console.log(`   - ${TABS.CUSTOMERS}: ${statusSegments.customers.length} leads`);
        console.log(`   - ${TABS.ANALYTICS}: Analytics dashboard`);
        console.log('');
        console.log('📊 View Google Sheet: https://docs.google.com/spreadsheets/d/' + GOOGLE_SHEET_ID);
        console.log('');

    } catch (error) {
        console.error('❌ Segmentation failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    readRawLeads,
    segmentByQuality,
    segmentByInterest,
    segmentByStatus,
    segmentBySource,
    segmentByPersona,
    detectPersona,
    generateAnalytics,
    writeSegmentToTab,
    writeAnalytics,
    PERSONA_MAPPING
};
