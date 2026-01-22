#!/usr/bin/env node
/**
 * 3A AUTOMATION - Catalog Sync Engine (L5)
 * Synchronizes the public UI Catalog with the internal Registry.
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../automations-registry.json');
const CATALOG_PATH = path.join(__dirname, '../../landing-page-hostinger/data/automations-catalog.json');
const MANIFEST_PATH = path.join(__dirname, '../../landing-page-hostinger/mx-manifest.json');

function sync() {
    console.log("🔄 [Sovereign Sync] Synchronizing Catalog with Registry...");

    if (!fs.existsSync(REGISTRY_PATH)) {
        console.error("❌ Registry not found.");
        return;
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const toolCount = registry.automations.length;

    console.log(`📊 Detected ${toolCount} tools in Registry.`);

    if (fs.existsSync(CATALOG_PATH)) {
        const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

        // Update counts
        catalog.totalCount = toolCount;
        catalog.lastUpdated = new Date().toISOString().split('T')[0];

        // Sync categories if possible
        if (registry.categories) {
            // Logic to update category counts could go here
        }

        fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
        console.log(`✅ [Sovereign Sync] Catalog updated to ${toolCount} tools.`);
    } else {
        console.error("❌ Catalog file not found.");
    }

    // Sync MX Manifest
    if (fs.existsSync(MANIFEST_PATH)) {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        if (manifest.sovereignCapabilities) {
            manifest.sovereignCapabilities.toolCount = toolCount;
            manifest.sovereignCapabilities.lastVerified = new Date().toISOString();
        }
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log(`✅ [Sovereign Sync] MX Manifest updated to ${toolCount} tools.`);
    }
}

sync();
