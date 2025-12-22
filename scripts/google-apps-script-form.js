/**
 * Google Apps Script - Form Handler for 3A Automation
 * Version: 1.0
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Save (Ctrl+S)
 * 5. Deploy > New deployment
 * 6. Type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Copy the deployment ID
 * 10. Replace YOUR_SCRIPT_ID in HTML files
 */

// Configuration - REPLACE THESE VALUES
var CONFIG = {
  SPREADSHEET_ID: '', // Leave empty to create new spreadsheet
  SHEET_NAME: 'Leads',
  NOTIFICATION_EMAIL: 'contact@3a-automation.com'
};

/**
 * Handle POST requests (form submissions)
 */
function doPost(e) {
  try {
    var data = e.parameter;

    // Save to Google Sheets
    saveToSheet(data);

    // Send email notification
    sendNotificationEmail(data);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Form submitted successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (test endpoint)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '3A Automation Form Handler is running',
      version: '1.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Save form data to Google Sheets
 */
function saveToSheet(data) {
  var ss;

  // Create or open spreadsheet
  if (CONFIG.SPREADSHEET_ID === '') {
    ss = SpreadsheetApp.create('3A Automation - Leads');
    CONFIG.SPREADSHEET_ID = ss.getId();
    Logger.log('Created new spreadsheet: ' + ss.getUrl());
  } else {
    ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Create sheet if it does not exist
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Email',
      'Company',
      'Website',
      'Service',
      'Subject',
      'Message',
      'Platform',
      'Revenue',
      'Country',
      'Challenges',
      'Source'
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
  }

  // Add data row
  sheet.appendRow([
    new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.company || '',
    data.website || '',
    data.service || '',
    data.subject || '',
    data.message || '',
    data.platform || '',
    data.revenue || '',
    data.country || '',
    data.challenges || '',
    data.source || 'website'
  ]);
}

/**
 * Send email notification for new lead
 */
function sendNotificationEmail(data) {
  var subject = '[3A Automation] New lead: ' + (data.name || 'No name');

  var body = 'New lead received on 3a-automation.com\n\n';
  body += '========================================\n\n';
  body += 'Name: ' + (data.name || 'Not specified') + '\n';
  body += 'Email: ' + (data.email || 'Not specified') + '\n';
  body += 'Company: ' + (data.company || 'Not specified') + '\n';
  body += 'Website: ' + (data.website || 'Not specified') + '\n';
  body += 'Service: ' + (data.service || 'Not specified') + '\n';
  body += 'Subject: ' + (data.subject || 'Not specified') + '\n\n';
  body += 'Message:\n' + (data.message || 'No message') + '\n\n';
  body += '========================================\n\n';
  body += 'Platform: ' + (data.platform || 'Not specified') + '\n';
  body += 'Revenue: ' + (data.revenue || 'Not specified') + '\n';
  body += 'Country: ' + (data.country || 'Not specified') + '\n';
  body += 'Challenges: ' + (data.challenges || 'Not specified') + '\n\n';
  body += 'Source: ' + (data.source || 'website') + '\n';
  body += 'Date: ' + new Date().toLocaleString() + '\n\n';
  body += '========================================\n';
  body += 'Reply within 24-48h as promised!\n';

  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: subject,
    body: body
  });
}

/**
 * Test function - run this to verify setup
 */
function testFormSubmission() {
  var testData = {
    parameter: {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      website: 'https://example.com',
      service: 'audit-shopify',
      message: 'This is a test message',
      source: 'test'
    }
  };

  var result = doPost(testData);
  Logger.log(result.getContent());
}
