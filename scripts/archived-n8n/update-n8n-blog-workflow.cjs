#!/usr/bin/env node
/**
 * Update n8n Blog Workflow with Resilient Fallback
 * Replaces single-provider Claude call with Anthropic → Grok → Gemini fallback
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const N8N_API_KEY = getEnv('N8N_API_KEY');
const ANTHROPIC_KEY = getEnv('ANTHROPIC_API_KEY');
const XAI_KEY = getEnv('XAI_API_KEY');
const GEMINI_KEY = getEnv('GEMINI_API_KEY');
const WORKFLOW_ID = 'Cf9hjEDQGEu2JZu7';

// Resilient code for n8n Code node
const RESILIENT_CODE = `
const topic = $input.first().json.topic || 'E-commerce automation';
const language = $input.first().json.language || 'fr';
const keywords = $input.first().json.keywords || topic;

const prompt = \`Write a comprehensive blog article about: \${topic}

Language: \${language === 'fr' ? 'French' : 'English'}
Target Keywords: \${keywords}

Requirements:
- 1500-2000 words
- Include H2 and H3 headings with proper HTML tags
- Include actionable tips with concrete examples
- SEO optimized for the target keywords
- Professional but accessible tone
- Focus on 2025-2026 trends
- Include a CTA mentioning 3A Automation (https://3a-automation.com)

Output format: Valid JSON only, no markdown:
{
  "title": "Article Title",
  "excerpt": "150 char summary",
  "content": "Full HTML article",
  "hashtags": ["hashtags"],
  "category": "automation|ecommerce|ai"
}\`;

const providers = [
  {
    name: 'Anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${ANTHROPIC_KEY}',
      'anthropic-version': '2024-01-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    }),
    parseResponse: (r) => r.content[0].text
  },
  {
    name: 'Grok',
    url: 'https://api.x.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${XAI_KEY}'
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    }),
    parseResponse: (r) => r.choices[0].message.content
  },
  {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 }
    }),
    parseResponse: (r) => r.candidates[0].content.parts[0].text
  }
];

let result = null;
let usedProvider = null;
const errors = [];

for (const provider of providers) {
  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers,
      body: provider.body
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(\`HTTP \${response.status}: \${errText.substring(0, 100)}\`);
    }

    const data = await response.json();
    const text = provider.parseResponse(data);

    // Parse JSON from response (handle markdown fences)
    let jsonContent = text;
    const fenceMatch = text.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\`\`\`/);
    if (fenceMatch) jsonContent = fenceMatch[1].trim();

    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    }

    result = JSON.parse(jsonContent);
    usedProvider = provider.name;
    break;
  } catch (err) {
    errors.push({ provider: provider.name, error: err.message });
    console.log(\`Provider \${provider.name} failed: \${err.message}\`);
  }
}

if (!result) {
  throw new Error('All AI providers failed: ' + JSON.stringify(errors));
}

return {
  json: {
    ...result,
    _provider: usedProvider,
    _fallbacksUsed: errors.length,
    _topic: topic,
    _language: language
  }
};
`;

function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'n8n.srv1168256.hstgr.cloud',
      path: path,
      method: method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('📥 Fetching current workflow...');
  const workflow = await httpRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`);
  console.log(`   Found: ${workflow.name} (${workflow.nodes.length} nodes)`);

  // Find and replace the Claude node (or already-renamed fallback node)
  let claudeNodeIndex = workflow.nodes.findIndex(n => n.name === 'Generate with Claude');
  let oldNodeName = 'Generate with Claude';

  if (claudeNodeIndex === -1) {
    claudeNodeIndex = workflow.nodes.findIndex(n => n.name.includes('Fallback') || n.name.includes('Generate with'));
    if (claudeNodeIndex !== -1) {
      oldNodeName = workflow.nodes[claudeNodeIndex].name;
      console.log(`   Found existing node: ${oldNodeName}`);
    }
  }

  if (claudeNodeIndex === -1) {
    console.error('❌ Could not find generation node');
    process.exit(1);
  }

  const oldNode = workflow.nodes[claudeNodeIndex];
  console.log(`   Replacing node: ${oldNode.name}`);

  // Create new resilient code node
  const newNode = {
    id: oldNode.id,
    name: 'Generate with Fallback (Anthropic→Grok→Gemini)',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: oldNode.position,
    parameters: {
      jsCode: RESILIENT_CODE,
      mode: 'runOnceForAllItems',
    },
  };

  workflow.nodes[claudeNodeIndex] = newNode;

  // Update connections - rename references from old node name to new
  const newNodeName = 'Generate with Fallback (Anthropic→Grok→Gemini)';
  // oldNodeName is already defined above

  // Update outgoing connections
  if (workflow.connections[oldNodeName]) {
    workflow.connections[newNodeName] = workflow.connections[oldNodeName];
    delete workflow.connections[oldNodeName];
  }

  // Update incoming connections (references to this node)
  for (const [sourceName, sourceConns] of Object.entries(workflow.connections)) {
    if (sourceConns.main) {
      sourceConns.main.forEach(outputs => {
        outputs.forEach(conn => {
          if (conn.node === oldNodeName) {
            conn.node = newNodeName;
          }
        });
      });
    }
  }

  console.log('📤 Updating workflow...');

  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
  };

  await httpRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, updatePayload);
  console.log('✅ Workflow updated with resilient fallback!');

  // Activate workflow
  console.log('🔄 Activating workflow...');
  await httpRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/activate`);
  console.log('✅ Workflow activated!');

  console.log('\n=== SUMMARY ===');
  console.log('Workflow: Blog Article Generator + Multi-Channel Distribution');
  console.log('New node: Generate with Fallback (Anthropic→Grok→Gemini)');
  console.log('Fallback chain:');
  console.log('  1. Anthropic Claude (primary)');
  console.log('  2. xAI Grok (fallback 1)');
  console.log('  3. Google Gemini (fallback 2)');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
