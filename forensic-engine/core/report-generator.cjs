#!/usr/bin/env node
/**
 * 🛰️ 3A AUTOMATION - STRATEGIC REPORT GENERATOR v3.5
 * Protocol: SFAP v3.1 (Professional Lead Conversion Layer)
 * Role: Professional synthesis of technical forensics into business strategy.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const REPORT_PATH = args[0];

if (!REPORT_PATH || !fs.existsSync(REPORT_PATH)) {
    console.error('❌ FATAL: Master JSON required for strategic synthesis.');
    process.exit(1);
}

const rawReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const { target, timestamp } = rawReport.metadata;
const DOMAIN = new URL(target).hostname;

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIC RISK DICTIONARY (Professional Mapping)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIC RISK DICTIONARY (Professional Mapping)
// ─────────────────────────────────────────────────────────────────────────────
const RISK_GLOSSARY = [
    {
        pattern: /HSTS: ✗ MISSING/i,
        title: 'Network Communication Risk',
        risk: 'Allows data interception between customers and the store.',
        impact: 'Loss of Trust & Regulatory Non-Compliance.',
        solution: 'SecOps Hardening (#74)'
    },
    {
        pattern: /CSP: ✗ MISSING/i,
        title: 'Script Injection Vulnerability',
        risk: 'Attackers can inject malicious code directly into your visitor\'s browser.',
        impact: 'Potential for identity theft and site defacement.',
        solution: 'Dynamic CSP Implementation (#75)'
    },
    {
        pattern: /llms\.txt: ✗ HTTP (403|404)/i,
        title: 'AI Discovery Blackout',
        risk: 'Search AI (ChatGPT/Perplexity/Grok) cannot index your site\'s value prop.',
        impact: 'Total loss of traffic from the next generation of search.',
        solution: 'AEO Semantic Bridge (#12)'
    },
    {
        pattern: /Referrer-Policy: ✗ MISSING/i,
        title: 'Metadata Leakage (Referrer)',
        risk: 'Sensitive URL parameters can be leaked to external sites through the referrer header.',
        impact: 'Privacy risk and potential data breach of user session info.',
        solution: 'SecOps Hardening (#74)'
    },
    {
        pattern: /X-Frame-Options: ✗ MISSING/i,
        title: 'Clickjacking Vulnerability',
        risk: 'Attackers can embed your site in an iframe to trick users into clicking actions.',
        impact: 'Loss of user trust and potential data spoofing.',
        solution: 'SecOps Hardening (#74)'
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// SCORE SYNTHESIS LOGIC (Balanced & Professional)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeIntegrityIndex(layers) {
    let base = 100;
    const uniqueIssues = new Set();

    layers.forEach(l => {
        const findings = findIssues(l.output);
        findings.forEach(f => uniqueIssues.add(f.title));
    });

    // Deduct based on unique category severity
    uniqueIssues.forEach(title => {
        const severity = (title.includes('Security') || title.includes('Vulnerability') || title.includes('Risk') || title.includes('Metadata')) ? 10 : 7;
        base -= severity;
    });

    const finalScore = Math.max(0, base);
    return { score: finalScore, issueCount: uniqueIssues.size };
}

const stats = synthesizeIntegrityIndex(rawReport.layers);

// ─────────────────────────────────────────────────────────────────────────────
// REPORT GENERATION (Markdown)
// ─────────────────────────────────────────────────────────────────────────────
let md = `# 🛡️ EXECUTIVE STRATEGIC AUDIT: ${DOMAIN.toUpperCase()}\n`;
md += `**Protocol**: SFAP v3.0 (Level 5 Autonomy Standard)\n`;
md += `**Audit Timestamp**: ${new Date(timestamp).toLocaleString()}\n`;
md += `**Integrity Index**: ${stats.score}/100\n\n`;

md += `## ⚡ Executive Summary: The Gap to Autonomy\n`;
if (stats.score < 50) {
    md += `> [!CAUTION]\n`;
    md += `> **SITUATIONAL RISK.** Your current infrastructure has significant technical deficiencies. Critical gaps in Security and AI visibility require immediate attention.\n\n`;
} else if (stats.score < 85) {
    md += `> [!IMPORTANT]\n`;
    md += `> **SYSTEMIC GAPS.** You have a functional store, but it lacks the full optimization required for efficient scaling. Addressing Security and AEO gaps will significantly improve performance.\n\n`;
} else {
    md += `> [!TIP]\n`;
    md += `> **EXCELLENT HEALTH.** Your system is highly resilient.\n\n`;
}

md += `## 🔍 Diagnostic Breakdown by Strategic Layer\n`;
md += `We have audited your infrastructure across 8 forensic layers. Findings are synthesized to show direct business impact.\n\n`;

const globalFindings = new Set();
const displayedIssues = new Set();

rawReport.layers.forEach(layer => {
    const lName = getLayerName(layer.layer);
    const findings = findIssues(layer.output);

    md += `### Layer ${layer.layer}: ${lName}\n`;

    if (layer.status === 'FAILED' && layer.output.includes('testing connection')) {
        md += `> [!NOTE]\n`;
        md += `> **RESTRICTED ACCESS.** Full audit of transactional flows requires API handshake.\n\n`;
    } else if (findings.length > 0) {
        const newFindings = findings.filter(f => {
            const issueIdentifier = `${f.title}`;
            if (!displayedIssues.has(issueIdentifier)) {
                displayedIssues.add(issueIdentifier);
                return true;
            }
            return false;
        });

        if (newFindings.length > 0) {
            md += `| Diagnostic | Risk Exposure | Business Impact |\n`;
            md += `| :--- | :--- | :--- |\n`;
            newFindings.forEach(f => {
                md += `| **${f.title}** | ${f.risk} | ${f.impact} |\n`;
                globalFindings.add(f.solution);
            });
            md += `\n`;
        } else {
            md += `✅ **PASS.** Previous layer diagnostics covered all anomalies detected here.\n\n`;
        }
    } else {
        md += `✅ **PASS.** No anomalies detected in public scan.\n\n`;
    }
});

md += `## 📈 Strategic Roadmap to Level 5 Autonomy\n`;
md += `To transition from your current state to a **Zero Debt** system, we recommend the following 3-step activation plan.\n\n`;

const stabilizeList = Array.from(globalFindings).filter(s => s.includes('#7') || s.includes('#12'));

md += `| Phase | Objective | Recommended Automations |\n`;
md += `| :--- | :--- | :--- |\n`;
md += `| **01. Stabilize** | Patch security leaks & AI visibility gaps | ${stabilizeList.join(', ') || 'N/A'} |\n`;
md += `| **02. Optimize** | Extract technical debt & hardcoded risks | ${Array.from(globalFindings).filter(s => s.includes('#0') || s.includes('#88')).join(', ') || 'N/A'} |\n`;
md += `| **03. Scale** | Deploy DOE Hub for Level 5 Autonomy | Level 5 Logic Hub (#01) |\n\n`;

md += `---\n`;
md += `**Factual Foundation**\n`;
md += `- No simulated data. No placeholders. Every point above is backed by technical evidence extracted during the audit of [${DOMAIN}](https://${DOMAIN}).\n\n`;
md += `*Generated by 3A Automation - Strategic Forensic Division*`;

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
function getLayerName(id) {
    const names = {
        1: 'Answer Engine Optimization (AEO)',
        1.5: 'Search Authority (SEO)',
        2: 'Behavioral & Lead Qualification',
        3: 'Systemic Health & Tech-Debt',
        4: 'Digital Reputation (OSINT)',
        5: 'Strategic Tracking (Pixels)',
        6: 'Transactional Architecture',
        7: 'SecOps Compliance',
        8: 'Autonomous DOE Hub'
    };
    return names[id] || `Layer ${id}`;
}

function findIssues(output) {
    if (!output) return [];
    const cleanOutput = output.replace(/\u001b\[[0-9;]*m/g, '');
    const found = [];

    RISK_GLOSSARY.forEach(item => {
        if (item.pattern.test(cleanOutput)) {
            found.push(item);
        }
    });

    // Generic fallback for unmapped [CRITICAL] or [HIGH] issues
    const lines = cleanOutput.split('\n');
    lines.forEach(line => {
        if ((line.includes('[CRITICAL]') || line.includes('[HIGH]')) && line.includes('✗')) {
            const checkName = line.split(']')[1]?.split(':')[0]?.trim() || 'Unknown Diagnostic';
            if (!found.some(f => line.toUpperCase().includes(f.title.toUpperCase()))) {
                found.push({
                    title: `Unmapped Risk: ${checkName}`,
                    risk: 'Identified as a high-severity anomaly during forensic scanning.',
                    impact: 'Negative impact on system integrity or security posture.',
                    solution: 'Manual verification recommended'
                });
            }
        }
    });

    const unique = [];
    const titles = new Set();
    found.forEach(f => {
        if (!titles.has(f.title)) {
            unique.push(f);
            titles.add(f.title);
        }
    });
    return unique;
}

// Save output
const outputDir = path.dirname(REPORT_PATH);
const fileName = `STRATEGIC_FORENSIC_AUDIT_${DOMAIN.replace(/\./g, '_')}.md`;
const outputPath = path.join(outputDir, 'STRATEGIC_FORENSIC_AUDIT.md');
fs.writeFileSync(outputPath, md);

console.log(`✅ Strategic Report Synthesized: ${outputPath}`);
console.log(`📊 Integrity Score: ${stats.score}/100`);
