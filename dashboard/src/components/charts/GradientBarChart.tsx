"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface GradientBarChartProps {
  data: DataPoint[];
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  horizontal?: boolean;
  className?: string;
  barRadius?: number;
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

export function GradientBarChart({
  data,
  dataKey = "value",
  xAxisKey = "name",
  color = "#4FBAF1",
  height = 300,
  showGrid = true,
  showAxis = true,
  horizontal = false,
  className,
  barRadius = 4,
}: GradientBarChartProps) {
  const gradientId = `bar-gradient-${dataKey}`;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={!horizontal}
              horizontal={horizontal}
            />
          )}

          {showAxis && (
            horizontal ? (
              <>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis dataKey={xAxisKey} type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
              </>
            )
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />

          <Bar
            dataKey={dataKey}
            fill={`url(#${gradientId})`}
            radius={[barRadius, barRadius, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Stacked bar chart
interface StackedBarChartProps {
  data: DataPoint[];
  bars: Array<{
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

export function StackedBarChart({
  data,
  bars,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showAxis = true,
  className,
}: StackedBarChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />

          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              stackId="stack"
              fill={bar.color}
              radius={index === bars.length - 1 ? [4, 4, 0, 0] : 0}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Colored bars based on value
interface ColoredBarChartProps extends Omit<GradientBarChartProps, "color"> {
  colors?: string[];
  threshold?: number;
  aboveColor?: string;
  belowColor?: string;
}

export function ColoredBarChart({
  data,
  dataKey = "value",
  xAxisKey = "name",
  colors = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"],
  threshold,
  aboveColor = "#10B981",
  belowColor = "#EF4444",
  height = 300,
  showGrid = true,
  showAxis = true,
  className,
}: ColoredBarChartProps) {
  const getColor = (value: number, index: number) => {
    if (threshold !== undefined) {
      return value >= threshold ? aboveColor : belowColor;
    }
    return colors[index % colors.length];
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />

          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry[dataKey] as number, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
