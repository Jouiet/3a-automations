/**
 * Google Apps Script Backend for 3A Dashboard
 * Deploy as Web App: Publish > Deploy as web app
 *
 * Setup Instructions:
 * 1. Create a new Google Sheet with tabs: Users, Leads, Automations, Interactions, Metrics, Activities
 * 2. Open Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New deployment > Web app
 * 5. Execute as: Me, Who has access: Anyone
 * 6. Copy the URL to GOOGLE_SHEETS_API_URL in .env.local
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with your actual spreadsheet ID
  SHEETS: {
    USERS: 'Users',
    LEADS: 'Leads',
    AUTOMATIONS: 'Automations',
    INTERACTIONS: 'Interactions',
    METRICS: 'Metrics',
    ACTIVITIES: 'Activities'
  }
};

// Main entry point for POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheet, data: payload } = data;

    let result;

    switch (action) {
      case 'create':
        result = createRecord(sheet, payload);
        break;
      case 'list':
        result = listRecords(sheet, payload);
        break;
      case 'getById':
        result = getRecordById(sheet, payload.id);
        break;
      case 'getByEmail':
        result = getRecordByEmail(sheet, payload.email);
        break;
      case 'update':
        result = updateRecord(sheet, payload);
        break;
      case 'delete':
        result = deleteRecord(sheet, payload.id);
        break;
      case 'incrementRun':
        result = incrementAutomationRun(payload);
        break;
      case 'getDashboardStats':
        result = getDashboardStats();
        break;
      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }

    return jsonResponse({ success: true, data: result });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// Helper to return JSON response
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get spreadsheet and sheet
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

// Get headers from first row
function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

// Convert row to object
function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    if (header) {
      obj[header] = row[index];
    }
  });
  return obj;
}

// Convert object to row
function objectToRow(headers, obj) {
  return headers.map(header => obj[header] !== undefined ? obj[header] : '');
}

// ============================================
// CRUD OPERATIONS
// ============================================

function createRecord(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);

  // Handle arrays (convert to JSON string)
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      data[key] = JSON.stringify(data[key]);
    }
  });

  const row = objectToRow(headers, data);
  sheet.appendRow(row);

  return data;
}

function listRecords(sheetName, filters) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  let records = data.map(row => {
    const obj = rowToObject(headers, row);
    // Parse JSON arrays
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string' && obj[key].startsWith('[')) {
        try {
          obj[key] = JSON.parse(obj[key]);
        } catch (e) {}
      }
    });
    return obj;
  });

  // Apply filters if provided
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        records = records.filter(r => r[key] === filters[key]);
      }
    });
  }

  // Apply limit
  if (filters && filters.limit) {
    records = records.slice(0, filters.limit);
  }

  return records;
}

function getRecordById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return null;

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idIndex = headers.indexOf('id');

  for (let i = 0; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      return rowToObject(headers, data[i]);
    }
  }

  return null;
}

function getRecordByEmail(sheetName, email) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return null;

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const emailIndex = headers.indexOf('email');

  for (let i = 0; i < data.length; i++) {
    if (data[i][emailIndex] === email) {
      return rowToObject(headers, data[i]);
    }
  }

  return null;
}

function updateRecord(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return null;

  const allData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idIndex = headers.indexOf('id');

  for (let i = 0; i < allData.length; i++) {
    if (allData[i][idIndex] === data.id) {
      // Merge existing data with updates
      const existingRecord = rowToObject(headers, allData[i]);
      const updatedRecord = { ...existingRecord, ...data };

      // Handle arrays
      Object.keys(updatedRecord).forEach(key => {
        if (Array.isArray(updatedRecord[key])) {
          updatedRecord[key] = JSON.stringify(updatedRecord[key]);
        }
      });

      const newRow = objectToRow(headers, updatedRecord);
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([newRow]);

      return updatedRecord;
    }
  }

  return null;
}

function deleteRecord(sheetName, id) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return false;

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idIndex = headers.indexOf('id');

  for (let i = 0; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }

  return false;
}

// ============================================
// SPECIAL OPERATIONS
// ============================================

function incrementAutomationRun(data) {
  const sheet = getSheet(CONFIG.SHEETS.AUTOMATIONS);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return false;

  const allData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idIndex = headers.indexOf('id');
  const runCountIndex = headers.indexOf('runCount');
  const successCountIndex = headers.indexOf('successCount');
  const errorCountIndex = headers.indexOf('errorCount');
  const lastRunAtIndex = headers.indexOf('lastRunAt');

  for (let i = 0; i < allData.length; i++) {
    if (allData[i][idIndex] === data.id) {
      allData[i][runCountIndex] = (allData[i][runCountIndex] || 0) + 1;

      if (data.success) {
        allData[i][successCountIndex] = (allData[i][successCountIndex] || 0) + 1;
      } else {
        allData[i][errorCountIndex] = (allData[i][errorCountIndex] || 0) + 1;
      }

      allData[i][lastRunAtIndex] = data.lastRunAt;

      sheet.getRange(i + 2, 1, 1, headers.length).setValues([allData[i]]);
      return true;
    }
  }

  return false;
}

function getDashboardStats() {
  const leadsSheet = getSheet(CONFIG.SHEETS.LEADS);
  const automationsSheet = getSheet(CONFIG.SHEETS.AUTOMATIONS);

  // Count leads
  const leadsLastRow = leadsSheet.getLastRow();
  const totalLeads = leadsLastRow > 1 ? leadsLastRow - 1 : 0;

  // Count qualified leads and new leads today
  const leadsHeaders = getHeaders(leadsSheet);
  let qualifiedLeads = 0;
  let newLeadsToday = 0;
  const today = new Date().toISOString().split('T')[0];

  if (leadsLastRow > 1) {
    const leadsData = leadsSheet.getRange(2, 1, leadsLastRow - 1, leadsHeaders.length).getValues();
    const statusIndex = leadsHeaders.indexOf('status');
    const createdAtIndex = leadsHeaders.indexOf('createdAt');

    leadsData.forEach(row => {
      if (row[statusIndex] === 'QUALIFIED') qualifiedLeads++;
      if (row[createdAtIndex] && row[createdAtIndex].toString().startsWith(today)) {
        newLeadsToday++;
      }
    });
  }

  // Count automations
  const automationsLastRow = automationsSheet.getLastRow();
  let activeAutomations = 0;
  let automationErrors = 0;

  if (automationsLastRow > 1) {
    const automationsHeaders = getHeaders(automationsSheet);
    const automationsData = automationsSheet.getRange(2, 1, automationsLastRow - 1, automationsHeaders.length).getValues();
    const statusIndex = automationsHeaders.indexOf('status');

    automationsData.forEach(row => {
      if (row[statusIndex] === 'ACTIVE') activeAutomations++;
      if (row[statusIndex] === 'ERROR') automationErrors++;
    });
  }

  return {
    totalLeads,
    newLeadsToday,
    qualifiedLeads,
    conversionRate: totalLeads > 0 ? (qualifiedLeads / totalLeads * 100).toFixed(1) : 0,
    activeAutomations,
    automationErrors,
    revenueThisMonth: 0, // To be implemented based on your revenue tracking
    revenueGrowth: 0
  };
}

// ============================================
// SETUP HELPER
// ============================================

function setupSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // Users sheet headers
  const usersHeaders = ['id', 'email', 'name', 'password', 'role', 'createdAt', 'lastLogin'];
  createSheetWithHeaders(ss, CONFIG.SHEETS.USERS, usersHeaders);

  // Leads sheet headers
  const leadsHeaders = ['id', 'name', 'email', 'phone', 'company', 'jobTitle', 'linkedinUrl',
    'source', 'status', 'score', 'priority', 'notes', 'tags', 'assignedTo',
    'createdAt', 'updatedAt', 'lastContact', 'nextFollowUp'];
  createSheetWithHeaders(ss, CONFIG.SHEETS.LEADS, leadsHeaders);

  // Automations sheet headers
  const automationsHeaders = ['id', 'name', 'description', 'type', 'status', 'n8nWorkflowId',
    'schedule', 'lastRunAt', 'nextRunAt', 'runCount', 'successCount', 'errorCount',
    'ownerId', 'createdAt'];
  createSheetWithHeaders(ss, CONFIG.SHEETS.AUTOMATIONS, automationsHeaders);

  // Activities sheet headers
  const activitiesHeaders = ['id', 'userId', 'leadId', 'action', 'details', 'createdAt'];
  createSheetWithHeaders(ss, CONFIG.SHEETS.ACTIVITIES, activitiesHeaders);

  // Metrics sheet headers
  const metricsHeaders = ['id', 'name', 'value', 'unit', 'category', 'date'];
  createSheetWithHeaders(ss, CONFIG.SHEETS.METRICS, metricsHeaders);
}

function createSheetWithHeaders(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Set headers in first row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  return sheet;
}

// Run this function once to set up all sheets
function initializeDatabase() {
  setupSheets();

  // Create default admin user (password: admin123)
  // bcrypt hash for 'admin123'
  const adminPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4I.VBdT.GPCK0m9e';

  createRecord(CONFIG.SHEETS.USERS, {
    id: 'user_admin',
    email: 'admin@3a-automation.com',
    name: 'Admin 3A',
    password: adminPassword,
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  });

  Logger.log('Database initialized with default admin user');
}
