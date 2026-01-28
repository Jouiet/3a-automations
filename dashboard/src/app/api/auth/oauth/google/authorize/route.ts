import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuth, GOOGLE_SCOPE_PRESETS, GoogleScopeKey } from "@/lib/oauth/google";
import { generateState, generateNonce } from "@/lib/oauth/pkce";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/oauth/google/authorize
 *
 * Initiates Google OAuth flow
 *
 * Query params:
 *   - tenant_id: Required - The tenant initiating the connection
 *   - scopes: Optional - Comma-separated scope preset or keys
 *     - Presets: "analytics", "searchConsole", "calendar", "ads", "full"
 *     - Custom: "analytics,webmasters,calendar"
 *   - login_hint: Optional - Email hint for Google
 *
 * Flow:
 *   1. Validate tenant_id
 *   2. Parse requested scopes
 *   3. Generate state parameter
 *   4. Store state in cookie
 *   5. Redirect to Google authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from query
    const tenantId = request.nextUrl.searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 }
      );
    }

    // Get current user from session
    const userId = request.headers.get("x-user-id") || "system";

    // Parse scopes parameter
    const scopesParam = request.nextUrl.searchParams.get("scopes") || "analytics";
    let scopeKeys: GoogleScopeKey[];

    // Check if it's a preset
    if (scopesParam in GOOGLE_SCOPE_PRESETS) {
      scopeKeys = GOOGLE_SCOPE_PRESETS[scopesParam as keyof typeof GOOGLE_SCOPE_PRESETS];
    } else {
      // Parse as comma-separated keys
      scopeKeys = scopesParam.split(",").filter(Boolean) as GoogleScopeKey[];
      // Always include basic scopes
      if (!scopeKeys.includes("openid")) scopeKeys.unshift("openid");
      if (!scopeKeys.includes("email")) scopeKeys.unshift("email");
      if (!scopeKeys.includes("profile")) scopeKeys.unshift("profile");
    }

    // Get login hint if provided
    const loginHint = request.nextUrl.searchParams.get("login_hint") || undefined;

    // Initialize OAuth
    const oauth = getGoogleOAuth();

    // Generate state and nonce
    const state = generateState();
    const nonce = generateNonce();

    // Generate auth URL
    const authUrl = oauth.generateAuthUrl(scopeKeys, state, {
      accessType: "offline", // Get refresh token
      prompt: "consent", // Force consent to get refresh token
      loginHint,
    });

    // Store OAuth state in cookie
    const cookieStore = await cookies();
    const oauthState = {
      state,
      nonce,
      scopeKeys,
      tenantId,
      userId,
      timestamp: Date.now(),
    };

    cookieStore.set("google_oauth_state", JSON.stringify(oauthState), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Log initiation
    console.log(
      `[OAuth] Google auth initiated: tenant=${tenantId}, scopes=${scopeKeys.join(",")}, state=${state.substring(0, 8)}...`
    );

    // Redirect to Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[OAuth] Google authorize error:", error);
    const redirectUrl = new URL("/client/integrations", request.url);
    redirectUrl.searchParams.set("error", "authorize_failed");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
