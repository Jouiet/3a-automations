const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../landing-page-hostinger');
const REPLACEMENTS = [
    // counts
    { from: /118 automa/gi, to: '174 automa' },
    { from: /119 automa/gi, to: '174 automa' },
    { from: /118 Verified/gi, to: '174 Verified' },
    { from: /119 Verified/gi, to: '174 Verified' },
    { from: /118 outils/gi, to: '174 outils' },
    { from: /119 outils/gi, to: '174 outils' },
    { from: /118 tools/gi, to: '174 tools' },
    { from: /119 tools/gi, to: '174 tools' },
    { from: /118 automatisations/gi, to: '174 automatisations' },
    { from: /119 automatisations/gi, to: '174 automatisations' },
    { from: /119 Workflows/gi, to: '174 Sovereign Units' },

    // Agents
    { from: /10 Hardened Agents/gi, to: '18 Hardened Agents' },
    { from: /10 agents/gi, to: '18 agents' },
    { from: /10 Agents/gi, to: '18 Agents' },

    // Levels
    { from: /Level 4/g, to: 'Level 5' },
    { from: /L4 agents/gi, to: 'L5 agents' },
    { from: /\(L4\)/g, to: '(L5)' },

    // Specific text blocks found in JSON-LD
    { from: /Notre catalogue contient 118 automatisations/g, to: 'Notre catalogue contient 174 unités souveraines' },
    { from: /Our catalog contains 118/g, to: 'Our catalog contains 174' }
];

const EXTENSIONS = ['.html', '.txt', '.xml', '.json', '.js', '.md'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

console.log('🚀 Starting Sovereign Sync (174 Units / 18 Agents / L5)...');
console.log(`📂 Scanning directory: ${ROOT_DIR}`);

try {
    const files = getAllFiles(ROOT_DIR);
    let modifiedCount = 0;

    files.forEach(file => {
        const ext = path.extname(file);
        if (!EXTENSIONS.includes(ext)) return;

        // Skip node_modules if present
        if (file.includes('node_modules')) return;

        const originalContent = fs.readFileSync(file, 'utf8');
        let newContent = originalContent;

        REPLACEMENTS.forEach(rule => {
            newContent = newContent.replace(rule.from, rule.to);
        });

        if (originalContent !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`✅ Updated: ${path.relative(ROOT_DIR, file)}`);
            modifiedCount++;
        }
    });

    console.log(`\n🎉 Sync Complete! Modified ${modifiedCount} files.`);

} catch (e) {
    console.error('❌ Error:', e);
}
