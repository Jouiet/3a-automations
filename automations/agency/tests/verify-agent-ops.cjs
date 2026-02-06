/**
 * Agent Ops + Framework Module Verification
 * Tests that all core modules load and expose expected APIs
 */
const path = require('path');
const core = '../core/';

const modules = [
  { name: 'AgencyEventBus', file: 'AgencyEventBus.cjs' },
  { name: 'ContextBox', file: 'ContextBox.cjs' },
  { name: 'BillingAgent', file: 'BillingAgent.cjs' },
  { name: 'ErrorScience', file: 'ErrorScience.cjs' },
  { name: 'RevenueScience', file: 'RevenueScience.cjs' },
  { name: 'KBEnrichment', file: 'KBEnrichment.cjs' },
  { name: 'ConversationLearner', file: 'ConversationLearner.cjs' },
  { name: 'DOEOrchestrator', file: 'doe-dispatcher.cjs' },
  { name: 'MarketingScience', file: 'marketing-science-core.cjs' },
  { name: 'SecretVault', file: 'SecretVault.cjs' },
  { name: 'TenantScriptRunner', file: 'TenantScriptRunner.cjs' },
  { name: 'TenantContext', file: 'TenantContext.cjs' },
  { name: 'TenantLogger', file: 'TenantLogger.cjs' },
  { name: 'TenantCronManager', file: 'TenantCronManager.cjs' },
  { name: 'GeoLocale', file: 'geo-locale.cjs' }
];

let ok = 0, fail = 0;

modules.forEach(m => {
  try {
    const mod = require(core + m.file);
    const type = typeof mod;
    const isClass = type === 'function' && mod.prototype;
    let methods;
    if (isClass) {
      methods = Object.getOwnPropertyNames(mod.prototype).filter(n => n !== 'constructor').length;
    } else if (type === 'object') {
      methods = Object.keys(mod).length;
    } else {
      methods = 0;
    }
    console.log(`✅ ${m.name.padEnd(22)} | Type: ${(isClass ? 'Class' : type).padEnd(10)} | Methods/Exports: ${methods}`);
    ok++;
  } catch (e) {
    console.log(`❌ ${m.name.padEnd(22)} | ERROR: ${e.message.substring(0, 80)}`);
    fail++;
  }
});

console.log(`\nAgent Ops + Framework: ${ok}/${modules.length} loaded | ${fail} failures`);
process.exit(fail > 0 ? 1 : 0);
