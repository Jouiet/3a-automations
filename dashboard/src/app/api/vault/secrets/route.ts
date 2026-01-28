import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

interface VaultSecret {
  key: string;
  masked: string;
  category: string;
  lastUpdated: string;
}

// Credential categories for classification
const CREDENTIAL_CATEGORIES: Record<string, { category: string; pattern: RegExp }> = {
  SHOPIFY: { category: "Shopify", pattern: /^SHOPIFY_/ },
  KLAVIYO: { category: "Klaviyo", pattern: /^KLAVIYO_/ },
  OPENAI: { category: "AI", pattern: /^OPENAI_/ },
  ANTHROPIC: { category: "AI", pattern: /^ANTHROPIC_/ },
  XAI: { category: "AI", pattern: /^XAI_/ },
  GEMINI: { category: "AI", pattern: /^GEMINI_/ },
  GOOGLE: { category: "Google", pattern: /^GOOGLE_|^GA4_|^GSC_/ },
  HUBSPOT: { category: "HubSpot", pattern: /^HUBSPOT_/ },
  META: { category: "Meta", pattern: /^META_|^FACEBOOK_/ },
  STRIPE: { category: "Stripe", pattern: /^STRIPE_/ },
  TIKTOK: { category: "TikTok", pattern: /^TIKTOK_/ },
  WHATSAPP: { category: "WhatsApp", pattern: /^WHATSAPP_/ },
  ELEVENLABS: { category: "ElevenLabs", pattern: /^ELEVENLABS_/ },
  TELNYX: { category: "Telnyx", pattern: /^TELNYX_/ },
  APIFY: { category: "Apify", pattern: /^APIFY_/ },
};

/**
 * GET /api/vault/secrets?project=tenant_id
 * List secrets for a project (masked values)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const projectId = request.nextUrl.searchParams.get("project");

    if (!projectId) {
      return NextResponse.json(
        { error: "project parameter required" },
        { status: 400 }
      );
    }

    const secrets: VaultSecret[] = [];

    // Try to load from fallback storage first
    const fallbackDir = path.join(
      process.cwd(),
      "..",
      "data",
      "vault-fallback",
      projectId
    );

    if (fs.existsSync(fallbackDir)) {
      const files = fs.readdirSync(fallbackDir);

      for (const file of files) {
        if (file.endsWith(".secret")) {
          const key = file.replace(".secret", "");
          const filePath = path.join(fallbackDir, file);
          const stat = fs.statSync(filePath);

          try {
            const value = fs.readFileSync(filePath, "utf8");
            secrets.push({
              key,
              masked: maskValue(key, value),
              category: getCategory(key),
              lastUpdated: stat.mtime.toISOString(),
            });
          } catch {
            // Skip unreadable files
          }
        }
      }
    }

    // If no fallback secrets, return expected secrets based on vertical
    if (secrets.length === 0) {
      const expectedSecrets = getExpectedSecrets(projectId);
      return NextResponse.json({
        secrets: expectedSecrets,
        source: "expected",
        message: "No credentials configured yet",
      });
    }

    // Sort by category then key
    secrets.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.key.localeCompare(b.key);
    });

    return NextResponse.json({
      secrets,
      source: "fallback",
      count: secrets.length,
    });
  } catch (error) {
    console.error("[API] Vault secrets error:", error);
    return NextResponse.json(
      { error: "Failed to list secrets" },
      { status: 500 }
    );
  }
}

/**
 * Mask a secret value for display
 */
function maskValue(key: string, value: string): string {
  if (!value) return "(empty)";

  const len = value.length;

  // Show prefix for recognizable tokens
  if (key.includes("API_KEY") || key.includes("TOKEN")) {
    if (len > 8) {
      return value.slice(0, 4) + "****" + value.slice(-4);
    }
    return "****";
  }

  // For URLs/stores, show partial
  if (key.includes("URL") || key.includes("STORE")) {
    if (len > 20) {
      return value.slice(0, 10) + "****" + value.slice(-6);
    }
    return "****";
  }

  // Default masking
  if (len > 4) {
    return "*".repeat(Math.min(len, 12));
  }
  return "****";
}

/**
 * Get category for a credential key
 */
function getCategory(key: string): string {
  for (const def of Object.values(CREDENTIAL_CATEGORIES)) {
    if (def.pattern.test(key)) {
      return def.category;
    }
  }
  return "Other";
}

/**
 * Get expected secrets for a project based on its vertical
 */
function getExpectedSecrets(projectId: string): VaultSecret[] {
  // Load client config to get vertical
  const clientsDir = path.join(process.cwd(), "..", "clients");
  const configPath = path.join(clientsDir, projectId, "config.json");

  let vertical = "agency";
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      vertical = config.vertical || "agency";
    } catch {
      // Ignore
    }
  }

  const baseSecrets: VaultSecret[] = [
    { key: "OPENAI_API_KEY", masked: "(not set)", category: "AI", lastUpdated: "-" },
    { key: "ANTHROPIC_API_KEY", masked: "(not set)", category: "AI", lastUpdated: "-" },
  ];

  if (vertical === "shopify" || projectId === "agency") {
    return [
      ...baseSecrets,
      { key: "SHOPIFY_STORE", masked: "(not set)", category: "Shopify", lastUpdated: "-" },
      { key: "SHOPIFY_ACCESS_TOKEN", masked: "(not set)", category: "Shopify", lastUpdated: "-" },
      { key: "KLAVIYO_API_KEY", masked: "(not set)", category: "Klaviyo", lastUpdated: "-" },
    ];
  }

  if (vertical === "b2b") {
    return [
      ...baseSecrets,
      { key: "HUBSPOT_API_KEY", masked: "(not set)", category: "HubSpot", lastUpdated: "-" },
      { key: "GA4_PROPERTY_ID", masked: "(not set)", category: "Google", lastUpdated: "-" },
    ];
  }

  return baseSecrets;
}
