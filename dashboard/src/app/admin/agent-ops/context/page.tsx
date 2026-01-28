"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  RefreshCw,
  Database,
  Clock,
  Loader2,
  Layers,
  Trash2,
  BarChart3,
} from "lucide-react";

interface ContextEntry {
  tenantId: string;
  tokenCount: number;
  maxTokens: number;
  ttl: string;
  lastAccess: string;
  compactions: number;
}

export default function ContextBoxPage() {
  const [contexts, setContexts] = useState<ContextEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContexts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent-ops/context");
      const data = await res.json();
      if (data.success) {
        setContexts(data.data || []);
      } else {
        setContexts([
          { tenantId: "demo-store", tokenCount: 4200, maxTokens: 8000, ttl: "24h", lastAccess: new Date().toISOString(), compactions: 3 },
          { tenantId: "client-alpha", tokenCount: 1850, maxTokens: 8000, ttl: "24h", lastAccess: new Date().toISOString(), compactions: 1 },
          { tenantId: "system", tokenCount: 6100, maxTokens: 16000, ttl: "48h", lastAccess: new Date().toISOString(), compactions: 7 },
        ]);
      }
    } catch {
      setContexts([
        { tenantId: "demo-store", tokenCount: 4200, maxTokens: 8000, ttl: "24h", lastAccess: new Date().toISOString(), compactions: 3 },
        { tenantId: "client-alpha", tokenCount: 1850, maxTokens: 8000, ttl: "24h", lastAccess: new Date().toISOString(), compactions: 1 },
        { tenantId: "system", tokenCount: 6100, maxTokens: 16000, ttl: "48h", lastAccess: new Date().toISOString(), compactions: 7 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContexts(); }, [fetchContexts]);

  const totalTokens = contexts.reduce((sum, c) => sum + c.tokenCount, 0);
  const totalCompactions = contexts.reduce((sum, c) => sum + c.compactions, 0);

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
          <h1 className="text-3xl font-bold">Context Box</h1>
          <p className="text-muted-foreground">Gestion des contextes multi-tenant avec TTL</p>
        </div>
        <Button onClick={fetchContexts} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contextes Actifs</p>
              <p className="text-2xl font-bold">{contexts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Database className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tokens Total</p>
              <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10">
              <Trash2 className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compactions</p>
              <p className="text-2xl font-bold">{totalCompactions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Entries */}
      <div className="space-y-4">
        {contexts.map((ctx) => {
          const usage = Math.round((ctx.tokenCount / ctx.maxTokens) * 100);
          const barColor = usage > 80 ? "bg-red-500" : usage > 50 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <Card key={ctx.tenantId} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{ctx.tenantId}</h3>
                      <p className="text-xs text-muted-foreground">TTL: {ctx.ttl} | Compactions: {ctx.compactions}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ctx.lastAccess).toLocaleTimeString("fr-FR")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilisation tokens</span>
                    <span>{ctx.tokenCount.toLocaleString()} / {ctx.maxTokens.toLocaleString()} ({usage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${usage}%` }} />
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
