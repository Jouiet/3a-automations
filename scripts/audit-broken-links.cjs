#!/usr/bin/env node
/**
 * Broken Links Audit Script v2
 * Analyzes all HTML files and identifies real 404 internal links
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Get all HTML files
function getAllHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Extract all href links from HTML content
function extractLinks(content, filePath) {
  const links = [];
  // Match href="..." patterns
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  
  while ((match = hrefRegex.exec(content)) !== null) {
    let href = match[1].split('#')[0].split('?')[0]; // Remove anchors and query strings
    
    // Skip external links, protocols, special URLs
    if (href.startsWith('http://') || 
        href.startsWith('https://') ||
        href.startsWith('//') ||  // Protocol-relative (external)
        href.startsWith('mailto:') || 
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('data:') ||
        href === '' ||
        href === '#') {
      continue;
    }
    links.push({ href: match[1], clean: href });
  }
  return links;
}

// Resolve link to absolute file path
function resolveLink(href, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  
  if (href.startsWith('/')) {
    // Absolute path from root
    return path.join(SITE_ROOT, href);
  } else {
    // Relative path
    return path.resolve(sourceDir, href);
  }
}

// Check if file exists
function fileExists(filePath) {
  // Handle directory paths (should have index.html)
  let checkPath = filePath;
  if (checkPath.endsWith('/')) {
    checkPath = path.join(checkPath, 'index.html');
  }
  
  try {
    // Check if it's a file or directory
    if (fs.existsSync(checkPath)) {
      return true;
    }
    // If path doesn't have extension, check with .html
    if (!path.extname(checkPath)) {
      return fs.existsSync(checkPath + '.html') || fs.existsSync(path.join(checkPath, 'index.html'));
    }
    return false;
  } catch {
    return false;
  }
}

// Check for problematic link patterns
function findProblematicPatterns(content, filePath) {
  const issues = [];
  const relativeFile = filePath.replace(SITE_ROOT, '');
  
  // Pattern 1: services.html at root (should be /services/xxx.html)
  if (content.includes('href="services.html"') || content.includes("href='services.html'")) {
    issues.push({ source: relativeFile, issue: 'services.html (file does not exist)', fix: 'Use /services/ecommerce.html or other service pages' });
  }
  
  // Pattern 2: about.html at root (should be a-propos.html for FR)
  if (content.includes('href="about.html"') || content.includes("href='about.html'")) {
    if (!relativeFile.startsWith('/en/')) {
      issues.push({ source: relativeFile, issue: 'about.html in FR section', fix: 'Use a-propos.html' });
    }
  }
  
  // Pattern 3: Check for common wrong patterns
  const wrongPatterns = [
    { pattern: /href=["']\.\/services\.html["']/g, issue: './services.html' },
    { pattern: /href=["']\/services\.html["']/g, issue: '/services.html' },
    { pattern: /href=["']services\.html["']/g, issue: 'services.html' },
  ];
  
  for (const { pattern, issue } of wrongPatterns) {
    if (pattern.test(content)) {
      issues.push({ source: relativeFile, issue, fix: 'File does not exist - use specific service page' });
    }
  }
  
  return issues;
}

// Main audit
function auditBrokenLinks() {
  const htmlFiles = getAllHtmlFiles(SITE_ROOT);
  const brokenLinks = [];
  const problematicPatterns = [];
  
  console.log(`\n🔍 Analyzing ${htmlFiles.length} HTML files for internal broken links...\n`);
  
  for (const file of htmlFiles) {
    const relativeFile = file.replace(SITE_ROOT, '');
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content, file);
    
    // Check each internal link
    for (const { href, clean } of links) {
      const resolvedPath = resolveLink(clean, file);
      const exists = fileExists(resolvedPath);
      
      if (!exists) {
        brokenLinks.push({
          source: relativeFile,
          href: href,
          resolved: resolvedPath.replace(SITE_ROOT, '')
        });
      }
    }
    
    // Check for problematic patterns
    const patterns = findProblematicPatterns(content, file);
    problematicPatterns.push(...patterns);
  }
  
  // Report broken links
  console.log('='.repeat(80));
  console.log('📋 BROKEN INTERNAL LINKS AUDIT REPORT');
  console.log('='.repeat(80));
  
  if (brokenLinks.length === 0) {
    console.log('\n✅ No broken internal links found!\n');
  } else {
    console.log(`\n❌ Found ${brokenLinks.length} BROKEN INTERNAL LINKS:\n`);
    
    // Group by source file
    const bySource = {};
    for (const link of brokenLinks) {
      if (!bySource[link.source]) {
        bySource[link.source] = [];
      }
      bySource[link.source].push(link);
    }
    
    for (const [source, links] of Object.entries(bySource)) {
      console.log(`\n📄 ${source}`);
      for (const link of links) {
        console.log(`   ❌ href="${link.href}"`);
        console.log(`      → Missing: ${link.resolved}`);
      }
    }
  }
  
  // Report problematic patterns
  if (problematicPatterns.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  PROBLEMATIC PATTERNS DETECTED:');
    console.log('='.repeat(80));
    for (const p of problematicPatterns) {
      console.log(`\n📄 ${p.source}`);
      console.log(`   ⚠️  ${p.issue}`);
      console.log(`   💡 ${p.fix}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   • Broken links: ${brokenLinks.length}`);
  console.log(`   • Problematic patterns: ${problematicPatterns.length}`);
  console.log(`   • Files analyzed: ${htmlFiles.length}`);
  console.log('');
  
  return { brokenLinks, problematicPatterns };
}

// Run audit
const { brokenLinks, problematicPatterns } = auditBrokenLinks();
process.exit((brokenLinks.length + problematicPatterns.length) > 0 ? 1 : 0);
