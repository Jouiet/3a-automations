#!/usr/bin/env node
/**
 * FIX IMAGE ALT TEXTS - Add missing alt attributes
 * Adds descriptive alt text to images for accessibility and SEO
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Alt text mappings by image source pattern
const ALT_MAPPINGS = {
    // Logo images
    'logo.png': '3A Automation Logo',
    'logo.webp': '3A Automation Logo',
    '/logo.png': '3A Automation Logo',
    '../logo.png': '3A Automation Logo',
    '../../logo.png': '3A Automation Logo',

    // Favicon/icons
    'favicon': '3A Automation Favicon',
    'apple-touch-icon': '3A Automation App Icon',
    'android-chrome': '3A Automation App Icon',

    // Tech stack icons (orbital animation)
    'shopify': 'Shopify E-commerce Platform',
    'klaviyo': 'Klaviyo Email Marketing',
    'google-analytics': 'Google Analytics',
    'ga4': 'Google Analytics 4',
    'n8n': 'n8n Workflow Automation',
    'claude': 'Claude AI Assistant',
    'grok': 'Grok AI by xAI',
    'gemini': 'Google Gemini AI',
    'playwright': 'Playwright Testing Framework',
    'puppeteer': 'Puppeteer Browser Automation',
    'meta': 'Meta Ads Platform',
    'tiktok': 'TikTok Ads Platform',
    'hostinger': 'Hostinger Web Hosting',
    'wordpress': 'WordPress CMS',
    'openai': 'OpenAI GPT',
    'chatgpt': 'ChatGPT AI',

    // Generic patterns
    'hero': 'Hero Section Visual',
    'background': 'Decorative Background',
    'icon': 'Feature Icon',
    'illustration': 'Service Illustration',
    'chart': 'Analytics Chart',
    'graph': 'Performance Graph'
};

let stats = { fixed: 0, skipped: 0, total: 0 };

function getAltText(src, context) {
    if (!src) return '3A Automation';

    const srcLower = src.toLowerCase();

    // Check mappings
    for (const [pattern, alt] of Object.entries(ALT_MAPPINGS)) {
        if (srcLower.includes(pattern.toLowerCase())) {
            return alt;
        }
    }

    // Generate from filename
    const filename = path.basename(src, path.extname(src));
    const words = filename.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
    if (words.length > 2) {
        return words.charAt(0).toUpperCase() + words.slice(1);
    }

    return '3A Automation Service';
}

function fixImageAlts(content, isEnglish) {
    let modified = false;

    // Find all img tags
    const imgRegex = /<img([^>]*)>/gi;

    content = content.replace(imgRegex, (match, attrs) => {
        stats.total++;

        // Check if alt exists
        const hasAlt = /\salt=["'][^"']*["']/i.test(attrs);

        if (hasAlt) {
            // Check if alt is empty
            const emptyAlt = /\salt=["']\s*["']/i.test(attrs);
            if (!emptyAlt) {
                stats.skipped++;
                return match;
            }
        }

        // Get src for context
        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        const src = srcMatch ? srcMatch[1] : '';

        // Generate alt text
        let alt = getAltText(src, isEnglish ? 'en' : 'fr');

        // Add or replace alt attribute
        if (hasAlt) {
            attrs = attrs.replace(/\salt=["']\s*["']/i, ` alt="${alt}"`);
        } else {
            attrs = attrs.trim() + ` alt="${alt}"`;
        }

        stats.fixed++;
        modified = true;
        return `<img${attrs}>`;
    });

    return { content, modified };
}

function processFile(filePath) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');
    const isEnglish = relativePath.startsWith('en/');

    let content = fs.readFileSync(filePath, 'utf8');
    const result = fixImageAlts(content, isEnglish);

    if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        console.log(`✅ Fixed: ${relativePath}`);
    } else {
        console.log(`⏭️  Complete: ${relativePath}`);
    }
}

function findHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            files.push(...findHtmlFiles(fullPath));
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║       FIX IMAGE ALT TEXTS - ACCESSIBILITY & SEO                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const files = findHtmlFiles(SITE_DIR);
    console.log(`Processing ${files.length} HTML files...\n`);

    files.forEach(processFile);

    console.log('\n' + '═'.repeat(50));
    console.log(`Images found: ${stats.total}`);
    console.log(`Alt texts added: ${stats.fixed}`);
    console.log(`Already complete: ${stats.skipped}`);
    console.log('═'.repeat(50));
}

main();
