/**
 * Google OAuth 2.0
 *
 * Implements Google's OAuth flow for multiple APIs:
 * - Google Analytics (GA4)
 * - Google Search Console (GSC)
 * - Google Calendar
 * - Google Ads
 *
 * @see https://developers.google.com/identity/protocols/oauth2
 */

import { generateState, generateNonce } from "./pkce";

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  picture?: string;
}

// Google OAuth scopes by service
export const GOOGLE_SCOPES = {
  // Core
  profile: "https://www.googleapis.com/auth/userinfo.profile",
  email: "https://www.googleapis.com/auth/userinfo.email",
  openid: "openid",

  // Google Analytics
  analytics: "https://www.googleapis.com/auth/analytics.readonly",
  analyticsEdit: "https://www.googleapis.com/auth/analytics.edit",

  // Google Search Console
  webmasters: "https://www.googleapis.com/auth/webmasters.readonly",
  webmastersVerify: "https://www.googleapis.com/auth/siteverification",

  // Google Calendar
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
  calendarEvents: "https://www.googleapis.com/auth/calendar.events",

  // Google Ads
  adsRead: "https://www.googleapis.com/auth/adwords",

  // Google Sheets
  sheets: "https://www.googleapis.com/auth/spreadsheets",
  sheetsReadonly: "https://www.googleapis.com/auth/spreadsheets.readonly",

  // Google Drive (for exports)
  driveFile: "https://www.googleapis.com/auth/drive.file",
} as const;

export type GoogleScopeKey = keyof typeof GOOGLE_SCOPES;

// Preset scope combinations
export const GOOGLE_SCOPE_PRESETS = {
  basic: ["openid", "profile", "email"] as GoogleScopeKey[],
  analytics: ["openid", "profile", "email", "analytics"] as GoogleScopeKey[],
  searchConsole: ["openid", "profile", "email", "webmasters"] as GoogleScopeKey[],
  calendar: ["openid", "profile", "email", "calendar", "calendarEvents"] as GoogleScopeKey[],
  ads: ["openid", "profile", "email", "adsRead"] as GoogleScopeKey[],
  full: [
    "openid",
    "profile",
    "email",
    "analytics",
    "webmasters",
    "calendar",
  ] as GoogleScopeKey[],
};

export class GoogleOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oauth/google/callback`;
  }

  /**
   * Generate authorization URL for Google OAuth
   * @param scopeKeys - Array of scope keys to request
   * @param state - State parameter for CSRF protection
   * @param options - Additional options
   */
  generateAuthUrl(
    scopeKeys: GoogleScopeKey[],
    state: string,
    options: {
      accessType?: "online" | "offline";
      prompt?: "none" | "consent" | "select_account";
      loginHint?: string;
      includeGrantedScopes?: boolean;
    } = {}
  ): string {
    const {
      accessType = "offline",
      prompt = "consent",
      loginHint,
      includeGrantedScopes = true,
    } = options;

    // Convert scope keys to actual scope URLs
    const scopes = scopeKeys.map((key) => GOOGLE_SCOPES[key]);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      access_type: accessType,
      prompt,
      include_granted_scopes: includeGrantedScopes.toString(),
    });

    if (loginHint) {
      params.set("login_hint", loginHint);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Generate OAuth flow with preset scopes
   */
  generateOAuthParams(
    preset: keyof typeof GOOGLE_SCOPE_PRESETS = "basic",
    customScopes?: GoogleScopeKey[]
  ): {
    authUrl: string;
    state: string;
    nonce: string;
    scopes: string[];
  } {
    const state = generateState();
    const nonce = generateNonce();
    const scopeKeys = customScopes || GOOGLE_SCOPE_PRESETS[preset];
    const scopes = scopeKeys.map((key) => GOOGLE_SCOPES[key]);

    return {
      authUrl: this.generateAuthUrl(scopeKeys, state),
      state,
      nonce,
      scopes,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(code: string): Promise<GoogleTokenResponse> {
    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Google OAuth] Token exchange failed:", errorText);
      throw new Error(`Google token exchange failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Google OAuth] Token refresh failed:", errorText);
      throw new Error(`Google token refresh failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Revoke access token or refresh token
   */
  async revokeToken(token: string): Promise<void> {
    const params = new URLSearchParams({ token });

    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?${params}`,
      { method: "POST" }
    );

    if (!response.ok) {
      console.warn("[Google OAuth] Token revoke failed:", response.status);
    }
  }

  /**
   * Get user info from access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get Google user info: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Validate token is still working
   */
  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );
    return response.ok;
  }

  /**
   * Get token info (scopes, expiry, etc.)
   */
  async getTokenInfo(
    accessToken: string
  ): Promise<{
    audience: string;
    scope: string;
    expires_in: number;
    email?: string;
  }> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get token info: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get scopes from preset
   */
  getPresetScopes(preset: keyof typeof GOOGLE_SCOPE_PRESETS): string[] {
    return GOOGLE_SCOPE_PRESETS[preset].map((key) => GOOGLE_SCOPES[key]);
  }

  /**
   * Parse granted scopes from token response
   */
  parseGrantedScopes(scopeString: string): GoogleScopeKey[] {
    const grantedUrls = scopeString.split(" ");
    const scopeKeys: GoogleScopeKey[] = [];

    for (const [key, url] of Object.entries(GOOGLE_SCOPES)) {
      if (grantedUrls.includes(url)) {
        scopeKeys.push(key as GoogleScopeKey);
      }
    }

    return scopeKeys;
  }
}

// Singleton instance
let googleOAuthInstance: GoogleOAuth | null = null;

export function getGoogleOAuth(): GoogleOAuth {
  if (!googleOAuthInstance) {
    googleOAuthInstance = new GoogleOAuth();
  }
  return googleOAuthInstance;
}
