"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IntegrationStatus,
  IntegrationDot,
  type IntegrationState,
} from "./IntegrationStatus";
import {
  Mail,
  ExternalLink,
  RefreshCw,
  Unlink,
  CheckCircle2,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";

interface KlaviyoIntegration {
  enabled: boolean;
  connected_at?: string;
  account_id?: string;
  account_name?: string;
  default_email?: string;
  timezone?: string;
  scopes?: string[];
  token_expires_at?: string;
  disconnect_reason?: string;
}

interface KlaviyoConnectProps {
  tenantId?: string;
  integration?: KlaviyoIntegration;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

export function KlaviyoConnect({
  tenantId,
  integration,
  onConnect,
  onDisconnect,
  onRefresh,
}: KlaviyoConnectProps) {
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
    if (!tenantId) {
      setError("Tenant ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Redirect to OAuth flow
      const params = new URLSearchParams({ tenant_id: tenantId });
      window.location.href = `/api/auth/oauth/klaviyo/authorize?${params}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Klaviyo?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrations: {
            klaviyo: {
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

    if (success === "klaviyo") {
      window.history.replaceState({}, "", window.location.pathname);
      onRefresh?.();
    }

    if (errorParam && message?.toLowerCase().includes("klaviyo")) {
      setError(message || errorParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [onRefresh]);

  // Check if token is expiring soon
  const isTokenExpiringSoon = integration?.token_expires_at
    ? new Date(integration.token_expires_at).getTime() - Date.now() < 86400000 // 24h
    : false;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Mail className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Klaviyo
                <IntegrationDot state={state} />
              </CardTitle>
              <CardDescription>
                Email & SMS marketing automation
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
            {/* Account info */}
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{integration.account_name || "Klaviyo Account"}</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.default_email || integration.account_id}
                  </p>
                  {integration.timezone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Timezone: {integration.timezone}
                    </p>
                  )}
                </div>
                <a
                  href="https://www.klaviyo.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Open Klaviyo
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Token expiry warning */}
              {isTokenExpiringSoon && (
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">
                    Token expires soon. It will be refreshed automatically.
                  </p>
                </div>
              )}

              {/* Scopes */}
              {integration.scopes && integration.scopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {integration.scopes.slice(0, 4).map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope.split(":")[0]}
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
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Profiles</span>
                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Flows</span>
                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Metrics</span>
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
          // Disconnected state - show connect button
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Klaviyo account to enable email and SMS marketing automations.
              </p>
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Connect Klaviyo
              </Button>
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
                Email campaigns
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                SMS automation
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Flow triggers
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Segmentation
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
