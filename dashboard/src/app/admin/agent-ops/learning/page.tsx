"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Bug,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface LearningFact {
  id: string;
  type: "gap" | "correction" | "insight" | "faq" | "feature_request";
  status: "pending" | "approved" | "rejected" | "modified";
  content: {
    question?: string;
    answer?: string;
    context?: string;
    suggestion?: string;
  };
  metadata: {
    sessionId: string;
    confidence: number;
    extractedAt: string;
    language?: string;
    source?: string;
  };
  reviewedAt?: string;
  reviewedBy?: string;
}

interface LearningStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
}

const typeConfig = {
  gap: { icon: HelpCircle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Gap KB" },
  correction: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", label: "Correction" },
  insight: { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Insight" },
  faq: { icon: BookOpen, color: "text-sky-400", bg: "bg-sky-500/10", label: "FAQ" },
  feature_request: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10", label: "Feature" },
};

const statusConfig = {
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "En attente" },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Approuve" },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejete" },
  modified: { color: "bg-sky-500/20 text-sky-400 border-sky-500/30", label: "Modifie" },
};

export default function LearningQueuePage() {
  const [facts, setFacts] = useState<LearningFact[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacts, setSelectedFacts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const [factsRes, statsRes] = await Promise.all([
        fetch(`/api/learning/queue?${params.toString()}`),
        fetch("/api/learning/stats"),
      ]);

      if (factsRes.ok) {
        const data = await factsRes.json();
        // Transform API response to match component format
        const transformedFacts = (data.data || []).map((f: any) => ({
          id: f.id,
          type: f.type,
          status: f.status,
          content: {
            question: f.userMessage,
            answer: f.aiResponse,
            suggestion: f.extractedFact,
            context: f.pattern,
          },
          metadata: {
            sessionId: f.source?.sessionId || f.id,
            confidence: f.confidence,
            extractedAt: f.createdAt,
            language: f.source?.language,
            source: f.pattern,
          },
          reviewedAt: f.reviewedAt,
          reviewedBy: f.reviewedBy,
        }));
        setFacts(transformedFacts);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        // Transform stats to match component format
        if (data.data) {
          setStats({
            total: data.data.total,
            pending: data.data.byStatus?.pending || 0,
            approved: data.data.byStatus?.approved || 0,
            rejected: data.data.byStatus?.rejected || 0,
            byType: data.data.byType || {},
          });
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching learning data:", err);
      setError("Erreur de chargement des donnees");
      setIsLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (factId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/learning/queue/${factId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });

      if (res.ok) {
        setFacts(prev => prev.map(f =>
          f.id === factId ? { ...f, status: action === "approve" ? "approved" : "rejected" } : f
        ));
        fetchData(); // Refresh stats
      }
    } catch (err) {
      console.error("Error updating fact:", err);
    }
  };

  const handleBatchAction = async (action: "approve" | "reject") => {
    if (selectedFacts.size === 0) return;

    try {
      const res = await fetch("/api/learning/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedFacts),
          status: action === "approve" ? "approved" : "rejected",
        }),
      });

      if (res.ok) {
        setSelectedFacts(new Set());
        fetchData();
      }
    } catch (err) {
      console.error("Error batch updating:", err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedFacts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedFacts.size === filteredFacts.length) {
      setSelectedFacts(new Set());
    } else {
      setSelectedFacts(new Set(filteredFacts.map(f => f.id)));
    }
  };

  const filteredFacts = facts.filter(f => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const content = JSON.stringify(f.content).toLowerCase();
      if (!content.includes(query)) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Learning Queue</h1>
            <p className="text-sm text-muted-foreground">
              ConversationLearner v3.0 - Human-in-the-Loop KB Enrichment
            </p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Rafraichir
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <BrainCircuit className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">En attente</p>
                <p className="text-2xl font-bold text-amber-400">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Approuves</p>
                <p className="text-2xl font-bold text-emerald-400">{stats?.approved || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Rejetes</p>
                <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-sky-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Taux Approbation</p>
                <p className="text-2xl font-bold text-sky-400">
                  {stats && stats.total > 0
                    ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100) || 0
                    : 0}%
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-sky-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {["all", "pending", "approved", "rejected"].map(status => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className="text-xs"
                >
                  {status === "all" ? "Tous" : statusConfig[status as keyof typeof statusConfig]?.label || status}
                </Button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex gap-1">
              {["all", "gap", "correction", "faq", "insight", "feature_request"].map(type => {
                const config = typeConfig[type as keyof typeof typeConfig];
                return (
                  <Button
                    key={type}
                    variant={typeFilter === type ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                    className="text-xs gap-1"
                  >
                    {config && <config.icon className={`h-3 w-3 ${config.color}`} />}
                    {type === "all" ? "Types" : config?.label || type}
                  </Button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedFacts.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedFacts.size} element(s) selectionne(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction("approve")}
                  className="gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approuver tout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction("reject")}
                  className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter tout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Facts Queue</span>
            <Badge variant="secondary">{filteredFacts.length} elements</Badge>
          </CardTitle>
          <CardDescription>
            Candidats KB extraits des conversations Voice AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {filteredFacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BrainCircuit className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucun fait a valider</p>
              <p className="text-sm">Les candidats KB apparaitront ici apres extraction des conversations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedFacts.size === filteredFacts.length && filteredFacts.length > 0}
                      onChange={selectAll}
                      className="rounded border-border"
                    />
                  </TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead className="w-24">Confiance</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacts.map((fact) => {
                  const typeConf = typeConfig[fact.type] || typeConfig.insight;
                  const statusConf = statusConfig[fact.status] || statusConfig.pending;

                  return (
                    <TableRow key={fact.id} className="group">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedFacts.has(fact.id)}
                          onChange={() => toggleSelect(fact.id)}
                          className="rounded border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${typeConf.bg}`}>
                          <typeConf.icon className={`h-3 w-3 ${typeConf.color}`} />
                          <span className={`text-xs font-medium ${typeConf.color}`}>{typeConf.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          {fact.content.question && (
                            <p className="text-sm font-medium truncate">Q: {fact.content.question}</p>
                          )}
                          {fact.content.answer && (
                            <p className="text-xs text-muted-foreground truncate">R: {fact.content.answer}</p>
                          )}
                          {fact.content.suggestion && (
                            <p className="text-xs text-muted-foreground truncate">{fact.content.suggestion}</p>
                          )}
                          {fact.content.context && !fact.content.question && (
                            <p className="text-sm truncate">{fact.content.context}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-16 bg-muted rounded-full overflow-hidden"
                            title={`${Math.round(fact.metadata.confidence * 100)}%`}
                          >
                            <div
                              className={`h-full ${
                                fact.metadata.confidence >= 0.8 ? "bg-emerald-500" :
                                fact.metadata.confidence >= 0.6 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${fact.metadata.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(fact.metadata.confidence * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(fact.metadata.extractedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConf.color}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fact.status === "pending" && (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleAction(fact.id, "approve")}
                              title="Approuver"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleAction(fact.id, "reject")}
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* KB Enrichment Info */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Comment fonctionne le Learning Loop?</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li><strong>Extraction:</strong> ConversationLearner analyse les sessions Voice AI</li>
                <li><strong>Detection:</strong> Patterns identifies (gaps KB, corrections, FAQs, insights)</li>
                <li><strong>Queue:</strong> Candidats stockes pour validation humaine (HITL)</li>
                <li><strong>Validation:</strong> Vous approuvez/rejetez chaque fait</li>
                <li><strong>Enrichment:</strong> Facts approuves injectes dans Knowledge Base (versions)</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Zero auto-injection - Previent la contamination KB avec donnees non verifiees.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
