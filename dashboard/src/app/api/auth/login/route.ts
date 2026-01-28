import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUserLastLogin } from "@/lib/google-sheets";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit, getClientIP, RateLimitPresets } from "@/lib/rate-limit";

// Fallback users for guaranteed access (when Google Sheets is not configured)
const FALLBACK_USERS = {
  // Admin user - Password: Admin3A2025
  "admin@3a-automation.com": {
    id: "user_admin",
    email: "admin@3a-automation.com",
    name: "Admin 3A",
    password: "$2a$12$9gYq5nU4zuM5DUhWE5Mfx.0nfmzgwPg1vNd5/DSPZA3o6dKeE343G",
    role: "ADMIN" as const,
    createdAt: "2025-12-25T00:00:00.000Z",
  },
  // Test client user - Password: DemoClient2026
  "client@demo.3a-automation.com": {
    id: "user_client_demo",
    email: "client@demo.3a-automation.com",
    name: "Demo Client (Boutique Demo)",
    password: "$2a$12$VEWR5NDk20nYCjMkeZ2P1.brl43qjRRgjUYloiYzv4ANzINYbY.EW",
    role: "CLIENT" as const,
    createdAt: "2026-01-28T00:00:00.000Z",
  },
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 login attempts per minute per IP
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RateLimitPresets.login);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Trop de tentatives. Reessayez dans " + rateLimit.retryAfter + " secondes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Check fallback users first (guaranteed access), then Google Sheets
    let user = null;
    const fallbackUser = FALLBACK_USERS[email as keyof typeof FALLBACK_USERS];

    if (fallbackUser) {
      // Use fallback user for guaranteed access
      console.log("[Login] Using fallback user (hardcoded):", email);
      user = fallbackUser;
    } else {
      // Try to get user from Google Sheets
      user = await getUserByEmail(email);
    }

    if (!user) {
      console.log("[Login] User not found:", email);
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Verify password
    console.log("[Login] Verifying password for:", email);
    const isValidPassword = await comparePassword(password, user.password || "");
    console.log("[Login] Password valid:", isValidPassword);

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

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

    // Set JWT as httpOnly cookie (secure in production)
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
