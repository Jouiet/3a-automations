/**
 * OAuth Provider Factory
 *
 * Centralized OAuth provider management for multi-tenant authentication.
 * Supports: Shopify, Klaviyo, Google, HubSpot, Meta, TikTok
 */

// Import for internal use
import { getShopifyOAuth as _getShopifyOAuth } from "./shopify";
import { getKlaviyoOAuth as _getKlaviyoOAuth } from "./klaviyo";
import { getGoogleOAuth as _getGoogleOAuth } from "./google";

// Export Shopify OAuth
export { ShopifyOAuth, getShopifyOAuth } from "./shopify";
export type { ShopifyTokenResponse, ShopifyShopInfo } from "./shopify";

// Export Klaviyo OAuth
export { KlaviyoOAuth, getKlaviyoOAuth } from "./klaviyo";
export type { KlaviyoTokenResponse, KlaviyoAccountInfo } from "./klaviyo";

// Export Google OAuth
export {
  GoogleOAuth,
  getGoogleOAuth,
  GOOGLE_SCOPES,
  GOOGLE_SCOPE_PRESETS,
} from "./google";
export type {
  GoogleTokenResponse,
  GoogleUserInfo,
  GoogleScopeKey,
} from "./google";

// Export PKCE utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateNonce,
  generatePKCEPair,
  verifyState,
} from "./pkce";

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
  usePKCE?: boolean;
  description?: string;
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
      "write_products",
    ],
    authorizePath: "/api/auth/oauth/shopify/authorize",
    callbackPath: "/api/auth/oauth/shopify/callback",
    available: true,
    usePKCE: false,
    description: "E-commerce store integration",
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
      "segments:read",
      "flows:read",
      "flows:write",
      "campaigns:read",
      "metrics:read",
      "events:read",
      "events:write",
    ],
    authorizePath: "/api/auth/oauth/klaviyo/authorize",
    callbackPath: "/api/auth/oauth/klaviyo/callback",
    tokenEndpoint: "https://a.klaviyo.com/oauth/token",
    available: true,
    usePKCE: true,
    description: "Email & SMS marketing platform",
  },
  google: {
    name: "google",
    displayName: "Google",
    icon: "chrome",
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    authorizePath: "/api/auth/oauth/google/authorize",
    callbackPath: "/api/auth/oauth/google/callback",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    available: true,
    usePKCE: false,
    description: "Analytics, Search Console, Calendar",
  },
  hubspot: {
    name: "hubspot",
    displayName: "HubSpot",
    icon: "briefcase",
    scopes: [
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.deals.read",
      "crm.objects.companies.read",
    ],
    authorizePath: "/api/auth/oauth/hubspot/authorize",
    callbackPath: "/api/auth/oauth/hubspot/callback",
    tokenEndpoint: "https://api.hubapi.com/oauth/v1/token",
    available: false, // P1 - Next phase
    usePKCE: false,
    description: "CRM & marketing automation",
  },
  meta: {
    name: "meta",
    displayName: "Meta (Facebook)",
    icon: "facebook",
    scopes: ["ads_read", "pages_read_engagement", "business_management"],
    authorizePath: "/api/auth/oauth/meta/authorize",
    callbackPath: "/api/auth/oauth/meta/callback",
    tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
    available: false, // P1 - Next phase
    usePKCE: false,
    description: "Facebook & Instagram ads",
  },
  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    icon: "video",
    scopes: ["advertiser.read", "campaign.read"],
    authorizePath: "/api/auth/oauth/tiktok/authorize",
    callbackPath: "/api/auth/oauth/tiktok/callback",
    tokenEndpoint:
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    available: false, // P2 - Future phase
    usePKCE: false,
    description: "TikTok advertising",
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
 * Get all providers (including unavailable)
 */
export function getAllProviders(): OAuthProviderConfig[] {
  return Object.values(OAUTH_PROVIDERS);
}

/**
 * Check if provider is supported
 */
export function isProviderSupported(provider: string): provider is OAuthProvider {
  return provider in OAUTH_PROVIDERS;
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(provider: string): boolean {
  return isProviderSupported(provider) && OAUTH_PROVIDERS[provider].available;
}

/**
 * Get OAuth class instance for provider
 */
export function getOAuthProvider(provider: OAuthProvider) {
  switch (provider) {
    case "shopify":
      return _getShopifyOAuth();
    case "klaviyo":
      return _getKlaviyoOAuth();
    case "google":
      return _getGoogleOAuth();
    default:
      throw new Error(`OAuth provider ${provider} not implemented`);
  }
}
