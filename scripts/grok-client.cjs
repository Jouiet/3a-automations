#!/usr/bin/env node
/**
 * 3A Automation - Grok/xAI Integration Client (Node.js)
 * Version: 1.0
 * Created: 2025-12-17
 *
 * Usage:
 *     node scripts/grok-client.cjs
 *
 * Configuration:
 *     Set XAI_API_KEY in .env file
 *     Get key from: https://console.x.ai/api-keys
 */

require('dotenv').config();
const readline = require('readline');

// Configuration
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// System Prompt for 3A Automation
const SYSTEM_PROMPT = `Tu es l'assistant IA de 3A Automation, un consultant indépendant spécialisé en Automation, Analytics et AI pour les PME.

## IDENTITÉ

- Nom: 3A Automation (Automation, Analytics, AI)
- Site: https://3a-automation.com
- Email: contact@3a-automation.com
- Type: Consultant solo (pas une agence)
- Localisation: Maroc, servant MENA et monde entier
- Langues: Français (principal), Anglais, Arabe (sur demande)

## EXPERTISE TECHNIQUE

Plateformes maîtrisées:
- Shopify (REST & GraphQL APIs)
- Klaviyo (Email & SMS marketing automation)
- Google Analytics 4 (GA4)
- Google Tag Manager (GTM)
- n8n (Workflow automation)
- Meta/Facebook Marketing APIs

## SERVICES OFFERTS

1. Automation E-commerce (sync Shopify-Klaviyo, webhooks, flows)
2. Analytics & Reporting (audits, dashboards GA4)
3. AI Integration (génération contenu, SEO automatisé)

OFFRE GRATUITE: Audit e-commerce complet
URL: https://3a-automation.com/#contact

## CIBLE CLIENT

PME de tous secteurs (e-commerce, healthcare, B2B, retail)
Revenue: €10k-500k/mois
Budget: €300-1000/mois

## PRINCIPES

1. Factualité: Ne jamais faire de claims non vérifiés
2. Transparence: Honnête sur ce qui est possible
3. ROI Focus: Actions liées à résultats mesurables
4. Pas de bullshit: Réponses directes, actionnables

## FORMAT

- Réponses courtes et actionnables
- Listes pour la clarté
- Exemples concrets
- Pas d'emojis sauf demande explicite`;

/**
 * Check if API key is configured
 */
function checkApiKey() {
    if (!XAI_API_KEY) {
        console.log('\n' + '='.repeat(60));
        console.log('ERREUR: XAI_API_KEY non configuré');
        console.log('='.repeat(60));
        console.log('\nPour configurer:');
        console.log('1. Aller sur https://console.x.ai/api-keys');
        console.log('2. Créer une nouvelle clé API');
        console.log('3. Ajouter dans .env: XAI_API_KEY=your_key_here');
        console.log('\n' + '='.repeat(60));
        return false;
    }
    return true;
}

/**
 * Call xAI API for chat completion
 */
async function chatCompletion(userMessage, systemPrompt = SYSTEM_PROMPT) {
    try {
        const response = await fetch(XAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-2-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error (${response.status}): ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}

/**
 * Test API connection
 */
async function testConnection() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST CONNEXION xAI/GROK');
    console.log('='.repeat(60));

    const testMessage = "Présente-toi brièvement en une phrase.";
    console.log(`\nEnvoi message test: '${testMessage}'`);
    console.log('-'.repeat(40));

    const response = await chatCompletion(testMessage);

    console.log('\nRéponse Grok:');
    console.log(response);
    console.log('\n' + '='.repeat(60));

    const success = !response.startsWith('Erreur');
    console.log(success ? 'CONNEXION OK' : 'CONNEXION ÉCHOUÉE');
    console.log('='.repeat(60));

    return success;
}

/**
 * Interactive chat mode
 */
async function interactiveChat() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n' + '='.repeat(60));
    console.log('3A AUTOMATION - CHAT INTERACTIF GROK');
    console.log('='.repeat(60));
    console.log("Tapez 'quit' pour quitter");
    console.log("Tapez 'help' pour les commandes disponibles");
    console.log('-'.repeat(60));

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    while (true) {
        try {
            const userInput = (await question('\nVous: ')).trim();

            if (!userInput) continue;

            if (userInput.toLowerCase() === 'quit') {
                console.log('Au revoir!');
                rl.close();
                break;
            }

            if (userInput.toLowerCase() === 'help') {
                console.log('\nCommandes disponibles:');
                console.log('  quit  - Quitter le chat');
                console.log('  help  - Afficher cette aide');
                console.log('\nPosez n\'importe quelle question sur l\'automation,');
                console.log('les analytics, ou l\'IA pour PME.');
                continue;
            }

            console.log('\nChargement...');
            const response = await chatCompletion(userInput);
            console.log(`\n3A Assistant: ${response}`);

        } catch (error) {
            if (error.message === 'readline was closed') {
                break;
            }
            console.error('Erreur:', error.message);
        }
    }
}

/**
 * Generate audit analysis
 */
async function generateAuditAnalysis(dataJson) {
    const prompt = `Analyse les données suivantes et génère un rapport d'audit avec:
1. Points forts identifiés
2. Problèmes critiques (priorité haute)
3. Opportunités d'amélioration
4. Recommandations actionnables avec estimation d'impact

Données: ${dataJson}

Format: Markdown structuré, factuel uniquement.`;

    return chatCompletion(prompt);
}

/**
 * Generate email content
 */
async function generateEmailContent(flowType, productName, price) {
    const prompt = `Génère le contenu email pour un flow ${flowType}.
Produit: ${productName}
Prix: ${price}

Retourne:
- Subject line (50 chars max)
- Preview text (90 chars max)
- Body HTML structure avec CTA clair`;

    return chatCompletion(prompt);
}

/**
 * Main entry point
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('3A AUTOMATION - GROK CLIENT (Node.js)');
    console.log('Projet: 3a-automations');
    console.log('='.repeat(60));

    // Check API key
    if (!checkApiKey()) {
        process.exit(1);
    }

    // Test connection
    const connected = await testConnection();
    if (!connected) {
        process.exit(1);
    }

    // Start interactive chat
    await interactiveChat();
}

// Export for use as module
module.exports = {
    chatCompletion,
    generateAuditAnalysis,
    generateEmailContent,
    SYSTEM_PROMPT
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
