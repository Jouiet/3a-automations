#!/usr/bin/env node
/**
 * HubSpot B2B CRM Integration
 *
 * Purpose: CRM operations for B2B PME (contacts, companies, deals)
 * API Tier: Works with FREE HubSpot CRM
 *
 * Features:
 * - Contact management (create, update, search)
 * - Company management (create, update, search)
 * - Deal pipeline management
 * - Lead scoring (manual via properties)
 * - Geo-segmentation sync
 *
 * NOTE: Workflows API requires Pro tier ($890/mo) - NOT INCLUDED
 * This script uses FREE tier APIs only
 *
 * @version 1.0.0
 * @date 2026-01-02
 */

require('dotenv').config();
const { Client } = require('@hubspot/api-client');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  accessToken: process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN,
  rateLimit: {
    requests: 100,
    perSeconds: 10
  },
  defaultProperties: {
    contact: ['email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle', 'lead_score', 'hs_lead_status'],
    company: ['name', 'domain', 'industry', 'city', 'country', 'numberofemployees', 'annualrevenue'],
    deal: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate']
  },
  leadScoreThresholds: {
    hot: 80,
    warm: 50,
    cold: 0
  }
};

// ============================================================================
// HUBSPOT CLIENT
// ============================================================================

class HubSpotB2BCRM {
  constructor(accessToken = CONFIG.accessToken) {
    if (!accessToken) {
      console.warn('⚠️ No HubSpot access token provided. Running in test mode.');
      this.testMode = true;
      this.client = null;
    } else {
      this.testMode = false;
      this.client = new Client({ accessToken });
    }
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Rate limit handler
   */
  async rateLimit() {
    this.requestCount++;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (this.requestCount >= CONFIG.rateLimit.requests && elapsed < CONFIG.rateLimit.perSeconds * 1000) {
      const waitTime = (CONFIG.rateLimit.perSeconds * 1000) - elapsed;
      console.log(`⏳ Rate limit: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }
  }

  /**
   * Safe JSON parse helper
   */
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  // ==========================================================================
  // CONTACTS
  // ==========================================================================

  /**
   * Create or update a contact
   * @param {Object} contactData - Contact properties
   * @returns {Object} Created/updated contact
   */
  async upsertContact(contactData) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would upsert contact:', contactData);
      return { id: 'test-contact-id', properties: contactData };
    }

    await this.rateLimit();

    const { email, ...otherProps } = contactData;

    if (!email) {
      throw new Error('Email is required for contact upsert');
    }

    try {
      // Try to find existing contact by email
      const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: CONFIG.defaultProperties.contact
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        // Update existing contact
        const existingId = searchResponse.results[0].id;
        const updateResponse = await this.client.crm.contacts.basicApi.update(existingId, {
          properties: { email, ...otherProps }
        });
        console.log(`✅ Updated contact: ${email} (ID: ${existingId})`);
        return updateResponse;
      } else {
        // Create new contact
        const createResponse = await this.client.crm.contacts.basicApi.create({
          properties: { email, ...otherProps }
        });
        console.log(`✅ Created contact: ${email} (ID: ${createResponse.id})`);
        return createResponse;
      }
    } catch (error) {
      console.error(`❌ Contact upsert failed for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all contacts with pagination
   * @param {number} limit - Max contacts to retrieve
   * @returns {Array} Contacts list
   */
  async getAllContacts(limit = 100) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would get all contacts');
      return [];
    }

    await this.rateLimit();

    try {
      const contacts = await this.client.crm.contacts.getAll(
        limit,
        undefined,
        CONFIG.defaultProperties.contact
      );
      console.log(`✅ Retrieved ${contacts.length} contacts`);
      return contacts;
    } catch (error) {
      console.error('❌ Failed to get contacts:', error.message);
      throw error;
    }
  }

  /**
   * Search contacts by criteria
   * @param {Object} filters - Search filters
   * @returns {Array} Matching contacts
   */
  async searchContacts(filters) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would search contacts with:', filters);
      return [];
    }

    await this.rateLimit();

    const filterGroups = [];

    if (filters.email) {
      filterGroups.push({
        filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: filters.email }]
      });
    }

    if (filters.company) {
      filterGroups.push({
        filters: [{ propertyName: 'company', operator: 'CONTAINS_TOKEN', value: filters.company }]
      });
    }

    if (filters.leadStatus) {
      filterGroups.push({
        filters: [{ propertyName: 'hs_lead_status', operator: 'EQ', value: filters.leadStatus }]
      });
    }

    try {
      const response = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
        properties: CONFIG.defaultProperties.contact,
        limit: filters.limit || 100
      });

      console.log(`✅ Found ${response.total} contacts matching criteria`);
      return response.results || [];
    } catch (error) {
      console.error('❌ Contact search failed:', error.message);
      throw error;
    }
  }

  // ==========================================================================
  // COMPANIES
  // ==========================================================================

  /**
   * Create or update a company
   * @param {Object} companyData - Company properties
   * @returns {Object} Created/updated company
   */
  async upsertCompany(companyData) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would upsert company:', companyData);
      return { id: 'test-company-id', properties: companyData };
    }

    await this.rateLimit();

    const { domain, ...otherProps } = companyData;

    if (!domain && !companyData.name) {
      throw new Error('Domain or name is required for company upsert');
    }

    try {
      // Try to find existing company by domain
      if (domain) {
        const searchResponse = await this.client.crm.companies.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'domain',
              operator: 'EQ',
              value: domain
            }]
          }],
          properties: CONFIG.defaultProperties.company
        });

        if (searchResponse.results && searchResponse.results.length > 0) {
          const existingId = searchResponse.results[0].id;
          const updateResponse = await this.client.crm.companies.basicApi.update(existingId, {
            properties: { domain, ...otherProps }
          });
          console.log(`✅ Updated company: ${domain} (ID: ${existingId})`);
          return updateResponse;
        }
      }

      // Create new company
      const createResponse = await this.client.crm.companies.basicApi.create({
        properties: { domain, ...otherProps }
      });
      console.log(`✅ Created company: ${domain || companyData.name} (ID: ${createResponse.id})`);
      return createResponse;
    } catch (error) {
      console.error(`❌ Company upsert failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get all companies with pagination
   * @param {number} limit - Max companies to retrieve
   * @returns {Array} Companies list
   */
  async getAllCompanies(limit = 100) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would get all companies');
      return [];
    }

    await this.rateLimit();

    try {
      const companies = await this.client.crm.companies.getAll(
        limit,
        undefined,
        CONFIG.defaultProperties.company
      );
      console.log(`✅ Retrieved ${companies.length} companies`);
      return companies;
    } catch (error) {
      console.error('❌ Failed to get companies:', error.message);
      throw error;
    }
  }

  // ==========================================================================
  // DEALS
  // ==========================================================================

  /**
   * Create a deal
   * @param {Object} dealData - Deal properties
   * @returns {Object} Created deal
   */
  async createDeal(dealData) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would create deal:', dealData);
      return { id: 'test-deal-id', properties: dealData };
    }

    await this.rateLimit();

    if (!dealData.dealname) {
      throw new Error('Deal name is required');
    }

    try {
      const response = await this.client.crm.deals.basicApi.create({
        properties: {
          dealname: dealData.dealname,
          amount: dealData.amount || 0,
          dealstage: dealData.dealstage || 'appointmentscheduled',
          pipeline: dealData.pipeline || 'default',
          closedate: dealData.closedate || new Date().toISOString()
        }
      });
      console.log(`✅ Created deal: ${dealData.dealname} (ID: ${response.id})`);
      return response;
    } catch (error) {
      console.error('❌ Deal creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update deal stage
   * @param {string} dealId - Deal ID
   * @param {string} newStage - New deal stage
   * @returns {Object} Updated deal
   */
  async updateDealStage(dealId, newStage) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: Would update deal ${dealId} to stage ${newStage}`);
      return { id: dealId, properties: { dealstage: newStage } };
    }

    await this.rateLimit();

    try {
      const response = await this.client.crm.deals.basicApi.update(dealId, {
        properties: { dealstage: newStage }
      });
      console.log(`✅ Updated deal ${dealId} to stage: ${newStage}`);
      return response;
    } catch (error) {
      console.error(`❌ Deal update failed for ${dealId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all deals with pagination
   * @param {number} limit - Max deals to retrieve
   * @returns {Array} Deals list
   */
  async getAllDeals(limit = 100) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would get all deals');
      return [];
    }

    await this.rateLimit();

    try {
      const deals = await this.client.crm.deals.getAll(
        limit,
        undefined,
        CONFIG.defaultProperties.deal
      );
      console.log(`✅ Retrieved ${deals.length} deals`);
      return deals;
    } catch (error) {
      console.error('❌ Failed to get deals:', error.message);
      throw error;
    }
  }

  // ==========================================================================
  // ASSOCIATIONS
  // ==========================================================================

  /**
   * Associate contact to company
   * @param {string} contactId - Contact ID
   * @param {string} companyId - Company ID
   */
  async associateContactToCompany(contactId, companyId) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: Would associate contact ${contactId} to company ${companyId}`);
      return true;
    }

    await this.rateLimit();

    try {
      await this.client.crm.associations.v4.basicApi.create(
        'contacts',
        contactId,
        'companies',
        companyId,
        [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]
      );
      console.log(`✅ Associated contact ${contactId} to company ${companyId}`);
      return true;
    } catch (error) {
      console.error('❌ Association failed:', error.message);
      throw error;
    }
  }

  /**
   * Associate deal to contact
   * @param {string} dealId - Deal ID
   * @param {string} contactId - Contact ID
   */
  async associateDealToContact(dealId, contactId) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: Would associate deal ${dealId} to contact ${contactId}`);
      return true;
    }

    await this.rateLimit();

    try {
      await this.client.crm.associations.v4.basicApi.create(
        'deals',
        dealId,
        'contacts',
        contactId,
        [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
      );
      console.log(`✅ Associated deal ${dealId} to contact ${contactId}`);
      return true;
    } catch (error) {
      console.error('❌ Association failed:', error.message);
      throw error;
    }
  }

  // ==========================================================================
  // LEAD SCORING (Manual via Properties - FREE tier)
  // ==========================================================================

  /**
   * Update lead score for a contact
   * @param {string} contactId - Contact ID
   * @param {number} score - Lead score (0-100)
   */
  async updateLeadScore(contactId, score) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: Would update lead score for ${contactId} to ${score}`);
      return { id: contactId, properties: { lead_score: score } };
    }

    await this.rateLimit();

    // Determine lead status based on score
    let leadStatus = 'NEW';
    if (score >= CONFIG.leadScoreThresholds.hot) {
      leadStatus = 'QUALIFIED';
    } else if (score >= CONFIG.leadScoreThresholds.warm) {
      leadStatus = 'OPEN';
    }

    try {
      const response = await this.client.crm.contacts.basicApi.update(contactId, {
        properties: {
          lead_score: score.toString(),
          hs_lead_status: leadStatus
        }
      });
      console.log(`✅ Updated lead score for ${contactId}: ${score} (Status: ${leadStatus})`);
      return response;
    } catch (error) {
      console.error(`❌ Lead score update failed for ${contactId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get contacts by lead status (HOT/WARM/COLD)
   * @param {string} status - Lead status
   * @returns {Array} Contacts with matching status
   */
  async getContactsByLeadStatus(status) {
    return this.searchContacts({ leadStatus: status });
  }

  // ==========================================================================
  // GEO-SEGMENTATION
  // ==========================================================================

  /**
   * Update contact with geo data
   * @param {string} contactId - Contact ID
   * @param {Object} geoData - Geo information
   */
  async updateContactGeo(contactId, geoData) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: Would update geo for ${contactId}:`, geoData);
      return { id: contactId, properties: geoData };
    }

    await this.rateLimit();

    try {
      const response = await this.client.crm.contacts.basicApi.update(contactId, {
        properties: {
          city: geoData.city,
          state: geoData.state || geoData.region,
          country: geoData.country,
          zip: geoData.postalCode
        }
      });
      console.log(`✅ Updated geo for ${contactId}: ${geoData.city}, ${geoData.country}`);
      return response;
    } catch (error) {
      console.error(`❌ Geo update failed for ${contactId}:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Test API connectivity
   */
  async healthCheck() {
    console.log('\n🔍 HubSpot B2B CRM Health Check');
    console.log('================================');

    if (this.testMode) {
      console.log('⚠️ Running in TEST MODE (no API key)');
      console.log('✅ SDK loaded correctly');
      console.log('ℹ️ Set HUBSPOT_API_KEY or HUBSPOT_ACCESS_TOKEN to test API');
      return { status: 'test-mode', message: 'No API key configured' };
    }

    try {
      // Test contacts API
      const contacts = await this.client.crm.contacts.basicApi.getPage(1);
      console.log(`✅ Contacts API: ${contacts.results?.length || 0} contacts accessible`);

      // Test companies API
      const companies = await this.client.crm.companies.basicApi.getPage(1);
      console.log(`✅ Companies API: ${companies.results?.length || 0} companies accessible`);

      // Test deals API
      const deals = await this.client.crm.deals.basicApi.getPage(1);
      console.log(`✅ Deals API: ${deals.results?.length || 0} deals accessible`);

      console.log('\n✅ All HubSpot APIs operational');
      return {
        status: 'healthy',
        contacts: contacts.results?.length || 0,
        companies: companies.results?.length || 0,
        deals: deals.results?.length || 0
      };
    } catch (error) {
      console.error(`\n❌ Health check failed: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const crm = new HubSpotB2BCRM();

  if (args.includes('--health')) {
    await crm.healthCheck();
  } else if (args.includes('--test-contact')) {
    const result = await crm.upsertContact({
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'Contact',
      company: 'Test Company'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-company')) {
    const result = await crm.upsertCompany({
      name: 'Test Company',
      domain: 'testcompany.com',
      industry: 'Technology'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-deal')) {
    const result = await crm.createDeal({
      dealname: 'Test Deal',
      amount: 10000
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--list-contacts')) {
    const contacts = await crm.getAllContacts(10);
    console.log('Contacts:', JSON.stringify(contacts, null, 2));
  } else if (args.includes('--list-companies')) {
    const companies = await crm.getAllCompanies(10);
    console.log('Companies:', JSON.stringify(companies, null, 2));
  } else if (args.includes('--list-deals')) {
    const deals = await crm.getAllDeals(10);
    console.log('Deals:', JSON.stringify(deals, null, 2));
  } else {
    console.log(`
HubSpot B2B CRM Integration
===========================

Usage:
  node hubspot-b2b-crm.cjs [options]

Options:
  --health          Test API connectivity
  --test-contact    Create test contact
  --test-company    Create test company
  --test-deal       Create test deal
  --list-contacts   List first 10 contacts
  --list-companies  List first 10 companies
  --list-deals      List first 10 deals

Environment Variables:
  HUBSPOT_API_KEY        HubSpot Private App Access Token
  HUBSPOT_ACCESS_TOKEN   Alternative token variable

API Tier: FREE CRM
- Contacts, Companies, Deals: ✅ Included
- Workflows, Automation: ❌ Requires Pro ($890/mo)
`);
  }
}

// Export for programmatic use
module.exports = { HubSpotB2BCRM, CONFIG };

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
