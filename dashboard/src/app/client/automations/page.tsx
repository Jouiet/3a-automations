"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Mail,
  ShoppingCart,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  BarChart3,
  ExternalLink,
  Play,
  Pause,
  Info,
} from "lucide-react";

interface ClientAutomation {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "ACTIVE" | "PAUSED";
  lastRunAt: string;
  runCount: number;
  successRate: number;
}

const mockAutomations: ClientAutomation[] = [
  {
    id: "1",
    name: "Welcome Email Sequence",
    description: "Envoie automatiquement une serie de 3 emails de bienvenue aux nouveaux abonnes",
    category: "email",
    status: "ACTIVE",
    lastRunAt: "2024-12-23T14:30:00Z",
    runCount: 1247,
    successRate: 98.5,
  },
  {
    id: "2",
    name: "Abandon Cart Recovery",
    description: "Rappel automatique pour les paniers abandonnes apres 1 heure",
    category: "ecommerce",
    status: "ACTIVE",
    lastRunAt: "2024-12-23T13:45:00Z",
    runCount: 856,
    successRate: 97.2,
  },
  {
    id: "3",
    name: "Lead Nurturing",
    description: "Sequence d'emails educatifs pour convertir les leads en clients",
    category: "crm",
    status: "ACTIVE",
    lastRunAt: "2024-12-23T12:00:00Z",
    runCount: 543,
    successRate: 94.8,
  },
  {
    id: "4",
    name: "NPS Survey",
    description: "Envoie une enquete de satisfaction 30 jours apres achat",
    category: "feedback",
    status: "ACTIVE",
    lastRunAt: "2024-12-22T16:00:00Z",
    runCount: 234,
    successRate: 99.1,
  },
  {
    id: "5",
    name: "Birthday Campaign",
    description: "Email d'anniversaire avec code promo personnalise",
    category: "email",
    status: "PAUSED",
    lastRunAt: "2024-12-15T10:00:00Z",
    runCount: 89,
    successRate: 100,
  },
];

const categoryConfig: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  email: { label: "Email", icon: Mail, color: "text-emerald-400" },
  ecommerce: { label: "E-commerce", icon: ShoppingCart, color: "text-amber-400" },
  crm: { label: "CRM", icon: Users, color: "text-sky-400" },
  feedback: { label: "Feedback", icon: MessageSquare, color: "text-purple-400" },
};

export default function ClientAutomationsPage() {
  const [automations, setAutomations] = useState<ClientAutomation[]>(mockAutomations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === "ACTIVE").length,
    totalRuns: automations.reduce((sum, a) => sum + a.runCount, 0),
    avgSuccess: (
      automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length
    ).toFixed(1),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mes Automations</h1>
        <p className="text-muted-foreground">
          Suivez les performances de vos workflows automatises
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total automations</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
            </div>
            <p className="text-sm text-muted-foreground">Actives</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">{stats.totalRuns.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Executions totales</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{stats.avgSuccess}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Taux succes moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((automation) => {
          const category = categoryConfig[automation.category] || {
            label: automation.category,
            icon: Zap,
            color: "text-primary",
          };
          const CategoryIcon = category.icon;

          return (
            <Card
              key={automation.id}
              className="border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <CategoryIcon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{automation.name}</h3>
                        <Badge
                          className={
                            automation.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {automation.status === "ACTIVE" ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              En pause
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{automation.description}</p>

                      {/* Stats row */}
                      <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          <span>{automation.runCount.toLocaleString()} executions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">{automation.successRate}% succes</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Dernier: {formatDate(automation.lastRunAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Taux de succes</span>
                    <span className="text-emerald-400 font-medium">{automation.successRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all"
                      style={{ width: `${automation.successRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Besoin d&apos;une nouvelle automation?</h3>
              <p className="text-muted-foreground mt-1">
                Contactez notre equipe pour discuter de vos besoins et creer des workflows sur mesure.
              </p>
              <Button className="mt-4" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
