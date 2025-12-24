"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  DollarSign,
  Eye,
  Clock,
  Plus,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "monthly" | "weekly" | "custom" | "client";
  period: string;
  generatedAt: string;
  status: "ready" | "generating" | "scheduled";
  metrics: {
    leads?: number;
    revenue?: number;
    emails?: number;
    conversions?: number;
  };
}

const mockReports: Report[] = [
  {
    id: "1",
    name: "Rapport Mensuel - Decembre 2024",
    type: "monthly",
    period: "Dec 2024",
    generatedAt: "2024-12-24T08:00:00Z",
    status: "ready",
    metrics: { leads: 1247, revenue: 24500, emails: 45678, conversions: 89 }
  },
  {
    id: "2",
    name: "Rapport Mensuel - Novembre 2024",
    type: "monthly",
    period: "Nov 2024",
    generatedAt: "2024-12-01T08:00:00Z",
    status: "ready",
    metrics: { leads: 1156, revenue: 21800, emails: 42100, conversions: 76 }
  },
  {
    id: "3",
    name: "Rapport Hebdo - Semaine 51",
    type: "weekly",
    period: "16-22 Dec 2024",
    generatedAt: "2024-12-23T08:00:00Z",
    status: "ready",
    metrics: { leads: 312, revenue: 6200, emails: 12450 }
  },
  {
    id: "4",
    name: "Rapport Client - Boutique Mode Paris",
    type: "client",
    period: "Dec 2024",
    generatedAt: "2024-12-24T09:00:00Z",
    status: "ready",
    metrics: { leads: 156, emails: 4500, conversions: 23 }
  },
  {
    id: "5",
    name: "Rapport Mensuel - Janvier 2025",
    type: "monthly",
    period: "Jan 2025",
    generatedAt: "",
    status: "scheduled",
    metrics: {}
  },
];

const typeConfig = {
  monthly: { label: "Mensuel", color: "bg-primary/20 text-primary" },
  weekly: { label: "Hebdo", color: "bg-emerald-500/20 text-emerald-400" },
  custom: { label: "Custom", color: "bg-amber-500/20 text-amber-400" },
  client: { label: "Client", color: "bg-purple-500/20 text-purple-400" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const readyReports = reports.filter(r => r.status === "ready");

  if (isLoading) {
    return <div className="h-96 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">Generez et consultez vos rapports de performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Planifier
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Rapport
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{reports.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Rapports</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{readyReports.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">
                {readyReports.reduce((sum, r) => sum + (r.metrics.leads || 0), 0).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Leads Totaux</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">
                {readyReports.reduce((sum, r) => sum + (r.metrics.revenue || 0), 0).toLocaleString()} EUR
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Revenue Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Tous les Rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="monthly">Mensuels</TabsTrigger>
              <TabsTrigger value="weekly">Hebdos</TabsTrigger>
              <TabsTrigger value="client">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
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
                        {report.generatedAt && ` • Genere le ${formatDate(report.generatedAt)}`}
                      </p>
                    </div>
                  </div>

                  {report.status === "ready" && (
                    <div className="flex items-center gap-6">
                      {report.metrics.leads && (
                        <div className="text-center">
                          <p className="font-semibold">{report.metrics.leads.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Leads</p>
                        </div>
                      )}
                      {report.metrics.revenue && (
                        <div className="text-center">
                          <p className="font-semibold text-emerald-400">{report.metrics.revenue.toLocaleString()} EUR</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                      )}
                      {report.metrics.emails && (
                        <div className="text-center">
                          <p className="font-semibold text-sky-400">{report.metrics.emails.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Emails</p>
                        </div>
                      )}
                      <div className="flex gap-2">
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
              {reports.filter(r => r.type === "monthly").map(report => (
                <div key={report.id} className="p-4 rounded-lg border border-border/50 mb-4">
                  <h3 className="font-semibold">{report.name}</h3>
                  <p className="text-sm text-muted-foreground">{report.period}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="weekly">
              {reports.filter(r => r.type === "weekly").map(report => (
                <div key={report.id} className="p-4 rounded-lg border border-border/50 mb-4">
                  <h3 className="font-semibold">{report.name}</h3>
                  <p className="text-sm text-muted-foreground">{report.period}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="client">
              {reports.filter(r => r.type === "client").map(report => (
                <div key={report.id} className="p-4 rounded-lg border border-border/50 mb-4">
                  <h3 className="font-semibold">{report.name}</h3>
                  <p className="text-sm text-muted-foreground">{report.period}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
