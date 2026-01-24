/**
 * Scroll-Based Animation Controller
 * 3A Automation - Hero Animation
 *
 * Uses GSAP ScrollTrigger for smooth frame-by-frame animation
 * controlled by user scroll position.
 *
 * v2.0: Added auto-loop when user is not scrolling (24/01/2026)
 * v2.1: Fixed auto-loop to work within hero section during idle (24/01/2026)
 * v2.2: Removed scrollTriggerActive check from startAutoLoop (24/01/2026)
 * v2.3: TRUE 16:9 edge-to-edge horizontal (24/01/2026)
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        frameCount: 240,
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
        pinSpacing: true, // Ensure content doesn't jump
        // Auto-loop settings
        autoLoopEnabled: true,
        autoLoopFPS: 30, // 30fps for smooth playback
        autoLoopIdleDelay: 2000 // Start auto-loop after 2s of no scroll
    };

    // State
    const images = [];
    let canvas, context;
    let isInitialized = false;
    let currentFrame = 0;
    let autoLoopAnimationId = null;
    let lastScrollTime = 0;
    let isAutoLooping = false;
    let scrollTriggerActive = false;

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
            // Initialize lastScrollTime so idle checker waits 2s from page load
            lastScrollTime = Date.now();
            console.log('[ScrollAnimation] Initialized with', CONFIG.frameCount, 'frames');
        });
    }

    /**
     * Resize canvas for TRUE 16:9 edge-to-edge horizontal
     * Width = full viewport, Height = width × 9/16 (min: viewport height)
     */
    function resizeCanvas() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // TRUE 16:9 edge-to-edge: width is always 100vw
        const canvasWidth = viewportWidth;
        // Height = width × 9/16, but minimum viewport height to cover screen
        const canvasHeight = Math.max(viewportWidth * 9 / 16, viewportHeight);

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

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
            // Fallback: start auto-loop immediately without scroll trigger
            if (CONFIG.autoLoopEnabled) {
                startAutoLoop();
            }
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
                onEnter: function () {
                    scrollTriggerActive = true;
                    stopAutoLoop();
                },
                onLeave: function () {
                    scrollTriggerActive = false;
                    // Reset to first frame and start auto-loop when leaving
                    if (CONFIG.autoLoopEnabled) {
                        startAutoLoop();
                    }
                },
                onEnterBack: function () {
                    scrollTriggerActive = true;
                    stopAutoLoop();
                },
                onLeaveBack: function () {
                    scrollTriggerActive = false;
                },
                onUpdate: function (self) {
                    lastScrollTime = Date.now();
                    stopAutoLoop();

                    const frameIndex = Math.floor(self.progress * (CONFIG.frameCount - 1));
                    if (frameIndex !== currentFrame) {
                        drawFrame(frameIndex);
                    }
                }
            }
        });

        console.log('[ScrollAnimation] ScrollTrigger configured');

        // Start auto-loop checker
        if (CONFIG.autoLoopEnabled) {
            startIdleChecker();
        }
    }

    /**
     * Start auto-loop animation
     */
    function startAutoLoop() {
        if (isAutoLooping) return;

        isAutoLooping = true;
        let lastTime = performance.now();
        const frameDuration = 1000 / CONFIG.autoLoopFPS;

        function loop(currentTime) {
            if (!isAutoLooping) return;

            const deltaTime = currentTime - lastTime;

            if (deltaTime >= frameDuration) {
                currentFrame = (currentFrame + 1) % CONFIG.frameCount;
                drawFrame(currentFrame);
                lastTime = currentTime - (deltaTime % frameDuration);
            }

            autoLoopAnimationId = requestAnimationFrame(loop);
        }

        autoLoopAnimationId = requestAnimationFrame(loop);
        console.log('[ScrollAnimation] Auto-loop started');
    }

    /**
     * Stop auto-loop animation
     */
    function stopAutoLoop() {
        if (!isAutoLooping) return;

        isAutoLooping = false;
        if (autoLoopAnimationId) {
            cancelAnimationFrame(autoLoopAnimationId);
            autoLoopAnimationId = null;
        }
    }

    /**
     * Check for idle state to start auto-loop
     */
    function startIdleChecker() {
        setInterval(function () {
            const now = Date.now();
            const idleTime = now - lastScrollTime;

            // If user hasn't scrolled for a while, start auto-loop
            // Works both inside and outside the hero section
            if (idleTime > CONFIG.autoLoopIdleDelay && !isAutoLooping) {
                startAutoLoop();
            }
        }, 500); // Check every 500ms
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
