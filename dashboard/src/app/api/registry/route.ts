import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

interface RegistryAutomation {
  id: string;
  name: string;
  description: string;
  category: string;
  script?: string;
  priority?: string;
  vertical?: string;
  status?: string;
}

interface RegistryResponse {
  automations: RegistryAutomation[];
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  withScripts: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const vertical = searchParams.get("vertical");
    const hasScript = searchParams.get("hasScript");

    // Read automations registry
    const registryPath = path.join(
      process.cwd(),
      "..",
      "automations",
      "automations-registry.json"
    );

    if (!fs.existsSync(registryPath)) {
      return NextResponse.json(
        { success: false, error: "Registry not found" },
        { status: 404 }
      );
    }

    const registryContent = fs.readFileSync(registryPath, "utf8");
    const registry = JSON.parse(registryContent);
    let automations: RegistryAutomation[] = registry.automations || [];

    // Apply filters
    if (category) {
      automations = automations.filter(
        (a) => a.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (vertical) {
      automations = automations.filter(
        (a) => a.vertical?.toLowerCase() === vertical.toLowerCase()
      );
    }
    if (hasScript === "true") {
      automations = automations.filter((a) => a.script);
    }

    // Calculate statistics
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let withScripts = 0;

    (registry.automations || []).forEach((a: RegistryAutomation) => {
      // By category
      const cat = a.category || "other";
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      // By priority
      const prio = a.priority || "P2";
      byPriority[prio] = (byPriority[prio] || 0) + 1;

      // With scripts
      if (a.script) withScripts++;
    });

    const response: RegistryResponse = {
      automations,
      total: registry.automations?.length || 0,
      byCategory,
      byPriority,
      withScripts,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[API] Registry fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registry" },
      { status: 500 }
    );
  }
}
