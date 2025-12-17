/**
 * MYDEALZ GOOGLE SHEETS EXPORTER
 *
 * Exports scraped leads to Google Sheets for:
 * - LinkedIn leads (NEW - Session 101)
 * - Instagram leads
 * - Facebook leads
 * - TikTok leads
 *
 * Last Updated: 2025-12-11 (Session 101)
 */

const { google } = require('googleapis');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Google Sheets API setup
let sheets = null;
let auth = null;

/**
 * Initialize Google Sheets API client
 */
async function initGoogleSheets() {
  try {
    // Load service account credentials
    const credentialsPath = path.join(__dirname, 'google-service-account.json');

    if (!fs.existsSync(credentialsPath)) {
      throw new Error('google-service-account.json not found. Create it from GitHub secrets.');
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    sheets = google.sheets({ version: 'v4', auth });

    console.log('[Google Sheets] API initialized successfully');
    return true;

  } catch (error) {
    console.error('[Google Sheets] Initialization error:', error.message);
    return false;
  }
}

/**
 * Create or get sheet tab
 */
async function ensureSheet(tabName) {
  const spreadsheetId = config.sheetsConfig.spreadsheetId;

  try {
    // Get existing sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const existingSheets = response.data.sheets.map(s => s.properties.title);

    if (!existingSheets.includes(tabName)) {
      // Create new sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: tabName
              }
            }
          }]
        }
      });
      console.log(`[Google Sheets] Created new tab: ${tabName}`);

      // Add headers
      await addHeaders(tabName);
    }

    return true;

  } catch (error) {
    console.error(`[Google Sheets] Error ensuring sheet ${tabName}:`, error.message);
    return false;
  }
}

/**
 * Add headers to sheet
 */
async function addHeaders(tabName) {
  const spreadsheetId = config.sheetsConfig.spreadsheetId;
  const headers = config.sheetsConfig.linkedinColumns;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${tabName}!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    });

    console.log(`[Google Sheets] Headers added to ${tabName}`);
    return true;

  } catch (error) {
    console.error(`[Google Sheets] Error adding headers:`, error.message);
    return false;
  }
}

/**
 * Append data to sheet
 */
async function appendToSheet(tabName, data) {
  if (!data || data.length === 0) {
    console.log(`[Google Sheets] No data to append to ${tabName}`);
    return { success: true, rowsAdded: 0 };
  }

  const spreadsheetId = config.sheetsConfig.spreadsheetId;

  try {
    // Ensure sheet exists
    await ensureSheet(tabName);

    // Append data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${tabName}!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: data
      }
    });

    const rowsAdded = response.data.updates?.updatedRows || data.length;
    console.log(`[Google Sheets] Added ${rowsAdded} rows to ${tabName}`);

    return { success: true, rowsAdded: rowsAdded };

  } catch (error) {
    console.error(`[Google Sheets] Error appending to ${tabName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Export LinkedIn leads to Google Sheets
 */
async function exportLinkedInLeads(results) {
  console.log('\n[Export] Exporting LinkedIn leads...');

  const sheetsData = results.sheetsData || [];

  if (sheetsData.length === 0) {
    console.log('[Export] No LinkedIn leads to export');
    return { raw: 0, qualified: 0 };
  }

  // Export to LINKEDIN_RAW tab
  const rawResult = await appendToSheet(
    config.sheetsConfig.tabs.linkedinRaw,
    sheetsData
  );

  // Export qualified leads (score >= 50) to LINKEDIN_QUALIFIED tab
  const qualifiedData = sheetsData.filter(row => {
    const scoreIndex = config.sheetsConfig.linkedinColumns.indexOf('lead_score');
    return row[scoreIndex] >= 50;
  });

  const qualifiedResult = await appendToSheet(
    config.sheetsConfig.tabs.linkedinQualified,
    qualifiedData
  );

  return {
    raw: rawResult.rowsAdded,
    qualified: qualifiedResult.rowsAdded
  };
}

/**
 * Export all platform leads
 */
async function exportAllLeads(scrapingResults) {
  console.log('\n' + '='.repeat(60));
  console.log('GOOGLE SHEETS EXPORT');
  console.log('='.repeat(60));

  // Initialize Google Sheets API
  const initialized = await initGoogleSheets();
  if (!initialized) {
    console.error('[Export] Failed to initialize Google Sheets API');
    return null;
  }

  const exportResults = {
    linkedin: { raw: 0, qualified: 0 },
    instagram: { raw: 0, qualified: 0 },
    facebook: { raw: 0, qualified: 0 },
    tiktok: { raw: 0, qualified: 0 }
  };

  // Export LinkedIn leads
  if (scrapingResults.linkedin && scrapingResults.linkedin.sheetsData) {
    exportResults.linkedin = await exportLinkedInLeads(scrapingResults.linkedin);
  }

  // TODO: Export other platforms when implemented
  // exportResults.instagram = await exportInstagramLeads(scrapingResults.instagram);
  // exportResults.facebook = await exportFacebookLeads(scrapingResults.facebook);
  // exportResults.tiktok = await exportTikTokLeads(scrapingResults.tiktok);

  // Summary
  console.log('\n[Export] SUMMARY:');
  for (const [platform, result] of Object.entries(exportResults)) {
    if (result.raw > 0 || result.qualified > 0) {
      console.log(`  ${platform.toUpperCase()}: ${result.raw} raw, ${result.qualified} qualified`);
    }
  }

  return exportResults;
}

/**
 * Main execution
 */
async function main() {
  // Try to load results from global or from file
  let scrapingResults = global.scrapingResults;

  if (!scrapingResults || !scrapingResults.linkedin) {
    // Try to load from most recent log file
    const logsDir = path.join(__dirname, 'logs');
    const files = fs.readdirSync(logsDir)
      .filter(f => f.startsWith('linkedin_leads_'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const latestFile = path.join(logsDir, files[0]);
      console.log(`[Export] Loading results from: ${latestFile}`);

      const leads = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

      // Format for sheets
      const linkedinScraper = require('./linkedin-scraper');
      const sheetsData = linkedinScraper.formatForSheets(leads);

      scrapingResults = {
        linkedin: {
          raw: leads,
          qualified: leads.filter(l => l.lead_score >= 50),
          sheetsData: sheetsData
        }
      };
    } else {
      console.log('[Export] No scraping results found');
      return;
    }
  }

  await exportAllLeads(scrapingResults);

  console.log('\n[Export] Complete!');
}

// Export functions
module.exports = {
  initGoogleSheets,
  appendToSheet,
  exportLinkedInLeads,
  exportAllLeads,
  main
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Export error:', error);
      process.exit(1);
    });
}
