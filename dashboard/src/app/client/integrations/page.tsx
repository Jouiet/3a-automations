"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Mail,
  BarChart3,
  Building2,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Settings,
  Plus,
  Zap,
} from "lucide-react";
import { ShopifyConnect } from "@/components/integrations/ShopifyConnect";
import { KlaviyoConnect } from "@/components/integrations/KlaviyoConnect";
import { GoogleConnect } from "@/components/integrations/GoogleConnect";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof ShoppingBag;
  color: string;
  bgColor: string;
  category: "ecommerce" | "marketing" | "analytics" | "crm";
  available: boolean;
  enabled?: boolean;
  connected_at?: string;
  status?: "connected" | "disconnected" | "error" | "pending";
  errorMessage?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "E-commerce platform connection",
    icon: ShoppingBag,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    category: "ecommerce",
    available: true,
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Email & SMS marketing",
    icon: Mail,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    category: "marketing",
    available: true,
  },
  {
    id: "google",
    name: "Google",
    description: "Analytics, Search Console, Calendar",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    category: "analytics",
    available: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM & Sales automation",
    icon: Building2,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    category: "crm",
    available: false,
  },
  {
    id: "meta",
    name: "Meta",
    description: "Facebook & Instagram Ads",
    icon: Globe,
    color: "text-blue-500",
    bgColor: "bg-blue-600/20",
    category: "marketing",
    available: false,
  },
];

interface ClientConfig {
  tenant_id?: string;
  integrations?: Record<string, {
    enabled?: boolean;
    connected_at?: string;
    shop_domain?: string;
    shop_name?: string;
    scopes?: string[];
    error?: string;
  }>;
}

export default function IntegrationsPage() {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, {
    status: string;
    latency?: number;
    lastCheck?: string;
  }>>({});

  const tenantId = config?.tenant_id || "agency";

  const fetchConfig = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      let clientTenantId = "agency";

      if (storedUser) {
        const user = JSON.parse(storedUser);
        clientTenantId = user.tenant_id || user.id || "agency";
      }

      const response = await fetch(`/api/clients/${clientTenantId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/health/${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data.integrations || {});
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config?.tenant_id) {
      checkHealth();
    }
  }, [config?.tenant_id, checkHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchConfig(), checkHealth()]);
    setRefreshing(false);
  };

  const getIntegrationStatus = (integrationId: string) => {
    const integration = config?.integrations?.[integrationId];
    if (!integration) return "disconnected";
    if (integration.error) return "error";
    if (integration.enabled) return "connected";
    return "disconnected";
  };

  const connectedCount = INTEGRATIONS.filter(
    (i) => i.available && getIntegrationStatus(i.id) === "connected"
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
                <div className="h-5 w-24 bg-muted rounded mb-2" />
                <div className="h-4 w-32 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your services to enable automations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={connectedCount > 0 ? "default" : "secondary"}>
            {connectedCount} connected
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {INTEGRATIONS.filter((i) => i.available && getIntegrationStatus(i.id) === "disconnected").length}
                </p>
                <p className="text-xs text-muted-foreground">Not Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {INTEGRATIONS.filter((i) => i.available && getIntegrationStatus(i.id) === "error").length}
                </p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {INTEGRATIONS.filter((i) => !i.available).length}
                </p>
                <p className="text-xs text-muted-foreground">Coming Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Integrations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Available Integrations</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Shopify */}
          <ShopifyConnect
            tenantId={tenantId}
            integration={config?.integrations?.shopify as {
              enabled: boolean;
              connected_at?: string;
              shop_domain?: string;
              shop_name?: string;
              scopes?: string[];
            }}
            onRefresh={handleRefresh}
          />

          {/* Klaviyo */}
          <KlaviyoConnect
            tenantId={tenantId}
            integration={config?.integrations?.klaviyo as {
              enabled: boolean;
              connected_at?: string;
              account_id?: string;
              account_name?: string;
            }}
            onRefresh={handleRefresh}
          />

          {/* Google */}
          <GoogleConnect
            tenantId={tenantId}
            integration={config?.integrations?.google as {
              enabled: boolean;
              connected_at?: string;
              email?: string;
              scopes?: string[];
            }}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-muted-foreground">Coming Soon</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.filter((i) => !i.available).map((integration) => {
            const Icon = integration.icon;

            return (
              <Card key={integration.id} className="border-border/30 bg-muted/20 opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", integration.bgColor)}>
                      <Icon className={cn("h-5 w-5", integration.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {integration.name}
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" disabled className="w-full">
                    Notify Me
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Health Status */}
      {Object.keys(healthStatus).length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Integration Health
            </CardTitle>
            <CardDescription>Real-time status of your connected services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(healthStatus).map(([id, status]) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        status.status === "healthy"
                          ? "bg-green-400"
                          : status.status === "degraded"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      )}
                    />
                    <span className="font-medium capitalize">{id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {status.latency && <span>{status.latency}ms</span>}
                    {status.lastCheck && (
                      <span>
                        Last check: {new Date(status.lastCheck).toLocaleTimeString()}
                      </span>
                    )}
                    <Badge
                      variant={status.status === "healthy" ? "default" : "destructive"}
                      className="capitalize"
                    >
                      {status.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
