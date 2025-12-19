require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function extractCompleteProductData() {
  console.log('═'.repeat(80));
  console.log('HENDERSON SHOP - COMPLETE PRODUCT DATA EXTRACTION');
  console.log('═'.repeat(80));
  console.log();

  try {
    // Fetch ALL products with complete data
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const products = data.products || [];

    console.log(`📦 Total Products: ${products.length}`);
    console.log();

    // Analyze product segments
    const segments = {
      helmet: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      jacket: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      glove: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      boot: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      pant: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      accessory: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      bundle: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 },
      uncategorized: { products: [], variants: [], totalRevenue: 0, avgPrice: 0 }
    };

    // Sub-segments by riding style
    const ridingStyles = {
      sport: { products: [], avgPrice: 0 },
      touring: { products: [], avgPrice: 0 },
      adventure: { products: [], avgPrice: 0 },
      cruiser: { products: [], avgPrice: 0 },
      urban: { products: [], avgPrice: 0 },
      racing: { products: [], avgPrice: 0 },
      casual: { products: [], avgPrice: 0 },
      'all-season': { products: [], avgPrice: 0 }
    };

    // Material segments
    const materials = {
      leather: { products: [], avgPrice: 0 },
      textile: { products: [], avgPrice: 0 },
      carbon: { products: [], avgPrice: 0 },
      synthetic: { products: [], avgPrice: 0 }
    };

    // Safety/certification segments
    const safety = {
      'CE-certified': { products: [], avgPrice: 0 },
      'DOT': { products: [], avgPrice: 0 },
      'ECE': { products: [], avgPrice: 0 },
      'protective': { products: [], avgPrice: 0 }
    };

    // Feature segments
    const features = {
      'waterproof': { products: [], avgPrice: 0 },
      'breathable': { products: [], avgPrice: 0 },
      'bluetooth': { products: [], avgPrice: 0 },
      'ventilated': { products: [], avgPrice: 0 },
      'reflective': { products: [], avgPrice: 0 }
    };

    // Gender segments
    const gender = {
      'men': { products: [], avgPrice: 0 },
      'women': { products: [], avgPrice: 0 },
      'unisex': { products: [], avgPrice: 0 }
    };

    // Season segments
    const season = {
      'winter': { products: [], avgPrice: 0 },
      'summer': { products: [], avgPrice: 0 },
      'all-season': { products: [], avgPrice: 0 }
    };

    products.forEach(product => {
      const title = product.title.toLowerCase();
      const tags = product.tags ? product.tags.toLowerCase().split(', ') : [];
      const productType = (product.product_type || '').toLowerCase();

      // Calculate average price for product
      const prices = product.variants.map(v => parseFloat(v.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Categorize by product type (primary segment)
      let primarySegment = 'uncategorized';

      if (title.includes('helmet') || tags.includes('helmet')) {
        primarySegment = 'helmet';
      } else if (title.includes('jacket') || tags.includes('jacket')) {
        primarySegment = 'jacket';
      } else if (title.includes('glove') || tags.includes('glove')) {
        primarySegment = 'glove';
      } else if (title.includes('boot') || title.includes('shoe') || tags.includes('boot')) {
        primarySegment = 'boot';
      } else if (title.includes('pant') || title.includes('trouser') || tags.includes('pant')) {
        primarySegment = 'pant';
      } else if (title.includes('bundle') || title.includes('kit') || title.includes('set')) {
        primarySegment = 'bundle';
      } else if (tags.some(t => ['bag', 'backpack', 'cover', 'protector', 'pad'].includes(t))) {
        primarySegment = 'accessory';
      }

      segments[primarySegment].products.push(product);
      segments[primarySegment].variants.push(...product.variants);
      segments[primarySegment].totalRevenue += avgPrice;

      // Categorize by riding style (sub-segment)
      Object.keys(ridingStyles).forEach(style => {
        if (tags.includes(style) || title.includes(style)) {
          ridingStyles[style].products.push(product);
        }
      });

      // Categorize by material
      Object.keys(materials).forEach(mat => {
        if (tags.includes(mat) || title.includes(mat)) {
          materials[mat].products.push(product);
        }
      });

      // Categorize by safety
      Object.keys(safety).forEach(cert => {
        if (tags.includes(cert) || title.includes(cert)) {
          safety[cert].products.push(product);
        }
      });

      // Categorize by features
      Object.keys(features).forEach(feat => {
        if (tags.includes(feat) || title.includes(feat)) {
          features[feat].products.push(product);
        }
      });

      // Categorize by gender
      Object.keys(gender).forEach(gen => {
        if (tags.includes(gen) || title.includes(gen)) {
          gender[gen].products.push(product);
        }
      });

      // Categorize by season
      Object.keys(season).forEach(seas => {
        if (tags.includes(seas) || title.includes(seas)) {
          season[seas].products.push(product);
        }
      });
    });

    // Calculate averages
    Object.keys(segments).forEach(seg => {
      if (segments[seg].products.length > 0) {
        segments[seg].avgPrice = segments[seg].totalRevenue / segments[seg].products.length;
      }
    });

    Object.keys(ridingStyles).forEach(style => {
      if (ridingStyles[style].products.length > 0) {
        const total = ridingStyles[style].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        ridingStyles[style].avgPrice = total / ridingStyles[style].products.length;
      }
    });

    Object.keys(materials).forEach(mat => {
      if (materials[mat].products.length > 0) {
        const total = materials[mat].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        materials[mat].avgPrice = total / materials[mat].products.length;
      }
    });

    Object.keys(safety).forEach(cert => {
      if (safety[cert].products.length > 0) {
        const total = safety[cert].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        safety[cert].avgPrice = total / safety[cert].products.length;
      }
    });

    Object.keys(features).forEach(feat => {
      if (features[feat].products.length > 0) {
        const total = features[feat].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        features[feat].avgPrice = total / features[feat].products.length;
      }
    });

    Object.keys(gender).forEach(gen => {
      if (gender[gen].products.length > 0) {
        const total = gender[gen].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        gender[gen].avgPrice = total / gender[gen].products.length;
      }
    });

    Object.keys(season).forEach(seas => {
      if (season[seas].products.length > 0) {
        const total = season[seas].products.reduce((sum, p) => {
          const prices = p.variants.map(v => parseFloat(v.price));
          return sum + (prices.reduce((a, b) => a + b, 0) / prices.length);
        }, 0);
        season[seas].avgPrice = total / season[seas].products.length;
      }
    });

    // Print analysis
    console.log('📊 PRIMARY SEGMENTS ANALYSIS');
    console.log('─'.repeat(80));
    Object.entries(segments)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([seg, data]) => {
        console.log(`${seg.toUpperCase().padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)} | Variants: ${data.variants.length}`);
      });
    console.log();

    console.log('🏍️  RIDING STYLE SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(ridingStyles)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([style, data]) => {
        console.log(`${style.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    console.log('🧵 MATERIAL SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(materials)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([mat, data]) => {
        console.log(`${mat.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    console.log('🛡️  SAFETY/CERTIFICATION SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(safety)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([cert, data]) => {
        console.log(`${cert.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    console.log('⚙️  FEATURE SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(features)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([feat, data]) => {
        console.log(`${feat.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    console.log('👤 GENDER SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(gender)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([gen, data]) => {
        console.log(`${gen.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    console.log('🌤️  SEASON SUB-SEGMENTS');
    console.log('─'.repeat(80));
    Object.entries(season)
      .filter(([_, data]) => data.products.length > 0)
      .sort((a, b) => b[1].products.length - a[1].products.length)
      .forEach(([seas, data]) => {
        console.log(`${seas.padEnd(20)} ${data.products.length.toString().padStart(4)} products | AOV: $${data.avgPrice.toFixed(2).padStart(7)}`);
      });
    console.log();

    // Save complete analysis
    const analysis = {
      analysis_date: new Date().toISOString(),
      total_products: products.length,
      segments,
      sub_segments: {
        riding_style: ridingStyles,
        material: materials,
        safety: safety,
        features: features,
        gender: gender,
        season: season
      },
      raw_products: products
    };

    require('fs').writeFileSync(
      '/tmp/henderson-complete-product-segmentation.json',
      JSON.stringify(analysis, null, 2)
    );

    console.log('═'.repeat(80));
    console.log('💾 Complete analysis saved: /tmp/henderson-complete-product-segmentation.json');
    console.log('═'.repeat(80));
    console.log();

    return analysis;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  }
}

extractCompleteProductData();
