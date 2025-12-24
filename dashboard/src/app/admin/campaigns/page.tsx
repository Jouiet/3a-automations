"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  Users,
  MousePointer,
  Eye,
  Plus,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
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
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Newsletter Noel 2024",
    subject: "Offres speciales de Noel - Jusqu'a -50%",
    status: "sent",
    type: "newsletter",
    recipients: 2450,
    sent: 2438,
    opened: 1024,
    clicked: 312,
    sentAt: "2024-12-20T10:00:00Z"
  },
  {
    id: "2",
    name: "Black Friday Recap",
    subject: "Merci pour votre confiance - Resultats Black Friday",
    status: "sent",
    type: "newsletter",
    recipients: 1850,
    sent: 1842,
    opened: 892,
    clicked: 234,
    sentAt: "2024-12-02T14:00:00Z"
  },
  {
    id: "3",
    name: "Nouvel An 2025",
    subject: "Bonne annee 2025 - Nouvelles automations",
    status: "scheduled",
    type: "newsletter",
    recipients: 2680,
    sent: 0,
    opened: 0,
    clicked: 0,
    scheduledAt: "2025-01-01T09:00:00Z"
  },
  {
    id: "4",
    name: "Welcome Series - Email 1",
    subject: "Bienvenue chez 3A Automation",
    status: "sending",
    type: "automation",
    recipients: 156,
    sent: 89,
    opened: 67,
    clicked: 23,
  },
  {
    id: "5",
    name: "Re-engagement Q4",
    subject: "Vous nous manquez - Decouvrez nos nouveautes",
    status: "draft",
    type: "newsletter",
    recipients: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
  },
];

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-500/20 text-gray-400", icon: PauseCircle },
  scheduled: { label: "Planifie", color: "bg-amber-500/20 text-amber-400", icon: Calendar },
  sending: { label: "En cours", color: "bg-sky-500/20 text-sky-400", icon: Send },
  sent: { label: "Envoye", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  paused: { label: "En pause", color: "bg-orange-500/20 text-orange-400", icon: PauseCircle },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campagnes Email</h1>
          <p className="text-muted-foreground">Gerez vos campagnes email marketing</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Campagne
        </Button>
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

                  <Button variant="outline" size="sm">
                    {campaign.status === "draft" ? "Editer" : "Voir Details"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
