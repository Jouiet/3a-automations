import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead, Lead } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const filters: Partial<Lead> = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const leads = await getLeads(Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lead = await createLead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      jobTitle: body.jobTitle,
      linkedinUrl: body.linkedinUrl,
      source: body.source || "manual",
      status: body.status || "new",
      score: body.score || 0,
      priority: body.priority || "medium",
      notes: body.notes,
      tags: body.tags || [],
      assignedTo: body.assignedTo,
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Failed to create lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
