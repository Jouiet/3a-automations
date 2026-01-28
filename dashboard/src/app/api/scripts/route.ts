import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

interface ScriptInfo {
  name: string;
  path: string;
  category: string;
  hasHealth: boolean;
  isResilient: boolean;
  size: number;
  lastModified: string;
}

interface ScriptHealth {
  name: string;
  status: "ok" | "warning" | "error" | "unknown";
  message: string;
  latency?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const checkHealth = searchParams.get("health") === "true";
    const scriptName = searchParams.get("name");

    const corePath = path.join(
      process.cwd(),
      "..",
      "automations",
      "agency",
      "core"
    );

    if (!fs.existsSync(corePath)) {
      return NextResponse.json(
        { success: false, error: "Core scripts directory not found" },
        { status: 404 }
      );
    }

    // List all .cjs scripts
    const files = fs.readdirSync(corePath).filter((f) => f.endsWith(".cjs"));

    // Categorize scripts
    const scripts: ScriptInfo[] = files.map((file) => {
      const filePath = path.join(corePath, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf8").substring(0, 2000); // Read first 2KB

      // Determine category
      let cat = "other";
      if (file.includes("sensor")) cat = "sensors";
      else if (file.includes("resilient")) cat = "resilient";
      else if (file.includes("automation") || file.includes("flow")) cat = "automations";
      else if (file.includes("agent") || file.includes("billing") || file.includes("context")) cat = "agent-ops";
      else if (file.includes("voice") || file.includes("telephony")) cat = "voice";
      else if (file.includes("gateway") || file.includes("api")) cat = "integrations";
      else if (file.includes("email") || file.includes("sms") || file.includes("whatsapp")) cat = "messaging";
      else if (file.includes("shopify") || file.includes("klaviyo") || file.includes("stripe")) cat = "platforms";

      return {
        name: file.replace(".cjs", ""),
        path: filePath,
        category: cat,
        hasHealth: content.includes("--health") || content.includes("healthCheck"),
        isResilient: file.includes("resilient") || content.includes("providers") && content.includes("fallback"),
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    });

    // Filter by category
    let filteredScripts = scripts;
    if (category) {
      filteredScripts = scripts.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by name
    if (scriptName) {
      filteredScripts = filteredScripts.filter(
        (s) => s.name.toLowerCase().includes(scriptName.toLowerCase())
      );
    }

    // Check health if requested (limited to 10 scripts to avoid timeout)
    let healthResults: ScriptHealth[] = [];
    if (checkHealth) {
      const scriptsWithHealth = filteredScripts
        .filter((s) => s.hasHealth)
        .slice(0, 10);

      healthResults = await Promise.all(
        scriptsWithHealth.map(async (script) => {
          const startTime = Date.now();
          try {
            const { stdout, stderr } = await execAsync(
              `node "${script.path}" --health 2>&1`,
              { timeout: 8000, cwd: path.dirname(script.path) }
            );
            const output = stdout + stderr;
            const latency = Date.now() - startTime;

            let status: ScriptHealth["status"] = "unknown";
            let message = "No status detected";

            if (output.includes("❌") || output.includes("ERROR")) {
              status = "error";
              message = "Health check failed";
            } else if (output.includes("⚠") || output.includes("WARNING")) {
              status = "warning";
              message = "Partial functionality";
            } else if (output.includes("✅") || output.includes("OK") || output.includes("healthy")) {
              status = "ok";
              message = "Operational";
            }

            return { name: script.name, status, message, latency };
          } catch (error) {
            return {
              name: script.name,
              status: "error" as const,
              message: error instanceof Error ? error.message.substring(0, 50) : "Check failed",
              latency: Date.now() - startTime,
            };
          }
        })
      );
    }

    // Calculate statistics
    const stats = {
      total: scripts.length,
      byCategory: {} as Record<string, number>,
      withHealth: scripts.filter((s) => s.hasHealth).length,
      resilient: scripts.filter((s) => s.isResilient).length,
    };

    scripts.forEach((s) => {
      stats.byCategory[s.category] = (stats.byCategory[s.category] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        scripts: filteredScripts.map((s) => ({
          name: s.name,
          category: s.category,
          hasHealth: s.hasHealth,
          isResilient: s.isResilient,
          sizeKB: Math.round(s.size / 1024),
          lastModified: s.lastModified,
        })),
        health: healthResults.length > 0 ? healthResults : undefined,
        stats,
      },
    });
  } catch (error) {
    console.error("[API] Scripts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
