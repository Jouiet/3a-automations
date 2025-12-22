// automations/workflows/cinematic-director.js
const AssetFactory = require('../gateway/AssetFactory');
const PROMPTS = require('../config/prompts');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Workflow C: Cinematic Director (Production Logic)
const args = process.argv.slice(2);
const getArg = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

async function main() {
    console.log(chalk.bold.magenta('=== WORKFLOW C: CINEMATIC DIRECTOR START ==='));

    const concept = getArg('concept');
    if (!concept) {
        console.error(chalk.red('Error: --concept is required'));
        process.exit(1);
    }

    const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID);

    try {
        // 1. ART DIRECTION (REAL CALL)
        console.log(chalk.cyan('--- STEP 1: ART DIRECTION (GEMINI 3 PRO) ---'));
        
        const visualDescription = await factory.generateText(PROMPTS.CINEMATIC_ARCHITECT_SYSTEM, concept);
        
        console.log(chalk.green('[AI] Visual Blueprint Created:'));
        console.log(chalk.italic.white(visualDescription));

        // 2. FOUNDATION ASSET (REAL CALL)
        console.log(chalk.cyan('--- STEP 2: GENERATING FOUNDATION IMAGE ---'));
        
        const foundationImagePath = await factory.generateImage(visualDescription, 'pro'); // Gemini 3 Pro Image
        console.log(chalk.green(`[AI] Foundation Image saved to: ${foundationImagePath}`));

        // 3. ANIMATION (VEO 3.1) - Now actually implemented in the script
        console.log(chalk.cyan('--- STEP 3: ANIMATION (VEO 3.1) ---'));
        const videoPath = await factory.generateVideo(foundationImagePath, "Slow cinematic dolly zoom into the scene.");

        // 4. AGENTIC REVIEW
        console.log(chalk.cyan('--- STEP 4: AGENTIC QUALITY CONTROL ---'));
        const review = await factory.reviewAsset(videoPath, "High cinematic fidelity, realistic textures, smooth motion.");
        
        if (!review.passed) {
            console.log(chalk.yellow(`[WARN] Quality Check Failed: ${review.feedback}. Retrying...`));
            // One-shot corrective retry
            await factory.generateVideo(foundationImagePath, `FIX: ${review.feedback}`);
        }

        // 5. EXPORT
        const styleConfig = {
            project: `Cinematic_${Date.now()}`,
            foundation_image: foundationImagePath,
            final_video: videoPath,
            visual_prompt: visualDescription,
            review_score: review.score,
            generated_at: new Date().toISOString(),
            status: "DONE"
        };

        const outputDir = path.join(__dirname, '../../data/output/cinematic');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        const configPath = path.join(outputDir, 'style_reference.json');
        fs.writeFileSync(configPath, JSON.stringify(styleConfig, null, 2));

        console.log(chalk.green(`[SUCCESS] Style Reference exported to ${configPath}`));

    } catch (error) {
        console.error(chalk.red('Workflow Failed:'), error.message);
        process.exit(1);
    }
}

main();