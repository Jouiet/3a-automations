import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface IntegrationHealth {
  status: "healthy" | "degraded" | "unhealthy" | "disconnected";
  latency?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  tenant_id: string;
  overall_status: "healthy" | "degraded" | "unhealthy";
  integrations: Record<string, IntegrationHealth>;
  features: {
    enabled: number;
    total: number;
  };
  last_activity?: string;
  checked_at: string;
}

async function checkShopifyHealth(
  store: string,
  accessToken: string
): Promise<IntegrationHealth> {
  const startTime = Date.now();
  try {
    const response = await fetch(
      `https://${store}/admin/api/2024-01/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: latency < 2000 ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      status: "unhealthy",
      latency,
      lastCheck: new Date().toISOString(),
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkKlaviyoHealth(apiKey: string): Promise<IntegrationHealth> {
  const startTime = Date.now();
  try {
    const response = await fetch("https://a.klaviyo.com/api/lists", {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: "2024-10-15",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: latency < 2000 ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      status: "unhealthy",
      latency,
      lastCheck: new Date().toISOString(),
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkGoogleHealth(accessToken: string): Promise<IntegrationHealth> {
  const startTime = Date.now();
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v1/tokeninfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: latency < 2000 ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    }

    if (response.status === 401) {
      return {
        status: "unhealthy",
        latency,
        lastCheck: new Date().toISOString(),
        error: "Token expired - needs refresh",
      };
    }

    return {
      status: "unhealthy",
      latency,
      lastCheck: new Date().toISOString(),
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function loadTenantConfig(tenantId: string) {
  const clientsDir = path.join(process.cwd(), "..", "clients");
  const configPath = path.join(clientsDir, tenantId, "config.json");

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  // Fallback to secrets.json
  const secretsPath = path.join(clientsDir, tenantId, "secrets.json");
  if (fs.existsSync(secretsPath)) {
    return JSON.parse(fs.readFileSync(secretsPath, "utf8"));
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    const config = loadTenantConfig(tenantId);
    const integrations: Record<string, IntegrationHealth> = {};

    // Check Shopify
    const shopifyStore =
      config?.integrations?.shopify?.shop_domain ||
      config?.SHOPIFY_STORE ||
      process.env.SHOPIFY_STORE;
    const shopifyToken =
      config?.integrations?.shopify?.access_token ||
      config?.SHOPIFY_ACCESS_TOKEN ||
      process.env.SHOPIFY_ACCESS_TOKEN;

    if (shopifyStore && shopifyToken) {
      integrations.shopify = await checkShopifyHealth(shopifyStore, shopifyToken);
    } else if (config?.integrations?.shopify?.enabled) {
      integrations.shopify = {
        status: "disconnected",
        lastCheck: new Date().toISOString(),
        error: "Missing credentials",
      };
    }

    // Check Klaviyo
    const klaviyoKey =
      config?.integrations?.klaviyo?.api_key ||
      config?.KLAVIYO_API_KEY ||
      process.env.KLAVIYO_API_KEY;

    if (klaviyoKey) {
      integrations.klaviyo = await checkKlaviyoHealth(klaviyoKey);
    } else if (config?.integrations?.klaviyo?.enabled) {
      integrations.klaviyo = {
        status: "disconnected",
        lastCheck: new Date().toISOString(),
        error: "Missing API key",
      };
    }

    // Check Google
    const googleToken =
      config?.integrations?.google?.access_token ||
      config?.GOOGLE_ACCESS_TOKEN ||
      process.env.GOOGLE_ACCESS_TOKEN;

    if (googleToken) {
      integrations.google = await checkGoogleHealth(googleToken);
    } else if (config?.integrations?.google?.enabled) {
      integrations.google = {
        status: "disconnected",
        lastCheck: new Date().toISOString(),
        error: "Missing access token",
      };
    }

    // Calculate overall status
    const statuses = Object.values(integrations).map((i) => i.status);
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (statuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    } else if (statuses.includes("degraded") || statuses.includes("disconnected")) {
      overallStatus = "degraded";
    }

    // Count features
    const features = config?.features || {};
    const enabledFeatures = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;

    const response: HealthResponse = {
      tenant_id: tenantId,
      overall_status: overallStatus,
      integrations,
      features: {
        enabled: enabledFeatures,
        total: totalFeatures || 8,
      },
      last_activity: config?.last_activity,
      checked_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Health check failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}
