"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
    />
  );
}

// Shimmer effect skeleton
interface ShimmerSkeletonProps {
  className?: string;
}

export function ShimmerSkeleton({ className }: ShimmerSkeletonProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted/30", className)}>
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{
          animationTimingFunction: "ease-in-out",
        }}
      />
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/30 p-6", className)}>
      <div className="flex items-center gap-4">
        <ShimmerSkeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <ShimmerSkeleton className="h-4 w-1/3" />
          <ShimmerSkeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <ShimmerSkeleton className="h-3 w-full" />
        <ShimmerSkeleton className="h-3 w-4/5" />
        <ShimmerSkeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Stat card skeleton
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/30 p-6", className)}>
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-10 w-10 rounded-lg" />
        <ShimmerSkeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <ShimmerSkeleton className="h-8 w-20" />
        <ShimmerSkeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border/50 bg-muted/20">
        {Array.from({ length: cols }).map((_, i) => (
          <ShimmerSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-border/30 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 flex-1 relative overflow-hidden rounded-md bg-muted/30"
              style={{ opacity: 1 - rowIndex * 0.1 }}
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/30 p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-5 w-32" />
          <ShimmerSkeleton className="h-3 w-48" />
        </div>
        <ShimmerSkeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="h-64 flex items-end gap-2 pt-4">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t relative overflow-hidden bg-muted/30"
            style={{ height: `${height}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Avatar skeleton
export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return <ShimmerSkeleton className={cn("rounded-full", sizes[size])} />;
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <ShimmerSkeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-4 w-1/3" />
        <ShimmerSkeleton className="h-3 w-1/2" />
      </div>
      <ShimmerSkeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}
