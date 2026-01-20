const fs = require('fs');
const path = require('path');

const sitemapPath = '/Users/mac/Documents/JO-AAA/landing-page-hostinger/sitemap.xml';
const today = '2026-01-12';

function fixSitemap() {
    if (!fs.existsSync(sitemapPath)) {
        console.error('Sitemap not found');
        return;
    }

    let content = fs.readFileSync(sitemapPath, 'utf-8');

    // Regex for YYYY-MM-DD
    // Specifically target 2026-12-XX
    const regex = /2026-12-\d{2}/g;

    if (regex.test(content)) {
        const newContent = content.replace(regex, today);
        fs.writeFileSync(sitemapPath, newContent);
        console.log(`Updated Sitemap dates to ${today}`);
    } else {
        console.log('No incorrect future dates found in sitemap.');
    }
}

fixSitemap();
