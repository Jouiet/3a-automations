"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch stats from API
        const [statsRes, activitiesRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/stats?type=activities&limit=5")
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success && statsData.data) {
            setStats(statsData.data);
          }
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          if (activitiesData.success && activitiesData.data) {
            // Transform activities to match our interface
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

        setIsLoading(false);
      } catch (err) {
        setError("Erreur de chargement des donnees");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de vos performances automation
        </p>
      </div>

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
        {/* Chart placeholder */}
        <Card className="lg:col-span-4 border-border/50">
          <CardHeader>
            <CardTitle>Leads par Semaine</CardTitle>
            <CardDescription>Evolution des leads sur les 12 dernieres semaines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-lg">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Graphique Leads/Semaine</p>
                <p className="text-sm">(Integration Recharts)</p>
              </div>
            </div>
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
    </div>
  );
}
