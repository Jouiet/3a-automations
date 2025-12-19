/**
 * 3A Automation - Google Apps Script Form Handler
 * Version: 1.0 | Date: 2025-12-19
 *
 * DÉPLOIEMENT:
 * 1. Aller sur https://script.google.com
 * 2. Créer nouveau projet "3A-Form-Handler"
 * 3. Copier ce code dans Code.gs
 * 4. Modifier NOTIFICATION_EMAIL ci-dessous
 * 5. Déployer → Nouvelle déploiement → Application Web
 * 6. Définir: "Exécuter en tant que" = Moi, "Qui a accès" = Tout le monde
 * 7. Copier l'URL du déploiement
 * 8. Remplacer YOUR_SCRIPT_ID dans le site web par cette URL
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - MODIFIER UNIQUEMENT CETTE SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  NOTIFICATION_EMAIL: 'contact@3a-automation.com', // Email de notification
  SPREADSHEET_ID: '', // Optionnel: ID Google Sheet pour backup (laisser vide si pas nécessaire)
  SHEET_NAME: 'Leads', // Nom de l'onglet si Spreadsheet utilisé
  SLACK_WEBHOOK: '', // Optionnel: webhook Slack pour notifications
};

// ═══════════════════════════════════════════════════════════════════════════════
// CODE - NE PAS MODIFIER SAUF SI NÉCESSAIRE
// ═══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    // Parse le contenu JSON
    const data = JSON.parse(e.postData.contents);

    // Log pour debugging
    console.log('Form submission received:', JSON.stringify(data));

    // Envoyer notification email
    sendNotificationEmail(data);

    // Sauvegarder dans Google Sheet (optionnel)
    if (CONFIG.SPREADSHEET_ID) {
      saveToSheet(data);
    }

    // Notification Slack (optionnel)
    if (CONFIG.SLACK_WEBHOOK) {
      sendSlackNotification(data);
    }

    // Réponse succès avec CORS
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Form submitted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: '3A Automation Form Handler is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendNotificationEmail(data) {
  const subject = `[3A Automation] Nouveau lead: ${data.name || 'Inconnu'}`;

  const body = `
NOUVEAU LEAD - 3A AUTOMATION
═══════════════════════════════════════════════════════════════

INFORMATIONS CONTACT
────────────────────
Nom: ${data.name || 'Non spécifié'}
Email: ${data.email || 'Non spécifié'}
Entreprise: ${data.company || 'Non spécifié'}
Site web: ${data.website || 'Non spécifié'}

DEMANDE
────────────────────
Sujet: ${data.subject || 'Non spécifié'}
Plateforme: ${data.platform || 'Non spécifié'}
Pays: ${data.country || 'Non spécifié'}

Message / Défis:
${data.message || data.challenges || 'Pas de message'}

MÉTADONNÉES
────────────────────
Source: ${data.source || 'website'}
Page: ${data.page || 'Non spécifié'}
Date: ${data.timestamp || new Date().toISOString()}
User Agent: ${data.userAgent || 'Non spécifié'}
Referrer: ${data.referrer || 'direct'}

═══════════════════════════════════════════════════════════════
Ce message a été généré automatiquement par 3A Automation Form Handler.
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a2540 100%); color: #4FBAF1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .section h3 { color: #1a2540; margin-top: 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .message-box { background: #fff; border-left: 4px solid #4FBAF1; padding: 15px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0;">🚀 Nouveau Lead - 3A Automation</h2>
  </div>

  <div class="section">
    <h3>📧 Informations Contact</h3>
    <p><span class="label">Nom:</span> <span class="value">${data.name || 'Non spécifié'}</span></p>
    <p><span class="label">Email:</span> <span class="value"><a href="mailto:${data.email}">${data.email || 'Non spécifié'}</a></span></p>
    <p><span class="label">Entreprise:</span> <span class="value">${data.company || 'Non spécifié'}</span></p>
    <p><span class="label">Site web:</span> <span class="value">${data.website ? '<a href="' + data.website + '">' + data.website + '</a>' : 'Non spécifié'}</span></p>
  </div>

  <div class="section">
    <h3>💼 Demande</h3>
    <p><span class="label">Sujet:</span> <span class="value">${data.subject || 'Non spécifié'}</span></p>
    <p><span class="label">Plateforme:</span> <span class="value">${data.platform || 'Non spécifié'}</span></p>
    <p><span class="label">Pays:</span> <span class="value">${data.country || 'Non spécifié'}</span></p>
    <div class="message-box">
      <span class="label">Message:</span><br>
      ${(data.message || data.challenges || 'Pas de message').replace(/\n/g, '<br>')}
    </div>
  </div>

  <div class="section">
    <h3>📊 Métadonnées</h3>
    <p><span class="label">Source:</span> ${data.source || 'website'}</p>
    <p><span class="label">Page:</span> ${data.page || 'Non spécifié'}</p>
    <p><span class="label">Date:</span> ${data.timestamp || new Date().toISOString()}</p>
  </div>

  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    Ce message a été généré automatiquement par 3A Automation Form Handler.
  </p>
</body>
</html>
`;

  GmailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body, {
    htmlBody: htmlBody,
    name: '3A Automation'
  });

  console.log('Notification email sent to:', CONFIG.NOTIFICATION_EMAIL);
}

function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);

  // Headers si première ligne
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Company', 'Website',
      'Subject', 'Platform', 'Country', 'Message', 'Source', 'Page'
    ]);
  }

  // Ajouter la donnée
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.company || '',
    data.website || '',
    data.subject || '',
    data.platform || '',
    data.country || '',
    data.message || data.challenges || '',
    data.source || 'website',
    data.page || ''
  ]);

  console.log('Data saved to sheet');
}

function sendSlackNotification(data) {
  const payload = {
    text: `🚀 *Nouveau Lead* - 3A Automation`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🚀 Nouveau Lead", emoji: true }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Nom:*\n${data.name || 'Non spécifié'}` },
          { type: "mrkdwn", text: `*Email:*\n${data.email || 'Non spécifié'}` },
          { type: "mrkdwn", text: `*Entreprise:*\n${data.company || 'Non spécifié'}` },
          { type: "mrkdwn", text: `*Sujet:*\n${data.subject || 'Non spécifié'}` }
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Message:*\n${data.message || data.challenges || 'Pas de message'}` }
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
