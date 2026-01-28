"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  RefreshCw,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";

interface ClientAutomation {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "DISABLED";
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  ownerId?: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  email: { label: "Email", icon: Mail, color: "text-emerald-400" },
  "email-marketing": { label: "Email Marketing", icon: Mail, color: "text-emerald-400" },
  ecommerce: { label: "E-commerce", icon: ShoppingCart, color: "text-amber-400" },
  shopify: { label: "Shopify", icon: ShoppingCart, color: "text-amber-400" },
  crm: { label: "CRM", icon: Users, color: "text-sky-400" },
  "lead-generation": { label: "Lead Gen", icon: Users, color: "text-sky-400" },
  communication: { label: "Communication", icon: MessageSquare, color: "text-purple-400" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-green-400" },
  "voice-ai": { label: "Voice AI", icon: MessageSquare, color: "text-pink-400" },
  analytics: { label: "Analytics", icon: Activity, color: "text-pink-400" },
  scheduling: { label: "Planification", icon: Calendar, color: "text-orange-400" },
  feedback: { label: "Feedback", icon: MessageSquare, color: "text-purple-400" },
  "content-generation": { label: "Content", icon: Zap, color: "text-violet-400" },
};

export default function ClientAutomationsPage() {
  const [automations, setAutomations] = useState<ClientAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const router = useRouter();

  const fetchAutomations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/automations");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Filter to show only ACTIVE automations for client view
        const activeAutomations = data.data.filter(
          (a: ClientAutomation) => a.status === "ACTIVE" || a.status === "PAUSED"
        );
        setAutomations(activeAutomations);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || "Failed to fetch automations");
      }
    } catch (err) {
      console.error("Error fetching automations:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAutomations, 60000);
    return () => clearInterval(interval);
  }, [fetchAutomations]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const calculateSuccessRate = (automation: ClientAutomation) => {
    if (!automation.runCount || automation.runCount === 0) return 0;
    return ((automation.successCount || 0) / automation.runCount) * 100;
  };

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === "ACTIVE").length,
    totalRuns: automations.reduce((sum, a) => sum + (a.runCount || 0), 0),
    avgSuccess: automations.length > 0
      ? (automations.reduce((sum, a) => sum + calculateSuccessRate(a), 0) / automations.length).toFixed(1)
      : "0.0",
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mes Automations</h1>
          <Button onClick={fetchAutomations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Erreur de connexion</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Automations</h1>
          <p className="text-muted-foreground">
            Suivez les performances de vos workflows automatises
            <span className="text-xs ml-2 opacity-50">
              Maj: {formatDate(lastRefresh.toISOString())}
            </span>
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAutomations}>
          <RefreshCw className="h-4 w-4" />
        </Button>
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
        {automations.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg">Aucune automation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contactez notre equipe pour configurer vos premieres automations
              </p>
              <Button className="mt-4" variant="outline" onClick={() => router.push("/client/support")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
            </CardContent>
          </Card>
        ) : (
          automations.map((automation) => {
            const category = categoryConfig[automation.category] || {
              label: automation.category,
              icon: Zap,
              color: "text-primary",
            };
            const CategoryIcon = category.icon;
            const successRate = calculateSuccessRate(automation);

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
                        <p className="text-muted-foreground mt-1">{automation.description || "No description"}</p>

                        {/* Stats row */}
                        <div className="flex items-center gap-6 mt-4 text-sm">
                          {automation.runCount > 0 && (
                            <>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <BarChart3 className="h-4 w-4" />
                                <span>{automation.runCount.toLocaleString()} executions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-emerald-400">{successRate.toFixed(1)}% succes</span>
                              </div>
                            </>
                          )}
                          {automation.lastRunAt && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Dernier: {formatDate(automation.lastRunAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/client/support?subject=${encodeURIComponent("Details automation: " + automation.name)}`)}>
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>

                  {/* Progress bar - only show if there are runs */}
                  {automation.runCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Taux de succes</span>
                        <span className="text-emerald-400 font-medium">{successRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
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
              <Button className="mt-4" variant="outline" onClick={() => router.push("/client/support")}>
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
