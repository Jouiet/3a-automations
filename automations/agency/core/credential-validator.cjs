#!/usr/bin/env node
/**
 * Credential Validator - v3.0 Engineering
 * 3A Automation - Session 178ter
 *
 * Validates all required credentials before system startup
 * Reports missing credentials with priority and impact
 *
 * Usage:
 *   node credential-validator.cjs --check      # Validate all credentials
 *   node credential-validator.cjs --module=voice  # Validate specific module
 *   node credential-validator.cjs --health     # JSON output
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Credential definitions with priority and impact
const CREDENTIALS = {
    // Voice Services
    voice: {
        priority: 'P0',
        impact: 'Voice AI completely non-functional',
        required: [
            { key: 'XAI_API_KEY', desc: 'Grok LLM (primary)' },
            { key: 'ELEVENLABS_API_KEY', desc: 'TTS/STT' }
        ],
        optional: [
            { key: 'GEMINI_API_KEY', desc: 'Fallback LLM' },
            { key: 'OPENAI_API_KEY', desc: 'Whisper STT fallback' },
            { key: 'ANTHROPIC_API_KEY', desc: 'Claude fallback' }
        ]
    },

    // Telephony
    telephony: {
        priority: 'P0',
        impact: 'Phone calls cannot be made/received',
        required: [
            { key: 'TELNYX_API_KEY', desc: 'Primary telephony' }
        ],
        optional: [
            { key: 'TWILIO_ACCOUNT_SID', desc: 'Twilio fallback' },
            { key: 'TWILIO_AUTH_TOKEN', desc: 'Twilio auth' }
        ]
    },

    // Marketing
    marketing: {
        priority: 'P1',
        impact: 'Ad tracking and attribution broken',
        required: [
            { key: 'META_PIXEL_ID', desc: 'Meta CAPI tracking' },
            { key: 'META_ACCESS_TOKEN', desc: 'Meta API auth' }
        ],
        optional: [
            { key: 'GA4_PROPERTY_ID', desc: 'GA4 tracking' },
            { key: 'GA4_MEASUREMENT_ID', desc: 'GA4 MP' },
            { key: 'TIKTOK_ACCESS_TOKEN', desc: 'TikTok ads' }
        ]
    },

    // E-commerce
    ecommerce: {
        priority: 'P1',
        impact: 'Shopify/Klaviyo integrations disabled',
        required: [
            { key: 'SHOPIFY_ACCESS_TOKEN', desc: 'Shopify Admin API' },
            { key: 'SHOPIFY_STORE_DOMAIN', desc: 'Shopify store' },
            { key: 'KLAVIYO_API_KEY', desc: 'Klaviyo email' }
        ],
        optional: [
            { key: 'KLAVIYO_PRIVATE_API_KEY', desc: 'Klaviyo private' }
        ]
    },

    // Payments
    payments: {
        priority: 'P0',
        impact: 'Cannot process payments',
        required: [
            { key: 'STRIPE_SECRET_KEY', desc: 'Stripe API' }
        ],
        optional: [
            { key: 'STRIPE_WEBHOOK_SECRET', desc: 'Webhook verification' },
            { key: 'STRIPE_PUBLISHABLE_KEY', desc: 'Client-side' }
        ]
    },

    // Communications
    communications: {
        priority: 'P2',
        impact: 'WhatsApp/messaging disabled',
        required: [],
        optional: [
            { key: 'WHATSAPP_ACCESS_TOKEN', desc: 'WhatsApp Business' },
            { key: 'WHATSAPP_PHONE_NUMBER_ID', desc: 'WhatsApp number' },
            { key: 'SENDGRID_API_KEY', desc: 'Email sending' }
        ]
    },

    // Suppliers
    suppliers: {
        priority: 'P3',
        impact: 'Dropshipping integrations disabled',
        required: [],
        optional: [
            { key: 'CJ_API_KEY', desc: 'CJ Dropshipping' },
            { key: 'BIGBUY_API_KEY', desc: 'BigBuy supplier' }
        ]
    },

    // MCP Server
    mcp: {
        priority: 'P2',
        impact: 'MCP authentication disabled',
        required: [],
        optional: [
            { key: 'MCP_API_KEY', desc: 'MCP auth' },
            { key: 'MCP_HTTP_PORT', desc: 'HTTP transport' }
        ]
    },

    // Google Services
    google: {
        priority: 'P1',
        impact: 'Google integrations disabled',
        required: [
            { key: 'GOOGLE_APPLICATION_CREDENTIALS', desc: 'Service account' }
        ],
        optional: [
            { key: 'GOOGLE_SHEETS_SPREADSHEET_ID', desc: 'Sheets DB' },
            { key: 'GSC_SITE_URL', desc: 'Search Console' }
        ]
    }
};

/**
 * Validate a single module's credentials
 */
