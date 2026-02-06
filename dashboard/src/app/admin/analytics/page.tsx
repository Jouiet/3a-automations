"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MousePointer,
  DollarSign,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingCart,
  Repeat,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart as RechartsLine,
  Line,
} from "recharts";

interface WorkflowData {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionData {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  finished: boolean;
}

interface ExecutionStats {
  total: number;
  success: number;
  error: number;
  running: number;
  waiting: number;
}

interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  qualifiedLeads: number;
  conversionRate: number;
  activeAutomations: number;
  automationErrors: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [executionStats, setExecutionStats] = useState<ExecutionStats>({
    total: 0,
    success: 0,
    error: 0,
    running: 0,
    waiting: 0,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch native automations
      const automationsRes = await fetch("/api/automations");
      const automationsData = await automationsRes.json();

      if (automationsData.success) {
        const wfs = (automationsData.data || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          active: a.status === 'ACTIVE',
        }));
        setWorkflows(wfs);
      }

      // Empty execution data (no backend API yet - shows zeros, not fake numbers)
      const executionsData = { success: true, data: [], stats: { total: 0, success: 0, error: 0, running: 0, waiting: 0 } };

      if (executionsData.success) {
        setExecutions(executionsData.data || []);
        setExecutionStats(executionsData.stats || {
          total: 0,
          success: 0,
          error: 0,
          running: 0,
          waiting: 0,
        });
      }

      // Fetch dashboard stats from Google Sheets
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();

      if (statsData.success) {
        setDashboardStats(statsData.data);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const workflowChartData = workflows.map(wf => ({
    name: wf.name.length > 20 ? wf.name.substring(0, 20) + "..." : wf.name,
    status: wf.active ? 1 : 0,
    active: wf.active,
  }));

  // Execution stats by workflow
  const executionsByWorkflow = workflows.map(wf => {
    const wfExecs = executions.filter(e => e.workflowId === wf.id);
    return {
      name: wf.name.length > 15 ? wf.name.substring(0, 15) + "..." : wf.name,
      success: wfExecs.filter(e => e.status === "success").length,
      error: wfExecs.filter(e => e.status === "error").length,
      total: wfExecs.length,
    };
  }).filter(d => d.total > 0);

  // Status distribution for pie chart
  const statusData = [
    { name: "Success", value: executionStats.success, color: "#10B981" },
    { name: "Error", value: executionStats.error, color: "#EF4444" },
    { name: "Running", value: executionStats.running, color: "#3B82F6" },
    { name: "Waiting", value: executionStats.waiting, color: "#F59E0B" },
  ].filter(d => d.value > 0);

  // Executions over time (group by day)
  const executionsByDate = executions.reduce((acc, exec) => {
    const date = new Date(exec.startedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!acc[date]) {
      acc[date] = { date, success: 0, error: 0 };
    }
    if (exec.status === "success") acc[date].success++;
    else if (exec.status === "error") acc[date].error++;
    return acc;
  }, {} as Record<string, { date: string; success: number; error: number }>);

  const timelineData = Object.values(executionsByDate).slice(-14).reverse();

  const successRate = executionStats.total > 0
    ? ((executionStats.success / executionStats.total) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Performance temps reel de vos automations natives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Actualiser</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => alert("Export analytics: en cours de developpement")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* KPI Cards - Real Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="gap-1">
                Live
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{workflows.length}</p>
              <p className="text-sm text-muted-foreground">Automations Natives</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <Badge variant="success" className="gap-1">
                {successRate}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{executionStats.success}</p>
              <p className="text-sm text-muted-foreground">Executions Reussies</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-400" />
              {executionStats.error > 0 && (
                <Badge variant="destructive" className="gap-1">
                  {executionStats.error}
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{executionStats.error}</p>
              <p className="text-sm text-muted-foreground">Erreurs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-amber-400" />
              <Badge variant="outline" className="gap-1">
                {executionStats.running + executionStats.waiting}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{executionStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Executions Bar Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Executions par Workflow
            </CardTitle>
            <CardDescription>Success vs Erreurs</CardDescription>
          </CardHeader>
          <CardContent>
            {executionsByWorkflow.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executionsByWorkflow} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94A3B8" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="success" name="Succes" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="error" name="Erreurs" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune execution enregistree
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-400" />
              Distribution des Status
            </CardTitle>
            <CardDescription>Repartition des executions</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnee disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-sky-400" />
            Executions dans le Temps
          </CardTitle>
          <CardDescription>14 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsLine data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="success"
                  name="Succes"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
                <Line
                  type="monotone"
                  dataKey="error"
                  name="Erreurs"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444' }}
                />
              </RechartsLine>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Aucune donnee temporelle
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflows Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Automations
          </CardTitle>
          <CardDescription>{workflows.filter(w => w.active).length} actifs sur {workflows.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflows.map((workflow) => {
              const wfExecs = executions.filter(e => e.workflowId === workflow.id);
              const wfSuccess = wfExecs.filter(e => e.status === "success").length;
              const wfError = wfExecs.filter(e => e.status === "error").length;
              const wfRate = wfExecs.length > 0 ? ((wfSuccess / wfExecs.length) * 100).toFixed(0) : "-";

              return (
                <div key={workflow.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${workflow.active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Mis a jour: {new Date(workflow.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground w-20">
                      {wfExecs.length} runs
                    </span>
                    <span className="text-emerald-400 w-16">
                      {wfSuccess} OK
                    </span>
                    <span className="text-red-400 w-16">
                      {wfError} err
                    </span>
                    <Badge variant={workflow.active ? "success" : "secondary"}>
                      {workflow.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats from Google Sheets */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardStats.totalLeads}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardStats.conversionRate}%</p>
                  <p className="text-sm text-muted-foreground">Taux Conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-500/10">
                  <DollarSign className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardStats.revenueThisMonth} EUR</p>
                  <p className="text-sm text-muted-foreground">Revenue Ce Mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
