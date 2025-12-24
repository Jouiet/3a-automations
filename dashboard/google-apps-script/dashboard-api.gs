/**
 * 3A Dashboard API - Google Apps Script
 * Backend for Dashboard using Google Sheets
 * Version: 1.0.0
 * Deploy as Web App with access: Anyone
 */

// Configuration
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';

// Sheet names
const SHEETS = {
  USERS: 'Users',
  LEADS: 'Leads',
  AUTOMATIONS: 'Automations',
  ACTIVITIES: 'Activities',
  METRICS: 'Metrics'
};

// Main entry point
function doPost(e) {
  const response = { success: false };

  try {
    const request = JSON.parse(e.postData.contents);
    const { action, sheet, data } = request;

    switch (action) {
      case 'list':
        response.data = listRecords(sheet, data);
        response.success = true;
        break;

      case 'getById':
        response.data = getRecordById(sheet, data.id);
        response.success = true;
        break;

      case 'getByEmail':
        response.data = getRecordByEmail(sheet, data.email);
        response.success = true;
        break;

      case 'create':
        response.data = createRecord(sheet, data);
        response.success = true;
        break;

      case 'update':
        response.data = updateRecord(sheet, data);
        response.success = true;
        break;

      case 'delete':
        response.success = deleteRecord(sheet, data.id);
        break;

      case 'getDashboardStats':
        response.data = getDashboardStats();
        response.success = true;
        break;

      default:
        response.error = 'Unknown action: ' + action;
    }
  } catch (error) {
    response.error = error.message;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: '3A Dashboard API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// CRUD Operations
// ============================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Create sheet if it doesn't exist
    sheet = ss.insertSheet(sheetName);
    // Add headers based on sheet type
    const headers = getHeadersForSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getHeadersForSheet(sheetName) {
  const headerMap = {
    'Users': ['id', 'email', 'name', 'password', 'role', 'createdAt', 'lastLogin'],
    'Leads': ['id', 'name', 'email', 'phone', 'company', 'jobTitle', 'linkedinUrl', 'source', 'status', 'score', 'priority', 'notes', 'tags', 'assignedTo', 'createdAt', 'updatedAt', 'lastContact', 'nextFollowUp'],
    'Automations': ['id', 'name', 'description', 'type', 'status', 'n8nWorkflowId', 'schedule', 'lastRunAt', 'nextRunAt', 'runCount', 'successCount', 'errorCount', 'ownerId', 'createdAt'],
    'Activities': ['id', 'userId', 'leadId', 'action', 'details', 'createdAt'],
    'Metrics': ['id', 'name', 'value', 'unit', 'category', 'date']
  };
  return headerMap[sheetName] || ['id', 'data', 'createdAt'];
}

function listRecords(sheetName, filters) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const headers = data[0];
  let records = data.slice(1).map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  });

  // Apply filters
  if (filters && Object.keys(filters).length > 0) {
    records = records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined) return true;
        return record[key] == value;
      });
    });
  }

  return records;
}

function getRecordById(sheetName, id) {
  const records = listRecords(sheetName, {});
  return records.find(r => r.id === id) || null;
}

function getRecordByEmail(sheetName, email) {
  const records = listRecords(sheetName, {});
  return records.find(r => r.email === email) || null;
}

function createRecord(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Ensure ID exists
  if (!data.id) {
    data.id = sheetName.toLowerCase() + '_' + Date.now();
  }

  // Create row based on headers
  const row = headers.map(header => {
    const value = data[header];
    if (Array.isArray(value)) return JSON.stringify(value);
    return value || '';
  });

  sheet.appendRow(row);
  return data;
}

function updateRecord(sheetName, data) {
  const sheet = getSheet(sheetName);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === data.id) {
      // Update row
      Object.entries(data).forEach(([key, value]) => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          if (Array.isArray(value)) {
            values[i][colIndex] = JSON.stringify(value);
          } else {
            values[i][colIndex] = value;
          }
        }
      });
      dataRange.setValues(values);
      return getRecordById(sheetName, data.id);
    }
  }

  return null;
}

function deleteRecord(sheetName, id) {
  const sheet = getSheet(sheetName);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }

  return false;
}

// ============================================
// Dashboard Stats
// ============================================

function getDashboardStats() {
  const leads = listRecords(SHEETS.LEADS, {});
  const automations = listRecords(SHEETS.AUTOMATIONS, {});
  const activities = listRecords(SHEETS.ACTIVITIES, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newLeadsToday = leads.filter(l => {
    const createdAt = new Date(l.createdAt);
    return createdAt >= today;
  }).length;

  const qualifiedLeads = leads.filter(l =>
    l.status === 'QUALIFIED' || l.status === 'PROPOSAL' || l.status === 'WON'
  ).length;

  const wonLeads = leads.filter(l => l.status === 'WON').length;
  const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;

  const activeAutomations = automations.filter(a => a.status === 'ACTIVE').length;
  const automationErrors = automations.filter(a => a.status === 'ERROR').length;

  // Calculate revenue (mock for now, could be from metrics)
  const metrics = listRecords(SHEETS.METRICS, { category: 'revenue' });
  const revenueThisMonth = metrics.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);

  return {
    totalLeads: leads.length,
    newLeadsToday,
    qualifiedLeads,
    conversionRate: Math.round(conversionRate * 10) / 10,
    activeAutomations,
    automationErrors,
    revenueThisMonth,
    revenueGrowth: 12.5 // Mock value
  };
}

// ============================================
// Initialization
// ============================================

function initializeSheets() {
  // Create all required sheets
  Object.values(SHEETS).forEach(sheetName => {
    getSheet(sheetName);
  });

  Logger.log('All sheets initialized');
}

function setSpreadsheetId(id) {
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  Logger.log('Spreadsheet ID set to: ' + id);
}
