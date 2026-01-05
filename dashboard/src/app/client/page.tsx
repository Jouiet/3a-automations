"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  TrendingUp,
  Mail,
  Users,
  ArrowUpRight,
  Calendar,
  FileText,
  HelpCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
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
} from "recharts";

interface ClientStats {
  activeAutomations: number;
  totalExecutions: number;
  successRate: number;
  errorCount: number;
}

interface NativeAutomation {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  category: string;
}

interface AutomationExecution {
  id: string;
  automationId: string;
  automationName: string;
  status: string;
  startedAt: string;
  stoppedAt: string;
}

interface RecentActivity {
  id: string;
  message: string;
  time: string;
  type: "automation" | "email" | "lead" | "error";
  status: "success" | "error" | "pending";
}

interface ExecutionChartData {
  name: string;
  success: number;
  error: number;
}

const CHART_COLORS = {
  success: "#10B981",
  error: "#EF4444",
  primary: "#4FBAF1",
};

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<ClientStats>({
    activeAutomations: 0,
    totalExecutions: 0,
    successRate: 0,
    errorCount: 0,
  });
  const [automations, setAutomations] = useState<NativeAutomation[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [executionChartData, setExecutionChartData] = useState<ExecutionChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch native automations and stats
      const [automationsRes, statsRes] = await Promise.all([
        fetch("/api/automations"),
        fetch("/api/stats"),
      ]);

      // Process automations
      if (automationsRes.ok) {
        const automationsData = await automationsRes.json();
        if (automationsData.success && automationsData.data) {
          setAutomations(automationsData.data);

          // Calculate stats from automations
          const activeCount = automationsData.data.filter((a: NativeAutomation) => a.active).length;
          setStats(prev => ({ ...prev, activeAutomations: activeCount }));
        }
      }

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          const { totalExecutions, successRate, errorCount, recentExecutions } = statsData.data;
          setStats(prev => ({
            ...prev,
            totalExecutions: totalExecutions || 0,
            successRate: successRate || 0,
            errorCount: errorCount || 0,
          }));

          // Convert recent executions to activities
          if (recentExecutions && recentExecutions.length > 0) {
            const recentActivities: RecentActivity[] = recentExecutions
              .slice(0, 5)
              .map((exec: AutomationExecution) => ({
                id: exec.id,
                message: `Automation "${exec.automationName}" - ${exec.status}`,
                time: formatTimeAgo(exec.startedAt),
                type: "automation" as const,
                status: exec.status === "success" ? "success" as const :
                        exec.status === "error" ? "error" as const : "pending" as const,
              }));
            setActivities(recentActivities);

            // Generate chart data from executions grouped by automation
            const automationStats: { [key: string]: { success: number; error: number } } = {};
            recentExecutions.forEach((exec: AutomationExecution) => {
              const name = exec.automationName?.split(" - ")[0] || "Unknown";
              if (!automationStats[name]) {
                automationStats[name] = { success: 0, error: 0 };
              }
              if (exec.status === "success") {
                automationStats[name].success++;
              } else if (exec.status === "error") {
                automationStats[name].error++;
              }
            });

            const chartData = Object.entries(automationStats)
              .map(([name, data]) => ({
                name: name.length > 15 ? name.substring(0, 12) + "..." : name,
                success: data.success,
                error: data.error,
              }))
              .slice(0, 6);
            setExecutionChartData(chartData);
          }
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

  function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  }

  const handleRefresh = () => {
    setIsLoading(true);
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mon Dashboard</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">Mon Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de vos automations
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              <Badge variant={stats.activeAutomations > 0 ? "default" : "secondary"} className="gap-1">
                {stats.activeAutomations > 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3" />
                    Actif
                  </>
                ) : (
                  "Inactif"
                )}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.activeAutomations}</p>
              <p className="text-sm text-muted-foreground">Automations actives</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.totalExecutions}</p>
              <p className="text-sm text-muted-foreground">Executions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Taux</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.successRate}%</p>
              <p className="text-sm text-muted-foreground">Taux de succes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-xs text-muted-foreground">Erreurs</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.errorCount}</p>
              <p className="text-sm text-muted-foreground">Erreurs recentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Automations List */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Mes Automations
            </CardTitle>
            <CardDescription>
              {automations.length} automations configurees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {automations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucune automation configuree</p>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.slice(0, 6).map((automation) => (
                  <div
                    key={automation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${automation.active ? "bg-emerald-500/10" : "bg-muted"}`}>
                        <Zap className={`h-4 w-4 ${automation.active ? "text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{automation.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {automation.category}
                        </p>
                      </div>
                    </div>
                    <Badge variant={automation.active ? "default" : "secondary"}>
                      {automation.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activite Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucune activite recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.status === "success" ? "bg-emerald-500/10" :
                      activity.status === "error" ? "bg-destructive/10" : "bg-muted/50"
                    }`}>
                      {activity.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : activity.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Chart */}
      {executionChartData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Executions par Automation
            </CardTitle>
            <CardDescription>
              Performance des automations (succes vs erreurs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
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
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                <span className="text-sm text-muted-foreground">Succes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.error }} />
                <span className="text-sm text-muted-foreground">Erreurs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/client/reports">
                <FileText className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Rapports</p>
                  <p className="text-xs text-muted-foreground">Voir mes statistiques</p>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/client/automations">
                <Zap className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Automations</p>
                  <p className="text-xs text-muted-foreground">Gerer mes automations</p>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="https://calendly.com/3a-automation" target="_blank" rel="noopener noreferrer">
                <Calendar className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Planifier un appel</p>
                  <p className="text-xs text-muted-foreground">Reserver un RDV</p>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="mailto:contact@3a-automation.com">
                <HelpCircle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Support</p>
                  <p className="text-xs text-muted-foreground">Contacter l&apos;equipe</p>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
