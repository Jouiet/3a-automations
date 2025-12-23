// automations-cinematicads/config/prompts.js
/**
 * CENTRAL PROMPT REPOSITORY - OPTIMIZED FOR 2025
 *
 * Best Practices Applied:
 * - Gemini 3 Pro: Concise, direct, temperature 1.0, thinking_level support
 * - Imagen 4: Narrative descriptions, lens specs, lighting, composition
 * - Veo 3: 100-200 words, subject+action+setting+specs+style, audio prompting
 *
 * Sources:
 * - https://ai.google.dev/gemini-api/docs/gemini-3
 * - https://deepmind.google/models/veo/prompt-guide/
 * - https://ai.google.dev/gemini-api/docs/imagen-prompt-guide
 *
 * @version 2.0.0
 * @date 2025-12-23
 */

module.exports = {
  // ============================================================================
  // GEMINI 3 PRO CONFIGURATION
  // ============================================================================

  GEMINI_CONFIG: {
    model: 'gemini-3-pro-preview',
    thinking_level: 'high',  // high (default), medium, low, minimal
    temperature: 1.0,        // MUST stay at 1.0 per Google docs
    max_output_tokens: 8192
  },

  // ============================================================================
  // WORKFLOW A: COMPETITOR CLONE (Video Analysis)
  // ============================================================================

  // Gemini 3 Pro Vision - Concise and direct per best practices
  VIDEO_ANALYSIS_SYSTEM: `Analyze this video advertisement. Output JSON only.

<task>
Reverse-engineer the video's success formula by extracting:
</task>

<output_format>
{
  "hook": "First 3 seconds - visual + audio attention grabber",
  "pacing": "Editing rhythm (fast/slow/rhythmic)",
  "narrative_arc": "Story structure (Problem → Agitation → Solution)",
  "emotional_triggers": ["emotion1", "emotion2"],
  "visual_style": {
    "lighting": "Type and direction",
    "color_palette": "Dominant colors",
    "camera": "Angles and movement style"
  },
  "key_scenes": [
    {
      "timestamp": "00:00-00:03",
      "description": "What happens",
      "camera_move": "Dolly/Pan/Zoom/Static",
      "audio": "Dialogue or sound"
    }
  ],
  "cta": "Call to action text and style"
}
</output_format>`,

  // ============================================================================
  // WORKFLOW A: SCRIPT SYNTHESIS
  // ============================================================================

  SCRIPT_SYNTHESIS_SYSTEM: `You are a Direct Response Copywriter.

<task>
Synthesize a NEW video script using:
1. Competitor Analysis JSON (structure to replicate)
2. Brand Profile (voice, product, constraints)
</task>

<rules>
- Match competitor's proven structure exactly
- Apply new brand's voice and product
- Include camera movements for each scene
- Specify audio: dialogue, music, sound effects
</rules>

<output_format>
TITLE: [Catchy hook-driven title]
DURATION: [X seconds]
STYLE: [Realistic/Cinematic/UGC]

SCENE 1 (00:00-00:03):
- Camera: [Wide establishing shot, dolly in]
- Visual: [Detailed description for Imagen 4]
- Audio: [Dialogue in quotes OR sound effect]
- Text Overlay: [On-screen text if any]
- Transition: [Cut/Dissolve/Swipe]

SCENE 2 (00:03-00:08):
...
</output_format>`,

  // ============================================================================
  // WORKFLOW B: E-COMMERCE FACTORY (Imagen 4)
  // ============================================================================

  // Imagen 4 - Narrative descriptions with technical specs per Google docs
  IMAGE_FUSION_PROMPT: (productName, context, ratio = '1:1') => {
    const compositions = {
      '1.91:1': 'Wide cinematic landscape composition. Product positioned using rule of thirds on left or right, leaving negative space for text overlay.',
      '1:1': 'Square format, product centered with balanced composition. Shallow depth of field isolates subject.',
      '9:16': 'Vertical portrait composition. Product fills lower two-thirds, environment extends upward. Leading lines draw eye to product.',
      '16:9': 'Cinematic widescreen. Product off-center with environmental storytelling.',
      '4:3': 'Classic format. Product prominent with contextual background.'
    };

    return `A photorealistic UGC-style photograph of ${productName} in ${context}.

Technical specifications: Shot on 85mm portrait lens at f/2.8 aperture. Natural golden hour lighting from camera-left creates soft shadows. 8K resolution with fine detail rendering.

${compositions[ratio] || compositions['1:1']}

The product appears naturally held by a person or placed authentically in a real-world environment. iPhone photography aesthetic with natural skin tones and textures. Product branding visible and unaltered.

Style: Candid social media moment, not studio posed. Lifestyle authenticity.
Aspect ratio: ${ratio}
No text overlays or watermarks.`;
  },

  // ============================================================================
  // WORKFLOW B: VEO 3 VIDEO GENERATION
  // ============================================================================

  // Veo 3 - 100-200 words, subject+action+setting+specs+style per Google docs
  VIDEO_GENERATION_PROMPT: (productName, style, duration = 8) => {
    return `Style: Photorealistic advertisement, cinematic film look.

Subject: ${productName} as the hero product, detailed and sharp.

Action sequence: The camera begins with a wide establishing shot, then smoothly dollies in toward the product over ${duration} seconds. Subtle product rotation reveals different angles. The lighting shifts naturally as if sunlight passes through a window.

Setting: Modern, minimalist environment with soft neutral tones. Clean surfaces with subtle reflections. Depth of field keeps product sharp while background has gentle bokeh.

Camera: Shot on anamorphic lens, 35mm equivalent. Smooth cinematic motion, no handheld shake. Professional steadicam movement.

Lighting: Soft key light from 45-degrees camera-left. Subtle rim light separates product from background. Natural color temperature around 5600K.

Audio: Gentle ambient room tone. No music. Subtle product handling sounds if applicable.

Style reference: ${style || 'Apple product advertisement aesthetic'}.

(no subtitles)`;
  },

  // Veo 3 - Micro-movement prompts optimized
  MICRO_MOVEMENT_PROMPTS: [
    'Slow cinematic zoom in on the product, maintaining sharp focus throughout. Camera moves from medium shot to close-up over 4 seconds. Subtle lighting shift as if cloud passes. (no subtitles)',

    'Gentle orbit around the product, 45-degree arc from left to right. Product remains centered and in focus. Background smoothly blurs with motion. Professional steadicam quality. (no subtitles)',

    'Static wide shot, then product subtly rotates to reveal different angle. Soft rim light catches edges. Ambient sound of quiet room. Duration 6 seconds. (no subtitles)',

    'Dolly out from extreme close-up on product detail to reveal full product in context. Rack focus transition. Cinematic 24fps motion blur. (no subtitles)'
  ],

  // ============================================================================
  // WORKFLOW C: CINEMATIC DIRECTOR (Art Direction)
  // ============================================================================

  // Gemini 3 Pro - Concise art direction for Imagen 4
  CINEMATIC_ARCHITECT_SYSTEM: `You are a Director of Photography translating concepts into Imagen 4 prompts.

<task>
Convert user concept into precise visual description.
</task>

<required_elements>
1. Lighting: Key light direction, rim light, volumetric fog, color temperature (Kelvin)
2. Camera: Focal length (24mm/35mm/50mm/85mm/135mm), aperture (f/1.4-f/16), angle
3. Composition: Rule of thirds placement, leading lines, depth layers
4. Texture: Material details (skin pores, fabric weave, metal reflection)
5. Color grade: Reference (Teal & Orange, Kodachrome, Desaturated, etc.)
</required_elements>

<output>
Single descriptive paragraph, 80-120 words. No preamble. Technical and specific.
</output>`,

  // ============================================================================
  // IMAGEN 4 CONFIGURATION
  // ============================================================================

  IMAGEN_CONFIG: {
    model: 'imagen-4',
    aspect_ratios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: {
      '1K': { description: 'Standard quality' },
      '2K': { description: 'High quality' },
      '4K': { description: 'Ultra quality - recommended for hero images' }
    },
    max_reference_images: 14,
    max_human_subjects: 5
  },

  // ============================================================================
  // VEO 3 CONFIGURATION
  // ============================================================================

  VEO_CONFIG: {
    model: 'veo-3.1',
    optimal_prompt_length: { min: 100, max: 200, unit: 'words' },
    supported_styles: ['realistic', 'cinematic', 'animated', 'stop-motion', 'documentary'],
    audio_prompting: true,
    dialogue_format: 'Character says: [exact words]',
    sequencing: 'Supports "this then that" action chains',
    character_consistency: 'Maintain detailed description across generations'
  },

  // ============================================================================
  // GOOGLE ADS SPECIFICATIONS
  // ============================================================================

  GOOGLE_ADS_CONFIG: {
    ratios: ['1.91:1', '1:1', '9:16'],
    resolutions: {
      '1.91:1': { w: 1200, h: 628, name: 'Landscape' },
      '1:1': { w: 1200, h: 1200, name: 'Square' },
      '9:16': { w: 1080, h: 1920, name: 'Portrait/Stories' }
    },
    video_specs: {
      duration: { min: 6, max: 60, optimal: 15 },
      format: 'MP4',
      codec: 'H.264'
    }
  },

  // ============================================================================
  // GROK VOICE AI PROMPTS
  // ============================================================================

  GROK_VOICE_SYSTEM: `You are a voice AI assistant for 3A Automation.

<identity>
- Expert automation consultant for SMBs and e-commerce
- 77 automations available across 10 categories
- Primary tools: Klaviyo, Shopify, GA4/GTM, n8n
</identity>

<style>
- Responses: 2-3 sentences maximum
- Tone: Professional but approachable
- Always offer free audit
- No technical jargon
</style>

<goal>
1. Qualify prospect (sector, needs, pain points)
2. Propose relevant automation solution
3. Guide toward booking or contact form
</goal>`,

  // ============================================================================
  // PROMPT QUALITY CRITERIA (for feedback tracker)
  // ============================================================================

  QUALITY_CRITERIA: {
    pertinence: { weight: 0.25, description: 'Matches the request accurately' },
    qualite: { weight: 0.20, description: 'Technical quality (resolution, composition)' },
    coherence: { weight: 0.20, description: 'Matches brand colors and style' },
    utilisabilite: { weight: 0.20, description: 'Usable directly without editing' },
    originalite: { weight: 0.15, description: 'Distinctive, not generic' }
  },

  VALIDATION_THRESHOLD: 0.80  // 80% score required for production use
};
