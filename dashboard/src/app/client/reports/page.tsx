"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Eye,
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: "monthly" | "weekly" | "campaign";
  date: string;
  status: "ready" | "generating";
}

interface MetricSummary {
  label: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  color: string;
}

const mockReports: Report[] = [
  { id: "1", title: "Rapport Mensuel - Decembre 2024", type: "monthly", date: "2024-12-01", status: "ready" },
  { id: "2", title: "Rapport Mensuel - Novembre 2024", type: "monthly", date: "2024-11-01", status: "ready" },
  { id: "3", title: "Campagne Black Friday 2024", type: "campaign", date: "2024-11-29", status: "ready" },
  { id: "4", title: "Rapport Mensuel - Octobre 2024", type: "monthly", date: "2024-10-01", status: "ready" },
  { id: "5", title: "Campagne Rentree 2024", type: "campaign", date: "2024-09-01", status: "ready" },
];

const metrics: MetricSummary[] = [
  { label: "Emails Envoyes", value: "45,678", change: 12.5, icon: Mail, color: "text-emerald-400" },
  { label: "Leads Generes", value: "1,247", change: 8.3, icon: Users, color: "text-sky-400" },
  { label: "Taux Conversion", value: "27.4%", change: 2.1, icon: TrendingUp, color: "text-amber-400" },
  { label: "Revenue Attribue", value: "24,500 EUR", change: 18.7, icon: DollarSign, color: "text-purple-400" },
];

export default function ClientReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

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
            Analysez les performances de vos automations
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exporter tout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="monthly">Rapports mensuels</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
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
                  Performance Mensuelle
                </CardTitle>
                <CardDescription>Evolution sur les 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Graphique performances</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-400" />
                  Repartition par Canal
                </CardTitle>
                <CardDescription>Sources de leads ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Graphique repartition</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Reports Tab */}
        <TabsContent value="monthly" className="space-y-4">
          {reports
            .filter((r) => r.type === "monthly")
            .map((report) => (
              <Card key={report.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {reports
            .filter((r) => r.type === "campaign")
            .map((report) => (
              <Card key={report.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10">
                        <TrendingUp className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Complete</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
