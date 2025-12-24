"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  source: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
  score: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  tags: string[];
  createdAt: string;
  lastContact?: string;
}

// No mock data - fetch from API

const statusConfig = {
  NEW: { label: "Nouveau", variant: "info" as const, icon: AlertCircle },
  CONTACTED: { label: "Contacte", variant: "warning" as const, icon: Clock },
  QUALIFIED: { label: "Qualifie", variant: "success" as const, icon: CheckCircle2 },
  PROPOSAL: { label: "Proposition", variant: "default" as const, icon: Star },
  WON: { label: "Gagne", variant: "success" as const, icon: CheckCircle2 },
  LOST: { label: "Perdu", variant: "destructive" as const, icon: XCircle },
};

const priorityConfig = {
  HIGH: { label: "Haute", color: "text-red-400" },
  MEDIUM: { label: "Moyenne", color: "text-amber-400" },
  LOW: { label: "Basse", color: "text-emerald-400" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/leads");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Transform API data to match our interface
            const transformedLeads = data.data.map((lead: any) => ({
              ...lead,
              status: lead.status?.toUpperCase() || "NEW",
              priority: lead.priority?.toUpperCase() || "MEDIUM",
            }));
            setLeads(transformedLeads);
            setFilteredLeads(transformedLeads);
          }
        } else {
          setError("Erreur de chargement des leads");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((lead) => lead.status === activeTab.toUpperCase());
    }

    setFilteredLeads(filtered);
  }, [searchTerm, activeTab, leads]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Gerez vos prospects et suivez leur progression
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-sm text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-sky-400">{statusCounts.NEW || 0}</div>
            <p className="text-sm text-muted-foreground">Nouveaux</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-400">{statusCounts.QUALIFIED || 0}</div>
            <p className="text-sm text-muted-foreground">Qualifies</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-400">{statusCounts.WON || 0}</div>
            <p className="text-sm text-muted-foreground">Gagnes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {((statusCounts.WON || 0) / leads.length * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Taux Conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Leads</CardTitle>
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous ({leads.length})</TabsTrigger>
              <TabsTrigger value="new">Nouveaux ({statusCounts.NEW || 0})</TabsTrigger>
              <TabsTrigger value="qualified">Qualifies ({statusCounts.QUALIFIED || 0})</TabsTrigger>
              <TabsTrigger value="proposal">Propositions ({statusCounts.PROPOSAL || 0})</TabsTrigger>
              <TabsTrigger value="won">Gagnes ({statusCounts.WON || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Priorite</TableHead>
                    <TableHead>Dernier Contact</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const StatusIcon = statusConfig[lead.status].icon;
                    return (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.name}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{lead.company || "-"}</span>
                            <span className="text-sm text-muted-foreground">{lead.jobTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[lead.status].variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[lead.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={priorityConfig[lead.priority].color}>
                            {priorityConfig[lead.priority].label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.lastContact ? formatDate(lead.lastContact) : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Envoyer Email
                              </DropdownMenuItem>
                              {lead.phone && (
                                <DropdownMenuItem>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Appeler
                                </DropdownMenuItem>
                              )}
                              {lead.linkedinUrl && (
                                <DropdownMenuItem>
                                  <Linkedin className="h-4 w-4 mr-2" />
                                  Voir LinkedIn
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Modifier</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
