"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, PercentageRing } from "@/components/ui/animated-number";
import { StatusPulse } from "@/components/ui/status-pulse";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  Mail,
  BarChart,
  Search,
  DollarSign,
  CreditCard,
  MessageCircle,
  Mic,
  Brain,
  Cpu,
  Zap,
  Globe,
  Phone,
  Package,
  Truck,
  Video,
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
  byCategory: Record<string, { total: number; connected: number }>;
}

const ICON_MAP: Record<string, React.ElementType> = {
  "shopping-bag": ShoppingBag,
  "mail": Mail,
  "bar-chart": BarChart,
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
  "sparkles": Zap,
  "globe": Globe,
  "phone": Phone,
  "package": Package,
  "truck": Truck,
};

const STATUS_CONFIG = {
  connected: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
    label: "Connecte",
  },
  partial: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: AlertCircle,
    label: "Partiel",
  },
  disconnected: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    icon: XCircle,
    label: "Deconnecte",
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: AlertCircle,
    label: "Erreur",
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/integrations");

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      if (data.success && data.data) {
        setIntegrations(data.data.integrations || []);
        setStats(data.data.stats || null);
      }

      setLastRefresh(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching integrations:", err);
      setError("Erreur de chargement des integrations");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchData();
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, int) => {
    if (!acc[int.category]) acc[int.category] = [];
    acc[int.category].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  const categoryLabels: Record<string, string> = {
    ecommerce: "E-Commerce",
    marketing: "Marketing",
    analytics: "Analytics",
    seo: "SEO",
    advertising: "Publicite",
    payments: "Paiements",
    messaging: "Messagerie",
    voice: "Voice AI",
    ai: "Intelligence Artificielle",
    automation: "Automation",
    suppliers: "Fournisseurs",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
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
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Statut des connexions en temps reel (source: credentials .env)
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

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  <AnimatedNumber value={stats.total} />
                </p>
                <p className="text-sm text-muted-foreground">Integrations</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Actif</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-emerald-400">
                  <AnimatedNumber value={stats.connected} />
                </p>
                <p className="text-sm text-muted-foreground">Connectees</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="text-xs text-muted-foreground">Partiel</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-amber-400">
                  <AnimatedNumber value={stats.partial} />
                </p>
                <p className="text-sm text-muted-foreground">Partielles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <XCircle className="h-5 w-5 text-slate-400" />
                <PercentageRing
                  value={stats.connectionScore}
                  size={36}
                  strokeWidth={3}
                  color={stats.connectionScore >= 70 ? "#10B981" : stats.connectionScore >= 40 ? "#F59E0B" : "#EF4444"}
                />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  <AnimatedNumber value={stats.connectionScore} suffix="%" />
                </p>
                <p className="text-sm text-muted-foreground">Score connexion</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations by Category */}
      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {categoryLabels[category] || category}
            <Badge variant="secondary" className="text-xs">
              {categoryIntegrations.filter(i => i.status === "connected").length}/
              {categoryIntegrations.length}
            </Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryIntegrations.map((integration) => {
              const statusConfig = STATUS_CONFIG[integration.status];
              const IconComponent = ICON_MAP[integration.icon] || Globe;
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={integration.id}
                  className={`border-border/50 hover:border-primary/30 transition-colors ${
                    integration.status === "connected" ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                          <IconComponent className={`h-5 w-5 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.message}</p>
                        </div>
                      </div>
                      <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Setup Guide */}
      <Card className="border-border/50 bg-muted/10">
        <CardHeader>
          <CardTitle>Guide de Configuration</CardTitle>
          <CardDescription>
            Les integrations non connectees necessitent des credentials dans le fichier .env
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-medium mb-2">Integrations Prioritaires</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  META_ACCESS_TOKEN - Meta Ads tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  STRIPE_SECRET_KEY - Paiements clients
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  TELNYX_API_KEY - Voice telephony
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-medium mb-2">Documentation</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Meta Business Portal
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Stripe Dashboard
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://portal.telnyx.com" target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Telnyx Portal
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
