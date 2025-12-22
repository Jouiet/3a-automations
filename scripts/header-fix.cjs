const fs = require('fs');
const path = require('path');

async function standardizeHeaders() {
  try {
    const rootDir = path.resolve('landing-page-hostinger');
    
    // 1. Get all HTML files
    const allFiles = await new Promise((resolve, reject) => {
      // This is a simplified glob, assuming the glob tool returns a similar array
      const files = [
        'contact.html', 'booking.html', '404.html', 'en/contact.html', 'en/booking.html', 'en/404.html',
        'en/legal/terms.html', 'en/legal/privacy.html', 'en/services/free-audit.html',
        'en/services/ecommerce.html', 'en/services/flywheel-360.html', 'en/services/smb.html',
        'legal/mentions-legales.html', 'legal/politique-confidentialite.html',
        'services/pme.html', 'services/audit-gratuit.html', 'services/ecommerce.html',
        'services/flywheel-360.html', 'pricing.html', 'en/pricing.html', 'index.html',
        'a-propos.html', 'en/index.html', 'en/about.html', 'en/automations.html',
        'automations.html', 'cas-clients.html', 'en/case-studies.html'
      ].map(f => path.join(rootDir, f));
      resolve(files);
    });

    // 2. Read master nav blocks
    const frMasterContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const enMasterContent = fs.readFileSync(path.join(rootDir, 'en', 'index.html'), 'utf8');
    
    const navRegex = /<nav class="nav" id="nav-menu">[\s\S]*?<\/nav>/;
    
    const frMasterNav = frMasterContent.match(navRegex)[0];
    let enMasterNav = enMasterContent.match(navRegex)[0];
    
    // Ensure English version has "Book" not "RDV"
    enMasterNav = enMasterNav.replace(/<a href="\/en\/booking.html">.*?<\/a>/, '<a href="/en/booking.html">Book</a>');

    console.log("--- Master French Nav ---");
    console.log(frMasterNav);
    console.log("--- Master English Nav (Corrected) ---");
    console.log(enMasterNav);

    let filesChanged = 0;

    // 3. Iterate and replace
    for (const filePath of allFiles) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      const isEnglish = filePath.includes(path.join(rootDir, 'en'));

      const masterNav = isEnglish ? enMasterNav : frMasterNav;
      
      let currentNav = content.match(navRegex);

      if (currentNav && currentNav[0] !== masterNav) {
        // Adjust language switcher path
        const relativePath = path.relative(path.dirname(filePath), rootDir);
        let langSwitchPath = isEnglish ? path.join(relativePath, filePath.replace(path.join(rootDir, 'en'), '').slice(1)) : path.join(relativePath, 'en', path.basename(filePath));
        // Normalize path for web
        langSwitchPath = langSwitchPath.replace(/\\/g, '/');
        if (path.basename(langSwitchPath) === 'index.html') {
            langSwitchPath = path.dirname(langSwitchPath) + '/';
        }


        let correctedMasterNav = masterNav.replace(/href="(\/en\/|#contact)" class="lang-switch"/, `href="${langSwitchPath}" class="lang-switch"`);
         correctedMasterNav = correctedMasterNav.replace(/href="(\/|#contact)" class="lang-switch"/, `href="${langSwitchPath}" class="lang-switch"`);


        content = content.replace(navRegex, correctedMasterNav);
        
        fs.writeFileSync(filePath, content, 'utf8');
        filesChanged++;
        console.log(`[HEADER STANDARDIZED] in ${path.basename(filePath)}`);
      }
    }

    console.log(`\nHeader standardization complete. ${filesChanged} files updated.`);

  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

standardizeHeaders();
