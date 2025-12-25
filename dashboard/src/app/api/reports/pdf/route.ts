import { NextRequest, NextResponse } from "next/server";

// Fetch n8n data for PDF report
async function fetchN8nData() {
  const n8nHost = process.env.N8N_HOST || "https://n8n.srv1168256.hstgr.cloud";
  const n8nApiKey = process.env.N8N_API_KEY;

  if (!n8nApiKey) {
    return { workflows: [], executions: [] };
  }

  try {
    const [workflowsRes, executionsRes] = await Promise.all([
      fetch(`${n8nHost}/api/v1/workflows`, {
        headers: { "X-N8N-API-KEY": n8nApiKey },
      }),
      fetch(`${n8nHost}/api/v1/executions?limit=100`, {
        headers: { "X-N8N-API-KEY": n8nApiKey },
      }),
    ]);

    const workflowsData = await workflowsRes.json();
    const executionsData = await executionsRes.json();

    return {
      workflows: workflowsData.data || [],
      executions: executionsData.data || [],
    };
  } catch (error) {
    console.error("[PDF API] n8n fetch error:", error);
    return { workflows: [], executions: [] };
  }
}

// GET /api/reports/pdf - Generate PDF report data
// Note: Actual PDF generation happens client-side with jspdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id") || "current-month";

    const { workflows, executions } = await fetchN8nData();

    // Calculate metrics
    const typedWorkflows = workflows as {
      id: string;
      name: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    }[];
    const typedExecutions = executions as {
      id: string;
      workflowId: string;
      finished: boolean;
      mode: string;
      startedAt: string;
      stoppedAt: string;
    }[];

    const successfulExecutions = typedExecutions.filter((e) => e.finished);
    const failedExecutions = typedExecutions.filter((e) => !e.finished);

    // Workflow stats
    const workflowStats = typedWorkflows.map((wf) => {
      const wfExecutions = typedExecutions.filter((e) => e.workflowId === wf.id);
      const success = wfExecutions.filter((e) => e.finished).length;
      const errors = wfExecutions.length - success;

      return {
        id: wf.id,
        name: wf.name,
        active: wf.active,
        totalExecutions: wfExecutions.length,
        successCount: success,
        errorCount: errors,
        successRate: wfExecutions.length > 0
          ? Math.round((success / wfExecutions.length) * 100)
          : 0,
      };
    });

    // Sort by most executions
    workflowStats.sort((a, b) => b.totalExecutions - a.totalExecutions);

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
        totalWorkflows: typedWorkflows.length,
        activeWorkflows: typedWorkflows.filter((w) => w.active).length,
        totalExecutions: typedExecutions.length,
        successfulExecutions: successfulExecutions.length,
        failedExecutions: failedExecutions.length,
        successRate: typedExecutions.length > 0
          ? Math.round(
              (successfulExecutions.length / typedExecutions.length) * 100
            )
          : 0,
      },
      workflowStats,
      topPerformers: workflowStats.slice(0, 5),
      needsAttention: workflowStats
        .filter((w) => w.errorCount > 0 || w.successRate < 80)
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
