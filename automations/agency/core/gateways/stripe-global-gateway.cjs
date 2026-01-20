/**
 * 3A-AUTOMATION - Stripe Global Gateway
 * Handles international transactions (Google Pay, Apple Pay, AliPay)
 * via REST API proxy architecture.
 * 
 * Protocol: REST (v2025+)
 * Compliance: SCA / Strong Customer Authentication
 * 
 * @version 1.0.0
 * @date 2026-01-11
 */

const https = require('https');

class StripeGlobalGateway {
    constructor(config) {
        this.apiKey = config.apiKey || process.env.STRIPE_SECRET_KEY;
        this.isTest = config.isTest !== false;
        this.endpoint = 'api.stripe.com';
    }

    /**
     * Creates a PaymentIntent for one-tap payments (Google/Apple Pay)
     */
    async createPaymentIntent(data) {
        const payload = new URLSearchParams({
            amount: Math.round(data.amount * 100), // Stripe uses cents
            currency: (data.currency || 'EUR').toLowerCase(),
            'payment_method_types[]': 'card',
            'payment_method_options[card][request_three_d_secure]': 'any',
            description: `3A-Automation: ${data.description || 'Service Invoice'}`,
            'metadata[order_id]': data.orderId,
            'metadata[client_email]': data.email
        });

        // Add Apple/Google Pay specific capability if needed via Payment Method Types
        if (data.enableWallets) {
            // These are often enabled by default on Stripe PaymentIntents 
            // but can be explicitly routed
        }

        return this.request('/v1/payment_intents', 'POST', payload.toString());
    }

    /**
     * Handles AliPay specifically
     */
    async createAliPaySession(data) {
        const payload = new URLSearchParams({
            amount: Math.round(data.amount * 100),
            currency: (data.currency || 'USD').toLowerCase(),
            'payment_method_types[]': 'alipay',
            'metadata[order_id]': data.orderId
        });

        return this.request('/v1/payment_intents', 'POST', payload.toString());
    }

    async request(path, method, body) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.endpoint,
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let chunks = [];
                res.on('data', d => chunks.push(d));
                res.on('end', () => {
                    const data = Buffer.concat(chunks).toString();
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Stripe API Error: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
}

module.exports = StripeGlobalGateway;
