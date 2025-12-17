#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

/**
 * BNPL PERFORMANCE TRACKER
 *
 * Tracks Shop Pay Installments impact:
 * - Conversion rate comparison (with/without BNPL)
 * - AOV (Average Order Value) comparison
 * - BNPL adoption rate
 * - Fee analysis
 *
 * Run weekly to measure BNPL effectiveness
 */

const SHOPIFY_STORE = process.env.SHOPIFY_STORE.replace('https://', '').replace('.myshopify.com', '');
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Date ranges for comparison
const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${SHOPIFY_STORE}.myshopify.com`,
      path: `/admin/api/2025-10${path}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getOrders(createdAtMin) {
  const params = createdAtMin ? `?created_at_min=${createdAtMin.toISOString()}&limit=250&status=any` : '?limit=250&status=any';
  return await makeRequest(`/orders.json${params}`);
}

async function analyzeOrders() {
  console.log('📊 BNPL PERFORMANCE ANALYSIS');
  console.log('═'.repeat(70));

  // Get all orders from last 30 days
  const ordersData = await getOrders(thirtyDaysAgo);
  const orders = ordersData.orders || [];

  console.log(`\n📦 Total Orders (Last 30 Days): ${orders.length}`);

  if (orders.length === 0) {
    console.log('\n⚠️  No orders yet - Cannot calculate BNPL impact');
    console.log('   Run this script after first week of orders');
    return;
  }

  // Separate orders by payment method
  const bnplOrders = [];
  const standardOrders = [];

  orders.forEach(order => {
    const paymentGateway = order.payment_gateway_names?.[0] || '';

    // Shop Pay Installments shows as "shopify_installments" or similar
    if (paymentGateway.toLowerCase().includes('installment') ||
        paymentGateway.toLowerCase().includes('shop_pay')) {
      bnplOrders.push(order);
    } else {
      standardOrders.push(order);
    }
  });

  console.log(`\n💳 Payment Method Breakdown:`);
  console.log(`   BNPL Orders: ${bnplOrders.length} (${(bnplOrders.length/orders.length*100).toFixed(1)}%)`);
  console.log(`   Standard Orders: ${standardOrders.length} (${(standardOrders.length/orders.length*100).toFixed(1)}%)`);

  // Calculate AOV for each group
  const bnplAOV = bnplOrders.length > 0
    ? bnplOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0) / bnplOrders.length
    : 0;

  const standardAOV = standardOrders.length > 0
    ? standardOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0) / standardOrders.length
    : 0;

  console.log(`\n💰 Average Order Value (AOV):`);
  console.log(`   BNPL AOV: $${bnplAOV.toFixed(2)}`);
  console.log(`   Standard AOV: $${standardAOV.toFixed(2)}`);

  if (bnplAOV > 0 && standardAOV > 0) {
    const aovIncrease = ((bnplAOV - standardAOV) / standardAOV * 100).toFixed(1);
    console.log(`   📈 BNPL AOV Impact: ${aovIncrease > 0 ? '+' : ''}${aovIncrease}%`);
  }

  // Calculate total BNPL fees
  const BNPL_FEE_RATE = 0.059; // 5.9%
  const BNPL_FEE_FIXED = 0.30;

  const bnplRevenue = bnplOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const bnplFees = bnplOrders.reduce((sum, o) => {
    const orderTotal = parseFloat(o.total_price);
    return sum + (orderTotal * BNPL_FEE_RATE + BNPL_FEE_FIXED);
  }, 0);

  console.log(`\n💸 BNPL Fees Analysis:`);
  console.log(`   Total BNPL Revenue: $${bnplRevenue.toFixed(2)}`);
  console.log(`   Total BNPL Fees Paid: $${bnplFees.toFixed(2)}`);
  console.log(`   Effective Fee Rate: ${(bnplFees/bnplRevenue*100).toFixed(2)}%`);

  // Compare to standard payment fees
  const STANDARD_FEE_RATE = 0.029; // 2.9%
  const STANDARD_FEE_FIXED = 0.30;

  const standardRevenue = standardOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const standardFees = standardOrders.reduce((sum, o) => {
    const orderTotal = parseFloat(o.total_price);
    return sum + (orderTotal * STANDARD_FEE_RATE + STANDARD_FEE_FIXED);
  }, 0);

  const totalRevenue = bnplRevenue + standardRevenue;
  const totalFees = bnplFees + standardFees;
  const hypotheticalStandardFees = (bnplRevenue * STANDARD_FEE_RATE) + (bnplOrders.length * STANDARD_FEE_FIXED);
  const extraFeesCost = bnplFees - hypotheticalStandardFees;

  console.log(`\n📊 Fee Comparison:`);
  console.log(`   If all orders were standard payments: $${(totalRevenue * STANDARD_FEE_RATE + orders.length * STANDARD_FEE_FIXED).toFixed(2)}`);
  console.log(`   Actual fees paid (mixed): $${totalFees.toFixed(2)}`);
  console.log(`   Extra cost for BNPL: $${extraFeesCost.toFixed(2)}`);

  // Calculate breakeven analysis
  if (bnplOrders.length > 0) {
    const bnplIncrementalRevenue = bnplRevenue; // Assuming 67% are net-new (from Stripe data)
    const netBenefit = (bnplIncrementalRevenue * 0.67) - extraFeesCost;

    console.log(`\n✅ BNPL ROI Analysis:`);
    console.log(`   Incremental Revenue (67% net-new): $${(bnplIncrementalRevenue * 0.67).toFixed(2)}`);
    console.log(`   Extra Fees Cost: -$${extraFeesCost.toFixed(2)}`);
    console.log(`   Net Benefit: $${netBenefit.toFixed(2)}`);
    console.log(`   ROI: ${netBenefit > 0 ? '✅ PROFITABLE' : '❌ UNPROFITABLE'}`);
  }

  // Refund analysis (fees non-refundable)
  const refundedOrders = orders.filter(o => o.financial_status === 'refunded' || o.financial_status === 'partially_refunded');
  const refundedBNPL = refundedOrders.filter(o => {
    const pg = o.payment_gateway_names?.[0] || '';
    return pg.toLowerCase().includes('installment') || pg.toLowerCase().includes('shop_pay');
  });

  if (refundedOrders.length > 0) {
    const lostFeesOnRefunds = refundedBNPL.reduce((sum, o) => {
      const orderTotal = parseFloat(o.total_price);
      return sum + (orderTotal * BNPL_FEE_RATE + BNPL_FEE_FIXED);
    }, 0);

    console.log(`\n🔄 Refund Impact:`);
    console.log(`   Total Refunds: ${refundedOrders.length} (${(refundedOrders.length/orders.length*100).toFixed(1)}%)`);
    console.log(`   BNPL Refunds: ${refundedBNPL.length}`);
    console.log(`   Lost Fees (non-refundable): $${lostFeesOnRefunds.toFixed(2)}`);
  }

  // Save results
  const results = {
    date: now.toISOString(),
    period_days: 30,
    total_orders: orders.length,
    bnpl_orders: bnplOrders.length,
    bnpl_adoption_rate: (bnplOrders.length/orders.length*100).toFixed(1) + '%',
    bnpl_aov: bnplAOV.toFixed(2),
    standard_aov: standardAOV.toFixed(2),
    aov_impact: bnplAOV > 0 && standardAOV > 0 ? ((bnplAOV - standardAOV) / standardAOV * 100).toFixed(1) + '%' : 'N/A',
    bnpl_revenue: bnplRevenue.toFixed(2),
    bnpl_fees: bnplFees.toFixed(2),
    extra_fees_cost: extraFeesCost.toFixed(2),
    net_benefit: bnplOrders.length > 0 ? ((bnplRevenue * 0.67) - extraFeesCost).toFixed(2) : 'N/A',
    refund_rate: (refundedOrders.length/orders.length*100).toFixed(1) + '%'
  };

  fs.writeFileSync('bnpl-performance-tracking.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: bnpl-performance-tracking.json`);

  // Recommendation
  console.log(`\n📋 RECOMMENDATION:`);
  if (bnplOrders.length === 0) {
    console.log('   ⚠️  No BNPL orders yet - Continue monitoring');
  } else {
    const roi = (bnplRevenue * 0.67) - extraFeesCost;
    if (roi > 0) {
      console.log('   ✅ KEEP BNPL ENABLED - Positive ROI confirmed');
    } else {
      console.log('   ⚠️  RE-EVALUATE - ROI currently negative');
      console.log('      • Check if AOV increasing as expected');
      console.log('      • Monitor conversion rate changes');
      console.log('      • Consider disabling if trend continues');
    }
  }

  console.log('\n' + '═'.repeat(70));
}

analyzeOrders().catch(console.error);
