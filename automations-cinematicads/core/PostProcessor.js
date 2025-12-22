// automations/core/PostProcessor.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Logger = require('./Logger');

class PostProcessor {
    constructor() {
        this.logger = new Logger('PostProcessor');
        this.outputDir = path.join(__dirname, '../../data/output/final');
        if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    }

    /**
     * Overlays a logo onto a video.
     * @param {string} videoPath 
     * @param {string} logoPath 
     * @param {string} position 'top-right', 'bottom-right', etc.
     */
    async overlayLogo(videoPath, logoPath, position = 'top-right') {
        const outputFilename = `final_${path.basename(videoPath)}`;
        const outputPath = path.join(this.outputDir, outputFilename);

        this.logger.info(`Applying logo overlay: ${videoPath}`);

        if (!fs.existsSync(logoPath)) {
            this.logger.warn(`Logo not found at ${logoPath}. Skipping overlay.`);
            return videoPath;
        }

        const overlayConfig = {
            'top-right': 'main_w-overlay_w-10:10',
            'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10',
            'top-left': '10:10',
            'bottom-left': '10:main_h-overlay_h-10'
        };

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .input(logoPath)
                .complexFilter([
                    `[1:v]scale=150:-1[logo];[0:v][logo]overlay=${overlayConfig[position] || overlayConfig['top-right']}`
                ])
                .on('start', (cmd) => this.logger.info(`FFmpeg started: ${cmd}`))
                .on('error', (err) => {
                    this.logger.error(`FFmpeg Error: ${err.message}`);
                    reject(err);
                })
                .on('end', () => {
                    this.logger.success(`Video processed: ${outputPath}`);
                    resolve(outputPath);
                })
                .save(outputPath);
        });
    }

    /**
     * Mixes a voiceover track with a video.
     * Decreases video's native audio volume to allow VO clarity.
     */
    async mixAudio(videoPath, audioPath) {
        const outputFilename = `mixed_${path.basename(videoPath)}`;
        const outputPath = path.join(this.outputDir, outputFilename);

        this.logger.info(`Mixing Audio: ${audioPath} with Video: ${videoPath}`);

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .input(audioPath)
                .complexFilter([
                    '[0:a]volume=0.3[bg_audio]', // Dim background music/sound
                    '[1:a]volume=1.0[vo_audio]',  // Full volume VO
                    '[bg_audio][vo_audio]amix=inputs=2:duration=longest[audio_out]'
                ])
                .outputOptions(['-map 0:v', '-map [audio_out]', '-c:v copy'])
                .on('error', (err) => {
                    this.logger.error(`FFmpeg Mix Error: ${err.message}`);
                    reject(err);
                })
                .on('end', () => {
                    this.logger.success(`Mixed output ready: ${outputPath}`);
                    resolve(outputPath);
                })
                .save(outputPath);
        });
    }
}

module.exports = PostProcessor;
