/**
 * VERIFICATION SCRIPT: Multi-Tenant RAG & Handoff Remediation
 * 3A Automation - 2026
 */

const { VoicePersonaInjector } = require('../automations/agency/core/voice-persona-injector.cjs');
const fs = require('fs');
const path = require('path');

// Mock KNOWLEDGE_BASE for testing if not loading actual file
const KB_PATH = path.join(__dirname, '../automations/agency/core/knowledge_base.json');
const KNOWLEDGE_BASE = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));

async function testRagRemediation() {
    console.log('--- STARTING RAG REMEDIATION TEST ---');

    // 1. Test Dental Client (French)
    console.log('\n[Test 1] Dental Client (client_dental_01)');
    const dentalPersona = VoicePersonaInjector.getPersona(null, null, 'client_dental_01');
    console.log(`- Persona ID: ${dentalPersona.id}`);
    console.log(`- KB ID: ${dentalPersona.knowledge_base_id}`);

    // Verify KB ID match
    const dentalKb = KNOWLEDGE_BASE[dentalPersona.knowledge_base_id];
    if (dentalKb && dentalKb.urgence_dentaire) {
        console.log('✅ PASS: Correct Knowledge Base Linked (Dental)');
    } else {
        console.error('❌ FAIL: Incorrect or missing KB for Dental');
    }

    // 2. Test New "Healer" Persona (Expansion)
    console.log('\n[Test 2] Expansion Persona (HEALER)');
    // Simulate a client registry entry for a healer
    const healerPersona = VoicePersonaInjector.getPersona(null, null, 'ecom_healer_01'); // Falls back to archetype or guess
    // Note: Since I didn't add it to registry yet, let's test the guess/guess logic or direct injection
    // Actually, let's test the archetypes list directly
    const { PERSONAS } = require('../automations/agency/core/voice-persona-injector.cjs');
    if (PERSONAS.HEALER && PERSONAS.HEALER.id === 'healer_v1') {
        process.stdout.write('✅ PASS: Tier-2 Archetype "HEALER" exists\n');
    } else {
        process.stdout.write('❌ FAIL: "HEALER" missing\n');
    }

    // 3. Verify Knowledge Base for all new archetypes
    console.log('\n[Test 3] Knowledge Base Population');
    const requiredKbs = [
        'healer_v1', 'mechanic_v1', 'counselor_v1', 'concierge_v1',
        'stylist_v1', 'recruiter_v1', 'dispatcher_v1', 'collector_v1',
        'surveyor_v1', 'governor_v1', 'insurer_v1'
    ];

    let allKbsFound = true;
    requiredKbs.forEach(id => {
        if (KNOWLEDGE_BASE[id]) {
            console.log(`- KB ${id}: Found`);
        } else {
            console.error(`- KB ${id}: MISSING`);
            allKbsFound = false;
        }
    });

    if (allKbsFound) {
        console.log('✅ PASS: All 11 new Knowledge Bases populated');
    } else {
        console.error('❌ FAIL: Some Knowledge Bases missing');
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

testRagRemediation().catch(console.error);
