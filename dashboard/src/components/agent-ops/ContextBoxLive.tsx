"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Activity, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionContext {
    sessionId: string;
    lastUpdate: string;
    status: "active" | "finalized";
    pillars: {
        identity?: { name?: string; email?: string };
        intent?: { need?: string; urgency?: string };
        qualification?: { score?: number };
    };
    events: number;
}

export function ContextBoxLive() {
    const [sessions, setSessions] = useState<SessionContext[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchContext = async () => {
        try {
            // SOTA: Real-time Context Box ingestion
            const res = await fetch("/api/agent-ops/context");
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error("Context Box fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContext();
        const interval = setInterval(fetchContext, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card className="glass-morphism border-primary/20">
                <CardContent className="p-12 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground animate-pulse-subtle">Synchronizing Unified Memory...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-morphism border-primary/20 overflow-hidden">
            <CardHeader className="border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                            <History className="h-5 w-5 text-primary" />
                            Unified Memory Hub
                        </CardTitle>
                        <CardDescription>Real-time visualization of the Context Box engine</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse-subtle">
                        LIVE ATLAS SYNC
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {sessions.length === 0 ? (
                        <div className="p-12 text-center">
                            <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No active session context detected.</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.sessionId} className="p-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm text-primary font-bold">{session.sessionId.substring(0, 12)}...</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                {session.status} · {session.events} Events
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={cn(
                                        "bg-primary/10 text-primary hover:bg-primary/20",
                                        session.pillars.qualification?.score && session.pillars.qualification.score > 70 && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    )}>
                                        Q-Score: {session.pillars.qualification?.score || 0}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    <div className="bg-white/5 rounded p-2 border border-white/5">
                                        <p className="text-[9px] text-muted-foreground uppercase mb-1">Identity</p>
                                        <p className="text-xs truncate font-medium">{session.pillars.identity?.name || "Unknown"}</p>
                                    </div>
                                    <div className="bg-white/5 rounded p-2 border border-white/5">
                                        <p className="text-[9px] text-muted-foreground uppercase mb-1">Intent</p>
                                        <p className="text-xs truncate font-medium">{session.pillars.intent?.need || "Scanning..."}</p>
                                    </div>
                                    <div className="bg-white/5 rounded p-2 border border-white/5">
                                        <p className="text-[9px] text-muted-foreground uppercase mb-1">Last Update</p>
                                        <p className="text-xs truncate font-medium">{new Date(session.lastUpdate).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
