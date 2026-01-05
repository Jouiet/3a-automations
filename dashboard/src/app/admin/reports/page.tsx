"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Clock,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { generatePDFReport } from "@/lib/pdf-generator";

interface Report {
  id: string;
  name: string;
  type: "monthly" | "weekly" | "custom" | "client";
  period: string;
  generatedAt: string;
  status: "ready" | "generating" | "scheduled";
  metrics: {
    workflows?: number;
    activeWorkflows?: number;
    totalExecutions?: number;
    successfulExecutions?: number;
    failedExecutions?: number;
    successRate?: number;
  };
  workflowStats?: Array<{
    id: string;
    name: string;
    active: boolean;
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    successRate: number;
  }>;
}

interface ReportsResponse {
  success: boolean;
  reports: Report[];
  summary: {
    totalReports: number;
    totalWorkflows: number;
    totalExecutions: number;
    overallSuccessRate: number;
  };
}

const typeConfig = {
  monthly: { label: "Mensuel", color: "bg-primary/20 text-primary" },
  weekly: { label: "Hebdo", color: "bg-emerald-500/20 text-emerald-400" },
  custom: { label: "Custom", color: "bg-amber-500/20 text-amber-400" },
  client: { label: "Client", color: "bg-purple-500/20 text-purple-400" },
};

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportsResponse["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reports");
      const data: ReportsResponse = await response.json();

      if (data.success) {
        setReports(data.reports);
        setSummary(data.summary);
        if (data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async (type: string) => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/reports/export?type=${type}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePDF = async (report: Report) => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/reports/pdf?id=${report.id}`);
      const data = await response.json();

      if (data.success) {
        await generatePDFReport(data.data);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Prepare chart data from selected report
  const getChartData = () => {
    if (!selectedReport?.workflowStats) return [];
    return selectedReport.workflowStats.slice(0, 6).map((wf) => ({
      name: wf.name.substring(0, 15) + (wf.name.length > 15 ? "..." : ""),
      succes: wf.successCount,
      erreurs: wf.errorCount,
    }));
  };

  const getPieData = () => {
    if (!selectedReport?.metrics) return [];
    return [
      { name: "Succes", value: selectedReport.metrics.successfulExecutions || 0 },
      { name: "Echecs", value: selectedReport.metrics.failedExecutions || 0 },
    ];
  };

  const readyReports = reports.filter((r) => r.status === "ready");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">
            Rapports de performance en temps reel - Automations natives
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportCSV("summary")}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => selectedReport && handleGeneratePDF(selectedReport)}
            disabled={isExporting || !selectedReport}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Generation..." : "Telecharger PDF"}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{summary?.totalReports || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Rapports Disponibles</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">
                {summary?.totalWorkflows || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Workflows Actifs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">
                {summary?.totalExecutions || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total Executions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">
                {summary?.overallSuccessRate || 0}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Taux de Succes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Executions par Workflow
            </CardTitle>
            <CardDescription>Succes vs Echecs par workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Bar dataKey="succes" fill="#10b981" name="Succes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="erreurs" fill="#ef4444" name="Erreurs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Repartition Succes/Echecs
            </CardTitle>
            <CardDescription>Vue globale des executions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Tous les Rapports</CardTitle>
          <CardDescription>Cliquez sur un rapport pour voir les details</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="monthly">Mensuels</TabsTrigger>
              <TabsTrigger value="weekly">Hebdos</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedReport?.id === report.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{report.name}</h3>
                        <Badge className={typeConfig[report.type].color}>
                          {typeConfig[report.type].label}
                        </Badge>
                        {report.status === "scheduled" && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Planifie
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Periode: {report.period}
                        {report.generatedAt &&
                          ` | Genere le ${formatDate(report.generatedAt)}`}
                      </p>
                    </div>
                  </div>

                  {report.status === "ready" && (
                    <div className="flex items-center gap-6">
                      {report.metrics?.totalExecutions !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold">
                            {report.metrics.totalExecutions}
                          </p>
                          <p className="text-xs text-muted-foreground">Executions</p>
                        </div>
                      )}
                      {report.metrics?.successRate !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold text-emerald-400">
                            {report.metrics.successRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Taux Succes</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGeneratePDF(report);
                          }}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  )}

                  {report.status === "scheduled" && (
                    <Button variant="outline" size="sm" disabled>
                      En attente
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="monthly">
              {reports
                .filter((r) => r.type === "monthly")
                .map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg border border-border/50 mb-4 cursor-pointer hover:border-primary/30"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">{report.period}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGeneratePDF(report);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="weekly">
              {reports
                .filter((r) => r.type === "weekly")
                .map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg border border-border/50 mb-4 cursor-pointer hover:border-primary/30"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">{report.period}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGeneratePDF(report);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Export de Donnees
          </CardTitle>
          <CardDescription>
            Telecharger les donnees brutes au format CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportCSV("workflows")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Workflows
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportCSV("executions")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Executions
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportCSV("summary")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
