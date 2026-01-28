"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface GradientAreaChartProps {
  data: DataPoint[];
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  className?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

export function GradientAreaChart({
  data,
  dataKey = "value",
  xAxisKey = "name",
  color = "#4FBAF1",
  gradientFrom,
  gradientTo,
  height = 300,
  showGrid = true,
  showAxis = true,
  className,
}: GradientAreaChartProps) {
  const gradientId = `gradient-${dataKey}`;
  const fromColor = gradientFrom || color;
  const toColor = gradientTo || "transparent";

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fromColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={toColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dx={-10}
                tickFormatter={(value) => value.toLocaleString()}
              />
            </>
          )}

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Multi-line area chart
interface MultiAreaChartProps {
  data: DataPoint[];
  lines: Array<{
    dataKey: string;
    color: string;
    name?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  className?: string;
}

export function MultiAreaChart({
  data,
  lines,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showAxis = true,
  className,
}: MultiAreaChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient
                key={line.dataKey}
                id={`gradient-${line.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dx={-10}
              />
            </>
          )}

          <Tooltip content={<CustomTooltip />} />

          {lines.map((line) => (
            <Area
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              fill={`url(#gradient-${line.dataKey})`}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
