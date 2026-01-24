/**
 * Hero Animation Controller
 * 3A Automation - Simple Auto-Loop Video Background
 *
 * v3.0: Complete rewrite - NO scroll dependency (24/01/2026)
 *
 * Features:
 * - Auto-loop animation at 30fps
 * - 16:9 edge-to-edge horizontal
 * - Starts immediately on page load
 * - NO GSAP, NO ScrollTrigger, NO scroll dependency
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        frameCount: 240,
        fps: 30,
        canvasId: 'hero-canvas',
        // Detect path depth (handles en/ subfolder)
        getAssetsPath: function () {
            const isSubfolder = window.location.pathname.includes('/en/') ||
                (window.location.pathname.split('/').length > 2 && !window.location.pathname.endsWith('/'));
            const prefix = isSubfolder ? '../' : '';
            return prefix + 'assets/frames/frame_';
        },
        frameExtension: '.jpg'
    };

    // State
    const images = [];
    let canvas, context;
    let currentFrame = 0;
    let animationId = null;

    /**
     * Initialize hero animation
     */
    function init() {
        canvas = document.getElementById(CONFIG.canvasId);

        if (!canvas) {
            console.log('[HeroAnimation] Canvas not found, using video fallback');
            return;
        }

        context = canvas.getContext('2d');

        // Mark container as canvas-active (hides video fallback)
        const container = canvas.closest('.hero-animation');
        if (container) {
            container.classList.add('canvas-active');
        }

        // Set canvas dimensions
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Preload frames then start animation
        preloadImages().then(() => {
            startAnimation();
            console.log('[HeroAnimation] Started with', CONFIG.frameCount, 'frames at', CONFIG.fps, 'fps');
        });
    }

    /**
     * Resize canvas for 16:9 edge-to-edge horizontal
     */
    function resizeCanvas() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Width = 100vw, Height = max(16:9 ratio, 100vh)
        canvas.width = viewportWidth;
        canvas.height = Math.max(viewportWidth * 9 / 16, viewportHeight);

        // Redraw current frame after resize
        if (images[currentFrame] && images[currentFrame].complete) {
            drawFrame(currentFrame);
        }
    }

    /**
     * Preload all frames
     */
    async function preloadImages() {
        const promises = [];
        const assetsPath = CONFIG.getAssetsPath();

        for (let i = 1; i <= CONFIG.frameCount; i++) {
            const img = new Image();
            const frameNumber = String(i).padStart(4, '0');
            img.src = `${assetsPath}${frameNumber}${CONFIG.frameExtension}`;
            images.push(img);

            promises.push(new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            }));
        }

        // Wait for first 60 frames (2 seconds of animation)
        await Promise.all(promises.slice(0, 60));

        // Continue loading rest in background
        Promise.all(promises);

        // Draw first frame immediately
        drawFrame(0);
    }

    /**
     * Draw a specific frame on canvas
     */
    function drawFrame(frameIndex) {
        if (!context || !images[frameIndex]) return;

        const img = images[frameIndex];
        if (!img.complete) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Scale to cover canvas while maintaining aspect ratio
        const scale = Math.max(
            canvas.width / img.naturalWidth,
            canvas.height / img.naturalHeight
        );

        const x = (canvas.width - img.naturalWidth * scale) / 2;
        const y = (canvas.height - img.naturalHeight * scale) / 2;

        context.drawImage(
            img,
            x, y,
            img.naturalWidth * scale,
            img.naturalHeight * scale
        );

        currentFrame = frameIndex;
    }

    /**
     * Start animation loop - runs continuously at 30fps
     */
    function startAnimation() {
        const frameDuration = 1000 / CONFIG.fps;
        let lastTime = performance.now();

        function loop(currentTime) {
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= frameDuration) {
                currentFrame = (currentFrame + 1) % CONFIG.frameCount;
                drawFrame(currentFrame);
                lastTime = currentTime - (deltaTime % frameDuration);
            }

            animationId = requestAnimationFrame(loop);
        }

        animationId = requestAnimationFrame(loop);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
