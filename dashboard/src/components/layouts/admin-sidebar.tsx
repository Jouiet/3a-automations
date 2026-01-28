"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  FileText,
  Cpu,
  History,
  ShieldCheck,
  ChevronDown,
  BrainCircuit,
  KeyRound,
  Building2,
  Radio,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Leads",
    href: "/admin/leads",
    icon: Users,
  },
  {
    name: "Agent Ops",
    href: "/admin/agent-ops",
    icon: Cpu,
    subItems: [
      { name: "Telemetry", href: "/admin/agent-ops/telemetry", icon: Zap },
      { name: "Context Box", href: "/admin/agent-ops/context", icon: History },
      { name: "Error Science", href: "/admin/agent-ops/error-science", icon: ShieldCheck },
      { name: "Learning Queue", href: "/admin/agent-ops/learning", icon: BrainCircuit },
    ]
  },
  {
    name: "Automations",
    href: "/admin/automations",
    icon: Zap,
  },
  {
    name: "Sensors GPM",
    href: "/admin/sensors",
    icon: Radio,
  },
  {
    name: "Integrations",
    href: "/admin/integrations",
    icon: Link2,
  },
  {
    name: "Campagnes Email",
    href: "/admin/campaigns",
    icon: Mail,
  },
  {
    name: "Calendrier",
    href: "/admin/calendar",
    icon: Calendar,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Rapports",
    href: "/admin/reports",
    icon: FileText,
  },
  {
    name: "Clients",
    href: "/admin/clients",
    icon: Building2,
  },
  {
    name: "Credentials",
    href: "/admin/credentials",
    icon: KeyRound,
  },
];

const bottomNavigation = [
  {
    name: "Parametres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Agent Ops"]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue with client cleanup even if API fails
    }
    // Clear client-side user data
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border/50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/logo.webp"
              alt="3A Automation"
              className="h-8 w-auto"
            />
            <span className="font-bold text-lg">Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] justify-between p-2">
        <div className="space-y-1 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.subItems?.some(s => pathname === s.href));
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name} className="space-y-1">
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => !collapsed && toggleExpand(item.name)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                        {!collapsed && <span>{item.name}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <div className="ml-4 space-y-1 border-l border-border/50 pl-2">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                                isSubActive
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <sub.icon className={cn("h-4 w-4 shrink-0", isSubActive && "text-primary")} />
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary cyber-glow"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-1 border-t border-border/50 pt-2">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
          {/* Theme Toggle */}
          <div className="flex items-center gap-3 px-3 py-2">
            <ThemeToggle />
            {!collapsed && <span className="text-sm text-muted-foreground">Theme</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
