#!/usr/bin/env node
/**
 * 3A Automation - Knowledge Base for Services (B2B)
 *
 * Role: TF-IDF based search for 119 automation services
 * Purpose: Powers Voice AI assistant with service knowledge
 *
 * Adapted from MyDealz product KB via Technology Shelf
 * Original: MyDealz scripts/knowledge_base_simple.py
 *
 * Version: 1.0.0 | Session 144 | 23/01/2026
 */

const fs = require('fs');
const path = require('path');

// Paths
const BASE_DIR = path.join(__dirname, '../../..');
const KNOWLEDGE_BASE_DIR = path.join(BASE_DIR, 'knowledge_base');
const CATALOG_PATH = path.join(BASE_DIR, 'landing-page-hostinger/data/automations-catalog.json');

// Knowledge base files
const KB_CHUNKS_FILE = path.join(KNOWLEDGE_BASE_DIR, 'chunks.json');
const KB_INDEX_FILE = path.join(KNOWLEDGE_BASE_DIR, 'tfidf_index.json');
const KB_STATUS_FILE = path.join(KNOWLEDGE_BASE_DIR, 'status.json');

/**
 * Simple TF-IDF Implementation
 */
class TFIDFIndex {
  constructor() {
    this.documents = [];
    this.vocabulary = new Map();
    this.idf = new Map();
    this.tfidf = [];
  }

  /**
   * Tokenize and normalize text
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüç-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Build TF-IDF index from documents
   */
  build(documents) {
    this.documents = documents;
    const docCount = documents.length;

    // Build vocabulary and document frequency
    const docFreq = new Map();
    const termFreqs = [];

    for (const doc of documents) {
      const tokens = this.tokenize(doc.text);
      const termFreq = new Map();

      for (const token of tokens) {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, this.vocabulary.size);
        }
      }

      // Update document frequency
      for (const token of termFreq.keys()) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }

      termFreqs.push(termFreq);
    }

    // Calculate IDF
    for (const [token, df] of docFreq) {
      this.idf.set(token, Math.log((docCount + 1) / (df + 1)) + 1);
    }

    // Build TF-IDF vectors
    for (const termFreq of termFreqs) {
      const vector = new Map();
      let norm = 0;

      for (const [token, tf] of termFreq) {
        const tfidf = tf * (this.idf.get(token) || 0);
        vector.set(token, tfidf);
        norm += tfidf * tfidf;
      }

      // Normalize
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (const [token, value] of vector) {
          vector.set(token, value / norm);
        }
      }

      this.tfidf.push(vector);
    }
  }

  /**
   * Search for similar documents
   */
  search(query, topK = 5) {
    const queryTokens = this.tokenize(query);
    const queryVector = new Map();
    let norm = 0;

    // Build query TF-IDF vector
    for (const token of queryTokens) {
      const tf = queryTokens.filter(t => t === token).length;
      const tfidf = tf * (this.idf.get(token) || 0);
      queryVector.set(token, tfidf);
      norm += tfidf * tfidf;
    }

    // Normalize query vector
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (const [token, value] of queryVector) {
        queryVector.set(token, value / norm);
      }
    }

    // Calculate cosine similarity with all documents
    const scores = [];
    for (let i = 0; i < this.tfidf.length; i++) {
      let similarity = 0;
      const docVector = this.tfidf[i];

      for (const [token, queryVal] of queryVector) {
        if (docVector.has(token)) {
          similarity += queryVal * docVector.get(token);
        }
      }

      if (similarity > 0) {
        scores.push({ index: i, score: similarity });
      }
    }

    // Sort by score and return top K
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).map(s => ({
      ...this.documents[s.index],
      score: s.score
    }));
  }

  /**
   * Serialize index to JSON
   */
  toJSON() {
    return {
      vocabulary: Array.from(this.vocabulary.entries()),
      idf: Array.from(this.idf.entries()),
      tfidf: this.tfidf.map(v => Array.from(v.entries())),
      document_count: this.documents.length
    };
  }

  /**
   * Load index from JSON
   */
  fromJSON(data) {
    this.vocabulary = new Map(data.vocabulary);
    this.idf = new Map(data.idf);
    this.tfidf = data.tfidf.map(v => new Map(v));
  }
}

