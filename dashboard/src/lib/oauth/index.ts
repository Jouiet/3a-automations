/**
 * OAuth Provider Factory
 *
 * Centralized OAuth provider management for multi-tenant authentication.
 * Supports: Shopify, Klaviyo, Google, HubSpot, Meta, TikTok
 */

export { ShopifyOAuth, shopifyOAuth, getShopifyOAuth } from "./shopify";
export type { ShopifyTokenResponse, ShopifyShopInfo } from "./shopify";

// OAuth Provider Types
export type OAuthProvider =
  | "shopify"
  | "klaviyo"
  | "google"
  | "hubspot"
  | "meta"
  | "tiktok";

export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  scopes: string[];
  authorizePath: string;
  callbackPath: string;
  tokenEndpoint?: string;
  available: boolean;
}

// Provider configurations
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  shopify: {
    name: "shopify",
    displayName: "Shopify",
    icon: "shopping-bag",
    scopes: [
      "read_products",
      "read_orders",
      "read_customers",
      "read_inventory",
    ],
    authorizePath: "/api/auth/oauth/shopify/authorize",
    callbackPath: "/api/auth/oauth/shopify/callback",
    available: true,
  },
  klaviyo: {
    name: "klaviyo",
    displayName: "Klaviyo",
    icon: "mail",
    scopes: [
      "profiles:read",
      "profiles:write",
      "lists:read",
      "lists:write",
      "flows:read",
      "campaigns:read",
      "metrics:read",
    ],
    authorizePath: "/api/auth/oauth/klaviyo/authorize",
    callbackPath: "/api/auth/oauth/klaviyo/callback",
    tokenEndpoint: "https://a.klaviyo.com/oauth/token",
    available: false, // Not yet implemented
  },
  google: {
    name: "google",
    displayName: "Google",
    icon: "chrome",
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
    authorizePath: "/api/auth/oauth/google/authorize",
    callbackPath: "/api/auth/oauth/google/callback",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    available: false, // Not yet implemented
  },
  hubspot: {
    name: "hubspot",
    displayName: "HubSpot",
    icon: "briefcase",
    scopes: ["crm.objects.contacts.read", "crm.objects.deals.read"],
    authorizePath: "/api/auth/oauth/hubspot/authorize",
    callbackPath: "/api/auth/oauth/hubspot/callback",
    tokenEndpoint: "https://api.hubapi.com/oauth/v1/token",
    available: false, // Not yet implemented
  },
  meta: {
    name: "meta",
    displayName: "Meta (Facebook)",
    icon: "facebook",
    scopes: ["ads_read", "pages_read_engagement", "business_management"],
    authorizePath: "/api/auth/oauth/meta/authorize",
    callbackPath: "/api/auth/oauth/meta/callback",
    tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
    available: false, // Not yet implemented
  },
  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    icon: "video",
    scopes: ["advertiser.read", "campaign.read"],
    authorizePath: "/api/auth/oauth/tiktok/authorize",
    callbackPath: "/api/auth/oauth/tiktok/callback",
    tokenEndpoint: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    available: false, // Not yet implemented
  },
};

/**
 * Get provider configuration
 */
export function getProviderConfig(
  provider: OAuthProvider
): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider] || null;
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): OAuthProviderConfig[] {
  return Object.values(OAUTH_PROVIDERS).filter((p) => p.available);
}

/**
 * Check if provider is supported
 */
export function isProviderSupported(provider: string): provider is OAuthProvider {
  return provider in OAUTH_PROVIDERS;
}
