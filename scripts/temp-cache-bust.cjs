const fs = require('fs');
const path = require('path');

const filesToProcess = process.argv.slice(2);

if (filesToProcess.length === 0) {
  console.log('No files to process. Usage: node scripts/temp-cache-bust.cjs <file1> <file2> ...');
  process.exit(1);
}

let filesChanged = 0;
const newVersionString = '?v=16.0'; // Updated version

console.log(`Starting aggressive cache-busting process for ${filesToProcess.length} files. New version string: ${newVersionString}`);

for (const file of filesToProcess) {
  try {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // This regex finds '?v=X.X' and replaces it with the new version string.
    content = content.replace(/\?v=[0-9]+\.[0-9]+/g, newVersionString);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated version in: ${path.basename(file)}`);
      filesChanged++;
    } else {
      console.log(`No version string found to update in: ${path.basename(file)}`);
    }
  } catch (err) {
    console.error(`Failed to process ${file}:`, err);
  }
}

console.log(`
Cache busting complete. ${filesChanged} files updated.`);
