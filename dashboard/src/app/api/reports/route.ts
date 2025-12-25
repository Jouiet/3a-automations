import { NextRequest, NextResponse } from "next/server";

// Fetch n8n workflows and executions for report data
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
    console.error("[Reports API] n8n fetch error:", error);
    return { workflows: [], executions: [] };
  }
}

// GET /api/reports - List all available reports with real data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // monthly, weekly, client

    const { workflows, executions } = await fetchN8nData();

    // Calculate stats from real data
    const successfulExecutions = executions.filter(
      (e: { finished: boolean; stoppedAt: string }) => e.finished && e.stoppedAt
    );
    const failedExecutions = executions.filter(
      (e: { finished: boolean; stoppedAt: string }) => !e.finished || !e.stoppedAt
    );

    // Group executions by workflow
    const workflowStats = workflows.map((wf: { id: string; name: string; active: boolean }) => {
      const wfExecutions = executions.filter(
        (e: { workflowId: string }) => e.workflowId === wf.id
      );
      const success = wfExecutions.filter(
        (e: { finished: boolean }) => e.finished
      ).length;
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

    // Generate reports based on actual data
    const now = new Date();
    const currentMonth = now.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    const reports = [
      {
        id: "current-month",
        name: `Rapport Mensuel - ${currentMonth}`,
        type: "monthly",
        period: currentMonth,
        generatedAt: now.toISOString(),
        status: "ready",
        metrics: {
          workflows: workflows.length,
          activeWorkflows: workflows.filter((w: { active: boolean }) => w.active).length,
          totalExecutions: executions.length,
          successfulExecutions: successfulExecutions.length,
          failedExecutions: failedExecutions.length,
          successRate: executions.length > 0
            ? Math.round((successfulExecutions.length / executions.length) * 100)
            : 0,
        },
        workflowStats,
      },
      {
        id: "last-month",
        name: `Rapport Mensuel - ${lastMonth}`,
        type: "monthly",
        period: lastMonth,
        generatedAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        status: "ready",
        metrics: {
          workflows: workflows.length,
          activeWorkflows: workflows.filter((w: { active: boolean }) => w.active).length,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          successRate: 0,
        },
        workflowStats: [],
      },
      {
        id: "weekly-current",
        name: `Rapport Hebdomadaire - Semaine ${getWeekNumber(now)}`,
        type: "weekly",
        period: getWeekRange(now),
        generatedAt: now.toISOString(),
        status: "ready",
        metrics: {
          workflows: workflows.length,
          activeWorkflows: workflows.filter((w: { active: boolean }) => w.active).length,
          totalExecutions: executions.length,
          successfulExecutions: successfulExecutions.length,
          failedExecutions: failedExecutions.length,
          successRate: executions.length > 0
            ? Math.round((successfulExecutions.length / executions.length) * 100)
            : 0,
        },
        workflowStats,
      },
    ];

    // Filter by type if specified
    const filteredReports = type
      ? reports.filter((r) => r.type === type)
      : reports;

    return NextResponse.json({
      success: true,
      reports: filteredReports,
      summary: {
        totalReports: reports.length,
        totalWorkflows: workflows.length,
        totalExecutions: executions.length,
        overallSuccessRate: executions.length > 0
          ? Math.round((successfulExecutions.length / executions.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("[Reports API] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des rapports" },
      { status: 500 }
    );
  }
}

// Helper functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekRange(date: Date): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
}
