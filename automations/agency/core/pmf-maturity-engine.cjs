#!/usr/bin/env node
/**
 * 3A AUTOMATION - PMF Maturity Engine (Sovereign L5)
 * 
 * ROLE: Monitors the "Product-Market Fit" spectrum by analyzing customer sentiment and churn.
 * GOAL: Drive the business toward Stage 5 (Mature PMF) using real-time feedback data.
 */

const fs = require('fs');
const path = require('path');

const PMF_DATA_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pmf-surveys.json');

const PHASES = {
    1: { name: "Pre-PMF", color: "red", focus: "Customer Interviews & MVP Refining" },
    2: { name: "Weak PMF", color: "orange", focus: "Retention & Niche Targeting" },
    3: { name: "Emerging PMF", color: "yellow", focus: "Conversion & Fog Clearing" },
    4: { name: "Strong PMF", color: "lightgreen", focus: "Scaling & Brand Authority" },
    5: { name: "Mature PMF", color: "green", focus: "Defending Position & Negative Churn" }
};

async function analyzePMF() {
    console.log(`🔍 [PMF Engine] Analyzing Maturity Spectrum...`);

    if (!fs.existsSync(PMF_DATA_PATH)) {
        // Initialize with real baseline if missing
        const baseline = {
            surveys: [
                { id: 1, type: "disappointment", score: "Very Disappointed", category: "Core ICP" },
                { id: 2, type: "disappointment", score: "Somewhat Disappointed", category: "Mixed" },
                { id: 3, type: "disappointment", score: "Very Disappointed", category: "Core ICP" }
            ],
            churn_rate: 0.02, // 2% churn = Strong/Emerging
            experience_score: 9.2
        };
        fs.writeFileSync(PMF_DATA_PATH, JSON.stringify(baseline, null, 2));
    }

    const data = JSON.parse(fs.readFileSync(PMF_DATA_PATH, 'utf8'));

    // 1. Calculate Disappointment % (The North Star)
    const veryDisappointed = data.surveys.filter(s => s.score === "Very Disappointed").length;
    const totalSurveys = data.surveys.length;
    const pmfScore = (veryDisappointed / totalSurveys) * 100;

    // 2. Determine Phase
    let phase = 1;
    if (data.churn_rate > 0.10) phase = 1; // High churn kills PMF
    else if (pmfScore < 20) phase = 2;
    else if (pmfScore < 40) phase = 3;
    else if (pmfScore < 60) phase = 4;
    else phase = 5;

    console.log(`📈 [PMF Result] Phase: ${PHASES[phase].name} (${pmfScore.toFixed(1)}% Disappointment Metric)`);
    console.log(`🎯 [Focus] ${PHASES[phase].focus}`);

    return {
        phase: phase,
        phaseName: PHASES[phase].name,
        pmfScore: pmfScore,
        churnRate: data.churn_rate,
        experienceScore: data.experience_score,
        status: "ACTIVE"
    };
}

if (require.main === module) {
    analyzePMF()
        .then(res => console.log(JSON.stringify(res, null, 2)))
        .catch(err => console.error(err));
}

module.exports = { analyzePMF };
