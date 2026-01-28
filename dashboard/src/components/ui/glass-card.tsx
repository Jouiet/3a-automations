"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlowColor = "cyan" | "magenta" | "primary" | "success" | "error" | "none";
type GlassIntensity = "light" | "medium" | "heavy";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  glow?: GlowColor;
  intensity?: GlassIntensity;
  animated?: boolean;
  hoverScale?: boolean;
  hoverGlow?: boolean;
}

const glowStyles: Record<GlowColor, string> = {
  cyan: "shadow-[0_0_30px_rgba(0,255,255,0.15)]",
  magenta: "shadow-[0_0_30px_rgba(255,0,255,0.15)]",
  primary: "shadow-[0_0_30px_rgba(79,186,241,0.2)]",
  success: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
  error: "shadow-[0_0_30px_rgba(239,68,68,0.2)]",
  none: "",
};

const hoverGlowStyles: Record<GlowColor, string> = {
  cyan: "hover:shadow-[0_0_40px_rgba(0,255,255,0.25)]",
  magenta: "hover:shadow-[0_0_40px_rgba(255,0,255,0.25)]",
  primary: "hover:shadow-[0_0_40px_rgba(79,186,241,0.3)]",
  success: "hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]",
  error: "hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]",
  none: "",
};

const intensityStyles: Record<GlassIntensity, string> = {
  light: "bg-slate-900/30 backdrop-blur-md border-slate-700/30",
  medium: "bg-slate-900/50 backdrop-blur-lg border-slate-700/50",
  heavy: "bg-slate-900/70 backdrop-blur-xl border-slate-700/70",
};

export function GlassCard({
  children,
  className,
  glow = "none",
  intensity = "medium",
  animated = true,
  hoverScale = false,
  hoverGlow = false,
  ...props
}: GlassCardProps) {
  const animationProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
      }
    : {};

  const hoverProps = (hoverScale || hoverGlow)
    ? {
        whileHover: {
          ...(hoverScale && { scale: 1.02 }),
        },
      }
    : {};

  return (
    <motion.div
      {...animationProps}
      {...hoverProps}
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        intensityStyles[intensity],
        glowStyles[glow],
        hoverGlow && hoverGlowStyles[glow],
        "hover:border-slate-600/50",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Header component for consistent card headers
interface GlassCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardHeader({ children, className }: GlassCardHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-slate-700/50", className)}>
      {children}
    </div>
  );
}

// Content component
interface GlassCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardContent({ children, className }: GlassCardContentProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

// Footer component
interface GlassCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardFooter({ children, className }: GlassCardFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-slate-700/50", className)}>
      {children}
    </div>
  );
}
