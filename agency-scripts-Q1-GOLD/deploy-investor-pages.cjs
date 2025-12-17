const fs = require('fs');
const https = require('https');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const token = envContent.match(/SHOPIFY_ACCESS_TOKEN=(.+)/)[1];
const store = 'jqp1x4-7e.myshopify.com';

// Load Template
const templatePath = path.join(__dirname, 'data/investor-subpages-template.html');
const TEMPLATE = fs.readFileSync(templatePath, 'utf-8');

// Page Content Definitions
const PAGES_CONTENT = [
  {
    handle: 'investors-ai-automation',
    title: 'AI Automation & Continuous Improvement',
    content: `
      <p style="font-size: 1.2em; border-left: 4px solid #ff3131; padding-left: 15px; margin-bottom: 30px;">
        <strong>The "Ultrathink" Architecture:</strong> A closed-loop system where automated leads are analyzed by advanced AI (Google Gemini 3 Pro) to trigger precision omnichannel marketing.
      </p>

      <h2>The Intelligence Core (Gemini 3 Pro)</h2>
      <p>We utilize the newly released (Nov 2025) <strong>Google Gemini 3 Pro</strong> as our central "Analyst". Its "Deep Think" reasoning capabilities allow it to process vast datasets without hallucination.</p>
      
      <div class="highlight-box">
        <strong>The Decision Loop:</strong>
        <br><br>
        1. <strong>Input:</strong> Segmented Leads from Apify (Instagram Scraper 2025).<br>
        2. <strong>Analysis:</strong> Gemini 3 Pro uses "Deep Think" mode to determine <em>Propensity to Buy</em>.<br>
        3. <strong>Action:</strong> Triggers n8n workflows via <strong>Model Context Protocol (MCP)</strong>.<br>
        4. <strong>Feedback:</strong> Multimodal performance reports feed back into the model.
      </div>

      <h2>Active Automation Capabilities</h2>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 20px;">
          <strong style="color: #ff3131; text-transform: uppercase;">1. Omnichannel Execution</strong><br>
          Orchestrated by self-hosted n8n nodes, synchronizing Blog, Email, and SMS campaigns with zero latency.
          <em>(Future Q2 2026: Expansion to TikTok & Google Ads).</em>
        </li>
        <li style="margin-bottom: 20px;">
          <strong style="color: #ff3131; text-transform: uppercase;">2. AI Human Avatars</strong><br>
          Deploying Gemini 3 Pro's multimodal output to drive AI-generated human presenters for YouTube product reviews.
        </li>
        <li style="margin-bottom: 20px;">
          <strong style="color: #ff3131; text-transform: uppercase;">3. Answer Engine Optimization (AEO)</strong><br>
          Automated generation of JSON-LD schema optimized for 2026 AI Search standards (Perplexity, Google SGE).
        </li>
      </ul>
    `
  },
  {
    handle: 'investors-claude-ai',
    title: 'Claude AI & Coding',
    content: `
      <p>While Gemini 3 Pro handles analysis, <strong>Claude AI</strong> serves as our "Chief Technology Officer" and "Lead Developer".</p>
      
      <h2>Operational Role</h2>
      <ul>
        <li><strong>Code Generation:</strong> Writes and optimizes Liquid, JavaScript, and Python scripts.</li>
        <li><strong>System Architecture:</strong> Designed the "Asset-Light" infrastructure.</li>
        <li><strong>Verification:</strong> Writes tests to ensure factual accuracy of all deployments.</li>
      </ul>
    `
  },
  {
    handle: 'investors-flywheel',
    title: 'Autonomous Flywheel Strategy',
    content: `
      <p>The "Henderson Flywheel" is a self-reinforcing loop: <strong>High-Quality Input -> Intelligent Processing -> Automated Output</strong>.</p>
      
      <h2>The 4-Stage "Ultrathink" Loop</h2>
      
      <h3 style="color: #ff3131;">1. AUTOMATED ACQUISITION (Input)</h3>
      <p><strong>Tools:</strong> Apify Agents (2025 Edition).<br>
      We automate the collection of qualified leads using advanced Instagram Scrapers that capture engagement metrics (not just bio data).</p>

      <h3 style="color: #ff3131;">2. AI ANALYSIS (Processing)</h3>
      <p><strong>Brain:</strong> Google Gemini 3 Pro.<br>
      Raw data is subjected to "Deep Think" protocols to assign a "Propensity Score". The AI decides <em>who</em> gets <em>what</em> message.</p>

      <h3 style="color: #ff3131;">3. OMNICHANNEL ACTIVATION (Output)</h3>
      <p><strong>Orchestration:</strong> n8n (MCP) + GitHub Actions.<br>
      Triggers personalized content across multiple channels:
      <br>- <strong>Blogs:</strong> AEO optimized.
      <br>- <strong>Direct:</strong> Email & SMS flows.
      <br>- <strong>Social:</strong> Meta Ads (Live) + AI Avatars (YouTube).</p>

      <h3 style="color: #ff3131;">4. CONTINUOUS LEARNING (Feedback)</h3>
      <p>Campaign performance data is fed back into the system, refining segmentation rules for the next cycle.</p>
    `
  },
  {
    handle: 'investors-infrastructure',
    title: 'Technical Infrastructure',
    content: `
      <p>Our stack is selected based on <strong>Hard Engineering Constraint Analysis</strong>, rejecting "easy" tools for scalable ones.</p>
      
      <h2>The "Hybrid" Architecture</h2>
      <p>We utilize a split-brain orchestration strategy to bypass standard SaaS limits:</p>
      
      <ul>
        <li><strong>Real-Time:</strong> <strong>Shopify Flow</strong> handles 1-to-1 events (e.g., Order Created, Low Stock).</li>
        <li><strong>Batch Processing:</strong> <strong>n8n (Self-hosted)</strong> handles high-volume tasks. <br><em>Reasoning:</em> Bypasses Shopify Flow's "100-item get_data limit" and manages Klaviyo's "50 RPS" rate limit via custom queues.</li>
        <li><strong>Intelligence:</strong> <strong>Gemini 3 Pro</strong> via Vertex AI for deep reasoning on datasets >1M tokens.</li>
        <li><strong>Supply Chain:</strong> <strong>DSers Pro</strong> for handling up to 75,000 SKUs and bulk order execution.</li>
      </ul>

      <div class="highlight-box">
        <strong>Why this complexity?</strong><br>
        Standard "No-Code" setups fail at scale. Acknowledging limits (like Klaviyo's Request-Per-Minute quotas) allows us to engineer resilience before traffic spikes occur.
      </div>
    `
  },
  {
    handle: 'investors-normalization',
    title: 'Data Normalization & Quality',
    content: `
      <p>In Dropshipping, data quality is the #1 failure point. Different suppliers use different size charts, image formats, and material names. We solve this with the <strong>"Golden Record" Standard</strong>.</p>
      
      <h2>The Ingestion Pipeline</h2>
      <p>We do not simply import supplier feeds. Data goes through a rigorous normalization process:</p>

      <ol>
        <li><strong>Ingest:</strong> Raw data pulled from Supplier CSV/API.</li>
        <li><strong>Cleanse:</strong> Scripts remove "factory codes", broken HTML, and non-compliant terms.</li>
        <li><strong>Standardize:</strong> 
          <ul>
            <li>Sizes converted to unified US/EU Charts (CM/INCH).</li>
            <li>Safety Ratings (CE Level 1/2) standardized to a single attribute.</li>
            <li>Colors mapped to our 15-color master palette.</li>
          </ul>
        </li>
      </ol>
    `
  },
  {
    handle: 'investors-roadmap',
    title: 'Development Roadmap',
    content: `
      <p>Our roadmap prioritizes <strong>Channel Expansion</strong> and <strong>AI Content Scaling</strong>.</p>
      
      <h2>Q1 2026: Content Velocity</h2>
      <ul>
        <li><strong>YouTube AI Avatars:</strong> Launch of "Virtual Presenter" product reviews to dominate video search.</li>
        <li><strong>Blog Automation:</strong> Fully autonomous AEO-optimized article generation loop driven by Gemini 3 Pro.</li>
      </ul>

      <h2>Q2 2026 (April 1): New Frontiers</h2>
      <ul>
        <li><strong>TikTok Launch:</strong> Strategic activation of TikTok organic + paid channels.</li>
        <li><strong>Google Ads:</strong> Expansion into high-intent search campaigns.</li>
      </ul>
    `
  }
];

