#!/usr/bin/env node
/**
 * 3A AUTOMATION - Invoice Generator
 * Generates professional PDF invoices with multi-currency support
 *
 * Usage: node invoice-generator.cjs --client "Client Name" --amount 790 --currency EUR
 *
 * @version 1.0.0
 * @date 2025-12-26
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  company: {
    name: '3A Automation',
    tagline: 'Automation • Analytics • AI',
    email: 'contact@3a-automation.com',
    website: 'https://3a-automation.com',
    address: '[Adresse]',
    city: '[Ville]',
    country: 'Maroc',
    ice: '[Numéro ICE]'
  },

  currencies: {
    MAD: {
      symbol: 'DH',
      name: 'Dirham Marocain',
      flag: '🇲🇦',
      locale: 'fr-MA',
      region: 'Maroc',
      payment: {
        bank: '[Nom Banque]',
        rib: '[24 chiffres RIB]',
        beneficiary: '3A Automation'
      }
    },
    EUR: {
      symbol: '€',
      name: 'Euro',
      flag: '🇪🇺',
      locale: 'fr-FR',
      region: 'Europe',
      payment: {
        iban: 'BE** **** **** ****',
        bic: 'TRWIBEB1XXX',
        bank: 'Wise'
      }
    },
    USD: {
      symbol: '$',
      name: 'US Dollar',
      flag: '🌍',
      locale: 'en-US',
      region: 'International',
      payment: {
        account: '[Payoneer Account]',
        routing: '[ABA Number]',
        swift: '[Swift Code]'
      }
    }
  },

  packs: {
    'quick-win': {
      name_fr: 'Pack Quick Win',
      name_en: 'Quick Win Pack',
      prices: { MAD: 3990, EUR: 390, USD: 450 }
    },
    'essentials': {
      name_fr: 'Pack Essentials',
      name_en: 'Essentials Pack',
      prices: { MAD: 7990, EUR: 790, USD: 920 }
    },
    'growth': {
      name_fr: 'Pack Growth',
      name_en: 'Growth Pack',
      prices: { MAD: 14990, EUR: 1399, USD: 1690 }
    },
    'maintenance': {
      name_fr: 'Retainer Maintenance',
      name_en: 'Maintenance Retainer',
      prices: { MAD: 2900, EUR: 290, USD: 330 }
    },
    'optimization': {
      name_fr: 'Retainer Optimization',
      name_en: 'Optimization Retainer',
      prices: { MAD: 5200, EUR: 490, USD: 550 }
    }
  },

  vatRates: {
    MAD: 0.20,  // TVA Maroc 20%
    EUR: 0,     // Pas de TVA intra-EU B2B
    USD: 0      // Pas de TVA export
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICE GENERATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class InvoiceGenerator {
  constructor() {
    this.invoiceNumber = this.generateInvoiceNumber();
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  }

  formatCurrency(amount, currency) {
    const config = CONFIG.currencies[currency];
    if (!config) throw new Error(`Currency ${currency} not supported`);

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date, locale = 'fr-FR') {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  calculateTotals(items, currency) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vatRate = CONFIG.vatRates[currency] || 0;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    return { subtotal, vat, vatRate, total };
  }

  generatePaymentSection(currency) {
    const currencies = CONFIG.currencies;
    let html = '';

    for (const [code, config] of Object.entries(currencies)) {
      const isActive = code === currency;
      const payment = config.payment;

      let details = '';
      if (code === 'MAD') {
        details = `
          <strong>Banque:</strong> ${payment.bank}<br>
          <strong>RIB:</strong> ${payment.rib}<br>
          <strong>Bénéficiaire:</strong> ${payment.beneficiary}
        `;
      } else if (code === 'EUR') {
        details = `
          <strong>IBAN:</strong> ${payment.iban}<br>
          <strong>BIC:</strong> ${payment.bic}<br>
          <strong>Banque:</strong> ${payment.bank}
        `;
      } else if (code === 'USD') {
        details = `
          <strong>Account:</strong> ${payment.account}<br>
          <strong>Routing:</strong> ${payment.routing}<br>
          <strong>Swift:</strong> ${payment.swift}
        `;
      }

      html += `
        <div class="payment-method" ${isActive ? 'style="border-color: var(--primary); background: rgba(79, 186, 241, 0.08);"' : ''}>
          <div class="payment-method-header">
            <span class="payment-flag">${config.flag}</span>
            <span class="payment-method-title">${config.region} (${code})</span>
          </div>
          <div class="payment-method-details">${details}</div>
        </div>
      `;
    }

    return html;
  }

  generateItemsHTML(items, currency) {
    return items.map(item => `
      <tr>
        <td>
          <div class="item-name">${item.name}</div>
          <div class="item-description">${item.description || ''}</div>
        </td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-rate">${this.formatCurrency(item.unitPrice, currency)}</td>
        <td>${this.formatCurrency(item.quantity * item.unitPrice, currency)}</td>
      </tr>
    `).join('');
  }

  generate(data) {
    const {
      client,
      items,
      currency = 'EUR',
      status = 'pending',
      issueDate = new Date(),
      dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notes = '',
      language = 'fr'
    } = data;

    const currencyConfig = CONFIG.currencies[currency];
    if (!currencyConfig) {
      throw new Error(`Currency ${currency} not supported. Use: MAD, EUR, USD`);
    }

    const totals = this.calculateTotals(items, currency);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    // Labels based on language
    const labels = {
      fr: {
        invoice: 'FACTURE',
        billedTo: 'Facturé à',
        from: 'Émetteur',
        issueDate: 'Date d\'émission',
        dueDate: 'Date d\'échéance',
        currency: 'Devise',
        description: 'Description',
        quantity: 'Quantité',
        unitPrice: 'Prix unitaire',
        total: 'Total',
        subtotal: 'Sous-total',
        vat: 'TVA',
        grandTotal: 'Total',
        paymentMethods: 'Moyens de paiement acceptés',
        thankYou: 'Merci pour votre confiance. Cette facture est payable sous 15 jours.',
        statusPending: 'En attente',
        statusPaid: 'Payée'
      },
      en: {
        invoice: 'INVOICE',
        billedTo: 'Bill To',
        from: 'From',
        issueDate: 'Issue Date',
        dueDate: 'Due Date',
        currency: 'Currency',
        description: 'Description',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        total: 'Total',
        subtotal: 'Subtotal',
        vat: 'VAT',
        grandTotal: 'Total',
        paymentMethods: 'Accepted Payment Methods',
        thankYou: 'Thank you for your business. Payment is due within 15 days.',
        statusPending: 'Pending',
        statusPaid: 'Paid'
      }
    };

    const l = labels[language] || labels.fr;
    const statusClass = status === 'paid' ? 'status-paid' : 'status-pending';
    const statusText = status === 'paid' ? l.statusPaid : l.statusPending;

    // Read template
    const templatePath = path.join(__dirname, 'invoice-template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Generate invoice HTML
    const invoiceHTML = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${l.invoice} ${this.invoiceNumber} - ${client.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --primary: #4FBAF1;
      --primary-dark: #2B6685;
      --secondary: #191E35;
      --accent: #10B981;
      --text-light: #E4F4FC;
      --text-secondary: #8BA3B9;
      --border: rgba(79, 186, 241, 0.2);
      --bg-card: rgba(255, 255, 255, 0.03);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0F1219 0%, #191E35 50%, #1a1f3a 100%);
      color: var(--text-light);
      min-height: 100vh;
      padding: 40px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(180deg, rgba(25, 30, 53, 0.95) 0%, rgba(15, 18, 25, 0.98) 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 0 60px rgba(79, 186, 241, 0.1), 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .invoice-header {
      background: linear-gradient(135deg, rgba(79, 186, 241, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
      padding: 40px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .company-info { display: flex; align-items: center; gap: 16px; }

    .logo {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 24px; color: #fff;
      box-shadow: 0 4px 20px rgba(79, 186, 241, 0.3);
    }

    .company-name {
      font-size: 1.5rem; font-weight: 700;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    .company-tagline { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-label { font-size: 2rem; font-weight: 700; color: var(--text-light); letter-spacing: 2px; }
    .invoice-number { font-size: 1rem; color: var(--primary); margin-top: 8px; font-weight: 500; }

    .invoice-status {
      display: inline-block; margin-top: 12px; padding: 6px 16px; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
    }

    .status-pending { background: rgba(251, 191, 36, 0.15); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.3); }
    .status-paid { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }

    .invoice-info {
      display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
      padding: 40px; border-bottom: 1px solid var(--border);
    }

    .info-block h3 {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px;
      color: var(--text-secondary); margin-bottom: 12px;
    }

    .info-block p { color: var(--text-light); line-height: 1.8; font-size: 0.95rem; }
    .info-block .highlight { color: var(--primary); font-weight: 600; }

    .invoice-dates {
      display: flex; gap: 40px; padding: 24px 40px;
      background: var(--bg-card); border-bottom: 1px solid var(--border);
    }

    .date-item { display: flex; align-items: center; gap: 12px; }

    .date-icon {
      width: 40px; height: 40px; background: rgba(79, 186, 241, 0.1);
      border: 1px solid var(--border); border-radius: 10px;
      display: flex; align-items: center; justify-content: center; color: var(--primary);
    }

    .date-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .date-value { font-weight: 600; color: var(--text-light); }

    .invoice-items { padding: 40px; }
    .items-table { width: 100%; border-collapse: collapse; }

    .items-table thead th {
      text-align: left; padding: 16px 0; border-bottom: 2px solid var(--border);
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-secondary); font-weight: 600;
    }

    .items-table thead th:last-child { text-align: right; }

    .items-table tbody td {
      padding: 20px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); vertical-align: top;
    }

    .items-table tbody td:last-child { text-align: right; font-weight: 600; color: var(--text-light); }
    .item-name { font-weight: 600; color: var(--text-light); margin-bottom: 4px; }
    .item-description { font-size: 0.85rem; color: var(--text-secondary); max-width: 400px; }
    .item-qty, .item-rate { color: var(--text-secondary); }

    .invoice-totals { padding: 0 40px 40px; }

    .totals-box {
      margin-left: auto; width: 300px; background: var(--bg-card);
      border: 1px solid var(--border); border-radius: 16px; padding: 24px;
    }

    .total-row {
      display: flex; justify-content: space-between; padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .total-row:last-child {
      border-bottom: none; padding-top: 16px; margin-top: 8px; border-top: 2px solid var(--border);
    }

    .total-label { color: var(--text-secondary); }
    .total-value { font-weight: 600; color: var(--text-light); }
    .total-row.grand-total .total-label, .total-row.grand-total .total-value { font-size: 1.25rem; font-weight: 700; }
    .total-row.grand-total .total-value { color: var(--primary); }

    .invoice-payment {
      padding: 40px;
      background: linear-gradient(135deg, rgba(79, 186, 241, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%);
      border-top: 1px solid var(--border);
    }

    .payment-title {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px;
      color: var(--text-secondary); margin-bottom: 20px;
    }

    .payment-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

    .payment-method {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px;
    }

    .payment-method-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .payment-flag { font-size: 1.5rem; }
    .payment-method-title { font-weight: 600; color: var(--text-light); font-size: 0.9rem; }
    .payment-method-details { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; }
    .payment-method-details strong { color: var(--text-light); font-weight: 500; }

    .invoice-footer {
      padding: 30px 40px; text-align: center; border-top: 1px solid var(--border);
    }

    .footer-text { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; }
    .footer-contact { display: flex; justify-content: center; gap: 30px; font-size: 0.85rem; }
    .footer-contact a { color: var(--primary); text-decoration: none; }

    .currency-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
      background: rgba(79, 186, 241, 0.1); border: 1px solid var(--border);
      border-radius: 20px; font-size: 0.8rem; color: var(--primary); font-weight: 500; margin-left: 12px;
    }

    @media print {
      body { padding: 0; background: #fff; }
      .invoice-container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="company-info">
        <div class="logo">3A</div>
        <div>
          <div class="company-name">${CONFIG.company.name}</div>
          <div class="company-tagline">${CONFIG.company.tagline}</div>
        </div>
      </div>
      <div class="invoice-title">
        <div class="invoice-label">${l.invoice}</div>
        <div class="invoice-number">#${this.invoiceNumber}</div>
        <div class="invoice-status ${statusClass}">${statusText}</div>
      </div>
    </div>

    <div class="invoice-info">
      <div class="info-block">
        <h3>${l.billedTo}</h3>
        <p>
          <strong class="highlight">${client.name}</strong><br>
          ${client.address || ''}<br>
          ${client.city || ''}<br>
          ${client.country || ''}<br><br>
          <span style="color: var(--text-secondary)">Email:</span> ${client.email || ''}
        </p>
      </div>
      <div class="info-block">
        <h3>${l.from}</h3>
        <p>
          <strong class="highlight">${CONFIG.company.name}</strong><br>
          ${CONFIG.company.address}<br>
          ${CONFIG.company.city}<br>
          ${CONFIG.company.country}<br><br>
          <span style="color: var(--text-secondary)">ICE:</span> ${CONFIG.company.ice}
        </p>
      </div>
    </div>

    <div class="invoice-dates">
      <div class="date-item">
        <div class="date-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div>
          <div class="date-label">${l.issueDate}</div>
          <div class="date-value">${this.formatDate(issueDate, locale)}</div>
        </div>
      </div>
      <div class="date-item">
        <div class="date-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div>
          <div class="date-label">${l.dueDate}</div>
          <div class="date-value">${this.formatDate(dueDate, locale)}</div>
        </div>
      </div>
      <div class="date-item">
        <div class="date-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div>
          <div class="date-label">${l.currency}</div>
          <div class="date-value">${currency} <span class="currency-badge">${currencyConfig.region}</span></div>
        </div>
      </div>
    </div>

    <div class="invoice-items">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%">${l.description}</th>
            <th style="width: 15%">${l.quantity}</th>
            <th style="width: 15%">${l.unitPrice}</th>
            <th style="width: 20%">${l.total}</th>
          </tr>
        </thead>
        <tbody>
          ${this.generateItemsHTML(items, currency)}
        </tbody>
      </table>
    </div>

    <div class="invoice-totals">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">${l.subtotal}</span>
          <span class="total-value">${this.formatCurrency(totals.subtotal, currency)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">${l.vat} (${Math.round(totals.vatRate * 100)}%)</span>
          <span class="total-value">${this.formatCurrency(totals.vat, currency)}</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">${l.grandTotal}</span>
          <span class="total-value">${this.formatCurrency(totals.total, currency)}</span>
        </div>
      </div>
    </div>

    <div class="invoice-payment">
      <div class="payment-title">${l.paymentMethods}</div>
      <div class="payment-methods">
        ${this.generatePaymentSection(currency)}
      </div>
    </div>

    <div class="invoice-footer">
      <p class="footer-text">${l.thankYou}</p>
      <div class="footer-contact">
        <a href="mailto:${CONFIG.company.email}">${CONFIG.company.email}</a>
        <span style="color: var(--text-secondary)">|</span>
        <a href="${CONFIG.company.website}">${CONFIG.company.website.replace('https://', '')}</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    return {
      html: invoiceHTML,
      invoiceNumber: this.invoiceNumber,
      totals,
      currency,
      client
    };
  }

  save(data, outputDir = './invoices') {
    const result = this.generate(data);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${result.invoiceNumber}.html`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, result.html, 'utf8');

    console.log(`✅ Invoice generated: ${filepath}`);
    console.log(`   Number: ${result.invoiceNumber}`);
    console.log(`   Client: ${result.client.name}`);
    console.log(`   Total: ${this.formatCurrency(result.totals.total, result.currency)}`);

    return { ...result, filepath };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const generator = new InvoiceGenerator();

  // Example invoice
  const exampleData = {
    client: {
      name: 'Exemple Client SARL',
      address: '123 Rue Mohammed V',
      city: 'Casablanca',
      country: 'Maroc',
      email: 'contact@exemple.ma'
    },
    items: [
      {
        name: 'Pack Essentials - Setup Automatisations',
        description: 'Configuration: 9 workflows email marketing, 5 automations analytics, intégration Voice AI',
        quantity: 1,
        unitPrice: 790
      },
      {
        name: 'Retainer Maintenance - 1 mois',
        description: 'Monitoring, optimisation continue, support prioritaire',
        quantity: 1,
        unitPrice: 290
      }
    ],
    currency: 'EUR',
    language: 'fr',
    status: 'pending'
  };

  const result = generator.save(exampleData, path.join(__dirname, 'generated'));

  console.log('\n📄 Example invoice generated successfully!');
  console.log(`   Open in browser: file://${path.resolve(result.filepath)}`);
}

// Export for use as module
module.exports = { InvoiceGenerator, CONFIG };
