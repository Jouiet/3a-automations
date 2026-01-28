"use client";

import { cn } from "@/lib/utils";

type StatusType = "healthy" | "warning" | "error" | "offline" | "pending";

interface StatusPulseProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const statusColors: Record<StatusType, { dot: string; pulse: string; label: string }> = {
  healthy: {
    dot: "bg-emerald-400",
    pulse: "bg-emerald-400/75",
    label: "Healthy",
  },
  warning: {
    dot: "bg-amber-400",
    pulse: "bg-amber-400/75",
    label: "Warning",
  },
  error: {
    dot: "bg-red-400",
    pulse: "bg-red-400/75",
    label: "Error",
  },
  offline: {
    dot: "bg-slate-400",
    pulse: "bg-slate-400/75",
    label: "Offline",
  },
  pending: {
    dot: "bg-blue-400",
    pulse: "bg-blue-400/75",
    label: "Pending",
  },
};

const sizes = {
  sm: { dot: "h-2 w-2", pulse: "h-2 w-2", text: "text-xs" },
  md: { dot: "h-3 w-3", pulse: "h-3 w-3", text: "text-sm" },
  lg: { dot: "h-4 w-4", pulse: "h-4 w-4", text: "text-base" },
};

export function StatusPulse({
  status,
  size = "md",
  showLabel = false,
  label,
  className,
}: StatusPulseProps) {
  const colors = statusColors[status];
  const sizeClasses = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex">
        {/* Pulse animation (only for active states) */}
        {status !== "offline" && (
          <span
            className={cn(
              "absolute inline-flex rounded-full opacity-75 animate-ping",
              sizeClasses.pulse,
              colors.pulse
            )}
          />
        )}
        {/* Static dot */}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            sizeClasses.dot,
            colors.dot
          )}
        />
      </span>
      {showLabel && (
        <span className={cn("text-muted-foreground", sizeClasses.text)}>
          {label || colors.label}
        </span>
      )}
    </div>
  );
}

// Status badge with background
interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colors = statusColors[status];

  const bgColors: Record<StatusType, string> = {
    healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    offline: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
        bgColors[status],
        className
      )}
    >
      <StatusPulse status={status} size="sm" />
      <span>{label || colors.label}</span>
    </div>
  );
}

// Inline status indicator
interface StatusDotProps {
  status: StatusType;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const colors = statusColors[status];

  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", colors.dot, className)}
    />
  );
}
