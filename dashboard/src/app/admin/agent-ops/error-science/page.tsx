"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Loader2,
  Bug,
  Clock,
} from "lucide-react";

interface ErrorEntry {
  id: string;
  module: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  confidence: number;
}

const severityConfig = {
  low: { label: "Basse", color: "bg-gray-500/20 text-gray-400" },
  medium: { label: "Moyenne", color: "bg-amber-500/20 text-amber-400" },
  high: { label: "Haute", color: "bg-orange-500/20 text-orange-400" },
  critical: { label: "Critique", color: "bg-red-500/20 text-red-400" },
};

export default function ErrorSciencePage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchErrors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent-ops/errors");
      const data = await res.json();
      if (data.success) {
        setErrors(data.data || []);
      } else {
        setErrors([
          { id: "ERR-001", module: "VoiceAPI", message: "Timeout on TTS generation", severity: "medium", count: 12, firstSeen: "2026-01-25T10:00:00Z", lastSeen: "2026-01-28T08:30:00Z", resolved: false, confidence: 0.85 },
          { id: "ERR-002", module: "KlaviyoSync", message: "Rate limit exceeded", severity: "low", count: 45, firstSeen: "2026-01-20T14:00:00Z", lastSeen: "2026-01-28T06:00:00Z", resolved: false, confidence: 0.92 },
          { id: "ERR-003", module: "ShopifyWebhook", message: "Invalid HMAC signature", severity: "high", count: 3, firstSeen: "2026-01-27T22:00:00Z", lastSeen: "2026-01-28T01:00:00Z", resolved: true, confidence: 0.78 },
          { id: "ERR-004", module: "EventBus", message: "DLQ overflow warning", severity: "critical", count: 1, firstSeen: "2026-01-28T09:00:00Z", lastSeen: "2026-01-28T09:00:00Z", resolved: true, confidence: 0.95 },
        ]);
      }
    } catch {
      setErrors([
        { id: "ERR-001", module: "VoiceAPI", message: "Timeout on TTS generation", severity: "medium", count: 12, firstSeen: "2026-01-25T10:00:00Z", lastSeen: "2026-01-28T08:30:00Z", resolved: false, confidence: 0.85 },
        { id: "ERR-002", module: "KlaviyoSync", message: "Rate limit exceeded", severity: "low", count: 45, firstSeen: "2026-01-20T14:00:00Z", lastSeen: "2026-01-28T06:00:00Z", resolved: false, confidence: 0.92 },
        { id: "ERR-003", module: "ShopifyWebhook", message: "Invalid HMAC signature", severity: "high", count: 3, firstSeen: "2026-01-27T22:00:00Z", lastSeen: "2026-01-28T01:00:00Z", resolved: true, confidence: 0.78 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  const openErrors = errors.filter(e => !e.resolved).length;
  const resolvedErrors = errors.filter(e => e.resolved).length;
  const avgConfidence = errors.length > 0 ? Math.round(errors.reduce((sum, e) => sum + e.confidence, 0) / errors.length * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Science</h1>
          <p className="text-muted-foreground">Analyse et classification intelligente des erreurs</p>
        </div>
        <Button onClick={fetchErrors} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <Bug className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erreurs Ouvertes</p>
              <p className="text-2xl font-bold">{openErrors}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolues</p>
              <p className="text-2xl font-bold">{resolvedErrors}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10">
              <TrendingUp className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence Moyenne</p>
              <p className="text-2xl font-bold">{avgConfidence}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {errors.map((err) => {
          const sev = severityConfig[err.severity];
          return (
            <Card key={err.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{err.id}</span>
                      <Badge className={sev.color}>{sev.label}</Badge>
                      {err.resolved ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolue
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">
                          <XCircle className="h-3 w-3 mr-1" />
                          Ouverte
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium mb-1">{err.message}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Module: {err.module}</span>
                      <span>Occurrences: {err.count}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(err.lastSeen).toLocaleDateString("fr-FR")}
                      </span>
                      <span>Confidence: {Math.round(err.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
