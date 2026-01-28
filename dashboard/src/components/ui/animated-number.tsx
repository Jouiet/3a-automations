"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatter,
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    duration: duration,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => {
    if (formatter) {
      return formatter(current);
    }
    return current.toFixed(decimals);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Counter with animate on scroll/view
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  animateOnView?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  animateOnView = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animateOnView) {
      animateValue();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          animateValue();
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, animateOnView, hasAnimated]);

  const animateValue = () => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(easedProgress * value);

      if (now < endTime) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(tick);
  };

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

// Percentage counter with ring
interface PercentageRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  duration?: number;
}

export function PercentageRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  color = "#4FBAF1",
  showLabel = true,
  duration = 1500,
}: PercentageRingProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: `stroke-dashoffset ${duration}ms ease-out`,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedCounter
            value={value}
            suffix="%"
            className="text-2xl font-bold"
            duration={duration}
          />
        </div>
      )}
    </div>
  );
}
