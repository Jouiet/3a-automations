"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface RecentActivity {
  id: string;
  type: "lead" | "automation" | "email" | "call";
  message: string;
  time: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  nodes: number;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string;
}

interface ExecutionChartData {
  name: string;
  success: number;
  error: number;
}

interface WorkflowStatusData {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = {
  success: "#10B981",
  error: "#EF4444",
  primary: "#4FBAF1",
  warning: "#F59E0B",
  inactive: "#6B7280",
};

const defaultStats: DashboardStats = {
  totalLeads: 0,
  newLeadsToday: 0,
  qualifiedLeads: 0,
  conversionRate: 0,
  activeAutomations: 0,
  automationErrors: 0,
  revenueThisMonth: 0,
  revenueGrowth: 0,
};

const statCards = [
  {
    title: "Total Leads",
    value: (stats: DashboardStats) => stats.totalLeads.toLocaleString(),
    change: (stats: DashboardStats) => `+${stats.newLeadsToday} aujourd'hui`,
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Leads Qualifies",
    value: (stats: DashboardStats) => stats.qualifiedLeads.toLocaleString(),
    change: (stats: DashboardStats) => `${stats.conversionRate}% taux conversion`,
    trend: "up",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Automations Actives",
    value: (stats: DashboardStats) => stats.activeAutomations.toString(),
    change: (stats: DashboardStats) => stats.automationErrors > 0 ? `${stats.automationErrors} erreurs` : "Toutes operationnelles",
    trend: (stats: DashboardStats) => stats.automationErrors > 0 ? "down" : "up",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Revenue Mensuel",
    value: (stats: DashboardStats) => `${stats.revenueThisMonth.toLocaleString()} EUR`,
    change: (stats: DashboardStats) => `${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth}% vs mois dernier`,
    trend: (stats: DashboardStats) => stats.revenueGrowth > 0 ? "up" : "down",
    icon: DollarSign,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
];

const getActivityIcon = (type: RecentActivity["type"]) => {
  switch (type) {
    case "lead":
      return <Users className="h-4 w-4 text-primary" />;
    case "automation":
      return <Zap className="h-4 w-4 text-amber-400" />;
    case "email":
      return <Mail className="h-4 w-4 text-emerald-400" />;
    case "call":
      return <Phone className="h-4 w-4 text-sky-400" />;
  }
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [executionChartData, setExecutionChartData] = useState<ExecutionChartData[]>([]);
  const [workflowStatusData, setWorkflowStatusData] = useState<WorkflowStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch all data in parallel
      const [statsRes, activitiesRes, workflowsRes, executionsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/stats?type=activities&limit=5"),
        fetch("/api/n8n/workflows"),
        fetch("/api/n8n/executions?limit=50"),
      ]);

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      // Process activities
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        if (activitiesData.success && activitiesData.data) {
          const transformed = activitiesData.data.map((a: any) => ({
            id: a.id,
            type: a.action?.includes("lead") ? "lead" :
                  a.action?.includes("automation") ? "automation" :
                  a.action?.includes("email") ? "email" : "call",
            message: a.details || a.action,
            time: formatTimeAgo(a.createdAt)
          }));
          setActivities(transformed);
        }
      }

