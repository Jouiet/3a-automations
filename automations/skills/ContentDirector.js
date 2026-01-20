/**
 * Content Director Skill (The Editor-in-Chief)
 * Capability: "plan_content", "generate_blog_post"
 * Wraps: `agency/core/content-strategist-agentic.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

class ContentDirectorSkill {
    /**
     * Analyze GSC Gaps and generate a content plan (Governance Artifact)
     */
    async plan(project = '3a-automation') {
        console.log(`[ContentDirector] Planning Content Strategy for ${project}...`);
        const scriptPath = path.join(__dirname, '../agency/core/content-strategist-agentic.cjs');

        return new Promise((resolve) => {
            // Run in Agentic Mode to analyze gaps
            const proc = spawn('node', [scriptPath, '--agentic']);
            let stdout = '';

            proc.stdout.on('data', d => stdout += d.toString());
            proc.on('close', code => {
                resolve({
                    status: 'success',
                    log: stdout,
                    gaps_identified: stdout.includes('GSC Gap Analysis'),
                    plan_path: 'governance/proposals/content-plan-LATEST.md' // Implicit via script
                });
            });
        });
    }

    /**
     * Direct execution of a specific blog post
     */
    async produce(topic) {
        console.log(`[ContentDirector] Producing content for: "${topic}"...`);
        const scriptPath = path.join(__dirname, '../agency/core/blog-generator-resilient.cjs');

        return new Promise((resolve) => {
            const proc = spawn('node', [scriptPath, `--topic="${topic}"`, '--agentic']);
            let stdout = '';
            proc.stdout.on('data', d => stdout += d.toString());
            proc.on('close', code => {
                resolve({
                    status: 'success',
                    topic,
                    preview: stdout.substring(0, 200) + "..."
                });
            });
        });
    }
}
module.exports = new ContentDirectorSkill();
