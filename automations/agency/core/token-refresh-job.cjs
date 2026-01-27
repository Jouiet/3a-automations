#!/usr/bin/env node
/**
 * Token Refresh Job
 *
 * Automatically refreshes OAuth tokens before they expire
 * Supports: Klaviyo, Google, HubSpot, Meta
 *
 * Run modes:
 *   - Cron: Every hour via node-cron
 *   - Manual: node token-refresh-job.cjs --run
 *   - Dry run: node token-refresh-job.cjs --dry-run
 *   - Health: node token-refresh-job.cjs --health
 *
 * @module token-refresh-job
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Constants
const REFRESH_THRESHOLD_MS = 3600000; // 1 hour before expiry
const PROVIDERS = {
  klaviyo: {
    tokenKey: 'KLAVIYO_ACCESS_TOKEN',
    refreshKey: 'KLAVIYO_REFRESH_TOKEN',
    expiresKey: 'KLAVIYO_TOKEN_EXPIRES_AT',
    refreshEndpoint: 'https://a.klaviyo.com/oauth/token',
    grantType: 'refresh_token',
    clientIdEnv: 'KLAVIYO_APP_CLIENT_ID',
    clientSecretEnv: 'KLAVIYO_APP_CLIENT_SECRET',
  },
  google: {
    tokenKey: 'GOOGLE_ACCESS_TOKEN',
    refreshKey: 'GOOGLE_REFRESH_TOKEN',
    expiresKey: 'GOOGLE_TOKEN_EXPIRES_AT',
    refreshEndpoint: 'https://oauth2.googleapis.com/token',
    grantType: 'refresh_token',
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
  },
  hubspot: {
    tokenKey: 'HUBSPOT_ACCESS_TOKEN',
    refreshKey: 'HUBSPOT_REFRESH_TOKEN',
    expiresKey: 'HUBSPOT_TOKEN_EXPIRES_AT',
    refreshEndpoint: 'https://api.hubapi.com/oauth/v1/token',
    grantType: 'refresh_token',
    clientIdEnv: 'HUBSPOT_APP_CLIENT_ID',
    clientSecretEnv: 'HUBSPOT_APP_CLIENT_SECRET',
  },
  meta: {
    tokenKey: 'META_ACCESS_TOKEN',
    refreshKey: null, // Meta uses long-lived tokens, no refresh
    expiresKey: 'META_TOKEN_EXPIRES_AT',
    refreshEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    grantType: 'fb_exchange_token',
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
};

class TokenRefreshJob {
  constructor() {
    this.clientsDir = path.join(process.cwd(), '..', 'clients');
    this.logsDir = path.join(process.cwd(), '..', 'logs', 'token-refresh');
    this.stats = {
      checked: 0,
      refreshed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  /**
   * Get all tenants with OAuth tokens
   */
  async getTenants() {
    if (!fs.existsSync(this.clientsDir)) {
      return [];
    }

    const dirs = fs.readdirSync(this.clientsDir, { withFileTypes: true });
    const tenants = [];

    for (const dir of dirs) {
      if (!dir.isDirectory() || dir.name.startsWith('_')) continue;

      const configPath = path.join(this.clientsDir, dir.name, 'config.json');
      const credentialsPath = path.join(this.clientsDir, dir.name, 'credentials.json');

      if (!fs.existsSync(configPath)) continue;

      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        let credentials = {};

        if (fs.existsSync(credentialsPath)) {
          credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        }

        tenants.push({
          id: dir.name,
          config,
          credentials,
          configPath,
          credentialsPath,
        });
      } catch (e) {
        console.warn(`[TokenRefresh] Failed to read tenant ${dir.name}:`, e.message);
      }
    }

    return tenants;
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(expiresAt) {
    if (!expiresAt) return false;

    const expiresTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const threshold = now + REFRESH_THRESHOLD_MS;

    return expiresTime < threshold;
  }

  /**
   * Refresh token for a provider
   */
  async refreshToken(provider, credentials, tenantId) {
    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const refreshToken = credentials[providerConfig.refreshKey];
    if (!refreshToken) {
      throw new Error(`No refresh token for ${provider}`);
    }

    const clientId = process.env[providerConfig.clientIdEnv];
    const clientSecret = process.env[providerConfig.clientSecretEnv];

    if (!clientId || !clientSecret) {
      throw new Error(`Missing client credentials for ${provider}`);
    }

    // Build request body based on provider
    let body;
    if (provider === 'meta') {
      // Meta uses token exchange instead of refresh
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: credentials[providerConfig.tokenKey],
      });
      body = params.toString();
    } else {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });
      body = params.toString();
    }

    const response = await fetch(providerConfig.refreshEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Calculate new expiry
    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Some providers return new refresh token
      expiresAt,
      scope: data.scope,
    };
  }

  /**
   * Update credentials file
   */
  updateCredentials(tenant, provider, newTokens) {
    const providerConfig = PROVIDERS[provider];

    tenant.credentials[providerConfig.tokenKey] = newTokens.accessToken;
    if (newTokens.refreshToken && providerConfig.refreshKey) {
      tenant.credentials[providerConfig.refreshKey] = newTokens.refreshToken;
    }
    tenant.credentials[providerConfig.expiresKey] = newTokens.expiresAt;
    tenant.credentials[`${provider.toUpperCase()}_LAST_REFRESH`] = new Date().toISOString();

    fs.writeFileSync(
      tenant.credentialsPath,
      JSON.stringify(tenant.credentials, null, 2),
      { mode: 0o600 }
    );
  }

  /**
   * Update config integration status
   */
  updateConfig(tenant, provider, newTokens) {
    if (tenant.config.integrations && tenant.config.integrations[provider]) {
      tenant.config.integrations[provider].token_expires_at = newTokens.expiresAt;
      tenant.config.integrations[provider].last_refresh = new Date().toISOString();

      fs.writeFileSync(
        tenant.configPath,
        JSON.stringify(tenant.config, null, 2)
      );
    }
  }

  /**
   * Log refresh event
   */
  logEvent(event, data) {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data,
    };

    const logFile = path.join(
      this.logsDir,
      `${new Date().toISOString().split('T')[0]}.jsonl`
    );
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Process all tenants
   */
  async run(options = {}) {
    const { dryRun = false } = options;
    const startTime = Date.now();

    console.log(`[TokenRefresh] Starting ${dryRun ? '(DRY RUN)' : ''}...`);

    const tenants = await this.getTenants();
    console.log(`[TokenRefresh] Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      for (const [provider, config] of Object.entries(PROVIDERS)) {
        this.stats.checked++;

        const expiresAt = tenant.credentials[config.expiresKey];
        const hasRefreshToken = config.refreshKey ? !!tenant.credentials[config.refreshKey] : false;
        const hasAccessToken = !!tenant.credentials[config.tokenKey];

        // Skip if no tokens for this provider
        if (!hasAccessToken) {
          continue;
        }

        // Skip if no refresh capability
        if (!hasRefreshToken && provider !== 'meta') {
          continue;
        }

        // Check if needs refresh
        if (!this.needsRefresh(expiresAt)) {
          this.stats.skipped++;
          continue;
        }

        console.log(
          `[TokenRefresh] ${tenant.id}/${provider}: Token expires at ${expiresAt}, refreshing...`
        );

        if (dryRun) {
          console.log(`[TokenRefresh] (DRY RUN) Would refresh ${tenant.id}/${provider}`);
          continue;
        }

        try {
          const newTokens = await this.refreshToken(provider, tenant.credentials, tenant.id);

          this.updateCredentials(tenant, provider, newTokens);
          this.updateConfig(tenant, provider, newTokens);

          this.stats.refreshed++;
          this.logEvent('token_refreshed', {
            tenant: tenant.id,
            provider,
            newExpiresAt: newTokens.expiresAt,
          });

          console.log(
            `[TokenRefresh] ✅ ${tenant.id}/${provider}: Refreshed, new expiry ${newTokens.expiresAt}`
          );
        } catch (error) {
          this.stats.failed++;
          this.logEvent('refresh_failed', {
            tenant: tenant.id,
            provider,
            error: error.message,
          });

          console.error(
            `[TokenRefresh] ❌ ${tenant.id}/${provider}: ${error.message}`
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[TokenRefresh] Complete in ${duration}ms`);
    console.log(`[TokenRefresh] Stats:`, this.stats);

    return this.stats;
  }

  /**
   * Get tokens expiring soon (for monitoring)
   */
  async getExpiringTokens(thresholdHours = 24) {
    const tenants = await this.getTenants();
    const expiring = [];
    const threshold = Date.now() + thresholdHours * 3600000;

    for (const tenant of tenants) {
      for (const [provider, config] of Object.entries(PROVIDERS)) {
        const expiresAt = tenant.credentials[config.expiresKey];
        if (!expiresAt) continue;

        const expiresTime = new Date(expiresAt).getTime();
        if (expiresTime < threshold) {
          expiring.push({
            tenant: tenant.id,
            provider,
            expiresAt,
            hoursUntilExpiry: Math.round((expiresTime - Date.now()) / 3600000),
          });
        }
      }
    }

    return expiring.sort((a, b) => a.hoursUntilExpiry - b.hoursUntilExpiry);
  }

  /**
   * Health check
   */
  async health() {
    const tenants = await this.getTenants();
    const expiring = await this.getExpiringTokens(24);

    const result = {
      status: expiring.length === 0 ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      tenants: tenants.length,
      tokensExpiringSoon: expiring.length,
      expiring,
    };

    return result;
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const job = new TokenRefreshJob();

  if (args.includes('--health')) {
    const health = await job.health();
    console.log(JSON.stringify(health, null, 2));
    process.exit(health.status === 'healthy' ? 0 : 1);
  }

  if (args.includes('--expiring')) {
    const hours = parseInt(args[args.indexOf('--expiring') + 1]) || 24;
    const expiring = await job.getExpiringTokens(hours);
    console.log(JSON.stringify(expiring, null, 2));
    process.exit(0);
  }

  if (args.includes('--dry-run')) {
    const stats = await job.run({ dryRun: true });
    process.exit(0);
  }

  if (args.includes('--run') || args.includes('--refresh')) {
    const stats = await job.run();
    process.exit(stats.failed > 0 ? 1 : 0);
  }

  // Default: show help
  console.log(`
Token Refresh Job - Automatic OAuth token refresh

Usage:
  node token-refresh-job.cjs --run        Run token refresh
  node token-refresh-job.cjs --dry-run    Show what would be refreshed
  node token-refresh-job.cjs --health     Health check
  node token-refresh-job.cjs --expiring   List expiring tokens

Options:
  --expiring [hours]  Show tokens expiring in N hours (default: 24)

Environment:
  KLAVIYO_APP_CLIENT_ID, KLAVIYO_APP_CLIENT_SECRET
  GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
  HUBSPOT_APP_CLIENT_ID, HUBSPOT_APP_CLIENT_SECRET
  META_APP_ID, META_APP_SECRET
`);
}

module.exports = TokenRefreshJob;

if (require.main === module) {
  main().catch((err) => {
    console.error('[TokenRefresh] Fatal error:', err);
    process.exit(1);
  });
}
