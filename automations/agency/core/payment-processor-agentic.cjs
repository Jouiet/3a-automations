/**
 * 3A-AUTOMATION - Unified Payment Processor
 * Agentic orchestrator for multi-market transaction routing.
 * 
 * Detects client locale/currency and dispatches to 
 * Payzone (National) or Stripe (International).
 */

const PayzoneGateway = require('./gateways/payzone-gateway.cjs');
const StripeGlobalGateway = require('./gateways/stripe-global-gateway.cjs');
const FINANCIAL_CONFIG = require('./agency-financial-config.cjs');

class PaymentProcessor {
    constructor() {
        this.payzone = new PayzoneGateway({ isTest: process.env.NODE_ENV !== 'production' });
        this.stripe = new StripeGlobalGateway({ isTest: process.env.NODE_ENV !== 'production' });
    }

    /**
     * Main entry point for transaction processing
     */
    async process(transactionRequest) {
        const { currency, country } = transactionRequest;

        console.log(`📡 [PaymentProcessor] Processing transaction for ${country} (${currency})...`);

        // Orchestration Logic:
        // If Morocco/MAD -> Use Payzone
        if (currency === 'MAD' || country === 'Maroc') {
            return await this.handleMoroccanPayment(transactionRequest);
        }

        // If International -> Use Stripe Global
        return await this.handleInternationalPayment(transactionRequest);
    }

    async handleMoroccanPayment(data) {
        console.log('📝 Route: National (CMI/Payzone.ma)');
        try {
            const result = await this.payzone.processPayment(data);
            return {
                gateway: 'PAYZONE',
                market: 'NATIONAL',
                status: result.success ? 'SUCCESS' : 'FAILED',
                transactionId: result.transactionId,
                message: result.message
            };
        } catch (e) {
            console.error('❌ Payzone Processing Failed:', e.message);
            throw e;
        }
    }

    async handleInternationalPayment(data) {
        console.log('📝 Route: International (Stripe/Global)');
        try {
            // Determine if AliPay is requested
            if (data.method === 'ALIPAY') {
                const session = await this.stripe.createAliPaySession(data);
                return { gateway: 'STRIPE', market: 'INTL', status: 'PENDING', url: session.client_secret };
            }

            // Default to Apple/Google Pay via PaymentIntent
            const intent = await this.stripe.createPaymentIntent(data);
            return {
                gateway: 'STRIPE',
                market: 'INTL',
                status: intent.status === 'succeeded' ? 'SUCCESS' : 'REQUIRES_ACTION',
                clientSecret: intent.client_secret,
                transactionId: intent.id
            };
        } catch (e) {
            console.error('❌ Stripe Processing Failed:', e.message);
            throw e;
        }
    }
}

module.exports = PaymentProcessor;
