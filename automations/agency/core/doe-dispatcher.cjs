/**
 * 3A Automation - DOE Agentic Dispatcher
 * Framework: Directive → Orchestration → Execution
 * 
 * Purpose: Translate business "Directives" into script "Executions"
 * via AI-driven "Orchestration".
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Fallback for chalk if it's imported as an ESM-in-CJS object
const colors = {
    cyan: (txt) => `\x1b[36m${txt}\x1b[0m`,
    green: (txt) => `\x1b[32m${txt}\x1b[0m`,
    blue: (txt) => `\x1b[34m${txt}\x1b[0m`,
    yellow: (txt) => `\x1b[33m${txt}\x1b[0m`,
    red: (txt) => `\x1b[31m${txt}\x1b[0m`,
    gray: (txt) => `\x1b[90m${txt}\x1b[0m`
};
const c = (typeof chalk.red === 'function') ? chalk : colors;

// Simulation of AI Orchestration Logic (using Grok-4.1 style reasoning)
class DOEOrchestrator {
    constructor() {
        this.registryPath = path.join(__dirname, '../../automations-registry.json');
        this.registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
        this.sessionDir = path.join(__dirname, 'sessions');
        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir);
        }
    }

    /**
     * Phase 1: Planning & Parameter Extraction (Generator)
     */
    async plan(directive) {
        console.log(c.cyan(`\n[DIRECTIVE]: ${directive}`));

        // 1. Tool Selection
        const tool = await this.findBestTool(directive);
        if (!tool) {
            throw new Error("No suitable tool found for this directive.");
        }

        // 2. Parameter Extraction (Real LLM extraction)
        const params = await this.extractParams(directive, tool);

        const plan = {
            toolId: tool.id,
            toolName: tool.name_en,
            script: tool.script,
            params: params,
            reasoning: `Selected ${tool.id} because directive contains keywords matching '${tool.semantic_description || tool.name_en}'.`
        };

        console.log(c.green(`[PLANNER]: Selected ${plan.toolId} with params: ${JSON.stringify(plan.params)}`));
        return plan;
    }

    /**
     * Phase 2: Criticism & Validation (Critic)
     */
    async critique(plan, directive) {
        console.log(c.yellow(`[CRITIC]: Validating plan for directive: "${directive}"...`));

        let issues = [];

        // Factual checks: Script must exist
        if (!plan.script) issues.push("Missing script path.");

        // Contextual checks: Parameter sufficiency (Ultrathink)
        if (!plan.script) return { valid: true }; // No script to critique further if null
        const lowerScript = plan.script.toLowerCase();
        if (lowerScript.includes('google-maps-businesses') || lowerScript.includes('linkedin')) {
            const hasLocation = plan.params.some(p => p.includes('--location'));
            const hasQuery = plan.params.some(p => p.includes('--query'));

            if (!hasLocation) issues.push("Missing mandatory --location parameter.");
            if (!hasQuery) issues.push("Missing mandatory --query parameter.");
        }

        // Logic checks: Directive/Param alignment
        if (directive.toLowerCase().includes("maroc") && !plan.params.some(p => p.toLowerCase().includes("morocco") || p.toLowerCase().includes("maroc"))) {
            issues.push("Directive mentions Morocco but result location mismatch.");
        }

        if (issues.length > 0) {
            console.log(c.red(`[CRITIC]: Plan invalid. Issues: ${issues.join(' | ')}`));
            return { valid: false, issues };
        }

        console.log(c.green(`[CRITIC]: Plan validated successfully.`));
        return { valid: true };
    }

    /**
     * Phase 3: Execution & Result Persistence
     */
    execute(plan) {
        let relativeScriptPath = plan.script;
        let scriptPath = path.join(__dirname, '../../../', relativeScriptPath);

        if (!fs.existsSync(scriptPath)) {
            relativeScriptPath = 'automations/' + plan.script;
            scriptPath = path.join(__dirname, '../../../', relativeScriptPath);
        }

        if (!fs.existsSync(scriptPath)) {
            console.error(c.red(`[EXECUTION ERROR]: Script file not found: ${plan.script}`));
            return { success: false, error: "Script not found" };
        }

        console.log(c.blue(`[EXECUTION]: Running node ${relativeScriptPath} ${plan.params.join(' ')}`));

        const MarketingScience = require('./marketing-science-core.cjs');

        try {
            const output = execSync(`node ${scriptPath} --dry-run ${plan.params.join(' ')}`, { encoding: 'utf8' });
            const result = { success: true, output: output.trim() };
            this.saveSession(plan, result);

            // Session 177: Universal Telemetry
            MarketingScience.trackV2('DOE_EXECUTION_SUCCESS', {
                sector: 'OPERATIONS',
                toolId: plan.toolId,
                script: plan.script,
                params: plan.params
            });

            console.log(c.gray(output));
            return result;
        } catch (error) {
            const result = { success: false, error: error.message };
            this.saveSession(plan, result);

            // Session 177: Universal Telemetry
            MarketingScience.trackV2('DOE_EXECUTION_FAILURE', {
                sector: 'OPERATIONS',
                toolId: plan.toolId,
                error: error.message
            });

            console.error(c.red(`[EXECUTION ERROR]: ${error.message}`));
            return result;
        }
    }

    /**
     * Utilities
     */
    async extractParams(directive, tool) {
        // --- UPGRADED SOVEREIGN EXTRACTION (v2.0) ---
        // Leveraging the Recursive Engine (spawn_agent.js) for high-precision extraction
        const spawnScript = path.resolve(__dirname, '../../../skills/dev-orchestrator/scripts/spawn_agent.js');
        const prompt = `You are the DOE Parameter Extractor.
Directive: "${directive}"
Tool: ${tool.name_en} (${tool.id})
Script: ${tool.script}

Task: Extract all necessary CLI parameters for this script based on the directive.
Available Common Parameters: --location, --query, --limit, --keywords, --language, --publish, --distribute.

Output format: Return ONLY a JSON array of strings, e.g., ["--location=Paris", "--query=Bakeries"].
No explanations.`;

        try {
            console.log(colors.gray(`[DOE] Spawning sub-agent for param extraction...`));
            const spawnCmd = `node "${spawnScript}" --prompt "${prompt.replace(/"/g, '\\"')}" --depth 0`;
            const rawOutput = execSync(spawnCmd, { encoding: 'utf8', cwd: path.join(__dirname, '../../..') });

            // Clean output in case LLM adds markdown or filler
            let cleaned = rawOutput.trim();
            const jsonMatch = cleaned.match(/\[.*\]/s);
            if (jsonMatch) {
                try {
                    const params = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(params)) return params;
                } catch (e) {
                    console.warn(colors.yellow(`[DOE] JSON Parse error on sub-agent output: ${e.message}`));
                }
            }
        } catch (e) {
            console.warn(colors.yellow(`[DOE] Sovereign extraction fallback: ${e.message}`));
        }

        const lowerDirective = directive.toLowerCase();
        const params = [];

        // Simple heuristic fallback
        if (tool.id && (tool.id.includes('maps') || tool.id.includes('linkedin'))) {
            const locations = ['maroc', 'france', 'dubai', 'usa', 'paris', 'casablanca'];
            locations.forEach(loc => {
                if (lowerDirective.includes(loc)) params.push(`--location=${loc}`);
            });

            if (lowerDirective.includes('leads')) {
                const words = lowerDirective.split(' ');
                const leadsIndex = words.indexOf('leads');
                if (leadsIndex > 0) {
                    params.push(`--query="${words[leadsIndex - 1]}"`);
                }
            }
        }

        return params;
    }


    async findBestTool(directive) {
        console.log(colors.gray(`[DOE] Semantic Tool Matching for: "${directive}"...`));

        // Use Recursive Engine (spawn_agent.js) for high-precision tool selection
        const spawnScript = path.resolve(__dirname, '../../../skills/dev-orchestrator/scripts/spawn_agent.js');
        const toolsMinimal = this.registry.automations.map(a => ({ id: a.id, name: a.name_en, desc: a.semantic_description }));

        const prompt = `You are the DOE Tool Selector.
Directive: "${directive}"
Registry Size: ${toolsMinimal.length} tools.

Task: Select the absolute best tool ID from the registry for this directive.
Output format: Return ONLY the tool ID string, e.g., "google-maps-scraper". No explanation.

TOOL LIST:
${JSON.stringify(toolsMinimal, null, 2)}`;

        try {
            const spawnCmd = `node "${spawnScript}" --prompt "${prompt.replace(/"/g, '\\"')}" --depth 0`;
            const rawOutput = execSync(spawnCmd, { encoding: 'utf8', cwd: path.join(__dirname, '../../..') });
            const toolId = rawOutput.trim().replace(/['"`]/g, '');

            const tool = this.registry.automations.find(a => a.id === toolId);
            if (tool) {
                console.log(colors.green(`[DOE] AI Selected Tool: ${toolId}`));
                return tool;
            }
        } catch (e) {
            console.warn(colors.yellow(`[DOE] Tool selection fallback to heuristics: ${e.message}`));
        }

        // --- Heuristic Fallback (Legacy Logic) ---
        const lowerDirective = directive.toLowerCase();
        const matches = this.registry.automations
            .map(a => {
                let score = 0;
                const name = a.name_en || "";
                const semanticDesc = a.semantic_description ? a.semantic_description.toLowerCase() : "";

                if (lowerDirective.includes('maps') && a.id.includes('maps')) score += 10;
                if (lowerDirective.includes('linkedin') && a.id.includes('linkedin')) score += 10;
                if (semanticDesc && semanticDesc.includes(lowerDirective)) score += 8;
                if (name.toLowerCase().includes(lowerDirective)) score += 5;

                return { tool: a, score };
            })
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score);

        return matches.length > 0 ? matches[0].tool : null;
    }

    saveSession(plan, result) {
        const sessionId = `session_${Date.now()}.json`;
        const sessionData = {
            timestamp: new Date().toISOString(),
            plan,
            result
        };
        fs.writeFileSync(path.join(this.sessionDir, sessionId), JSON.stringify(sessionData, null, 2));
        console.log(c.gray(`[MEMORY]: Session saved to ${sessionId}`));
    }
}

// CLI Usage
if (require.main === module) {
    const orchestrator = new DOEOrchestrator();
    const directive = process.argv.slice(2).join(' ') || "Find SaaS leads in Maroc on Maps";

    (async () => {
        try {
            const plan = await orchestrator.plan(directive);
            const validation = await orchestrator.critique(plan, directive);

            if (validation.valid) {
                orchestrator.execute(plan);
            } else {
                console.log(c.red("[DOE]: Aborting execution due to critic issues."));
            }
        } catch (err) {
            console.error(c.red(`[FATAL]: ${err.message}`));
        }
    })();
}

module.exports = DOEOrchestrator;
