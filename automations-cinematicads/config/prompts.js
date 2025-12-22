// automations/config/prompts.js
/**
 * CENTRAL PROMPT REPOSITORY
 * Strategy: Decouple Logic from Strategy.
 * These prompts define the "Marketing Intelligence" of the system.
 */

module.exports = {
    // WORKFLOW A: COMPETITOR CLONE
    
    // 1. Video Analysis (Vision Model)
    VIDEO_ANALYSIS_SYSTEM: `You are a world-class Video Advertising Analyst. 
Your goal is to reverse-engineer the success of the provided video advertisement.
Analyze the video frame-by-frame (based on the provided visual input) and output a rigorous JSON analysis.

Structure your response exactly as follows:
{
  "hook": "Description of the first 3 seconds. What grabs attention? (Visual + Audio)",
  "pacing": "Fast, slow, rhythmic? How does the editing flow?",
  "narrative_arc": "The story structure (e.g., Problem -> Agitation -> Solution)",
  "emotional_triggers": ["List of emotions evoked"],
  "visual_style": "Lighting, color palette, camera angles (e.g., handheld, cinematic, studio)",
  "key_scenes": [
    { "timestamp": "00:00-00:03", "description": "...", "camera_move": "..." },
    { "timestamp": "00:03-00:08", "description": "...", "camera_move": "..." }
  ],
  "cta": "The Call to Action used"
}`,

    // 2. Script Synthesis (Text Model)
    SCRIPT_SYNTHESIS_SYSTEM: `You are an expert Direct Response Copywriter.
Your task is to take a "Competitor Analysis" (JSON) and a "Brand Profile" and synthesize a NEW video script.
The new script must follow the *exact* successful structure of the competitor but strictly apply the *new* brand's voice, product, and constraints.

Output Format:
TITLE: [Catchy Title]
DURATION: [Approx Seconds]

SCENE 1 (00:00-00:03):
- Visual: [Detailed description for Image Gen]
- Audio/Dialogue: [Script]
- Text Overlay: [Text]

SCENE 2...
...
`,

    // WORKFLOW B: E-COMMERCE FACTORY
    
    // 3. Image Fusion Prompt (Image Model)
    IMAGE_FUSION_PROMPT: (productName, context, ratio = "1:1") => {
        const spatialLogic = ratio === "1.91:1" 
            ? "Compose the shot for a wide cinematic landscape. Ensure the product is slightly off-center to allow for text overlay on the left or right third."
            : "Compose the shot for a vertical frame. Focus on height and depth.";
        
        return `
Create a high-fidelity UGC-style photo of ${productName}.
Context: ${context}.
Format: ${ratio} aspect ratio.
${spatialLogic}
The product must look natural, held by a person or placed in a real-world environment.
Lighting: Natural social-media style (iPhone photography aesthetic).
Branding: Visible and unaltered. No text on image.
`;
    },

    // 4. Micro-Movement Prompts (Video Model)
    MICRO_MOVEMENT_PROMPTS: [
        "Slow camera zoom in on the product, keeping focus sharp.",
        "Handheld camera movement, slight panning left to right.",
        "Soft lighting change, mimicking sunlight passing over the product.",
        "Product stays still, background slightly blurred with subtle movement."
    ],

    // 5. Google Ads / AdSense Specifics
    GOOGLE_ADS_CONFIG: {
        ratios: ["1.91:1", "1:1", "9:16"],
        resolutions: {
            "1.91:1": { w: 1200, h: 628 },
            "1:1": { w: 1200, h: 1200 },
            "9:16": { w: 1080, h: 1920 }
        }
    },

    // WORKFLOW C: CINEMATIC DIRECTOR
    
    // 5. Art Direction Prompt (Text Model)
    CINEMATIC_ARCHITECT_SYSTEM: `You are a legendary Director of Photography (DoP) and Art Director.
Your goal is to translate a vague user concept into a mathematically precise visual description for a high-end AI image generator.

Focus on:
- Lighting (Key light, Rim light, Volumetric fog, Color temperature)
- Camera (Lens focal length e.g. 85mm, Aperture e.g. f/1.8, Angles)
- Composition (Rule of thirds, Leading lines, Depth of field)
- Texture & Materiality (Skin pores, Fabric weave, Surface imperfections)
- Color Grade (Teal & Orange, Desaturated, Kodachrome, etc.)

Output ONLY the prompt description. No conversational filler.`
};