      // Process n8n workflows
      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        if (workflowsData.success && workflowsData.data) {
          setWorkflows(workflowsData.data);

          // Update automation count from real n8n data
          const activeCount = workflowsData.data.filter((w: N8nWorkflow) => w.active).length;
          const inactiveCount = workflowsData.data.filter((w: N8nWorkflow) => !w.active).length;

          setStats(prev => ({
            ...prev,
            activeAutomations: activeCount,
          }));

          // Create workflow status pie chart data
          setWorkflowStatusData([
            { name: "Actifs", value: activeCount, color: CHART_COLORS.success },
            { name: "Inactifs", value: inactiveCount, color: CHART_COLORS.inactive },
          ]);
        }
      }

      // Process n8n executions
      if (executionsRes.ok) {
        const executionsData = await executionsRes.json();
        if (executionsData.success && executionsData.data) {
          setExecutions(executionsData.data);

          // Update error count from execution stats
          if (executionsData.stats) {
            setStats(prev => ({
              ...prev,
              automationErrors: executionsData.stats.error || 0,
            }));
          }

          // Generate execution chart data grouped by workflow
          const workflowStats: { [key: string]: { success: number; error: number } } = {};
          (executionsData.data || []).forEach((exec: N8nExecution) => {
            const name = exec.workflowName?.split(" - ")[0] || "Unknown";
            if (!workflowStats[name]) {
              workflowStats[name] = { success: 0, error: 0 };
            }
            if (exec.status === "success") {
              workflowStats[name].success++;
            } else if (exec.status === "error") {
              workflowStats[name].error++;
            }
          });

          const chartData = Object.entries(workflowStats)
            .map(([name, data]) => ({
              name: name.length > 12 ? name.substring(0, 10) + "..." : name,
              success: data.success,
              error: data.error,
            }))
            .slice(0, 8);
          setExecutionChartData(chartData);

          // Also add executions to activities
          const execActivities: RecentActivity[] = (executionsData.data || [])
            .slice(0, 3)
            .map((exec: N8nExecution) => ({
              id: exec.id,
              type: "automation" as const,
              message: `${exec.workflowName} - ${exec.status === "success" ? "Succes" : "Erreur"}`,
              time: formatTimeAgo(exec.startedAt),
            }));

          setActivities(prev => {
            const combined = [...execActivities, ...prev];
            return combined.slice(0, 6);
          });
        }
      }

      setLastRefresh(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur de chargement des donnees");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchData();
  };

  function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de vos performances automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mise a jour: {lastRefresh.toLocaleTimeString("fr-FR")}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const trend = typeof stat.trend === "function" ? stat.trend(stats) : stat.trend;
          return (
            <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value(stats)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className={trend === "up" ? "text-emerald-400" : "text-destructive"}>
                    {stat.change(stats)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Execution Chart - Real n8n data */}
        <Card className="lg:col-span-4 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Executions par Workflow
            </CardTitle>
            <CardDescription>Performance des automations n8n (succes vs erreurs)</CardDescription>
          </CardHeader>
          <CardContent>
            {executionChartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionChartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: '#94A3B8' }}
                    />
                    <YAxis stroke="#94A3B8" fontSize={12} tick={{ fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(79, 186, 241, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="success" name="Succes" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="error" name="Erreurs" fill={CHART_COLORS.error} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                    <span className="text-xs text-muted-foreground">Succes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.error }} />
                    <span className="text-xs text-muted-foreground">Erreurs</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune execution recente</p>
                  <p className="text-sm">Les donnees apparaitront ici</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activite Recente</CardTitle>
                <CardDescription>Dernieres actions du systeme</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Ajouter un Lead</h3>
              <p className="text-sm text-muted-foreground">Import manuel ou CSV</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold">Nouvelle Automation</h3>
              <p className="text-sm text-muted-foreground">Creer un workflow n8n</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Mail className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Envoyer Campagne</h3>
              <p className="text-sm text-muted-foreground">Email ou WhatsApp</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List + Status Pie */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* n8n Workflows List */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Workflows n8n
            </CardTitle>
            <CardDescription>
              {workflows.length} workflows configures - {workflows.filter(w => w.active).length} actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucun workflow configure</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${workflow.active ? "bg-emerald-500/10" : "bg-muted"}`}>
                        {workflow.active ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{workflow.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workflow.nodes} nodes
                        </p>
                      </div>
                    </div>
                    <Badge variant={workflow.active ? "default" : "secondary"}>
                      {workflow.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Status Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Statut Workflows
            </CardTitle>
            <CardDescription>Repartition actif/inactif</CardDescription>
          </CardHeader>
          <CardContent>
            {workflowStatusData.length > 0 && workflowStatusData.some(d => d.value > 0) ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workflowStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {workflowStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(79, 186, 241, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {workflowStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-muted-foreground">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center border border-dashed border-border/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnee</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
