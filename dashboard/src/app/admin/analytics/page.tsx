"use client";

import { useState } from "react";
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
} from "lucide-react";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: typeof TrendingUp;
  iconColor: string;
}

const metrics: MetricCard[] = [
  {
    title: "Leads Generes",
    value: "1,247",
    change: 12.5,
    changeLabel: "vs mois dernier",
    icon: Users,
    iconColor: "text-primary",
  },
  {
    title: "Taux Ouverture Email",
    value: "42.3%",
    change: 5.2,
    changeLabel: "vs mois dernier",
    icon: Mail,
    iconColor: "text-emerald-400",
  },
  {
    title: "Taux de Clic",
    value: "8.7%",
    change: -1.3,
    changeLabel: "vs mois dernier",
    icon: MousePointer,
    iconColor: "text-amber-400",
  },
  {
    title: "Revenue Automations",
    value: "24,500 EUR",
    change: 18.2,
    changeLabel: "vs mois dernier",
    icon: DollarSign,
    iconColor: "text-sky-400",
  },
];

const channelPerformance = [
  { channel: "Email", leads: 456, conversion: 28.5, revenue: 12400 },
  { channel: "LinkedIn", leads: 234, conversion: 22.1, revenue: 6800 },
  { channel: "Website", leads: 312, conversion: 31.2, revenue: 8900 },
  { channel: "Referral", leads: 145, conversion: 45.3, revenue: 7200 },
  { channel: "Ads", leads: 100, conversion: 15.8, revenue: 3200 },
];

const automationPerformance = [
  { name: "Welcome Sequence", runs: 1247, success: 98.5, revenue: 5600 },
  { name: "Abandon Cart", runs: 856, success: 97.2, revenue: 12400 },
  { name: "Re-engagement", runs: 543, success: 94.8, revenue: 3200 },
  { name: "Upsell Campaign", runs: 234, success: 96.1, revenue: 8900 },
  { name: "NPS Survey", runs: 678, success: 99.1, revenue: 0 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Performance de vos automations et campagnes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="7d">7J</TabsTrigger>
              <TabsTrigger value="30d">30J</TabsTrigger>
              <TabsTrigger value="90d">90J</TabsTrigger>
              <TabsTrigger value="1y">1A</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                <Badge
                  variant={metric.change >= 0 ? "success" : "destructive"}
                  className="gap-1"
                >
                  {metric.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(metric.change)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads Over Time Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Leads par Semaine
                </CardTitle>
                <CardDescription>Evolution sur les 12 dernieres semaines</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <LineChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Graphique Leads/Semaine</p>
                <p className="text-xs">(Recharts integration)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-400" />
                  Funnel de Conversion
                </CardTitle>
                <CardDescription>Du lead a la vente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Visiteurs</span>
                  <span className="font-medium">12,450</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Leads</span>
                  <span className="font-medium">1,247 (10%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: "60%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Qualifies</span>
                  <span className="font-medium">342 (27%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Clients</span>
                  <span className="font-medium">89 (26%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel Performance */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-400" />
              Performance par Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelPerformance.map((channel, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">{channel.channel}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground w-20">
                      {channel.leads} leads
                    </span>
                    <span className="text-emerald-400 w-16">
                      {channel.conversion}%
                    </span>
                    <span className="font-medium w-24 text-right">
                      {channel.revenue.toLocaleString()} EUR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automation Performance */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-400" />
              Top Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automationPerformance.map((automation, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{automation.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground w-20">
                      {automation.runs} runs
                    </span>
                    <span className="text-emerald-400 w-16">
                      {automation.success}%
                    </span>
                    <span className="font-medium w-24 text-right">
                      {automation.revenue > 0 ? `${automation.revenue.toLocaleString()} EUR` : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Repeat className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">3.2x</p>
                <p className="text-sm text-muted-foreground">ROI Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <ShoppingCart className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">156 EUR</p>
                <p className="text-sm text-muted-foreground">Valeur Moyenne Lead</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10">
                <Calendar className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">14 jours</p>
                <p className="text-sm text-muted-foreground">Cycle Vente Moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
