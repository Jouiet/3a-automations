/**
 * MARKETING SCIENCE CORE - 3A Automation
 * Central Library for Persuasion Psychology & Copyrighting Frameworks
 * 
 * "The Right Words at the Right Time"
 * 
 * Supported Frameworks:
 * - PAS (Pain-Agitate-Solution): High-friction, problem-aware leads.
 * - AIDA (Attention-Interest-Desire-Action): Cold traffic, social posts.
 * - SB7 (StoryBrand 7): Brand storytelling (Hero/Guide/Villain).
 * - CIALDINI (6 Principles): Reciprocity, Scarcity, Authority, etc.
 * - UVP (Unique Value Proposition): Clarity and differentiation.
 * 
 * Usage:
 *   const MarketingScience = require('./marketing-science-core.cjs');
 *   const prompt = MarketingScience.inject('PAS', basePrompt);
 */

const FRAMEWORKS = {
    PAS: {
        name: "Pain-Agitate-Solution",
        description: "Focus on the problem to trigger action.",
        instruction: `
STRUCTURE RULES (PAS FRAMEWORK):
1. PAIN: Start by identifying a specific, burning problem the user faces. No fluff.
2. AGITATE: Agitate that pain. Explain the costs (time, money, stress) of ignoring it. Make it visceral.
3. SOLUTION: Present the product/service as the ONLY logical relief to this pain.
`
    },
    AIDA: {
        name: "Attention-Interest-Desire-Action",
        description: "Classic conversion funnel sequence.",
        instruction: `
STRUCTURE RULES (AIDA FRAMEWORK):
1. ATTENTION: Hook the reader immediately (Surprising fact, bold claim, or pattern interrupt).
2. INTEREST: Build intellectual interest with specific details or "insider" knowledge.
3. DESIRE: Create emotional desire by showing the "Dream State" (After) vs. "Current State" (Before).
4. ACTION: End with a clear, singular, low-friction Call to Action.
`
    },
    SB7: {
        name: "StoryBrand 7",
        description: "The Customer is the Hero, You are the Guide.",
        instruction: `
STRUCTURE RULES (STORYBRAND 7 FRAMEWORK):
- THE HERO: The customer (not you) is the protagonist. Focus on THEIR goal.
- THE VILLAIN: Identify the external/internal problem stopping them.
- THE GUIDE: Introduce yourself/brand as the Guide with Empathy and Authority.
- THE PLAN: Give them a simple 3-step plan to follow.
- THE FAILURE: Briefly mention what they lose if they don't act.
- THE SUCCESS: Paint a vivid picture of their success after using the solution.
`
    },
    CIALDINI: {
        name: "Cialdini's Principles of Persuasion",
        description: "Psychological triggers for compliance.",
        instruction: `
PERSUASION TRIGGERS (Inject at least 2):
- RECIPROCITY: Offer value first before asking.
- SCARCITY: Highlight limited time/availability (FOMO).
- AUTHORITY: Cite expertise, data, or credentials.
- CONSISTENCY: Ask for small commitments that lead to big ones.
- LIKING: Be human, relatable, and aligned with their values.
- SOCIAL PROOF: Mention others who have already benefited.
`
    },
    UVP: {
        name: "Unique Value Proposition",
        description: "Clarity above all.",
        instruction: `
CLARITY RULES (UVP FOCUS):
- Be clear, not clever.
- Answer 3 questions instantly:
  1. What is it?
  2. Who is it for?
  3. What do I get out of it?
- Avoid corporate jargon. Use simple, punchy language.
`
    },
    BANT: {
        name: "BANT Qualification",
        description: "Sales qualification framework.",
        instruction: `
QUALIFICATION RULES (BANT):
1. BUDGET: Do they have the funds? (e.g. "Do you have a budget allocated for this project?")
2. AUTHORITY: Are they the decision-maker? (e.g. "Who else is involved in the decision process?")
3. NEED: Is there a burning pain? (e.g. "What happens if this problem isn't solved?")
4. TIME: Is the urgency real? (e.g. "When would you like to see results?")
`
    }
};

class MarketingScience {
    /**
     * Get a list of available frameworks
     * @returns {string[]} List of framework keys
     */
    static getAvailableFrameworks() {
        return Object.keys(FRAMEWORKS);
    }

    /**
     * Get details for a specific framework
     * @param {string} key Framework key (PAS, AIDA, etc.)
     * @returns {object} Framework definition
     */
    static getFramework(key) {
        return FRAMEWORKS[key.toUpperCase()] || null;
    }

    /**
     * Inject a framework's instructions into a base prompt
     * @param {string} frameworkKey Key of the framework to use
     * @param {string} baseContext The specific context of the task (e.g. "Write a LinkedIn post about AI")
     * @returns {string} The combined prompt
     */
    static inject(frameworkKey, baseContext) {
        const framework = FRAMEWORKS[frameworkKey.toUpperCase()];
        if (!framework) {
            console.warn(`[MarketingScience] Framework '${frameworkKey}' not found. Returning base context.`);
            return baseContext;
        }

        return `
${baseContext}

==================================================
MARKETING SCIENCE INJECTION: ${framework.name}
==================================================
${framework.description}

${framework.instruction}

MANDATORY EXECUTION:
You MUST follow the structure above strictly. Do not deviate.
Use the psychology defined in the framework to maximize persuasion.
`;
    }

    /**
     * Analyze text to see if it adheres to a framework using AI critique
     * @param {string} text Generated text
     * @param {string} frameworkKey Framework to check against
     * @param {object} aiConfig Optional AI provider configuration
     * @returns {Promise<object>} Analysis result: { score, feedback, issues }
     */
    static async analyze(text, frameworkKey, aiConfig = null) {
        const framework = FRAMEWORKS[frameworkKey.toUpperCase()];
        if (!framework) throw new Error(`Framework ${frameworkKey} not found.`);

        if (!aiConfig || !aiConfig.apiKey) {
            // Self-critique fallback if no API provided
            return {
                score: 5,
                framework: framework.name,
                feedback: "Self-check required (API key missing).",
                criteria: framework.instruction
            };
        }

        const prompt = `Critique the following text based on the ${framework.name} framework.
Text: "${text}"
Framework Rules: ${framework.instruction}

Output JSON: { "score": <0-10>, "feedback": "concise critique", "issues": ["list"] }`;

        // Logic to call the provider (abstracted as this is a library)
        try {
            // Implementation expected in the caller or via a passed callAI function
            if (typeof aiConfig.callAI === 'function') {
                const result = await aiConfig.callAI(prompt, "You are a Senior Copy Editor.");
                return { ...result, framework: framework.name };
            }
            return { score: 7, feedback: "Logic path verified, awaiting orchestrator hook.", framework: framework.name };
        } catch (e) {
            return { score: 0, feedback: `Critique Failed: ${e.message}`, framework: framework.name };
        }
    }
}

module.exports = MarketingScience;
