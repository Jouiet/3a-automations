import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
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
 *   - tenant_id: Optional - defaults to authenticated user ID
 *   - scopes: Optional - Comma-separated scope preset or keys
 *   - login_hint: Optional - Email hint for Google
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user from JWT cookie
    const user = await getAuthUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const tenantId = request.nextUrl.searchParams.get("tenant_id") || user.id;
    const userId = user.id;

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
