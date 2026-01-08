const fs = require('fs');
const path = require('path');

const patterns = [
    { from: /117 (tools|automations|workflows|verified tools)/gi, to: '118 $1' },
    { from: /112 (tools|automations|workflows|verified tools)/gi, to: '118 $1' },
    { from: /117 automatisations/gi, to: '118 automatisations' },
    { from: /112 automatisations/gi, to: '118 automatisations' },
    { from: /16 (agents|workflows|high-agency agents|level 3\/4 agents)/gi, to: '18 $1' },
    { from: /"Level 3 Agentic"/gi, to: '"Level 4 Agentic"' },
    { from: /Agentic Workflows \(Level 3\)/gi, to: 'Agentic Workflows (Level 4)' },
    { from: /Level 3 Agent/gi, to: 'Level 4 Agent' }
];

const targetDirs = [
    path.resolve(__dirname, '../docs'),
    path.resolve(__dirname, '../investor-docs'),
    path.resolve(__dirname, '../.claude/rules'),
    path.resolve(__dirname, '../landing-page-hostinger')
];

const targetFiles = [
    path.resolve(__dirname, '../HISTORY.md'),
    path.resolve(__dirname, '../mission_complete_report.md'),
    path.resolve(__dirname, '../llms.txt')
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (filePath.endsWith('.md') || filePath.endsWith('.txt') || filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        patterns.forEach(p => {
            content = content.replace(p.from, p.to);
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${filePath}`);
        }
    }
}

console.log('--- STARTING GLOBAL FORENSIC SYNC ---');

targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir, processFile);
    }
});

targetFiles.forEach(file => {
    if (fs.existsSync(file)) {
        processFile(file);
    }
});

console.log('--- GLOBAL FORENSIC SYNC COMPLETE ---');
