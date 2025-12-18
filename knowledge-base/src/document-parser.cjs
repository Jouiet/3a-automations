#!/usr/bin/env node
/**
 * DOCUMENT PARSER - Knowledge Base
 * ================================
 * Parses markdown documents into semantic chunks for RAG
 *
 * Features:
 * - Semantic chunking by headers
 * - Metadata extraction
 * - Code block handling
 * - Table preservation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  maxChunkSize: 1500,      // Max characters per chunk
  minChunkSize: 100,       // Min characters (avoid tiny chunks)
  overlapSize: 200,        // Overlap between chunks for context
  docsDir: path.join(__dirname, '../../'),
  outputDir: path.join(__dirname, '../data')
};

// Documents to ingest (priority order)
const DOCUMENTS = [
  { file: 'AAA-AUTOMATIONS-CATALOG-2025.md', category: 'catalog', priority: 1 },
  { file: 'FLYWHEEL-BLUEPRINT-2025.md', category: 'methodology', priority: 2 },
  { file: 'BUSINESS-MODEL-FACTUEL-2025.md', category: 'business', priority: 2 },
  { file: '3A-WEBSITE-BLUEPRINT-2025.md', category: 'website', priority: 3 },
  { file: '3A-BRANDING-GUIDE.md', category: 'branding', priority: 3 },
  { file: 'CLAUDE.md', category: 'context', priority: 2 }
];

/**
 * Generate unique ID for chunk
 */
function generateChunkId(content, source) {
  const hash = crypto.createHash('md5').update(content + source).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Extract headers hierarchy from markdown
 */
function extractHeaders(content) {
  const headers = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headers.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i
      });
    }
  }

  return headers;
}

/**
 * Get header path (breadcrumb) for a line
 */
function getHeaderPath(headers, lineNumber) {
  const path = [];
  let currentLevel = 7;

  // Find all headers before this line
  const relevantHeaders = headers.filter(h => h.line < lineNumber);

  // Build path from headers
  for (let i = relevantHeaders.length - 1; i >= 0; i--) {
    const header = relevantHeaders[i];
    if (header.level < currentLevel) {
      path.unshift(header.text);
      currentLevel = header.level;
    }
  }

  return path;
}

/**
 * Split content into semantic chunks
 */
function chunkDocument(content, source, category) {
  const chunks = [];
  const headers = extractHeaders(content);
  const lines = content.split('\n');

  let currentChunk = [];
  let currentChunkStart = 0;
  let inCodeBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Track tables
    if (line.startsWith('|') && !inTable) {
      inTable = true;
    } else if (!line.startsWith('|') && line.trim() !== '' && inTable) {
      inTable = false;
    }

    // Check if we should start a new chunk
    const isHeader = line.match(/^#{1,6}\s+/);
    const currentSize = currentChunk.join('\n').length;

    // Start new chunk on major headers (h1, h2) or when size exceeded
    const shouldSplit = (
      (isHeader && !inCodeBlock && currentSize > CONFIG.minChunkSize) ||
      (currentSize > CONFIG.maxChunkSize && !inCodeBlock && !inTable)
    );

    if (shouldSplit && currentChunk.length > 0) {
      // Save current chunk
      const chunkContent = currentChunk.join('\n').trim();
      if (chunkContent.length >= CONFIG.minChunkSize) {
        const headerPath = getHeaderPath(headers, currentChunkStart);
        chunks.push({
          id: generateChunkId(chunkContent, source),
          content: chunkContent,
          source: source,
          category: category,
          headerPath: headerPath,
          startLine: currentChunkStart,
          endLine: i - 1,
          charCount: chunkContent.length
        });
      }

      // Start new chunk with overlap
      const overlapLines = Math.ceil(CONFIG.overlapSize / 50); // ~50 chars per line
      currentChunk = currentChunk.slice(-overlapLines);
      currentChunkStart = Math.max(0, i - overlapLines);
    }

    currentChunk.push(line);
  }

  // Don't forget last chunk
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join('\n').trim();
    if (chunkContent.length >= CONFIG.minChunkSize) {
      const headerPath = getHeaderPath(headers, currentChunkStart);
      chunks.push({
        id: generateChunkId(chunkContent, source),
        content: chunkContent,
        source: source,
        category: category,
        headerPath: headerPath,
        startLine: currentChunkStart,
        endLine: lines.length - 1,
        charCount: chunkContent.length
      });
    }
  }

  return chunks;
}

/**
 * Process all documents
 */
function processDocuments() {
  console.log('\n' + '═'.repeat(60));
  console.log('  DOCUMENT PARSER - Knowledge Base');
  console.log('═'.repeat(60));

  const allChunks = [];
  const stats = {
    documentsProcessed: 0,
    totalChunks: 0,
    totalCharacters: 0,
    byCategory: {}
  };

  for (const doc of DOCUMENTS) {
    const filePath = path.join(CONFIG.docsDir, doc.file);

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  SKIP: ${doc.file} (not found)`);
      continue;
    }

    console.log(`\n📄 Processing: ${doc.file}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkDocument(content, doc.file, doc.category);

    allChunks.push(...chunks);
    stats.documentsProcessed++;
    stats.totalChunks += chunks.length;
    stats.totalCharacters += chunks.reduce((sum, c) => sum + c.charCount, 0);
    stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + chunks.length;

    console.log(`   └─ ${chunks.length} chunks (${content.length} chars)`);
  }

  // Save chunks
  const outputPath = path.join(CONFIG.outputDir, 'chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));

  // Save stats
  const statsPath = path.join(CONFIG.outputDir, 'parser-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify({
    ...stats,
    timestamp: new Date().toISOString(),
    avgChunkSize: Math.round(stats.totalCharacters / stats.totalChunks)
  }, null, 2));

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('  SUMMARY');
  console.log('─'.repeat(60));
  console.log(`  Documents processed: ${stats.documentsProcessed}`);
  console.log(`  Total chunks:        ${stats.totalChunks}`);
  console.log(`  Total characters:    ${stats.totalCharacters.toLocaleString()}`);
  console.log(`  Avg chunk size:      ${Math.round(stats.totalCharacters / stats.totalChunks)} chars`);
  console.log('\n  By category:');
  for (const [cat, count] of Object.entries(stats.byCategory)) {
    console.log(`    ${cat}: ${count} chunks`);
  }
  console.log('\n  Output: ' + outputPath);
  console.log('═'.repeat(60) + '\n');

  return allChunks;
}

// Run if called directly
if (require.main === module) {
  processDocuments();
}

module.exports = { processDocuments, chunkDocument };
