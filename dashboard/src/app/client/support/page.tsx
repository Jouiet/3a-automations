"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  lastUpdate: string;
  messages: number;
}

const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    subject: "Question sur l'integration Shopify",
    status: "open",
    priority: "medium",
    createdAt: "2024-12-22",
    lastUpdate: "2024-12-24",
    messages: 3
  },
  {
    id: "TKT-002",
    subject: "Probleme avec workflow email",
    status: "resolved",
    priority: "high",
    createdAt: "2024-12-15",
    lastUpdate: "2024-12-18",
    messages: 5
  },
  {
    id: "TKT-003",
    subject: "Demande d'ajout de fonctionnalite",
    status: "pending",
    priority: "low",
    createdAt: "2024-12-20",
    lastUpdate: "2024-12-21",
    messages: 2
  },
];

const statusConfig = {
  open: { label: "Ouvert", color: "bg-sky-500/20 text-sky-400", icon: AlertCircle },
  pending: { label: "En attente", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  resolved: { label: "Resolu", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: "Basse", color: "text-gray-400" },
  medium: { label: "Moyenne", color: "text-amber-400" },
  high: { label: "Haute", color: "text-red-400" },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [isLoading, setIsLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to Google Sheets via Apps Script
    console.log("New ticket:", newTicket);
    setNewTicket({ subject: "", message: "" });
  };

  if (isLoading) {
    return <div className="h-96 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="text-muted-foreground">Besoin d'aide? Contactez notre equipe</p>
      </div>

      {/* Contact Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">contact@3a-automation.com</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Phone className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">+212 6XX XXX XXX</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10">
              <HelpCircle className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">Guides & FAQ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Ticket Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Nouveau Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sujet</label>
                <Input
                  placeholder="Decrivez votre probleme en quelques mots"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Donnez-nous plus de details sur votre demande..."
                  rows={5}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="bg-background resize-none"
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Envoyer le Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mes Tickets ({tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status].icon;
                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{ticket.id}</span>
                          <Badge className={statusConfig[ticket.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[ticket.status].label}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Cree le {formatDate(ticket.createdAt)}</span>
                          <span className={priorityConfig[ticket.priority].color}>
                            Priorite {priorityConfig[ticket.priority].label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{ticket.messages}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
