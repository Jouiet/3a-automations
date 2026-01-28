import { NextRequest, NextResponse } from "next/server";
import { getShopifyOAuth } from "@/lib/oauth/shopify";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/oauth/shopify/callback
 *
 * Handles Shopify OAuth callback
 *
 * Query params from Shopify:
 *   - code: Authorization code to exchange for access token
 *   - shop: The shop's domain
 *   - state: State parameter for CSRF verification
 *   - hmac: HMAC signature for request verification
 *   - timestamp: Request timestamp
 *
 * Flow:
 *   1. Verify HMAC signature
 *   2. Verify state matches stored state
 *   3. Exchange code for access token
 *   4. Store token in vault (or fallback)
 *   5. Redirect to success page
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/client/integrations", request.url);

  try {
    // Get query parameters
    const code = request.nextUrl.searchParams.get("code");
    const shop = request.nextUrl.searchParams.get("shop");
    const state = request.nextUrl.searchParams.get("state");
    const hmac = request.nextUrl.searchParams.get("hmac");

    // Validate required params
    if (!code || !shop || !state) {
      redirectUrl.searchParams.set("error", "missing_params");
      redirectUrl.searchParams.set(
        "message",
        "Missing required OAuth parameters"
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Initialize OAuth
    const oauth = getShopifyOAuth();

    // Verify HMAC if present (Shopify sends this for security)
    if (hmac && process.env.SHOPIFY_APP_CLIENT_SECRET) {
      const queryParams: Record<string, string> = {};
      request.nextUrl.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      if (!oauth.verifyHmac(queryParams)) {
        console.error("[OAuth] HMAC verification failed");
        redirectUrl.searchParams.set("error", "invalid_hmac");
        redirectUrl.searchParams.set("message", "Request verification failed");
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Verify state
    const cookieStore = await cookies();
    const storedStateRaw = cookieStore.get("shopify_oauth_state")?.value;

    if (!storedStateRaw) {
      redirectUrl.searchParams.set("error", "missing_state");
      redirectUrl.searchParams.set("message", "OAuth session expired");
      return NextResponse.redirect(redirectUrl);
    }

    let storedState: {
      state: string;
      nonce: string;
      shop: string;
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

    // Verify state matches
    if (storedState.state !== state) {
      redirectUrl.searchParams.set("error", "state_mismatch");
      redirectUrl.searchParams.set("message", "State verification failed");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify shop matches
    if (storedState.shop !== shop) {
      redirectUrl.searchParams.set("error", "shop_mismatch");
      redirectUrl.searchParams.set("message", "Shop verification failed");
      return NextResponse.redirect(redirectUrl);
    }

    // Check timestamp (must be within 10 minutes)
    const ageMs = Date.now() - storedState.timestamp;
    if (ageMs > 600000) {
      redirectUrl.searchParams.set("error", "expired");
      redirectUrl.searchParams.set("message", "OAuth session expired");
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for access token
    const tokenResponse = await oauth.exchangeToken(shop, code);

    if (!tokenResponse.access_token) {
      redirectUrl.searchParams.set("error", "no_token");
      redirectUrl.searchParams.set("message", "Failed to obtain access token");
      return NextResponse.redirect(redirectUrl);
    }

    // Get shop info for additional context
    let shopInfo;
    try {
      shopInfo = await oauth.getShopInfo(shop, tokenResponse.access_token);
    } catch (e) {
      console.warn("[OAuth] Failed to fetch shop info:", e);
    }

    // Store credentials
    const tenantId = storedState.tenantId;
    await storeCredentials(tenantId, {
      SHOPIFY_STORE: shop,
      SHOPIFY_ACCESS_TOKEN: tokenResponse.access_token,
      SHOPIFY_SCOPE: tokenResponse.scope,
      SHOPIFY_SHOP_ID: shopInfo?.id?.toString() || "",
      SHOPIFY_SHOP_NAME: shopInfo?.name || "",
      SHOPIFY_CONNECTED_AT: new Date().toISOString(),
    });

    // Update client config
    await updateClientIntegration(tenantId, "shopify", {
      enabled: true,
      connected_at: new Date().toISOString(),
      shop_domain: shop,
      shop_name: shopInfo?.name,
      scopes: tokenResponse.scope.split(","),
    });

    // Clear OAuth state cookie
    cookieStore.delete("shopify_oauth_state");

    // Log success
    console.log(
      `[OAuth] Shopify connected: tenant=${tenantId}, shop=${shop}, scopes=${tokenResponse.scope}`
    );

    // Redirect to success
    redirectUrl.searchParams.set("success", "shopify");
    redirectUrl.searchParams.set("shop", shop);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[OAuth] Shopify callback error:", error);
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
      // Ignore
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
