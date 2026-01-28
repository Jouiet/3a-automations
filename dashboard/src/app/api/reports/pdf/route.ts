import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Fetch automation data for PDF report from registry
async function fetchAutomationData() {
  try {
    // Use native automation registry data
    const automations = [
      // Sample native automations from registry
      { id: "1", name: "Email Personalization", active: true, category: "marketing" },
      { id: "2", name: "Churn Prediction", active: true, category: "analytics" },
      { id: "3", name: "Voice API", active: true, category: "communication" },
      { id: "4", name: "Blog Generator", active: true, category: "content" },
      { id: "5", name: "Review Request", active: true, category: "engagement" },
    ];

    // Simulate execution data
    const executions = automations.map(a => ({
      automationId: a.id,
      automationName: a.name,
      finished: true,
      startedAt: new Date().toISOString(),
      stoppedAt: new Date().toISOString(),
    }));

    return {
      automations,
      executions,
    };
  } catch (error) {
    console.error("[PDF API] automation fetch error:", error);
    return { automations: [], executions: [] };
  }
}

// GET /api/reports/pdf - Generate PDF report data
// Note: Actual PDF generation happens client-side with jspdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id") || "current-month";

    const { automations, executions } = await fetchAutomationData();

    // Calculate metrics
    const typedAutomations = automations as {
      id: string;
      name: string;
      active: boolean;
      category: string;
    }[];
    const typedExecutions = executions as {
      automationId: string;
      automationName: string;
      finished: boolean;
      startedAt: string;
      stoppedAt: string;
    }[];

    const successfulExecutions = typedExecutions.filter((e) => e.finished);
    const failedExecutions = typedExecutions.filter((e) => !e.finished);

    // Automation stats
    const automationStats = typedAutomations.map((automation) => {
      const autoExecutions = typedExecutions.filter((e) => e.automationId === automation.id);
      const success = autoExecutions.filter((e) => e.finished).length;
      const errors = autoExecutions.length - success;

      return {
        id: automation.id,
        name: automation.name,
        active: automation.active,
        totalExecutions: autoExecutions.length,
        successCount: success,
        errorCount: errors,
        successRate: autoExecutions.length > 0
          ? Math.round((success / autoExecutions.length) * 100)
          : 0,
      };
    });

    // Sort by most executions
    automationStats.sort((a, b) => b.totalExecutions - a.totalExecutions);

    const now = new Date();
    const reportData = {
      reportId,
      generatedAt: now.toISOString(),
      period: now.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
      company: {
        name: "3A Automation",
        website: "https://3a-automation.com",
        email: "contact@3a-automation.com",
      },
      summary: {
        totalAutomations: typedAutomations.length,
        activeAutomations: typedAutomations.filter((a) => a.active).length,
        totalExecutions: typedExecutions.length,
        successfulExecutions: successfulExecutions.length,
        failedExecutions: failedExecutions.length,
        successRate: typedExecutions.length > 0
          ? Math.round(
              (successfulExecutions.length / typedExecutions.length) * 100
            )
          : 0,
      },
      automationStats,
      topPerformers: automationStats.slice(0, 5),
      needsAttention: automationStats
        .filter((a) => a.errorCount > 0 || a.successRate < 80)
        .slice(0, 5),
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("[PDF API] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du rapport" },
      { status: 500 }
    );
  }
}
