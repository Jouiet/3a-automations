"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { StatusPulse } from "@/components/ui/status-pulse";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Play,
  Loader2,
  ShoppingBag,
  Mail,
  BarChart,
  TrendingUp,
  Globe,
  Search,
  FileText,
  Mic,
  DollarSign,
  Truck,
  Video,
  Smartphone,
} from "lucide-react";

interface Sensor {
  id: string;
  name: string;
  category: string;
  status: "ok" | "warning" | "error" | "blocked" | "unknown";
  message: string;
  lastCheck: string;
  latency?: number;
}

interface SensorStats {
  ok: number;
  warning: number;
  error: number;
  blocked: number;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ecommerce: ShoppingBag,
  marketing: Mail,
  analytics: BarChart,
  sales: TrendingUp,
  seo: Search,
  research: Globe,
  content: FileText,
  voice: Mic,
  operations: DollarSign,
  advertising: Video,
  messaging: Smartphone,
};

const STATUS_CONFIG = {
  ok: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "OK",
    icon: CheckCircle2,
  },
  warning: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Warning",
    icon: AlertCircle,
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Error",
    icon: XCircle,
  },
  blocked: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    label: "Blocked",
    icon: XCircle,
  },
  unknown: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    label: "Unknown",
    icon: AlertCircle,
  },
};

export default function SensorsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [stats, setStats] = useState<SensorStats | null>(null);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningHealth, setIsRunningHealth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async (runHealth = false) => {
    try {
      setError(null);
      const url = runHealth ? "/api/sensors" : "/api/sensors?quick=true";
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      if (data.success && data.data) {
        setSensors(data.data.sensors || []);
        setStats(data.data.stats || null);
        setByCategory(data.data.byCategory || {});
      }

      setLastRefresh(new Date());
      setIsLoading(false);
      setIsRunningHealth(false);
    } catch (err) {
      console.error("Error fetching sensors:", err);
      setError("Erreur de chargement des sensors");
      setIsLoading(false);
      setIsRunningHealth(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchData();
  };

  const handleRunHealthChecks = () => {
    setIsRunningHealth(true);
    fetchData(true);
  };

  // Group sensors by category
  const groupedSensors = sensors.reduce((acc, sensor) => {
    if (!acc[sensor.category]) acc[sensor.category] = [];
    acc[sensor.category].push(sensor);
    return acc;
  }, {} as Record<string, Sensor[]>);

  const categoryLabels: Record<string, string> = {
    ecommerce: "E-Commerce",
    marketing: "Marketing",
    analytics: "Analytics",
    sales: "Sales",
    seo: "SEO",
    research: "Research",
    content: "Content",
    voice: "Voice AI",
    operations: "Operations",
    advertising: "Advertising",
    messaging: "Messaging",
  };

  // Calculate health score
  const healthScore = stats
    ? Math.round(((stats.ok + stats.warning * 0.5) / sensors.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sensors GPM</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sensors GPM</h1>
          <p className="text-muted-foreground">
            Global Pressure Matrix - {sensors.length} capteurs en temps reel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {lastRefresh.toLocaleTimeString("fr-FR")}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={handleRunHealthChecks}
            disabled={isRunningHealth}
          >
            {isRunningHealth ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verification...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Health Checks
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Radio className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{sensors.length}</Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                <AnimatedNumber value={sensors.length} />
              </p>
              <p className="text-sm text-muted-foreground">Total Sensors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <StatusPulse status="healthy" size="sm" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-emerald-400">
                <AnimatedNumber value={stats?.ok || 0} />
              </p>
              <p className="text-sm text-muted-foreground">Operationnels</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <StatusPulse status="warning" size="sm" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-amber-400">
                <AnimatedNumber value={stats?.warning || 0} />
              </p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-400" />
              <StatusPulse status="error" size="sm" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-red-400">
                <AnimatedNumber value={(stats?.error || 0) + (stats?.blocked || 0)} />
              </p>
              <p className="text-sm text-muted-foreground">Bloques/Erreurs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-primary">
                <AnimatedNumber value={healthScore} suffix="%" />
              </p>
              <p className="text-sm text-muted-foreground">Health Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensors by Category */}
      {Object.entries(groupedSensors).map(([category, categorySensors]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Radio;
        const okCount = categorySensors.filter(s => s.status === "ok").length;

        return (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-primary" />
              {categoryLabels[category] || category}
              <Badge
                variant={okCount === categorySensors.length ? "default" : "secondary"}
                className="text-xs"
              >
                {okCount}/{categorySensors.length}
              </Badge>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categorySensors.map((sensor) => {
                const statusConfig = STATUS_CONFIG[sensor.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={sensor.id}
                    className={`border ${statusConfig.border} hover:border-primary/30 transition-colors`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                            <p className="font-medium text-sm truncate">{sensor.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {sensor.message}
                          </p>
                          {sensor.latency && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Latence: {sensor.latency}ms
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Blocked Sensors Info */}
      {stats && (stats.blocked > 0 || stats.error > 0) && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Sensors Bloques
            </CardTitle>
            <CardDescription>
              Ces sensors necessitent des credentials supplementaires dans .env
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {sensors
                .filter(s => s.status === "blocked" || s.status === "error")
                .map(sensor => (
                  <div
                    key={sensor.id}
                    className="p-3 rounded-lg bg-background/50 border border-border/30"
                  >
                    <p className="font-medium text-sm">{sensor.name}</p>
                    <p className="text-xs text-muted-foreground">{sensor.message}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
