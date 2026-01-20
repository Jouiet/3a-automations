const DevOps = require('./automations/skills/DevOps.js');

(async () => {
    console.log("Running DevOps.execute('test')...");
    const result = await DevOps.execute('test');
    console.log("RESULT:", JSON.stringify(result, null, 2));
})();
