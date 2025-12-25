import { NextRequest, NextResponse } from "next/server";

const N8N_HOST = process.env.N8N_HOST || "https://n8n.srv1168256.hstgr.cloud";
const N8N_API_KEY = process.env.N8N_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    if (!N8N_API_KEY) {
      return NextResponse.json(
        { success: false, error: "N8N_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    let url = `${N8N_HOST}/api/v1/workflows`;
    if (active !== null) {
      url += `?active=${active}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n/workflows] Error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform n8n response to our format
    const workflows = data.data?.map((wf: any) => ({
      id: wf.id,
      name: wf.name,
      active: wf.active,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
      nodes: wf.nodes?.length || 0,
      tags: wf.tags?.map((t: any) => t.name) || [],
    })) || [];

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length,
    });
  } catch (error) {
    console.error("[n8n/workflows] Exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!N8N_API_KEY) {
      return NextResponse.json(
        { success: false, error: "N8N_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { workflowId, action } = body;

    if (!workflowId || !action) {
      return NextResponse.json(
        { success: false, error: "workflowId and action required" },
        { status: 400 }
      );
    }

    let url = `${N8N_HOST}/api/v1/workflows/${workflowId}`;
    if (action === "activate") {
      url += "/activate";
    } else if (action === "deactivate") {
      url += "/deactivate";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'activate' or 'deactivate'" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n/workflows] Action error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("[n8n/workflows] POST Exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
