"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  FileCheck,
  FileSpreadsheet,
  File,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "contract" | "invoice" | "report" | "guide";
  size: string;
  uploadedAt: string;
  status: "signed" | "pending" | "draft";
  url?: string;
}

const typeConfig = {
  contract: { label: "Contrat", icon: FileCheck, color: "text-primary" },
  invoice: { label: "Facture", icon: FileSpreadsheet, color: "text-emerald-400" },
  report: { label: "Rapport", icon: FileText, color: "text-amber-400" },
  guide: { label: "Guide", icon: File, color: "text-purple-400" },
};

const statusConfig = {
  signed: { label: "Signe", color: "bg-emerald-500/20 text-emerald-400" },
  pending: { label: "En attente", color: "bg-amber-500/20 text-amber-400" },
  draft: { label: "Brouillon", color: "bg-gray-500/20 text-gray-400" },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/documents");
      const data = await response.json();

      if (!data.success && data.error) {
        setError(data.error);
        return;
      }

      setDocuments(data.data || []);
      if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
          <Button onClick={fetchDocuments} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Erreur de chargement</h3>
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
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Vos contrats, factures et documents</p>
        </div>
        <Button onClick={fetchDocuments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{documents.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">
                {documents.filter(d => d.status === "signed").length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Signes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">
                {documents.filter(d => d.type === "invoice").length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Factures</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-bold text-sky-400">
                {documents.filter(d => d.status === "pending").length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Tous les Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun document</h3>
              <p className="text-sm text-muted-foreground">
                {message || "Vos documents apparaitront ici une fois ajoutes a votre compte."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const TypeIcon = typeConfig[doc.type]?.icon || File;
                const typeColor = typeConfig[doc.type]?.color || "text-muted-foreground";
                const typeLabel = typeConfig[doc.type]?.label || doc.type;
                const statusColor = statusConfig[doc.status]?.color || "bg-gray-500/20 text-gray-400";
                const statusLabel = statusConfig[doc.status]?.label || doc.status;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        <TypeIcon className={`h-6 w-6 ${typeColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{doc.name}</h3>
                          <Badge className={statusColor}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {typeLabel} • {doc.size} • {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={!doc.url}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" disabled={!doc.url}>
                        <Download className="h-4 w-4 mr-2" />
                        Telecharger
                      </Button>
                    </div>
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
