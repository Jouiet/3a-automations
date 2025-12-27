"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Loader2,
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/tickets");
      const data = await response.json();

      if (!data.success && data.error) {
        setError(data.error);
        return;
      }

      setTickets(data.data || []);
      if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          message: newTicket.message,
          priority: "medium"
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setNewTicket({ subject: "", message: "" });
        // Refresh tickets list
        fetchTickets();
      } else {
        setError(data.error || "Erreur lors de l'envoi du ticket");
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
      setError("Erreur lors de l'envoi du ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-muted rounded animate-pulse" />
          <div className="h-80 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">Besoin d'aide? Contactez notre equipe</p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
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
              <p className="text-sm text-muted-foreground">Reponse sous 24h</p>
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
            {submitSuccess && (
              <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Ticket envoye avec succes! Nous vous repondrons dans les 24h.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sujet</label>
                <Input
                  placeholder="Decrivez votre probleme en quelques mots"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="bg-background"
                  required
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
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer le Ticket
                  </>
                )}
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
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Aucun ticket</h3>
                <p className="text-sm text-muted-foreground">
                  {message || "Utilisez le formulaire pour creer votre premier ticket de support."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                  const statusColor = statusConfig[ticket.status]?.color || "bg-gray-500/20 text-gray-400";
                  const statusLabel = statusConfig[ticket.status]?.label || ticket.status;
                  const priorityColor = priorityConfig[ticket.priority]?.color || "text-gray-400";
                  const priorityLabel = priorityConfig[ticket.priority]?.label || ticket.priority;

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">{ticket.id}</span>
                            <Badge className={statusColor}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabel}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Cree le {formatDate(ticket.createdAt)}</span>
                            <span className={priorityColor}>
                              Priorite {priorityLabel}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
