// automations/core/PlaywrightClient.js
// Replaces FirecrawlClient.js - Uses Playwright (free) instead of Firecrawl (paid)
//
// Available via Claude Code native MCPs:
// - playwright-mcp: Primary browser automation (Playwright)
// - chrome-devtools-mcp: Fallback using Puppeteer + Chrome DevTools Protocol
//
// References:
// - https://github.com/ChromeDevTools/chrome-devtools-mcp
// - https://developer.chrome.com/blog/chrome-devtools-mcp

const Logger = require('./Logger');

// Try to load Playwright, fallback to Puppeteer (chrome-devtools uses Puppeteer)
let browserLib = null;
let browserType = 'playwright';

try {
    const { chromium } = require('playwright');
    browserLib = chromium;
    browserType = 'playwright';
} catch (e) {
    try {
        const puppeteer = require('puppeteer');
        browserLib = puppeteer;
        browserType = 'puppeteer';
    } catch (e2) {
        console.error('Neither playwright nor puppeteer is installed.');
        console.error('Install: npm install playwright OR npm install puppeteer');
    }
}

class PlaywrightClient {
    constructor() {
        this.logger = new Logger('Browser');
        this.browser = null;
        this.browserType = browserType;
        this.logger.info(`Using ${browserType} for browser automation`);
    }

    /**
     * Initialize browser (call once before scraping)
     * Supports both Playwright and Puppeteer (chrome-devtools fallback)
     */
    async init() {
        if (!this.browser && browserLib) {
            try {
                if (this.browserType === 'playwright') {
                    this.browser = await browserLib.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                } else {
                    // Puppeteer (chrome-devtools-mcp fallback)
                    this.browser = await browserLib.launch({
                        headless: 'new',
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                }
                this.logger.info(`Browser initialized [${this.browserType}]`);
            } catch (error) {
                this.logger.error(`Failed to initialize ${this.browserType}: ${error.message}`);
                // Try fallback
                if (this.browserType === 'playwright') {
                    this.logger.warn('Attempting Puppeteer fallback...');
                    try {
                        const puppeteer = require('puppeteer');
                        this.browser = await puppeteer.launch({
                            headless: 'new',
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        this.browserType = 'puppeteer';
                        this.logger.success('Fallback to Puppeteer successful');
                    } catch (fallbackError) {
                        this.logger.error(`Puppeteer fallback failed: ${fallbackError.message}`);
                        throw error;
                    }
                } else {
                    throw error;
                }
            }
        }
        return this;
    }

    /**
     * Scrape a single URL - returns markdown content
     * Works with both Playwright and Puppeteer (chrome-devtools fallback)
     * @param {string} url - URL to scrape
     * @param {object} options - Scraping options
     */
    async scrape(url, options = {}) {
        this.logger.info(`Scraping [${this.browserType}]: ${url}`);

        try {
            await this.init();

            let page, context;

            // Playwright uses context, Puppeteer uses pages directly
            if (this.browserType === 'playwright') {
                context = await this.browser.newContext({
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                });
                page = await context.newPage();
            } else {
                // Puppeteer
                page = await this.browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            }

            // Navigate with wait options
            await page.goto(url, {
                waitUntil: options.waitUntil || 'domcontentloaded',
                timeout: options.timeout || 30000
            });

            // Wait for additional time if specified
            if (options.waitFor) {
                if (this.browserType === 'playwright') {
                    await page.waitForTimeout(options.waitFor);
                } else {
                    await new Promise(r => setTimeout(r, options.waitFor));
                }
            }

            // Extract content
            let content;
            if (options.onlyMainContent !== false) {
                content = await page.evaluate(() => {
                    const main = document.querySelector('main, article, [role="main"], .content, #content');
                    return main ? main.innerText : document.body.innerText;
                });
            } else {
                content = await page.evaluate(() => document.body.innerText);
            }

            // Get metadata
            const metadata = await page.evaluate(() => ({
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.content || '',
                ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
                url: window.location.href
            }));

            // Get HTML if requested
            let html = null;
            if (options.includeHtml) {
                html = await page.content();
            }

            // Take screenshot if requested
            let screenshot = null;
            if (options.screenshot) {
                screenshot = await page.screenshot({ type: 'png', fullPage: options.fullPage });
            }

            // Cleanup
            if (this.browserType === 'playwright' && context) {
                await context.close();
            } else {
                await page.close();
            }

            this.logger.success(`Scraped: ${url}`);

            return {
                content,
                metadata,
                html,
                screenshot,
                success: true
            };

        } catch (error) {
            this.logger.error(`Scrape failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Map a website to find all sub-pages (crawl links)
     * @param {string} url - Base URL to crawl
     * @param {object} options - Crawl options
     */
    async map(url, options = {}) {
        this.logger.info(`Mapping: ${url}`);

        try {
            await this.init();
            const context = await this.browser.newContext();
            const page = await context.newPage();

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Extract all links
            const baseUrl = new URL(url);
            const links = await page.evaluate((baseHost) => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                return anchors
                    .map(a => a.href)
                    .filter(href => {
                        try {
                            const linkUrl = new URL(href);
                            // Only same-origin links
                            return linkUrl.host === baseHost;
                        } catch {
                            return false;
                        }
                    });
            }, baseUrl.host);

            // Deduplicate
            const uniqueLinks = [...new Set(links)];

            await context.close();

            this.logger.success(`Mapped ${uniqueLinks.length} links from ${url}`);

            return uniqueLinks;

        } catch (error) {
            this.logger.error(`Map failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Take a screenshot of a page
     * @param {string} url - URL to screenshot
     * @param {object} options - Screenshot options
     */
    async screenshot(url, options = {}) {
        this.logger.info(`Screenshot: ${url}`);

        try {
            await this.init();
            const context = await this.browser.newContext({
                viewport: options.viewport || { width: 1920, height: 1080 }
            });
            const page = await context.newPage();

            await page.goto(url, { waitUntil: 'networkidle' });

            const buffer = await page.screenshot({
                type: options.type || 'png',
                fullPage: options.fullPage || false
            });

            await context.close();

            this.logger.success(`Screenshot captured: ${url}`);

            return buffer;

        } catch (error) {
            this.logger.error(`Screenshot failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.logger.info('Browser closed');
        }
    }
}

module.exports = PlaywrightClient;
