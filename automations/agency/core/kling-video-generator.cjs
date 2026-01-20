#!/usr/bin/env node
/**
 * Kling Video AI Generator - Agentic Orchestrator
 * 
 * ROLE: Autonomously generate high-fidelity marketing videos for e-commerce products.
 * API: Kling AI Global API (verified Jan 2026)
 * MODELS: Kling 2.6 (T2V Pro, I2V Pro)
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const CONFIG = {
    API_URL: 'https://api.klingai.com/v1/videos/generations',
    API_KEY: process.env.KLING_API_KEY,
    MODEL: 'kling-2.6-t2v-pro',
    WEBHOOK_URL: process.env.KLING_WEBHOOK_URL || 'https://3a-automation.com/api/kling-callback'
};

async function generateVideo(prompt, options = {}) {
    console.log(`🎬 [Kling] Orchestrating Video Generation: "${prompt.substring(0, 50)}..."`);

    if (!CONFIG.API_KEY) {
        throw new Error('KLING_API_KEY missing in .env');
    }

    const body = {
        model: CONFIG.MODEL,
        prompt: prompt,
        negative_prompt: options.negative_prompt || "blurry, low quality, distorted, watermark",
        ratio: options.ratio || "16:9",
        duration: options.duration || 5, // 5 seconds default
        callback_url: CONFIG.WEBHOOK_URL
    };

    if (options.image_url) {
        body.model = 'kling-2.6-i2v-pro';
        body.image_url = options.image_url;
    }

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Kling API Failure: ${data.message || response.statusText}`);
        }

        console.log(`✅ [Kling] Generation queued. Request ID: ${data.request_id}`);
        return {
            success: true,
            request_id: data.request_id,
            status: data.status,
            eta: data.eta_seconds || 120
        };

    } catch (e) {
        console.error(`❌ [Kling] Orchestration failed: ${e.message}`);
        return { success: false, error: e.message };
    }
}

/**
 * Polling method for local execution verification
 */
async function checkStatus(requestId) {
    const url = `https://api.klingai.com/v1/videos/generations/${requestId}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${CONFIG.API_KEY}` }
    });
    return await response.json();
}

async function main() {
    const args = process.argv.slice(2);
    const prompt = args.find(a => !a.startsWith('--')) || "Cinematic product showcase for high-end automation software, futuristic neon lights, smooth 4k drone shot.";

    if (args.includes('--dry-run')) {
        console.log(`[Dry Run] Kling Request: ${prompt}`);
        return;
    }

    const result = await generateVideo(prompt);
    console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { generateVideo, checkStatus };
