"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: number;
  executionsCount: number;
  lastExecution?: {
    status: "success" | "error" | "running";
    startedAt: string;
    finishedAt?: string;
  };
}

const mockWorkflows: N8nWorkflow[] = [
  {
    id: "wf_1",
    name: "Lead Capture → CRM",
    active: true,
    createdAt: "2024-12-01",
    updatedAt: "2024-12-23",
    nodes: 8,
    executionsCount: 1247,
    lastExecution: { status: "success", startedAt: "2024-12-24T10:30:00Z", finishedAt: "2024-12-24T10:30:05Z" }
  },
  {
    id: "wf_2",
    name: "Abandon Cart Recovery",
    active: true,
    createdAt: "2024-11-15",
    updatedAt: "2024-12-22",
    nodes: 12,
    executionsCount: 856,
    lastExecution: { status: "success", startedAt: "2024-12-24T09:45:00Z", finishedAt: "2024-12-24T09:45:12Z" }
  },
  {
    id: "wf_3",
    name: "Welcome Email Sequence",
    active: true,
    createdAt: "2024-10-20",
    updatedAt: "2024-12-20",
    nodes: 6,
    executionsCount: 2341,
    lastExecution: { status: "success", startedAt: "2024-12-24T08:00:00Z", finishedAt: "2024-12-24T08:00:03Z" }
  },
  {
    id: "wf_4",
    name: "Daily Analytics Report",
    active: false,
    createdAt: "2024-12-10",
    updatedAt: "2024-12-15",
    nodes: 5,
    executionsCount: 14,
    lastExecution: { status: "error", startedAt: "2024-12-15T08:00:00Z" }
  },
  {
    id: "wf_5",
    name: "WhatsApp Booking Confirmation",
    active: true,
    createdAt: "2024-12-18",
    updatedAt: "2024-12-23",
    nodes: 7,
    executionsCount: 89,
    lastExecution: { status: "success", startedAt: "2024-12-24T11:00:00Z", finishedAt: "2024-12-24T11:00:08Z" }
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(mockWorkflows);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows n8n</h1>
          <p className="text-muted-foreground">Gerez vos workflows d'automatisation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="https://n8n.srv1168256.hstgr.cloud" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir n8n
            </a>
          </Button>
          <Button>
            <Bot className="h-4 w-4 mr-2" />
            Nouveau Workflow
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
        {workflows.map((workflow) => (
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
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
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
        ))}
      </div>
    </div>
  );
}