function validateModule(moduleName) {
    const config = CREDENTIALS[moduleName];
    if (!config) {
        return { valid: false, error: `Unknown module: ${moduleName}` };
    }

    const missing = {
        required: [],
        optional: []
    };

    // Check required
    for (const cred of config.required) {
        if (!process.env[cred.key]) {
            missing.required.push(cred);
        }
    }

    // Check optional
    for (const cred of config.optional) {
        if (!process.env[cred.key]) {
            missing.optional.push(cred);
        }
    }

    const valid = missing.required.length === 0;
    const completeness = Math.round(
        (1 - (missing.required.length + missing.optional.length * 0.5) /
            (config.required.length + config.optional.length * 0.5)) * 100
    );

    return {
        module: moduleName,
        priority: config.priority,
        impact: config.impact,
        valid,
        completeness,
        missing,
        total: {
            required: config.required.length,
            optional: config.optional.length
        }
    };
}

/**
 * Validate all modules
 */
function validateAll() {
    const results = {};
    let totalRequired = 0;
    let totalMissing = 0;

    for (const moduleName of Object.keys(CREDENTIALS)) {
        const result = validateModule(moduleName);
        results[moduleName] = result;
        totalRequired += result.total.required;
        totalMissing += result.missing.required.length;
    }

    const overallScore = Math.round((1 - totalMissing / totalRequired) * 100);

    return {
        modules: results,
        summary: {
            total_modules: Object.keys(CREDENTIALS).length,
            valid_modules: Object.values(results).filter(r => r.valid).length,
            overall_score: overallScore,
            critical_missing: Object.entries(results)
                .filter(([_, r]) => !r.valid && r.priority === 'P0')
                .map(([name, _]) => name)
        }
    };
}

/**
 * Print detailed report
 */
function printReport(validation) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           CREDENTIAL VALIDATION REPORT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Overall Score: ${validation.summary.overall_score}%`);
    console.log(`Valid Modules: ${validation.summary.valid_modules}/${validation.summary.total_modules}\n`);

    if (validation.summary.critical_missing.length > 0) {
        console.log('⚠️  CRITICAL MODULES BLOCKED:', validation.summary.critical_missing.join(', '));
        console.log('');
    }

    // Sort by priority
    const sorted = Object.entries(validation.modules)
        .sort((a, b) => a[1].priority.localeCompare(b[1].priority));

    for (const [name, result] of sorted) {
        const icon = result.valid ? '✅' : '❌';
        const color = result.valid ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';

        console.log(`${icon} ${color}${name.toUpperCase()}${reset} [${result.priority}] - ${result.completeness}%`);

        if (result.missing.required.length > 0) {
            console.log('   Required missing:');
            for (const cred of result.missing.required) {
                console.log(`   ❌ ${cred.key} - ${cred.desc}`);
            }
        }

        if (result.missing.optional.length > 0 && !result.valid) {
            console.log('   Optional missing:');
            for (const cred of result.missing.optional) {
                console.log(`   ⚠️  ${cred.key} - ${cred.desc}`);
            }
        }

        console.log('');
    }

    // Recommendations
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const p0Missing = Object.entries(validation.modules)
        .filter(([_, r]) => !r.valid && r.priority === 'P0');

    if (p0Missing.length > 0) {
        console.log('🔴 P0 BLOCKERS (Fix immediately):');
        for (const [name, result] of p0Missing) {
            console.log(`   ${name}: ${result.missing.required.map(c => c.key).join(', ')}`);
        }
        console.log('');
    }

    const p1Missing = Object.entries(validation.modules)
        .filter(([_, r]) => !r.valid && r.priority === 'P1');

    if (p1Missing.length > 0) {
        console.log('🟡 P1 HIGH PRIORITY:');
        for (const [name, result] of p1Missing) {
            console.log(`   ${name}: ${result.missing.required.map(c => c.key).join(', ')}`);
        }
        console.log('');
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--health')) {
        const validation = validateAll();
        console.log(JSON.stringify({
            status: validation.summary.overall_score >= 80 ? 'ok' :
                    validation.summary.overall_score >= 50 ? 'degraded' : 'error',
            service: 'credential-validator',
            version: '1.0.0',
            score: validation.summary.overall_score,
            valid_modules: validation.summary.valid_modules,
            total_modules: validation.summary.total_modules,
            critical_missing: validation.summary.critical_missing,
            timestamp: new Date().toISOString()
        }, null, 2));
        return;
    }

    const moduleArg = args.find(a => a.startsWith('--module='));
    if (moduleArg) {
        const moduleName = moduleArg.split('=')[1];
        const result = validateModule(moduleName);
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    if (args.includes('--check') || args.length === 0) {
        const validation = validateAll();
        printReport(validation);
        return;
    }

    console.log(`
Credential Validator - System Credentials Check

Usage:
  node credential-validator.cjs --check            Validate all credentials
  node credential-validator.cjs --module=<name>   Validate specific module
  node credential-validator.cjs --health          JSON output

Modules: ${Object.keys(CREDENTIALS).join(', ')}
`);
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

module.exports = { CREDENTIALS, validateModule, validateAll };
