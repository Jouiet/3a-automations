// automations/gateway/AssetFactory.js
// VERSION: 2.0.0 - STATE OF THE ART December 2025
// DUAL-PROVIDER: Vertex AI (Google) | xAI (Grok)
// MCP: Uses Claude Code native MCPs (no custom MCPHub needed)

const { VertexAI } = require('@google-cloud/vertexai');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const Logger = require('../core/Logger');

// Optional xAI client (when XAI_API_KEY is set)
let xaiClient = null;
try {
    const { Grok } = require('xai-sdk');
    xaiClient = Grok;
} catch (e) {
    // xai-sdk not installed, Vertex AI only
}

class AssetFactory {
    constructor(projectId, location = 'us-central1') {
        this.logger = new Logger('AssetFactory');

        // AI Provider selection: 'vertex_ai' | 'grok' | 'both' (A/B testing)
        this.aiProvider = process.env.AI_PROVIDER || 'vertex_ai';

        // Vertex AI setup
        if (!projectId && this.aiProvider !== 'grok') {
            this.logger.warn('No GOOGLE_PROJECT_ID provided. Vertex AI calls will fail.');
        }

        this.project = projectId;
        this.location = location;

        if (projectId) {
            this.vertexAI = new VertexAI({ project: projectId, location: location });
        }

        this.ttsClient = new textToSpeech.TextToSpeechClient();

        // xAI Grok setup
        this.xaiApiKey = process.env.XAI_API_KEY;
        if (this.xaiApiKey && xaiClient) {
            this.grok = new xaiClient({ apiKey: this.xaiApiKey });
            this.logger.info('xAI Grok initialized (dual-provider mode available)');
        }

        // STATE OF THE ART Model Registry - December 2025
        this.models = {
            // Vertex AI (Google Cloud)
            vertex: {
                text: 'gemini-2.0-flash-exp',           // Latest Gemini
                image: 'imagen-3.0-generate-001',       // Imagen 3 ($0.04/img)
                video: 'veo-002'                        // Veo 2 (production)
            },
            // xAI Grok (#1 LMArena - 1483 Elo)
            grok: {
                text: 'grok-2-latest',                  // Grok 2 latest
                image: 'grok-2-image-1212',             // Grok Image ($0.07/img)
                voice: 'grok-2-audio'                   // Grok Voice ($0.05/min)
            }
        };
    }

    /**
     * Initializes the factory (no MCP Hub needed - Claude Code manages MCPs natively)
     * MCPs available: chrome-devtools, playwright, github, hostinger, klaviyo, etc.
     */
    async initialize() {
        this.logger.info(`AssetFactory v2.0 initialized [Provider: ${this.aiProvider}]`);
        this.logger.info('MCPs: Use Claude Code native MCPs (no MCPHub required)');
    }

    /**
     * Generates text using configured provider (Vertex AI or xAI Grok)
     * @param {string} prompt - The prompt to generate from
     * @param {string} context - Additional context
     * @param {string} provider - Override provider: 'vertex_ai' | 'grok' | 'auto'
     */
    async generateText(prompt, context = '', provider = 'auto') {
        const useProvider = provider === 'auto' ? this.aiProvider : provider;

        // A/B Testing mode
        if (useProvider === 'both') {
            return this._generateTextABTest(prompt, context);
        }

        // xAI Grok
        if (useProvider === 'grok' && this.grok) {
            return this._generateTextGrok(prompt, context);
        }

        // Vertex AI (default)
        return this._generateTextVertex(prompt, context);
    }

