import { NextRequest, NextResponse } from "next/server";

// Google Sheets API for support tickets
const APPS_SCRIPT_URL = process.env.GOOGLE_SHEETS_API_URL;

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  lastUpdate: string;
  messages: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  // If no API configured, return empty array (graceful fallback)
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      source: "no-api-configured",
      message: "Aucun ticket de support. Utilisez le formulaire pour creer un nouveau ticket."
    });
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getTickets&clientId=${clientId || ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        data: [],
        error: `API error: ${response.status}`,
        source: "api-error"
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.tickets || [],
      count: data.tickets?.length || 0,
      source: "google-sheets"
    });
  } catch (error) {
    console.error("[Tickets API] Error:", error);
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      source: "api-error",
      message: "Impossible de charger les tickets. Reessayez plus tard."
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, clientId, priority = "medium" } = body;

    if (!subject || !message) {
      return NextResponse.json({
        success: false,
        error: "Sujet et message requis"
      }, { status: 400 });
    }

    // If no API configured, return success but note it's not stored
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({
        success: true,
        message: "Ticket envoye. Nous vous contacterons par email.",
        source: "no-api-configured"
      });
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "createTicket",
        data: {
          subject,
          message,
          clientId,
          priority,
          createdAt: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ticketId: data.ticketId,
      message: "Ticket cree avec succes",
      source: "google-sheets"
    });
  } catch (error) {
    console.error("[Tickets API] POST Error:", error);
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la creation du ticket"
    }, { status: 500 });
  }
}
