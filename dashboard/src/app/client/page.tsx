"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";
import { AnimatedNumber, PercentageRing } from "@/components/ui/animated-number";
import { StatusPulse, StatusBadge } from "@/components/ui/status-pulse";
import { StatSkeleton, CardSkeleton, ListItemSkeleton } from "@/components/ui/skeleton";
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
  Shield,
  Cpu,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ClientStats {
  activeAutomations: number;
  totalExecutions: number;
  successRate: number;
  errorCount: number;
  timeSavedHours: number;
  revenueImpact: number;
}

interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
}

interface NativeAutomation {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  category: string;
  lastRunStatus?: "success" | "error" | "pending";
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

// Platform capabilities (sourced from registry)
const PLATFORM_STATS = {
  totalAutomations: 121,
  totalScripts: 85,
  totalSensors: 19,
  mcpServers: 14,
};

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<ClientStats>({
    activeAutomations: 0,
    totalExecutions: 0,
    successRate: 0,
    errorCount: 0,
    timeSavedHours: 0,
    revenueImpact: 0,
  });
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "shopify", name: "Shopify", icon: "shopify", connected: false },
    { id: "klaviyo", name: "Klaviyo", icon: "klaviyo", connected: false },
    { id: "google", name: "Google", icon: "google", connected: false },
  ]);
  const [automations, setAutomations] = useState<NativeAutomation[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [executionChartData, setExecutionChartData] = useState<ExecutionChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch data in parallel
      const [automationsRes, statsRes, healthRes] = await Promise.all([
        fetch("/api/automations"),
        fetch("/api/stats"),
        fetch("/api/health/default").catch(() => null),
      ]);

      // Process automations
      if (automationsRes.ok) {
        const automationsData = await automationsRes.json();
        if (automationsData.success && automationsData.data) {
          setAutomations(automationsData.data);
          const activeCount = automationsData.data.filter((a: NativeAutomation) => a.active).length;
          setStats(prev => ({ ...prev, activeAutomations: activeCount }));
        }
      }

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          const { totalExecutions, successRate, errorCount, recentExecutions } = statsData.data;

          // Calculate estimated time saved (avg 2 min per automation run)
          const timeSaved = Math.round((totalExecutions || 0) * 2 / 60);

          setStats(prev => ({
            ...prev,
            totalExecutions: totalExecutions || 0,
            successRate: successRate || 0,
            errorCount: errorCount || 0,
            timeSavedHours: timeSaved,
          }));

          if (recentExecutions && recentExecutions.length > 0) {
            const recentActivities: RecentActivity[] = recentExecutions
              .slice(0, 5)
              .map((exec: AutomationExecution) => ({
                id: exec.id,
                message: `${exec.automationName}`,
                time: formatTimeAgo(exec.startedAt),
                type: "automation" as const,
                status: exec.status === "success" ? "success" as const :
                        exec.status === "error" ? "error" as const : "pending" as const,
              }));
            setActivities(recentActivities);

            // Generate chart data
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              return {
                name: date.toLocaleDateString("fr-FR", { weekday: "short" }),
                success: 0,
                error: 0,
              };
            });

            recentExecutions.forEach((exec: AutomationExecution) => {
              const execDate = new Date(exec.startedAt);
              const dayIndex = last7Days.findIndex(d =>
                d.name === execDate.toLocaleDateString("fr-FR", { weekday: "short" })
              );
              if (dayIndex !== -1) {
                if (exec.status === "success") {
                  last7Days[dayIndex].success++;
                } else if (exec.status === "error") {
                  last7Days[dayIndex].error++;
                }
              }
            });

            setExecutionChartData(last7Days);
          }
        }
      }

      // Process health/integrations
      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData.integrations) {
          setIntegrations(prev => prev.map(int => ({
            ...int,
            connected: healthData.integrations[int.id]?.connected || false,
            lastSync: healthData.integrations[int.id]?.lastSync,
          })));
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

  const connectedCount = integrations.filter(i => i.connected).length;

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
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de vos automations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {lastRefresh.toLocaleTimeString("fr-FR")}
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

      {/* Integration Status Bar - Sober, purposeful */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <StatusPulse status={connectedCount === integrations.length ? "healthy" : connectedCount > 0 ? "warning" : "error"} size="sm" />
                <span className="text-sm font-medium">
                  {connectedCount}/{integrations.length} integrations connectees
                </span>
              </div>
              <div className="hidden md:flex items-center gap-4">
                {integrations.map((int) => (
                  <div key={int.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${int.connected ? "bg-emerald-500" : "bg-slate-600"}`} />
                    <span className={`text-xs ${int.connected ? "text-foreground" : "text-muted-foreground"}`}>
                      {int.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/client/integrations">
                Gerer <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - Clean, minimal with purposeful animation */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Active Automations */}
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              <StatusBadge
                status={stats.activeAutomations > 0 ? "healthy" : "warning"}
                label={stats.activeAutomations > 0 ? "Actif" : "Inactif"}
              />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                <AnimatedNumber value={stats.activeAutomations} />
              </p>
              <p className="text-sm text-muted-foreground">Automations actives</p>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate - Purpose: show reliability */}
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Fiabilite</span>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-bold">
                <AnimatedNumber value={stats.successRate} suffix="%" />
              </p>
              <PercentageRing
                value={stats.successRate}
                size={32}
                strokeWidth={3}
                color={stats.successRate >= 95 ? "#10B981" : stats.successRate >= 80 ? "#F59E0B" : "#EF4444"}
              />
            </div>
            <p className="text-sm text-muted-foreground">Taux de succes</p>
          </CardContent>
        </Card>

        {/* Total Executions */}
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-sky-400" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                <AnimatedNumber value={stats.totalExecutions} />
              </p>
              <p className="text-sm text-muted-foreground">Executions</p>
            </div>
          </CardContent>
        </Card>

        {/* Time Saved - Show business value */}
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="text-xs text-muted-foreground">Valeur</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                <AnimatedNumber value={stats.timeSavedHours} suffix="h" />
              </p>
              <p className="text-sm text-muted-foreground">Temps economise</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Automations List */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Mes Automations
                </CardTitle>
                <CardDescription>
                  {automations.length} configurees · {stats.activeAutomations} actives
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/client/automations">Voir tout</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {automations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucune automation configuree</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a href="/client/onboarding">Commencer la configuration</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {automations.slice(0, 6).map((automation) => (
                  <div
                    key={automation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusPulse
                        status={automation.active ? "healthy" : "offline"}
                        size="sm"
                      />
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
                    <StatusPulse
                      status={activity.status === "success" ? "healthy" : activity.status === "error" ? "error" : "warning"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Trend - Purposeful: show trajectory */}
      {executionChartData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tendance des Executions
            </CardTitle>
            <CardDescription>
              Performance des 7 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={executionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tick={{ fill: '#94A3B8' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tick={{ fill: '#94A3B8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(79, 186, 241, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    name="Succes"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#successGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="error"
                    name="Erreurs"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#errorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Capabilities - Subtle showcase, not bragging */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <a href="/client/reports">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm">Rapports</span>
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <a href="/client/automations">
                  <Zap className="h-4 w-4 mr-2" />
                  <span className="text-sm">Automations</span>
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <a href="https://calendly.com/3a-automation" target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">Planifier un appel</span>
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <a href="mailto:contact@3a-automation.com">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Support</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Info - Subtle, professional */}
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Plateforme 3A</p>
                <p className="text-xs text-muted-foreground">Infrastructure enterprise-grade</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{PLATFORM_STATS.totalAutomations}</p>
                <p className="text-xs text-muted-foreground">Automations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{PLATFORM_STATS.totalScripts}</p>
                <p className="text-xs text-muted-foreground">Scripts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{PLATFORM_STATS.totalSensors}</p>
                <p className="text-xs text-muted-foreground">Sensors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{PLATFORM_STATS.mcpServers}</p>
                <p className="text-xs text-muted-foreground">MCP Servers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
