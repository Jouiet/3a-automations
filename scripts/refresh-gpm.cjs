#!/usr/bin/env node
/**
 * GPM Refresh Orchestrator
 * Runs all sensors sequentially to update the Global Pressure Matrix.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SENSORS = [
    'ga4-sensor.cjs',
    'gsc-sensor.cjs',
    'retention-sensor.cjs',
    'lead-scoring-sensor.cjs',
    'product-seo-sensor.cjs',
    'meta-ads-sensor.cjs',
    'apify-trends-sensor.cjs',
    'bigquery-trends-sensor.cjs',
    'trends-discovery-rss.cjs',
    'google-ads-planner-sensor.cjs'
];

const SENSOR_DIR = path.join(__dirname, '../automations/agency/core');

function runSensors() {
    console.log("🚀 Starting Global Pressure Matrix Refresh...\n");

    SENSORS.forEach(sensor => {
        const sensorPath = path.join(SENSOR_DIR, sensor);
        if (fs.existsSync(sensorPath)) {
            console.log(`▶ Running ${sensor}...`);
            try {
                const output = execSync(`node ${sensorPath}`, { encoding: 'utf8' });
                console.log(output.trim());
            } catch (e) {
                console.error(`❌ Error running ${sensor}: ${e.message}`);
            }
        } else {
            console.warn(`⚠️ Sensor not found: ${sensor}`);
        }
        console.log("-----------------------------------");
    });

    console.log("\n✅ GPM Refresh Complete.");
}

runSensors();
