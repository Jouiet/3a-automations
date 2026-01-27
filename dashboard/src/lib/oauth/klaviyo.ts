/**
 * Klaviyo OAuth 2.0 with PKCE
 *
 * Implements Klaviyo's OAuth flow with PKCE (RFC 7636)
 * Requires app registration at https://developers.klaviyo.com
 *
 * Flow:
 * 1. Generate PKCE code_verifier and code_challenge
 * 2. Redirect user to Klaviyo authorize endpoint
 * 3. Receive callback with authorization code
 * 4. Exchange code + verifier for access token
 * 5. Use refresh_token to get new access tokens
 *
 * @see https://developers.klaviyo.com/en/docs/set_up_oauth
 */

import { generateCodeChallenge, generateState, generateCodeVerifier } from "./pkce";

export interface KlaviyoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
}

export interface KlaviyoAccountInfo {
  data: {
    type: "account";
    id: string;
    attributes: {
      test_account: boolean;
      contact_information: {
        default_sender_name: string;
        default_sender_email: string;
        website_url: string;
      };
      timezone: string;
      currency: string;
      locale: string;
    };
  };
}

export class KlaviyoOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    this.clientId = process.env.KLAVIYO_APP_CLIENT_ID || "";
    this.clientSecret = process.env.KLAVIYO_APP_CLIENT_SECRET || "";
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/klaviyo/callback`;
    this.scopes = [
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
      "catalogs:read",
      "templates:read",
    ];
  }

  /**
   * Generate authorization URL for Klaviyo OAuth
   */
  generateAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `https://www.klaviyo.com/oauth/authorize?${params}`;
  }

  /**
   * Generate complete OAuth flow parameters
   */
  generateOAuthParams(): {
    authUrl: string;
    state: string;
    codeVerifier: string;
    codeChallenge: string;
  } {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    return {
      authUrl: this.generateAuthUrl(state, codeChallenge),
      state,
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(
    code: string,
    codeVerifier: string
  ): Promise<KlaviyoTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch("https://a.klaviyo.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Klaviyo OAuth] Token exchange failed:", errorText);
      throw new Error(`Klaviyo token exchange failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<KlaviyoTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch("https://a.klaviyo.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Klaviyo OAuth] Token refresh failed:", errorText);
      throw new Error(`Klaviyo token refresh failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Revoke access token (on disconnect)
   */
  async revokeToken(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      token: accessToken,
    });

    const response = await fetch("https://a.klaviyo.com/oauth/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.warn("[Klaviyo OAuth] Token revoke failed:", response.status);
    }
  }

  /**
   * Get account information to verify token and get account ID
   */
  async getAccountInfo(accessToken: string): Promise<KlaviyoAccountInfo> {
    const response = await fetch("https://a.klaviyo.com/api/accounts/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        revision: "2024-10-15",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Klaviyo account info: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0] ? { data: data.data[0] } : data;
  }

  /**
   * Validate token is still working
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getAccountInfo(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get scopes being requested
   */
  getScopes(): string[] {
    return this.scopes;
  }
}

// Singleton instance
let klaviyoOAuthInstance: KlaviyoOAuth | null = null;

export function getKlaviyoOAuth(): KlaviyoOAuth {
  if (!klaviyoOAuthInstance) {
    klaviyoOAuthInstance = new KlaviyoOAuth();
  }
  return klaviyoOAuthInstance;
}
