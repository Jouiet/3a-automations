import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUserLastLogin } from "@/lib/google-sheets";
import { comparePassword, generateToken } from "@/lib/auth";

// Fallback admin user for when Google Sheets is not configured
// Password: Admin3A2025 (bcrypt hash)
const FALLBACK_ADMIN = {
  id: "user_admin",
  email: "admin@3a-automation.com",
  name: "Admin 3A",
  password: "$2a$12$9gYq5nU4zuM5DUhWE5Mfx.0nfmzgwPg1vNd5/DSPZA3o6dKeE343G",
  role: "ADMIN" as const,
  createdAt: "2025-12-25T00:00:00.000Z",
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Try to get user from Google Sheets first
    let user = await getUserByEmail(email);

    // Fallback to hardcoded admin if Google Sheets fails or user not found
    if (!user && email === FALLBACK_ADMIN.email) {
      console.log("[Login] Using fallback admin user");
      user = FALLBACK_ADMIN;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password || "");

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Update last login
    await updateUserLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
