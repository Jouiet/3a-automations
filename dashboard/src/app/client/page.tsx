"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  TrendingUp,
  Mail,
  Users,
  ArrowUpRight,
  Calendar,
  FileText,
  HelpCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface ClientStats {
  activeAutomations: number;
  emailsSent: number;
  leadsGenerated: number;
  tasksCompleted: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  date: string;
  type: "meeting" | "report" | "review";
}

interface RecentActivity {
  id: string;
  message: string;
  time: string;
  type: "automation" | "email" | "lead";
}

const mockStats: ClientStats = {
  activeAutomations: 12,
  emailsSent: 3456,
  leadsGenerated: 89,
  tasksCompleted: 45,
};

const mockTasks: UpcomingTask[] = [
  { id: "1", title: "Call mensuel performance", date: "26 Dec 2024", type: "meeting" },
  { id: "2", title: "Rapport Q4 2024", date: "31 Dec 2024", type: "report" },
  { id: "3", title: "Review automation email", date: "02 Jan 2025", type: "review" },
];

const mockActivities: RecentActivity[] = [
  { id: "1", message: "Campagne 'Noel 2024' envoyee a 1,200 contacts", time: "Il y a 2h", type: "email" },
  { id: "2", message: "Nouveau lead qualifie: Sophie M.", time: "Il y a 4h", type: "lead" },
  { id: "3", message: "Workflow 'Welcome' execute avec succes", time: "Il y a 6h", type: "automation" },
  { id: "4", message: "15 nouveaux abonnes newsletter", time: "Il y a 1 jour", type: "lead" },
];

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<ClientStats>(mockStats);
  const [tasks, setTasks] = useState<UpcomingTask[]>(mockTasks);
  const [activities, setActivities] = useState<RecentActivity[]>(mockActivities);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              <Badge variant="success" className="gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Actif
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.activeAutomations}</p>
              <p className="text-sm text-muted-foreground">Automations actives</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Ce mois</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.emailsSent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Emails envoyes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-amber-400" />
              <span className="text-xs text-muted-foreground">Ce mois</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.leadsGenerated}</p>
              <p className="text-sm text-muted-foreground">Leads generes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-sky-400" />
              <span className="text-xs text-muted-foreground">Ce mois</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stats.tasksCompleted}</p>
              <p className="text-sm text-muted-foreground">Taches completees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Overview */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance ce mois
            </CardTitle>
            <CardDescription>
              Vue d&apos;ensemble de vos resultats automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Graphique de performance</p>
                <p className="text-xs">(Leads, Emails, Conversions)</p>
              </div>
            </div>

            {/* Summary stats below chart */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">42.3%</p>
                <p className="text-sm text-muted-foreground">Taux ouverture</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">8.7%</p>
                <p className="text-sm text-muted-foreground">Taux de clic</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-sky-400">27.4%</p>
                <p className="text-sm text-muted-foreground">Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              A venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    {task.type === "meeting" && <Calendar className="h-4 w-4 text-primary" />}
                    {task.type === "report" && <FileText className="h-4 w-4 text-emerald-400" />}
                    {task.type === "review" && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Activite Recente</CardTitle>
            <CardDescription>Dernieres actions de vos automations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    {activity.type === "email" && <Mail className="h-4 w-4 text-emerald-400" />}
                    {activity.type === "lead" && <Users className="h-4 w-4 text-amber-400" />}
                    {activity.type === "automation" && <Zap className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Voir mes rapports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Mes automations
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Planifier un appel
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Contacter le support
            </Button>
            <div className="pt-2">
              <Button className="w-full" asChild>
                <a href="https://3a-automation.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visiter 3a-automation.com
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
