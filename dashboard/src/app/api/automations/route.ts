import { NextRequest, NextResponse } from "next/server";
import { getAutomations, updateAutomationStatus, Automation } from "@/lib/google-sheets";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Automation["status"] | null;
    const ownerId = searchParams.get("ownerId");

    const filters: Partial<Automation> = {};
    if (status) filters.status = status;
    if (ownerId) filters.ownerId = ownerId;

    const automations = await getAutomations(Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({
      success: true,
      data: automations,
      count: automations.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

    const success = await updateAutomationStatus(id, status);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to update automation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
