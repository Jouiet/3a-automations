/**
 * AI Asset Generator - Integration with fal.ai, Replicate, Imagen
 * Generates images and videos for Remotion compositions
 *
 * IMPORTANT: Google Whisk has NO API - manual workflow only
 * Use Imagen 4 API via Vertex AI for programmatic generation
 */

// Environment variables (loaded at runtime)
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Provider configurations
const PROVIDERS = {
  falai: {
    name: 'fal.ai',
    baseUrl: 'https://queue.fal.run',
    models: {
      flux: 'fal-ai/flux/dev',
      fluxPro: 'fal-ai/flux-pro',
      seedream: 'fal-ai/seedream-3.0',
    },
  },
  replicate: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      sdxl: 'stability-ai/sdxl',
      veo3Fast: 'google/veo-3-fast',
      nanoBanana: 'fofr/nano-banana-pro',
    },
  },
  vertexImagen: {
    name: 'Imagen 4 (Vertex AI)',
    baseUrl: 'https://us-central1-aiplatform.googleapis.com/v1',
    models: {
      imagen4: 'imagen-4.0-generate-001',
      imagen4Fast: 'imagen-4.0-fast-generate-001',
    },
  },
};

/**
 * Generate image with fal.ai FLUX
 */
export async function generateImageFalai(
  prompt: string,
  options: {
    model?: keyof typeof PROVIDERS.falai.models;
    width?: number;
    height?: number;
    seed?: number;
  } = {}
): Promise<{ url: string; seed: number }> {
  const apiKey = getEnv('FAL_API_KEY');
  if (!apiKey) {
    throw new Error('FAL_API_KEY not configured');
  }

  const model = options.model || 'flux';
  const url = `${PROVIDERS.falai.baseUrl}/${PROVIDERS.falai.models[model]}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: {
        width: options.width || 1920,
        height: options.height || 1080,
      },
      seed: options.seed,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`fal.ai error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.images?.[0]?.url || data.output?.url,
    seed: data.seed,
  };
}

/**
 * Generate image with Replicate
 */
export async function generateImageReplicate(
  prompt: string,
  options: {
    model?: string;
    width?: number;
    height?: number;
  } = {}
): Promise<{ url: string }> {
  const apiKey = getEnv('REPLICATE_API_TOKEN');
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  const response = await fetch(`${PROVIDERS.replicate.baseUrl}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: options.model || PROVIDERS.replicate.models.nanoBanana,
      input: {
        prompt,
        width: options.width || 1920,
        height: options.height || 1080,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  // Poll for completion
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 1000));
    const pollResponse = await fetch(
      `${PROVIDERS.replicate.baseUrl}/predictions/${result.id}`,
      { headers: { 'Authorization': `Token ${apiKey}` } }
    );
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(`Replicate generation failed: ${result.error}`);
  }

  return { url: Array.isArray(result.output) ? result.output[0] : result.output };
}

/**
 * Generate video with Replicate (Veo 3)
 */
export async function generateVideoReplicate(
  prompt: string,
  options: {
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
  } = {}
): Promise<{ url: string }> {
  const apiKey = getEnv('REPLICATE_API_TOKEN');
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  const response = await fetch(`${PROVIDERS.replicate.baseUrl}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: PROVIDERS.replicate.models.veo3Fast,
      input: {
        prompt,
        duration: options.duration || 5,
        aspect_ratio: options.aspectRatio || '16:9',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  // Poll for completion (video generation takes longer)
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 5000));
    const pollResponse = await fetch(
      `${PROVIDERS.replicate.baseUrl}/predictions/${result.id}`,
      { headers: { 'Authorization': `Token ${apiKey}` } }
    );
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(`Video generation failed: ${result.error}`);
  }

  return { url: result.output };
}

/**
 * Multi-provider fallback for image generation
 */
export async function generateImage(
  prompt: string,
  options: { width?: number; height?: number } = {}
): Promise<{ url: string; provider: string }> {
  const providers = [
    { name: 'fal.ai', fn: () => generateImageFalai(prompt, options) },
    { name: 'Replicate', fn: () => generateImageReplicate(prompt, options) },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      console.log(`✅ [AI Assets] Generated with ${provider.name}`);
      return { url: result.url, provider: provider.name };
    } catch (error) {
      console.warn(`⚠️ [AI Assets] ${provider.name} failed, trying next...`);
    }
  }

  throw new Error('All image generation providers failed');
}

// Export provider info for documentation
export const AI_PROVIDERS = PROVIDERS;
