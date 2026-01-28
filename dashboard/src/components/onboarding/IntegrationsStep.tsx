"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Mail,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { VerticalType } from "./VerticalStep";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof ShoppingBag;
  color: string;
  bgColor: string;
  required?: boolean;
  requiredFor?: VerticalType[];
  authType: "oauth" | "apikey";
  endpoint?: string;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Connect your e-commerce store",
    icon: ShoppingBag,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    required: true,
    requiredFor: ["shopify"],
    authType: "oauth",
    endpoint: "/api/auth/oauth/shopify/authorize",
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Email marketing automation",
    icon: Mail,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    required: true,
    requiredFor: ["shopify", "b2b"],
    authType: "oauth",
    endpoint: "/api/auth/oauth/klaviyo/authorize",
  },
  {
    id: "google",
    name: "Google Analytics",
    description: "Traffic and conversion analytics",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    requiredFor: ["shopify", "b2b", "custom"],
    authType: "oauth",
    endpoint: "/api/auth/oauth/google/authorize",
  },
];

export interface IntegrationState {
  id: string;
  connected: boolean;
  loading: boolean;
  error?: string;
  connectedAt?: string;
}

interface IntegrationsStepProps {
  vertical: VerticalType | null;
  integrations: Record<string, IntegrationState>;
  onConnect: (integrationId: string) => void;
  onSkip?: () => void;
  tenantId?: string;
}

export function IntegrationsStep({
  vertical,
  integrations,
  onConnect,
  tenantId,
}: IntegrationsStepProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [shopError, setShopError] = useState<string | null>(null);

  const relevantIntegrations = INTEGRATIONS.filter(
    (int) => !int.requiredFor || !vertical || int.requiredFor.includes(vertical)
  );

  const handleShopifyConnect = () => {
    if (!shopDomain) {
      setShopError("Please enter your Shopify store domain");
      return;
    }

    let shop = shopDomain.trim().toLowerCase();
    if (!shop.includes(".myshopify.com")) {
      shop = `${shop}.myshopify.com`;
    }

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      setShopError("Invalid domain. Use: yourstore.myshopify.com");
      return;
    }

    setShopError(null);
    const params = new URLSearchParams({ shop });
    if (tenantId) params.set("tenant_id", tenantId);
    window.location.href = `/api/auth/oauth/shopify/authorize?${params}`;
  };

  const handleOAuthConnect = (integration: IntegrationConfig) => {
    if (integration.id === "shopify") {
      return; // Handled separately
    }
    const params = new URLSearchParams();
    if (tenantId) params.set("tenant_id", tenantId);
    if (integration.id === "google") {
      params.set("scopes", "analytics,webmasters");
    }
    window.location.href = `${integration.endpoint}?${params}`;
  };

  const connectedCount = Object.values(integrations).filter((i) => i.connected).length;
  const totalRequired = relevantIntegrations.filter(
    (i) => i.requiredFor?.includes(vertical || "shopify")
  ).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect Your Services</h2>
        <p className="text-muted-foreground">
          Link your accounts to enable automations. You can always add more later.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant={connectedCount >= totalRequired ? "default" : "secondary"}>
            {connectedCount}/{relevantIntegrations.length} connected
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {relevantIntegrations.map((integration) => {
          const state = integrations[integration.id];
          const isConnected = state?.connected || false;
          const isLoading = state?.loading || false;
          const error = state?.error;
          const isRequired = integration.requiredFor?.includes(vertical || "shopify");
          const Icon = integration.icon;

          return (
            <Card
              key={integration.id}
              className={cn(
                "transition-all",
                isConnected ? "border-green-500/30" : "border-border/50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", integration.bgColor)}>
                      <Icon className={cn("h-5 w-5", integration.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {integration.name}
                        {isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Not connected
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {isConnected ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-muted-foreground">
                        Connected {state?.connectedAt ? `on ${new Date(state.connectedAt).toLocaleDateString()}` : "successfully"}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" asChild>
                      <a href={`/client/integrations`}>
                        Manage
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                ) : integration.id === "shopify" ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="yourstore.myshopify.com"
                        value={shopDomain}
                        onChange={(e) => {
                          setShopDomain(e.target.value);
                          setShopError(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleShopifyConnect()}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button onClick={handleShopifyConnect} disabled={isLoading}>
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                    {shopError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {shopError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleOAuthConnect(integration)}
                      disabled={isLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icon className={cn("h-4 w-4 mr-2", integration.color)} />
                      )}
                      Connect {integration.name}
                    </Button>
                    {error && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
