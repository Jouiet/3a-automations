// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

/**
 * BUSINESS PROJECTIONS WITH REAL MARGINS - 61.1% Actual Data
 * Complete Year 1 financial projections using real cost data from 1,523 variants
 */

const fs = require('fs');

// REAL DATA from complete margin analysis
const REAL_MARGINS = {
  avgMargin: 0.611,        // 61.1% REAL average margin
  avgPrice: 160.10,        // $160.10 REAL average price
  avgCost: 69.23,          // $69.23 REAL average cost
  avgMarkup: 2.31          // 2.31x REAL average markup
};

// Ad budget breakdown (12 months = $18,800)
const AD_BUDGET = {
  month1: 800,
  month2: 1000,
  month3: 1500,
  month4: 1500,
  month5: 2000,
  month6: 2000,
  month7: 1500,
  month8: 1500,
  month9: 1500,
  month10: 2000,
  month11: 2000,
  month12: 2000,
  total: 18800
};

// E-COMMERCE BENCHMARKS (Realistic 2025 data)
const BENCHMARKS = {
  cpc: 1.00,                // Cost Per Click (blended average across platforms)
  cvr: 0.022,               // 2.2% conversion rate (realistic with design boost)
  aov: REAL_MARGINS.avgPrice, // Use real average price
  returnRate: 0.20,         // 20% return rate
  shippingCost: 0,          // Free shipping absorbed in price
  processingFee: 0.029      // Shopify payments 2.9% + $0.30
};

// SOLOPRENEUR ADVANTAGES
const SOLO_ADVANTAGES = {
  aiSkills: {
    contentSavings: 4000,   // $4K/year in content creation
    automationSavings: 2000 // $2K/year in automation
  },
  seoSkills: {
    organicTrafficGrowth: [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 0.60, 0.65, 0.70],
    adSpendReduction: 0.30  // 30% less ad spend needed by month 12
  },
  designSkills: {
    creativeSavings: 3000,  // $3K/year in graphics/video
    conversionBoost: 0.15   // 15% higher CVR due to better design
  }
};

// FIXED COSTS (Annual)
const FIXED_COSTS = {
  shopify: {
    plan: 39 * 12,          // Basic Shopify $39/month
    apps: 2000              // Various apps
  },
  customerService: 0,        // Handled by solopreneur
  returns: 0                 // Calculated per order
};

function calculateMonthlyProjections() {
  const projections = [];
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;

  for (let month = 1; month <= 12; month++) {
    const budget = AD_BUDGET[`month${month}`];

    // Organic traffic grows over time (solopreneur SEO skills)
    const organicTrafficRatio = SOLO_ADVANTAGES.seoSkills.organicTrafficGrowth[month - 1];
    const paidTrafficRatio = 1 - organicTrafficRatio;

    // Traffic calculation
    const paidVisitors = Math.floor((budget / BENCHMARKS.cpc));
    const organicVisitors = Math.floor(paidVisitors * (organicTrafficRatio / (1 - organicTrafficRatio)));
    const totalVisitors = paidVisitors + organicVisitors;

    // Conversion rate boosted by design skills
    const baseCVR = BENCHMARKS.cvr;
    const boostedCVR = baseCVR * (1 + SOLO_ADVANTAGES.designSkills.conversionBoost);

    // Orders
    const totalOrders = Math.floor(totalVisitors * boostedCVR);
    const returnedOrders = Math.floor(totalOrders * BENCHMARKS.returnRate);
    const netOrders = totalOrders - returnedOrders;

    // Revenue
    const grossRevenue = totalOrders * BENCHMARKS.aov;
    const returnRefunds = returnedOrders * BENCHMARKS.aov;
    const netRevenue = grossRevenue - returnRefunds;

    // COGS (Cost of Goods Sold)
    const cogs = totalOrders * REAL_MARGINS.avgCost;
    const returnedCOGS = returnedOrders * REAL_MARGINS.avgCost; // Lost on returns

    // Gross Profit
    const grossProfit = netRevenue - (cogs + returnedCOGS);

    // Operating Costs
    const processingFees = grossRevenue * BENCHMARKS.processingFee + (totalOrders * 0.30);
    const monthlyShopifyCosts = (FIXED_COSTS.shopify.plan + FIXED_COSTS.shopify.apps) / 12;

    const totalOpex = budget + processingFees + monthlyShopifyCosts;

    // Net Profit
    const netProfit = grossProfit - totalOpex;

    cumulativeRevenue += netRevenue;
    cumulativeProfit += netProfit;

    projections.push({
      month,
      budget,
      paidVisitors,
      organicVisitors,
      totalVisitors,
      organicRatio: (organicTrafficRatio * 100).toFixed(1) + '%',
      cvr: (boostedCVR * 100).toFixed(2) + '%',
      totalOrders,
      returnedOrders,
      netOrders,
      grossRevenue: grossRevenue.toFixed(2),
      returnRefunds: returnRefunds.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
      cogs: cogs.toFixed(2),
      returnedCOGS: returnedCOGS.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      processingFees: processingFees.toFixed(2),
      shopifyCosts: monthlyShopifyCosts.toFixed(2),
      totalOpex: totalOpex.toFixed(2),
      netProfit: netProfit.toFixed(2),
      cumulativeRevenue: cumulativeRevenue.toFixed(2),
      cumulativeProfit: cumulativeProfit.toFixed(2),
      marginPercent: ((grossProfit / netRevenue) * 100).toFixed(1) + '%',
      roas: (netRevenue / budget).toFixed(2)
    });
  }

  return projections;
}

