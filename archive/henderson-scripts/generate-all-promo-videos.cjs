#!/usr/bin/env node
/**
 * BATCH VIDEO GENERATION MASTER
 * Purpose: Generate all promotional videos in parallel
 * Method: Parallel execution of video generation scripts
 * Context: Session 98+++ - Marketing automation Phase 3
 *
 * Scenarios:
 * 1. Homepage → Helmets → Product Details
 * 2. Homepage → Bundles → Add to Cart → Checkout
 * 3. Homepage → Search → Results → Product
 * 4. Mobile Responsive (iPhone SE viewport)
 * 5. Abandoned Cart Recovery Journey
 *
 * Output: 5 videos (1080p 30fps) + 4 portrait versions (1080x1920)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, '../promo-videos');

// Video generation scripts
const VIDEO_SCRIPTS = [
  {
    name: 'Helmets Demo (POC)',
    script: 'generate-promo-video.cjs',
    duration: '~25s',
    priority: 1
  },
  {
    name: 'Bundles Showcase',
    script: 'generate-promo-video-bundles.cjs',
    duration: '~30s',
    priority: 1
  },
  {
    name: 'Search Functionality',
    script: 'generate-promo-video-search.cjs',
    duration: '~30s',
    priority: 2
  },
  {
    name: 'Mobile Responsive',
    script: 'generate-promo-video-mobile.cjs',
    duration: '~25s',
    priority: 2
  },
  {
    name: 'Cart Recovery Journey',
    script: 'generate-promo-video-cart-recovery.cjs',
    duration: '~40s',
    priority: 3
  }
];

console.log('================================================================================');
console.log('HENDERSON SHOP - BATCH VIDEO GENERATION');
console.log('================================================================================');
console.log(`Total Scenarios: ${VIDEO_SCRIPTS.length}`);
console.log(`Parallel Execution: ${Math.min(VIDEO_SCRIPTS.length, 3)} concurrent processes`);
console.log(`Estimated Total Time: 2-3 minutes (parallel)`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
  }
}

/**
 * Execute a single video generation script
 */
function executeVideoScript(scriptConfig) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptConfig.script);

    console.log(`\n🎬 Starting: ${scriptConfig.name}`);
    console.log(`   Script: ${scriptConfig.script}`);
    console.log(`   Expected Duration: ${scriptConfig.duration}`);

    const startTime = Date.now();

    const process = spawn('node', [scriptPath], {
      cwd: SCRIPTS_DIR,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(`\n✅ Completed: ${scriptConfig.name} (${duration}s)`);

        // Extract file size from output
        const sizeMatch = stdout.match(/Size: ([\d.]+) MB/);
        const fileSize = sizeMatch ? sizeMatch[1] : 'unknown';

        resolve({
          name: scriptConfig.name,
          script: scriptConfig.script,
          success: true,
          duration,
          fileSize,
          output: stdout
        });
      } else {
        console.error(`\n❌ Failed: ${scriptConfig.name}`);
        console.error(`   Error code: ${code}`);

        resolve({
          name: scriptConfig.name,
          script: scriptConfig.script,
          success: false,
          duration,
          error: stderr || 'Unknown error',
          code
        });
      }
    });

    process.on('error', (error) => {
      console.error(`\n❌ Process error: ${scriptConfig.name}`);
      console.error(`   ${error.message}`);

      resolve({
        name: scriptConfig.name,
        script: scriptConfig.script,
        success: false,
        error: error.message
      });
    });
  });
}

/**
 * Execute scripts in parallel batches
 */
async function executeInBatches(scripts, batchSize = 3) {
  const results = [];

  for (let i = 0; i < scripts.length; i += batchSize) {
    const batch = scripts.slice(i, i + batchSize);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`BATCH ${Math.floor(i / batchSize) + 1}: Processing ${batch.length} video(s) in parallel...`);
    console.log('='.repeat(80));

    const batchResults = await Promise.all(
      batch.map(script => executeVideoScript(script))
    );

    results.push(...batchResults);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`BATCH ${Math.floor(i / batchSize) + 1} COMPLETE`);
    console.log('='.repeat(80));
  }

  return results;
}

/**
 * Run portrait conversion on generated videos
 */
async function convertToPortrait() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('PORTRAIT CONVERSION: Converting landscape videos for social media...');
  console.log('='.repeat(80) + '\n');

  const convertScript = path.join(SCRIPTS_DIR, 'convert-video-portrait.cjs');

  return new Promise((resolve, reject) => {
    const process = spawn('node', [convertScript], {
      cwd: SCRIPTS_DIR,
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Portrait conversion complete');
        resolve({ success: true });
      } else {
        console.error('\n⚠️  Portrait conversion had errors (non-fatal)');
        resolve({ success: false, code });
      }
    });

    process.on('error', (error) => {
      console.error(`\n⚠️  Portrait conversion error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    ensureOutputDir();

    const startTime = Date.now();

    // Execute all video generation scripts in parallel batches
    console.log('🚀 STARTING BATCH VIDEO GENERATION...\n');

    const results = await executeInBatches(VIDEO_SCRIPTS, 3);

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('BATCH GENERATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Total Videos: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total Time: ${totalDuration}s\n`);

    if (successful.length > 0) {
      console.log('✅ GENERATED VIDEOS:\n');
      successful.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}`);
        console.log(`   Size: ${r.fileSize} MB | Duration: ${r.duration}s`);
      });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('❌ FAILED:\n');
      failed.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}`);
        console.log(`   Error: ${r.error || 'Unknown error'}`);
      });
      console.log('');
    }

    // Portrait conversion (if any videos were generated)
    if (successful.length > 0) {
      await convertToPortrait();
    }

    // Final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ BATCH VIDEO GENERATION COMPLETE');
    console.log('='.repeat(80) + '\n');

    console.log('📁 Output Directory: promo-videos/');
    console.log('📱 Social Media Versions: promo-videos/social-media/\n');

    console.log('💡 NEXT STEPS:');
    console.log('1. Review all generated videos');
    console.log('2. Upload to social media platforms:');
    console.log('   - Instagram Reels (portrait versions)');
    console.log('   - TikTok (portrait versions)');
    console.log('   - YouTube Shorts (portrait versions)');
    console.log('   - Facebook/Twitter (landscape versions)');
    console.log('3. Schedule with social media management tools');
    console.log('4. Track performance metrics\n');

    if (failed.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
