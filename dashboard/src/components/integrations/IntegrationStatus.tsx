"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react";

export type IntegrationState =
  | "connected"
  | "disconnected"
  | "pending"
  | "error"
  | "loading";

interface IntegrationStatusProps {
  state: IntegrationState;
  connectedAt?: string;
  errorMessage?: string;
  compact?: boolean;
}

const statusConfig: Record<
  IntegrationState,
  {
    label: string;
    color: string;
    icon: typeof CheckCircle2;
    description: string;
  }
> = {
  connected: {
    label: "Connected",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
    description: "Integration is active and working",
  },
  disconnected: {
    label: "Not Connected",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: XCircle,
    description: "Click to connect this integration",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
    description: "Connection in progress",
  },
  error: {
    label: "Error",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertCircle,
    description: "Connection failed",
  },
  loading: {
    label: "Loading",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Loader2,
    description: "Checking status",
  },
};

export function IntegrationStatus({
  state,
  connectedAt,
  errorMessage,
  compact = false,
}: IntegrationStatusProps) {
  const config = statusConfig[state];
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge className={config.color}>
        <Icon
          className={`h-3 w-3 mr-1 ${state === "loading" ? "animate-spin" : ""}`}
        />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={config.color}>
        <Icon
          className={`h-3 w-3 mr-1 ${state === "loading" ? "animate-spin" : ""}`}
        />
        {config.label}
      </Badge>

      {state === "connected" && connectedAt && (
        <span className="text-xs text-muted-foreground">
          since {new Date(connectedAt).toLocaleDateString()}
        </span>
      )}

      {state === "error" && errorMessage && (
        <span className="text-xs text-red-400">{errorMessage}</span>
      )}
    </div>
  );
}

// Export status indicator as dot
export function IntegrationDot({ state }: { state: IntegrationState }) {
  const colors: Record<IntegrationState, string> = {
    connected: "bg-emerald-400",
    disconnected: "bg-gray-400",
    pending: "bg-amber-400 animate-pulse",
    error: "bg-red-400",
    loading: "bg-blue-400 animate-pulse",
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[state]}`}
      title={statusConfig[state].description}
    />
  );
}
