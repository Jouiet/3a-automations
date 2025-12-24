"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "contract" | "invoice" | "report" | "guide";
  size: string;
  uploadedAt: string;
  status: "signed" | "pending" | "draft";
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Contrat Pack Growth - Decembre 2024",
    type: "contract",
    size: "245 KB",
    uploadedAt: "2024-12-01",
    status: "signed"
  },
  {
    id: "2",
    name: "Facture #2024-12-001",
    type: "invoice",
    size: "89 KB",
    uploadedAt: "2024-12-15",
    status: "signed"
  },
  {
    id: "3",
    name: "Guide Integration Shopify",
    type: "guide",
    size: "1.2 MB",
    uploadedAt: "2024-12-01",
    status: "signed"
  },
  {
    id: "4",
    name: "Rapport Performance Q4 2024",
    type: "report",
    size: "567 KB",
    uploadedAt: "2024-12-20",
    status: "signed"
  },
  {
    id: "5",
    name: "Avenant Retainer 2025",
    type: "contract",
    size: "156 KB",
    uploadedAt: "2024-12-23",
    status: "pending"
  },
];

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
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (isLoading) {
    return <div className="h-96 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Vos contrats, factures et documents</p>
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
          <div className="space-y-4">
            {documents.map((doc) => {
              const TypeIcon = typeConfig[doc.type].icon;
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <TypeIcon className={`h-6 w-6 ${typeConfig[doc.type].color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.name}</h3>
                        <Badge className={statusConfig[doc.status].color}>
                          {statusConfig[doc.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeConfig[doc.type].label} • {doc.size} • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Telecharger
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
