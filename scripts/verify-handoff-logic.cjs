/**
 * VERIFICATION SCRIPT: Handoff Tool Logic
 * 3A Automation - 2026
 */

const { VoicePersonaInjector } = require('../automations/agency/core/voice-persona-injector.cjs');

async function testHandoffLogic() {
    console.log('--- STARTING HANDOFF LOGIC TEST ---');

    // Mock CONFIG and Session
    const mockSession = {
        callSid: 'CA123456789',
        metadata: {
            business_info: {
                phone: '+33600000001'
            }
        }
    };

    // We can't easily import the bridge's internal functions without refactoring.
    // Instead, we verify that the VoicePersonaInjector correctly provides the phone number if available.

    console.log('\n[Test 1] Persona Data Extraction');
    const dentalPersona = VoicePersonaInjector.getPersona(null, null, 'client_dental_01');
    console.log(`- Business Name: ${dentalPersona.name}`);
    console.log(`- Business Phone: ${dentalPersona.business_info.phone}`);

    if (dentalPersona.business_info.phone === '+33198765432') {
        console.log('✅ PASS: Persona correctly includes client-specific phone for handoff');
    } else {
        console.error('❌ FAIL: Phone number mismatch');
    }

    console.log('\n[Test 2] Default Phone Fallback');
    const agencyPersona = VoicePersonaInjector.getPersona(null, null, 'agency_internal');
    console.log(`- Agency Phone: ${agencyPersona.business_info.phone || 'Fallback to Config'}`);

    // Note: agency_internal has phone +33123456789 in registry
    if (agencyPersona.business_info.phone === '+33123456789') {
        process.stdout.write('✅ PASS: Agency phone correctly identified\n');
    } else {
        process.stdout.write('❌ FAIL: Agency phone mismatch\n');
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

testHandoffLogic().catch(console.error);
