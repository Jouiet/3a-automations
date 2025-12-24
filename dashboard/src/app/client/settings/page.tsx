"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface UserSettings {
  name: string;
  email: string;
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

const mockSettings: UserSettings = {
  name: "Marie Dupont",
  email: "marie.dupont@boutique-mode.com",
  company: "Boutique Mode Paris",
  phone: "+33 6 12 34 56 78",
  language: "fr",
  timezone: "Europe/Paris",
  notifications: {
    email: true,
    whatsapp: true,
    reports: true,
    marketing: false,
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // In production, this would save to Google Sheets via Apps Script
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const updateNotification = (key: keyof typeof settings.notifications) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  if (isLoading) {
    return <div className="h-96 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parametres</h1>
          <p className="text-muted-foreground">Gerez votre compte et vos preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
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
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="bg-background"
              />
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
              <label className="text-sm font-medium mb-2 block">Nom de l'entreprise</label>
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
                className="bg-background"
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
                <h3 className="font-semibold text-lg">Pack Growth</h3>
                <Badge className="bg-primary/20 text-primary">Actif</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Renouvellement automatique le 1er Janvier 2025
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">490 EUR<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              <Button variant="outline" size="sm" className="mt-2">
                Gerer l'abonnement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