/**
 * Deploy Page Function
 */
function deployPage(pageData) {
  return new Promise((resolve, reject) => {
    // Generate HTML from Template
    const finalHtml = TEMPLATE
      .replace('{{PAGE_TITLE}}', pageData.title)
      .replace('{{PAGE_CONTENT}}', pageData.content);

    const checkOptions = {
      hostname: store,
      path: `/admin/api/2025-10/pages.json?handle=${pageData.handle}`,
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    };

    const checkReq = https.request(checkOptions, (checkRes) => {
      let data = '';
      checkRes.on('data', c => data += c);
      checkRes.on('end', () => {
        const result = JSON.parse(data);
        const existingPage = result.pages && result.pages.length > 0 ? result.pages[0] : null;

        if (existingPage) {
          updatePage(existingPage.id, pageData, finalHtml, resolve, reject);
        } else {
          createPage(pageData, finalHtml, resolve, reject);
        }
      });
    });
    checkReq.on('error', reject);
    checkReq.end();
  });
}

/**
 * Create Page
 */
function createPage(pageData, html, resolve, reject) {
  const postData = JSON.stringify({
    page: {
      title: pageData.title,
      handle: pageData.handle,
      body_html: html,
      published: true,
      template_suffix: 'investor', // Optional if you have a specific template
      metafields: [{ namespace: 'custom', key: 'page_type', value: 'investor_subpage', type: 'single_line_text_field' }]
    }
  });

  const req = https.request({
    hostname: store,
    path: '/admin/api/2025-10/pages.json',
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    if (res.statusCode === 201) resolve({ action: 'CREATED', handle: pageData.handle });
    else reject(new Error(`Create failed: ${res.statusCode}`));
  });
  req.write(postData);
  req.end();
}

/**
 * Update Page
 */
function updatePage(id, pageData, html, resolve, reject) {
  const postData = JSON.stringify({
    page: {
      id: id,
      title: pageData.title,
      body_html: html,
      published: true
    }
  });

  const req = https.request({
    hostname: store,
    path: `/admin/api/2025-10/pages/${id}.json`,
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    if (res.statusCode === 200) resolve({ action: 'UPDATED', handle: pageData.handle });
    else reject(new Error(`Update failed: ${res.statusCode}`));
  });
  req.write(postData);
  req.end();
}

/**
 * Main Execution
 */
async function main() {
  console.log('=== DEPLOYING INVESTOR SUB-PAGES (PREMIUM BRANDING) ===\n');

  for (const page of PAGES_CONTENT) {
    try {
      console.log(`Deploying: ${page.handle}...`);
      const res = await deployPage(page);
      console.log(`✅ ${res.action}: ${res.handle}`);
    } catch (e) {
      console.error(`❌ FAILED: ${page.handle} - ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n✅ ALL PAGES PROCESSED.');
}

main();
