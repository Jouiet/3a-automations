/**
 * EMPIRICAL VERIFICATION SCRIPT
 * PROOF OF MARKETING SCIENCE INJECTION
 * 
 * Tests:
 * 1. MarketingScience Library (Core)
 * 2. LinkedIn Automation (PAS Injection)
 * 3. Email Personalization (SB7 Injection)
 * 4. Voice Bridge (Cialdini Injection - via Mock)
 */

const MarketingScience = require('./automations/agency/core/marketing-science-core.cjs');
const { detectSegment } = require('./automations/agency/templates/b2b-email-templates.cjs');

console.log("==========================================");
console.log("MARKETING SCIENCE: EMPIRICAL VERIFICATION");
console.log("==========================================");

// 1. TEST CORE LIBRARY
console.log("\n[1] TESTING CORE LIBRARY...");
const pasPrompt = MarketingScience.inject('PAS', 'Sell a pen.');
if (pasPrompt.includes('STRUCTURE RULES (PAS FRAMEWORK)') && pasPrompt.includes('AGITATE:')) {
    console.log("✅ PAS Framework Injection: SUCCESS");
} else {
    console.error("❌ PAS Framework Injection: FAILED");
}

// 2. TEST LINKEDIN (Mocking the logic from linkedin-lead-automation.cjs)
console.log("\n[2] TESTING LINKEDIN LOGIC (PAS)...");
const lead = { fullName: "Test CEO", company: "TestCorp", position: "CEO" };
const segment = detectSegment(lead);
const linkedInBasePrompt = `Write outreach for ${segment}`;
const linkedInInjected = MarketingScience.inject('PAS', linkedInBasePrompt);
if (linkedInInjected.includes('PAIN:') && linkedInInjected.includes('SOLUTION:')) {
    console.log(`✅ LinkedIn PAS Logic: SUCCESS (Segment: ${segment})`);
} else {
    console.error("❌ LinkedIn PAS Logic: FAILED");
}

// 3. TEST EMAIL (Mocking the logic from email-personalization-resilient.cjs)
console.log("\n[3] TESTING EMAIL LOGIC (SB7)...");
const emailBasePrompt = "Welcome email for new user";
const emailInjected = MarketingScience.inject('SB7', emailBasePrompt);
if (emailInjected.includes('THE HERO:') && emailInjected.includes('THE GUIDE:')) {
    console.log("✅ Email SB7 Logic: SUCCESS");
} else {
    console.error("❌ Email SB7 Logic: FAILED");
}

// 4. TEST VOICE (Mocking the logic from voice-telephony-bridge.cjs)
console.log("\n[4] TESTING VOICE LOGIC (Cialdini)...");
const voiceBasePrompt = "Handle objection: Too expensive";
const voiceInjected = MarketingScience.inject('CIALDINI', voiceBasePrompt);
if (voiceInjected.includes('SCARCITY:') && voiceInjected.includes('AUTHORITY:')) {
    console.log("✅ Voice Cialdini Logic: SUCCESS");
} else {
    console.error("❌ Voice Cialdini Logic: FAILED");
}

console.log("\n==========================================");
console.log("VERIFICATION COMPLETE");
console.log("==========================================");
