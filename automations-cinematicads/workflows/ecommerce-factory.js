// automations/workflows/ecommerce-factory.js
// VERSION 2.0 - Updated December 2025
// Replaced FirecrawlClient with PlaywrightClient (free, with Puppeteer fallback)
const AssetFactory = require('../gateway/AssetFactory');
const PlaywrightClient = require('../core/PlaywrightClient');
const DatabaseClient = require('../core/DatabaseClient');
const PROMPTS = require('../config/prompts');
const Logger = require('../core/Logger');
const chalk = require('chalk');

// Workflow B: E-Commerce & Google Ads Factory (Production Ready)
const args = process.argv.slice(2);
const getArg = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

async function main() {
    const logger = new Logger('Workflow-Factory');
    logger.info('=== WORKFLOW B: MULTI-PLATFORM FACTORY START ===');

    const productUrl = getArg('url');
    const userId = getArg('user_id');

    if (!productUrl) {
        logger.error('Error: --url is required');
        process.exit(1);
    }

    const scraper = new PlaywrightClient(); // Replaces FirecrawlClient (free vs paid)
    const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID);
    const db = new DatabaseClient();

    let projectId;

    try {
        if (userId) {
            const project = await db.logProject(userId, 'ecommerce', { url: productUrl });
            projectId = project.id;
        }

        // 1. SCRAPE
        logger.info(`--- STEP 1: SCRAPING PRODUCT DATA ---`);
        const scrapeResult = await scraper.scrape(productUrl);
        const productData = {
            name: scrapeResult.metadata?.title || "Product",
            image: scrapeResult.metadata?.ogImage 
        };
        if (!productData.image) throw new Error("Product Image extraction failed.");

        // 2. MULTI-RATIO PRODUCTION (Google Ads + Social)
        logger.info(`--- STEP 2: GENERATING MULTI-RATIO ASSETS ---`);
        const assets = [];
        const targets = PROMPTS.GOOGLE_ADS_CONFIG.ratios; // ["1.91:1", "1:1", "9:16"]

        for (const ratio of targets) {
            logger.info(`Producing format: ${ratio}...`);
            const prompt = PROMPTS.IMAGE_FUSION_PROMPT(productData.name, "Studio lifestyle", ratio);
            
            // Generate Static Asset
            const imagePath = await factory.generateImage(prompt, 'fast', ratio);
            
            // For 9:16, automatically trigger a Video version (TikTok/Shorts)
            let videoPath = null;
            if (ratio === "9:16") {
                logger.info(`Generating Video version for 9:16...`);
                const motionPrompt = PROMPTS.MICRO_MOVEMENT_PROMPTS[0];
                videoPath = await factory.generateVideo(imagePath, motionPrompt);
            }

            assets.push({ ratio, image: imagePath, video: videoPath });
        }

        // 3. FINAL REPORT & DB LOG
        if (projectId) {
            await db.updateProjectStatus(projectId, 'done', { assets });
        }

        logger.success('=== FACTORY PACK COMPLETE ===');
        console.log(JSON.stringify({ 
            success: true, 
            product: productData.name,
            formats_generated: assets.length,
            pack: assets 
        }, null, 2));

    } catch (error) {
        logger.error(`Workflow Failed: ${error.message}`);
        if (projectId) await db.updateProjectStatus(projectId, 'error');
        process.exit(1);
    }
}

main();