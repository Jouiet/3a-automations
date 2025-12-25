import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  reportId: string;
  generatedAt: string;
  period: string;
  company: {
    name: string;
    website: string;
    email: string;
  };
  summary: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  };
  workflowStats: Array<{
    id: string;
    name: string;
    active: boolean;
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    successRate: number;
  }>;
  topPerformers: Array<{
    name: string;
    totalExecutions: number;
    successRate: number;
  }>;
  needsAttention: Array<{
    name: string;
    errorCount: number;
    successRate: number;
  }>;
}

export async function generatePDFReport(reportData: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = "#0ea5e9"; // cyan-500
  const darkBg = "#1e293b"; // slate-800
  const textColor = "#f8fafc"; // slate-50

  // Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 45, "F");

  // Company name
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("3A AUTOMATION", 20, 25);

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Rapport de Performance Mensuel", 20, 35);

  // Period badge
  doc.setFillColor(14, 165, 233); // cyan-500
  doc.roundedRect(pageWidth - 70, 15, 55, 20, 3, 3, "F");
  doc.setFontSize(10);
  doc.text(reportData.period, pageWidth - 65, 28);

  // Generated date
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(8);
  const generatedDate = new Date(reportData.generatedAt).toLocaleString("fr-FR");
  doc.text(`Genere le: ${generatedDate}`, 20, 55);

  // Summary Section
  let yPos = 70;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Resume Executif", 20, yPos);

  // Summary boxes
  yPos += 10;
  const boxWidth = 42;
  const boxHeight = 35;
  const boxes = [
    {
      label: "Workflows",
      value: reportData.summary.totalWorkflows.toString(),
      subtext: `${reportData.summary.activeWorkflows} actifs`,
    },
    {
      label: "Executions",
      value: reportData.summary.totalExecutions.toString(),
      subtext: "Total",
    },
    {
      label: "Succes",
      value: reportData.summary.successfulExecutions.toString(),
      subtext: `${reportData.summary.successRate}%`,
    },
    {
      label: "Echecs",
      value: reportData.summary.failedExecutions.toString(),
      subtext: "A corriger",
    },
  ];

  boxes.forEach((box, index) => {
    const x = 20 + index * (boxWidth + 5);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(box.label, x + 5, yPos + 10);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(box.value, x + 5, yPos + 22);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(box.subtext, x + 5, yPos + 30);
  });

  // Workflow Performance Table
  yPos += 55;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Performance des Workflows", 20, yPos);

  yPos += 5;

  const tableData = reportData.workflowStats.map((wf) => [
    wf.name.substring(0, 30) + (wf.name.length > 30 ? "..." : ""),
    wf.active ? "Actif" : "Inactif",
    wf.totalExecutions.toString(),
    wf.successCount.toString(),
    wf.errorCount.toString(),
    `${wf.successRate}%`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Workflow", "Status", "Executions", "Succes", "Echecs", "Taux"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
    },
    margin: { left: 20, right: 20 },
  });

  // Get final Y position after table
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;

  // Needs Attention Section (if any)
  if (reportData.needsAttention.length > 0) {
    let attentionY = finalY + 15;

    // Check if we need a new page
    if (attentionY > 250) {
      doc.addPage();
      attentionY = 30;
    }

    doc.setTextColor(239, 68, 68); // red-500
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Workflows necessitant attention", 20, attentionY);

    attentionY += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);

    reportData.needsAttention.slice(0, 3).forEach((wf, index) => {
      doc.text(
        `• ${wf.name}: ${wf.errorCount} echec(s), taux de succes ${wf.successRate}%`,
        25,
        attentionY + index * 6
      );
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(30, 41, 59);
  doc.rect(0, pageHeight - 25, pageWidth, 25, "F");

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(reportData.company.website, 20, pageHeight - 12);
  doc.text(reportData.company.email, pageWidth / 2 - 30, pageHeight - 12);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(10);
  doc.text(
    "Rapport genere automatiquement par 3A Automation",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  // Save the PDF
  const filename = `rapport-${reportData.period.toLowerCase().replace(/\s+/g, "-")}-${reportData.reportId}.pdf`;
  doc.save(filename);
}

// Export CSV from client-side data
export function exportToCSV(
  data: Array<Record<string, unknown>>,
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? "" : String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
