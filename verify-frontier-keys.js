require('dotenv').config({ path: './.env' });

const keys = [
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'XAI_API_KEY',
    'OPENAI_API_KEY'
];

console.log("=== FRONTIER KEY VERIFICATION ===");
keys.forEach(k => {
    if (process.env[k]) {
        console.log(`[OK] ${k} is present.`);
    } else {
        console.warn(`[MISSING] ${k} is NOT in environment.`);
    }
});
