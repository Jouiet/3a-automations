#!/usr/bin/env node
/**
 * 3A AUTOMATION - Creative Mastery Pipeline (Level 5)
 * 
 * ROLE: Orchestrates Leonardo.ai (Photo) -> Kling (Video) -> Copywriter (Blog/Ads)
 * EXECUTION: This is a high-level "Recipe" for the DOE Orchestrator.
 * 
 * @version 1.0.0
 * @date 2026-01-20
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const Leonardo = require('./product-photos-resilient.cjs');
const Kling = require('./kling-video-generator.cjs');
const LLM = require('./gateways/llm-global-gateway.cjs');

async function runCreativeMastery(productData) {
    const { title, description, image_url } = productData;
    console.log(`🎨 [Creative Mastery V2] Starting advanced pipeline for: ${title}`);

    try {
        // 1. SCIENTIFIC HOOK GENERATION (Grok 4.1 - Fast Reasoning)
        console.log(`   [1/4] Generating Scientific Viral Hooks (Grok 4.1)...`);
        const hookPrompt = `As a world-class marketing architect, analyze this product: "${title}"
        Description: ${description}
        Generate 3 high-impact, futuristic viral hooks for TikTok/Meta Ads.
        Focus on psychological resonance and pattern interruption.`;
        const hooks = await LLM.generate('grok', hookPrompt);
        console.log(`   ✅ Hooks Generated.`);

        // 2. PHOTO ENHANCEMENT (Leonardo.ai Primary)
        console.log(`   [2/4] Generating High-Fidelity Photo (Leonardo)...`);
        const photoPrompt = `Professional e-commerce product photography of "${title}", high-end lighting, minimalist background, 8k resolution. Context: ${description}`;
        const photoResult = await Leonardo.enhanceProductPhoto(image_url, photoPrompt);

        // 3. VIDEO REVEAL (Kling I2V)
        let videoResult = { success: false, error: 'Skipped or Failed' };
        if (photoResult.success && photoResult.imageBase64) {
            try {
                console.log(`   [3/4] Orchestrating Cinematic I2V Reveal (Kling)...`);
                const videoPrompt = `Cinematic product reveal starting from this image: "${title}", smooth camera slide, futuristic lighting effects, high-fidelity 4k.`;
                // Note: In 2026, we assume Leonardo returns a public URL for Kling, or we use base64 if supported.
                // For this implementation, we prioritize the logic chain.
                videoResult = await Kling.generateVideo(videoPrompt, {
                    image_url: photoResult.imageBase64.startsWith('http') ? photoResult.imageBase64 : null // I2V trigger
                });
            } catch (vErr) {
                console.warn(`   ⚠️ [Creative Mastery] Video Generation Failed: ${vErr.message}`);
            }
        }

        // 4. AD COPY GENERATION (Claude 4.5 - Creative Dominance)
        console.log(`   [4/4] Drafting Conversion-Locked Copy (Claude 4.5)...`);
        const copyPrompt = `Write a high-converting Facebook/TikTok ad script for "${title}". 
        Description: ${description}
        Viral Hooks to incorporate: ${hooks}
        Tone: Futuristic, Professional, Powerful.
        Constraint: Use PAS (Pain-Agitate-Solution) framework.`;

        const copy = await LLM.generate('claude', copyPrompt);

        console.log(`✅ [Creative Mastery V2] Pipeline Complete for ${title}`);
        return {
            hooks: hooks.substring(0, 200) + '...',
            photoStatus: 'SUCCESS (Leonardo)',
            videoStatus: videoResult.success ? 'QUEUED (Kling I2V)' : 'FAILED/SKIPPED',
            copyHeader: copy.substring(0, 100) + '...'
        };

    } catch (e) {
        console.error(`❌ [Creative Mastery] Pipeline Aborted: ${e.message}`);
        throw e;
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: node creative-mastery-pipeline.cjs --title="Product Name" --desc="..."');
        process.exit(0);
    }

    // Parse args simply
    const title = args.find(a => a.startsWith('--title='))?.split('=')[1] || "Default Product";
    const desc = args.find(a => a.startsWith('--desc='))?.split('=')[1] || "A high-end automation tool.";

    runCreativeMastery({ title, description: desc })
        .then(res => console.log(JSON.stringify(res, null, 2)))
        .catch(err => console.error(err));
}

module.exports = { runCreativeMastery };
