const fs = require('fs');
const path = require('path');

const baseDir = '/Users/mac/Documents/JO-AAA/landing-page-hostinger';
const TARGET_COUNT = '118';
const TARGET_AGENTS = '18';

const replacements = [
    { regex: /(117|112|111|99|86|78|77|75)\s*(automatisations|automations|workflows|outils|tools)/gi, replacement: `${TARGET_COUNT} $2` },
    { regex: /(16|17)\s*(agents haute-agence|agents)/gi, replacement: `${TARGET_AGENTS} $2` },
    { regex: /"count":\s*(117|112|111|99|86|78|77|75)/gi, replacement: `"count": ${TARGET_COUNT}` },
    { regex: /"itemCount":\s*(117|112|111|99|86|78|77|75)/gi, replacement: `"itemCount": ${TARGET_COUNT}` }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replacements.forEach(r => {
        content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath.replace(baseDir, '')}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    });
}

console.log('🚀 Starting forensic HTML count synchronization...');
traverse(baseDir);
console.log('🏁 Synchronization complete.');
