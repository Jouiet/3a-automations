"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Mail,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { generatePDFReport } from "@/lib/pdf-generator";

interface Report {
  id: string;
  name: string;
  type: "monthly" | "weekly" | "campaign";
  period: string;
  generatedAt: string;
  status: "ready" | "generating";
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

export default function ClientReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportsResponse["summary"] | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
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

  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/reports/export?type=summary&format=csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-complet-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  // Prepare chart data
  const getBarChartData = () => {
    if (!selectedReport?.workflowStats) return [];
    return selectedReport.workflowStats.slice(0, 5).map((wf) => ({
      name: wf.name.substring(0, 12) + (wf.name.length > 12 ? "..." : ""),
      succes: wf.successCount,
      erreurs: wf.errorCount,
    }));
  };

  const getPieData = () => {
    if (!selectedReport?.metrics) return [];
    return [
      { name: "Succes", value: selectedReport.metrics.successfulExecutions || 0, color: "#10b981" },
      { name: "Echecs", value: selectedReport.metrics.failedExecutions || 0, color: "#ef4444" },
    ];
  };

  // Metrics cards
  const metrics = [
    {
      label: "Workflows Actifs",
      value: summary?.totalWorkflows?.toString() || "0",
      change: 0,
      icon: BarChart3,
      color: "text-emerald-400",
    },
    {
      label: "Executions Totales",
      value: summary?.totalExecutions?.toString() || "0",
      change: 0,
      icon: TrendingUp,
      color: "text-sky-400",
    },
    {
      label: "Taux de Succes",
      value: `${summary?.overallSuccessRate || 0}%`,
      change: summary?.overallSuccessRate || 0 >= 80 ? 5 : -5,
      icon: CheckCircle,
      color: "text-amber-400",
    },
    {
      label: "Rapports Disponibles",
      value: summary?.totalReports?.toString() || "0",
      change: 0,
      icon: FileText,
      color: "text-purple-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-24 bg-muted rounded mb-2" />
                <div className="h-4 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
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
            Analysez les performances de vos automations en temps reel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={handleExportAll} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Export..." : "Exporter tout"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="monthly">Rapports mensuels</TabsTrigger>
          <TabsTrigger value="weekly">Rapports hebdos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    {metric.change !== 0 && (
                      <Badge
                        variant={metric.change >= 0 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {metric.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(metric.change)}%
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance par Workflow
                </CardTitle>
                <CardDescription>Succes vs Echecs sur la periode</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getBarChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-30}
                      textAnchor="end"
                      height={60}
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
                    <Bar
                      dataKey="succes"
                      fill="#10b981"
                      name="Succes"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="erreurs"
                      fill="#ef4444"
                      name="Erreurs"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-emerald-400" />
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
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
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
        </TabsContent>

        {/* Monthly Reports Tab */}
        <TabsContent value="monthly" className="space-y-4">
          {reports
            .filter((r) => r.type === "monthly")
            .map((report) => (
              <Card
                key={report.id}
                className={`border-border/50 hover:border-primary/30 transition-colors cursor-pointer ${
                  selectedReport?.id === report.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.metrics?.totalExecutions !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold">{report.metrics.totalExecutions}</p>
                          <p className="text-xs text-muted-foreground">Executions</p>
                        </div>
                      )}
                      {report.metrics?.successRate !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold text-emerald-400">
                            {report.metrics.successRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Taux</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
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
                  </div>
                </CardContent>
              </Card>
            ))}

          {reports.filter((r) => r.type === "monthly").length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun rapport mensuel disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly Reports Tab */}
        <TabsContent value="weekly" className="space-y-4">
          {reports
            .filter((r) => r.type === "weekly")
            .map((report) => (
              <Card
                key={report.id}
                className={`border-border/50 hover:border-primary/30 transition-colors cursor-pointer ${
                  selectedReport?.id === report.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10">
                        <TrendingUp className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.metrics?.totalExecutions !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold">{report.metrics.totalExecutions}</p>
                          <p className="text-xs text-muted-foreground">Executions</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Cette semaine</Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}

          {reports.filter((r) => r.type === "weekly").length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun rapport hebdomadaire disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
