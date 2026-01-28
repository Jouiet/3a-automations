"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Users,
  Eye,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  type: "newsletter" | "automation" | "transactional";
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt?: string;
}

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-500/20 text-gray-400", icon: PauseCircle },
  scheduled: { label: "Planifie", color: "bg-amber-500/20 text-amber-400", icon: Calendar },
  sending: { label: "En cours", color: "bg-sky-500/20 text-sky-400", icon: Send },
  sent: { label: "Envoye", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  paused: { label: "En pause", color: "bg-orange-500/20 text-orange-400", icon: PauseCircle },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("loading");

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/klaviyo/campaigns");
      const data = await response.json();

      if (data.error && !data.fallback) {
        setError(data.error);
        return;
      }

      setCampaigns(data.data || []);
      setSource(data.source || (data.fallback ? "fallback" : "klaviyo"));
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === "sent").length,
    scheduled: campaigns.filter(c => c.status === "scheduled").length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgOpenRate: campaigns.filter(c => c.sent > 0).length > 0
      ? (campaigns.reduce((sum, c) => sum + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) / campaigns.filter(c => c.sent > 0).length).toFixed(1)
      : 0,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">Campagnes Email</h1>
          <Button onClick={fetchCampaigns} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Erreur de connexion Klaviyo</h3>
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
          <h1 className="text-3xl font-bold">Campagnes Email</h1>
          <p className="text-muted-foreground">
            {source === "klaviyo" ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Connecte a Klaviyo
              </span>
            ) : (
              "Gerez vos campagnes email marketing"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCampaigns} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button asChild>
            <a href="https://www.klaviyo.com/campaigns" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir Klaviyo
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Campagnes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.sent}</span>
            </div>
            <p className="text-sm text-muted-foreground">Envoyees</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{stats.scheduled}</span>
            </div>
            <p className="text-sm text-muted-foreground">Planifiees</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">{stats.totalSent.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Emails Envoyes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">{stats.avgOpenRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Taux Ouverture</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Toutes les Campagnes</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucune campagne</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {source === "fallback"
                  ? "Configurez votre cle API Klaviyo pour voir vos campagnes"
                  : "Creez votre premiere campagne dans Klaviyo"}
              </p>
              <Button asChild variant="outline">
                <a href="https://www.klaviyo.com/campaigns/create" target="_blank" rel="noopener noreferrer">
                  <Plus className="h-4 w-4 mr-2" />
                  Creer une campagne
                </a>
              </Button>
            </div>
          ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const StatusIcon = statusConfig[campaign.status].icon;
              const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0;
              const clickRate = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge className={statusConfig[campaign.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[campaign.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                      {campaign.scheduledAt && (
                        <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Planifie: {formatDate(campaign.scheduledAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {campaign.sent > 0 && (
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Envoyes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-400">{openRate}%</p>
                        <p className="text-xs text-muted-foreground">Ouverture</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sky-400">{clickRate}%</p>
                        <p className="text-xs text-muted-foreground">Clics</p>
                      </div>
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={() => window.open("https://www.klaviyo.com/campaigns", "_blank")}>
                    {campaign.status === "draft" ? "Editer" : "Voir Details"}
                  </Button>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
