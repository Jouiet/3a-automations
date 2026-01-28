"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Key,
  Lock,
  Unlock,
  Shield,
  Database,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Server,
  FolderKey,
  Plus,
  Copy,
  ExternalLink,
} from "lucide-react";

interface VaultProject {
  id: string;
  name: string;
  secretsCount: number;
  status: "healthy" | "warning" | "error";
  lastAccess: string;
  vertical?: string;
}

interface VaultSecret {
  key: string;
  masked: string;
  category: string;
  lastUpdated: string;
}

interface VaultHealth {
  infisical: boolean;
  authenticated: boolean;
  projectCount: number;
  cacheSize: number;
  fallbackAvailable: boolean;
}

export default function CredentialsPage() {
  const [projects, setProjects] = useState<VaultProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [vaultHealth, setVaultHealth] = useState<VaultHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    fetchVaultStatus();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchSecrets(selectedProject);
    }
  }, [selectedProject]);

  const fetchVaultStatus = async () => {
    try {
      const response = await fetch("/api/vault/health");
      if (response.ok) {
        const data = await response.json();
        setVaultHealth(data);
      }
    } catch (error) {
      console.error("Failed to fetch vault status:", error);
      setVaultHealth({
        infisical: false,
        authenticated: false,
        projectCount: 0,
        cacheSize: 0,
        fallbackAvailable: true,
      });
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vault/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        // Fallback: load from clients directory
        const clientsResponse = await fetch("/api/clients");
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          const projectsFromClients = (clientsData.clients || []).map((client: { tenant_id: string; name: string; vertical: string; created_at: string }) => ({
            id: client.tenant_id,
            name: client.name,
            secretsCount: 0,
            status: "warning" as const,
            lastAccess: client.created_at,
            vertical: client.vertical,
          }));
          setProjects([
            { id: "agency", name: "Agency (Internal)", secretsCount: 0, status: "healthy", lastAccess: new Date().toISOString() },
            ...projectsFromClients,
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecrets = async (projectId: string) => {
    try {
      const response = await fetch(`/api/vault/secrets?project=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setSecrets(data.secrets || []);
      } else {
        // Show expected secrets based on vertical
        setSecrets(getExpectedSecretsForProject(projectId));
      }
    } catch (error) {
      console.error("Failed to fetch secrets:", error);
      setSecrets(getExpectedSecretsForProject(projectId));
    }
  };

  const getExpectedSecretsForProject = (projectId: string): VaultSecret[] => {
    const project = projects.find((p) => p.id === projectId);
    const vertical = project?.vertical || "agency";

    const baseSecrets = [
      { key: "OPENAI_API_KEY", masked: "sk-****", category: "AI", lastUpdated: "-" },
      { key: "ANTHROPIC_API_KEY", masked: "sk-ant-****", category: "AI", lastUpdated: "-" },
    ];

    if (vertical === "shopify" || projectId === "agency") {
      return [
        ...baseSecrets,
        { key: "SHOPIFY_STORE", masked: "****.myshopify.com", category: "Shopify", lastUpdated: "-" },
        { key: "SHOPIFY_ACCESS_TOKEN", masked: "shpat_****", category: "Shopify", lastUpdated: "-" },
        { key: "KLAVIYO_API_KEY", masked: "pk_****", category: "Klaviyo", lastUpdated: "-" },
      ];
    }

    if (vertical === "b2b") {
      return [
        ...baseSecrets,
        { key: "HUBSPOT_API_KEY", masked: "pat-****", category: "HubSpot", lastUpdated: "-" },
        { key: "GOOGLE_ADS_DEVELOPER_TOKEN", masked: "****", category: "Google", lastUpdated: "-" },
      ];
    }

    return baseSecrets;
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig = {
    healthy: { label: "Healthy", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    warning: { label: "Not Configured", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertCircle },
    error: { label: "Error", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
  };

  const categoryColors: Record<string, string> = {
    Shopify: "bg-green-500/20 text-green-400",
    Klaviyo: "bg-purple-500/20 text-purple-400",
    AI: "bg-blue-500/20 text-blue-400",
    Google: "bg-red-500/20 text-red-400",
    HubSpot: "bg-orange-500/20 text-orange-400",
    Meta: "bg-indigo-500/20 text-indigo-400",
    Stripe: "bg-violet-500/20 text-violet-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Credential Vault
          </h1>
          <p className="text-muted-foreground">
            Multi-tenant credential management with Infisical
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVaultStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            const key = prompt("Secret key (e.g. SHOPIFY_ACCESS_TOKEN):");
            if (!key) return;
            const value = prompt(`Value for ${key}:`);
            if (!value) return;
            alert(`Use CLI to add secrets securely:\nnode automations/agency/core/SecretVault.cjs --set ${selectedProject || "agency"} ${key} <value>`);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Secret
          </Button>
        </div>
      </div>

      {/* Vault Health Status */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${vaultHealth?.infisical ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                <Server className={`h-5 w-5 ${vaultHealth?.infisical ? "text-emerald-400" : "text-red-400"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Infisical</p>
                <p className="font-semibold">{vaultHealth?.infisical ? "Connected" : "Offline"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${vaultHealth?.authenticated ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                {vaultHealth?.authenticated ? (
                  <Unlock className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Lock className="h-5 w-5 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auth</p>
                <p className="font-semibold">{vaultHealth?.authenticated ? "Authenticated" : "Not Auth"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FolderKey className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="font-semibold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cache</p>
                <p className="font-semibold">{vaultHealth?.cacheSize || 0} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${vaultHealth?.fallbackAvailable ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                <Shield className={`h-5 w-5 ${vaultHealth?.fallbackAvailable ? "text-emerald-400" : "text-red-400"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fallback</p>
                <p className="font-semibold">{vaultHealth?.fallbackAvailable ? "Available" : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects List */}
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKey className="h-5 w-5 text-primary" />
              Tenant Projects
            </CardTitle>
            <CardDescription>
              Select a project to view credentials
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProjects.map((project) => {
                  const StatusIcon = statusConfig[project.status].icon;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedProject === project.id
                          ? "bg-primary/20 border border-primary/50"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${
                            selectedProject === project.id ? "bg-primary/30" : "bg-muted"
                          }`}>
                            <Key className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.id}</p>
                          </div>
                        </div>
                        <Badge className={`${statusConfig[project.status].color} text-xs`}>
                          <StatusIcon className="h-3 w-3" />
                        </Badge>
                      </div>
                      {project.vertical && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {project.vertical}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secrets Panel */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {selectedProject ? `Secrets: ${selectedProject}` : "Select a Project"}
                </CardTitle>
                <CardDescription>
                  {selectedProject
                    ? `Manage credentials for ${selectedProject}`
                    : "Choose a project from the list to view its secrets"}
                </CardDescription>
              </div>
              {selectedProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValues(!showValues)}
                >
                  {showValues ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProject ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FolderKey className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a project to view its secrets</p>
              </div>
            ) : (
              <div className="space-y-2">
                {secrets.map((secret, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={categoryColors[secret.category] || "bg-gray-500/20 text-gray-400"}>
                        {secret.category}
                      </Badge>
                      <div>
                        <p className="font-mono text-sm font-medium">{secret.key}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {showValues ? secret.masked : "••••••••••••"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {secret.lastUpdated === "-" ? "Not set" : secret.lastUpdated}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        navigator.clipboard.writeText(secret.key);
                      }} title="Copy key name">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {secrets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No secrets configured</p>
                    <p className="text-sm">Add credentials using the vault CLI</p>
                  </div>
                )}

                {/* Add Secret Button */}
                <div className="pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full" onClick={() => alert("Utilisez le CLI: infisical secrets set KEY=VALUE --projectId=" + selectedProject)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Secret to {selectedProject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ExternalLink className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Vault CLI Commands</h3>
              <div className="text-sm text-muted-foreground space-y-1 font-mono">
                <p># Check vault health</p>
                <p className="text-primary">node automations/agency/core/SecretVault.cjs --health</p>
                <p className="mt-2"># Add a secret</p>
                <p className="text-primary">node automations/agency/core/SecretVault.cjs --set tenant_id KEY value</p>
                <p className="mt-2"># List secrets</p>
                <p className="text-primary">node automations/agency/core/SecretVault.cjs --list tenant_id</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
