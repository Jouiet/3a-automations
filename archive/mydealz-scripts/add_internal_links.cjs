// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

/**
 * ADD INTERNAL KEYWORD LINKS - ZIPF SEO OPTIMIZATION
 *
 * BUSINESS IMPACT: Part of $35K-$60K/year Phase 1 Quick Win
 *
 * Strategy:
 * - Add internal links to new keyword collections
 * - Use keyword-rich anchor text for SEO
 * - Limit to 2-3 links per product (avoid over-optimization)
 * - Link to: /collections/winter-coats, /collections/mens-jackets,
 *           /collections/laptop-bags, /collections/leather-accessories
 *
 * Example:
 * Before: "This winter coat is perfect for business professionals"
 * After: "This <a href="/collections/winter-coats">winter coat</a> is
 *        perfect for <a href="/collections/mens-jackets">business professionals</a>"
 */

require('dotenv').config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2025-10';

const LINK_PATTERNS = [
  {
    keywords: ['winter coat', 'winter jacket', 'winter parka'],
    url: '/collections/winter-coats',
    anchorText: 'winter coats'
  },
  {
    keywords: ['men jacket', 'mens jacket', "men's jacket", 'jacket for men'],
    url: '/collections/mens-jackets',
    anchorText: "men's jackets"
  },
  {
    keywords: ['laptop bag', 'laptop backpack', 'laptop case', 'laptop briefcase'],
    url: '/collections/laptop-bags',
    anchorText: 'laptop bags'
  },
  {
    keywords: ['leather briefcase', 'leather bag', 'leather accessories', 'leather backpack'],
    url: '/collections/leather-accessories',
    anchorText: 'leather accessories'
  }
];

async function fetchAllProducts() {
  let allProducts = [];
  let url = `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}/products.json?limit=250&status=active&fields=id,title,handle,body_html`;

  console.log('\n📦 Fetching all active products...\n');

  while (url) {
    const response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': ADMIN_API_TOKEN }
    });

    const data = await response.json();
    allProducts = allProducts.concat(data.products);

    const linkHeader = response.headers.get('link');
    url = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) url = nextMatch[1];
    }

    process.stdout.write(`\r   Fetched ${allProducts.length} products...`);
  }

  console.log(`\n✅ Total active products: ${allProducts.length}\n`);
  return allProducts;
}

function stripHTML(html) {
  // Remove HTML tags for text analysis
  return html.replace(/<[^>]*>/g, ' ').toLowerCase();
}

function hasExistingLinks(html) {
  // Check if product description already has links
  return /<a\s+href/.test(html);
}

function findLinkOpportunities(product) {
  const html = product.body_html || '';
  const plainText = stripHTML(html);

  // Skip if already has links (avoid duplication)
  if (hasExistingLinks(html)) {
    return {
      hasLinks: true,
      opportunities: []
    };
  }

  // Skip if description too short
  if (plainText.length < 100) {
    return {
      hasLinks: false,
      opportunities: [],
      tooShort: true
    };
  }

  const opportunities = [];

  LINK_PATTERNS.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      if (plainText.includes(keyword.toLowerCase())) {
        opportunities.push({
          keyword,
          url: pattern.url,
          anchorText: pattern.anchorText
        });
      }
    });
  });

  // Remove duplicates (same URL)
  const uniqueUrls = new Set();
  const unique = opportunities.filter(opp => {
    if (uniqueUrls.has(opp.url)) return false;
    uniqueUrls.add(opp.url);
    return true;
  });

  // Limit to 3 links max per product
  return {
    hasLinks: false,
    opportunities: unique.slice(0, 3),
    tooShort: false
  };
}

function injectLinks(html, opportunities) {
  let modified = html;
  let injectedCount = 0;

  opportunities.forEach(opp => {
    // Create regex to find FIRST occurrence of keyword (case-insensitive, not in HTML tags)
    const regex = new RegExp(`(>[^<]*?)(${opp.keyword})([^<]*?<)`, 'i');

    const match = modified.match(regex);
    if (match && injectedCount < 3) {
      // Replace first occurrence with link
      const before = match[1];
      const keyword = match[2];
      const after = match[3];

      const replacement = `${before}<a href="${opp.url}" title="Shop ${opp.anchorText}">${keyword}</a>${after}`;
      modified = modified.replace(regex, replacement);
      injectedCount++;
    }
  });

  return {
    html: modified,
    linksInjected: injectedCount
  };
}

