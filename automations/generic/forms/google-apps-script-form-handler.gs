/**
 * 3A Automation - Google Apps Script Form Handler v2.0
 * Version: 2.0 | Date: 2025-12-26
 *
 * PIPELINE COMPLET:
 * Formulaire HTML → Google Apps Script → n8n → Klaviyo → Welcome Series
 *
 * DEPLOIEMENT:
 * 1. Aller sur https://script.google.com
 * 2. Creer nouveau projet "3A-Form-Handler-v2"
 * 3. Copier ce code dans Code.gs
 * 4. Configurer les constantes ci-dessous
 * 5. Deployer > Nouvelle deploiement > Application Web
 * 6. Definir: "Executer en tant que" = Moi, "Qui a acces" = Tout le monde
 * 7. Copier l'URL du deploiement
 * 8. Remplacer l'URL dans les formulaires HTML
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - MODIFIER SELON VOTRE ENVIRONNEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Notifications
  NOTIFICATION_EMAIL: 'contact@3a-automation.com',

  // Google Sheets (backup leads)
  SPREADSHEET_ID: '', // Laisser vide pour creer auto, ou mettre ID existant
  SHEET_NAME: 'Leads',

  // n8n Integration (Welcome Series)
  N8N_WEBHOOK_URL: 'https://n8n.srv1168256.hstgr.cloud/webhook/subscribe/new',
  N8N_ENABLED: true, // Active/desactive l'integration n8n

  // Slack (optionnel)
  SLACK_WEBHOOK: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    // Parse les donnees du formulaire
    const data = parseFormData(e);

    // Log pour debugging
    console.log('Form submission received:', JSON.stringify(data));

    // 1. Sauvegarder dans Google Sheets (backup)
    saveToSheet(data);

    // 2. Envoyer notification email
    sendNotificationEmail(data);

    // 3. Trigger n8n Welcome Series (si email valide)
    let n8nResult = { triggered: false };
    if (CONFIG.N8N_ENABLED && data.email) {
      n8nResult = triggerN8nWelcomeSeries(data);
    }

    // 4. Notification Slack (optionnel)
    if (CONFIG.SLACK_WEBHOOK) {
      sendSlackNotification(data);
    }

    // Response avec CORS
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Form submitted successfully',
        n8n_triggered: n8nResult.triggered,
        welcome_series: n8nResult.triggered ? 'started' : 'skipped'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '3A Automation Form Handler v2.0 is running',
      version: '2.0',
      n8n_enabled: CONFIG.N8N_ENABLED,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PARSING
// ═══════════════════════════════════════════════════════════════════════════════

function parseFormData(e) {
  // Support JSON et form-urlencoded
  let data = {};

  if (e.postData && e.postData.type === 'application/json') {
    data = JSON.parse(e.postData.contents);
  } else if (e.parameter) {
    data = e.parameter;
  }

  // Extraire prenom du nom complet si non fourni
  if (data.name && !data.first_name) {
    data.first_name = data.name.split(' ')[0];
  }

  // Ajouter timestamp si absent
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// N8N INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

function triggerN8nWelcomeSeries(data) {
  try {
    const payload = {
      email: data.email,
      first_name: data.first_name || data.name?.split(' ')[0] || '',
      name: data.name || '',
      company: data.company || '',
      website: data.website || '',
      service: data.service || '',
      source: data.source || '3a-automation-website',
      timestamp: data.timestamp
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CONFIG.N8N_WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log('n8n webhook response:', responseCode, responseText);

    if (responseCode === 200) {
      return { triggered: true, response: responseText };
    } else {
      console.error('n8n webhook failed:', responseCode, responseText);
      return { triggered: false, error: responseText };
    }

  } catch (error) {
    console.error('n8n webhook error:', error);
    return { triggered: false, error: error.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

function sendNotificationEmail(data) {
  const subject = `[3A Automation] Nouveau lead: ${data.name || 'Anonyme'}`;

  const body = `
NOUVEAU LEAD - 3A AUTOMATION
═══════════════════════════════════════════════════════════════

INFORMATIONS CONTACT
────────────────────
Nom: ${data.name || 'Non specifie'}
Email: ${data.email || 'Non specifie'}
Entreprise: ${data.company || 'Non specifie'}
Site web: ${data.website || 'Non specifie'}

DEMANDE
────────────────────
Service: ${data.service || 'Non specifie'}
Message: ${data.message || 'Pas de message'}

METADONNEES
────────────────────
Source: ${data.source || 'website'}
Date: ${data.timestamp || new Date().toISOString()}

AUTOMATION STATUS
────────────────────
Welcome Series: ${CONFIG.N8N_ENABLED && data.email ? 'TRIGGERED' : 'SKIPPED'}

═══════════════════════════════════════════════════════════════
Pipeline: Form → Google Script → n8n → Klaviyo
Repondre sous 24-48h comme promis!
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a2540 100%); color: #4FBAF1; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h2 { margin: 0; }
    .section { background: #f8f9fa; padding: 15px; margin-bottom: 2px; }
    .section h3 { color: #1a2540; margin: 0 0 10px 0; font-size: 14px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .status-box { background: #d4edda; border-left: 4px solid #28a745; padding: 10px 15px; margin-top: 10px; }
    .status-box.skipped { background: #fff3cd; border-color: #ffc107; }
    .footer { background: #e9ecef; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Nouveau Lead - 3A Automation</h2>
  </div>

  <div class="section">
    <h3>INFORMATIONS CONTACT</h3>
    <p><span class="label">Nom:</span> <span class="value">${data.name || 'Non specifie'}</span></p>
    <p><span class="label">Email:</span> <span class="value"><a href="mailto:${data.email}">${data.email || 'Non specifie'}</a></span></p>
    <p><span class="label">Entreprise:</span> <span class="value">${data.company || 'Non specifie'}</span></p>
    <p><span class="label">Site web:</span> <span class="value">${data.website ? '<a href="' + data.website + '">' + data.website + '</a>' : 'Non specifie'}</span></p>
  </div>

  <div class="section">
    <h3>DEMANDE</h3>
    <p><span class="label">Service:</span> <span class="value">${data.service || 'Non specifie'}</span></p>
    <p><span class="label">Message:</span></p>
    <p>${(data.message || 'Pas de message').replace(/\n/g, '<br>')}</p>
  </div>

  <div class="section">
    <h3>AUTOMATION</h3>
    <div class="status-box ${CONFIG.N8N_ENABLED && data.email ? '' : 'skipped'}">
      <strong>Welcome Series:</strong> ${CONFIG.N8N_ENABLED && data.email ? 'ACTIVE - 5 emails programmes' : 'SKIPPED - email manquant'}
    </div>
  </div>

  <div class="footer">
    <p><strong>Pipeline:</strong> Formulaire → Google Script → n8n → Klaviyo</p>
    <p>Repondre sous 24-48h comme promis!</p>
  </div>
</body>
</html>
`;

  GmailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body, {
    htmlBody: htmlBody,
    name: '3A Automation'
  });

  console.log('Notification email sent to:', CONFIG.NOTIFICATION_EMAIL);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS BACKUP
// ═══════════════════════════════════════════════════════════════════════════════

function saveToSheet(data) {
  let ss;

  // Creer ou ouvrir spreadsheet
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === '') {
    ss = SpreadsheetApp.create('3A Automation - Leads');
    console.log('Created new spreadsheet:', ss.getUrl());
  } else {
    ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Creer sheet si inexistant
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Company', 'Website',
      'Service', 'Message', 'Source', 'Welcome Series'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  // Ajouter donnees
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.company || '',
    data.website || '',
    data.service || '',
    data.message || '',
    data.source || 'website',
    CONFIG.N8N_ENABLED && data.email ? 'TRIGGERED' : 'SKIPPED'
  ]);

  console.log('Data saved to sheet');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLACK NOTIFICATION (OPTIONNEL)
// ═══════════════════════════════════════════════════════════════════════════════

function sendSlackNotification(data) {
  if (!CONFIG.SLACK_WEBHOOK) return;

  const payload = {
    text: `Nouveau Lead - 3A Automation`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Nouveau Lead", emoji: true }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Nom:*\n${data.name || 'Non specifie'}` },
          { type: "mrkdwn", text: `*Email:*\n${data.email || 'Non specifie'}` },
          { type: "mrkdwn", text: `*Service:*\n${data.service || 'Non specifie'}` },
          { type: "mrkdwn", text: `*Welcome Series:*\n${CONFIG.N8N_ENABLED && data.email ? 'TRIGGERED' : 'SKIPPED'}` }
        ]
      }
    ]
  };

  UrlFetchApp.fetch(CONFIG.SLACK_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });

  console.log('Slack notification sent');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Test complet du pipeline
 * Executer cette fonction pour verifier le setup
 */
function testFullPipeline() {
  const testData = {
    parameter: {
      name: 'Test Pipeline',
      email: 'test-pipeline@example.com',
      company: 'Test Company',
      website: 'https://example.com',
      service: 'consultation',
      message: 'Test du pipeline complet: Form → Script → n8n → Klaviyo',
      source: 'test-pipeline'
    }
  };

  const result = doPost(testData);
  Logger.log('Pipeline test result:');
  Logger.log(result.getContent());
}

/**
 * Test uniquement le webhook n8n
 */
function testN8nWebhook() {
  const testData = {
    email: 'test-n8n@example.com',
    first_name: 'Test',
    name: 'Test User',
    source: 'test-n8n-direct'
  };

  const result = triggerN8nWelcomeSeries(testData);
  Logger.log('n8n webhook test result:');
  Logger.log(JSON.stringify(result));
}

/**
 * Verifier le status du handler
 */
function testGetStatus() {
  const result = doGet({});
  Logger.log('Handler status:');
  Logger.log(result.getContent());
}
