import { NextRequest, NextResponse } from "next/server";

// Fetch n8n data for exports
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
      fetch(`${n8nHost}/api/v1/executions?limit=500`, {
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
    console.error("[Export API] n8n fetch error:", error);
    return { workflows: [], executions: [] };
  }
}

// GET /api/reports/export - Export data as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "executions"; // workflows, executions, summary

    const { workflows, executions } = await fetchN8nData();

    let csvContent = "";
    let filename = "";

    if (type === "workflows") {
      // Export workflows
      csvContent = generateWorkflowsCSV(workflows);
      filename = `workflows-export-${formatDate(new Date())}.csv`;
    } else if (type === "executions") {
      // Export executions
      csvContent = generateExecutionsCSV(executions, workflows);
      filename = `executions-export-${formatDate(new Date())}.csv`;
    } else if (type === "summary") {
      // Export summary report
      csvContent = generateSummaryCSV(workflows, executions);
      filename = `summary-report-${formatDate(new Date())}.csv`;
    } else {
      return NextResponse.json(
        { error: "Type invalide. Utilisez: workflows, executions, ou summary" },
        { status: 400 }
      );
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[Export API] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

// Generate CSV for workflows
function generateWorkflowsCSV(workflows: unknown[]): string {
  const headers = [
    "ID",
    "Nom",
    "Actif",
    "Date de creation",
    "Derniere modification",
  ];

  const rows = workflows.map((wf: unknown) => {
    const workflow = wf as {
      id: string;
      name: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    };
    return [
      workflow.id,
      `"${workflow.name.replace(/"/g, '""')}"`,
      workflow.active ? "Oui" : "Non",
      formatDateTime(workflow.createdAt),
      formatDateTime(workflow.updatedAt),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Generate CSV for executions
function generateExecutionsCSV(executions: unknown[], workflows: unknown[]): string {
  const workflowMap = new Map(
    (workflows as { id: string; name: string }[]).map((w) => [w.id, w.name])
  );

  const headers = [
    "ID",
    "Workflow ID",
    "Workflow Nom",
    "Status",
    "Mode",
    "Debut",
    "Fin",
    "Duree (s)",
  ];

  const rows = executions.map((ex: unknown) => {
    const execution = ex as {
      id: string;
      workflowId: string;
      finished: boolean;
      mode: string;
      startedAt: string;
      stoppedAt: string;
    };
    const duration = calculateDuration(execution.startedAt, execution.stoppedAt);
    return [
      execution.id,
      execution.workflowId,
      `"${(workflowMap.get(execution.workflowId) || "Inconnu").replace(/"/g, '""')}"`,
      execution.finished ? "Succes" : "Echec",
      execution.mode || "manual",
      formatDateTime(execution.startedAt),
      formatDateTime(execution.stoppedAt),
      duration,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Generate CSV for summary report
function generateSummaryCSV(workflows: unknown[], executions: unknown[]): string {
  const typedWorkflows = workflows as { id: string; name: string; active: boolean }[];
  const typedExecutions = executions as {
    workflowId: string;
    finished: boolean;
  }[];

  const headers = [
    "Workflow Nom",
    "Actif",
    "Total Executions",
    "Succes",
    "Echecs",
    "Taux de Succes (%)",
  ];

  const rows = typedWorkflows.map((wf) => {
    const wfExecutions = typedExecutions.filter((e) => e.workflowId === wf.id);
    const success = wfExecutions.filter((e) => e.finished).length;
    const errors = wfExecutions.length - success;
    const rate = wfExecutions.length > 0
      ? Math.round((success / wfExecutions.length) * 100)
      : 0;

    return [
      `"${wf.name.replace(/"/g, '""')}"`,
      wf.active ? "Oui" : "Non",
      wfExecutions.length,
      success,
      errors,
      rate,
    ].join(",");
  });

  // Add total row
  const totalExecutions = typedExecutions.length;
  const totalSuccess = typedExecutions.filter((e) => e.finished).length;
  const totalErrors = totalExecutions - totalSuccess;
  const totalRate = totalExecutions > 0
    ? Math.round((totalSuccess / totalExecutions) * 100)
    : 0;

  rows.push([
    '"TOTAL"',
    "-",
    totalExecutions,
    totalSuccess,
    totalErrors,
    totalRate,
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.round((endTime - startTime) / 1000);
}
