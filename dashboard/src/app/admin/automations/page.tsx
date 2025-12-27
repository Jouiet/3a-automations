"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  Zap,
  Mail,
  ShoppingCart,
  Users,
  MessageSquare,
  Calendar,
  Bell,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  AlertCircle,
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "DISABLED";
  n8nWorkflowId?: string;
  trigger: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  ownerId?: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  email: { label: "Email", icon: Mail, color: "text-emerald-400" },
  "email-marketing": { label: "Email Marketing", icon: Mail, color: "text-emerald-400" },
  ecommerce: { label: "E-commerce", icon: ShoppingCart, color: "text-amber-400" },
  shopify: { label: "Shopify", icon: ShoppingCart, color: "text-amber-400" },
  crm: { label: "CRM", icon: Users, color: "text-sky-400" },
  "lead-generation": { label: "Lead Gen", icon: Users, color: "text-sky-400" },
  communication: { label: "Communication", icon: MessageSquare, color: "text-purple-400" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-green-400" },
  "voice-ai": { label: "Voice AI", icon: MessageSquare, color: "text-pink-400" },
  analytics: { label: "Analytics", icon: Activity, color: "text-pink-400" },
  scheduling: { label: "Planification", icon: Calendar, color: "text-orange-400" },
  "content-generation": { label: "Content", icon: Zap, color: "text-violet-400" },
  social: { label: "Social", icon: Users, color: "text-blue-400" },
};

const statusConfig = {
  ACTIVE: { label: "Actif", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  PAUSED: { label: "En pause", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  ERROR: { label: "Erreur", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  DISABLED: { label: "Desactive", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAutomations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/automations");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setAutomations(data.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || "Failed to fetch automations");
      }
    } catch (err) {
      console.error("Error fetching automations:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAutomations, 30000);
    return () => clearInterval(interval);
  }, [fetchAutomations]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
      const response = await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        fetchAutomations();
      }
    } catch (err) {
      console.error("Error updating automation status:", err);
    }
  };

  const filteredAutomations = automations.filter((automation) => {
    const matchesSearch =
      automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      automation.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && automation.status === "ACTIVE") ||
      (activeTab === "paused" && automation.status === "PAUSED") ||
      (activeTab === "error" && automation.status === "ERROR") ||
      automation.category === activeTab;

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === "ACTIVE").length,
    paused: automations.filter((a) => a.status === "PAUSED").length,
    errors: automations.filter((a) => a.status === "ERROR").length,
    totalRuns: automations.reduce((sum, a) => sum + (a.runCount || 0), 0),
    successRate: automations.length > 0 && automations.reduce((sum, a) => sum + (a.runCount || 0), 0) > 0
      ? ((automations.reduce((sum, a) => sum + (a.successCount || 0), 0) /
          automations.reduce((sum, a) => sum + (a.runCount || 0), 0)) * 100).toFixed(1)
      : "0.0",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardContent>
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
          <h1 className="text-3xl font-bold">Automations</h1>
          <Button onClick={fetchAutomations} variant="outline">
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
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Gerez vos workflows et automations n8n
            <span className="text-xs ml-2 opacity-50">
              Maj: {formatDate(lastRefresh.toISOString())}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchAutomations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://n8n.srv1168256.hstgr.cloud" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir n8n
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="https://n8n.srv1168256.hstgr.cloud" target="_blank">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Automation
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Automations</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
            </div>
            <p className="text-sm text-muted-foreground">Actives</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{stats.paused}</span>
            </div>
            <p className="text-sm text-muted-foreground">En pause</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{stats.errors}</span>
            </div>
            <p className="text-sm text-muted-foreground">Erreurs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">{stats.successRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Taux Succes</p>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Workflows</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="active">Actifs</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
              <TabsTrigger value="crm">CRM</TabsTrigger>
              <TabsTrigger value="error">Erreurs</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid gap-4">
                {filteredAutomations.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold text-lg">Aucune automation</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm ? "Aucun resultat pour cette recherche" : "Creez votre premiere automation dans n8n"}
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
                  filteredAutomations.map((automation) => {
                    const CategoryIcon = categoryConfig[automation.category]?.icon || Zap;
                    const categoryColor = categoryConfig[automation.category]?.color || "text-primary";

                    return (
                      <Card
                        key={automation.id}
                        className="border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-lg bg-muted">
                                <CategoryIcon className={`h-5 w-5 ${categoryColor}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{automation.name}</h3>
                                  <Badge className={statusConfig[automation.status]?.color || statusConfig.DISABLED.color}>
                                    {statusConfig[automation.status]?.label || automation.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {automation.description || "No description"}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {automation.trigger && (
                                    <span className="flex items-center gap-1">
                                      <Bell className="h-3 w-3" />
                                      {automation.trigger}
                                    </span>
                                  )}
                                  {automation.runCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <RefreshCw className="h-3 w-3" />
                                      {automation.runCount.toLocaleString()} executions
                                    </span>
                                  )}
                                  {automation.lastRunAt && (
                                    <span>Dernier: {formatDate(automation.lastRunAt)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleStatus(automation.id, automation.status)}
                              >
                                {automation.status === "ACTIVE" ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Play className="h-4 w-4 mr-2" />
                                    Executer maintenant
                                  </DropdownMenuItem>
                                  {automation.n8nWorkflowId && (
                                    <DropdownMenuItem asChild>
                                      <a href={`https://n8n.srv1168256.hstgr.cloud/workflow/${automation.n8nWorkflowId}`} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Voir dans n8n
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>Voir logs</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Progress bar for success rate - only if there are runs */}
                          {automation.runCount > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Taux de succes</span>
                                <span className="text-emerald-400">
                                  {((automation.successCount / automation.runCount) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{
                                    width: `${(automation.successCount / automation.runCount) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