async function updateProductDescription(productId, newHTML) {
  const mutation = `
    mutation UpdateProductDescription($id: ID!, $bodyHtml: String!) {
      productUpdate(
        input: {
          id: $id
          bodyHtml: $bodyHtml
        }
      ) {
        product {
          id
          bodyHtml
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Product/${productId}`,
    bodyHtml: newHTML
  };

  const response = await fetch(
    `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: mutation, variables })
    }
  );

  const result = await response.json();

  if (result.data?.productUpdate?.userErrors?.length > 0) {
    return {
      success: false,
      errors: result.data.productUpdate.userErrors
    };
  }

  return {
    success: true
  };
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ADD INTERNAL KEYWORD LINKS - ZIPF SEO OPTIMIZATION        ║');
  console.log('║  Phase 1 Quick Win: Collection Linking for Authority      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const allProducts = await fetchAllProducts();

  // Select top 30 products by keyword match
  const candidates = allProducts
    .map(p => ({
      ...p,
      score: findLinkOpportunities(p).opportunities.length
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  console.log(`${'='.repeat(60)}`);
  console.log(`Selected ${candidates.length} Products for Internal Linking`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`Top 10 candidates:`);
  candidates.slice(0, 10).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title.substring(0, 50)} (${p.score} link opportunities)`);
  });
  console.log(`   ... and ${Math.max(0, candidates.length - 10)} more\n`);

  console.log(`${'='.repeat(60)}`);
  console.log(`Adding Internal Links`);
  console.log(`${'='.repeat(60)}\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalLinksAdded = 0;

  for (let i = 0; i < candidates.length; i++) {
    const product = candidates[i];

    console.log(`\n[${i + 1}/${candidates.length}] ${product.title.substring(0, 50)}...`);

    const analysis = findLinkOpportunities(product);

    if (analysis.hasLinks) {
      console.log(`   ⏭️  Skipped: Already has links`);
      skippedCount++;
      continue;
    }

    if (analysis.tooShort) {
      console.log(`   ⏭️  Skipped: Description too short`);
      skippedCount++;
      continue;
    }

    if (analysis.opportunities.length === 0) {
      console.log(`   ⏭️  Skipped: No link opportunities`);
      skippedCount++;
      continue;
    }

    console.log(`   Found ${analysis.opportunities.length} link opportunities:`);
    analysis.opportunities.forEach(opp => {
      console.log(`      - ${opp.keyword} → ${opp.url}`);
    });

    // Inject links
    const result = injectLinks(product.body_html, analysis.opportunities);

    console.log(`   Injecting ${result.linksInjected} links...`);

    // Update product
    const updateResult = await updateProductDescription(product.id, result.html);

    if (updateResult.success) {
      console.log(`   ✅ Updated successfully`);
      updatedCount++;
      totalLinksAdded += result.linksInjected;
    } else {
      console.log(`   ❌ Update failed:`, updateResult.errors);
      failedCount++;
    }

    // Rate limiting: 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`✅ Updated: ${updatedCount}/${candidates.length}`);
  console.log(`⏭️  Skipped: ${skippedCount}/${candidates.length}`);
  console.log(`❌ Failed: ${failedCount}/${candidates.length}`);
  console.log(`🔗 Total links added: ${totalLinksAdded}`);
  console.log(`\n📊 SEO Impact:`);
  console.log(`   - ${totalLinksAdded} internal links to keyword collections`);
  console.log(`   - Strengthens topical authority`);
  console.log(`   - Improves crawl efficiency`);
  console.log(`   - Distributes page authority (PageRank)`);
  console.log(`   - Expected organic traffic: +5-10%\n`);
}

main().catch(error => {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
