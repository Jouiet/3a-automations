"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  type: "call" | "meeting" | "demo" | "followup";
  date: string;
  time: string;
  duration: number;
  attendees: string[];
  location?: string;
  notes?: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Demo 3A Automation - Marie Dupont",
    type: "demo",
    date: "2024-12-24",
    time: "14:00",
    duration: 45,
    attendees: ["marie.dupont@boutique-mode.com"],
    location: "Google Meet",
    notes: "Presentation pack Growth"
  },
  {
    id: "2",
    title: "Call suivi - TechStartup SAS",
    type: "call",
    date: "2024-12-24",
    time: "16:00",
    duration: 30,
    attendees: ["jean.martin@techstartup.fr"],
  },
  {
    id: "3",
    title: "Meeting mensuel equipe",
    type: "meeting",
    date: "2024-12-26",
    time: "10:00",
    duration: 60,
    attendees: ["team@3a-automation.com"],
    location: "Bureau"
  },
  {
    id: "4",
    title: "Demo Shopify Integration",
    type: "demo",
    date: "2024-12-27",
    time: "11:00",
    duration: 45,
    attendees: ["sophie@beaute-naturelle.ma"],
    location: "Zoom"
  },
  {
    id: "5",
    title: "Follow-up proposal - Algiers Trading",
    type: "followup",
    date: "2024-12-27",
    time: "15:00",
    duration: 20,
    attendees: ["ahmed@import-export.dz"],
  },
];

const typeConfig = {
  call: { label: "Appel", color: "bg-sky-500/20 text-sky-400", icon: Phone },
  meeting: { label: "Reunion", color: "bg-purple-500/20 text-purple-400", icon: Users },
  demo: { label: "Demo", color: "bg-emerald-500/20 text-emerald-400", icon: Video },
  followup: { label: "Suivi", color: "bg-amber-500/20 text-amber-400", icon: Clock },
};

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const todayEvents = events.filter(e => e.date === new Date().toISOString().split('T')[0]);
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 5);

  if (isLoading) {
    return <div className="h-96 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground">Gerez vos rendez-vous et reunions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">{monthName}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentDate).map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday = day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border border-border/30 rounded-lg ${
                      day ? 'hover:border-primary/50 cursor-pointer' : ''
                    } ${isToday ? 'bg-primary/10 border-primary/50' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>{day}</span>
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${typeConfig[event.type].color}`}
                            >
                              {event.time} {event.title.slice(0, 15)}...
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} autres</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              A Venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const TypeIcon = typeConfig[event.type].icon;
                return (
                  <div key={event.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeConfig[event.type].color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - {event.time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
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
