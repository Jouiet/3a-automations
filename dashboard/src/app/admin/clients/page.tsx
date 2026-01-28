"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  KeyRound,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Client {
  tenant_id: string;
  name: string;
  vertical: string;
  plan: string;
  status: string;
  created_at: string;
  features: Record<string, boolean>;
  contacts: {
    primary: {
      name: string;
      email: string;
    };
  };
  billing: {
    monthly_revenue: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVertical, setFilterVertical] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.tenant_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contacts?.primary?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVertical = !filterVertical || client.vertical === filterVertical;

    return matchesSearch && matchesVertical;
  });

  const verticalIcons: Record<string, typeof ShoppingBag> = {
    shopify: ShoppingBag,
    b2b: Briefcase,
    agency: Building,
  };

  const verticalColors: Record<string, string> = {
    shopify: "bg-green-500/20 text-green-400 border-green-500/30",
    b2b: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    agency: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const statusColors: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    active: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
    onboarding: { color: "bg-amber-500/20 text-amber-400", icon: Clock },
    suspended: { color: "bg-red-500/20 text-red-400", icon: AlertCircle },
  };

  const planColors: Record<string, string> = {
    quickwin: "bg-gray-500/20 text-gray-400",
    essentials: "bg-blue-500/20 text-blue-400",
    growth: "bg-purple-500/20 text-purple-400",
  };

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    shopify: clients.filter((c) => c.vertical === "shopify").length,
    b2b: clients.filter((c) => c.vertical === "b2b").length,
    totalMRR: clients.reduce((sum, c) => sum + (c.billing?.monthly_revenue || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Client Management
          </h1>
          <p className="text-muted-foreground">
            Multi-tenant client registry and configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClients}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => alert("Fonctionnalite en cours de developpement")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ShoppingBag className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shopify</p>
                <p className="text-2xl font-bold">{stats.shopify}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Briefcase className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">B2B</p>
                <p className="text-2xl font-bold">{stats.b2b}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Building className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{stats.totalMRR.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterVertical === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterVertical(null)}
              >
                All
              </Button>
              <Button
                variant={filterVertical === "shopify" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterVertical("shopify")}
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Shopify
              </Button>
              <Button
                variant={filterVertical === "b2b" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterVertical("b2b")}
              >
                <Briefcase className="h-4 w-4 mr-1" />
                B2B
              </Button>
              <Button
                variant={filterVertical === "agency" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterVertical("agency")}
              >
                <Building className="h-4 w-4 mr-1" />
                Agency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>
            All registered multi-tenant clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm">Create your first client to get started</p>
              <Button className="mt-4" onClick={() => alert("Fonctionnalite en cours de developpement")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const VerticalIcon = verticalIcons[client.vertical] || Building2;
                const StatusIcon = statusColors[client.status]?.icon || Clock;

                return (
                  <div
                    key={client.tenant_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${verticalColors[client.vertical] || "bg-gray-500/20"}`}>
                        <VerticalIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{client.name}</p>
                          <Badge className={statusColors[client.status]?.color || "bg-gray-500/20"}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {client.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-mono">{client.tenant_id}</span>
                          <span>•</span>
                          <span>{client.contacts?.primary?.email || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline" className={planColors[client.plan] || ""}>
                          {client.plan}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Link href={`/admin/credentials?project=${client.tenant_id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Settings: ${client.name}`)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => alert(`Suppression non disponible via le dashboard`)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CLI Commands Info */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ExternalLink className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">CLI Commands</h3>
              <div className="text-sm text-muted-foreground space-y-1 font-mono">
                <p># Create new client</p>
                <p className="text-primary">node scripts/create-client.cjs --name &quot;Company&quot; --vertical shopify --email contact@company.com</p>
                <p className="mt-2"># List all clients</p>
                <p className="text-primary">node scripts/create-client.cjs --list</p>
                <p className="mt-2"># Validate client config</p>
                <p className="text-primary">node scripts/validate-client.cjs --tenant client-id</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