function generateReport() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   MYDEALZ YEAR 1 PROJECTIONS - REAL 61.1% MARGINS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 REAL DATA FROM SHOPIFY (1,523 variants analyzed):\n');
  console.log(`Average Margin: ${(REAL_MARGINS.avgMargin * 100).toFixed(1)}%`);
  console.log(`Average Price: $${REAL_MARGINS.avgPrice.toFixed(2)}`);
  console.log(`Average Cost: $${REAL_MARGINS.avgCost.toFixed(2)}`);
  console.log(`Average Markup: ${REAL_MARGINS.avgMarkup.toFixed(2)}x\n`);

  const projections = calculateMonthlyProjections();

  // Year totals
  const yearTotals = {
    budget: AD_BUDGET.total,
    netRevenue: projections.reduce((sum, m) => sum + parseFloat(m.netRevenue), 0),
    grossProfit: projections.reduce((sum, m) => sum + parseFloat(m.grossProfit), 0),
    totalOpex: projections.reduce((sum, m) => sum + parseFloat(m.totalOpex), 0),
    netProfit: projections.reduce((sum, m) => sum + parseFloat(m.netProfit), 0),
    totalOrders: projections.reduce((sum, m) => sum + m.totalOrders, 0),
    totalVisitors: projections.reduce((sum, m) => sum + m.totalVisitors, 0)
  };

  console.log('📈 YEAR 1 SUMMARY:\n');
  console.log(`Ad Budget: $${yearTotals.budget.toLocaleString()}`);
  console.log(`Total Visitors: ${yearTotals.totalVisitors.toLocaleString()}`);
  console.log(`Total Orders: ${yearTotals.totalOrders.toLocaleString()}`);
  console.log(`Net Revenue: $${yearTotals.netRevenue.toLocaleString()}`);
  console.log(`Gross Profit: $${yearTotals.grossProfit.toLocaleString()}`);
  console.log(`Total Operating Costs: $${yearTotals.totalOpex.toLocaleString()}`);
  console.log(`NET PROFIT/LOSS: $${yearTotals.netProfit.toLocaleString()}`);
  console.log(`ROI: ${((yearTotals.netProfit / yearTotals.budget) * 100).toFixed(1)}%`);
  console.log(`ROAS: ${(yearTotals.netRevenue / yearTotals.budget).toFixed(2)}x\n`);

  // Monthly breakdown
  console.log('📅 MONTHLY BREAKDOWN:\n');
  console.log('Month | Budget | Visitors | Orders | Revenue | Profit | Organic%');
  console.log('-'.repeat(75));
  projections.forEach(m => {
    console.log(`${m.month.toString().padStart(5)} | $${m.budget.toString().padStart(4)} | ${m.totalVisitors.toString().padStart(8)} | ${m.totalOrders.toString().padStart(6)} | $${parseFloat(m.netRevenue).toFixed(0).padStart(6)} | $${parseFloat(m.netProfit).toFixed(0).padStart(6)} | ${m.organicRatio.padStart(6)}`);
  });

  console.log('\n');

  // Scenario analysis
  console.log('🎯 SCENARIO ANALYSIS:\n');

  if (yearTotals.netProfit > 0) {
    console.log('✅ PROFITABLE! MyDealz can be profitable in Year 1 with:');
    console.log('   - Real 61.1% margins');
    console.log('   - Solopreneur skills (AI + SEO + Design)');
    console.log('   - Growing organic traffic (70% by Month 12)\n');
  } else {
    console.log(`⚠️  Year 1 Loss: $${Math.abs(yearTotals.netProfit).toLocaleString()}`);
    console.log('   But much better than the -$21K projected with 51.1% margins!\n');
  }

  // Break-even analysis
  const breakEvenMonth = projections.findIndex(m => parseFloat(m.cumulativeProfit) > 0);
  if (breakEvenMonth !== -1) {
    console.log(`🎯 BREAK-EVEN: Month ${breakEvenMonth + 1}\n`);
  } else {
    console.log('⚠️  Does not break even in Year 1\n');
  }

  // Save report
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: 'REAL Shopify cost data (1,523 variants)',
      realMargins: REAL_MARGINS,
      soloAdvantages: SOLO_ADVANTAGES
    },
    yearTotals,
    monthlyProjections: projections,
    conclusion: yearTotals.netProfit > 0 ? 'PROFITABLE' : 'LOSS_BUT_VIABLE'
  };

  fs.writeFileSync('reports/PROJECTIONS_REAL_MARGINS_61PCT.json', JSON.stringify(report, null, 2));
  console.log('✅ Report saved to reports/PROJECTIONS_REAL_MARGINS_61PCT.json\n');

  console.log('═══════════════════════════════════════════════════════\n');

  return report;
}

generateReport();
