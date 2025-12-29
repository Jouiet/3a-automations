#!/usr/bin/env node
/**
 * Voice Widget Generator - Dynamic Client Configuration
 * 3A Automation - Session 115
 *
 * Usage:
 *   node voice-widget-generator.cjs --client="ClientName" --domain="client.com" --color="#4FBAF1"
 *   node voice-widget-generator.cjs --interactive
 *   node voice-widget-generator.cjs --validate=/path/to/config.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
const generateConfig = (options) => {
  const {
    clientName = 'Client Name',
    domain = 'client.com',
    email = `contact@${options.domain || 'client.com'}`,
    primaryColor = '#4FBAF1',
    accentColor = '#10B981',
    languages = ['fr'],
    services = ['Service 1', 'Service 2', 'Service 3'],
    bookingUrl = '',
    industry = 'e-commerce',
    totalAutomations = 0,
  } = options;

  const darkColor = darkenColor(primaryColor, 30);

  return `/**
 * Voice Widget Configuration - ${clientName}
 * Generated: ${new Date().toISOString()}
 * Generator: 3A Automation Voice Widget Generator v1.0
 */

const VOICE_WIDGET_CONFIG = {
  // === BRAND IDENTITY ===
  BRAND: {
    name: '${clientName}',
    url: '${domain}',
    email: '${email}',
    languages: ${JSON.stringify(languages)},
    industry: '${industry}',
  },

  // === UI COLORS ===
  COLORS: {
    primary: '${primaryColor}',
    primaryDark: '${darkColor}',
    accent: '${accentColor}',
    darkBg: '#191E35',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
  },

  // === UI TEXT (French) ===
  TEXT_FR: {
    welcomeMessage: 'Bonjour ! Je suis l\\'assistant de ${clientName}. Comment puis-je vous aider ?',
    welcomeMessageTextOnly: 'Bonjour ! Posez votre question par écrit.',
    placeholder: 'Posez votre question...',
    buttonTitle: 'Assistant vocal',
    errorMessage: 'Erreur de connexion. Veuillez réessayer.',
    bookingPrompt: 'Souhaitez-vous prendre rendez-vous avec notre équipe ?',
  },

  // === UI TEXT (English) ===
  TEXT_EN: {
    welcomeMessage: 'Hello! I\\'m the ${clientName} assistant. How can I help you?',
    welcomeMessageTextOnly: 'Hello! Type your question below.',
    placeholder: 'Ask your question...',
    buttonTitle: 'Voice assistant',
    errorMessage: 'Connection error. Please try again.',
    bookingPrompt: 'Would you like to schedule a call with our team?',
  },

  // === WIDGET SETTINGS ===
  SETTINGS: {
    position: 'bottom-right',
    apiEndpoint: '/api/voice',
    enableVoice: true,
    enableTTS: true,
    autoOpen: false,
    debugMode: false,
    bookingUrl: '${bookingUrl || `https://${domain}/booking`}',
  },

  // === SYSTEM PROMPT (French) ===
  PROMPT_FR: \`Tu es l'assistant vocal de ${clientName}.

IDENTITE:
- ${getIndustryDescription(industry, 'fr')}
- Site: ${domain}
- Contact: ${email}

SERVICES:
${services.map(s => `- ${s}`).join('\n')}

STYLE:
- Réponses courtes (2-3 phrases max)
- Ton professionnel mais accessible
- Pas de jargon technique
- Toujours proposer une action concrète

OBJECTIF:
- Qualifier le prospect rapidement
- Répondre aux questions fréquentes
- Proposer un rendez-vous si intérêt détecté

REGLES:
- Ne jamais inventer d'informations
- Rediriger vers le site pour les détails complexes
- Être honnête sur les limites\`,

  // === SYSTEM PROMPT (English) ===
  PROMPT_EN: \`You are the voice assistant for ${clientName}.

IDENTITY:
- ${getIndustryDescription(industry, 'en')}
- Website: ${domain}
- Contact: ${email}

SERVICES:
${services.map(s => `- ${s}`).join('\n')}

STYLE:
- Short responses (2-3 sentences max)
- Professional but approachable tone
- Avoid technical jargon
- Always suggest a concrete action

OBJECTIVE:
- Qualify prospects quickly
- Answer frequently asked questions
- Suggest a meeting if interest is detected

RULES:
- Never make up information
- Redirect to website for complex details
- Be honest about limitations\`,

  // === KNOWLEDGE BASE ===
  KNOWLEDGE: {
    totalAutomations: ${totalAutomations},
    industry: '${industry}',
    services: ${JSON.stringify(services)},
  },

  // === ANALYTICS ===
  ANALYTICS: {
    enabled: true,
    eventCategory: 'voice_assistant',
    trackOpen: true,
    trackMessages: true,
    trackErrors: true,
    trackBookings: true,
  },
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VOICE_WIDGET_CONFIG;
}
`;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function getIndustryDescription(industry, lang) {
  const descriptions = {
    'e-commerce': {
      fr: 'Boutique en ligne spécialisée',
      en: 'Specialized online store'
    },
    'b2b': {
      fr: 'Services B2B et automatisation',
      en: 'B2B services and automation'
    },
    'saas': {
      fr: 'Logiciel en tant que service',
      en: 'Software as a Service'
    },
    'restaurant': {
      fr: 'Restaurant et service traiteur',
      en: 'Restaurant and catering service'
    },
    'retail': {
      fr: 'Commerce de détail',
      en: 'Retail store'
    },
    'services': {
      fr: 'Prestataire de services professionnels',
      en: 'Professional services provider'
    },
    'agency': {
      fr: 'Agence spécialisée',
      en: 'Specialized agency'
    }
  };
  return descriptions[industry]?.[lang] || descriptions['services'][lang];
}

function validateConfig(configPath) {
  try {
    const config = require(configPath);
    const errors = [];
    const warnings = [];

    // Required fields
    if (!config.BRAND?.name) errors.push('BRAND.name is required');
    if (!config.BRAND?.url) errors.push('BRAND.url is required');
    if (!config.COLORS?.primary) errors.push('COLORS.primary is required');
    if (!config.TEXT_FR?.welcomeMessage) errors.push('TEXT_FR.welcomeMessage is required');
    if (!config.PROMPT_FR) errors.push('PROMPT_FR is required');

    // Warnings
    if (!config.ANALYTICS?.enabled) warnings.push('Analytics is disabled');
    if (!config.SETTINGS?.bookingUrl) warnings.push('No booking URL configured');
    if (config.BRAND?.languages?.length < 2) warnings.push('Only one language configured');

    return { valid: errors.length === 0, errors, warnings };
  } catch (e) {
    return { valid: false, errors: [`Failed to load config: ${e.message}`], warnings: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('\n🎙️  Voice Widget Generator - Interactive Mode\n');

  const clientName = await ask('Client name: ');
  const domain = await ask('Domain (e.g., client.com): ');
  const email = await ask(`Email [contact@${domain}]: `) || `contact@${domain}`;
  const primaryColor = await ask('Primary color [#4FBAF1]: ') || '#4FBAF1';
  const industry = await ask('Industry (e-commerce/b2b/saas/restaurant/retail/services/agency) [services]: ') || 'services';
  const servicesInput = await ask('Services (comma-separated): ');
  const services = servicesInput ? servicesInput.split(',').map(s => s.trim()) : ['Service 1', 'Service 2'];

  rl.close();

  const config = generateConfig({
    clientName,
    domain,
    email,
    primaryColor,
    industry,
    services,
    languages: ['fr', 'en']
  });

  const outputDir = path.join(__dirname, '../../clients', clientName.toLowerCase().replace(/\s+/g, '-'));
  const outputPath = path.join(outputDir, 'voice-widget-config.js');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, config);
  console.log(`\n✅ Configuration generated: ${outputPath}`);

  // Validate
  const validation = validateConfig(outputPath);
  if (!validation.valid) {
    console.log('\n⚠️  Validation errors:');
    validation.errors.forEach(e => console.log(`  ❌ ${e}`));
  }
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }
}

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    } else if (arg.startsWith('--')) {
      args[arg.slice(2)] = true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  if (args.interactive) {
    await interactiveMode();
    return;
  }

  if (args.validate) {
    console.log(`\n🔍 Validating: ${args.validate}`);
    const result = validateConfig(args.validate);
    if (result.valid) {
      console.log('✅ Configuration is valid');
    } else {
      console.log('❌ Validation failed:');
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }
    process.exit(result.valid ? 0 : 1);
  }

  if (args.client && args.domain) {
    const config = generateConfig({
      clientName: args.client,
      domain: args.domain,
      email: args.email,
      primaryColor: args.color || '#4FBAF1',
      industry: args.industry || 'services',
      services: args.services ? args.services.split(',') : ['Service 1', 'Service 2']
    });

    const outputPath = args.output || `./voice-widget-config-${args.client.toLowerCase().replace(/\s+/g, '-')}.js`;
    fs.writeFileSync(outputPath, config);
    console.log(`✅ Configuration generated: ${outputPath}`);
    return;
  }

  console.log(`
🎙️  Voice Widget Generator - 3A Automation

Usage:
  Interactive mode:
    node voice-widget-generator.cjs --interactive

  Command line:
    node voice-widget-generator.cjs --client="Client Name" --domain="client.com" [options]

  Options:
    --client     Client name (required)
    --domain     Client domain (required)
    --email      Contact email
    --color      Primary color (hex, default: #4FBAF1)
    --industry   Industry type (e-commerce/b2b/saas/restaurant/retail/services/agency)
    --services   Services (comma-separated)
    --output     Output file path

  Validate:
    node voice-widget-generator.cjs --validate=/path/to/config.js

Examples:
  node voice-widget-generator.cjs --interactive
  node voice-widget-generator.cjs --client="Acme Corp" --domain="acme.com" --industry=b2b
  node voice-widget-generator.cjs --validate=./config.js
`);
}

main().catch(console.error);