    async _generateTextVertex(prompt, context) {
        const modelId = this.models.vertex.text;
        this.logger.info(`Calling Vertex AI ${modelId}...`);

        try {
            const model = this.vertexAI.getGenerativeModel({ model: modelId });

            const req = {
                contents: [{
                    role: 'user',
                    parts: [{ text: context ? `CONTEXT: ${context}\n\nTASK: ${prompt}` : prompt }]
                }],
            };

            const result = await model.generateContent(req);
            const response = result.response;

            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No candidates returned from Gemini.');
            }

            return response.candidates[0].content.parts[0].text;
        } catch (error) {
            this._handleError('Text Generation (Vertex)', error);
        }
    }

    async _generateTextGrok(prompt, context) {
        const modelId = this.models.grok.text;
        this.logger.info(`Calling xAI ${modelId}...`);

        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.xaiApiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{
                        role: 'user',
                        content: context ? `CONTEXT: ${context}\n\nTASK: ${prompt}` : prompt
                    }]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            this._handleError('Text Generation (Grok)', error);
        }
    }

    async _generateTextABTest(prompt, context) {
        this.logger.info('A/B Testing: Running both providers...');

        const [vertexResult, grokResult] = await Promise.allSettled([
            this._generateTextVertex(prompt, context),
            this._generateTextGrok(prompt, context)
        ]);

        return {
            vertex: vertexResult.status === 'fulfilled' ? vertexResult.value : null,
            grok: grokResult.status === 'fulfilled' ? grokResult.value : null,
            winner: this._selectBestResult(vertexResult, grokResult)
        };
    }

    _selectBestResult(vertexResult, grokResult) {
        // Simple selection: prefer fulfilled result, prioritize Grok if both succeed
        if (grokResult.status === 'fulfilled') return 'grok';
        if (vertexResult.status === 'fulfilled') return 'vertex';
        return null;
    }

    /**
     * Generates an image using Imagen 3 (Vertex) or Grok Image (xAI)
     * @param {string} prompt - Image generation prompt
     * @param {string} aspectRatio - Aspect ratio: '1:1', '16:9', '9:16', '4:3'
     * @param {string} provider - Override provider: 'vertex_ai' | 'grok' | 'auto'
     */
    async generateImage(prompt, aspectRatio = '1:1', provider = 'auto') {
        const useProvider = provider === 'auto' ? this.aiProvider : provider;

        // xAI Grok Image
        if (useProvider === 'grok' && this.xaiApiKey) {
            return this._generateImageGrok(prompt);
        }

        // Vertex AI Imagen 3 (default)
        return this._generateImageVertex(prompt, aspectRatio);
    }

    async _generateImageVertex(prompt, aspectRatio) {
        const modelId = this.models.vertex.image;
        this.logger.info(`Calling Vertex AI ${modelId} [Ratio: ${aspectRatio}]...`);

        try {
            const model = this.vertexAI.getGenerativeModel({ model: modelId });

            const req = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    sampleCount: 1,
                    mimeType: 'image/png',
                    aspectRatio: aspectRatio
                }
            };

            const result = await model.generateContent(req);

            const outputDir = path.join(__dirname, '../../data/output/generated');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const filename = `imagen_${Date.now()}.png`;
            const filepath = path.join(outputDir, filename);

            const base64Data = result.response.candidates[0]?.content?.parts[0]?.inlineData?.data;
            if (!base64Data) throw new Error('No image data received from Imagen 3');

            fs.writeFileSync(filepath, base64Data, 'base64');
            this.logger.success(`Image saved to ${filepath}`);

            return filepath;
        } catch (error) {
            this._handleError('Image Generation (Vertex)', error);
        }
    }

    async _generateImageGrok(prompt) {
        const modelId = this.models.grok.image;
        this.logger.info(`Calling xAI ${modelId}...`);

        try {
            const response = await fetch('https://api.x.ai/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.xaiApiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    prompt: prompt,
                    n: 1
                })
            });

            const data = await response.json();

            const outputDir = path.join(__dirname, '../../data/output/generated');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const filename = `grok_${Date.now()}.png`;
            const filepath = path.join(outputDir, filename);

            // Grok returns base64 or URL
            if (data.data[0].b64_json) {
                fs.writeFileSync(filepath, data.data[0].b64_json, 'base64');
            } else if (data.data[0].url) {
                const imgResponse = await fetch(data.data[0].url);
                const buffer = await imgResponse.buffer();
                fs.writeFileSync(filepath, buffer);
            }

            this.logger.success(`Image saved to ${filepath}`);
            return filepath;
        } catch (error) {
            this._handleError('Image Generation (Grok)', error);
        }
    }

    /**
     * Generates video using Veo 2 (Vertex AI)
     * Note: xAI Grok Imagine Video has NO public API (consumer only)
     * @param {string} imagePath - Source image for video generation
     * @param {string} prompt - Video generation prompt
     * @param {number} duration - Video duration in seconds (5-60)
     */
    async generateVideo(imagePath, prompt, duration = 5) {
        const modelId = this.models.vertex.video;
        this.logger.info(`Calling Vertex AI ${modelId} [Duration: ${duration}s]...`);

        try {
            const model = this.vertexAI.getGenerativeModel({ model: modelId });

            const imageBuffer = fs.readFileSync(imagePath);
            const imageBase64 = imageBuffer.toString('base64');

            const req = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/png', data: imageBase64 } }
                        ]
                    }
                ],
                generationConfig: {
                    videoDuration: duration
                }
            };

            const result = await model.generateContent(req);

            const outputDir = path.join(__dirname, '../../data/output/generated');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const filename = `veo_${Date.now()}.mp4`;
            const filepath = path.join(outputDir, filename);

            const videoData = result.response.candidates[0]?.content?.parts[0]?.inlineData?.data;

            if (videoData) {
                fs.writeFileSync(filepath, videoData, 'base64');
                this.logger.success(`Video saved to ${filepath}`);
                return filepath;
            }

            const uri = result.response.candidates[0]?.content?.parts[0]?.fileData?.fileUri;
            if (uri) {
                this.logger.success(`Video URI received: ${uri}`);
                return uri;
            }

            throw new Error('No video data or URI returned from Veo 2.');

        } catch (error) {
            this._handleError('Video Generation', error);
        }
    }

    /**
     * Agentic Quality Control (The 'Critic' Protocol)
     * Analyzes an asset and provides a score + feedback.
     * Uses vision-capable model for multimodal review.
     */
    async reviewAsset(assetPath, criteria) {
        const modelId = this.models.vertex.text;
        this.logger.info(`Agentic Review [${modelId}] for ${assetPath}...`);

        try {
            const model = this.vertexAI.getGenerativeModel({ model: modelId });

            const fileBuffer = fs.readFileSync(assetPath);
            const mimeType = assetPath.endsWith('.mp4') ? 'video/mp4' : 'image/png';

            const prompt = `You are a strict Creative Director. Review the attached asset based on these criteria: ${criteria}.
            Return a JSON object: { "score": 0-100, "passed": boolean, "feedback": "detailed feedback" }`;

            const req = {
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: fileBuffer.toString('base64') } }
                    ]
                }]
            };

            const result = await model.generateContent(req);
            const responseText = result.response.candidates[0].content.parts[0].text;

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const review = JSON.parse(cleanJson);

            if (review.passed) {
                this.logger.success(`Asset passed review with score: ${review.score}`);
            } else {
                this.logger.warn(`Asset failed review. Score: ${review.score}. Feedback: ${review.feedback}`);
            }

            return review;

        } catch (error) {
            this._handleError('Asset Review', error);
        }
    }

    /**
     * Generates voiceover using Google Cloud TTS or Grok Voice (xAI)
     * @param {string} text - Text to synthesize
     * @param {string} voiceName - Voice name (Google TTS) or 'grok' for xAI
     * @param {string} provider - 'vertex_ai' | 'grok' | 'auto'
     */
    async generateVoiceover(text, voiceName = 'en-US-Neural2-F', provider = 'auto') {
        const useProvider = provider === 'auto' ? this.aiProvider : provider;

        // xAI Grok Voice ($0.05/min)
        if (useProvider === 'grok' && this.xaiApiKey) {
            return this._generateVoiceoverGrok(text);
        }

        // Google Cloud TTS (default)
        return this._generateVoiceoverGoogle(text, voiceName);
    }

    async _generateVoiceoverGoogle(text, voiceName) {
        this.logger.info(`Google TTS [${voiceName}]: "${text.substring(0, 30)}..."...`);

        try {
            const request = {
                input: { text: text },
                voice: { languageCode: voiceName.substring(0, 5), name: voiceName },
                audioConfig: { audioEncoding: 'MP3' },
            };

            const [response] = await this.ttsClient.synthesizeSpeech(request);

            const outputDir = path.join(__dirname, '../../data/output/audio');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const filename = `tts_${Date.now()}.mp3`;
            const filepath = path.join(outputDir, filename);

            fs.writeFileSync(filepath, response.audioContent, 'binary');
            this.logger.success(`Voiceover saved to ${filepath}`);

            return filepath;
        } catch (error) {
            this._handleError('Voiceover Generation (Google TTS)', error);
        }
    }

    async _generateVoiceoverGrok(text) {
        const modelId = this.models.grok.voice;
        this.logger.info(`xAI Grok Voice [${modelId}]: "${text.substring(0, 30)}..."...`);

        try {
            // Grok Voice API (realtime audio)
            const response = await fetch('https://api.x.ai/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.xaiApiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    input: text,
                    voice: 'alloy' // Options: alloy, echo, fable, onyx, nova, shimmer
                })
            });

            const outputDir = path.join(__dirname, '../../data/output/audio');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const filename = `grok_voice_${Date.now()}.mp3`;
            const filepath = path.join(outputDir, filename);

            const buffer = await response.buffer();
            fs.writeFileSync(filepath, buffer);
            this.logger.success(`Voiceover saved to ${filepath}`);

            return filepath;
        } catch (error) {
            this._handleError('Voiceover Generation (Grok)', error);
        }
    }

    _handleError(context, error) {
        this.logger.error(`${context} API Error: ${error.message}`);
        throw error;
    }
}

module.exports = AssetFactory;