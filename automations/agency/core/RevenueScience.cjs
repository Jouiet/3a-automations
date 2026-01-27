/**
 * RevenueScience.cjs - Yield Optimization & Financial Intelligence
 * 3A Automation - Session 177 (The Science Trilogy)
 *
 * Handles:
 * 1. Dynamic Pricing (Yield Management - Multi-Sector)
 * 2. Margin Protection (Guardrails)
 * 3. Marketing ROI Analytics (CAC vs LTV)
 */

const fs = require('fs');
const path = require('path');
const FINANCIAL_CONFIG = require('./agency-financial-config.cjs');

class RevenueScience {
    constructor() {
        this.baseCosts = {
            voice_ai_minute: 0.15,
            compute_server: 40.0,
            seo_tooling: 50.0,
            management_overhead: 0.20
        };

        // Multi-Sector Yield Models
        this.models = {
            VOICE_AI: { floor: 500, target: 1200, max: 5000 },
            SEO_AUTOMATION: { floor: 300, target: 800, max: 2000 },
            CONTENT_FACTORY: { floor: 200, target: 1500, max: 6000 }
        };
    }

    /**
     * Calculates optimal price based on BANT + Sector Scarcity
     * @param {Object} qualification { score, entity_type }
     * @param {String} sector Sector key
     * @returns {Number} Optimal price in cents
     */
    calculateOptimalPrice(qualification = {}, sector = 'VOICE_AI') {
        const score = qualification.score || 0;
        const model = this.models[sector.toUpperCase()] || this.models.VOICE_AI;

        const scoreFactor = Math.min(1, Math.max(0, (score - 50) / 50));
        let price = model.floor + (model.target - model.floor) * scoreFactor;

        // Scarcity adjustment: B2C High Volume gets 10% discount, B2B High Value gets 20% premium
        if (qualification.entity_type === 'B2B') price *= 1.20;
        if (qualification.entity_type === 'B2C') price *= 0.90;

        return Math.round(price * 100);
    }

    /**
     * Holistic ROI: Connects Ad Cost (Marketing) to Deal Value (Sales)
     */
    calculateSectorROI(sectorData) {
        const { spend, revenue, customerCount } = sectorData;
        if (!spend || spend === 0) return { roi: 100, cac: 0, healthy: true };
        const roi = (revenue - spend) / spend;
        const cac = spend / (customerCount || 1);

        return { roi, cac, healthy: roi > 2.0 };
    }

    /**
     * PROTECT MARGIN: Verifies if a quote is scientifically viable
     */
    isMarginSafe(priceInCents, sector = 'VOICE_AI') {
        const costBasis = (this.baseCosts.compute_server / 30) + 100; // Simplified
        return (priceInCents / 100) > costBasis * (1 + this.baseCosts.management_overhead);
    }
}

module.exports = new RevenueScience();
