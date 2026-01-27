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
  Chrome,
  ExternalLink,
  RefreshCw,
  Unlink,
  CheckCircle2,
  XCircle,
  BarChart3,
  Search,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface GoogleServices {
  analytics?: boolean;
  searchConsole?: boolean;
  calendar?: boolean;
  ads?: boolean;
}

interface GoogleIntegration {
  enabled: boolean;
  connected_at?: string;
  user_email?: string;
  user_id?: string;
  user_name?: string;
  scopes?: string[];
  token_expires_at?: string;
  services?: GoogleServices;
  disconnect_reason?: string;
}

interface GoogleConnectProps {
  tenantId?: string;
  integration?: GoogleIntegration;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
  defaultScopes?: "analytics" | "searchConsole" | "calendar" | "full";
}

export function GoogleConnect({
  tenantId,
  integration,
  onConnect,
  onDisconnect,
  onRefresh,
  defaultScopes = "analytics",
}: GoogleConnectProps) {
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

  const handleConnect = async (scopes?: string) => {
    if (!tenantId) {
      setError("Tenant ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Redirect to OAuth flow
      const params = new URLSearchParams({
        tenant_id: tenantId,
        scopes: scopes || defaultScopes,
      });
      window.location.href = `/api/auth/oauth/google/authorize?${params}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrations: {
            google: {
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

    if (success === "google") {
      window.history.replaceState({}, "", window.location.pathname);
      onRefresh?.();
    }

    if (errorParam && (message?.toLowerCase().includes("google") || success === null)) {
      setError(message || errorParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [onRefresh]);

  // Service status icon
  const ServiceIcon = ({ enabled }: { enabled?: boolean }) =>
    enabled ? (
      <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
    ) : (
      <XCircle className="h-3 w-3 text-gray-500 ml-auto" />
    );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Chrome className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google
                <IntegrationDot state={state} />
              </CardTitle>
              <CardDescription>
                Analytics, Search Console, Calendar
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
                  <p className="font-medium">{integration.user_name || "Google Account"}</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.user_email}
                  </p>
                </div>
                <a
                  href="https://myaccount.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Account
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Connected scopes */}
              {integration.scopes && integration.scopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {integration.scopes.slice(0, 4).map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope}
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

            {/* Services status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Analytics</span>
                <ServiceIcon enabled={integration.services?.analytics} />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Search Console</span>
                <ServiceIcon enabled={integration.services?.searchConsole} />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Calendar</span>
                <ServiceIcon enabled={integration.services?.calendar} />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Ads</span>
                <ServiceIcon enabled={integration.services?.ads} />
              </div>
            </div>

            {/* Add more services button */}
            {!integration.services?.searchConsole || !integration.services?.calendar ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect("full")}
                disabled={loading}
                className="w-full"
              >
                Add More Services
              </Button>
            ) : null}

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
          // Disconnected state - show connect options
          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google account to enable analytics and automation.
              </p>
            </div>

            {/* Connect options */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect("analytics")}
                disabled={loading}
                className="flex-col h-auto py-3"
              >
                <BarChart3 className="h-5 w-5 mb-1" />
                <span className="text-xs">Analytics</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect("searchConsole")}
                disabled={loading}
                className="flex-col h-auto py-3"
              >
                <Search className="h-5 w-5 mb-1" />
                <span className="text-xs">Search Console</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect("calendar")}
                disabled={loading}
                className="flex-col h-auto py-3"
              >
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs">Calendar</span>
              </Button>
              <Button
                size="sm"
                onClick={() => handleConnect("full")}
                disabled={loading}
                className="flex-col h-auto py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Chrome className="h-5 w-5 mb-1" />
                <span className="text-xs">All Services</span>
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Traffic analytics
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                SEO insights
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Booking sync
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Conversion tracking
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
