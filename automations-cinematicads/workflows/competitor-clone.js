// automations/workflows/competitor-clone.js
// VERSION 2.0 - Updated December 2025
const path = require('path');
const AssetFactory = require('../gateway/AssetFactory');
const PlaywrightClient = require('../core/PlaywrightClient'); // Replaced FirecrawlClient
const PostProcessor = require('../core/PostProcessor');
const DatabaseClient = require('../core/DatabaseClient');
const PROMPTS = require('../config/prompts');
const Logger = require('../core/Logger');
const chalk = require('chalk');

// Workflow A: Competitor Clone (Final Hardened Logic)
const args = process.argv.slice(2);
const getArg = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

async function main() {
    const logger = new Logger('Workflow-Clone');
    logger.info('=== WORKFLOW A: COMPETITOR CLONE START ===');
    
    const targetUrl = getArg('url');
    const brandName = getArg('brand') || 'Generic Brand';
    const userId = getArg('user_id'); // From SaaS

    if (!targetUrl) {
        logger.error('Error: --url is required');
        process.exit(1);
    }

    const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID);
    const db = new DatabaseClient();
    const processor = new PostProcessor();

    let projectId;

    try {
        // 0. DB INITIALIZATION
        if (userId) {
            const project = await db.logProject(userId, 'clone', { url: targetUrl, brand: brandName });
            projectId = project.id;
        }

        // 1. INGEST
        logger.info(`--- STEP 1: INGESTION [Target: ${targetUrl}] ---`);
        
        // 2. ANALYZE
        logger.info('--- STEP 2: ANALYSIS (GEMINI 3 PRO) ---');
        const analysisPrompt = `${PROMPTS.VIDEO_ANALYSIS_SYSTEM}\n\nVIDEO URL TO ANALYZE: ${targetUrl}`;
        const analysisRaw = await factory.generateText(analysisPrompt, "Detailed ad reverse-engineering.");
        
        const cleanJson = analysisRaw.replace(/```json/g, '').replace(/```/g, '');
        const analysisJson = JSON.parse(cleanJson);
        logger.success('Analysis Received and Parsed.');

        // 3. SYNTHESIZE
        logger.info('--- STEP 3: SCRIPT SYNTHESIS ---');
        const synthesisContext = `COMPETITOR ANALYSIS: ${JSON.stringify(analysisJson)}\nBRAND PROFILE: ${brandName}`;
        const script = await factory.generateText(PROMPTS.SCRIPT_SYNTHESIS_SYSTEM, synthesisContext);
        logger.success('Script Generated.');
        
        // 4. VISUALIZATION & ANIMATION (LOOP PER SCENE)
        logger.info('--- STEP 4: PRODUCTION LOOP ---');
        
        // Let's assume the script has 3 scenes for this forensic implementation
        const scenes = [1, 2, 3];
        const generatedClips = [];
        let styleAnchorPath = null;

        for (const sceneId of scenes) {
            logger.info(`Processing SCENE ${sceneId}...`);
            
            // 4.1. Extract Prompt for this scene
            const scenePrompt = await factory.generateText(
                `Extract the visual description for SCENE ${sceneId} from this script. Return ONLY the prompt for an image generator.`, 
                script
            );

            // 4.2. Generate Image (Style Anchor for Scene 1)
            const imagePath = await factory.generateImage(scenePrompt, 'pro');
            
            if (sceneId === 1) {
                styleAnchorPath = imagePath;
                logger.info('Style Anchor established from Scene 1.');
            }

            // 4.3. Generate Video (Using Style Anchor)
            const videoPath = await factory.generateVideo(styleAnchorPath, `Animate this scene: ${scenePrompt}. Maintain consistent style with the anchor image.`);
            
            // 4.4. Agentic Review
            const review = await factory.reviewAsset(videoPath, "Cinematic quality, motion smoothness, brand alignment.");
            
            if (!review.passed) {
                logger.warn(`Scene ${sceneId} failed review. Feedback: ${review.feedback}. Retrying once...`);
                // Simple retry logic for forensic robustness
                const retriedVideoPath = await factory.generateVideo(styleAnchorPath, `RETRY: ${scenePrompt}. Fix: ${review.feedback}`);
                generatedClips.push(retriedVideoPath);
            } else {
                generatedClips.push(videoPath);
            }
        }

        // 5. POST-PRODUCTION (LOGO OVERLAY)
        logger.info('--- STEP 5: POST-PRODUCTION ---');
        const finalClips = [];
        const logoPath = path.join(__dirname, '../../knowledge-base/logo.png'); // Hypothetical path

        for (const clip of generatedClips) {
            const finalPath = await processor.overlayLogo(clip, logoPath);
            finalClips.push(finalPath);
        }

        // 6. DB UPDATE
        if (projectId) {
            await db.updateProjectStatus(projectId, 'done', { clips: finalClips, script });
        }

        logger.success('=== WORKFLOW A COMPLETE ===');

    } catch (error) {
        logger.error(`Workflow Failed: ${error.message}`);
        if (projectId) await db.updateProjectStatus(projectId, 'error');
        process.exit(1);
    }
}

main();
