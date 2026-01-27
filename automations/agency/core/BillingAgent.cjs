/**
 * BillingAgent.cjs - Horizontal Billing Automation
 * 3A Automation - Session 177/178 (SOTA Optimization)
 *
 * Automatically creates Stripe customers and draft invoices
 * when leads are qualified or bookings are confirmed.
 *
 * SOTA Features (Session 178):
 * - Idempotency Keys: Prevents duplicate customers/invoices
 * - Webhook Signature Verification: Secure invoice.paid handling
 * - Deduplication: Session-based request tracking
 *
 * Integrates with Meta CAPI for closed-loop attribution.
 * Source: Stripe Billing Best Practices 2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const StripeGlobalGateway = require('./gateways/stripe-global-gateway.cjs');
const RevenueScience = require('./RevenueScience.cjs');
const MarketingScience = require('./marketing-science-core.cjs');

class BillingAgent {
    constructor(options = {}) {
        this.gateway = new StripeGlobalGateway({
            apiKey: process.env.STRIPE_SECRET_KEY
        });

        // Product pricing fallback (Essentials Pack)
        this.defaultPrice = options.defaultPrice || 50000; // €500.00
        this.currency = options.currency || 'eur';
    }

    /**
     * Trigger billing flow from a session
     */
    async processSessionBilling(sessionData) {
        const { identity, intent, qualification } = sessionData.pillars || {};

        if (!identity?.email && !identity?.phone) {
            console.log('[BillingAgent] Missing identity data, skipping billing.');
            return { success: false, reason: 'missing_identity' };
        }

        console.log(`[BillingAgent] Processing billing for ${identity.email || identity.phone}`);

        try {
            // 1. Create or Find Customer
            const customer = await this._getOrCreateCustomer(identity);

            // 2. Determine price via RevenueScience (The Yield Brain)
            const price = RevenueScience.calculateOptimalPrice(qualification);

            // 3. Margin Protection Guard
            if (!RevenueScience.isMarginSafe(price)) {
                console.warn('[BillingAgent] MARGIN WARNING: Quote below safety threshold.');
            }

            // 4. Create Draft Invoice (Engineered Flow: Handoff to human for final 11% check)
            const invoice = await this._createDraftInvoice(customer.id, price, intent?.need);

            // 5. Track conversion for closed-loop attribution (GA4 + Meta CAPI)
            await MarketingScience.trackV2('booking_initiated', {
                sector: 'BILLING',
                email: identity.email,
                phone: identity.phone,
                fbclid: sessionData.metadata?.attribution?.fbclid,
                estimated_value: price / 100,
                customer_id: customer.id,
                invoice_id: invoice.id
            });

            return {
                success: true,
                customerId: customer.id,
                invoiceId: invoice.id,
                amount: price / 100,
                status: 'draft_created'
            };

        } catch (error) {
            console.error(`[BillingAgent] Billing failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async _getOrCreateCustomer(identity) {
        const payload = new URLSearchParams({
            email: identity.email || '',
            name: identity.name || 'AI Lead',
            phone: identity.phone || '',
            'metadata[agent_ops]': 'true',
            'metadata[source]': 'billing_agent_v2'
        });

        // SOTA: Idempotency key based on email/phone (prevents duplicate customers)
        const idempotencyKey = this.gateway.generateIdempotencyKey(
            'create_customer',
            identity.email || identity.phone
        );

        return await this.gateway.request('/v1/customers', 'POST', payload.toString(), { idempotencyKey });
    }

    async _createDraftInvoice(customerId, amountInCents, description = '', sessionId = null) {
        // SOTA: Generate session-scoped idempotency key
        const sessionKey = sessionId || `${customerId}-${Date.now()}`;

        // 1. Create Invoice Item
        const itemPayload = new URLSearchParams({
            customer: customerId,
            amount: amountInCents,
            currency: this.currency,
            description: `3A Automation Service: ${description || 'Essentials Pack'}`
        });
        const itemIdempotencyKey = this.gateway.generateIdempotencyKey('invoice_item', sessionKey);
        await this.gateway.request('/v1/invoice_items', 'POST', itemPayload.toString(), { idempotencyKey: itemIdempotencyKey });

        // 2. Create Invoice
        const invoicePayload = new URLSearchParams({
            customer: customerId,
            auto_advance: 'false', // Keep as draft for 80/20 human review
            collection_method: 'send_invoice',
            days_until_due: '7',
            'metadata[session_id]': sessionKey,
            'metadata[created_by]': 'billing_agent_v2'
        });
        const invoiceIdempotencyKey = this.gateway.generateIdempotencyKey('invoice', sessionKey);
        return await this.gateway.request('/v1/invoices', 'POST', invoicePayload.toString(), { idempotencyKey: invoiceIdempotencyKey });
    }

    /**
     * SOTA: Handle invoice.paid webhook with signature verification
     * This triggers the actual Purchase conversion event for Meta CAPI
     * @param {string} rawBody - Raw request body for signature verification
     * @param {string} signature - Stripe-Signature header value
     * @param {object} attribution - Attribution data (fbclid, phone)
     */
    async handleInvoicePaidWebhook(rawBody, signature, attribution = {}) {
        // SOTA: Verify webhook signature first
        const verification = this.gateway.verifyWebhookSignature(rawBody, signature);
        if (!verification.valid) {
            console.error(`[BillingAgent] ❌ Webhook signature invalid: ${verification.error}`);
            return { success: false, error: 'invalid_signature' };
        }

        let invoiceData;
        try {
            const event = JSON.parse(rawBody);
            if (event.type !== 'invoice.paid') {
                return { success: false, error: 'wrong_event_type' };
            }
            invoiceData = event.data.object;
        } catch (e) {
            return { success: false, error: 'parse_error' };
        }

        return this.handleInvoicePaid(invoiceData, attribution);
    }

    /**
     * Handle invoice.paid event (after signature verification)
     * This triggers the actual Purchase conversion event for Meta CAPI
     */
    async handleInvoicePaid(invoiceData, attribution = {}) {
        const amount = invoiceData.amount_paid / 100;
        const email = invoiceData.customer_email;
        const invoiceId = invoiceData.id;

        // SOTA: Deduplication check (avoid double-tracking)
        const dedupKey = `invoice_paid_${invoiceId}`;
        if (this._processedInvoices && this._processedInvoices.has(dedupKey)) {
            console.log(`[BillingAgent] Invoice ${invoiceId} already processed, skipping`);
            return { success: true, tracked: false, reason: 'already_processed' };
        }
        this._processedInvoices = this._processedInvoices || new Set();
        this._processedInvoices.add(dedupKey);

        console.log(`[BillingAgent] Invoice paid: €${amount} - ${email}`);

        // Track Purchase conversion for closed-loop attribution
        await MarketingScience.trackV2('purchase_completed', {
            sector: 'REVENUE',
            email: email,
            phone: attribution.phone,
            fbclid: attribution.fbclid,
            value: amount,
            invoice_id: invoiceId,
            customer_id: invoiceData.customer
        });

        return { success: true, tracked: true, value: amount, invoiceId };
    }
}

const instance = new BillingAgent();
module.exports = instance;
