import { NextResponse } from "next/server";
import { google } from "googleapis";
import * as fs from "fs";

export const dynamic = 'force-dynamic';

interface CalendarEvent {
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

function getEventType(summary: string): "call" | "meeting" | "demo" | "followup" {
  const lowerSummary = summary.toLowerCase();
  if (lowerSummary.includes("demo") || lowerSummary.includes("presentation")) {
    return "demo";
  }
  if (lowerSummary.includes("call") || lowerSummary.includes("appel")) {
    return "call";
  }
  if (lowerSummary.includes("suivi") || lowerSummary.includes("follow")) {
    return "followup";
  }
  return "meeting";
}

export async function GET() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    return NextResponse.json({
      success: false,
      error: "Google credentials not configured",
      fallback: true,
      data: [],
    });
  }

  try {
    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Get events from the next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    // Transform Google Calendar events to our format
    const transformedEvents: CalendarEvent[] = events.map((event) => {
      const start = event.start?.dateTime || event.start?.date || "";
      const end = event.end?.dateTime || event.end?.date || "";

      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

      return {
        id: event.id || "",
        title: event.summary || "Sans titre",
        type: getEventType(event.summary || ""),
        date: startDate.toISOString().split("T")[0],
        time: startDate.toTimeString().slice(0, 5),
        duration,
        attendees: event.attendees?.map((a) => a.email || "") || [],
        location: event.location || event.hangoutLink || undefined,
        notes: event.description || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedEvents,
      count: transformedEvents.length,
      source: "google-calendar",
    });
  } catch (error) {
    console.error("[Google Calendar API] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: true,
      data: [],
    });
  }
}
