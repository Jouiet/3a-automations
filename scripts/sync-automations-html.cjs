#!/usr/bin/env node
/**
 * SYNC AUTOMATIONS HTML - Registry to HTML Cards
 * Regenerates automation cards on FR and EN pages from registry.json
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = '/Users/mac/Desktop/JO-AAA/automations/automations-registry.json';
const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Category colors for visual distinction
const CATEGORY_COLORS = {
    'lead-gen': '#00d4ff',
    'seo': '#00ff88',
    'email': '#ff6b6b',
    'shopify': '#95bf47',
    'analytics': '#f39c12',
    'content': '#9b59b6',
    'cinematicads': '#ff00ff'
};

// Brief descriptions for automations (FR)
const DESCRIPTIONS_FR = {
    'meta-leads-sync': 'Vos leads Facebook/Instagram sont automatiquement ajoutés comme clients Shopify.',
    'google-ads-sync': 'Les prospects Google Ads deviennent automatiquement des clients dans votre boutique.',
    'tiktok-leads-sync': 'Capturez automatiquement les prospects TikTok sans intervention manuelle.',
    'lead-scoring': 'Chaque lead reçoit un score de 0 à 100. Les meilleurs sont traités en priorité.',
    'hot-warm-cold': 'Vos leads sont triés automatiquement par niveau d\'intérêt pour des actions ciblées.',
    'data-enrichment': 'Enrichissement automatique des données prospects via Apollo.io.',
    'geo-segmentation': 'Segmentez vos contacts par région pour des messages personnalisés.',
    'google-forms-crm': 'Les réponses Google Forms sont automatiquement ajoutées à votre CRM.',
    'typeform-klaviyo': 'Les quiz Typeform alimentent directement votre liste email Klaviyo.',
    'sourcing-google-maps': 'Extraction automatique de prospects locaux depuis Google Maps.',
    'sourcing-linkedin': 'Construction de bases prospects B2B depuis LinkedIn.',
    'veille-recrutement': 'Identifiez les entreprises qui recrutent pour timing parfait.',
    'alt-text-fix': 'Correction automatique des textes alternatifs manquants sur vos images.',
    'auto-meta-tags': 'Génération automatique de meta tags optimisés pour le SEO.',
    'image-sitemap': 'Création automatique d\'un sitemap images pour Google.',
    'schema-products': 'Ajout automatique des données structurées Schema.org sur vos produits.',
    'internal-linking': 'Amélioration du maillage interne pour meilleur SEO.',
    'llms-txt': 'Fichier llms.txt pour visibilité dans les moteurs IA (ChatGPT, Claude, etc.).',
    'welcome-series': 'Série de 5 emails automatiques pour accueillir vos nouveaux inscrits.',
    'abandoned-cart': 'Récupération automatique des paniers abandonnés par email.',
    'browse-abandonment': 'Relance des visiteurs qui ont consulté sans acheter.',
    'post-purchase': 'Série post-achat pour fidéliser et générer des reviews.',
    'win-back': 'Réactivation des clients inactifs par séquence email.',
    'vip-tiers': 'Segmentation VIP automatique basée sur la valeur client.',
    'flows-audit': 'Audit complet de vos flows Klaviyo avec recommandations.',
    'ab-sender-rotation': 'Rotation automatique des expéditeurs pour meilleure délivrabilité.',
    'product-enrichment': 'Enrichissement automatique des fiches produits avec IA.',
    'shopping-attributes': 'Configuration automatique des attributs Google Shopping.',
    'collection-management': 'Organisation automatique des collections Shopify.',
    'legal-pages': 'Génération des pages légales conformes RGPD.',
    'gtm-installation': 'Installation et configuration de Google Tag Manager.',
    'loyalty-webhooks': 'Webhooks pour intégration programme de fidélité.',
    'store-audit': 'Audit complet de votre boutique Shopify.',
    'facebook-audiences': 'Export automatique vers Facebook Custom Audiences.',
    'google-taxonomy': 'Import de la taxonomie Google pour conformité GMC.',
    'looker-dashboard': 'Dashboard Looker Studio personnalisé pour vision 360°.',
    'ga4-source-report': 'Rapport automatique des sources de trafic GA4.',
    'system-audit': 'Audit complet du système automation (Flywheel 360).',
    'low-stock-alert': 'Alertes automatiques en cas de stock bas.',
    'margin-projections': 'Projections automatiques des marges et rentabilité.',
    'inventory-analysis': 'Analyse automatique de la rotation des stocks.',
    'bnpl-tracking': 'Suivi des performances Buy Now Pay Later.',
    'pixel-verification': 'Vérification automatique de la configuration des pixels.',
    'promo-video': 'Génération automatique de vidéos promo produits.',
    'cart-recovery-video': 'Vidéos personnalisées pour récupération panier.',
    'portrait-video': 'Conversion automatique en format portrait (9:16).',
    'shopping-feed': 'Synchronisation automatique du feed Google Shopping.',
    'gmc-diagnostic': 'Diagnostic automatique des problèmes Google Merchant Center.',
    'auto-blog': 'Génération automatique d\'articles de blog SEO.',
    'deprecated-workflow': 'Workflows personnalisés sur mesure (Node.js natif).',
    'cinematic-director': 'Création de vidéos cinématiques avec Gemini 3 Pro + Imagen 4 + Veo 3.1. Direction artistique IA, style anchor, quality control automatique.',
    'competitor-clone': 'Analysez une pub concurrente, générez un script adapté à votre marque, production multi-scènes automatisée avec style cohérent.',
    'ecommerce-factory': 'Production automatique d\'assets publicitaires multi-format: Google Ads (1.91:1), Social (1:1), TikTok/Shorts (9:16) avec vidéo auto.',
    'asset-factory': 'Moteur central CinematicAds: dual provider Vertex AI (Imagen 4, Veo 3.1) + xAI Grok 4.1 pour texte, image, vidéo.'
};

// Brief descriptions for automations (EN)
const DESCRIPTIONS_EN = {
    'meta-leads-sync': 'Your Facebook/Instagram leads are automatically added as Shopify customers.',
    'google-ads-sync': 'Google Ads prospects automatically become customers in your store.',
    'tiktok-leads-sync': 'Automatically capture TikTok prospects without manual intervention.',
    'lead-scoring': 'Each lead gets a score from 0 to 100. Best ones are prioritized.',
    'hot-warm-cold': 'Your leads are automatically sorted by interest level for targeted actions.',
    'data-enrichment': 'Automatic prospect data enrichment via Apollo.io.',
    'geo-segmentation': 'Segment your contacts by region for personalized messaging.',
    'google-forms-crm': 'Google Forms responses are automatically added to your CRM.',
    'typeform-klaviyo': 'Typeform quizzes directly feed your Klaviyo email list.',
    'sourcing-google-maps': 'Automatic local prospect extraction from Google Maps.',
    'sourcing-linkedin': 'B2B prospect database building from LinkedIn.',
    'veille-recrutement': 'Identify hiring companies for perfect timing.',
    'alt-text-fix': 'Automatic correction of missing alt text on your images.',
    'auto-meta-tags': 'Automatic generation of SEO-optimized meta tags.',
    'image-sitemap': 'Automatic image sitemap creation for Google.',
    'schema-products': 'Automatic Schema.org structured data on your products.',
    'internal-linking': 'Internal linking improvement for better SEO.',
    'llms-txt': 'llms.txt file for AI search engine visibility (ChatGPT, Claude, etc.).',
    'welcome-series': '5 automatic emails to welcome your new subscribers.',
    'abandoned-cart': 'Automatic abandoned cart recovery by email.',
    'browse-abandonment': 'Re-engage visitors who browsed without buying.',
    'post-purchase': 'Post-purchase series to retain and generate reviews.',
    'win-back': 'Reactivation of inactive customers by email sequence.',
    'vip-tiers': 'Automatic VIP segmentation based on customer value.',
    'flows-audit': 'Complete audit of your Klaviyo flows with recommendations.',
    'ab-sender-rotation': 'Automatic sender rotation for better deliverability.',
    'product-enrichment': 'Automatic product page enrichment with AI.',
    'shopping-attributes': 'Automatic Google Shopping attributes configuration.',
    'collection-management': 'Automatic Shopify collections organization.',
    'legal-pages': 'Generation of GDPR-compliant legal pages.',
    'gtm-installation': 'Google Tag Manager installation and configuration.',
    'loyalty-webhooks': 'Webhooks for loyalty program integration.',
    'store-audit': 'Complete audit of your Shopify store.',
    'facebook-audiences': 'Automatic export to Facebook Custom Audiences.',
    'google-taxonomy': 'Google taxonomy import for GMC compliance.',
    'looker-dashboard': 'Custom Looker Studio dashboard for 360° view.',
    'ga4-source-report': 'Automatic GA4 traffic source report.',
    'system-audit': 'Complete automation system audit (Flywheel 360).',
    'low-stock-alert': 'Automatic alerts for low stock.',
    'margin-projections': 'Automatic margin and profitability projections.',
    'inventory-analysis': 'Automatic stock rotation analysis.',
    'bnpl-tracking': 'Buy Now Pay Later performance tracking.',
    'pixel-verification': 'Automatic pixel configuration verification.',
    'promo-video': 'Automatic product promo video generation.',
    'cart-recovery-video': 'Personalized videos for cart recovery.',
    'portrait-video': 'Automatic portrait format (9:16) conversion.',
    'shopping-feed': 'Automatic Google Shopping feed synchronization.',
    'gmc-diagnostic': 'Automatic Google Merchant Center issue diagnostic.',
    'auto-blog': 'Automatic SEO blog article generation.',
    'deprecated-workflow': 'Custom Node.js workflows made to measure.',
    'cinematic-director': 'Create cinematic videos with Gemini 3 Pro + Imagen 4 + Veo 3.1. AI art direction, style anchor, automatic quality control.',
    'competitor-clone': 'Analyze a competitor ad, generate a script adapted to your brand, automated multi-scene production with consistent style.',
    'ecommerce-factory': 'Automatic multi-format ad asset production: Google Ads (1.91:1), Social (1:1), TikTok/Shorts (9:16) with auto video.',
    'asset-factory': 'CinematicAds core engine: dual provider Vertex AI (Imagen 4, Veo 3.1) + xAI Grok 4.1 for text, image, video.'
};

function generateCard(automation, lang) {
    const descriptions = lang === 'fr' ? DESCRIPTIONS_FR : DESCRIPTIONS_EN;
    const name = lang === 'fr' ? automation.name_fr : automation.name_en;
    const freq = lang === 'fr' ? automation.frequency_fr : automation.frequency_en;
    const benefit = lang === 'fr' ? automation.benefit_fr : automation.benefit_en;
    const description = descriptions[automation.id] || (lang === 'fr' ? 'Automatisation efficace' : 'Efficient automation');

    // Add special class for CinematicAds
    const specialClass = automation.category === 'cinematicads' ? ' cinematicads-card' : '';

    return `          <div class="automation-card${specialClass}">
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="automation-meta">
              <span class="freq">${freq}</span>
              <span class="benefit">${benefit}</span>
            </div>
          </div>`;
}

function generateAllCards(automations, lang) {
    return automations.map(a => generateCard(a, lang)).join('\n\n');
}

function updateHtmlPage(filePath, newCardsHtml) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Find and replace the automations-grid content
    const gridStartRegex = /<div class="automations-grid">/;
    const gridEndRegex = /<\/div>\s*<\/section>/;

    const gridStartMatch = content.match(gridStartRegex);
    if (!gridStartMatch) {
        console.error(`❌ Could not find automations-grid in ${filePath}`);
        return false;
    }

    // Find the start position
    const startIdx = content.indexOf(gridStartMatch[0]);
    const afterStart = content.substring(startIdx + gridStartMatch[0].length);

    // Count nested divs to find the correct closing
    let depth = 1;
    let endIdx = 0;
    for (let i = 0; i < afterStart.length; i++) {
        if (afterStart.substring(i, i + 5) === '<div ') depth++;
        if (afterStart.substring(i, i + 6) === '</div>') {
            depth--;
            if (depth === 0) {
                endIdx = startIdx + gridStartMatch[0].length + i;
                break;
            }
        }
    }

    // Build new content
    const before = content.substring(0, startIdx + gridStartMatch[0].length);
    const after = content.substring(endIdx);

    const newContent = before + '\n' + newCardsHtml + '\n        ' + after;

    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
}

function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     SYNC AUTOMATIONS HTML - Registry to HTML Cards             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Load registry
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    console.log(`📦 Registry loaded: ${registry.totalCount} automations\n`);

    // Generate FR cards
    console.log('🇫🇷 Generating French cards...');
    const frCards = generateAllCards(registry.automations, 'fr');
    const frPath = path.join(SITE_DIR, 'automations.html');
    if (updateHtmlPage(frPath, frCards)) {
        console.log(`✅ FR page updated: ${frPath}`);
    }

    // Generate EN cards
    console.log('🇬🇧 Generating English cards...');
    const enCards = generateAllCards(registry.automations, 'en');
    const enPath = path.join(SITE_DIR, 'en/automations.html');
    if (updateHtmlPage(enPath, enCards)) {
        console.log(`✅ EN page updated: ${enPath}`);
    }

    // Verify counts
    const frCount = (frCards.match(/automation-card/g) || []).length;
    const enCount = (enCards.match(/automation-card/g) || []).length;

    console.log('\n' + '═'.repeat(50));
    console.log(`Registry: ${registry.totalCount} automations`);
    console.log(`FR cards: ${frCount}`);
    console.log(`EN cards: ${enCount}`);
    console.log('═'.repeat(50));

    if (frCount === registry.totalCount && enCount === registry.totalCount) {
        console.log('\n✅ All cards synced successfully!');
    } else {
        console.log('\n⚠️ Card count mismatch!');
    }
}

main();
