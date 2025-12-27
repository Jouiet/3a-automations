"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Building,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    reports: boolean;
    marketing: boolean;
  };
}

const defaultSettings: UserSettings = {
  id: "",
  name: "",
  email: "",
  role: "CLIENT",
  company: "",
  phone: "",
  language: "fr",
  timezone: "Europe/Paris",
  notifications: {
    email: true,
    whatsapp: false,
    reports: true,
    marketing: false,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("Session expiree. Veuillez vous reconnecter.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expiree. Veuillez vous reconnecter.");
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSettings({
          id: data.data.id || "",
          name: data.data.name || "",
          email: data.data.email || "",
          role: data.data.role || "CLIENT",
          company: data.data.company || "",
          phone: data.data.phone || "",
          language: data.data.language || "fr",
          timezone: data.data.timezone || "Europe/Paris",
          notifications: data.data.notifications || defaultSettings.notifications,
        });
      } else {
        throw new Error(data.error || "Failed to fetch settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("Session expiree. Veuillez vous reconnecter.");
        return;
      }

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: settings.name,
          company: settings.company,
          phone: settings.phone,
          language: settings.language,
          timezone: settings.timezone,
          notifications: settings.notifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotification = (key: keyof typeof settings.notifications) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">Parametres</h1>
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Erreur</h3>
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
          <h1 className="text-3xl font-bold">Parametres</h1>
          <p className="text-muted-foreground">Gerez votre compte et vos preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enregistre
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profil
            </CardTitle>
            <CardDescription>Vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom complet</label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={settings.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                L&apos;email ne peut pas etre modifie
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Telephone</label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Entreprise
            </CardTitle>
            <CardDescription>Informations de votre entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom de l&apos;entreprise</label>
              <Input
                value={settings.company}
                onChange={(e) => setSettings({ ...settings, company: e.target.value })}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Fuseau horaire</label>
              <Input
                value={settings.timezone}
                className="bg-muted cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Langue</label>
              <div className="flex gap-2">
                <Button
                  variant={settings.language === "fr" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({ ...settings, language: "fr" })}
                >
                  Francais
                </Button>
                <Button
                  variant={settings.language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({ ...settings, language: "en" })}
                >
                  English
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Gerez vos preferences de notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Notifications Email</p>
                  <p className="text-xs text-muted-foreground">Recevez des mises a jour par email</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={() => updateNotification("email")}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Notifications via WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.whatsapp}
                onCheckedChange={() => updateNotification("whatsapp")}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Rapports Hebdomadaires</p>
                  <p className="text-xs text-muted-foreground">Recevez un resume chaque semaine</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.reports}
                onCheckedChange={() => updateNotification("reports")}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Marketing</p>
                  <p className="text-xs text-muted-foreground">Offres et nouveautes</p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.marketing}
                onCheckedChange={() => updateNotification("marketing")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Securite
            </CardTitle>
            <CardDescription>Mot de passe et authentification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mot de passe actuel</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-background pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nouveau mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Confirmer le mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
            <Button variant="outline" className="w-full">
              Changer le mot de passe
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {settings.role === "ADMIN" ? "Compte Administrateur" : "Pack Client"}
                </h3>
                <Badge className="bg-primary/20 text-primary">Actif</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Compte {settings.role.toLowerCase()} - {settings.email}
              </p>
            </div>
            <div className="text-right">
              <Button variant="outline" size="sm">
                Contacter le support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
