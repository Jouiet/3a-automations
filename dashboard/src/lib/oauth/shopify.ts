/**
 * Shopify OAuth 2.0 Implementation
 *
 * Flow: Token Exchange (recommended by Shopify for embedded apps)
 *
 * Documentation:
 * - https://shopify.dev/docs/apps/auth/oauth/token-exchange
 * - https://shopify.dev/docs/api/admin-rest
 *
 * Required ENV:
 *   SHOPIFY_APP_CLIENT_ID      - From Shopify Partners Dashboard
 *   SHOPIFY_APP_CLIENT_SECRET  - From Shopify Partners Dashboard
 *   SHOPIFY_APP_SCOPES         - Comma-separated scopes
 *   NEXT_PUBLIC_APP_URL        - Your app's public URL
 */

import crypto from "crypto";

export interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
  expires_in?: number;
  associated_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    account_owner: boolean;
  };
  associated_user_scope?: string;
}

export interface ShopifyShopInfo {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  plan_name: string;
  country_code: string;
  currency: string;
  timezone: string;
}

export interface ShopifyOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export class ShopifyOAuth {
  private config: ShopifyOAuthConfig;

  constructor(config?: Partial<ShopifyOAuthConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.SHOPIFY_APP_CLIENT_ID || "",
      clientSecret:
        config?.clientSecret || process.env.SHOPIFY_APP_CLIENT_SECRET || "",
      scopes:
        config?.scopes ||
        (
          process.env.SHOPIFY_APP_SCOPES ||
          "read_products,read_orders,read_customers,read_inventory"
        ).split(","),
      redirectUri:
        config?.redirectUri ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/shopify/callback`,
    };
  }

  /**
   * Validate shop domain format
   */
  isValidShopDomain(shop: string): boolean {
    // Must be xxx.myshopify.com format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    return shopRegex.test(shop);
  }

  /**
   * Generate a cryptographically secure state parameter
   */
  generateState(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Generate a nonce for HMAC verification
   */
  generateNonce(): string {
    return crypto.randomBytes(16).toString("base64url");
  }

  /**
   * Build OAuth authorization URL
   */
  generateAuthUrl(shop: string, state: string, nonce?: string): string {
    if (!this.isValidShopDomain(shop)) {
      throw new Error(`Invalid shop domain: ${shop}`);
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(","),
      redirect_uri: this.config.redirectUri,
      state,
    });

    if (nonce) {
      params.set("nonce", nonce);
    }

    // Add grant_options for per-user access tokens (optional)
    // params.set('grant_options[]', 'per-user');

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(
    shop: string,
    code: string
  ): Promise<ShopifyTokenResponse> {
    if (!this.isValidShopDomain(shop)) {
      throw new Error(`Invalid shop domain: ${shop}`);
    }

    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Verify HMAC signature from Shopify
   */
  verifyHmac(query: Record<string, string>): boolean {
    const { hmac, signature, ...params } = query;

    if (!hmac) {
      return false;
    }

    // Build message from sorted params
    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const generatedHmac = crypto
      .createHmac("sha256", this.config.clientSecret)
      .update(message)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hmac, "hex"),
        Buffer.from(generatedHmac, "hex")
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify webhook HMAC
   */
  verifyWebhookHmac(body: string, hmacHeader: string): boolean {
    const generatedHmac = crypto
      .createHmac("sha256", this.config.clientSecret)
      .update(body, "utf8")
      .digest("base64");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(hmacHeader),
        Buffer.from(generatedHmac)
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetch shop information using access token
   */
  async getShopInfo(shop: string, accessToken: string): Promise<ShopifyShopInfo> {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shop info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.shop;
  }

  /**
   * Verify access token is still valid
   */
  async verifyAccessToken(shop: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${shop}/admin/api/2024-01/shop.json`,
        {
          method: "HEAD",
          headers: {
            "X-Shopify-Access-Token": accessToken,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get scopes that were granted
   */
  async getGrantedScopes(
    shop: string,
    accessToken: string
  ): Promise<string[]> {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_scopes.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scopes: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_scopes.map(
      (scope: { handle: string }) => scope.handle
    );
  }

  /**
   * Check if app has all required scopes
   */
  hasRequiredScopes(grantedScopes: string[]): boolean {
    return this.config.scopes.every((scope) => grantedScopes.includes(scope));
  }
}

// Singleton instance
let shopifyOAuthInstance: ShopifyOAuth | null = null;

export function getShopifyOAuth(): ShopifyOAuth {
  if (!shopifyOAuthInstance) {
    shopifyOAuthInstance = new ShopifyOAuth();
  }
  return shopifyOAuthInstance;
}

// Named export for direct usage
export const shopifyOAuth = new ShopifyOAuth();
