const fs = require('fs');
const path = require('path');

const indexHtml = path.join(__dirname, '../landing-page-hostinger/index.html');
const investorsHtml = path.join(__dirname, '../landing-page-hostinger/investisseurs.html');
const enInvestorsHtml = path.join(__dirname, '../landing-page-hostinger/en/investors.html');

let errors = 0;

function checkBreadcrumb(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('"@type": "BreadcrumbList"')) {
        console.error(`FAIL: BreadcrumbList missing in ${path.basename(filePath)}`);
        errors++;
    } else {
        console.log(`PASS: BreadcrumbList found in ${path.basename(filePath)}`);
    }
}

const scriptJs = path.join(__dirname, '../landing-page-hostinger/script.js');

function checkClaim(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('20 resilient') || content.includes('20 automations résilientes')) {
        console.error(`FAIL: "20 resilient" claim found in ${path.basename(filePath)}`);
        errors++;
    } else if (content.includes('13 resilient') || content.includes('13 automations résilientes')) {
        console.log(`PASS: Claim corrected to 13 in ${path.basename(filePath)}`);
    } else {
        console.warn(`WARN: Resilient claim not found or different in ${path.basename(filePath)}`);
    }
}

function checkConfig() {
    const indexContent = fs.readFileSync(indexHtml, 'utf-8');
    if (!indexContent.includes('config.js')) {
        console.error('FAIL: config.js not loaded in index.html');
        errors++;
    } else {
        console.log('PASS: config.js loaded in index.html');
    }

    const scriptContent = fs.readFileSync(scriptJs, 'utf-8');
    if (!scriptContent.includes('window.CONFIG')) {
        console.error('FAIL: window.CONFIG not used in script.js');
        errors++;
    } else {
        console.log('PASS: window.CONFIG used in script.js');
    }
}

console.log('--- STARTING VERIFICATION PHASE B ---');

checkBreadcrumb(indexHtml);
checkClaim(investorsHtml);
checkClaim(enInvestorsHtml);
checkConfig();

if (errors === 0) {
    console.log('--- ALL CHECKS PASSED: SUCCESS ---');
    process.exit(0);
} else {
    console.error(`--- FAILED: ${errors} ERRORS FOUND ---`);
    process.exit(1);
}
