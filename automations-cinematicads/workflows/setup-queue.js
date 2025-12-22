// automations/workflows/setup-queue.js
const GoogleSheetsClient = require('../core/GoogleSheetsClient');
const { validateEnv } = require('../config/env-loader');
const chalk = require('chalk');

// Defined Schema from PROJECT_3A_AUTOMATION_PLAN.md
const SCHEMA_HEADERS = [
    'Campaign_ID',
    'Input_URL',
    'Status',         // pending, processing, done, error
    'Segment',        // E-commerce, B2B
    'Workflow_Type',  // Competitor_Clone, UGC_Factory, Cinematic
    'Assets_Folder',  // Google Drive Link
    'Logs',           // Error messages or status updates
    'Created_At'
];

async function run() {
    console.log(chalk.bold.cyan('=== PROJECT 3A: CAMPAIGN QUEUE SETUP ==='));

    if (!validateEnv()) {
        console.error(chalk.red('Environment validation failed. Exiting.'));
        process.exit(1);
    }

    const client = new GoogleSheetsClient();

    try {
        console.log(chalk.blue('1. Connecting to Google Sheets...'));
        const connected = await client.checkConnection();
        if (!connected) throw new Error('Connection failed');

        console.log(chalk.blue('2. Verifying Sheet Existence...'));
        await client.ensureQueueSheetExists();

        console.log(chalk.blue('3. Enforcing Schema...'));
        await client.setHeaders(SCHEMA_HEADERS);

        console.log(chalk.bold.green('✅ Setup Complete. The Factory is ready to receive orders.'));

    } catch (error) {
        console.error(chalk.bold.red('❌ Setup Failed:'), error.message);
        process.exit(1);
    }
}

run();
