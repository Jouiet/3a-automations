#!/usr/bin/env node
/**
 * Resilient Podcast Generator - Multi-Provider TTS + AI Script Generation
 * 3A Automation - Session 120
 *
 * SUPÉRIEUR à NotebookLM:
 *   - Voix personnalisables (pas 2 voix génériques)
 *   - API-based (pas d'automatisation browser)
 *   - Multi-provider fallback (haute disponibilité)
 *   - Client-ready avec branding configurable
 *   - Durée illimitée (pas 30min max)
 *   - Édition possible du script avant audio
 *
 * FALLBACK CHAINS:
 *   Script: Anthropic → OpenAI → Grok → Gemini
 *   Audio:  ElevenLabs → Gemini TTS → fal.ai MiniMax
 *
 * Usage:
 *   node podcast-generator-resilient.cjs --health
 *   node podcast-generator-resilient.cjs --topic="E-commerce 2026" --language=fr
 *   node podcast-generator-resilient.cjs --blog="path/to/article.md" --output="podcast.mp3"
 *   node podcast-generator-resilient.cjs --script="path/to/script.json" --audio-only
 *   node podcast-generator-resilient.cjs --server --port=3010
 *
 * Version: 1.0.0
 * Date: 2026-01-02
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders
} = require('../../lib/security-utils.cjs');

// Security constants
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB for audio
const REQUEST_TIMEOUT_MS = 180000; // 3 minutes for audio generation
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
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*)["']?$/);
      if (match) {
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars[match[1]] = value;
      }
    });
    return vars;
  } catch (e) {
    return process.env;
  }
}

const ENV = loadEnv();

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDERS FOR SCRIPT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

// AI PROVIDERS - Verified January 2026
// Fallback order: Anthropic → OpenAI → Grok → Gemini
const AI_PROVIDERS = {
  anthropic: {
    name: 'Anthropic Claude',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
  },
  openai: {
    name: 'OpenAI GPT-5.2',
    // gpt-5.2: market leader 68-82% share (Jan 2026)
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5.2',
    apiKey: ENV.OPENAI_API_KEY,
    enabled: !!ENV.OPENAI_API_KEY,
  },
  grok: {
    name: 'xAI Grok',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TTS PROVIDERS FOR AUDIO GENERATION
// ─────────────────────────────────────────────────────────────────────────────

const TTS_PROVIDERS = {
  elevenlabs: {
    name: 'ElevenLabs',
    url: 'https://api.elevenlabs.io/v1/text-to-speech',
    apiKey: ENV.ELEVENLABS_API_KEY,
    enabled: !!ENV.ELEVENLABS_API_KEY,
    // ElevenLabs voices (Dec 2025)
    voices: {
      // Host 1 options (professional, authoritative)
      host1: {
        male: 'Daniel',      // Professional male
        female: 'Rachel',    // Professional female
      },
      // Host 2 options (friendly, conversational)
      host2: {
        male: 'Charlie',     // Friendly male
        female: 'Aria',      // Friendly female
      },
    },
    // Voice IDs (from ElevenLabs dashboard)
    voiceIds: {
      Rachel: 'EXAVITQu4vr4xnSDxMaL',
      Aria: '9BWtsMINqrJLrRacOk9x',
      Daniel: 'CwhRBWXzGAHq8TQ4Fs17',
      Charlie: 'IKne3meq5aSn9XLyUdCD',
      George: 'JBFqnCBsd6RMkjVDRZzb',
      Laura: 'FGY2WhTYpPnrIDTdsKH5',
    },
  },
  gemini: {
    name: 'Gemini TTS',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
    voices: {
      host1: {
        male: 'Charon',      // Deep male
        female: 'Kore',      // Firm female
      },
      host2: {
        male: 'Puck',        // Upbeat neutral
        female: 'Aoede',     // Clear female
      },
    },
  },
  falai: {
    name: 'fal.ai MiniMax',
    url: 'https://queue.fal.run/fal-ai/minimax-tts',
    apiKey: ENV.FAL_API_KEY,
    enabled: !!ENV.FAL_API_KEY,
    voices: {
      host1: {
        male: 'Deep_Voice_Man',
        female: 'Wise_Woman',
      },
      host2: {
        male: 'Friendly_Person',
        female: 'Calm_Woman',
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PODCAST CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const PODCAST_CONFIG = {
  // Default hosts
  host1: {
    name: 'Alexandre',
    role: 'Expert automation',
    gender: 'male',
  },
  host2: {
    name: 'Sophie',
    role: 'Co-hôte curieuse',
    gender: 'female',
  },

  // Podcast metadata
  podcast: {
    name: '3A Automation Podcast',
    tagline: 'L\'automatisation marketing décryptée',
    intro: 'Bienvenue dans le podcast de 3A Automation !',
    outro: 'Merci d\'avoir écouté ! Retrouvez-nous sur 3a-automation.com',
  },

  // Duration targets (in segments)
  duration: {
    short: 5,    // ~5 min
    medium: 10,  // ~10 min
    long: 20,    // ~20 min
  },

  // Output format
  output: {
    format: 'mp3',
    sampleRate: 44100,
    channels: 1, // Mono for podcast
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE JSON PARSE (P2 security fix)
// ─────────────────────────────────────────────────────────────────────────────

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('[WARN] JSON parse error:', e.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PODCAST SCRIPT PROMPT
// ─────────────────────────────────────────────────────────────────────────────

function buildScriptPrompt(content, language, config) {
  const lang = language === 'fr' ? 'French' : 'English';
  const host1 = config.host1 || PODCAST_CONFIG.host1;
  const host2 = config.host2 || PODCAST_CONFIG.host2;
  const segments = config.segments || PODCAST_CONFIG.duration.medium;

  return `You are a podcast script writer. Create an engaging ${segments}-segment podcast script in ${lang}.

HOSTS:
- ${host1.name}: ${host1.role} (${host1.gender})
- ${host2.name}: ${host2.role} (${host2.gender})

CONTENT TO DISCUSS:
${content}

OUTPUT FORMAT (strict JSON):
{
  "title": "Episode title",
  "description": "Brief episode description",
  "segments": [
    {
      "speaker": "${host1.name}",
      "text": "What the host says",
      "emotion": "neutral|excited|thoughtful|curious"
    },
    {
      "speaker": "${host2.name}",
      "text": "Response from co-host",
      "emotion": "neutral|excited|thoughtful|curious"
    }
  ],
  "duration_estimate": "X minutes"
}

GUIDELINES:
- Start with a warm welcome introducing the topic
- Alternate between hosts naturally
- Include specific examples and actionable insights
- Use conversational, engaging language
- End with a clear call-to-action and goodbye
- Each segment should be 2-4 sentences (30-60 words)
- Total segments: ${segments}

Generate ONLY valid JSON, no markdown.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SCRIPT GENERATION (Multi-provider fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function generateScriptAnthropic(prompt) {
  const provider = AI_PROVIDERS.anthropic;
  if (!provider.enabled) throw new Error('Anthropic not configured');

  console.log('[Script] Generating with Anthropic Claude...');

  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Anthropic: ${data.error.message}`);

  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Anthropic: No content in response');

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Anthropic: No JSON in response');

  return safeJsonParse(jsonMatch[0]);
}

async function generateScriptOpenAI(prompt) {
  const provider = AI_PROVIDERS.openai;
  if (!provider.enabled) throw new Error('OpenAI not configured');

  console.log('[Script] Generating with OpenAI GPT-5.2...');

  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`OpenAI: ${data.error.message}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI: No content in response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('OpenAI: No JSON in response');

  return safeJsonParse(jsonMatch[0]);
}

async function generateScriptGrok(prompt) {
  const provider = AI_PROVIDERS.grok;
  if (!provider.enabled) throw new Error('Grok not configured');

  console.log('[Script] Generating with Grok...');

  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Grok: ${data.error.message}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Grok: No content in response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Grok: No JSON in response');

  return safeJsonParse(jsonMatch[0]);
}

async function generateScriptGemini(prompt) {
  const provider = AI_PROVIDERS.gemini;
  if (!provider.enabled) throw new Error('Gemini not configured');

  console.log('[Script] Generating with Gemini...');

  const url = `${provider.url}?key=${provider.apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8000 },
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: No content in response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini: No JSON in response');

  return safeJsonParse(jsonMatch[0]);
}

async function generateScript(content, language, config) {
  const prompt = buildScriptPrompt(content, language, config);
  const errors = [];

  // Try Anthropic first
  if (AI_PROVIDERS.anthropic.enabled) {
    try {
      return await generateScriptAnthropic(prompt);
    } catch (e) {
      errors.push(`Anthropic: ${e.message}`);
      console.warn('[WARN] Anthropic failed, trying OpenAI...');
    }
  }

  // Fallback to OpenAI
  if (AI_PROVIDERS.openai.enabled) {
    try {
      return await generateScriptOpenAI(prompt);
    } catch (e) {
      errors.push(`OpenAI: ${e.message}`);
      console.warn('[WARN] OpenAI failed, trying Grok...');
    }
  }

  // Fallback to Grok
  if (AI_PROVIDERS.grok.enabled) {
    try {
      return await generateScriptGrok(prompt);
    } catch (e) {
      errors.push(`Grok: ${e.message}`);
      console.warn('[WARN] Grok failed, trying Gemini...');
    }
  }

  // Fallback to Gemini
  if (AI_PROVIDERS.gemini.enabled) {
    try {
      return await generateScriptGemini(prompt);
    } catch (e) {
      errors.push(`Gemini: ${e.message}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS AUDIO GENERATION (Multi-provider fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function synthesizeElevenLabs(text, voiceId) {
  const provider = TTS_PROVIDERS.elevenlabs;
  if (!provider.enabled) throw new Error('ElevenLabs not configured');

  const url = `${provider.url}/${voiceId}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': provider.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function synthesizeGemini(text, voiceName) {
  const provider = TTS_PROVIDERS.gemini;
  if (!provider.enabled) throw new Error('Gemini TTS not configured');

  const url = `${provider.url}?key=${provider.apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Gemini TTS: ${data.error.message}`);

  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!audioData) throw new Error('Gemini TTS: No audio in response');

  return Buffer.from(audioData.data, 'base64');
}

async function synthesizeFalAI(text, voiceName, language) {
  const provider = TTS_PROVIDERS.falai;
  if (!provider.enabled) throw new Error('fal.ai not configured');

  // fal.ai async queue pattern
  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${provider.apiKey}`,
    },
    body: JSON.stringify({
      text,
      voice: voiceName,
      language: language === 'fr' ? 'French' : 'English',
      speed: 1.0,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`fal.ai: ${data.error}`);

  // Poll for result if async
  if (data.request_id) {
    const statusUrl = `https://queue.fal.run/fal-ai/minimax-tts/requests/${data.request_id}/status`;
    let result;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${provider.apiKey}` },
      });
      result = await statusRes.json();
      if (result.status === 'COMPLETED') break;
      if (result.status === 'FAILED') throw new Error(`fal.ai: ${result.error}`);
    }

    // Fetch audio from result URL
    const audioRes = await fetch(result.audio_url);
    const buffer = await audioRes.arrayBuffer();
    return Buffer.from(buffer);
  }

  // Direct response
  if (data.audio_url) {
    const audioRes = await fetch(data.audio_url);
    const buffer = await audioRes.arrayBuffer();
    return Buffer.from(buffer);
  }

  throw new Error('fal.ai: No audio URL in response');
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO SYNTHESIS (Multi-provider with voice mapping)
// ─────────────────────────────────────────────────────────────────────────────

async function synthesizeSegment(text, speaker, config, language) {
  const host1 = config.host1 || PODCAST_CONFIG.host1;
  const host2 = config.host2 || PODCAST_CONFIG.host2;

  // Determine which host is speaking
  const isHost1 = speaker === host1.name;
  const hostKey = isHost1 ? 'host1' : 'host2';
  const gender = isHost1 ? host1.gender : host2.gender;

  const errors = [];

  // Try ElevenLabs first
  if (TTS_PROVIDERS.elevenlabs.enabled) {
    try {
      const voiceName = TTS_PROVIDERS.elevenlabs.voices[hostKey][gender];
      const voiceId = TTS_PROVIDERS.elevenlabs.voiceIds[voiceName];
      console.log(`[Audio] ElevenLabs: ${speaker} → ${voiceName}`);
      return await synthesizeElevenLabs(text, voiceId);
    } catch (e) {
      errors.push(`ElevenLabs: ${e.message}`);
      console.warn('[WARN] ElevenLabs failed, trying Gemini TTS...');
    }
  }

  // Fallback to Gemini TTS
  if (TTS_PROVIDERS.gemini.enabled) {
    try {
      const voiceName = TTS_PROVIDERS.gemini.voices[hostKey][gender];
      console.log(`[Audio] Gemini TTS: ${speaker} → ${voiceName}`);
      return await synthesizeGemini(text, voiceName);
    } catch (e) {
      errors.push(`Gemini TTS: ${e.message}`);
      console.warn('[WARN] Gemini TTS failed, trying fal.ai...');
    }
  }

  // Fallback to fal.ai MiniMax
  if (TTS_PROVIDERS.falai.enabled) {
    try {
      const voiceName = TTS_PROVIDERS.falai.voices[hostKey][gender];
      console.log(`[Audio] fal.ai MiniMax: ${speaker} → ${voiceName}`);
      return await synthesizeFalAI(text, voiceName, language);
    } catch (e) {
      errors.push(`fal.ai: ${e.message}`);
    }
  }

  throw new Error(`All TTS providers failed:\n${errors.join('\n')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CONCATENATION (Simple WAV/PCM merge)
// ─────────────────────────────────────────────────────────────────────────────

function concatenateAudioBuffers(buffers) {
  // For now, simple concatenation (works with PCM data)
  // Production: Use FFmpeg for proper MP3 merging
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const result = Buffer.alloc(totalLength);

  let offset = 0;
  for (const buf of buffers) {
    buf.copy(result, offset);
    offset += buf.length;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PODCAST GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generatePodcast(content, options = {}) {
  const language = options.language || 'fr';
  const config = {
    host1: options.host1 || PODCAST_CONFIG.host1,
    host2: options.host2 || PODCAST_CONFIG.host2,
    segments: options.segments || PODCAST_CONFIG.duration.medium,
  };

  console.log('\n[Podcast] PODCAST GENERATOR - 3A Automation');
  console.log('━'.repeat(50));

  // Step 1: Generate script
  console.log('\n[Step 1] Generating podcast script...');
  const script = await generateScript(content, language, config);

  if (!script || !script.segments) {
    throw new Error('Invalid script format - missing segments');
  }

  console.log(`[OK] Script generated: "${script.title}"`);
  console.log(`   ${script.segments.length} segments, ~${script.duration_estimate}`);

  // Save script for review/editing
  const scriptPath = options.scriptOutput || path.join(__dirname, '../../../outputs/podcast-script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log(`[Saved] Script saved: ${scriptPath}`);

  // Step 2: Generate audio if not script-only
  if (options.scriptOnly) {
    return { script, scriptPath };
  }

  console.log('\n[Step 2] Generating audio segments...');
  const audioBuffers = [];

  for (let i = 0; i < script.segments.length; i++) {
    const segment = script.segments[i];
    console.log(`   [${i + 1}/${script.segments.length}] ${segment.speaker}: "${segment.text.substring(0, 40)}..."`);

    try {
      const audio = await synthesizeSegment(segment.text, segment.speaker, config, language);
      audioBuffers.push(audio);

      // Add small pause between segments
      const pauseBuffer = Buffer.alloc(4410); // ~100ms at 44.1kHz
      audioBuffers.push(pauseBuffer);
    } catch (e) {
      console.error(`   [ERROR] Failed: ${e.message}`);
      // Continue with other segments
    }
  }

  // Step 3: Concatenate and save
  console.log('\n[Step 3] Finalizing podcast...');
  const finalAudio = concatenateAudioBuffers(audioBuffers);

  const outputPath = options.output || path.join(__dirname, '../../../outputs/podcast.mp3');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalAudio);

  console.log(`\n[OK] PODCAST GENERATED!`);
  console.log(`   Script: ${scriptPath}`);
  console.log(`   Audio: ${outputPath} (${(finalAudio.length / 1024 / 1024).toFixed(2)} MB)`);

  return {
    script,
    scriptPath,
    audioPath: outputPath,
    audioSize: finalAudio.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

async function healthCheck() {
  console.log('\n[Health] PODCAST GENERATOR - Health Check');
  console.log('━'.repeat(50));

  const results = {
    timestamp: new Date().toISOString(),
    aiProviders: {},
    ttsProviders: {},
    overall: 'degraded',
  };

  // Check AI providers
  console.log('\n[AI] Providers (Script Generation):');
  for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
    if (provider.enabled) {
      console.log(`  [OK] ${provider.name}: Configured`);
      results.aiProviders[key] = 'configured';
    } else {
      console.log(`  [--] ${provider.name}: Not configured`);
      results.aiProviders[key] = 'not_configured';
    }
  }

  // Check TTS providers
  console.log('\n[TTS] Providers (Audio Generation):');
  for (const [key, provider] of Object.entries(TTS_PROVIDERS)) {
    if (provider.enabled) {
      console.log(`  [OK] ${provider.name}: Configured`);
      results.ttsProviders[key] = 'configured';
    } else {
      console.log(`  [--] ${provider.name}: Not configured`);
      results.ttsProviders[key] = 'not_configured';
    }
  }

  // Overall status
  const hasAI = Object.values(results.aiProviders).some(s => s === 'configured');
  const hasTTS = Object.values(results.ttsProviders).some(s => s === 'configured');

  if (hasAI && hasTTS) {
    results.overall = 'operational';
    console.log('\n[OK] Overall: OPERATIONAL');
  } else if (hasAI) {
    results.overall = 'script_only';
    console.log('\n[WARN] Overall: SCRIPT ONLY (no TTS configured)');
  } else {
    results.overall = 'degraded';
    console.log('\n[ERROR] Overall: DEGRADED (no AI configured)');
  }

  // Required env vars
  console.log('\n[Env] Required Environment Variables:');
  console.log('  AI (at least one):');
  console.log(`    ANTHROPIC_API_KEY: ${ENV.ANTHROPIC_API_KEY ? '[OK]' : '[--]'}`);
  console.log(`    OPENAI_API_KEY: ${ENV.OPENAI_API_KEY ? '[OK]' : '[--]'}`);
  console.log(`    XAI_API_KEY: ${ENV.XAI_API_KEY ? '[OK]' : '[--]'}`);
  console.log(`    GEMINI_API_KEY: ${ENV.GEMINI_API_KEY ? '[OK]' : '[--]'}`);
  console.log('  TTS (at least one):');
  console.log(`    ELEVENLABS_API_KEY: ${ENV.ELEVENLABS_API_KEY ? '[OK]' : '[--]'}`);
  console.log(`    GEMINI_API_KEY: ${ENV.GEMINI_API_KEY ? '[OK] (TTS fallback)' : '[--]'}`);
  console.log(`    FAL_API_KEY: ${ENV.FAL_API_KEY ? '[OK]' : '[--]'}`);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────

function startServer(port = 3010) {
  const rateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

  const server = http.createServer(async (req, res) => {
    // CORS
    const origin = req.headers.origin;
    if (CORS_WHITELIST.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // Rate limiting
    const clientIp = req.socket.remoteAddress;
    if (!rateLimiter.isAllowed(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
    }

    // Health check
    if (req.url === '/health') {
      const health = await healthCheck();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(health));
    }

    // Generate podcast
    if (req.method === 'POST' && req.url === '/generate') {
      let body = '';
      let bodySize = 0;

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request too large' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const data = safeJsonParse(body, {});

          if (!data.content && !data.topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'content or topic required' }));
          }

          const content = data.content || `Topic: ${data.topic}`;
          const result = await generatePodcast(content, {
            language: data.language || 'fr',
            scriptOnly: data.scriptOnly,
            host1: data.host1,
            host2: data.host2,
            segments: data.segments,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (e) {
          console.error('[ERROR]', e.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n[Shutdown] Shutting down gracefully...');
    server.close(() => process.exit(0));
  });

  server.listen(port, () => {
    console.log(`\n[Server] Podcast Generator running on port ${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Generate: POST http://localhost:${port}/generate`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Health check
  if (args.includes('--health')) {
    await healthCheck();
    return;
  }

  // Server mode
  if (args.includes('--server')) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : 3010;
    startServer(port);
    return;
  }

  // Generate from topic
  const topicArg = args.find(a => a.startsWith('--topic='));
  if (topicArg) {
    const topic = topicArg.split('=').slice(1).join('=');
    const langArg = args.find(a => a.startsWith('--language='));
    const language = langArg ? langArg.split('=')[1] : 'fr';
    const scriptOnly = args.includes('--script-only');

    await generatePodcast(`Topic: ${topic}`, { language, scriptOnly });
    return;
  }

  // Generate from blog file
  const blogArg = args.find(a => a.startsWith('--blog='));
  if (blogArg) {
    const blogPath = blogArg.split('=').slice(1).join('=');
    const content = fs.readFileSync(blogPath, 'utf8');
    const langArg = args.find(a => a.startsWith('--language='));
    const language = langArg ? langArg.split('=')[1] : 'fr';
    const scriptOnly = args.includes('--script-only');
    const outputArg = args.find(a => a.startsWith('--output='));
    const output = outputArg ? outputArg.split('=').slice(1).join('=') : undefined;

    await generatePodcast(content, { language, scriptOnly, output });
    return;
  }

  // Audio only from existing script
  const scriptArg = args.find(a => a.startsWith('--script='));
  if (scriptArg && args.includes('--audio-only')) {
    const scriptPath = scriptArg.split('=').slice(1).join('=');
    const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

    console.log('\n[Audio] Generating audio from existing script...');
    // TODO: Implement audio-only generation from script
    console.log('[WARN] Audio-only mode not yet implemented');
    return;
  }

  // Show usage
  console.log(`
[Podcast] Podcast Generator - 3A Automation

Usage:
  node podcast-generator-resilient.cjs --health
  node podcast-generator-resilient.cjs --topic="E-commerce 2026" --language=fr
  node podcast-generator-resilient.cjs --blog="path/to/article.md" --output="podcast.mp3"
  node podcast-generator-resilient.cjs --script="path/to/script.json" --audio-only
  node podcast-generator-resilient.cjs --server --port=3010

Options:
  --health         Check provider status
  --topic          Generate from topic
  --blog           Generate from blog file
  --language       fr or en (default: fr)
  --script-only    Generate script without audio
  --output         Output file path
  --server         Start HTTP server
  --port           Server port (default: 3010)

Providers:
  AI Script:  Anthropic → OpenAI → Grok → Gemini
  TTS Audio:  ElevenLabs → Gemini TTS → fal.ai MiniMax
`);
}

main().catch(console.error);
