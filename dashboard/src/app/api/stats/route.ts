import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats, getActivities } from "@/lib/google-sheets";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "activities") {
      const limit = parseInt(searchParams.get("limit") || "10");
      const activities = await getActivities(limit);
      return NextResponse.json({
        success: true,
        data: activities
      });
    }

    // Default: dashboard stats
    const stats = await getDashboardStats();
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
