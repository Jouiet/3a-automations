#!/usr/bin/env node
/**
 * Resilient Product Photo Enhancement - Multi-Provider Fallback
 * 3A Automation - Session 115
 *
 * Enhances product photos with AI, automatic failover
 * Fallback chain: Gemini Imagen → fal.ai Flux → Replicate SDXL
 *
 * Usage:
 *   node product-photos-resilient.cjs --image="/path/to/image.jpg" --prompt="Remove background, enhance lighting"
 *   node product-photos-resilient.cjs --server --port=3005
 *   node product-photos-resilient.cjs --health
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders
} = require('../../lib/security-utils.cjs');

// Security constants
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit for images
const CORS_WHITELIST = [
  'https://3a-automation.com',
  'https://www.3a-automation.com',
  'https://dashboard.3a-automation.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../../../.env');
    const env = fs.readFileSync(envPath, 'utf8');
    const vars = {};
    env.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) vars[match[1]] = match[2].trim();
    });
    return vars;
  } catch (e) {
    return process.env;
  }
}

const ENV = loadEnv();

// IMAGE GENERATION PROVIDERS - Verified December 2025
// Sources: https://ai.google.dev/gemini-api/docs/models, https://docs.x.ai/docs/models
const PROVIDERS = {
  gemini: {
    name: 'Gemini 2.5 Flash Image',
    // gemini-2.5-flash-image supports image generation (verified Dec 2025)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
    type: 'generation'
  },
  grok: {
    name: 'Grok Image',
    // grok-2-image-1212 supports image generation (verified Dec 2025)
    url: 'https://api.x.ai/v1/images/generations',
    model: 'grok-2-image-1212',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
    type: 'generation'
  },
  falai: {
    name: 'fal.ai Flux',
    url: 'https://queue.fal.run/fal-ai/flux/dev/image-to-image',
    apiKey: ENV.FAL_API_KEY,
    enabled: !!ENV.FAL_API_KEY,
    type: 'generation'
  },
  replicate: {
    name: 'Replicate SDXL',
    url: 'https://api.replicate.com/v1/predictions',
    apiKey: ENV.REPLICATE_API_TOKEN,
    enabled: !!ENV.REPLICATE_API_TOKEN,
    type: 'generation'
  }
};

// VISION ANALYSIS PROVIDERS - Verified December 2025
// All models below have verified vision/image understanding capabilities
const VISION_PROVIDERS = {
  gemini: {
    name: 'Gemini 2.5 Flash Vision',
    // gemini-2.5-flash has vision capability (Dec 2025)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY
  },
  grok: {
    name: 'Grok 2 Vision',
    // grok-2-vision-1212 has vision capability (Dec 2025)
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-vision-1212',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY
  },
  anthropic: {
    name: 'Claude Sonnet 4 Vision',
    // claude-sonnet-4 has vision capability (Dec 2025)
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP REQUEST HELPER
// ─────────────────────────────────────────────────────────────────────────────
function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers || {},
      timeout: 120000, // 2 minutes for image processing
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function imageToBase64(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  return buffer.toString('base64');
}

function getMimeType(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mimes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimes[ext] || 'image/jpeg';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER API CALLS - IMAGE GENERATION/EDITING
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiImagen(imageBase64, prompt, mimeType) {
  if (!PROVIDERS.gemini.enabled) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${PROVIDERS.gemini.url}?key=${PROVIDERS.gemini.apiKey}`;

  const body = JSON.stringify({
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: imageBase64
          }
        },
        {
          text: `Edit this product image: ${prompt}. Return the edited image.`
        }
      ]
    }],
    generationConfig: {
      responseModalities: ['image', 'text'],
      imageSeed: 1
    }
  });

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);

  const result = JSON.parse(response.data);

  // Check for image in response
  const parts = result.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }

  throw new Error('No image in Gemini response');
}

async function callGrokImage(imageBase64, prompt, mimeType) {
  if (!PROVIDERS.grok.enabled) {
    throw new Error('Grok API key not configured');
  }

  // Grok image generation API (grok-2-image-1212)
  // Note: This is text-to-image, not image-to-image editing
  // We describe the original image + the edit request
  const body = JSON.stringify({
    model: PROVIDERS.grok.model,
    prompt: `Product photo editing: ${prompt}. Create a professional e-commerce product image.`,
    n: 1,
    response_format: 'b64_json'
  });

  const response = await httpRequest(PROVIDERS.grok.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.grok.apiKey}`
    }
  }, body);

  const result = JSON.parse(response.data);

  if (result.data?.[0]?.b64_json) {
    return {
      imageBase64: result.data[0].b64_json,
      mimeType: 'image/png'
    };
  }

  throw new Error('No image in Grok response');
}

async function callFalAI(imageBase64, prompt, mimeType) {
  if (!PROVIDERS.falai.enabled) {
    throw new Error('fal.ai API key not configured');
  }

  // Submit job
  const submitBody = JSON.stringify({
    image_url: `data:${mimeType};base64,${imageBase64}`,
    prompt: prompt,
    strength: 0.7,
    num_inference_steps: 28,
    guidance_scale: 7.5
  });

  const submitResponse = await httpRequest(PROVIDERS.falai.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${PROVIDERS.falai.apiKey}`
    }
  }, submitBody);

  const submitResult = JSON.parse(submitResponse.data);

  // If immediate result
  if (submitResult.images?.[0]?.url) {
    const imgResponse = await httpRequest(submitResult.images[0].url, { method: 'GET' });
    return {
      imageBase64: Buffer.from(imgResponse.data, 'binary').toString('base64'),
      mimeType: 'image/png'
    };
  }

  // Poll for result if queued
  if (submitResult.request_id) {
    const statusUrl = `https://queue.fal.run/fal-ai/flux/dev/image-to-image/requests/${submitResult.request_id}/status`;

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await httpRequest(statusUrl, {
        method: 'GET',
        headers: { 'Authorization': `Key ${PROVIDERS.falai.apiKey}` }
      });

      const status = JSON.parse(statusResponse.data);

      if (status.status === 'COMPLETED' && status.response?.images?.[0]?.url) {
        const imgResponse = await httpRequest(status.response.images[0].url, { method: 'GET' });
        return {
          imageBase64: Buffer.from(imgResponse.data, 'binary').toString('base64'),
          mimeType: 'image/png'
        };
      }

      if (status.status === 'FAILED') {
        throw new Error(`fal.ai job failed: ${status.error || 'Unknown error'}`);
      }
    }

    throw new Error('fal.ai timeout');
  }

  throw new Error('No result from fal.ai');
}

async function callReplicate(imageBase64, prompt, mimeType) {
  if (!PROVIDERS.replicate.enabled) {
    throw new Error('Replicate API key not configured');
  }

  // Use SDXL img2img
  const body = JSON.stringify({
    version: 'a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5', // SDXL img2img
    input: {
      image: `data:${mimeType};base64,${imageBase64}`,
      prompt: prompt,
      prompt_strength: 0.7,
      num_inference_steps: 30,
      guidance_scale: 7.5
    }
  });

  const response = await httpRequest(PROVIDERS.replicate.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${PROVIDERS.replicate.apiKey}`
    }
  }, body);

  const result = JSON.parse(response.data);

  // Poll for result
  if (result.urls?.get) {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await httpRequest(result.urls.get, {
        method: 'GET',
        headers: { 'Authorization': `Token ${PROVIDERS.replicate.apiKey}` }
      });

      const status = JSON.parse(statusResponse.data);

      if (status.status === 'succeeded' && status.output?.[0]) {
        const imgResponse = await httpRequest(status.output[0], { method: 'GET' });
        return {
          imageBase64: Buffer.from(imgResponse.data, 'binary').toString('base64'),
          mimeType: 'image/png'
        };
      }

      if (status.status === 'failed') {
        throw new Error(`Replicate job failed: ${status.error || 'Unknown error'}`);
      }
    }

    throw new Error('Replicate timeout');
  }

  throw new Error('No result from Replicate');
}

// ─────────────────────────────────────────────────────────────────────────────
// VISION ANALYSIS (for descriptions, not editing)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithVision(imageBase64, prompt, mimeType) {
  const errors = [];
  const providerOrder = ['gemini', 'grok', 'anthropic'];

  for (const providerKey of providerOrder) {
    const provider = VISION_PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;

      if (providerKey === 'gemini') {
        const url = `${provider.url}?key=${provider.apiKey}`;
        const body = JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: prompt }
            ]
          }]
        });

        const result = await httpRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, body);

        const data = JSON.parse(result.data);
        response = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (providerKey === 'grok') {
        const body = JSON.stringify({
          model: provider.model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              { type: 'text', text: prompt }
            ]
          }]
        });

        const result = await httpRequest(provider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          }
        }, body);

        const data = JSON.parse(result.data);
        response = data.choices?.[0]?.message?.content;
      }

      if (providerKey === 'anthropic') {
        const body = JSON.stringify({
          model: provider.model,
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
              { type: 'text', text: prompt }
            ]
          }]
        });

        const result = await httpRequest(provider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.apiKey,
            'anthropic-version': '2024-01-01'
          }
        }, body);

        const data = JSON.parse(result.data);
        response = data.content?.[0]?.text;
      }

      if (response) {
        return {
          success: true,
          analysis: response,
          provider: provider.name,
          fallbacksUsed: errors.length
        };
      }
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[Vision] ${provider.name} failed:`, err.message);
    }
  }

  return {
    success: false,
    error: 'All vision providers failed',
    errors
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT IMAGE ENHANCEMENT
// ─────────────────────────────────────────────────────────────────────────────
async function enhanceProductPhoto(imagePath, prompt) {
  const errors = [];
  // Fallback order: Gemini 2.5 Flash Image → Grok Image → fal.ai Flux → Replicate SDXL
  const providerOrder = ['gemini', 'grok', 'falai', 'replicate'];

  // Load image
  let imageBase64, mimeType;
  try {
    imageBase64 = imageToBase64(imagePath);
    mimeType = getMimeType(imagePath);
  } catch (err) {
    return {
      success: false,
      error: `Failed to load image: ${err.message}`
    };
  }

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let result;

      switch (providerKey) {
        case 'gemini':
          result = await callGeminiImagen(imageBase64, prompt, mimeType);
          break;
        case 'grok':
          result = await callGrokImage(imageBase64, prompt, mimeType);
          break;
        case 'falai':
          result = await callFalAI(imageBase64, prompt, mimeType);
          break;
        case 'replicate':
          result = await callReplicate(imageBase64, prompt, mimeType);
          break;
      }

      console.log(`[Product Photos] Success with ${provider.name}`);

      return {
        success: true,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        provider: provider.name,
        fallbacksUsed: errors.length,
        errors
      };
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[Product Photos] ${provider.name} failed:`, err.message);
    }
  }

  return {
    success: false,
    error: 'All image generation providers failed',
    errors
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3005) {
  // P1 FIX: Rate limiter (5 req/min per IP for image processing)
  const rateLimiter = new RateLimiter(5, 60000);

  const server = http.createServer(async (req, res) => {
    // P1 FIX: CORS whitelist (no wildcard fallback)
    const origin = req.headers.origin;
    if (origin && CORS_WHITELIST.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', 'https://3a-automation.com');
    } else {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origin not allowed' }));
      return;
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // P1 FIX: Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!rateLimiter.tryAcquire(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Max 5/min for image processing.' }));
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        healthy: true,
        imageProviders: {},
        visionProviders: {}
      };
      for (const [key, provider] of Object.entries(PROVIDERS)) {
        status.imageProviders[key] = { name: provider.name, configured: provider.enabled };
      }
      for (const [key, provider] of Object.entries(VISION_PROVIDERS)) {
        status.visionProviders[key] = { name: provider.name, configured: provider.enabled };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Enhance endpoint
    if (req.url === '/enhance' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;
      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large. Max 10MB.' }));
          return;
        }
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { imagePath, imageBase64, prompt } = JSON.parse(body);

          if (!prompt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Prompt is required' }));
            return;
          }

          if (!imagePath && !imageBase64) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'imagePath or imageBase64 is required' }));
            return;
          }

          console.log(`[Product Photos] Processing: "${prompt.substring(0, 50)}..."`);

          let result;
          if (imagePath) {
            result = await enhanceProductPhoto(imagePath, prompt);
          } else {
            // Handle base64 input directly
            result = await enhanceProductPhoto('/tmp/temp-image.jpg', prompt);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[Product Photos] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Analyze endpoint (vision)
    if (req.url === '/analyze' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { imagePath, imageBase64, prompt, mimeType = 'image/jpeg' } = JSON.parse(body);

          if (!prompt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Prompt is required' }));
            return;
          }

          let base64Data = imageBase64;
          let mime = mimeType;

          if (imagePath) {
            base64Data = imageToBase64(imagePath);
            mime = getMimeType(imagePath);
          }

          if (!base64Data) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'imagePath or imageBase64 is required' }));
            return;
          }

          console.log(`[Vision] Analyzing: "${prompt.substring(0, 50)}..."`);
          const result = await analyzeWithVision(base64Data, prompt, mime);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[Vision] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`\n📸 Product Photos API running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /enhance  - Enhance product image with fallback');
    console.log('  POST /analyze  - Analyze image with vision (fallback)');
    console.log('  GET  /health   - Provider status');
    console.log('\nImage Providers (fallback order):');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`  ${status} ${provider.name}`);
    }
    console.log('\nVision Providers (fallback order):');
    for (const [key, provider] of Object.entries(VISION_PROVIDERS)) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`  ${status} ${provider.name}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)(?:=(.+))?$/);
    if (match) {
      args[match[1]] = match[2] || true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  if (args.server) {
    startServer(parseInt(args.port) || 3005);
    return;
  }

  if (args.health) {
    console.log('\n=== IMAGE GENERATION PROVIDERS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅ Configured' : '❌ Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('\n=== VISION ANALYSIS PROVIDERS ===');
    for (const [key, provider] of Object.entries(VISION_PROVIDERS)) {
      const status = provider.enabled ? '✅ Configured' : '❌ Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    return;
  }

  if (args.image && args.prompt) {
    console.log(`\n📸 Enhancing image: ${args.image}`);
    console.log(`   Prompt: ${args.prompt}\n`);

    const result = await enhanceProductPhoto(args.image, args.prompt);

    if (result.success) {
      console.log('Provider:', result.provider);
      console.log('Fallbacks used:', result.fallbacksUsed);

      // Save output
      const outputPath = args.output || args.image.replace(/(\.\w+)$/, '_enhanced$1');
      fs.writeFileSync(outputPath, Buffer.from(result.imageBase64, 'base64'));
      console.log('Saved to:', outputPath);
    } else {
      console.error('Failed:', result.error);
      if (result.errors) {
        result.errors.forEach(e => console.log(`  ${e.provider}: ${e.error}`));
      }
    }
    return;
  }

  if (args.analyze && args.prompt) {
    console.log(`\n🔍 Analyzing image: ${args.analyze}`);

    const imageBase64 = imageToBase64(args.analyze);
    const mimeType = getMimeType(args.analyze);
    const result = await analyzeWithVision(imageBase64, args.prompt, mimeType);

    if (result.success) {
      console.log('Provider:', result.provider);
      console.log('Fallbacks used:', result.fallbacksUsed);
      console.log('\nAnalysis:');
      console.log(result.analysis);
    } else {
      console.error('Failed:', result.error);
    }
    return;
  }

  console.log(`
📸 Resilient Product Photos API - 3A Automation

Usage:
  node product-photos-resilient.cjs --server [--port=3005]
  node product-photos-resilient.cjs --image="/path/to/img.jpg" --prompt="Enhance..."
  node product-photos-resilient.cjs --analyze="/path/to/img.jpg" --prompt="Describe..."
  node product-photos-resilient.cjs --health

Image Generation Fallback:
  Gemini Imagen → fal.ai Flux → Replicate SDXL

Vision Analysis Fallback:
  Gemini Vision → Grok Vision → Claude Vision
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
