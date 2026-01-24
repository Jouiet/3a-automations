/**
 * Scroll-Based Animation Controller
 * 3A Automation - Hero Animation
 * 
 * Uses GSAP ScrollTrigger for smooth frame-by-frame animation
 * controlled by user scroll position.
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        frameCount: 600,
        // Detect path depth (handles en/ index.html)
        getAssetsPath: function () {
            const isSubfolder = window.location.pathname.includes('/en/') ||
                window.location.pathname.split('/').length > 2 && !window.location.pathname.endsWith('/');
            const prefix = isSubfolder ? '../' : '';
            return prefix + 'assets/frames/frame_';
        },
        frameExtension: '.jpg',
        canvasId: 'hero-canvas',
        triggerSelector: '.hero-ultra',
        scrollStart: 'top top',
        scrollEnd: '+=150%', // Overlapping span for smoother transition
        preloadBatch: 50,
        invalidateOnRefresh: true, // Handle responsive changes better
        pinSpacing: true // Ensure content doesn't jump
    };

    // State
    const images = [];
    let canvas, context;
    let isInitialized = false;
    let currentFrame = 0;

    /**
     * Initialize the scroll animation
     */
    function init() {
        canvas = document.getElementById(CONFIG.canvasId);

        // Fallback if canvas not found (use video instead)
        if (!canvas) {
            console.log('[ScrollAnimation] Canvas not found, using video fallback');
            return;
        }

        context = canvas.getContext('2d');

        // Mark container as canvas-active (hides video fallback)
        const container = canvas.closest('.hero-scroll-animation');
        if (container) {
            container.classList.add('canvas-active');
        }

        // Set canvas dimensions
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Preload all frames
        preloadImages().then(() => {
            setupScrollTrigger();
            isInitialized = true;
            console.log('[ScrollAnimation] Initialized with', CONFIG.frameCount, 'frames');
        });
    }

    /**
     * Resize canvas to maintain aspect ratio
     */
    function resizeCanvas() {
        const container = canvas.parentElement;
        const aspectRatio = 1920 / 1080;

        canvas.width = container.offsetWidth;
        canvas.height = container.offsetWidth / aspectRatio;

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

            // Create promise for this image
            promises.push(new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if frame fails
            }));
        }

        // Wait for critical frames (first 60 for immediate display)
        await Promise.all(promises.slice(0, 60));

        // Continue loading rest in background
        Promise.all(promises);

        // Draw first frame
        drawFrame(0);
    }

    /**
     * Draw a specific frame on canvas
     */
    function drawFrame(frameIndex) {
        if (!context || !images[frameIndex]) return;

        const img = images[frameIndex];
        if (!img.complete) return;

        // Clear and draw
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to cover canvas
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
     * Setup GSAP ScrollTrigger
     */
    function setupScrollTrigger() {
        // Check if GSAP is available
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('[ScrollAnimation] GSAP or ScrollTrigger not found');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // Create scroll-linked animation
        gsap.to({}, {
            scrollTrigger: {
                trigger: CONFIG.triggerSelector,
                start: CONFIG.scrollStart,
                end: CONFIG.scrollEnd,
                scrub: 0.5, // Smooth scrubbing
                pin: true, // Pin the section during animation
                anticipatePin: 1,
                onUpdate: function (self) {
                    const frameIndex = Math.floor(self.progress * (CONFIG.frameCount - 1));
                    if (frameIndex !== currentFrame) {
                        drawFrame(frameIndex);
                    }
                }
            }
        });

        console.log('[ScrollAnimation] ScrollTrigger configured');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
