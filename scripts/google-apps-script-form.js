/**
 * Google Apps Script - Form Handler for 3A Automation
 *
 * INSTRUCTIONS DE DÉPLOIEMENT:
 * 1. Aller sur https://script.google.com
 * 2. Créer un nouveau projet
 * 3. Coller ce code
 * 4. Sauvegarder (Ctrl+S)
 * 5. Déployer > Nouveau déploiement
 * 6. Type: Application Web
 * 7. Exécuter en tant que: Moi
 * 8. Qui a accès: Tout le monde
 * 9. Copier l'ID de déploiement
 * 10. Remplacer YOUR_SCRIPT_ID dans les fichiers HTML
 *
 * Ce script:
 * - Reçoit les soumissions de formulaire
 * - Les enregistre dans Google Sheets
 * - Envoie une notification par email
 */

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Remplacer par l'ID de votre spreadsheet
const SHEET_NAME = 'Leads';
const NOTIFICATION_EMAIL = 'contact@3a-automation.com';

/**
 * Traite les requêtes POST (soumissions de formulaire)
 */
function doPost(e) {
  try {
    // Parser les données du formulaire
    const data = e.parameter;

    // Enregistrer dans Google Sheets
    saveToSheet(data);

    // Envoyer notification par email
    sendNotificationEmail(data);

    // Retourner succès
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Form submitted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Retourner erreur
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Traite les requêtes GET (test)
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
 * Enregistre les données dans Google Sheets
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Créer la feuille si elle n'existe pas
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Ajouter les en-têtes
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
  }

  // Ajouter la ligne de données
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
 * Envoie une notification par email
 */
function sendNotificationEmail(data) {
  const subject = `[3A Automation] Nouveau lead: ${data.name || 'Sans nom'}`;

  const body = `
Nouveau lead reçu sur 3a-automation.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom: ${data.name || 'Non spécifié'}
Email: ${data.email || 'Non spécifié'}
Entreprise: ${data.company || 'Non spécifié'}
Site web: ${data.website || 'Non spécifié'}
Service demandé: ${data.service || 'Non spécifié'}
Sujet: ${data.subject || 'Non spécifié'}

Message:
${data.message || 'Aucun message'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plateforme: ${data.platform || 'Non spécifié'}
Chiffre d'affaires: ${data.revenue || 'Non spécifié'}
Pays: ${data.country || 'Non spécifié'}
Défis: ${data.challenges || 'Non spécifié'}

Source: ${data.source || 'website'}
Date: ${new Date().toLocaleString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Répondre sous 24-48h comme promis!
  `;

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body
  });
}

/**
 * Fonction de test
 */
function testFormSubmission() {
  const testData = {
    parameter: {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      website: 'https://example.com',
      service: 'audit-shopify',
      message: 'Ceci est un message de test',
      source: 'test'
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}
