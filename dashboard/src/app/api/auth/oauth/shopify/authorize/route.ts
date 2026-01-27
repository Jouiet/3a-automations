import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import { getShopifyOAuth } from "@/lib/oauth/shopify";
import { cookies } from "next/headers";

/**
 * GET /api/auth/oauth/shopify/authorize
 *
 * Initiates Shopify OAuth flow
 *
 * Query params:
 *   - shop: The shop's myshopify.com domain (e.g., example.myshopify.com)
 *   - tenant_id: Optional tenant ID for multi-tenant association
 *
 * Flow:
 *   1. Validate shop domain
 *   2. Generate state parameter (CSRF protection)
 *   3. Store state in httpOnly cookie
 *   4. Redirect to Shopify OAuth page
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    // Get shop from query params
    const shop = request.nextUrl.searchParams.get("shop");
    const tenantId = request.nextUrl.searchParams.get("tenant_id");

    if (!shop) {
      return NextResponse.json(
        {
          error: "Missing shop parameter",
          hint: "Provide shop domain like: ?shop=example.myshopify.com",
        },
        { status: 400 }
      );
    }

    // Initialize OAuth
    const oauth = getShopifyOAuth();

    // Validate shop domain
    if (!oauth.isValidShopDomain(shop)) {
      return NextResponse.json(
        {
          error: "Invalid shop domain",
          hint: "Shop must be in format: example.myshopify.com",
        },
        { status: 400 }
      );
    }

    // Check if OAuth is configured
    if (!process.env.SHOPIFY_APP_CLIENT_ID) {
      return NextResponse.json(
        {
          error: "Shopify OAuth not configured",
          hint: "Set SHOPIFY_APP_CLIENT_ID and SHOPIFY_APP_CLIENT_SECRET",
        },
        { status: 503 }
      );
    }

    // Generate state with metadata
    const state = oauth.generateState();
    const nonce = oauth.generateNonce();

    // Create state payload with metadata
    const statePayload = {
      state,
      nonce,
      shop,
      tenantId: tenantId || user.id,
      userId: user.id,
      timestamp: Date.now(),
    };

    // Store state in cookie (expires in 10 minutes)
    const cookieStore = await cookies();
    cookieStore.set("shopify_oauth_state", JSON.stringify(statePayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Generate authorization URL
    const authUrl = oauth.generateAuthUrl(shop, state, nonce);

    // Log for audit
    console.log(
      `[OAuth] Shopify authorize initiated: shop=${shop}, user=${user.id}, tenant=${tenantId || user.id}`
    );

    // Redirect to Shopify
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[OAuth] Shopify authorize error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate OAuth",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
