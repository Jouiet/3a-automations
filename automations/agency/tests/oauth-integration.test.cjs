#!/usr/bin/env node
/**
 * OAuth Integration Tests - S8 Multi-Tenant Dashboard
 *
 * Tests: PKCE (RFC 7636), Provider Factory, Shopify HMAC, Auth URL generation
 * Framework: Node.js native test runner (node:test + node:assert)
 *
 * USAGE:
 *   node automations/agency/tests/oauth-integration.test.cjs
 *   node --test automations/agency/tests/oauth-integration.test.cjs
 *
 * @version 1.0.0
 * @date 2026-02-06
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// PKCE UTILITIES (mirror of dashboard/src/lib/oauth/pkce.ts)
// ─────────────────────────────────────────────────────────────────────────────

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

function generatePKCEPair() {
  const codeVerifier = generateCodeVerifier();
  return {
    codeVerifier,
    codeChallenge: generateCodeChallenge(codeVerifier),
    state: generateState(),
    nonce: generateNonce(),
  };
}

function verifyState(received, stored) {
  if (received.length !== stored.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(stored));
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH PROVIDER CONFIG (mirror of dashboard/src/lib/oauth/index.ts)
// ─────────────────────────────────────────────────────────────────────────────

const OAUTH_PROVIDERS = {
  shopify: {
    name: 'shopify', displayName: 'Shopify', icon: 'shopping-bag',
    scopes: ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'write_products'],
    authorizePath: '/api/auth/oauth/shopify/authorize',
    callbackPath: '/api/auth/oauth/shopify/callback',
    available: true, usePKCE: false,
    description: 'E-commerce store integration',
  },
  klaviyo: {
    name: 'klaviyo', displayName: 'Klaviyo', icon: 'mail',
    scopes: ['profiles:read', 'profiles:write', 'lists:read', 'lists:write', 'segments:read', 'flows:read', 'flows:write', 'campaigns:read', 'metrics:read', 'events:read', 'events:write'],
    authorizePath: '/api/auth/oauth/klaviyo/authorize',
    callbackPath: '/api/auth/oauth/klaviyo/callback',
    tokenEndpoint: 'https://a.klaviyo.com/oauth/token',
    available: true, usePKCE: true,
    description: 'Email & SMS marketing platform',
  },
  google: {
    name: 'google', displayName: 'Google', icon: 'chrome',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/calendar.readonly'],
    authorizePath: '/api/auth/oauth/google/authorize',
    callbackPath: '/api/auth/oauth/google/callback',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    available: true, usePKCE: false,
    description: 'Analytics, Search Console, Calendar',
  },
  hubspot: {
    name: 'hubspot', displayName: 'HubSpot', icon: 'briefcase',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read', 'crm.objects.companies.read'],
    authorizePath: '/api/auth/oauth/hubspot/authorize',
    callbackPath: '/api/auth/oauth/hubspot/callback',
    tokenEndpoint: 'https://api.hubapi.com/oauth/v1/token',
    available: false, usePKCE: false,
    description: 'CRM & marketing automation',
  },
  meta: {
    name: 'meta', displayName: 'Meta (Facebook)', icon: 'facebook',
    scopes: ['ads_read', 'pages_read_engagement', 'business_management'],
    authorizePath: '/api/auth/oauth/meta/authorize',
    callbackPath: '/api/auth/oauth/meta/callback',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    available: false, usePKCE: false,
    description: 'Facebook & Instagram ads',
  },
  tiktok: {
    name: 'tiktok', displayName: 'TikTok', icon: 'video',
    scopes: ['advertiser.read', 'campaign.read'],
    authorizePath: '/api/auth/oauth/tiktok/authorize',
    callbackPath: '/api/auth/oauth/tiktok/callback',
    tokenEndpoint: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    available: false, usePKCE: false,
    description: 'TikTok advertising',
  },
};

function getProviderConfig(provider) {
  return OAUTH_PROVIDERS[provider] || null;
}

function getAvailableProviders() {
  return Object.values(OAUTH_PROVIDERS).filter(p => p.available);
}

function getAllProviders() {
  return Object.values(OAUTH_PROVIDERS);
}

function isProviderSupported(provider) {
  return provider in OAUTH_PROVIDERS;
}

function isProviderAvailable(provider) {
  return isProviderSupported(provider) && OAUTH_PROVIDERS[provider].available;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPIFY HMAC VERIFICATION (mirror of dashboard/src/lib/oauth/shopify.ts)
// ─────────────────────────────────────────────────────────────────────────────

function isValidShopDomain(shop) {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function verifyHmac(query, clientSecret) {
  const { hmac, signature, ...params } = query;
  if (!hmac) return false;
  const message = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const generatedHmac = crypto.createHmac('sha256', clientSecret).update(message).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(generatedHmac, 'hex'));
  } catch {
    return false;
  }
}

function verifyWebhookHmac(body, hmacHeader, clientSecret) {
  const generatedHmac = crypto.createHmac('sha256', clientSecret).update(body, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(generatedHmac));
  } catch {
    return false;
  }
}

function generateShopifyAuthUrl(shop, state, clientId, scopes, redirectUri) {
  if (!isValidShopDomain(shop)) throw new Error(`Invalid shop domain: ${shop}`);
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(','),
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// KLAVIYO AUTH URL (mirror of dashboard/src/lib/oauth/klaviyo.ts)
// ─────────────────────────────────────────────────────────────────────────────

function generateKlaviyoAuthUrl(state, codeChallenge, clientId, scopes, redirectUri) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://www.klaviyo.com/oauth/authorize?${params}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SCOPES (mirror of dashboard/src/lib/oauth/google.ts)
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_SCOPES = {
  profile: 'https://www.googleapis.com/auth/userinfo.profile',
  email: 'https://www.googleapis.com/auth/userinfo.email',
  openid: 'openid',
  analytics: 'https://www.googleapis.com/auth/analytics.readonly',
  analyticsEdit: 'https://www.googleapis.com/auth/analytics.edit',
  webmasters: 'https://www.googleapis.com/auth/webmasters.readonly',
  webmastersVerify: 'https://www.googleapis.com/auth/siteverification',
  calendar: 'https://www.googleapis.com/auth/calendar.readonly',
  calendarEvents: 'https://www.googleapis.com/auth/calendar.events',
  adsRead: 'https://www.googleapis.com/auth/adwords',
  sheets: 'https://www.googleapis.com/auth/spreadsheets',
  sheetsReadonly: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  driveFile: 'https://www.googleapis.com/auth/drive.file',
};

const GOOGLE_SCOPE_PRESETS = {
  basic: ['openid', 'profile', 'email'],
  analytics: ['openid', 'profile', 'email', 'analytics'],
  searchConsole: ['openid', 'profile', 'email', 'webmasters'],
  calendar: ['openid', 'profile', 'email', 'calendar', 'calendarEvents'],
  ads: ['openid', 'profile', 'email', 'adsRead'],
  full: ['openid', 'profile', 'email', 'analytics', 'webmasters', 'calendar'],
};

function generateGoogleAuthUrl(scopeKeys, state, clientId, redirectUri, options = {}) {
  const { accessType = 'offline', prompt = 'consent', includeGrantedScopes = true } = options;
  const scopes = scopeKeys.map(key => GOOGLE_SCOPES[key]);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    access_type: accessType,
    prompt,
    include_granted_scopes: includeGrantedScopes.toString(),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function parseGrantedScopes(scopeString) {
  const grantedUrls = scopeString.split(' ');
  const scopeKeys = [];
  for (const [key, url] of Object.entries(GOOGLE_SCOPES)) {
    if (grantedUrls.includes(url)) scopeKeys.push(key);
  }
  return scopeKeys;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('PKCE (RFC 7636)', () => {
  it('generates code verifier with correct length (43 chars base64url)', () => {
    const verifier = generateCodeVerifier();
    assert.equal(typeof verifier, 'string');
    assert.equal(verifier.length, 43); // 32 bytes → 43 base64url chars
    assert.match(verifier, /^[A-Za-z0-9_-]+$/);
  });

  it('generates code challenge as SHA-256 of verifier', () => {
    const verifier = 'test-verifier-for-challenge-generation';
    const challenge = generateCodeChallenge(verifier);
    const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(challenge, expected);
  });

  it('generates unique code verifiers on each call', () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    assert.notEqual(v1, v2);
  });

  it('generates state as 32-char hex string', () => {
    const state = generateState();
    assert.equal(state.length, 32);
    assert.match(state, /^[0-9a-f]{32}$/);
  });

  it('generates nonce as 32-char hex string', () => {
    const nonce = generateNonce();
    assert.equal(nonce.length, 32);
    assert.match(nonce, /^[0-9a-f]{32}$/);
  });

  it('generates complete PKCE pair with all fields', () => {
    const pair = generatePKCEPair();
    assert.ok(pair.codeVerifier, 'codeVerifier present');
    assert.ok(pair.codeChallenge, 'codeChallenge present');
    assert.ok(pair.state, 'state present');
    assert.ok(pair.nonce, 'nonce present');
    // Verify challenge matches verifier
    const expectedChallenge = generateCodeChallenge(pair.codeVerifier);
    assert.equal(pair.codeChallenge, expectedChallenge);
  });

  it('verifyState returns true for matching states', () => {
    const state = generateState();
    assert.ok(verifyState(state, state));
  });

  it('verifyState returns false for different states', () => {
    const s1 = generateState();
    const s2 = generateState();
    assert.equal(verifyState(s1, s2), false);
  });

  it('verifyState returns false for different lengths', () => {
    assert.equal(verifyState('short', 'muchlongerstring'), false);
  });

  it('verifyState is timing-safe (uses crypto.timingSafeEqual)', () => {
    const state = 'a'.repeat(32);
    const tampered = 'a'.repeat(31) + 'b';
    assert.equal(verifyState(state, tampered), false);
  });
});

describe('OAuth Provider Factory', () => {
  it('returns 6 total providers', () => {
    const all = getAllProviders();
    assert.equal(all.length, 6);
  });

  it('returns exactly 3 available providers', () => {
    const available = getAvailableProviders();
    assert.equal(available.length, 3);
    const names = available.map(p => p.name);
    assert.deepEqual(names.sort(), ['google', 'klaviyo', 'shopify']);
  });

  it('identifies supported providers correctly', () => {
    assert.ok(isProviderSupported('shopify'));
    assert.ok(isProviderSupported('klaviyo'));
    assert.ok(isProviderSupported('google'));
    assert.ok(isProviderSupported('hubspot'));
    assert.ok(isProviderSupported('meta'));
    assert.ok(isProviderSupported('tiktok'));
    assert.equal(isProviderSupported('invalid'), false);
    assert.equal(isProviderSupported('stripe'), false);
  });

  it('identifies available providers correctly', () => {
    assert.ok(isProviderAvailable('shopify'));
    assert.ok(isProviderAvailable('klaviyo'));
    assert.ok(isProviderAvailable('google'));
    assert.equal(isProviderAvailable('hubspot'), false);
    assert.equal(isProviderAvailable('meta'), false);
    assert.equal(isProviderAvailable('tiktok'), false);
    assert.equal(isProviderAvailable('invalid'), false);
  });

  it('returns correct config for each provider', () => {
    const shopify = getProviderConfig('shopify');
    assert.equal(shopify.displayName, 'Shopify');
    assert.equal(shopify.usePKCE, false);
    assert.ok(shopify.scopes.includes('read_products'));

    const klaviyo = getProviderConfig('klaviyo');
    assert.equal(klaviyo.displayName, 'Klaviyo');
    assert.equal(klaviyo.usePKCE, true);
    assert.equal(klaviyo.tokenEndpoint, 'https://a.klaviyo.com/oauth/token');

    const google = getProviderConfig('google');
    assert.equal(google.displayName, 'Google');
    assert.equal(google.tokenEndpoint, 'https://oauth2.googleapis.com/token');
  });

  it('returns null for unknown provider', () => {
    assert.equal(getProviderConfig('unknown'), null);
  });

  it('all providers have required fields', () => {
    const required = ['name', 'displayName', 'icon', 'scopes', 'authorizePath', 'callbackPath', 'available'];
    for (const [key, provider] of Object.entries(OAUTH_PROVIDERS)) {
      for (const field of required) {
        assert.ok(field in provider, `${key} missing field: ${field}`);
      }
    }
  });

  it('only Klaviyo uses PKCE', () => {
    const pkceProviders = Object.entries(OAUTH_PROVIDERS).filter(([_, p]) => p.usePKCE);
    assert.equal(pkceProviders.length, 1);
    assert.equal(pkceProviders[0][0], 'klaviyo');
  });
});

describe('Shopify OAuth', () => {
  it('validates correct shop domains', () => {
    assert.ok(isValidShopDomain('my-store.myshopify.com'));
    assert.ok(isValidShopDomain('store123.myshopify.com'));
    assert.ok(isValidShopDomain('a.myshopify.com'));
  });

  it('rejects invalid shop domains', () => {
    assert.equal(isValidShopDomain(''), false);
    assert.equal(isValidShopDomain('not-shopify.com'), false);
    assert.equal(isValidShopDomain('.myshopify.com'), false);
    assert.equal(isValidShopDomain('-invalid.myshopify.com'), false);
    assert.equal(isValidShopDomain('store.myshopify.com/admin'), false);
    assert.equal(isValidShopDomain('javascript://alert(1).myshopify.com'), false);
  });

  it('generates correct auth URL', () => {
    const shop = 'test-store.myshopify.com';
    const state = 'abc123';
    const url = generateShopifyAuthUrl(
      shop, state, 'client_id_123',
      ['read_products', 'read_orders'],
      'http://localhost:3000/callback'
    );
    assert.ok(url.startsWith(`https://${shop}/admin/oauth/authorize?`));
    assert.ok(url.includes('client_id=client_id_123'));
    assert.ok(url.includes('scope=read_products%2Cread_orders'));
    assert.ok(url.includes('state=abc123'));
    assert.ok(url.includes('redirect_uri='));
  });

  it('throws on invalid shop domain in auth URL', () => {
    assert.throws(
      () => generateShopifyAuthUrl('evil.com', 'state', 'id', [], 'http://localhost'),
      /Invalid shop domain/
    );
  });

  it('verifies valid HMAC signature', () => {
    const secret = 'test-secret-key';
    const params = { code: 'auth_code', shop: 'test.myshopify.com', state: 'abc', timestamp: '1234567890' };
    const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
    assert.ok(verifyHmac({ ...params, hmac }, secret));
  });

  it('rejects invalid HMAC signature', () => {
    assert.equal(verifyHmac({ code: 'test', hmac: 'invalid_hmac' }, 'secret'), false);
  });

  it('rejects missing HMAC', () => {
    assert.equal(verifyHmac({ code: 'test' }, 'secret'), false);
  });

  it('verifies valid webhook HMAC', () => {
    const secret = 'webhook-secret';
    const body = '{"topic":"orders/create","shop":"test.myshopify.com"}';
    const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    assert.ok(verifyWebhookHmac(body, hmac, secret));
  });

  it('rejects tampered webhook body', () => {
    const secret = 'webhook-secret';
    const body = '{"topic":"orders/create"}';
    const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    assert.equal(verifyWebhookHmac(body + 'tampered', hmac, secret), false);
  });
});

describe('Klaviyo OAuth (PKCE)', () => {
  it('generates auth URL with PKCE challenge', () => {
    const state = 'test-state';
    const challenge = 'test-challenge';
    const url = generateKlaviyoAuthUrl(
      state, challenge, 'klaviyo_client',
      ['profiles:read', 'lists:read'],
      'http://localhost:3000/callback'
    );
    assert.ok(url.startsWith('https://www.klaviyo.com/oauth/authorize?'));
    assert.ok(url.includes('response_type=code'));
    assert.ok(url.includes('code_challenge=test-challenge'));
    assert.ok(url.includes('code_challenge_method=S256'));
    assert.ok(url.includes('state=test-state'));
  });

  it('PKCE flow: verifier → challenge → URL is consistent', () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    const url = generateKlaviyoAuthUrl(
      'state', challenge, 'client', ['profiles:read'], 'http://localhost'
    );
    assert.ok(url.includes(`code_challenge=${challenge}`));
    // Verify challenge can be independently computed
    const recomputed = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(challenge, recomputed);
  });
});

describe('Google OAuth', () => {
  it('generates auth URL with correct scopes', () => {
    const url = generateGoogleAuthUrl(
      ['openid', 'profile', 'email', 'analytics'],
      'test-state', 'google_client',
      'http://localhost:3000/callback'
    );
    assert.ok(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'));
    assert.ok(url.includes('response_type=code'));
    assert.ok(url.includes('access_type=offline'));
    assert.ok(url.includes('prompt=consent'));
    assert.ok(url.includes(encodeURIComponent('analytics.readonly')));
  });

  it('scope presets contain correct keys', () => {
    assert.ok(GOOGLE_SCOPE_PRESETS.basic.includes('openid'));
    assert.ok(GOOGLE_SCOPE_PRESETS.analytics.includes('analytics'));
    assert.ok(GOOGLE_SCOPE_PRESETS.searchConsole.includes('webmasters'));
    assert.ok(GOOGLE_SCOPE_PRESETS.calendar.includes('calendar'));
    assert.ok(GOOGLE_SCOPE_PRESETS.ads.includes('adsRead'));
    assert.ok(GOOGLE_SCOPE_PRESETS.full.includes('analytics'));
    assert.ok(GOOGLE_SCOPE_PRESETS.full.includes('webmasters'));
  });

  it('all scope keys resolve to valid URLs', () => {
    for (const [key, value] of Object.entries(GOOGLE_SCOPES)) {
      assert.ok(typeof value === 'string', `${key} has valid scope URL`);
      if (key !== 'openid') {
        assert.ok(value.startsWith('https://'), `${key} starts with https://`);
      }
    }
  });

  it('parses granted scopes back to keys', () => {
    const scopeString = 'openid https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email';
    const keys = parseGrantedScopes(scopeString);
    assert.ok(keys.includes('openid'));
    assert.ok(keys.includes('analytics'));
    assert.ok(keys.includes('email'));
    assert.equal(keys.includes('calendar'), false);
  });

  it('all presets include openid', () => {
    for (const [name, preset] of Object.entries(GOOGLE_SCOPE_PRESETS)) {
      assert.ok(preset.includes('openid'), `${name} preset includes openid`);
    }
  });
});

describe('Security', () => {
  it('PKCE verifier has sufficient entropy (32 bytes = 256 bits)', () => {
    const verifier = generateCodeVerifier();
    // 43 base64url chars = 32 bytes = 256 bits (above NIST minimum of 128)
    assert.ok(verifier.length >= 43);
  });

  it('state parameter has sufficient entropy (16 bytes = 128 bits)', () => {
    const state = generateState();
    assert.equal(state.length, 32); // 16 bytes hex = 32 chars = 128 bits
  });

  it('1000 generated states are all unique', () => {
    const states = new Set();
    for (let i = 0; i < 1000; i++) {
      states.add(generateState());
    }
    assert.equal(states.size, 1000);
  });

  it('HMAC verification is timing-safe', () => {
    const secret = 'test-secret';
    const params = { shop: 'test.myshopify.com', timestamp: '12345' };
    const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const validHmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
    // Both valid and invalid should take ~same time (can't test timing, but verify logic)
    assert.ok(verifyHmac({ ...params, hmac: validHmac }, secret));
    assert.equal(verifyHmac({ ...params, hmac: validHmac.replace(/./g, 'a') }, secret), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  console.log('\n[OAuth Integration Tests] Running with Node.js native test runner...\n');
}
