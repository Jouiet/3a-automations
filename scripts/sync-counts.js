const fs = require('fs');
const path = require('path');

const targetDir = '/Users/mac/Documents/JO-AAA/landing-page-hostinger';
const correctCount = '118';
const incorrectCount = '119';

// List of file extensions to check
const extensions = ['.html', '.json', '.js'];

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walk(filePath, fileList);
            }
        } else {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

function updateCounts() {
    const files = walk(targetDir);
    let updatedFiles = 0;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes(incorrectCount)) {
            // Replace "119" with "118" NOT blindly, but selectively
            // Regex to match "119automations", "119 automations", "119"
            // We need to be careful not to replace phone numbers or other IDs.
            // Based on grep, most are "119 automations" or "119 automatisations" or metadata

            // Safer Replacement: "119 automa" -> "118 automa"
            // Also "total_automations": 119

            const newContent = content
                .replace(/119\s?automations/gi, '118 automations')
                .replace(/119\s?automatisations/gi, '118 automatisations')
                .replace(/"total_automations":\s?119/g, '"total_automations": 118')
                .replace(/119/g, (match, offset, string) => {
                    // Context check: looks for nearby "automations"
                    const start = Math.max(0, offset - 20);
                    const end = Math.min(string.length, offset + 20);
                    const context = string.substring(start, end);
                    if (context.toLowerCase().includes('auto') || context.includes('total')) {
                        return '118';
                    }
                    return match;
                });

            if (content !== newContent) {
                fs.writeFileSync(file, newContent);
                console.log(`Updated: ${file}`);
                updatedFiles++;
            }
        }
    });
    console.log(`Synchronization Complete. Updated ${updatedFiles} files.`);
}

updateCounts();
