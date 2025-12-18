#!/usr/bin/env node
/**
 * 3A Automation - Fix Missing Alt Text
 * Génère automatiquement des alt text SEO pour les images produits
 *
 * Usage: node scripts/fix-missing-alt-text.cjs [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run  : Affiche les changements sans les appliquer
 *   --limit=N  : Limite le nombre de produits à traiter
 */

require('dotenv').config({ path: '/Users/mac/Desktop/JO-AAA/.env' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;

if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    console.error('ERROR: SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN required in .env');
    process.exit(1);
}

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

/**
 * Generate SEO-friendly alt text from product and image data
 * Optimized for max 100 chars (SEO best practice)
 */
function generateAltText(product, image, imageIndex) {
    const productTitle = product.title || 'Product';

    // Truncate long product titles
    let title = productTitle;
    if (title.length > 60) {
        // Keep first meaningful part
        title = title.substring(0, 57) + '...';
    }

    // Build concise alt text
    let altText = title;

    // Add image position for multiple images (compact format)
    if (product.images && product.images.length > 1) {
        const position = imageIndex + 1;
        if (position === 1) {
            altText += ' - main view';
        } else {
            altText += ` - view ${position}`;
        }
    }

    // Ensure alt text is not too long (max 100 chars for SEO)
    if (altText.length > 100) {
        altText = altText.substring(0, 97) + '...';
    }

    return altText;
}

/**
 * Fetch all products with images
 */
async function fetchProducts() {
    const products = [];
    let url = `${BASE_URL}/products.json?limit=250&fields=id,title,vendor,product_type,images`;

    while (url) {
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Shopify API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        products.push(...data.products);

        // Check for pagination
        const linkHeader = response.headers.get('link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
            const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            url = match ? match[1] : null;
        } else {
            url = null;
        }
    }

    return products;
}

/**
 * Update image alt text
 */
async function updateImageAltText(productId, imageId, altText) {
    const url = `${BASE_URL}/products/${productId}/images/${imageId}.json`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'X-Shopify-Access-Token': SHOPIFY_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: {
                id: imageId,
                alt: altText
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update image ${imageId}: ${response.status} - ${error}`);
    }

    return await response.json();
}

/**
 * Main execution
 */
async function main() {
    console.log('============================================================');
    console.log('3A AUTOMATION - FIX MISSING ALT TEXT');
    console.log('============================================================');
    console.log(`Store: ${SHOPIFY_STORE}`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will update)'}`);
    if (LIMIT) console.log(`Limit: ${LIMIT} products`);
    console.log('------------------------------------------------------------');

    // Fetch all products
    console.log('\nFetching products...');
    let products = await fetchProducts();
    console.log(`Found ${products.length} products`);

    // Apply limit if specified
    if (LIMIT) {
        products = products.slice(0, LIMIT);
        console.log(`Processing first ${LIMIT} products`);
    }

    // Find images missing alt text
    const imagesToFix = [];

    for (const product of products) {
        if (!product.images || product.images.length === 0) continue;

        product.images.forEach((image, index) => {
            if (!image.alt || image.alt.trim() === '') {
                imagesToFix.push({
                    productId: product.id,
                    productTitle: product.title,
                    imageId: image.id,
                    imageIndex: index,
                    currentAlt: image.alt,
                    newAlt: generateAltText(product, image, index)
                });
            }
        });
    }

    console.log(`\nFound ${imagesToFix.length} images missing alt text`);

    if (imagesToFix.length === 0) {
        console.log('\nAll images have alt text. Nothing to fix.');
        return { fixed: 0, total: 0 };
    }

    // Process images
    let fixed = 0;
    let errors = 0;

    console.log('\n------------------------------------------------------------');
    console.log('Processing images...');
    console.log('------------------------------------------------------------\n');

    for (const item of imagesToFix) {
        try {
            if (DRY_RUN) {
                console.log(`[DRY] ${item.productTitle}`);
                console.log(`      Image ${item.imageId}: "${item.newAlt}"`);
            } else {
                await updateImageAltText(item.productId, item.imageId, item.newAlt);
                console.log(`[OK] ${item.productTitle} - Image ${item.imageId}`);
                fixed++;

                // Rate limiting: 2 requests per second (Shopify limit is 40/s but being safe)
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`[ERROR] ${item.productTitle}: ${error.message}`);
            errors++;
        }
    }

    // Summary
    console.log('\n============================================================');
    console.log('SUMMARY');
    console.log('============================================================');
    console.log(`Total images processed: ${imagesToFix.length}`);
    if (!DRY_RUN) {
        console.log(`Successfully fixed: ${fixed}`);
        console.log(`Errors: ${errors}`);
    } else {
        console.log('DRY RUN - No changes made');
        console.log(`Would fix: ${imagesToFix.length} images`);
    }
    console.log('============================================================');

    return { fixed: DRY_RUN ? 0 : fixed, total: imagesToFix.length, errors };
}

main()
    .then(result => {
        process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
