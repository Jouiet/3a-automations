// automations/gateway/generate-asset.js
const AssetFactory = require('./AssetFactory');
const chalk = require('chalk');

// CLI Wrapper for N8N
// Usage: node generate-asset.js --type=text --prompt="Hello" --context="Marketing"
// Usage: node generate-asset.js --type=image --quality=pro --prompt="A futuristic shoe"
// Usage: node generate-asset.js --type=video --image="gs://..." --prompt="Rotate 360"

const args = process.argv.slice(2);
const getArg = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

async function main() {
    const type = getArg('type');
    const prompt = getArg('prompt');
    const quality = getArg('quality'); // 'fast' or 'pro'
    const imageInput = getArg('image');
    
    // In production, Project ID should come from env
    const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID || 'demo-project');

    try {
        let result;

        if (!type || !prompt) {
            throw new Error('Missing required arguments: --type and --prompt are mandatory.');
        }

        switch (type) {
            case 'text':
                result = await factory.generateText(prompt, getArg('context'));
                break;
            case 'image':
                result = await factory.generateImage(prompt, quality);
                break;
            case 'video':
                if (!imageInput) throw new Error('Video generation requires --image input.');
                result = await factory.generateVideo(imageInput, prompt);
                break;
            default:
                throw new Error(`Unknown asset type: ${type}`);
        }

        // Output Result as JSON for N8N to parse
        console.log(JSON.stringify({ success: true, data: result }));

    } catch (error) {
        console.error(JSON.stringify({ success: false, error: error.message }));
        process.exit(1);
    }
}

main();
