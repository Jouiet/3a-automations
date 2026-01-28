import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Google Sheets API for client documents
const APPS_SCRIPT_URL = process.env.GOOGLE_SHEETS_API_URL;

interface Document {
  id: string;
  name: string;
  type: "contract" | "invoice" | "report" | "guide";
  size: string;
  uploadedAt: string;
  status: "signed" | "pending" | "draft";
  url?: string;
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
      message: "Aucun document disponible. Configurez votre compte pour acceder a vos documents."
    });
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getDocuments&clientId=${clientId || ""}`, {
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
      data: data.documents || [],
      count: data.documents?.length || 0,
      source: "google-sheets"
    });
  } catch (error) {
    console.error("[Documents API] Error:", error);
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      source: "api-error",
      message: "Impossible de charger les documents. Reessayez plus tard."
    });
  }
}
