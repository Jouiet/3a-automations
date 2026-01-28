import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/health
 * Check vault status - returns info about Infisical availability and configuration
 */
export async function GET() {
  try {
    const user = await getAuthUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Check Infisical configuration
    const infisicalUrl = process.env.INFISICAL_URL || "http://localhost:8080";
    const hasClientId = !!process.env.INFISICAL_CLIENT_ID;
    const hasClientSecret = !!process.env.INFISICAL_CLIENT_SECRET;
    const hasOrgId = !!process.env.INFISICAL_ORG_ID;

    // Check fallback directory
    const fallbackDir = path.join(process.cwd(), "..", "data", "vault-fallback");
    const fallbackAvailable = fs.existsSync(fallbackDir);

    // Try to ping Infisical (with timeout)
    let infisicalReachable = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${infisicalUrl}/api/status`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      infisicalReachable = response.ok;
    } catch {
      // Infisical not reachable
      infisicalReachable = false;
    }

    // Count cached entries (simplified - would need vault instance in real impl)
    let cacheSize = 0;
    if (fallbackAvailable) {
      try {
        const tenants = fs.readdirSync(fallbackDir, { withFileTypes: true });
        for (const tenant of tenants) {
          if (tenant.isDirectory()) {
            const files = fs.readdirSync(path.join(fallbackDir, tenant.name));
            cacheSize += files.filter((f) => f.endsWith(".secret")).length;
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Count projects from clients directory
    const clientsDir = path.join(process.cwd(), "..", "clients");
    let projectCount = 1; // agency internal
    if (fs.existsSync(clientsDir)) {
      try {
        const dirs = fs.readdirSync(clientsDir, { withFileTypes: true });
        projectCount += dirs.filter(
          (d) => d.isDirectory() && !d.name.startsWith("_")
        ).length;
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      infisical: infisicalReachable,
      authenticated: hasClientId && hasClientSecret && infisicalReachable,
      projectCount,
      cacheSize,
      fallbackAvailable,
      config: {
        url: infisicalUrl,
        hasClientId,
        hasClientSecret,
        hasOrgId,
      },
    });
  } catch (error) {
    console.error("[API] Vault health error:", error);
    return NextResponse.json(
      { error: "Failed to check vault health" },
      { status: 500 }
    );
  }
}
