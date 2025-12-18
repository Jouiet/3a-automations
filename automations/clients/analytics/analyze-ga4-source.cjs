#!/usr/bin/env node
/**
 * ANALYZE GA4 - D'où vient le trafic et la vente?
 * Note: Nécessite Google Analytics Data API access
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('='.repeat(80));
console.log('📊 ANALYSE GOOGLE ANALYTICS 4 - SOURCE TRAFFIC');
console.log('='.repeat(80));
console.log('');

console.log('⚠️  NOTE:');
console.log('Google Analytics Data API nécessite OAuth setup.');
console.log('Données disponibles via GA4 dashboard:');
console.log('');
console.log('🔗 ACCÈS GA4:');
console.log('1. Aller sur: https://analytics.google.com');
console.log('2. Property: Henderson Shop (510929364)');
console.log('3. Measurement ID: G-HFRWK3TR61');
console.log('');
console.log('📊 ANALYSES RECOMMANDÉES:');
console.log('');
console.log('1. ACQUISITION OVERVIEW (derniers 30 jours):');
console.log('   Reports > Acquisition > Traffic acquisition');
console.log('   └─ Voir: Organic search, Direct, Referral, etc.');
console.log('');
console.log('2. USER TIMELINE (15 Nov 2025, ~16:40 PST):');
console.log('   Explore > User explorer');
console.log('   └─ Filtrer: Transactions = 1, Date = 15 Nov');
console.log('   └─ Voir source/medium du user qui a converti');
console.log('');
console.log('3. E-COMMERCE EVENTS:');
console.log('   Reports > Monetization > Ecommerce purchases');
console.log('   └─ Voir détails transaction $309');
console.log('');
console.log('4. SOURCE/MEDIUM BREAKDOWN:');
console.log('   Explore > Free form');
console.log('   Dimensions: Session source/medium');
console.log('   Metrics: Transactions, Transaction revenue');
console.log('');
console.log('💡 QUESTIONS À RÉPONDRE:');
console.log('');
console.log('   1. Source acquisition: google / organic? direct / none? facebook / cpc?');
console.log('   2. Landing page: Quelle page visitée en premier?');
console.log('   3. User journey: Combien de pages vues avant achat?');
console.log('   4. Device: Desktop ou mobile?');
console.log('   5. Location: Quelle région USA?');
console.log('');
console.log('📧 ALTERNATIVE - GOOGLE SEARCH CONSOLE:');
console.log('1. https://search.google.com/search-console');
console.log('2. Property: www.hendersonshop.com');
console.log('3. Performance > Search results');
console.log('4. Filter dates: 15 Nov 2025');
console.log('5. Voir: Queries, pages, impressions, clicks');
console.log('');
console.log('🔍 DONNÉES ACTUELLEMENT DISPONIBLES:');
console.log('');
console.log('✅ Client créé: 15 Nov 2025, 16:40:24 PST');
console.log('✅ Order créé: 15 Nov 2025, 16:41:13 PST (49 secondes après)');
console.log('✅ Produit: Beginner Confidence Builder ($309)');
console.log('✅ Email: Non fourni dans order (checkout as guest?)');
console.log('');
console.log('❓ HYPOTHÈSES:');
console.log('');
console.log('1. DIRECT TRAFFIC:');
console.log('   - Client connaissait déjà le site');
console.log('   - Venu directement sur page produit');
console.log('   - Achat rapide (< 1 minute)');
console.log('');
console.log('2. GOOGLE ORGANIC:');
console.log('   - Recherche "beginner motorcycle bundle" ou similaire');
console.log('   - Landing sur page bundle');
console.log('   - Conversion immediate');
console.log('');
console.log('3. SOCIAL/REFERRAL:');
console.log('   - Link depuis Facebook, forum, etc.');
console.log('   - Trafic qualifié');
console.log('');
console.log('4. TEST ORDER (INTERNE):');
console.log('   - Propriétaire ou team');
console.log('   - Test fulfillment process');
console.log('   └─ MAIS: Paid $309 real money + Fulfilled = peu probable');
console.log('');
console.log('='.repeat(80));
console.log('🎯 ACTION REQUISE:');
console.log('='.repeat(80));
console.log('');
console.log('Accéder à GA4 dashboard pour obtenir source acquisition réelle.');
console.log('Sans accès API, impossible d\'automatiser cette analyse.');
console.log('');

