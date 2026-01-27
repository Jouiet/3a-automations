import { NextRequest, NextResponse } from "next/server";
import { getKlaviyoOAuth } from "@/lib/oauth/klaviyo";
import { generateCodeVerifier, generateCodeChallenge, generateState, generateNonce } from "@/lib/oauth/pkce";
import { cookies } from "next/headers";

/**
 * GET /api/auth/oauth/klaviyo/authorize
 *
 * Initiates Klaviyo OAuth flow with PKCE
 *
 * Query params:
 *   - tenant_id: Required - The tenant initiating the connection
 *
 * Flow:
 *   1. Validate tenant_id
 *   2. Generate PKCE code_verifier and code_challenge
 *   3. Generate state parameter
 *   4. Store verifier + state in cookie
 *   5. Redirect to Klaviyo authorization URL
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

    // Get current user from session (simplified - in production use proper auth)
    const userId = request.headers.get("x-user-id") || "system";

    // Initialize OAuth
    const oauth = getKlaviyoOAuth();

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    const nonce = generateNonce();

    // Generate auth URL
    const authUrl = oauth.generateAuthUrl(state, codeChallenge);

    // Store OAuth state in cookie (encrypted in production)
    const cookieStore = await cookies();
    const oauthState = {
      state,
      nonce,
      codeVerifier,
      tenantId,
      userId,
      timestamp: Date.now(),
    };

    cookieStore.set("klaviyo_oauth_state", JSON.stringify(oauthState), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Log initiation
    console.log(
      `[OAuth] Klaviyo auth initiated: tenant=${tenantId}, state=${state.substring(0, 8)}...`
    );

    // Redirect to Klaviyo
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[OAuth] Klaviyo authorize error:", error);
    const redirectUrl = new URL("/client/integrations", request.url);
    redirectUrl.searchParams.set("error", "authorize_failed");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
