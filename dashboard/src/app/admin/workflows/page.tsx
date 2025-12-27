"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Play,
  Pause,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Settings,
  AlertCircle,
} from "lucide-react";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: number;
  tags: string[];
}

interface N8nExecution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  stoppedAt?: string;
  mode: string;
}

interface WorkflowWithStats extends N8nWorkflow {
  executionsCount: number;
  lastExecution?: {
    status: "success" | "error" | "running";
    startedAt: string;
    finishedAt?: string;
  };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [workflowsRes, executionsRes] = await Promise.all([
        fetch("/api/n8n/workflows"),
        fetch("/api/n8n/executions?limit=100"),
      ]);

      if (!workflowsRes.ok) {
        throw new Error(`Workflows API error: ${workflowsRes.status}`);
      }

      const workflowsData = await workflowsRes.json();
      const executionsData = executionsRes.ok ? await executionsRes.json() : { data: [] };

      if (workflowsData.success && workflowsData.data) {
        const executions: N8nExecution[] = executionsData.data || [];

        // Map workflows with execution stats
        const workflowsWithStats: WorkflowWithStats[] = workflowsData.data.map((wf: N8nWorkflow) => {
          const wfExecutions = executions.filter(e => e.workflowId === wf.id);
          const lastExec = wfExecutions[0]; // Most recent first

          return {
            ...wf,
            executionsCount: wfExecutions.length,
            lastExecution: lastExec ? {
              status: lastExec.status === "success" ? "success" :
                      lastExec.status === "error" ? "error" : "running",
              startedAt: lastExec.startedAt,
              finishedAt: lastExec.stoppedAt,
            } : undefined,
          };
        });

        setWorkflows(workflowsWithStats);
        setLastRefresh(new Date());
      } else {
        throw new Error(workflowsData.error || "Failed to fetch workflows");
      }
    } catch (err) {
      console.error("Error fetching workflows:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleWorkflow = async (workflowId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, active: !currentActive }),
      });

      if (res.ok) {
        // Refresh data after toggle
        fetchData();
      }
    } catch (err) {
      console.error("Error toggling workflow:", err);
    }
  };

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.active).length,
    inactive: workflows.filter(w => !w.active).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionsCount, 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Workflows n8n</h1>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Erreur de connexion</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows n8n</h1>
          <p className="text-muted-foreground">
            Gerez vos workflows d'automatisation
            <span className="text-xs ml-2 opacity-50">
              Maj: {formatDate(lastRefresh.toISOString())}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <a href="https://n8n.srv1168256.hstgr.cloud" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir n8n
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Workflows</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
            </div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{stats.inactive}</span>
            </div>
            <p className="text-sm text-muted-foreground">Inactifs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">{stats.totalExecutions.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Executions Totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg">Aucun workflow</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Creez votre premier workflow dans n8n
              </p>
              <Button className="mt-4" asChild>
                <a href="https://n8n.srv1168256.hstgr.cloud" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir n8n
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${workflow.active ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                      <Bot className={`h-6 w-6 ${workflow.active ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                        <Badge className={workflow.active
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }>
                          {workflow.active ? "Actif" : "Inactif"}
                        </Badge>
                        {workflow.lastExecution && (
                          <Badge className={
                            workflow.lastExecution.status === "success"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : workflow.lastExecution.status === "error"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }>
                            {workflow.lastExecution.status === "success" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {workflow.lastExecution.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{workflow.nodes} nodes</span>
                        <span>{workflow.executionsCount.toLocaleString()} executions</span>
                        {workflow.tags.length > 0 && (
                          <span className="flex gap-1">
                            {workflow.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </span>
                        )}
                        {workflow.lastExecution && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(workflow.lastExecution.startedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.active)}
                    >
                      {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://n8n.srv1168256.hstgr.cloud/workflow/${workflow.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Editer
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
