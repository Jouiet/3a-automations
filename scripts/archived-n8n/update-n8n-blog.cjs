#!/usr/bin/env node
/**
 * Update n8n Blog Workflow v2 - Using n8n $http instead of fetch
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

// n8n-compatible code using $http.request
const RESILIENT_CODE = `
// Get input parameters
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

Output format: Valid JSON only, no markdown code fences:
{
  "title": "Article Title",
  "excerpt": "150 char summary",
  "content": "Full HTML article",
  "hashtags": ["hashtags"],
  "category": "automation|ecommerce|ai"
}\`;

// Provider configurations
const providers = [
  {
    name: 'Grok',
    url: 'https://api.x.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${XAI_KEY}'
    },
    body: {
      model: 'grok-3-mini',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    },
    parseResponse: (r) => r.choices[0].message.content
  },
  {
    name: 'Anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${ANTHROPIC_KEY}',
      'anthropic-version': '2024-01-01'
    },
    body: {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    },
    parseResponse: (r) => r.content[0].text
  },
  {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}',
    headers: { 'Content-Type': 'application/json' },
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 }
    },
    parseResponse: (r) => r.candidates[0].content.parts[0].text
  }
];

let result = null;
let usedProvider = null;
const errors = [];

for (const provider of providers) {
  try {
    console.log(\`Trying \${provider.name}...\`);

    const response = await $http.request({
      method: 'POST',
      url: provider.url,
      headers: provider.headers,
      body: provider.body,
      json: true,
      timeout: 120000
    });

    const text = provider.parseResponse(response);

    // Parse JSON from response
    let jsonContent = text;
    const fenceMatch = text.match(/\\\`\\\`\\\`(?:json)?\\\\s*([\\\\s\\\\S]*?)\\\`\\\`\\\`/);
    if (fenceMatch) jsonContent = fenceMatch[1].trim();

    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    }

    result = JSON.parse(jsonContent);
    usedProvider = provider.name;
    console.log(\`Success with \${provider.name}\`);
    break;
  } catch (err) {
    const errMsg = err.message || String(err);
    console.log(\`\${provider.name} failed: \${errMsg}\`);
    errors.push({ provider: provider.name, error: errMsg });
  }
}

if (!result) {
  throw new Error('All AI providers failed: ' + JSON.stringify(errors));
}

return [{
  json: {
    ...result,
    _provider: usedProvider,
    _fallbacksUsed: errors.length,
    _topic: topic,
    _language: language
  }
}];
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
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('📥 Fetching workflow...');
  const wf = await httpRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`);

  // Find the fallback node
  const nodeIndex = wf.nodes.findIndex(n => n.name.includes('Fallback') || n.name.includes('Generate'));
  if (nodeIndex === -1) {
    throw new Error('Could not find generation node');
  }

  const oldNode = wf.nodes[nodeIndex];
  const oldName = oldNode.name;
  const newName = 'Generate with Fallback (Grok→Anthropic→Gemini)';

  console.log(`📝 Updating node: ${oldName}`);

  // Create new node
  const newNode = {
    id: oldNode.id,
    name: newName,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: oldNode.position,
    parameters: {
      jsCode: RESILIENT_CODE,
      mode: 'runOnceForAllItems',
    },
  };

  wf.nodes[nodeIndex] = newNode;

  // Fix connections
  const newConnections = {};
  for (const [source, conns] of Object.entries(wf.connections)) {
    const newSource = source === oldName ? newName : source;
    newConnections[newSource] = JSON.parse(JSON.stringify(conns));

    if (newConnections[newSource].main) {
      newConnections[newSource].main.forEach(outputs => {
        outputs.forEach(conn => {
          if (conn.node === oldName) conn.node = newName;
        });
      });
    }
  }

  console.log('📤 Saving workflow...');
  await httpRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, {
    name: wf.name,
    nodes: wf.nodes,
    connections: newConnections,
    settings: wf.settings,
  });

  console.log('🔄 Activating...');
  await httpRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/activate`);

  console.log('✅ Done! Fallback order: Grok → Anthropic → Gemini');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
