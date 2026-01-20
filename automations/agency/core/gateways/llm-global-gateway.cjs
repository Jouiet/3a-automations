const { GoogleGenerativeAI } = require("@google/generative-ai");

class LLMGateway {
    constructor() {
        this.geminiKey = process.env.GEMINI_API_KEY;
        this.anthropicKey = process.env.ANTHROPIC_API_KEY;
        this.xaiKey = process.env.XAI_API_KEY; // Grok
        this.openaiKey = process.env.OPENAI_API_KEY; // gpt-5.2

        if (this.geminiKey) {
            this.genAI = new GoogleGenerativeAI(this.geminiKey);
            this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        }
    }

    async generate(provider, prompt) {
        console.log(`[LLM] Requesting: ${provider.toUpperCase()}...`);
        try {
            switch (provider.toLowerCase()) {
                case 'gemini':
                    return await this._generateGemini(prompt);
                case 'claude':
                    return await this._fetchClaude(prompt);
                case 'grok':
                    return await this._fetchGrok(prompt);
                case 'openai':
                    return await this._fetchOpenAI(prompt);
                default:
                    throw new Error(`Unknown Provider: ${provider}`);
            }
        } catch (e) {
            console.error(`[LLM] ${provider.toUpperCase()} ERROR: ${e.message}`);
            throw e;
        }
    }

    /**
     * FRONTIER FALDOWN PROCOCOL (Resilient Chain)
     * Chain: Gemini 3 -> Claude 4.5 -> GPT-5.2 -> Grok 4.1
     */
    async generateWithFallback(prompt) {
        const chain = ['claude', 'openai', 'grok', 'gemini'];
        let lastError = null;

        for (const provider of chain) {
            try {
                return await this.generate(provider, prompt);
            } catch (e) {
                console.warn(`[LLM] FALDOWN: ${provider.toUpperCase()} failed. Trying next in chain...`);
                lastError = e;
            }
        }

        throw new Error(`[LLM] CRITICAL: All Frontier models in Faldown chain failed. Last Error: ${lastError?.message}`);
    }

    async _generateGemini(prompt) {
        if (!this.genAI) throw new Error("GEMINI_API_KEY missing");
        let attempt = 0;
        while (attempt < 3) {
            try {
                const gemResult = await this.geminiModel.generateContent(prompt);
                const gemResponse = await gemResult.response;
                return gemResponse.text();
            } catch (e) {
                if (e.message.includes('503') || e.message.includes('overloaded')) {
                    attempt++;
                    console.warn(`[LLM] Gemini Overloaded (Attempt ${attempt}/3). Retrying...`);
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                    continue;
                }
                throw e;
            }
        }
        throw new Error("Gemini consistently overloaded.");
    }

    async _fetchClaude(prompt) {
        if (!this.anthropicKey) throw new Error("ANTHROPIC_API_KEY missing");
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-sonnet-4.5",
                max_tokens: 4096,
                messages: [{ role: "user", content: prompt }]
            })
        });
        return this._handleFetchResponse(res, 'Claude');
    }

    async _fetchGrok(prompt) {
        if (!this.xaiKey) throw new Error("XAI_API_KEY missing");
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.xaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "grok-4-1-fast-reasoning",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await this._handleFetchResponse(res, 'Grok');
        return data.choices[0].message.content;
    }

    async _fetchOpenAI(prompt) {
        if (!this.openaiKey) throw new Error("OPENAI_API_KEY missing");
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-5.2",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await this._handleFetchResponse(res, 'OpenAI');
        return data.choices[0].message.content;
    }

    async _handleFetchResponse(res, name) {
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`${name} API Error (${res.status}): ${err}`);
        }
        const data = await res.json();
        if (name === 'Claude') return data.content[0].text;
        return data;
    }
}

module.exports = new LLMGateway();


