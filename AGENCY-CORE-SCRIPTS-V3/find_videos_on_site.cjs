// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SHOP = process.env.SHOPIFY_STORE_URL;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2025-10';

async function findVideosOnSite() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMPREHENSIVE VIDEO SEARCH - ALL SOURCES');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('[1/3] Checking product media (Shopify CDN videos)...\n');

  // Check Shopify media
  let productsWithMedia = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const query = `
    {
      products(first: 50${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          media(first: 100) {
            nodes {
              __typename
              ... on Video {
                id
                mediaContentType
                alt
                sources {
                  url
                  mimeType
                  format
                  height
                  width
                }
              }
              ... on ExternalVideo {
                id
                mediaContentType
                alt
                embedUrl
                host
              }
            }
          }
        }
      }
    }
    `;

    const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      break;
    }

    const products = result.data.products.nodes;

    for (const product of products) {
      const videos = product.media.nodes.filter(m =>
        m.__typename === 'Video' || m.__typename === 'ExternalVideo'
      );

      if (videos.length > 0) {
        productsWithMedia.push({
          title: product.title,
          handle: product.handle,
          videos: videos
        });
      }
    }

    hasNextPage = result.data.products.pageInfo.hasNextPage;
    cursor = result.data.products.pageInfo.endCursor;
  }

  console.log(`✅ Shopify media scan complete`);
  console.log(`   Found: ${productsWithMedia.length} products with video media\n`);

  // Check product descriptions for embedded videos
  console.log('[2/3] Checking product descriptions for embedded videos...\n');

  const descResponse = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/products.json?fields=id,title,handle,body_html&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': TOKEN
      }
    }
  );

  const descResult = await descResponse.json();
  const productsWithEmbeddedVideos = [];

  for (const product of descResult.products) {
    const html = product.body_html || '';
    const hasYoutube = html.includes('youtube') || html.includes('youtu.be');
    const hasVimeo = html.includes('vimeo');
    const hasVideoTag = html.includes('<video');
    const hasIframe = html.includes('<iframe');

    if (hasYoutube || hasVimeo || hasVideoTag) {
      // Extract video URLs
      const youtubeMatches = html.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/g) || [];
      const vimeoMatches = html.match(/vimeo\.com\/(\d+)/g) || [];

      productsWithEmbeddedVideos.push({
        title: product.title,
        handle: product.handle,
        youtube: youtubeMatches.length,
        vimeo: vimeoMatches.length,
        videoTag: hasVideoTag,
        urls: [...youtubeMatches, ...vimeoMatches]
      });
    }
  }

  console.log(`✅ Description scan complete`);
  console.log(`   Found: ${productsWithEmbeddedVideos.length} products with embedded videos\n`);

  // Check pages (About, Contact, etc.)
  console.log('[3/3] Checking site pages for videos...\n');

  const pagesResponse = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/pages.json?fields=id,title,handle,body_html`,
    {
      headers: {
        'X-Shopify-Access-Token': TOKEN
      }
    }
  );

  const pagesResult = await pagesResponse.json();
  const pagesWithVideos = [];

  for (const page of pagesResult.pages) {
    const html = page.body_html || '';
    const hasVideo = html.includes('youtube') || html.includes('vimeo') || html.includes('<video');

    if (hasVideo) {
      pagesWithVideos.push({
        title: page.title,
        handle: page.handle
      });
    }
  }

  console.log(`✅ Pages scan complete`);
  console.log(`   Found: ${pagesWithVideos.length} pages with videos\n`);

  // Results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FINAL RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const totalVideos = productsWithMedia.length + productsWithEmbeddedVideos.length + pagesWithVideos.length;

  console.log(`Total video sources found: ${totalVideos}`);
  console.log(`  - Shopify media (CDN): ${productsWithMedia.length}`);
  console.log(`  - Embedded in descriptions: ${productsWithEmbeddedVideos.length}`);
  console.log(`  - In pages: ${pagesWithVideos.length}\n`);

  if (productsWithEmbeddedVideos.length > 0) {
    console.log('PRODUCTS WITH EMBEDDED VIDEOS:\n');
    productsWithEmbeddedVideos.forEach((p, idx) => {
      console.log(`[${idx + 1}] ${p.title}`);
      console.log(`    Handle: ${p.handle}`);
      console.log(`    YouTube videos: ${p.youtube}`);
      console.log(`    Vimeo videos: ${p.vimeo}`);
      console.log(`    Video tag: ${p.videoTag ? 'Yes' : 'No'}`);
      if (p.urls.length > 0) {
        console.log(`    URLs: ${p.urls.join(', ')}`);
      }
      console.log('');
    });

    fs.writeFileSync('/tmp/products_with_embedded_videos.json', JSON.stringify(productsWithEmbeddedVideos, null, 2));
    console.log('💾 Full results: /tmp/products_with_embedded_videos.json\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  VIDEO SITEMAP ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (productsWithMedia.length > 0) {
    console.log('✅ SHOPIFY CDN VIDEOS FOUND');
    console.log('   Shopify should auto-generate sitemap_videos_1.xml');
    console.log('   Check: https://mydealz.shop/sitemap_videos_1.xml\n');
  } else if (productsWithEmbeddedVideos.length > 0) {
    console.log('⚠️  EMBEDDED VIDEOS FOUND (YouTube/Vimeo)');
    console.log('   Shopify does NOT generate video sitemap for embedded videos');
    console.log('   Only Shopify-hosted videos appear in sitemap_videos_1.xml');
    console.log('   Embedded videos require manual video sitemap creation\n');
  } else {
    console.log('❌ NO VIDEOS FOUND');
    console.log('   sitemap_videos_1.xml will NOT exist (normal)\n');
  }
}

findVideosOnSite().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
