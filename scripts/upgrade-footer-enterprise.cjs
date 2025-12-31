#!/usr/bin/env node
/**
 * UPGRADE: Footer to Enterprise-Class Structure
 * Based on B2B best practices 2024-2025
 *
 * Structure:
 * - Solutions column
 * - Resources column (with Academy link)
 * - Company column
 * - Legal column
 * - Trust badges
 * - Secondary CTA
 * - Social links (LinkedIn first for B2B)
 *
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// New enterprise footer structure - French version
const FR_NEW_FOOTER = `
        <div class="footer-links-ultra">
          <div class="footer-heading">Solutions</div>
          <ul>
            <li><a href="/services/ecommerce.html">E-commerce</a></li>
            <li><a href="/services/pme.html">PME & B2B</a></li>
            <li><a href="/services/flywheel-360.html">Système 360°</a></li>
            <li><a href="/services/voice-ai.html">Voice AI</a></li>
            <li><a href="/automations.html">Automations</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Ressources</div>
          <ul>
            <li><a href="/services/audit-gratuit.html">Audit Gratuit</a></li>
            <li><a href="/blog/">Blog</a></li>
            <li><a href="/cas-clients.html">Cas Clients</a></li>
            <li><a href="/academie.html">📚 Académie <span class="badge-clients">Clients</span></a></li>
            <li><a href="/pricing.html">Tarifs</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Entreprise</div>
          <ul>
            <li><a href="/a-propos.html">À propos</a></li>
            <li><a href="/contact.html">Contact</a></li>
            <li><a href="/booking.html">Réserver un appel</a></li>
            <li><a href="mailto:contact@3a-automation.com">contact@3a-automation.com</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Légal & Sécurité</div>
          <ul>
            <li><a href="/legal/mentions-legales.html">Mentions légales</a></li>
            <li><a href="/legal/politique-confidentialite.html">Confidentialité</a></li>
          </ul>
          <div class="footer-trust-badges">
            <span class="trust-badge" title="RGPD Compliant">🔒 RGPD</span>
            <span class="trust-badge" title="Données sécurisées">🛡️ SSL</span>
          </div>
        </div>`;

// English version
const EN_NEW_FOOTER = `
        <div class="footer-links-ultra">
          <div class="footer-heading">Solutions</div>
          <ul>
            <li><a href="/en/services/ecommerce.html">E-commerce</a></li>
            <li><a href="/en/services/smb.html">SMB & B2B</a></li>
            <li><a href="/en/services/flywheel-360.html">360° System</a></li>
            <li><a href="/en/services/voice-ai.html">Voice AI</a></li>
            <li><a href="/en/automations.html">Automations</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Resources</div>
          <ul>
            <li><a href="/en/services/free-audit.html">Free Audit</a></li>
            <li><a href="/en/blog/">Blog</a></li>
            <li><a href="/en/case-studies.html">Case Studies</a></li>
            <li><a href="/en/academy.html">📚 Academy <span class="badge-clients">Clients</span></a></li>
            <li><a href="/en/pricing.html">Pricing</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Company</div>
          <ul>
            <li><a href="/en/about.html">About</a></li>
            <li><a href="/en/contact.html">Contact</a></li>
            <li><a href="/en/booking.html">Book a Call</a></li>
            <li><a href="mailto:contact@3a-automation.com">contact@3a-automation.com</a></li>
          </ul>
        </div>

        <div class="footer-links-ultra">
          <div class="footer-heading">Legal & Security</div>
          <ul>
            <li><a href="/en/legal/terms.html">Terms of Service</a></li>
            <li><a href="/en/legal/privacy.html">Privacy Policy</a></li>
          </ul>
          <div class="footer-trust-badges">
            <span class="trust-badge" title="GDPR Compliant">🔒 GDPR</span>
            <span class="trust-badge" title="Secure Data">🛡️ SSL</span>
          </div>
        </div>`;

// Patterns to find old footer grid
const FR_OLD_FOOTER_PATTERN = /<div class="footer-grid-ultra">[\s\S]*?<div class="footer-bottom-ultra">/;
const EN_OLD_FOOTER_PATTERN = /<div class="footer-grid-ultra">[\s\S]*?<div class="footer-bottom-ultra">/;

// New footer grid wrapper
const FR_NEW_FOOTER_FULL = `<div class="footer-grid-ultra">
        <div class="footer-brand-ultra">
          <div class="logo">
            <div class="logo-icon">
              <img src="/logo.webp" alt="3A Automation Logo" width="40" height="40" loading="lazy">
            </div>
            <div class="logo-text-wrap">
              <span class="logo-text">3A</span>
              <span class="logo-sub">AUTOMATION</span>
            </div>
          </div>
          <p class="footer-tagline">Automation · Analytics · AI</p>
          <p class="footer-desc">L'opérationnel automatisé. Le stratégique libéré.</p>
          <div class="footer-social">
            <a href="https://linkedin.com/company/3a-automation" target="_blank" rel="noopener" aria-label="LinkedIn" class="social-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
${FR_NEW_FOOTER}
      </div>

      <div class="footer-bottom-ultra">`;

const EN_NEW_FOOTER_FULL = `<div class="footer-grid-ultra">
        <div class="footer-brand-ultra">
          <div class="logo">
            <div class="logo-icon">
              <img src="/logo.webp" alt="3A Automation Logo" width="40" height="40" loading="lazy">
            </div>
            <div class="logo-text-wrap">
              <span class="logo-text">3A</span>
              <span class="logo-sub">AUTOMATION</span>
            </div>
          </div>
          <p class="footer-tagline">Automation · Analytics · AI</p>
          <p class="footer-desc">Operations automated. Strategy unleashed.</p>
          <div class="footer-social">
            <a href="https://linkedin.com/company/3a-automation" target="_blank" rel="noopener" aria-label="LinkedIn" class="social-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
${EN_NEW_FOOTER}
      </div>

      <div class="footer-bottom-ultra">`;

const stats = {
  filesProcessed: 0,
  filesModified: 0
};

function processFile(filePath) {
  if (!filePath.endsWith('.html')) return;
  if (filePath.includes('/academie') || filePath.includes('/academy')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  stats.filesProcessed++;

  // Determine if EN or FR
  const isEnglish = relativePath.includes('/en/');

  // Check if file has footer-grid-ultra
  if (!content.includes('footer-grid-ultra')) {
    return;
  }

  // Replace the footer
  if (isEnglish) {
    content = content.replace(FR_OLD_FOOTER_PATTERN, EN_NEW_FOOTER_FULL);
  } else {
    content = content.replace(FR_OLD_FOOTER_PATTERN, FR_NEW_FOOTER_FULL);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    console.log(`✅ Updated footer: ${relativePath}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

// Main
console.log('🔧 Upgrading footers to enterprise-class structure...\n');
console.log('Enterprise footer includes:');
console.log('  - 4 navigation columns (Solutions, Resources, Company, Legal)');
console.log('  - Academy link with Clients badge');
console.log('  - Trust badges (RGPD/GDPR, SSL)');
console.log('  - LinkedIn social link (B2B first)');
console.log('  - Blog link');
console.log('');

processDirectory(LANDING_DIR);

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`📁 Fichiers traités: ${stats.filesProcessed}`);
console.log(`✅ Footers mis à jour: ${stats.filesModified}`);
console.log('='.repeat(60));
