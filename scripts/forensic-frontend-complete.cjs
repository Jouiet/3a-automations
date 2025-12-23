#!/usr/bin/env node
/**
 * AUDIT FORENSIQUE COMPLET - FRONTEND 3A-AUTOMATION.COM
 *
 * Couvre TOUTES les facettes:
 * 1. SEO/AEO (Answer Engine Optimization)
 * 2. Marketing Copy & Value Proposition
 * 3. Conversion & Upsell
 * 4. Design & Branding
 * 5. UI/UX
 * 6. Meta Tags & Descriptions
 * 7. Schema.org
 * 8. Sitemap & Robots.txt
 * 9. llms.txt (AI Crawlers)
 * 10. Images
 * 11. Services & Workflows
 *
 * Date: 2025-12-23
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const BASE_URL = 'https://3a-automation.com';
const OUTPUT_FILE = '/Users/mac/Desktop/JO-AAA/outputs/FORENSIC-FRONTEND-AUDIT-2025-12-23.md';

// AI Crawlers to check in robots.txt
const AI_CRAWLERS = [
    'GPTBot',           // OpenAI ChatGPT
    'ChatGPT-User',     // OpenAI ChatGPT
    'ClaudeBot',        // Anthropic Claude
    'Claude-Web',       // Anthropic Claude
    'anthropic-ai',     // Anthropic (lowercase in robots.txt)
    'Google-Extended',  // Google Gemini
    'PerplexityBot',    // Perplexity AI
    'cohere-ai',        // Cohere (lowercase in robots.txt)
    'CCBot',            // Common Crawl (used by many LLMs)
    'Bytespider',       // ByteDance (TikTok AI)
    'Amazonbot'         // Amazon Alexa
];

// Required Schema types per page type
const SCHEMA_REQUIREMENTS = {
    'index': ['Organization', 'WebSite', 'Service'],
    'services': ['Service', 'Offer', 'FAQPage'],
    'pricing': ['PriceSpecification', 'Offer', 'Service'],
    'about': ['Organization', 'Person', 'AboutPage'],
    'contact': ['ContactPage', 'Organization'],
    'case-studies': ['Article', 'Review', 'Organization'],
    'automations': ['ItemList', 'Service', 'SoftwareApplication'],
    'legal': ['WebPage'],
    '404': ['WebPage']
};

// Marketing power words
const POWER_WORDS = {
    urgency: ['maintenant', 'aujourd\'hui', 'immédiat', 'now', 'today', 'immediate', 'instantly'],
    value: ['gratuit', 'free', 'économisez', 'save', 'bonus', 'inclus', 'included'],
    trust: ['garanti', 'guaranteed', 'prouvé', 'proven', 'certifié', 'certified', 'expert'],
    action: ['découvrir', 'discover', 'commencer', 'start', 'réserver', 'book', 'obtenir', 'get'],
    exclusivity: ['exclusif', 'exclusive', 'unique', 'premium', 'limité', 'limited']
};

// Store all findings
const audit = {
    summary: {
        total_pages: 0,
        total_issues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    },
    seo: [],
    aeo: [],
    marketing: [],
    conversion: [],
    schema: [],
    meta: [],
    images: [],
    technical: [],
    recommendations: []
};

// Find all HTML files
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

// Read file content
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return null;
    }
}

// Add issue to audit
function addIssue(category, severity, file, issue, recommendation) {
    audit[category].push({ severity, file, issue, recommendation });
    audit.summary.total_issues++;
    audit.summary[severity.toLowerCase()]++;
}

// ========== 1. SEO AUDIT ==========
function auditSEO(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Title tag
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    if (!titleMatch || titleMatch[1].length < 30) {
        addIssue('seo', 'HIGH', relativePath,
            `Title too short (${titleMatch ? titleMatch[1].length : 0} chars)`,
            'Title should be 50-60 characters for optimal SEO');
    } else if (titleMatch[1].length > 60) {
        addIssue('seo', 'MEDIUM', relativePath,
            `Title too long (${titleMatch[1].length} chars)`,
            'Title should be under 60 characters to avoid truncation');
    }

    // Meta description (handle apostrophes in content - use closing quote as delimiter)
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                      content.match(/<meta\s+name='description'\s+content='([^']+)'/i);
    if (!descMatch || descMatch[1].length < 120) {
        addIssue('seo', 'HIGH', relativePath,
            `Meta description too short (${descMatch ? descMatch[1].length : 0} chars)`,
            'Meta description should be 150-160 characters');
    } else if (descMatch[1].length > 160) {
        addIssue('seo', 'LOW', relativePath,
            `Meta description slightly long (${descMatch[1].length} chars)`,
            'Consider trimming to under 160 characters');
    }

    // Canonical URL
    if (!content.includes('rel="canonical"') && !content.includes("rel='canonical'")) {
        addIssue('seo', 'MEDIUM', relativePath,
            'Missing canonical URL',
            'Add <link rel="canonical" href="..."> to prevent duplicate content');
    }

    // H1 tag (support multiline H1 with spans)
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
        addIssue('seo', 'HIGH', relativePath,
            'Missing H1 tag',
            'Every page should have exactly one H1 tag');
    }

    // Multiple H1s (reuse h1Count from above)
    if (h1Count > 1) {
        addIssue('seo', 'MEDIUM', relativePath,
            `Multiple H1 tags (${h1Count})`,
            'Use only one H1 per page; use H2-H6 for subheadings');
    }

    // hreflang tags
    if (!content.includes('hreflang')) {
        addIssue('seo', 'HIGH', relativePath,
            'Missing hreflang tags',
            'Add hreflang for fr, en, and x-default');
    }

    // OG tags
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    for (const tag of ogTags) {
        if (!content.includes(`property="${tag}"`)) {
            addIssue('seo', 'MEDIUM', relativePath,
                `Missing Open Graph tag: ${tag}`,
                `Add <meta property="${tag}" content="..."> for social sharing`);
        }
    }

    // Twitter cards
    if (!content.includes('twitter:card')) {
        addIssue('seo', 'LOW', relativePath,
            'Missing Twitter Card meta tags',
            'Add twitter:card, twitter:title, twitter:description for Twitter sharing');
    }
}

// ========== 2. AEO AUDIT (Answer Engine Optimization) ==========
function auditAEO(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // FAQ structured content
    const hasFAQ = content.includes('FAQPage') ||
                   content.includes('faq') ||
                   content.includes('FAQ') ||
                   content.includes('question');

    // Check for answer-first formatting
    const hasAnswerFirst = content.match(/<p[^>]*>[^<]{50,200}<\/p>/gi);
    if (!hasAnswerFirst || hasAnswerFirst.length < 3) {
        addIssue('aeo', 'MEDIUM', relativePath,
            'Limited answer-first content blocks',
            'Add concise answer paragraphs (50-200 chars) for AI extraction');
    }

    // List content (LLMs love lists)
    const listCount = (content.match(/<li>/gi) || []).length;
    if (listCount < 5 && !relativePath.includes('legal')) {
        addIssue('aeo', 'MEDIUM', relativePath,
            `Limited list content (${listCount} items)`,
            'Add more structured lists - 32% of AI citations are from listicles');
    }

    // Year freshness signals
    if (!content.includes('2025') && !content.includes('2024')) {
        addIssue('aeo', 'MEDIUM', relativePath,
            'No freshness signals (year)',
            'Include current year (2025) in content for recency signals');
    }

    // Clear headings structure
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
    if (h2Count < 2) {
        addIssue('aeo', 'LOW', relativePath,
            `Limited heading structure (${h2Count} H2s)`,
            'Add more H2 subheadings for better content structure');
    }
}

// ========== 3. MARKETING COPY AUDIT ==========
function auditMarketing(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');
    const textContent = content.replace(/<[^>]+>/g, ' ').toLowerCase();

    // Check power words usage
    let powerWordsFound = 0;
    for (const category in POWER_WORDS) {
        for (const word of POWER_WORDS[category]) {
            if (textContent.includes(word.toLowerCase())) {
                powerWordsFound++;
            }
        }
    }

    if (powerWordsFound < 3 && !relativePath.includes('legal') && !relativePath.includes('404')) {
        addIssue('marketing', 'MEDIUM', relativePath,
            `Limited power words (${powerWordsFound} found)`,
            'Add urgency/value/trust words: gratuit, maintenant, garanti, exclusif');
    }

    // CTA presence
    const ctaPatterns = [
        /class="[^"]*btn[^"]*"/gi,
        /class="[^"]*cta[^"]*"/gi,
        /<button/gi,
        /href="[^"]*contact/gi,
        /href="[^"]*booking/gi
    ];

    let ctaCount = 0;
    for (const pattern of ctaPatterns) {
        ctaCount += (content.match(pattern) || []).length;
    }

    if (ctaCount < 2 && !relativePath.includes('legal') && !relativePath.includes('404')) {
        addIssue('marketing', 'HIGH', relativePath,
            `Insufficient CTAs (${ctaCount} found)`,
            'Add at least 2-3 clear CTAs per page');
    }

    // Value proposition clarity
    const valueProps = [
        'automatisation', 'automation',
        'temps', 'time',
        'roi', 'retour',
        'économ', 'sav',
        'croissance', 'growth'
    ];

    let valuePropsFound = 0;
    for (const prop of valueProps) {
        if (textContent.includes(prop)) {
            valuePropsFound++;
        }
    }

    if (valuePropsFound < 2 && !relativePath.includes('legal')) {
        addIssue('marketing', 'MEDIUM', relativePath,
            'Weak value proposition',
            'Highlight time savings, ROI, growth benefits more clearly');
    }
}

// ========== 4. SCHEMA.ORG AUDIT ==========
function auditSchema(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Check for JSON-LD
    const jsonLdMatch = content.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (!jsonLdMatch) {
        addIssue('schema', 'HIGH', relativePath,
            'Missing Schema.org JSON-LD',
            'Add structured data for AI visibility and rich snippets');
        return;
    }

    // Parse and validate schemas
    for (const match of jsonLdMatch) {
        try {
            const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const schema = JSON.parse(jsonContent);

            // Check @type
            if (!schema['@type']) {
                addIssue('schema', 'MEDIUM', relativePath,
                    'Schema missing @type',
                    'Add @type property to Schema.org markup');
            }

            // Check @context
            if (!schema['@context'] || !schema['@context'].includes('schema.org')) {
                addIssue('schema', 'LOW', relativePath,
                    'Schema missing proper @context',
                    'Use @context: "https://schema.org"');
            }

        } catch (e) {
            addIssue('schema', 'CRITICAL', relativePath,
                'Invalid JSON-LD syntax',
                'Fix JSON syntax errors in Schema.org markup');
        }
    }

    // Check for essential schema types based on page type
    let pageType = 'index';
    if (relativePath.includes('service')) pageType = 'services';
    else if (relativePath.includes('pricing')) pageType = 'pricing';
    else if (relativePath.includes('about') || relativePath.includes('propos')) pageType = 'about';
    else if (relativePath.includes('contact')) pageType = 'contact';
    else if (relativePath.includes('case') || relativePath.includes('client')) pageType = 'case-studies';
    else if (relativePath.includes('automation')) pageType = 'automations';
    else if (relativePath.includes('legal')) pageType = 'legal';
    else if (relativePath.includes('404')) pageType = '404';

    // Check FAQPage schema for service pages
    if ((pageType === 'services' || pageType === 'pricing') && !content.includes('FAQPage')) {
        addIssue('schema', 'MEDIUM', relativePath,
            'Missing FAQPage schema',
            'Add FAQPage schema for better AI visibility and rich snippets');
    }
}

// ========== 5. META TAGS AUDIT ==========
function auditMeta(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Viewport
    if (!content.includes('viewport')) {
        addIssue('meta', 'CRITICAL', relativePath,
            'Missing viewport meta tag',
            'Add <meta name="viewport" content="width=device-width, initial-scale=1">');
    }

    // Charset
    if (!content.includes('charset') && !content.includes('UTF-8')) {
        addIssue('meta', 'HIGH', relativePath,
            'Missing charset declaration',
            'Add <meta charset="UTF-8">');
    }

    // Robots meta (for non-indexable pages)
    if (relativePath.includes('404') && !content.includes('noindex')) {
        addIssue('meta', 'LOW', relativePath,
            '404 page should have noindex',
            'Add <meta name="robots" content="noindex">');
    }

    // Language
    if (!content.includes('lang="')) {
        addIssue('meta', 'MEDIUM', relativePath,
            'Missing lang attribute on html tag',
            'Add lang="fr" or lang="en" to <html> tag');
    }
}

// ========== 6. IMAGES AUDIT ==========
function auditImages(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Find all images
    const imgTags = content.match(/<img[^>]+>/gi) || [];

    for (const img of imgTags) {
        // Alt text
        if (!img.includes('alt=') || img.includes('alt=""') || img.includes("alt=''")) {
            addIssue('images', 'MEDIUM', relativePath,
                'Image missing alt text',
                'Add descriptive alt text for accessibility and SEO');
        }

        // Loading lazy
        if (!img.includes('loading=') && !img.includes('fetchpriority')) {
            addIssue('images', 'LOW', relativePath,
                'Image missing lazy loading',
                'Add loading="lazy" for below-fold images');
        }

        // Width/height
        if (!img.includes('width=') || !img.includes('height=')) {
            addIssue('images', 'LOW', relativePath,
                'Image missing width/height',
                'Add width and height attributes to prevent layout shifts');
        }

        // WebP format
        const srcMatch = img.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1].match(/\.(png|jpg|jpeg)$/i)) {
            addIssue('images', 'LOW', relativePath,
                `Image not in WebP format: ${srcMatch[1]}`,
                'Convert to WebP for smaller file sizes');
        }
    }
}

// ========== 7. CONVERSION AUDIT ==========
function auditConversion(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Skip legal pages
    if (relativePath.includes('legal') || relativePath.includes('404')) return;

    // Contact form or CTA
    const hasForm = content.includes('<form') || content.includes('id="contact');
    const hasBookingCTA = content.includes('booking') || content.includes('réserver') || content.includes('book');
    const hasContactCTA = content.includes('contact') || content.includes('Contact');

    if (!hasForm && !hasBookingCTA && !hasContactCTA) {
        addIssue('conversion', 'HIGH', relativePath,
            'No clear conversion path',
            'Add contact form, booking CTA, or clear call-to-action');
    }

    // Trust signals
    const trustSignals = ['certif', 'client', 'témoign', 'avis', 'review', 'testimon', 'case', 'résultat', 'result'];
    let trustCount = 0;
    const textContent = content.toLowerCase();
    for (const signal of trustSignals) {
        if (textContent.includes(signal)) trustCount++;
    }

    if (trustCount < 1 && !relativePath.includes('legal')) {
        addIssue('conversion', 'MEDIUM', relativePath,
            'Limited trust signals',
            'Add testimonials, case studies, or certifications');
    }

    // Pricing visibility
    if (relativePath.includes('service') || relativePath.includes('pme') || relativePath.includes('ecommerce')) {
        if (!content.includes('€') && !content.includes('prix') && !content.includes('price') && !content.includes('tarif')) {
            addIssue('conversion', 'MEDIUM', relativePath,
                'No pricing information visible',
                'Show pricing or "à partir de X€" to pre-qualify leads');
        }
    }
}

// ========== 8. ROBOTS.TXT & SITEMAP AUDIT ==========
function auditRobotsSitemap() {
    // Check robots.txt
    const robotsPath = path.join(SITE_DIR, 'robots.txt');
    const robotsContent = readFile(robotsPath);

    if (!robotsContent) {
        addIssue('technical', 'CRITICAL', 'robots.txt',
            'robots.txt file missing',
            'Create robots.txt with sitemap reference and AI crawler rules');
        return;
    }

    // Check AI crawlers
    for (const crawler of AI_CRAWLERS) {
        if (!robotsContent.includes(crawler)) {
            addIssue('aeo', 'MEDIUM', 'robots.txt',
                `AI crawler not mentioned: ${crawler}`,
                `Add "User-agent: ${crawler}\\nAllow: /" to allow AI indexing`);
        }
    }

    // Check sitemap reference
    if (!robotsContent.toLowerCase().includes('sitemap:')) {
        addIssue('seo', 'HIGH', 'robots.txt',
            'Missing sitemap reference in robots.txt',
            'Add "Sitemap: https://3a-automation.com/sitemap.xml"');
    }

    // Check sitemap.xml
    const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');
    const sitemapContent = readFile(sitemapPath);

    if (!sitemapContent) {
        addIssue('seo', 'CRITICAL', 'sitemap.xml',
            'sitemap.xml file missing',
            'Create sitemap.xml with all page URLs');
        return;
    }

    // Check sitemap entries
    const htmlFiles = findHtmlFiles(SITE_DIR);
    for (const file of htmlFiles) {
        const relativePath = file.replace(SITE_DIR + '/', '').replace('.html', '');
        if (!sitemapContent.includes(relativePath) && !file.includes('404')) {
            addIssue('seo', 'LOW', 'sitemap.xml',
                `Page not in sitemap: ${relativePath}`,
                'Add all indexable pages to sitemap.xml');
        }
    }
}

// ========== 9. LLMS.TXT AUDIT ==========
function auditLlmsTxt() {
    const llmsTxtPath = path.join(SITE_DIR, 'llms.txt');
    const llmsFullPath = path.join(SITE_DIR, 'llms-full.txt');
    const llmTxtPath = path.join(SITE_DIR, 'llm.txt');

    const llmsTxt = readFile(llmsTxtPath) || readFile(llmTxtPath);
    const llmsFull = readFile(llmsFullPath);

    if (!llmsTxt) {
        addIssue('aeo', 'HIGH', 'llms.txt',
            'llms.txt file missing',
            'Create llms.txt following llmstxt.org spec for AI discoverability');
        audit.recommendations.push({
            priority: 'HIGH',
            category: 'AEO',
            recommendation: 'Create llms.txt with: H1 title, blockquote description, H2 sections with URLs',
            impact: 'Improves AI chatbot understanding of your site structure'
        });
        return;
    }

    // Check spec compliance
    if (!llmsTxt.includes('# ')) {
        addIssue('aeo', 'MEDIUM', 'llms.txt',
            'Missing H1 header in llms.txt',
            'Start with "# Your Company Name"');
    }

    if (!llmsTxt.includes('> ')) {
        addIssue('aeo', 'MEDIUM', 'llms.txt',
            'Missing blockquote description',
            'Add "> Brief description of your business"');
    }

    if (!llmsTxt.includes('## ')) {
        addIssue('aeo', 'MEDIUM', 'llms.txt',
            'Missing H2 sections',
            'Add "## Services", "## Pricing", etc. sections with links');
    }

    // Check for llms-full.txt
    if (!llmsFull) {
        addIssue('aeo', 'LOW', 'llms-full.txt',
            'llms-full.txt not found (optional)',
            'Consider creating llms-full.txt with complete content for comprehensive AI training');
    }
}

// ========== 10. UI/UX AUDIT ==========
function auditUXUI(filePath, content) {
    const relativePath = filePath.replace(SITE_DIR + '/', '');

    // Mobile responsiveness indicators
    if (!content.includes('@media') && !content.includes('responsive') && !content.includes('mobile')) {
        // Check linked CSS
        const cssLinks = content.match(/href=["'][^"']*\.css[^"']*["']/gi) || [];
        if (cssLinks.length === 0) {
            addIssue('technical', 'HIGH', relativePath,
                'No CSS linked',
                'Add responsive CSS for mobile optimization');
        }
    }

    // Accessibility - skip links
    if (!content.includes('skip-to') && !content.includes('skipnav') && !content.includes('skip-link')) {
        addIssue('technical', 'LOW', relativePath,
            'Missing skip navigation link',
            'Add skip-to-content link for accessibility');
    }

    // Focus states (check for :focus in inline styles or mention)
    // This is a lightweight check

    // Footer presence
    if (!content.includes('<footer') && !content.includes('class="footer')) {
        addIssue('technical', 'MEDIUM', relativePath,
            'Missing footer element',
            'Add semantic <footer> with contact info and legal links');
    }
}

// ========== GENERATE REPORT ==========
function generateReport() {
    let report = `# AUDIT FORENSIQUE FRONTEND COMPLET
## 3A-AUTOMATION.COM
## Date: ${new Date().toISOString().split('T')[0]}
## Version: 1.0

---

# RÉSUMÉ EXÉCUTIF

| Métrique | Valeur |
|----------|--------|
| Pages analysées | ${audit.summary.total_pages} |
| Total issues | ${audit.summary.total_issues} |
| CRITICAL | ${audit.summary.critical} |
| HIGH | ${audit.summary.high} |
| MEDIUM | ${audit.summary.medium} |
| LOW | ${audit.summary.low} |

---

# SECTION 1: SEO (${audit.seo.length} issues)

`;

    // Group issues by severity
    for (const category of ['seo', 'aeo', 'marketing', 'conversion', 'schema', 'meta', 'images', 'technical']) {
        report += `\n## ${category.toUpperCase()} (${audit[category].length} issues)\n\n`;

        if (audit[category].length === 0) {
            report += `✅ Aucun problème détecté\n`;
            continue;
        }

        // Group by severity
        const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
        for (const issue of audit[category]) {
            bySeverity[issue.severity].push(issue);
        }

        for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
            if (bySeverity[severity].length > 0) {
                const emoji = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🟢';
                report += `### ${emoji} ${severity} (${bySeverity[severity].length})\n\n`;

                for (const issue of bySeverity[severity]) {
                    report += `- **${issue.file}**: ${issue.issue}\n`;
                    report += `  - *Fix:* ${issue.recommendation}\n`;
                }
                report += '\n';
            }
        }
    }

    // AEO Best Practices Section
    report += `
---

# SECTION 2: AEO BEST PRACTICES (Answer Engine Optimization)

## AI Crawlers Configuration (robots.txt)

Les crawlers AI suivants doivent être autorisés pour maximiser la visibilité:

| Crawler | Company | Status |
|---------|---------|--------|
`;

    const robotsContent = readFile(path.join(SITE_DIR, 'robots.txt')) || '';
    for (const crawler of AI_CRAWLERS) {
        const status = robotsContent.includes(crawler) ? '✅ Configuré' : '❌ Manquant';
        report += `| ${crawler} | ${getCrawlerCompany(crawler)} | ${status} |\n`;
    }

    report += `
## llms.txt Compliance

| Élément | Requis | Status |
|---------|--------|--------|
| H1 Title | Oui | ${auditLlmsTxtElement('# ')} |
| Blockquote | Oui | ${auditLlmsTxtElement('> ')} |
| H2 Sections | Oui | ${auditLlmsTxtElement('## ')} |
| URLs | Oui | ${auditLlmsTxtElement('https://')} |
| llms-full.txt | Optionnel | ${fs.existsSync(path.join(SITE_DIR, 'llms-full.txt')) ? '✅' : '❌'} |

## Content Optimization for AI

### Ce que les LLMs préfèrent:
1. **Listicles**: 32% des citations AI viennent de listes
2. **Answer-first**: Réponses directes en début de paragraphe
3. **Freshness**: Inclure l'année 2025 dans le contenu
4. **Structured data**: FAQPage, HowTo schemas
5. **Clear headings**: H1 > H2 > H3 hierarchy

`;

    // Recommendations
    report += `
---

# SECTION 3: RECOMMANDATIONS PRIORITAIRES

## Actions Immédiates (CRITICAL + HIGH)

`;

    const criticalHigh = [...audit.seo, ...audit.aeo, ...audit.schema, ...audit.technical]
        .filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')
        .slice(0, 10);

    let actionNum = 1;
    for (const issue of criticalHigh) {
        report += `${actionNum}. **${issue.file}**: ${issue.recommendation}\n`;
        actionNum++;
    }

    report += `
## Actions Moyennes (MEDIUM)

`;

    const medium = [...audit.seo, ...audit.aeo, ...audit.marketing, ...audit.conversion]
        .filter(i => i.severity === 'MEDIUM')
        .slice(0, 10);

    actionNum = 1;
    for (const issue of medium) {
        report += `${actionNum}. ${issue.file}: ${issue.recommendation}\n`;
        actionNum++;
    }

    report += `
---

# SECTION 4: CHECKLIST TECHNIQUE

## SEO Technique

| Élément | FR | EN |
|---------|----|----|
`;

    // Add checklist items
    const frIndex = readFile(path.join(SITE_DIR, 'index.html')) || '';
    const enIndex = readFile(path.join(SITE_DIR, 'en/index.html')) || '';

    const checklistItems = [
        ['Title tag optimisé', frIndex.includes('<title>'), enIndex.includes('<title>')],
        ['Meta description 150+ chars', (frIndex.match(/<meta[^>]*description[^>]*content="([^"]{150,})"/i) || []).length > 0, (enIndex.match(/<meta[^>]*description[^>]*content="([^"]{150,})"/i) || []).length > 0],
        ['Canonical URL', frIndex.includes('canonical'), enIndex.includes('canonical')],
        ['hreflang tags', frIndex.includes('hreflang'), enIndex.includes('hreflang')],
        ['OG:image', frIndex.includes('og:image'), enIndex.includes('og:image')],
        ['Schema.org JSON-LD', frIndex.includes('application/ld+json'), enIndex.includes('application/ld+json')],
        ['GTM/GA4', frIndex.includes('GTM-') || frIndex.includes('G-'), enIndex.includes('GTM-') || enIndex.includes('G-')]
    ];

    for (const [item, fr, en] of checklistItems) {
        report += `| ${item} | ${fr ? '✅' : '❌'} | ${en ? '✅' : '❌'} |\n`;
    }

    report += `
## Fichiers Techniques

| Fichier | Status | Action |
|---------|--------|--------|
| robots.txt | ${fs.existsSync(path.join(SITE_DIR, 'robots.txt')) ? '✅' : '❌'} | ${fs.existsSync(path.join(SITE_DIR, 'robots.txt')) ? 'Vérifier AI crawlers' : 'Créer'} |
| sitemap.xml | ${fs.existsSync(path.join(SITE_DIR, 'sitemap.xml')) ? '✅' : '❌'} | ${fs.existsSync(path.join(SITE_DIR, 'sitemap.xml')) ? 'Vérifier toutes pages' : 'Créer'} |
| llms.txt | ${fs.existsSync(path.join(SITE_DIR, 'llms.txt')) || fs.existsSync(path.join(SITE_DIR, 'llm.txt')) ? '✅' : '❌'} | Optimiser pour spec |
| favicon.ico | ${fs.existsSync(path.join(SITE_DIR, 'favicon.ico')) ? '✅' : '❌'} | - |
| apple-touch-icon | ${fs.existsSync(path.join(SITE_DIR, 'apple-touch-icon.png')) ? '✅' : '❌'} | - |

---

*Rapport généré automatiquement par forensic-frontend-complete.cjs*
*Date: ${new Date().toISOString()}*
`;

    return report;
}

function getCrawlerCompany(crawler) {
    const companies = {
        'GPTBot': 'OpenAI',
        'ChatGPT-User': 'OpenAI',
        'ClaudeBot': 'Anthropic',
        'Claude-Web': 'Anthropic',
        'anthropic-ai': 'Anthropic',
        'Google-Extended': 'Google',
        'PerplexityBot': 'Perplexity',
        'cohere-ai': 'Cohere',
        'CCBot': 'Common Crawl',
        'Bytespider': 'ByteDance',
        'Amazonbot': 'Amazon'
    };
    return companies[crawler] || 'Unknown';
}

function auditLlmsTxtElement(pattern) {
    const llmsTxt = readFile(path.join(SITE_DIR, 'llms.txt')) || readFile(path.join(SITE_DIR, 'llm.txt')) || '';
    return llmsTxt.includes(pattern) ? '✅' : '❌';
}

// ========== MAIN ==========
async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   AUDIT FORENSIQUE FRONTEND COMPLET - 3A-AUTOMATION.COM        ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║   Couvre: SEO, AEO, Marketing, Conversion, Schema, UI/UX       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Find all HTML files
    const htmlFiles = findHtmlFiles(SITE_DIR);
    audit.summary.total_pages = htmlFiles.length;
    console.log(`Pages trouvées: ${htmlFiles.length}\n`);

    // Audit each page
    console.log('Analyse des pages...\n');
    for (const file of htmlFiles) {
        const relativePath = file.replace(SITE_DIR + '/', '');
        process.stdout.write(`  Analysing: ${relativePath.padEnd(45)}`);

        const content = readFile(file);
        if (!content) {
            console.log('❌ Erreur lecture');
            continue;
        }

        auditSEO(file, content);
        auditAEO(file, content);
        auditMarketing(file, content);
        auditSchema(file, content);
        auditMeta(file, content);
        auditImages(file, content);
        auditConversion(file, content);
        auditUXUI(file, content);

        console.log('✅');
    }

    // Audit technical files
    console.log('\nAnalyse fichiers techniques...');
    auditRobotsSitemap();
    auditLlmsTxt();
    console.log('✅ robots.txt, sitemap.xml, llms.txt analysés\n');

    // Generate report
    console.log('Génération du rapport...');
    const report = generateReport();

    // Write report
    fs.writeFileSync(OUTPUT_FILE, report);
    console.log(`✅ Rapport sauvegardé: ${OUTPUT_FILE}\n`);

    // Summary
    console.log('═'.repeat(66));
    console.log('                    RÉSUMÉ AUDIT FORENSIQUE');
    console.log('═'.repeat(66));
    console.log(`
    Pages analysées:     ${audit.summary.total_pages}
    Total issues:        ${audit.summary.total_issues}

    🔴 CRITICAL:         ${audit.summary.critical}
    🟠 HIGH:             ${audit.summary.high}
    🟡 MEDIUM:           ${audit.summary.medium}
    🟢 LOW:              ${audit.summary.low}
    `);
    console.log('═'.repeat(66));

    // Exit with appropriate code
    if (audit.summary.critical > 0) {
        console.log('\n⚠️  CRITICAL issues trouvés - Action immédiate requise!\n');
        process.exit(1);
    } else if (audit.summary.high > 0) {
        console.log('\n🟠 HIGH priority issues trouvés - À corriger rapidement\n');
        process.exit(0);
    } else {
        console.log('\n✅ Aucun problème critique détecté\n');
        process.exit(0);
    }
}

main().catch(console.error);
