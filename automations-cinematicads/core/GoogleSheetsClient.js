// automations/core/GoogleSheetsClient.js
const { google } = require('googleapis');
const { SHEET_ID, GOOGLE_CREDENTIALS } = require('../config/env-loader');
const chalk = require('chalk');

class GoogleSheetsClient {
    constructor() {
        if (!SHEET_ID || !GOOGLE_CREDENTIALS.client_email) {
            console.error(chalk.red('[ERROR] Google Sheets Credentials missing. Check .env file.'));
            // We don't throw here to allow instantiation for testing/mocking if needed, 
            // but methods will fail.
        }

        this.auth = new google.auth.GoogleAuth({
            credentials: GOOGLE_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.spreadsheetId = SHEET_ID;
        this.sheetName = 'campaign_queue';
    }

    async checkConnection() {
        try {
            await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });
            console.log(chalk.green('[SUCCESS] Connected to Google Sheets.'));
            return true;
        } catch (error) {
            console.error(chalk.red('[ERROR] Failed to connect to Google Sheets:'), error.message);
            return false;
        }
    }

    async ensureQueueSheetExists() {
        try {
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });

            const sheetExists = spreadsheet.data.sheets.some(
                s => s.properties.title === this.sheetName
            );

            if (!sheetExists) {
                console.log(chalk.yellow(`[INFO] Sheet '${this.sheetName}' not found. Creating...`));
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [{ addSheet: { properties: { title: this.sheetName } } }]
                    }
                });
                console.log(chalk.green(`[SUCCESS] Sheet '${this.sheetName}' created.`));
            } else {
                console.log(chalk.blue(`[INFO] Sheet '${this.sheetName}' already exists.`));
            }
        } catch (error) {
            console.error(chalk.red('[ERROR] ensuring sheet existence:'), error.message);
            throw error;
        }
    }

    async setHeaders(headers) {
        try {
            // Check if headers already exist (read A1:Z1)
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:Z1`,
            });

            const existingHeaders = response.data.values ? response.data.values[0] : [];

            if (JSON.stringify(existingHeaders) === JSON.stringify(headers)) {
                console.log(chalk.blue('[INFO] Headers are already set correctly.'));
                return;
            }

            console.log(chalk.yellow('[INFO] Setting/Updating headers...'));
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1`,
                valueInputOption: 'RAW',
                resource: { values: [headers] },
            });
            
            // Format headers (Bold + Freeze Row)
            await this._formatHeaders();
            
            console.log(chalk.green('[SUCCESS] Headers updated and formatted.'));

        } catch (error) {
            console.error(chalk.red('[ERROR] setting headers:'), error.message);
            throw error;
        }
    }

    async _formatHeaders() {
        // Find sheetId for requests
        const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
        const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === this.sheetName).properties.sheetId;

        const requests = [
            {
                repeatCell: {
                    range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
                    cell: { userEnteredFormat: { textFormat: { bold: true } } },
                    fields: 'userEnteredFormat.textFormat.bold'
                }
            },
            {
                updateSheetProperties: {
                    properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 } },
                    fields: 'gridProperties.frozenRowCount'
                }
            }
        ];

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: { requests }
        });
    }
}

module.exports = GoogleSheetsClient;
