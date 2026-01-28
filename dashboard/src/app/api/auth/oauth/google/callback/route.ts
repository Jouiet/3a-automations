import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuth, GoogleScopeKey } from "@/lib/oauth/google";
import { verifyState } from "@/lib/oauth/pkce";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

/**
 * GET /api/auth/oauth/google/callback
 *
 * Handles Google OAuth callback
 *
 * Query params from Google:
 *   - code: Authorization code to exchange
 *   - state: State parameter for CSRF verification
 *   - error: Error code if authorization failed
 *   - scope: Granted scopes (may differ from requested)
 *
 * Flow:
 *   1. Verify state matches stored state
 *   2. Exchange code for access/refresh tokens
 *   3. Get user info
 *   4. Store tokens in vault (or fallback)
 *   5. Update client config
 *   6. Redirect to success page
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/client/integrations", request.url);

  try {
    // Check for OAuth error
    const error = request.nextUrl.searchParams.get("error");
    if (error) {
      console.error(`[OAuth] Google error: ${error}`);
      redirectUrl.searchParams.set("error", error);
      redirectUrl.searchParams.set("message", error);
      return NextResponse.redirect(redirectUrl);
    }

    // Get query parameters
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const grantedScope = request.nextUrl.searchParams.get("scope");

    // Validate required params
    if (!code || !state) {
      redirectUrl.searchParams.set("error", "missing_params");
      redirectUrl.searchParams.set("message", "Missing required OAuth parameters");
      return NextResponse.redirect(redirectUrl);
    }

    // Get stored OAuth state from cookie
    const cookieStore = await cookies();
    const storedStateRaw = cookieStore.get("google_oauth_state")?.value;

    if (!storedStateRaw) {
      redirectUrl.searchParams.set("error", "missing_state");
      redirectUrl.searchParams.set("message", "OAuth session expired");
      return NextResponse.redirect(redirectUrl);
    }

    let storedState: {
      state: string;
      nonce: string;
      scopeKeys: GoogleScopeKey[];
      tenantId: string;
      userId: string;
      timestamp: number;
    };

    try {
      storedState = JSON.parse(storedStateRaw);
    } catch {
      redirectUrl.searchParams.set("error", "invalid_state");
      redirectUrl.searchParams.set("message", "Invalid OAuth state");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state matches (timing-safe comparison)
    if (!verifyState(state, storedState.state)) {
      redirectUrl.searchParams.set("error", "state_mismatch");
      redirectUrl.searchParams.set("message", "State verification failed");
      return NextResponse.redirect(redirectUrl);
    }

    // Check timestamp (must be within 10 minutes)
    const ageMs = Date.now() - storedState.timestamp;
    if (ageMs > 600000) {
      redirectUrl.searchParams.set("error", "expired");
      redirectUrl.searchParams.set("message", "OAuth session expired");
      return NextResponse.redirect(redirectUrl);
    }

    // Initialize OAuth
    const oauth = getGoogleOAuth();

    // Exchange code for tokens
    const tokenResponse = await oauth.exchangeToken(code);

    if (!tokenResponse.access_token) {
      redirectUrl.searchParams.set("error", "no_token");
      redirectUrl.searchParams.set("message", "Failed to obtain access token");
      return NextResponse.redirect(redirectUrl);
    }

    // Get user info
    let userInfo;
    try {
      userInfo = await oauth.getUserInfo(tokenResponse.access_token);
    } catch (e) {
      console.warn("[OAuth] Failed to fetch Google user info:", e);
    }

    // Parse granted scopes
    const grantedScopes = grantedScope?.split(" ") || tokenResponse.scope.split(" ");
    const grantedScopeKeys = oauth.parseGrantedScopes(grantedScopes.join(" "));

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();

    // Determine which services are connected based on scopes
    const hasAnalytics = grantedScopeKeys.includes("analytics");
    const hasSearchConsole = grantedScopeKeys.includes("webmasters");
    const hasCalendar = grantedScopeKeys.includes("calendar") || grantedScopeKeys.includes("calendarEvents");
    const hasAds = grantedScopeKeys.includes("adsRead");

    // Store credentials
    const tenantId = storedState.tenantId;
    const credentials: Record<string, string> = {
      GOOGLE_ACCESS_TOKEN: tokenResponse.access_token,
      GOOGLE_TOKEN_EXPIRES_AT: expiresAt,
      GOOGLE_SCOPE: grantedScopes.join(" "),
      GOOGLE_USER_EMAIL: userInfo?.email || "",
      GOOGLE_USER_ID: userInfo?.id || "",
      GOOGLE_CONNECTED_AT: new Date().toISOString(),
    };

    // Only store refresh token if provided (first time auth with consent)
    if (tokenResponse.refresh_token) {
      credentials.GOOGLE_REFRESH_TOKEN = tokenResponse.refresh_token;
    }

    await storeCredentials(tenantId, credentials);

    // Update client config
    await updateClientIntegration(tenantId, "google", {
      enabled: true,
      connected_at: new Date().toISOString(),
      user_email: userInfo?.email,
      user_id: userInfo?.id,
      user_name: userInfo?.name,
      scopes: grantedScopeKeys,
      token_expires_at: expiresAt,
      services: {
        analytics: hasAnalytics,
        searchConsole: hasSearchConsole,
        calendar: hasCalendar,
        ads: hasAds,
      },
    });

    // Clear OAuth state cookie
    cookieStore.delete("google_oauth_state");

    // Log success
    console.log(
      `[OAuth] Google connected: tenant=${tenantId}, user=${userInfo?.email}, scopes=${grantedScopeKeys.join(",")}`
    );

    // Redirect to success
    redirectUrl.searchParams.set("success", "google");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[OAuth] Google callback error:", error);
    redirectUrl.searchParams.set("error", "callback_failed");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.redirect(redirectUrl);
  }
}

/**
 * Store credentials in vault or fallback
 *
 * Note: SecretVault integration is available at runtime when running the dashboard
 * alongside the automation scripts. For standalone dashboard builds, credentials
 * are stored in the client directory as fallback.
 */
async function storeCredentials(
  tenantId: string,
  credentials: Record<string, string>
): Promise<void> {
  // Store in client directory (works in all environments)
  const clientDir = path.join(process.cwd(), "..", "clients", tenantId);

  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  const credentialsPath = path.join(clientDir, "credentials.json");
  let existing: Record<string, string> = {};

  if (fs.existsSync(credentialsPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    } catch {
      // Ignore parse errors
    }
  }

  fs.writeFileSync(
    credentialsPath,
    JSON.stringify({ ...existing, ...credentials }, null, 2),
    { mode: 0o600 }
  );

  console.log(`[OAuth] Credentials stored for tenant ${tenantId}`);
}

/**
 * Update client integration status
 */
async function updateClientIntegration(
  tenantId: string,
  integration: string,
  data: Record<string, unknown>
): Promise<void> {
  const clientDir = path.join(process.cwd(), "..", "clients", tenantId);
  const configPath = path.join(clientDir, "config.json");

  if (!fs.existsSync(configPath)) {
    console.warn(`[OAuth] Client config not found: ${configPath}`);
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!config.integrations) {
      config.integrations = {};
    }

    config.integrations[integration] = {
      ...config.integrations[integration],
      ...data,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`[OAuth] Failed to update client config:`, error);
  }
}
