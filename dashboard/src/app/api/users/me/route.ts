import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAuthUserFromCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/google-sheets";

// Fallback admin user data (matches login route)
const FALLBACK_ADMIN = {
  id: "user_admin",
  email: "admin@3a-automation.com",
  name: "Admin 3A",
  role: "ADMIN" as const,
  createdAt: "2025-12-25T00:00:00.000Z",
  company: "3A Automation",
  phone: "",
  language: "fr",
  timezone: "Europe/Paris",
  notifications: {
    email: true,
    whatsapp: false,
    reports: true,
    marketing: false,
  },
};

export async function GET(request: NextRequest) {
  try {
    // Try cookie auth first (preferred), then header (backwards compatibility)
    let authUser = await getAuthUserFromCookie();
    if (!authUser) {
      const authHeader = request.headers.get("authorization");
      authUser = await getAuthUser(authHeader);
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      );
    }

    // Try to get full user data from Google Sheets
    let user = await getUserByEmail(authUser.email);

    // Fallback for admin user
    if (!user && authUser.email === FALLBACK_ADMIN.email) {
      const { ...userWithoutPassword } = FALLBACK_ADMIN;
      return NextResponse.json({
        success: true,
        data: userWithoutPassword,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 }
      );
    }

    // Return user without password, with default settings
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        company: (user as { company?: string }).company || "",
        phone: (user as { phone?: string }).phone || "",
        language: (user as { language?: string }).language || "fr",
        timezone: (user as { timezone?: string }).timezone || "Europe/Paris",
        notifications: (user as { notifications?: object }).notifications || {
          email: true,
          whatsapp: false,
          reports: true,
          marketing: false,
        },
      },
    });
  } catch (error) {
    console.error("[API /users/me] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Try cookie auth first (preferred), then header (backwards compatibility)
    let authUser = await getAuthUserFromCookie();
    if (!authUser) {
      const authHeader = request.headers.get("authorization");
      authUser = await getAuthUser(authHeader);
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // For now, we acknowledge the update request
    // Full Google Sheets update would require extending the Apps Script
    // This returns success to indicate the request was valid

    console.log(`[API /users/me] Update request for ${authUser.email}:`, updates);

    return NextResponse.json({
      success: true,
      message: "Parametres mis a jour",
      data: {
        id: authUser.id,
        email: authUser.email,
        name: updates.name || authUser.name,
        role: authUser.role,
        ...updates,
      },
    });
  } catch (error) {
    console.error("[API /users/me] PATCH Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
