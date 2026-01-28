import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

// Sensor definitions with real script paths
const SENSORS = [
  { id: "shopify", name: "Shopify Store", script: "shopify-sensor.cjs", category: "ecommerce" },
  { id: "klaviyo", name: "Klaviyo Email", script: "klaviyo-sensor.cjs", category: "marketing" },
  { id: "email-health", name: "Email Health", script: "email-health-sensor.cjs", category: "marketing" },
  { id: "cost-tracking", name: "Cost Tracking", script: "cost-tracking-sensor.cjs", category: "operations" },
  { id: "lead-velocity", name: "Lead Velocity", script: "lead-velocity-sensor.cjs", category: "sales" },
  { id: "ga4", name: "Google Analytics 4", script: "ga4-sensor.cjs", category: "analytics" },
  { id: "retention", name: "Customer Retention", script: "retention-sensor.cjs", category: "analytics" },
  { id: "gsc", name: "Google Search Console", script: "gsc-sensor.cjs", category: "seo" },
  { id: "lead-scoring", name: "Lead Scoring", script: "lead-scoring-sensor.cjs", category: "sales" },
  { id: "apify-trends", name: "Apify Trends", script: "apify-trends-sensor.cjs", category: "research" },
  { id: "google-trends", name: "Google Trends", script: "google-trends-sensor.cjs", category: "research" },
  { id: "product-seo", name: "Product SEO", script: "product-seo-sensor.cjs", category: "seo" },
  { id: "content-performance", name: "Content Performance", script: "content-performance-sensor.cjs", category: "content" },
  { id: "voice-quality", name: "Voice Quality", script: "voice-quality-sensor.cjs", category: "voice" },
  { id: "supplier-health", name: "Supplier Health", script: "supplier-health-sensor.cjs", category: "operations" },
  { id: "meta-ads", name: "Meta Ads", script: "meta-ads-sensor.cjs", category: "advertising" },
  { id: "tiktok-ads", name: "TikTok Ads", script: "tiktok-ads-sensor.cjs", category: "advertising" },
  { id: "whatsapp-status", name: "WhatsApp Status", script: "whatsapp-status-sensor.cjs", category: "messaging" },
  { id: "google-ads-planner", name: "Google Ads Planner", script: "google-ads-planner-sensor.cjs", category: "advertising" },
];

interface SensorResult {
  id: string;
  name: string;
  category: string;
  status: "ok" | "warning" | "error" | "blocked";
  message: string;
  lastCheck: string;
  latency?: number;
  details?: Record<string, unknown>;
}

async function checkSensorHealth(sensor: typeof SENSORS[0]): Promise<SensorResult> {
  const scriptPath = path.join(
    process.cwd(),
    "..",
    "automations",
    "agency",
    "core",
    sensor.script
  );

  const startTime = Date.now();

  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    return {
      id: sensor.id,
      name: sensor.name,
      category: sensor.category,
      status: "error",
      message: `Script not found: ${sensor.script}`,
      lastCheck: new Date().toISOString(),
    };
  }

  try {
    const { stdout, stderr } = await execAsync(`node "${scriptPath}" --health`, {
      timeout: 10000, // 10 second timeout
      cwd: path.dirname(scriptPath),
    });

    const latency = Date.now() - startTime;
    const output = stdout + stderr;

    // Parse output to determine status
    let status: SensorResult["status"] = "ok";
    let message = "Operational";

    if (output.includes("❌") || output.includes("ERROR") || output.includes("not set")) {
      if (output.includes("not set") || output.includes("missing")) {
        status = "blocked";
        message = "Missing credentials";
      } else {
        status = "error";
        message = "Health check failed";
      }
    } else if (output.includes("⚠") || output.includes("WARNING")) {
      status = "warning";
      message = "Partial functionality";
    } else if (output.includes("✅") || output.includes("OK") || output.includes("healthy")) {
      status = "ok";
      message = "Fully operational";
    }

    // Extract key details from output
    const details: Record<string, unknown> = {};

    // Try to extract JSON data if present
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        Object.assign(details, parsed);
      } catch {
        // Not valid JSON, ignore
      }
    }

    return {
      id: sensor.id,
      name: sensor.name,
      category: sensor.category,
      status,
      message,
      lastCheck: new Date().toISOString(),
      latency,
      details: Object.keys(details).length > 0 ? details : undefined,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check for timeout
    if (errorMessage.includes("TIMEOUT") || errorMessage.includes("timed out")) {
      return {
        id: sensor.id,
        name: sensor.name,
        category: sensor.category,
        status: "warning",
        message: "Health check timed out",
        lastCheck: new Date().toISOString(),
        latency,
      };
    }

    // Check for missing credentials in error
    if (errorMessage.includes("not set") || errorMessage.includes("missing") || errorMessage.includes("undefined")) {
      return {
        id: sensor.id,
        name: sensor.name,
        category: sensor.category,
        status: "blocked",
        message: "Missing credentials",
        lastCheck: new Date().toISOString(),
        latency,
      };
    }

    return {
      id: sensor.id,
      name: sensor.name,
      category: sensor.category,
      status: "error",
      message: errorMessage.substring(0, 100),
      lastCheck: new Date().toISOString(),
      latency,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sensorId = searchParams.get("id");
    const quick = searchParams.get("quick") === "true"; // Quick mode: don't run health checks

    let sensorsToCheck = SENSORS;

    // Filter by category
    if (category) {
      sensorsToCheck = sensorsToCheck.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by specific sensor
    if (sensorId) {
      sensorsToCheck = sensorsToCheck.filter((s) => s.id === sensorId);
    }

    if (quick) {
      // Quick mode: return sensor list without health checks
      const quickResults = sensorsToCheck.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        status: "unknown" as const,
        message: "Health check not performed",
        lastCheck: new Date().toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: {
          sensors: quickResults,
          total: SENSORS.length,
          checked: 0,
          byCategory: getCategoryStats(),
        },
      });
    }

    // Run health checks in parallel (with concurrency limit)
    const results: SensorResult[] = [];
    const batchSize = 5; // Check 5 sensors at a time to avoid overload

    for (let i = 0; i < sensorsToCheck.length; i += batchSize) {
      const batch = sensorsToCheck.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(checkSensorHealth));
      results.push(...batchResults);
    }

    // Calculate statistics
    const stats = {
      ok: results.filter((r) => r.status === "ok").length,
      warning: results.filter((r) => r.status === "warning").length,
      error: results.filter((r) => r.status === "error").length,
      blocked: results.filter((r) => r.status === "blocked").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        sensors: results,
        total: SENSORS.length,
        checked: results.length,
        stats,
        byCategory: getCategoryStats(),
      },
    });
  } catch (error) {
    console.error("[API] Sensors fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sensors" },
      { status: 500 }
    );
  }
}

function getCategoryStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  SENSORS.forEach((s) => {
    stats[s.category] = (stats[s.category] || 0) + 1;
  });
  return stats;
}
