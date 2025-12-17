#!/usr/bin/env node
/**
 * VIDEO FORMAT CONVERTER - Landscape to Portrait
 * Purpose: Convert 1920x1080 videos to 1080x1920 for social media
 * Method: FFmpeg video processing
 * Context: Session 98+++ - Marketing automation Phase 2
 *
 * Target Platforms: Instagram Reels, TikTok, YouTube Shorts
 * Input: 1920x1080 (16:9 landscape)
 * Output: 1080x1920 (9:16 portrait)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const INPUT_DIR = path.join(__dirname, '../promo-videos');
const OUTPUT_DIR = path.join(__dirname, '../promo-videos/social-media');

console.log('================================================================================');
console.log('VIDEO FORMAT CONVERTER - LANDSCAPE → PORTRAIT');
console.log('================================================================================');
console.log(`Input: 1920x1080 (16:9 landscape)`);
console.log(`Output: 1080x1920 (9:16 portrait)`);
console.log(`Target: Instagram Reels, TikTok, YouTube Shorts`);
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
 * Check if FFmpeg is installed
 */
async function checkFFmpeg() {
  try {
    await execPromise('ffmpeg -version');
    console.log('✅ FFmpeg installed and accessible\n');
    return true;
  } catch (error) {
    console.error('❌ FFmpeg not found. Please install FFmpeg:');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Ubuntu: sudo apt-get install ffmpeg');
    console.error('   Windows: Download from https://ffmpeg.org/download.html\n');
    return false;
  }
}

/**
 * Convert landscape video to portrait with blurred background
 * Strategy: Center crop main content, blur background to fill 9:16
 */
async function convertToPortrait(inputFile, outputFile, strategy = 'blur') {
  const inputPath = path.join(INPUT_DIR, inputFile);
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  console.log(`\n📹 Converting: ${inputFile}`);
  console.log(`   Strategy: ${strategy}`);
  console.log(`   Output: ${outputFile}`);

  let ffmpegCommand;

  if (strategy === 'blur') {
    // Strategy 1: Blurred background with centered original content
    // 1. Scale original to fit portrait height
    // 2. Blur and scale background to fill 1080x1920
    // 3. Overlay centered original content
    ffmpegCommand = `ffmpeg -i "${inputPath}" -filter_complex "\
[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[fg];\
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=20[bg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2" \
-c:v libx264 -preset medium -crf 18 -c:a copy "${outputPath}"`;

  } else if (strategy === 'crop') {
    // Strategy 2: Center crop (loses horizontal content)
    ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "crop=1080:1920" -c:v libx264 -preset medium -crf 18 -c:a copy "${outputPath}"`;

  } else if (strategy === 'pad') {
    // Strategy 3: Pad with black bars (letterboxing)
    ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset medium -crf 18 -c:a copy "${outputPath}"`;
  }

  try {
    const startTime = Date.now();
    console.log('   ⚙️  Processing (this may take 30-60 seconds)...');

    const { stdout, stderr } = await execPromise(ffmpegCommand);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Verify output
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`   ✅ Converted successfully in ${duration}s`);
      console.log(`   📦 Size: ${fileSizeMB} MB`);
      console.log(`   📁 Location: ${outputPath}`);

      return {
        success: true,
        outputPath,
        fileSizeMB,
        duration
      };
    } else {
      throw new Error('Output file not created');
    }
  } catch (error) {
    console.error(`   ❌ Conversion failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch convert all videos in promo-videos directory
 */
async function batchConvert() {
  console.log('🔍 Scanning for videos in promo-videos directory...\n');

  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.endsWith('.mp4') && !file.startsWith('.'));

  if (files.length === 0) {
    console.log('⚠️  No MP4 files found in promo-videos directory\n');
    return;
  }

  console.log(`✅ Found ${files.length} video(s) to convert:\n`);
  files.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));

  console.log('\n================================================================================');
  console.log('BATCH CONVERSION STARTING');
  console.log('================================================================================\n');

  const results = [];

  for (const file of files) {
    const outputFile = file.replace('.mp4', '-portrait.mp4');

    const result = await convertToPortrait(file, outputFile, 'blur');
    results.push({
      input: file,
      output: outputFile,
      ...result
    });
  }

  // Summary
  console.log('\n================================================================================');
  console.log('BATCH CONVERSION SUMMARY');
  console.log('================================================================================\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Videos: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (successful > 0) {
    console.log('✅ CONVERTED VIDEOS:\n');
    results
      .filter(r => r.success)
      .forEach((r, i) => {
        console.log(`${i + 1}. ${r.output}`);
        console.log(`   Size: ${r.fileSizeMB} MB | Duration: ${r.duration}s`);
        console.log(`   Path: ${r.outputPath}\n`);
      });
  }

  if (failed > 0) {
    console.log('❌ FAILED CONVERSIONS:\n');
    results
      .filter(r => !r.success)
      .forEach((r, i) => {
        console.log(`${i + 1}. ${r.input}`);
        console.log(`   Error: ${r.error}\n`);
      });
  }

  console.log('================================================================================');
  console.log('💡 NEXT STEPS:');
  console.log('================================================================================\n');
  console.log('1. Review converted videos in promo-videos/social-media/');
  console.log('2. Upload to social media platforms:');
  console.log('   - Instagram Reels (1080x1920)');
  console.log('   - TikTok (1080x1920)');
  console.log('   - YouTube Shorts (1080x1920)');
  console.log('3. Add text overlays/captions (optional):');
  console.log('   - FFmpeg text filter');
  console.log('   - Video editing software (iMovie, Premiere, etc.)');
  console.log('4. Schedule posts using social media management tools\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    ensureOutputDir();

    // Check FFmpeg
    const ffmpegInstalled = await checkFFmpeg();
    if (!ffmpegInstalled) {
      process.exit(1);
    }

    // Batch convert all videos
    await batchConvert();

    console.log('✅ PORTRAIT CONVERSION COMPLETE\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Allow single file conversion via command line argument
if (process.argv.length > 2) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || inputFile.replace('.mp4', '-portrait.mp4');

  (async () => {
    ensureOutputDir();
    const ffmpegInstalled = await checkFFmpeg();
    if (!ffmpegInstalled) process.exit(1);

    await convertToPortrait(inputFile, outputFile, 'blur');
  })();
} else {
  main();
}
