"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Mail,
  BarChart3,
  Search,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Settings,
  Zap,
  CreditCard,
  MessageCircle,
  Mic,
  Brain,
  Cpu,
  Phone,
  Package,
  Truck,
  Video,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "partial" | "error";
  message: string;
  lastChecked: string;
}

interface IntegrationStats {
  total: number;
  connected: number;
  partial: number;
  disconnected: number;
  connectionScore: number;
}

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  "shopping-bag": ShoppingBag,
  "mail": Mail,
  "bar-chart": BarChart3,
  "search": Search,
  "facebook": Globe,
  "video": Video,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  "message-circle": MessageCircle,
  "mic": Mic,
  "brain": Brain,
  "cpu": Cpu,
  "zap": Zap,
  "sparkles": Sparkles,
  "globe": Globe,
  "phone": Phone,
  "package": Package,
  "truck": Truck,
};

// Category labels and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ecommerce: { label: "E-Commerce", color: "text-green-400", bgColor: "bg-green-500/20" },
  marketing: { label: "Marketing", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  analytics: { label: "Analytics", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  seo: { label: "SEO", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  advertising: { label: "Publicite", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  payments: { label: "Paiements", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  messaging: { label: "Messagerie", color: "text-green-500", bgColor: "bg-green-600/20" },
  voice: { label: "Voice AI", color: "text-pink-400", bgColor: "bg-pink-500/20" },
  ai: { label: "Intelligence Artificielle", color: "text-violet-400", bgColor: "bg-violet-500/20" },
  automation: { label: "Automation", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  suppliers: { label: "Fournisseurs", color: "text-slate-400", bgColor: "bg-slate-500/20" },
};

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "Connecte",
  },
  partial: {
    icon: AlertCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "Partiel",
  },
  disconnected: {
    icon: XCircle,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    label: "Non connecte",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "Erreur",
  },
};

// OAuth-enabled integrations
const OAUTH_INTEGRATIONS: Record<string, string> = {
  shopify: "/api/auth/oauth/shopify/authorize",
  klaviyo: "/api/auth/oauth/klaviyo/authorize",
  google_analytics: "/api/auth/oauth/google/authorize?scope=analytics",
  google_search_console: "/api/auth/oauth/google/authorize?scope=webmasters",
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchIntegrations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/integrations");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setIntegrations(data.data.integrations || []);
        setStats(data.data.stats || null);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || "Failed to fetch integrations");
      }
    } catch (err) {
      console.error("Error fetching integrations:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchIntegrations, 60000);
    return () => clearInterval(interval);
  }, [fetchIntegrations]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchIntegrations();
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, int) => {
    if (!acc[int.category]) acc[int.category] = [];
    acc[int.category].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  // Priority categories for client view
  const priorityCategories = ["ecommerce", "marketing", "analytics", "ai"];
  const otherCategories = Object.keys(groupedIntegrations).filter(
    (cat) => !priorityCategories.includes(cat)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes Integrations</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold">Mes Integrations</h1>
          <Button onClick={handleRefresh} variant="outline">
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
          <h1 className="text-3xl font-bold">Mes Integrations</h1>
          <p className="text-muted-foreground">
            Connectez vos services pour activer les automations
            <span className="text-xs ml-2 opacity-50">
              Maj: {lastRefresh.toLocaleTimeString("fr-FR")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={stats && stats.connected > 0 ? "default" : "secondary"}>
            {stats?.connected || 0} connectees
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.connected}</p>
                  <p className="text-xs text-muted-foreground">Connectees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{stats.partial}</p>
                  <p className="text-xs text-muted-foreground">Partielles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.connectionScore}%</p>
                  <p className="text-xs text-muted-foreground">Score connexion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Priority Integrations - E-commerce, Marketing, Analytics, AI */}
      {priorityCategories.map((category) => {
        const categoryIntegrations = groupedIntegrations[category];
        if (!categoryIntegrations || categoryIntegrations.length === 0) return null;

        const catConfig = CATEGORY_CONFIG[category] || {
          label: category,
          color: "text-primary",
          bgColor: "bg-primary/20",
        };

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${catConfig.color}`} />
              <h2 className="text-lg font-semibold">{catConfig.label}</h2>
              <Badge variant="secondary" className="text-xs">
                {categoryIntegrations.filter((i) => i.status === "connected").length}/
                {categoryIntegrations.length}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryIntegrations.map((integration) => {
                const statusConfig = STATUS_CONFIG[integration.status];
                const IconComponent = ICON_MAP[integration.icon] || Globe;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={integration.id}
                    className={cn(
                      "border transition-all hover:border-primary/30",
                      statusConfig.borderColor,
                      integration.status === "connected" && "bg-emerald-500/5"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", catConfig.bgColor)}>
                            <IconComponent className={cn("h-5 w-5", catConfig.color)} />
                          </div>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {integration.status === "connected" ? "Connecte" : integration.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        {integration.status === "connected" ? (
                          <Button variant="outline" size="sm" className="w-full" disabled>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                            Connecte
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const oauthUrl = OAUTH_INTEGRATIONS[integration.id];
                              if (oauthUrl) {
                                window.location.href = oauthUrl;
                              } else {
                                router.push("/client/support?subject=" + encodeURIComponent("Connexion " + integration.name));
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connecter
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Other Categories (collapsed view) */}
      {otherCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">Autres Integrations</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {otherCategories.flatMap((category) =>
              groupedIntegrations[category].map((integration) => {
                const statusConfig = STATUS_CONFIG[integration.status];
                const IconComponent = ICON_MAP[integration.icon] || Globe;

                return (
                  <Card
                    key={integration.id}
                    className={cn(
                      "border-border/30",
                      integration.status !== "connected" && "opacity-60"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{integration.name}</p>
                        </div>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            integration.status === "connected"
                              ? "bg-emerald-500"
                              : "bg-slate-500"
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Help Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Besoin d&apos;aide pour connecter un service?</h3>
              <p className="text-muted-foreground mt-1">
                Notre equipe peut vous accompagner dans la configuration de vos integrations.
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
