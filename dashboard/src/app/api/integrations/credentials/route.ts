import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

// Credential keys required per integration
const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  shopify: [
    { key: "SHOPIFY_STORE", label: "Store Domain", placeholder: "ma-boutique.myshopify.com" },
    { key: "SHOPIFY_ACCESS_TOKEN", label: "Access Token", placeholder: "shpat_..." },
  ],
  klaviyo: [
    { key: "KLAVIYO_API_KEY", label: "API Key", placeholder: "pk_..." },
  ],
  "google-analytics": [
    { key: "GA4_PROPERTY_ID", label: "Property ID", placeholder: "123456789" },
  ],
  "google-search-console": [
    { key: "GSC_SITE_URL", label: "Site URL", placeholder: "https://example.com" },
  ],
  "meta-ads": [
    { key: "META_ACCESS_TOKEN", label: "Access Token", placeholder: "EAA..." },
    { key: "META_PIXEL_ID", label: "Pixel ID", placeholder: "123456789" },
  ],
  "tiktok-ads": [
    { key: "TIKTOK_ACCESS_TOKEN", label: "Access Token", placeholder: "..." },
    { key: "TIKTOK_ADVERTISER_ID", label: "Advertiser ID", placeholder: "..." },
  ],
  "google-ads": [
    { key: "GOOGLE_ADS_CLIENT_ID", label: "Client ID", placeholder: "..." },
    { key: "GOOGLE_ADS_CLIENT_SECRET", label: "Client Secret", placeholder: "..." },
    { key: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Developer Token", placeholder: "..." },
    { key: "GOOGLE_ADS_CUSTOMER_ID", label: "Customer ID", placeholder: "123-456-7890" },
  ],
  stripe: [
    { key: "STRIPE_SECRET_KEY", label: "Secret Key", placeholder: "sk_live_... ou rk_live_..." },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Webhook Secret", placeholder: "whsec_..." },
  ],
  whatsapp: [
    { key: "WHATSAPP_ACCESS_TOKEN", label: "Access Token", placeholder: "EAA..." },
    { key: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone Number ID", placeholder: "..." },
  ],
  openai: [
    { key: "OPENAI_API_KEY", label: "API Key", placeholder: "sk-..." },
  ],
  anthropic: [
    { key: "ANTHROPIC_API_KEY", label: "API Key", placeholder: "sk-ant-..." },
  ],
  grok: [
    { key: "XAI_API_KEY", label: "API Key", placeholder: "xai-..." },
  ],
  gemini: [
    { key: "GEMINI_API_KEY", label: "API Key", placeholder: "AI..." },
  ],
  apify: [
    { key: "APIFY_TOKEN", label: "API Token", placeholder: "apify_api_..." },
  ],
  "cj-dropshipping": [
    { key: "CJ_API_KEY", label: "API Key", placeholder: "..." },
  ],
  bigbuy: [
    { key: "BIGBUY_API_KEY", label: "API Key", placeholder: "..." },
  ],
};

/**
 * GET /api/integrations/credentials?id=openai
 * Returns the credential fields needed for an integration (no values)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integrationId = request.nextUrl.searchParams.get("id");
    if (!integrationId) {
      return NextResponse.json({ error: "Missing integration id" }, { status: 400 });
    }

    const fields = CREDENTIAL_FIELDS[integrationId];
    if (!fields) {
      return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
    }

    // Check which keys are already set
    const fieldStatus = fields.map(f => ({
      ...f,
      isSet: !!process.env[f.key],
    }));

    return NextResponse.json({ success: true, data: { integrationId, fields: fieldStatus } });
  } catch (error) {
    console.error("[API] Credential fields error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/integrations/credentials
 * Saves credentials to ecosystem.config.js (VPS) or env file
 * Body: { integrationId: string, credentials: Record<string, string> }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can set credentials
    if (user.role !== "ADMIN" && user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { integrationId, credentials } = body;

    if (!integrationId || !credentials || typeof credentials !== "object") {
      return NextResponse.json({ error: "Missing integrationId or credentials" }, { status: 400 });
    }

    const fields = CREDENTIAL_FIELDS[integrationId];
    if (!fields) {
      return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
    }

    // Validate that only allowed keys are being set
    const allowedKeys = new Set(fields.map(f => f.key));
    const invalidKeys = Object.keys(credentials).filter(k => !allowedKeys.has(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: `Invalid keys: ${invalidKeys.join(", ")}` }, { status: 400 });
    }

    // Filter out empty values
    const validCredentials: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === "string" && value.trim()) {
        validCredentials[key] = value.trim();
      }
    }

    if (Object.keys(validCredentials).length === 0) {
      return NextResponse.json({ error: "No valid credentials provided" }, { status: 400 });
    }

    // Save to a secure credentials file (JSON, gitignored)
    const credDir = path.join(process.cwd(), "data", "credentials");
    if (!fs.existsSync(credDir)) {
      fs.mkdirSync(credDir, { recursive: true });
    }

    const credFile = path.join(credDir, "client-credentials.json");
    let existing: Record<string, Record<string, string>> = {};
    if (fs.existsSync(credFile)) {
      existing = JSON.parse(fs.readFileSync(credFile, "utf-8"));
    }

    existing[integrationId] = {
      ...existing[integrationId],
      ...validCredentials,
      _updatedAt: new Date().toISOString(),
      _updatedBy: user.id,
    };

    fs.writeFileSync(credFile, JSON.stringify(existing, null, 2));

    // Also set in process.env for immediate use
    for (const [key, value] of Object.entries(validCredentials)) {
      process.env[key] = value;
    }

    console.log(`[Credentials] ${integrationId} updated by ${user.id}: ${Object.keys(validCredentials).join(", ")}`);

    return NextResponse.json({
      success: true,
      message: `${Object.keys(validCredentials).length} credential(s) saved for ${integrationId}`,
    });
  } catch (error) {
    console.error("[API] Credential save error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
