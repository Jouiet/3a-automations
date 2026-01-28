import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

interface VaultProject {
  id: string;
  name: string;
  secretsCount: number;
  status: "healthy" | "warning" | "error";
  lastAccess: string;
  vertical?: string;
}

/**
 * GET /api/vault/projects
 * List all vault projects (tenants)
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

    const projects: VaultProject[] = [];

    // Add agency internal project
    projects.push({
      id: "agency",
      name: "Agency (Internal)",
      secretsCount: countFallbackSecrets("agency"),
      status: hasInfisicalCredentials() ? "healthy" : "warning",
      lastAccess: new Date().toISOString(),
    });

    // Load clients from clients directory
    const clientsDir = path.join(process.cwd(), "..", "clients");
    if (fs.existsSync(clientsDir)) {
      const entries = fs.readdirSync(clientsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith("_")) {
          const configPath = path.join(clientsDir, entry.name, "config.json");

          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
              const secretsCount = countFallbackSecrets(entry.name);

              projects.push({
                id: entry.name,
                name: config.name || entry.name,
                secretsCount,
                status: secretsCount > 0 ? "healthy" : "warning",
                lastAccess: config.created_at || new Date().toISOString(),
                vertical: config.vertical,
              });
            } catch (error) {
              console.error(`Error reading config for ${entry.name}:`, error);
            }
          }
        }
      }
    }

    // Sort by name
    projects.sort((a, b) => {
      if (a.id === "agency") return -1;
      if (b.id === "agency") return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error("[API] Vault projects error:", error);
    return NextResponse.json(
      { error: "Failed to list vault projects" },
      { status: 500 }
    );
  }
}

/**
 * Count secrets in fallback storage for a tenant
 */
function countFallbackSecrets(tenantId: string): number {
  const fallbackDir = path.join(
    process.cwd(),
    "..",
    "data",
    "vault-fallback",
    tenantId
  );

  if (!fs.existsSync(fallbackDir)) {
    return 0;
  }

  try {
    const files = fs.readdirSync(fallbackDir);
    return files.filter((f) => f.endsWith(".secret")).length;
  } catch {
    return 0;
  }
}

/**
 * Check if Infisical credentials are configured
 */
function hasInfisicalCredentials(): boolean {
  return !!(
    process.env.INFISICAL_CLIENT_ID && process.env.INFISICAL_CLIENT_SECRET
  );
}