/**
 * Knowledge Base Manager for 3A Services
 */
class ServiceKnowledgeBase {
  constructor() {
    this.chunks = [];
    this.index = new TFIDFIndex();
    this.isLoaded = false;
  }

  /**
   * Build knowledge base from automations catalog
   */
  async build() {
    console.log('📚 Building 3A Services Knowledge Base...');

    // Ensure directory exists
    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_BASE_DIR, { recursive: true });
    }

    // Load automations catalog
    if (!fs.existsSync(CATALOG_PATH)) {
      throw new Error(`Catalog not found: ${CATALOG_PATH}`);
    }

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const automations = catalog.automations || [];
    const categories = catalog.categories || {};

    console.log(`   Found ${automations.length} automations`);

    // Create chunks for each automation
    this.chunks = [];
    for (const auto of automations) {
      const categoryInfo = categories[auto.category] || {};

      // Build rich text for TF-IDF
      const textParts = [
        auto.name_en || auto.name || '',
        auto.name_fr || '',
        auto.benefit_en || auto.benefit || '',
        auto.benefit_fr || '',
        auto.semantic_description || '',
        categoryInfo.name_en || '',
        categoryInfo.name_fr || '',
        auto.category || '',
        (auto.capabilities || []).join(' '),
        (auto.features || []).join(' '),
        (auto.platforms || []).join(' ')
      ];

      const chunk = {
        id: auto.id,
        type: 'automation',
        title: auto.name_en || auto.name_fr || auto.id,
        title_fr: auto.name_fr || '',
        category: auto.category,
        category_name: categoryInfo.name_en || auto.category,
        category_name_fr: categoryInfo.name_fr || '',
        benefit_en: auto.benefit_en || auto.benefit || '',
        benefit_fr: auto.benefit_fr || '',
        frequency_en: auto.frequency_en || '',
        frequency_fr: auto.frequency_fr || '',
        agentic_level: auto.agentic_level || 1,
        script: auto.script || null,
        text: textParts.filter(Boolean).join(' ')
      };

      this.chunks.push(chunk);
    }

    // Also add category summaries as searchable chunks
    for (const [catId, catInfo] of Object.entries(categories)) {
      const catAutomations = automations.filter(a => a.category === catId);
      const chunk = {
        id: `category-${catId}`,
        type: 'category',
        title: catInfo.name_en || catId,
        title_fr: catInfo.name_fr || '',
        category: catId,
        automation_count: catInfo.count || catAutomations.length,
        text: [
          catInfo.name_en || '',
          catInfo.name_fr || '',
          catId,
          `${catAutomations.length} automations`,
          catAutomations.map(a => a.name_en || a.id).join(' ')
        ].join(' ')
      };
      this.chunks.push(chunk);
    }

    console.log(`   Created ${this.chunks.length} searchable chunks`);

    // Build TF-IDF index
    this.index.build(this.chunks);
    console.log(`   TF-IDF index built: ${this.index.vocabulary.size} terms`);

    // Save chunks
    fs.writeFileSync(KB_CHUNKS_FILE, JSON.stringify(this.chunks, null, 2));
    console.log(`   Saved: ${KB_CHUNKS_FILE}`);

    // Save index
    fs.writeFileSync(KB_INDEX_FILE, JSON.stringify(this.index.toJSON(), null, 2));
    console.log(`   Saved: ${KB_INDEX_FILE}`);

    // Save status
    const status = {
      version: '1.0.0',
      built_at: new Date().toISOString(),
      chunk_count: this.chunks.length,
      term_count: this.index.vocabulary.size,
      source: CATALOG_PATH,
      automations_count: automations.length,
      categories_count: Object.keys(categories).length
    };
    fs.writeFileSync(KB_STATUS_FILE, JSON.stringify(status, null, 2));
    console.log(`   Saved: ${KB_STATUS_FILE}`);

    this.isLoaded = true;
    console.log('✅ Knowledge Base built successfully');

    return status;
  }

  /**
   * Load existing knowledge base
   */
  load() {
    if (!fs.existsSync(KB_CHUNKS_FILE) || !fs.existsSync(KB_INDEX_FILE)) {
      return false;
    }

    try {
      this.chunks = JSON.parse(fs.readFileSync(KB_CHUNKS_FILE, 'utf8'));
      const indexData = JSON.parse(fs.readFileSync(KB_INDEX_FILE, 'utf8'));
      this.index.fromJSON(indexData);
      this.index.documents = this.chunks;
      this.isLoaded = true;
      return true;
    } catch (e) {
      console.error(`Error loading knowledge base: ${e.message}`);
      return false;
    }
  }

  /**
   * Search for relevant services
   */
  search(query, topK = 5) {
    if (!this.isLoaded) {
      throw new Error('Knowledge base not loaded. Run --build first.');
    }
    return this.index.search(query, topK);
  }

  /**
   * Get knowledge base status
   */
  getStatus() {
    if (!fs.existsSync(KB_STATUS_FILE)) {
      return { exists: false };
    }

    const status = JSON.parse(fs.readFileSync(KB_STATUS_FILE, 'utf8'));
    status.exists = true;
    status.knowledge_base_dir = KNOWLEDGE_BASE_DIR;
    return status;
  }

  /**
   * Format search results for voice response
   */
  formatForVoice(results, language = 'en') {
    if (!results || results.length === 0) {
      return language === 'fr'
        ? "Je n'ai pas trouvé d'automation correspondante."
        : "I couldn't find a matching automation.";
    }

    const lines = [];
    for (const r of results.slice(0, 3)) {
      const title = language === 'fr' && r.title_fr ? r.title_fr : r.title;
      const benefit = language === 'fr' && r.benefit_fr ? r.benefit_fr : r.benefit_en;
      const category = language === 'fr' && r.category_name_fr ? r.category_name_fr : r.category_name;

      lines.push(`${title} (${category}): ${benefit}`);
    }

    return lines.join('\n');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const kb = new ServiceKnowledgeBase();

  if (args.includes('--health')) {
    console.log('✅ 3A Service Knowledge Base: Module OK');
    const status = kb.getStatus();
    console.log(`   Knowledge Base: ${status.exists ? 'Built' : 'Not built'}`);
    if (status.exists) {
      console.log(`   Chunks: ${status.chunk_count}`);
      console.log(`   Terms: ${status.term_count}`);
      console.log(`   Built: ${status.built_at}`);
    }
    console.log(`   Directory: ${KNOWLEDGE_BASE_DIR}`);
    process.exit(0);
  }

  if (args.includes('--build')) {
    try {
      const status = await kb.build();
      console.log('\nBuild Summary:');
      console.log(JSON.stringify(status, null, 2));
    } catch (e) {
      console.error(`❌ Build failed: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (args.includes('--status')) {
    const status = kb.getStatus();
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (args.includes('--search')) {
    const queryIndex = args.indexOf('--search') + 1;
    const query = args.slice(queryIndex).join(' ');

    if (!query) {
      console.error('Usage: --search <query>');
      process.exit(1);
    }

    if (!kb.load()) {
      console.error('❌ Knowledge base not built. Run --build first.');
      process.exit(1);
    }

    const results = kb.search(query, 5);
    console.log(`\nSearch: "${query}"`);
    console.log(`Found: ${results.length} results\n`);

    for (const r of results) {
      console.log(`[${r.score.toFixed(3)}] ${r.title}`);
      console.log(`   Category: ${r.category_name || r.category}`);
      console.log(`   Benefit: ${r.benefit_en || 'N/A'}`);
      console.log(`   ID: ${r.id}`);
      console.log('');
    }
    return;
  }

  // Default: show help
  console.log(`
3A Automation - Service Knowledge Base

Usage:
  node knowledge-base-services.cjs --build     Build knowledge base from catalog
  node knowledge-base-services.cjs --search <query>  Search for services
  node knowledge-base-services.cjs --status    Show knowledge base status
  node knowledge-base-services.cjs --health    Health check

Examples:
  node knowledge-base-services.cjs --search "email abandoned cart"
  node knowledge-base-services.cjs --search "lead generation B2B"
  node knowledge-base-services.cjs --search "voice AI telephony"
`);
}

// Export for use as module
module.exports = { ServiceKnowledgeBase, TFIDFIndex };

// Run if called directly
if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
