import { NextRequest, NextResponse } from "next/server";

// Fetch native automation data for exports
async function fetchAutomationData() {
  try {
    // Native automations data from registry
    const automations = [
      { id: "1", name: "Email Personalization", active: true, category: "marketing", createdAt: "2024-01-01", updatedAt: "2025-01-05" },
      { id: "2", name: "Churn Prediction", active: true, category: "analytics", createdAt: "2024-02-15", updatedAt: "2025-01-05" },
      { id: "3", name: "Voice API", active: true, category: "communication", createdAt: "2024-03-01", updatedAt: "2025-01-05" },
      { id: "4", name: "Blog Generator", active: true, category: "content", createdAt: "2024-04-10", updatedAt: "2025-01-05" },
      { id: "5", name: "Review Request", active: true, category: "engagement", createdAt: "2024-05-20", updatedAt: "2025-01-05" },
      { id: "6", name: "At-Risk Customer Flow", active: true, category: "retention", createdAt: "2024-06-01", updatedAt: "2025-01-05" },
    ];

    // Simulated execution history
    const executions = automations.flatMap(a => [
      { automationId: a.id, finished: true, mode: "scheduled", startedAt: "2025-01-05T10:00:00Z", stoppedAt: "2025-01-05T10:01:00Z" },
      { automationId: a.id, finished: true, mode: "scheduled", startedAt: "2025-01-04T10:00:00Z", stoppedAt: "2025-01-04T10:01:00Z" },
      { automationId: a.id, finished: true, mode: "manual", startedAt: "2025-01-03T10:00:00Z", stoppedAt: "2025-01-03T10:01:00Z" },
    ]);

    return { automations, executions };
  } catch (error) {
    console.error("[Export API] automation fetch error:", error);
    return { automations: [], executions: [] };
  }
}

// GET /api/reports/export - Export data as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "executions"; // automations, executions, summary

    const { automations, executions } = await fetchAutomationData();

    let csvContent = "";
    let filename = "";

    if (type === "automations") {
      // Export automations
      csvContent = generateAutomationsCSV(automations);
      filename = `automations-export-${formatDate(new Date())}.csv`;
    } else if (type === "executions") {
      // Export executions
      csvContent = generateExecutionsCSV(executions, automations);
      filename = `executions-export-${formatDate(new Date())}.csv`;
    } else if (type === "summary") {
      // Export summary report
      csvContent = generateSummaryCSV(automations, executions);
      filename = `summary-report-${formatDate(new Date())}.csv`;
    } else {
      return NextResponse.json(
        { error: "Type invalide. Utilisez: automations, executions, ou summary" },
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

// Generate CSV for automations
function generateAutomationsCSV(automations: unknown[]): string {
  const headers = [
    "ID",
    "Nom",
    "Categorie",
    "Actif",
    "Date de creation",
    "Derniere modification",
  ];

  const rows = automations.map((a: unknown) => {
    const automation = a as {
      id: string;
      name: string;
      category: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    };
    return [
      automation.id,
      `"${automation.name.replace(/"/g, '""')}"`,
      automation.category,
      automation.active ? "Oui" : "Non",
      formatDateTime(automation.createdAt),
      formatDateTime(automation.updatedAt),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Generate CSV for executions
function generateExecutionsCSV(executions: unknown[], automations: unknown[]): string {
  const automationMap = new Map(
    (automations as { id: string; name: string }[]).map((a) => [a.id, a.name])
  );

  const headers = [
    "ID",
    "Automation ID",
    "Automation Nom",
    "Status",
    "Mode",
    "Debut",
    "Fin",
    "Duree (s)",
  ];

  const rows = executions.map((ex: unknown, index: number) => {
    const execution = ex as {
      automationId: string;
      finished: boolean;
      mode: string;
      startedAt: string;
      stoppedAt: string;
    };
    const duration = calculateDuration(execution.startedAt, execution.stoppedAt);
    return [
      `exec_${index + 1}`,
      execution.automationId,
      `"${(automationMap.get(execution.automationId) || "Inconnu").replace(/"/g, '""')}"`,
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
function generateSummaryCSV(automations: unknown[], executions: unknown[]): string {
  const typedAutomations = automations as { id: string; name: string; active: boolean }[];
  const typedExecutions = executions as {
    automationId: string;
    finished: boolean;
  }[];

  const headers = [
    "Automation Nom",
    "Actif",
    "Total Executions",
    "Succes",
    "Echecs",
    "Taux de Succes (%)",
  ];

  const rows = typedAutomations.map((automation) => {
    const autoExecutions = typedExecutions.filter((e) => e.automationId === automation.id);
    const success = autoExecutions.filter((e) => e.finished).length;
    const errors = autoExecutions.length - success;
    const rate = autoExecutions.length > 0
      ? Math.round((success / autoExecutions.length) * 100)
      : 0;

    return [
      `"${automation.name.replace(/"/g, '""')}"`,
      automation.active ? "Oui" : "Non",
      autoExecutions.length,
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
