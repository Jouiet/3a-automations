const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, 'landing-page-hostinger');

const BANNER_HTML = `
  <!-- Agentic Status Banner (Live Data) -->
  <div class="agentic-status-banner" id="agentic-status-banner">
    <div class="container">
      <div class="status-content">
        <div class="status-left">
          <span class="pulse-indicator online"></span>
          <span class="status-text">AGENTIC BACKEND: <strong id="system-status-text">OPERATIONAL</strong></span>
          <span class="status-divider">|</span>
          <span class="status-metric">ENV CONFIG: <strong id="config-rate-text">100%</strong></span>
          <span class="status-divider">|</span>
          <span class="status-metric">AGENCY: <strong id="agentic-count-text">16 Agentic Workflows</strong></span>
        </div>
        <div class="status-right" id="verified-apis-scroll">
          <span class="api-tag ok">Shopify</span>
          <span class="api-tag ok">Klaviyo</span>
          <span class="api-tag ok">xAI</span>
          <span class="api-tag ok">Google</span>
        </div>
      </div>
    </div>
  </div>
`;

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const htmlFiles = getFiles(ROOT_DIR);

htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativeDepth = path.relative(ROOT_DIR, path.dirname(filePath)).split(path.sep).filter(p => p).length;
    const prefix = '../'.repeat(relativeDepth);

    let changed = false;

    // 1. Inject scripts if missing
    if (!content.includes('geo-locale.js')) {
        content = content.replace('</body>', `  <script src="${prefix}geo-locale.js"></script>\n</body>`);
        changed = true;
    }
    if (!content.includes('agentic-transparency.js')) {
        content = content.replace('</body>', `  <script src="${prefix}agentic-transparency.js"></script>\n</body>`);
        changed = true;
    }

    // 2. Inject banner after <header> if missing
    if (!content.includes('agentic-status-banner') && content.includes('</header>')) {
        content = content.replace('</header>', '</header>\n' + BANNER_HTML);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${path.relative(ROOT_DIR, filePath)}`);
    } else {
        console.log(`- Already synced: ${path.relative(ROOT_DIR, filePath)}`);
    }
});
