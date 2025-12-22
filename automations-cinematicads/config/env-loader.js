// automations/config/env-loader.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const requiredVars = [
    'GOOGLE_SHEETS_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY'
];

function validateEnv() {
    const missing = requiredVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`[WARNING] Missing Environment Variables: ${missing.join(', ')}`);
        console.warn(`Please create a .env file in the root directory.`);
        return false;
    }
    return true;
}

module.exports = {
    validateEnv,
    SHEET_ID: process.env.GOOGLE_SHEETS_ID,
    GOOGLE_CREDENTIALS: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    }
};

