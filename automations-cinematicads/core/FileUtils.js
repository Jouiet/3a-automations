// automations/core/FileUtils.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function downloadFile(url, outputDir) {
    try {
        const filename = path.basename(new URL(url).pathname) || `download_${Date.now()}.mp4`;
        const outputPath = path.join(outputDir, filename);

        console.log(chalk.blue(`[DOWNLOAD] Fetching ${url} -> ${outputPath}`));

        const writer = fs.createWriteStream(outputPath);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(chalk.green('[DOWNLOAD] Complete.'));
                resolve(outputPath);
            });
            writer.on('error', reject);
        });

    } catch (error) {
        console.error(chalk.red('[ERROR] Download failed:'), error.message);
        throw error;
    }
}

module.exports = { downloadFile };
