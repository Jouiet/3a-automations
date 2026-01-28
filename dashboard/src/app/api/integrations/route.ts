import { NextRequest, NextResponse } from "next/server";

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "partial";
  message: string;
  credentialKeys: string[];
  hasCredentials: boolean;
  lastChecked: string;
}

// Define integrations and their required credentials
const INTEGRATIONS_CONFIG = [
  {
    id: "shopify",
    name: "Shopify",
    icon: "shopping-bag",
    category: "ecommerce",
    credentialKeys: ["SHOPIFY_STORE", "SHOPIFY_ACCESS_TOKEN"],
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    icon: "mail",
    category: "marketing",
    credentialKeys: ["KLAVIYO_API_KEY"],
  },
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    icon: "bar-chart",
    category: "analytics",
    credentialKeys: ["GA4_PROPERTY_ID", "GOOGLE_APPLICATION_CREDENTIALS"],
  },
  {
    id: "google-search-console",
    name: "Google Search Console",
    icon: "search",
    category: "seo",
    credentialKeys: ["GSC_SITE_URL", "GOOGLE_APPLICATION_CREDENTIALS"],
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    icon: "facebook",
    category: "advertising",
    credentialKeys: ["META_ACCESS_TOKEN", "META_PIXEL_ID"],
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    icon: "video",
    category: "advertising",
    credentialKeys: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    icon: "dollar-sign",
    category: "advertising",
    credentialKeys: [
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_CUSTOMER_ID",
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "credit-card",
    category: "payments",
    credentialKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "message-circle",
    category: "messaging",
    credentialKeys: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    icon: "mic",
    category: "voice",
    credentialKeys: ["ELEVENLABS_API_KEY"],
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "brain",
    category: "ai",
    credentialKeys: ["OPENAI_API_KEY"],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    icon: "cpu",
    category: "ai",
    credentialKeys: ["ANTHROPIC_API_KEY"],
  },
  {
    id: "grok",
    name: "xAI Grok",
    icon: "zap",
    category: "ai",
    credentialKeys: ["XAI_API_KEY"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "sparkles",
    category: "ai",
    credentialKeys: ["GEMINI_API_KEY"],
  },
  {
    id: "apify",
    name: "Apify",
    icon: "globe",
    category: "automation",
    credentialKeys: ["APIFY_TOKEN"],
  },
  {
    id: "telnyx",
    name: "Telnyx",
    icon: "phone",
    category: "voice",
    credentialKeys: ["TELNYX_API_KEY"],
  },
  {
    id: "cj-dropshipping",
    name: "CJ Dropshipping",
    icon: "package",
    category: "suppliers",
    credentialKeys: ["CJ_API_KEY"],
  },
  {
    id: "bigbuy",
    name: "BigBuy",
    icon: "truck",
    category: "suppliers",
    credentialKeys: ["BIGBUY_API_KEY"],
  },
];

function checkCredentials(keys: string[]): { hasAll: boolean; missing: string[]; present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];

  keys.forEach((key) => {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  });

  return {
    hasAll: missing.length === 0,
    missing,
    present,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const integrationId = searchParams.get("id");

    const integrations: Integration[] = INTEGRATIONS_CONFIG.map((config) => {
      const credCheck = checkCredentials(config.credentialKeys);

      let status: Integration["status"] = "disconnected";
      let message = "Not configured";

      if (credCheck.hasAll) {
        status = "connected";
        message = "All credentials present";
      } else if (credCheck.present.length > 0) {
        status = "partial";
        message = `Missing: ${credCheck.missing.join(", ")}`;
      } else {
        status = "disconnected";
        message = "No credentials configured";
      }

      return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        category: config.category,
        status,
        message,
        credentialKeys: config.credentialKeys,
        hasCredentials: credCheck.hasAll,
        lastChecked: new Date().toISOString(),
      };
    });

    // Filter by category
    let filteredIntegrations = integrations;
    if (category) {
      filteredIntegrations = integrations.filter(
        (i) => i.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by specific integration
    if (integrationId) {
      filteredIntegrations = integrations.filter((i) => i.id === integrationId);
    }

    // Calculate statistics
    const stats = {
      total: integrations.length,
      connected: integrations.filter((i) => i.status === "connected").length,
      partial: integrations.filter((i) => i.status === "partial").length,
      disconnected: integrations.filter((i) => i.status === "disconnected").length,
      byCategory: {} as Record<string, { total: number; connected: number }>,
    };

    integrations.forEach((i) => {
      if (!stats.byCategory[i.category]) {
        stats.byCategory[i.category] = { total: 0, connected: 0 };
      }
      stats.byCategory[i.category].total++;
      if (i.status === "connected") {
        stats.byCategory[i.category].connected++;
      }
    });

    // Calculate connection score
    const connectionScore = Math.round(
      ((stats.connected + stats.partial * 0.5) / stats.total) * 100
    );

    return NextResponse.json({
      success: true,
      data: {
        integrations: filteredIntegrations.map((i) => ({
          id: i.id,
          name: i.name,
          icon: i.icon,
          category: i.category,
          status: i.status,
          message: i.status === "connected" ? "Connected" : i.message,
          lastChecked: i.lastChecked,
        })),
        stats: {
          ...stats,
          connectionScore,
        },
      },
    });
  } catch (error) {
    console.error("[API] Integrations fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
