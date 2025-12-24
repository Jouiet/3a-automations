"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Building,
  Key,
  Bell,
  Mail,
  Zap,
  Database,
  Shield,
  Globe,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Integration {
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  icon: typeof Zap;
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    name: "n8n Workflows",
    description: "Orchestration des automations",
    status: "connected",
    icon: Zap,
    lastSync: "Il y a 5 min",
  },
  {
    name: "Google Sheets",
    description: "Base de donnees principale",
    status: "connected",
    icon: Database,
    lastSync: "Il y a 2 min",
  },
  {
    name: "Klaviyo",
    description: "Email marketing automation",
    status: "connected",
    icon: Mail,
    lastSync: "Il y a 15 min",
  },
  {
    name: "Shopify",
    description: "E-commerce integration",
    status: "disconnected",
    icon: Building,
  },
  {
    name: "WhatsApp Business",
    description: "Messaging automation",
    status: "connected",
    icon: Bell,
    lastSync: "Il y a 30 min",
  },
  {
    name: "Google Analytics",
    description: "Tracking et analytics",
    status: "connected",
    icon: Globe,
    lastSync: "Il y a 1h",
  },
];

const statusConfig = {
  connected: { label: "Connecte", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  disconnected: { label: "Deconnecte", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: AlertCircle },
  error: { label: "Erreur", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parametres</h1>
          <p className="text-muted-foreground">
            Configuration du dashboard et des integrations
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Securite</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Gerez votre profil et vos preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prenom</label>
                  <Input placeholder="Votre prenom" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input placeholder="Votre nom" defaultValue="3A" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="email@example.com" defaultValue="admin@3a-automation.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telephone</label>
                <Input type="tel" placeholder="+33 6 00 00 00 00" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Informations Entreprise
              </CardTitle>
              <CardDescription>
                Details de votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de l&apos;entreprise</label>
                <Input placeholder="Nom entreprise" defaultValue="3A Automation" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site web</label>
                  <Input placeholder="https://..." defaultValue="https://3a-automation.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secteur</label>
                  <Input placeholder="Secteur d'activite" defaultValue="Marketing Automation" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input placeholder="Adresse complete" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ville</label>
                  <Input placeholder="Ville" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code Postal</label>
                  <Input placeholder="Code postal" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pays</label>
                  <Input placeholder="Pays" defaultValue="France" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {integrations.map((integration, index) => {
              const StatusIcon = statusConfig[integration.status].icon;
              return (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <integration.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {integration.lastSync && (
                          <span className="text-sm text-muted-foreground">
                            Sync: {integration.lastSync}
                          </span>
                        )}
                        <Badge className={statusConfig[integration.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[integration.status].label}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {integration.status === "connected" ? "Configurer" : "Connecter"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Zap className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Ajouter une Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connectez d&apos;autres services a votre dashboard
                  </p>
                  <Button variant="outline" className="mt-2">
                    Parcourir les integrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Preferences de Notification
              </CardTitle>
              <CardDescription>
                Configurez comment vous recevez les alertes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Nouveaux Leads</h4>
                    <p className="text-sm text-muted-foreground">
                      Notification pour chaque nouveau lead
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Email + Push</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Erreurs Automation</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertes en cas d&apos;echec de workflow
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Email + SMS</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rapport Quotidien</h4>
                    <p className="text-sm text-muted-foreground">
                      Resume des KPIs chaque matin
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Email</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Objectifs Atteints</h4>
                    <p className="text-sm text-muted-foreground">
                      Celebration des milestones
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Push</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Mot de Passe
                </CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe actuel</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nouveau mot de passe</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button>Mettre a jour le mot de passe</Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Sessions Actives
                </CardTitle>
                <CardDescription>
                  Gerez vos connexions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <p className="font-medium">MacBook Pro - Chrome</p>
                        <p className="text-sm text-muted-foreground">Paris, France - Session actuelle</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <div>
                        <p className="font-medium">iPhone 15 - Safari</p>
                        <p className="text-sm text-muted-foreground">Paris, France - Il y a 2 jours</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Deconnecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
