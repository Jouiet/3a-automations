import { NextRequest, NextResponse } from "next/server";
import { getShopifyOAuth } from "@/lib/oauth/shopify";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/shopify
 *
 * Handles Shopify webhooks:
 * - app/uninstalled: App was uninstalled from shop
 * - shop/update: Shop settings changed
 * - customers/redact: GDPR customer data deletion
 * - shop/redact: GDPR shop data deletion
 * - customers/data_request: GDPR data request
 *
 * Security:
 * - Verifies HMAC signature from X-Shopify-Hmac-SHA256 header
 * - Validates webhook topic from X-Shopify-Topic header
 */
export async function POST(request: NextRequest) {
  try {
    // Get headers
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topic = request.headers.get("x-shopify-topic");
    const shopDomain = request.headers.get("x-shopify-shop-domain");
    const apiVersion = request.headers.get("x-shopify-api-version");

    // Log webhook receipt
    console.log(`[Webhook] Shopify: topic=${topic}, shop=${shopDomain}, api=${apiVersion}`);

    // Validate required headers
    if (!hmacHeader || !topic || !shopDomain) {
      console.error("[Webhook] Missing required headers");
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // Read body for HMAC verification
    const bodyText = await request.text();

    // Verify HMAC
    if (process.env.SHOPIFY_APP_CLIENT_SECRET) {
      const oauth = getShopifyOAuth();
      const isValid = oauth.verifyWebhookHmac(bodyText, hmacHeader);

      if (!isValid) {
        console.error("[Webhook] HMAC verification failed");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Parse body
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      console.error("[Webhook] Invalid JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Handle webhook by topic
    switch (topic) {
      case "app/uninstalled":
        await handleAppUninstalled(shopDomain, payload);
        break;

      case "shop/update":
        await handleShopUpdate(shopDomain, payload);
        break;

      case "customers/redact":
        await handleCustomersRedact(shopDomain, payload);
        break;

      case "shop/redact":
        await handleShopRedact(shopDomain, payload);
        break;

      case "customers/data_request":
        await handleCustomersDataRequest(shopDomain, payload);
        break;

      default:
        console.log(`[Webhook] Unhandled topic: ${topic}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, topic });
  } catch (error) {
    console.error("[Webhook] Shopify error:", error);
    // Return 200 to prevent retries for unrecoverable errors
    return NextResponse.json({ error: "Processing failed" }, { status: 200 });
  }
}

/**
 * Handle app uninstall webhook
 */
async function handleAppUninstalled(
  shopDomain: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Webhook] App uninstalled: shop=${shopDomain}`);

  // Find tenant by shop domain
  const tenantId = await findTenantByShop(shopDomain);

  if (!tenantId) {
    console.warn(`[Webhook] No tenant found for shop: ${shopDomain}`);
    return;
  }

  // Update client config to mark as disconnected
  const clientDir = path.join(process.cwd(), "..", "clients", tenantId);
  const configPath = path.join(clientDir, "config.json");

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      if (config.integrations?.shopify) {
        config.integrations.shopify = {
          ...config.integrations.shopify,
          enabled: false,
          disconnected_at: new Date().toISOString(),
          disconnect_reason: "app_uninstalled",
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`[Webhook] Updated tenant ${tenantId} - Shopify disconnected`);
      }
    } catch (error) {
      console.error(`[Webhook] Failed to update config:`, error);
    }
  }

  // Remove stored credentials
  const credentialsPath = path.join(clientDir, "credentials.json");
  if (fs.existsSync(credentialsPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

      // Remove Shopify-related credentials
      delete creds.SHOPIFY_ACCESS_TOKEN;
      delete creds.SHOPIFY_STORE;
      delete creds.SHOPIFY_SCOPE;
      delete creds.SHOPIFY_SHOP_ID;
      delete creds.SHOPIFY_SHOP_NAME;

      fs.writeFileSync(credentialsPath, JSON.stringify(creds, null, 2));
    } catch (error) {
      console.error(`[Webhook] Failed to clean credentials:`, error);
    }
  }

  // Log audit event
  logAuditEvent(tenantId, "shopify_uninstalled", {
    shop: shopDomain,
    payload,
  });
}

/**
 * Handle shop update webhook
 */
async function handleShopUpdate(
  shopDomain: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Webhook] Shop updated: shop=${shopDomain}`);

  const tenantId = await findTenantByShop(shopDomain);
  if (!tenantId) return;

  // Update shop info in config
  const clientDir = path.join(process.cwd(), "..", "clients", tenantId);
  const configPath = path.join(clientDir, "config.json");

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      if (config.integrations?.shopify) {
        config.integrations.shopify.shop_name = payload.name;
        config.integrations.shopify.shop_email = payload.email;
        config.integrations.shopify.last_updated = new Date().toISOString();

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }
    } catch (error) {
      console.error(`[Webhook] Failed to update shop info:`, error);
    }
  }
}

/**
 * Handle GDPR customer redact request
 */
async function handleCustomersRedact(
  shopDomain: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Webhook] GDPR customers/redact: shop=${shopDomain}`);

  // Log for compliance
  logAuditEvent("gdpr", "customers_redact", {
    shop: shopDomain,
    customer: payload.customer,
    orders_to_redact: payload.orders_to_redact,
    timestamp: new Date().toISOString(),
  });

  // In production, implement actual data deletion here
  // For now, just log the request
}

/**
 * Handle GDPR shop redact request
 */
async function handleShopRedact(
  shopDomain: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Webhook] GDPR shop/redact: shop=${shopDomain}`);

  // Log for compliance
  logAuditEvent("gdpr", "shop_redact", {
    shop: shopDomain,
    timestamp: new Date().toISOString(),
  });

  // In production, delete all data associated with this shop
}

/**
 * Handle GDPR customer data request
 */
async function handleCustomersDataRequest(
  shopDomain: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Webhook] GDPR customers/data_request: shop=${shopDomain}`);

  // Log for compliance
  logAuditEvent("gdpr", "customers_data_request", {
    shop: shopDomain,
    customer: payload.customer,
    data_request: payload.data_request,
    timestamp: new Date().toISOString(),
  });

  // In production, compile and send customer data
}

/**
 * Find tenant ID by shop domain
 */
async function findTenantByShop(shopDomain: string): Promise<string | null> {
  const clientsDir = path.join(process.cwd(), "..", "clients");

  if (!fs.existsSync(clientsDir)) {
    return null;
  }

  const dirs = fs.readdirSync(clientsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory() || dir.name.startsWith("_")) continue;

    const configPath = path.join(clientsDir, dir.name, "config.json");
    if (!fs.existsSync(configPath)) continue;

    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.integrations?.shopify?.shop_domain === shopDomain) {
        return dir.name;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Log audit event
 */
function logAuditEvent(
  tenantId: string,
  event: string,
  data: Record<string, unknown>
): void {
  const logsDir = path.join(process.cwd(), "..", "logs", "webhooks");

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    tenant: tenantId,
    event,
    data,
  };

  const logFile = path.join(logsDir, `shopify-${new Date().toISOString().split("T")[0]}.jsonl`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
}
