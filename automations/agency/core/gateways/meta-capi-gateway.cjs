/**
 * Meta Conversions API (CAPI) Gateway
 * 3A Automation - Session 177 (Closed-Loop Attribution)
 *
 * Server-Side Conversion Tracking for Meta Ads
 * Sends offline conversions (Lead, Purchase) back to Meta for optimization
 *
 * Benchmark: +13-41% ROAS uplift (Meta, Polar Analytics)
 *
 * Usage:
 *   const MetaCAPI = require('./gateways/meta-capi-gateway.cjs');
 *   await MetaCAPI.trackLead({ email, phone, fbclid, value });
 */

const crypto = require('crypto');

class MetaCAPIGateway {
    constructor() {
        this.pixelId = process.env.META_PIXEL_ID;
        this.accessToken = process.env.META_ACCESS_TOKEN;
        this.apiVersion = 'v22.0';
        this.testEventCode = process.env.META_TEST_EVENT_CODE || null;
    }

    /**
     * Hash user data per Meta requirements (SHA256, lowercase, trimmed)
     */
    _hash(value) {
        if (!value) return null;
        const normalized = String(value).toLowerCase().trim();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Build the base event payload
     */
    _buildPayload(eventName, userData, customData = {}, eventSourceUrl = 'https://3a-automation.com') {
        const timestamp = Math.floor(Date.now() / 1000);

        const payload = {
            data: [{
                event_name: eventName,
                event_time: timestamp,
                event_source_url: eventSourceUrl,
                action_source: 'website',
                user_data: {
                    em: userData.email ? [this._hash(userData.email)] : undefined,
                    ph: userData.phone ? [this._hash(userData.phone)] : undefined,
                    fn: userData.firstName ? [this._hash(userData.firstName)] : undefined,
                    ln: userData.lastName ? [this._hash(userData.lastName)] : undefined,
                    ct: userData.city ? [this._hash(userData.city)] : undefined,
                    country: userData.country ? [this._hash(userData.country)] : undefined,
                    fbc: userData.fbclid ? `fb.1.${timestamp}.${userData.fbclid}` : undefined,
                    fbp: userData.fbp || undefined,
                    client_ip_address: userData.ip || undefined,
                    client_user_agent: userData.userAgent || undefined
                },
                custom_data: {
                    ...customData,
                    currency: customData.currency || 'EUR',
                    value: customData.value || 0
                }
            }]
        };

        // Add test event code for debugging
        if (this.testEventCode) {
            payload.test_event_code = this.testEventCode;
        }

        // Clean undefined values
        Object.keys(payload.data[0].user_data).forEach(key => {
            if (payload.data[0].user_data[key] === undefined) {
                delete payload.data[0].user_data[key];
            }
        });

        return payload;
    }

    /**
     * Send event to Meta CAPI
     */
    async _send(payload) {
        if (!this.pixelId || !this.accessToken) {
            console.warn('[MetaCAPI] Missing credentials (META_PIXEL_ID or META_ACCESS_TOKEN)');
            return { success: false, error: 'missing_credentials' };
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${this.accessToken}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.events_received) {
                console.log(`[MetaCAPI] ✅ Event sent successfully. Events received: ${result.events_received}`);
                return { success: true, events_received: result.events_received, fbtrace_id: result.fbtrace_id };
            } else {
                console.error(`[MetaCAPI] ❌ Event failed:`, result);
                return { success: false, error: result.error?.message || 'Unknown error' };
            }
        } catch (error) {
            console.error(`[MetaCAPI] ❌ Network error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Track Lead event (when BANT qualification is complete)
     * @param {object} data { email, phone, fbclid, leadScore, estimatedLtv }
     */
    async trackLead(data) {
        const userData = {
            email: data.email,
            phone: data.phone,
            fbclid: data.fbclid,
            fbp: data.fbp,
            firstName: data.firstName,
            lastName: data.lastName,
            ip: data.ip,
            userAgent: data.userAgent
        };

        const customData = {
            lead_score: data.leadScore || data.bant_score || 0,
            value: data.estimatedLtv || data.value || 0,
            currency: data.currency || 'EUR',
            content_name: data.service || '3A Automation Lead',
            content_category: data.sector || 'Voice AI'
        };

        const payload = this._buildPayload('Lead', userData, customData, data.sourceUrl);
        console.log(`[MetaCAPI] Tracking Lead: ${data.email || data.phone} | Score: ${customData.lead_score}`);
        return await this._send(payload);
    }

    /**
     * Track Purchase event (when deal is closed)
     * @param {object} data { email, phone, fbclid, value, orderId }
     */
    async trackPurchase(data) {
        const userData = {
            email: data.email,
            phone: data.phone,
            fbclid: data.fbclid,
            fbp: data.fbp,
            ip: data.ip,
            userAgent: data.userAgent
        };

        const customData = {
            value: data.value || 0,
            currency: data.currency || 'EUR',
            order_id: data.orderId || data.invoiceId,
            content_name: data.productName || '3A Automation Service',
            content_category: data.sector || 'Automation'
        };

        const payload = this._buildPayload('Purchase', userData, customData, data.sourceUrl);
        console.log(`[MetaCAPI] Tracking Purchase: ${data.email || data.phone} | Value: €${customData.value}`);
        return await this._send(payload);
    }

    /**
     * Track InitiateCheckout event (when booking is initiated)
     */
    async trackInitiateCheckout(data) {
        const userData = {
            email: data.email,
            phone: data.phone,
            fbclid: data.fbclid
        };

        const customData = {
            value: data.estimatedValue || 500,
            currency: data.currency || 'EUR',
            content_name: data.service || 'Consultation Booking'
        };

        const payload = this._buildPayload('InitiateCheckout', userData, customData, data.sourceUrl);
        console.log(`[MetaCAPI] Tracking InitiateCheckout: ${data.email || data.phone}`);
        return await this._send(payload);
    }

    /**
     * Health check
     */
    async healthCheck() {
        return {
            status: (this.pixelId && this.accessToken) ? 'ok' : 'error',
            gateway: 'meta-capi',
            version: '1.0.0',
            credentials: {
                META_PIXEL_ID: this.pixelId ? 'set' : 'missing',
                META_ACCESS_TOKEN: this.accessToken ? 'set' : 'missing'
            },
            apiVersion: this.apiVersion,
            testMode: !!this.testEventCode
        };
    }
}

module.exports = new MetaCAPIGateway();
