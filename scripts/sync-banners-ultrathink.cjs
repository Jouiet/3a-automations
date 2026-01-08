const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../landing-page-hostinger');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

console.log('--- STARTING HTML BANNER SYNC (16 -> 18 Agentic Workflows) ---');

walkDir(baseDir, filePath => {
    if (filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Pattern for the agentic-count-text
        content = content.replace(/16 Agentic Workflows/g, '18 Agentic Workflows');
        // Ensure all 117 or 112 counts in tool related text are also 118
        content = content.replace(/117 automatisations/g, '118 automatisations');
        content = content.replace(/117 automations/g, '118 automations');
        content = content.replace(/112 automatisations/g, '118 automatisations');
        content = content.replace(/112 automations/g, '118 automations');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${path.relative(baseDir, filePath)}`);
        }
    }
});

console.log('--- HTML BANNER SYNC COMPLETE ---');
