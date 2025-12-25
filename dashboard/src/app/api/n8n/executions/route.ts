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
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || "20";

    let url = `${N8N_HOST}/api/v1/executions?limit=${limit}`;
    if (workflowId) {
      url += `&workflowId=${workflowId}`;
    }
    if (status) {
      url += `&status=${status}`;
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
      console.error("[n8n/executions] Error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform n8n response to our format
    const executions = data.data?.map((exec: any) => ({
      id: exec.id,
      workflowId: exec.workflowId,
      workflowName: exec.workflowData?.name || "Unknown",
      status: exec.status,
      mode: exec.mode,
      startedAt: exec.startedAt,
      stoppedAt: exec.stoppedAt,
      finished: exec.finished,
      retryOf: exec.retryOf,
      retrySuccessId: exec.retrySuccessId,
    })) || [];

    // Calculate stats
    const stats = {
      total: executions.length,
      success: executions.filter((e: any) => e.status === "success").length,
      error: executions.filter((e: any) => e.status === "error").length,
      running: executions.filter((e: any) => e.status === "running").length,
      waiting: executions.filter((e: any) => e.status === "waiting").length,
    };

    return NextResponse.json({
      success: true,
      data: executions,
      stats: stats,
    });
  } catch (error) {
    console.error("[n8n/executions] Exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
