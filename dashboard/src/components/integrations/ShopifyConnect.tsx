"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IntegrationStatus,
  IntegrationDot,
  type IntegrationState,
} from "./IntegrationStatus";
import {
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Unlink,
  CheckCircle2,
  Package,
  Users,
  ShoppingCart,
} from "lucide-react";

interface ShopifyIntegration {
  enabled: boolean;
  connected_at?: string;
  shop_domain?: string;
  shop_name?: string;
  scopes?: string[];
  disconnect_reason?: string;
}

interface ShopifyConnectProps {
  tenantId?: string;
  integration?: ShopifyIntegration;
  onConnect?: (shop: string) => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

export function ShopifyConnect({
  tenantId,
  integration,
  onConnect,
  onDisconnect,
  onRefresh,
}: ShopifyConnectProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine connection state
  const state: IntegrationState = loading
    ? "loading"
    : integration?.enabled
      ? "connected"
      : error
        ? "error"
        : "disconnected";

  const handleConnect = async () => {
    if (!shopDomain) {
      setError("Please enter your Shopify store domain");
      return;
    }

    // Normalize shop domain
    let shop = shopDomain.trim().toLowerCase();
    if (!shop.includes(".myshopify.com")) {
      shop = `${shop}.myshopify.com`;
    }

    // Validate format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      setError("Invalid shop domain. Use format: yourstore.myshopify.com");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Redirect to OAuth flow
      const params = new URLSearchParams({
        shop,
        ...(tenantId && { tenant_id: tenantId }),
      });

      window.location.href = `/api/auth/oauth/shopify/authorize?${params}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Shopify?")) {
      return;
    }

    setLoading(true);
    try {
      // Call disconnect API
      const response = await fetch(`/api/clients/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrations: {
            shopify: {
              enabled: false,
              disconnected_at: new Date().toISOString(),
            },
          },
        }),
      });

      if (response.ok) {
        onDisconnect?.();
        onRefresh?.();
      } else {
        setError("Failed to disconnect");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const errorParam = params.get("error");
    const message = params.get("message");

    if (success === "shopify") {
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
      onRefresh?.();
    }

    if (errorParam) {
      setError(message || errorParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [onRefresh]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <ShoppingBag className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Shopify
                <IntegrationDot state={state} />
              </CardTitle>
              <CardDescription>
                Connect your Shopify store for automation
              </CardDescription>
            </div>
          </div>
          <IntegrationStatus
            state={state}
            connectedAt={integration?.connected_at}
            errorMessage={error || undefined}
            compact
          />
        </div>
      </CardHeader>

      <CardContent>
        {state === "connected" && integration ? (
          // Connected state
          <div className="space-y-4">
            {/* Shop info */}
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{integration.shop_name || "Your Store"}</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.shop_domain}
                  </p>
                </div>
                <a
                  href={`https://${integration.shop_domain}/admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Open Admin
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Scopes */}
              {integration.scopes && integration.scopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {integration.scopes.slice(0, 4).map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope.replace("read_", "").replace("write_", "")}
                    </Badge>
                  ))}
                  {integration.scopes.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{integration.scopes.length - 4} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Features enabled */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Products</span>
                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Orders</span>
                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Customers</span>
                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          // Disconnected state - show connect form
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Domain</label>
              <div className="flex gap-2">
                <Input
                  placeholder="yourstore.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => {
                    setShopDomain(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  disabled={loading}
                />
                <Button onClick={handleConnect} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your Shopify store domain (e.g., yourstore or yourstore.myshopify.com)
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Product sync
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Order automation
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Customer insights
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Inventory alerts
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
