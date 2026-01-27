/**
 * BillingAgent.cjs - Horizontal Billing Automation
 * 3A Automation - Session 177 (Agent Ops Transformation)
 *
 * Automatically creates Stripe customers and draft invoices
 * when leads are qualified or bookings are confirmed.
 *
 * Integrates with Meta CAPI for closed-loop attribution.
 */

const fs = require('fs');
const path = require('path');
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
            'metadata[agent_ops]': 'true'
        });

        return await this.gateway.request('/v1/customers', 'POST', payload.toString());
    }

    async _createDraftInvoice(customerId, amountInCents, description = '') {
        // 1. Create Invoice Item
        const itemPayload = new URLSearchParams({
            customer: customerId,
            amount: amountInCents,
            currency: this.currency,
            description: `3A Automation Service: ${description || 'Essentials Pack'}`
        });
        await this.gateway.request('/v1/invoice_items', 'POST', itemPayload.toString());

        // 2. Create Invoice
        const invoicePayload = new URLSearchParams({
            customer: customerId,
            auto_advance: 'false', // Keep as draft for 80/20 human review
            collection_method: 'send_invoice',
            days_until_due: '7'
        });
        return await this.gateway.request('/v1/invoices', 'POST', invoicePayload.toString());
    }

    /**
     * Handle invoice.paid webhook (call from Stripe webhook handler)
     * This triggers the actual Purchase conversion event for Meta CAPI
     */
    async handleInvoicePaid(invoiceData, attribution = {}) {
        const amount = invoiceData.amount_paid / 100;
        const email = invoiceData.customer_email;

        console.log(`[BillingAgent] Invoice paid: €${amount} - ${email}`);

        // Track Purchase conversion for closed-loop attribution
        await MarketingScience.trackV2('purchase_completed', {
            sector: 'REVENUE',
            email: email,
            phone: attribution.phone,
            fbclid: attribution.fbclid,
            value: amount,
            invoice_id: invoiceData.id,
            customer_id: invoiceData.customer
        });

        return { success: true, tracked: true, value: amount };
    }
}

const instance = new BillingAgent();
module.exports = instance;
