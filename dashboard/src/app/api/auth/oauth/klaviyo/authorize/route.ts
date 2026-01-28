import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import { getKlaviyoOAuth } from "@/lib/oauth/klaviyo";
import { generateCodeVerifier, generateCodeChallenge, generateState, generateNonce } from "@/lib/oauth/pkce";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/oauth/klaviyo/authorize
 *
 * Initiates Klaviyo OAuth flow with PKCE
 *
 * Query params:
 *   - tenant_id: Optional - defaults to authenticated user ID
 *
 * Flow:
 *   1. Authenticate user from JWT cookie
 *   2. Generate PKCE code_verifier and code_challenge
 *   3. Generate state parameter
 *   4. Store verifier + state in cookie
 *   5. Redirect to Klaviyo authorization URL
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

    // tenant_id from query or default to user ID
    const tenantId = request.nextUrl.searchParams.get("tenant_id") || user.id;
    const userId = user.id;

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
