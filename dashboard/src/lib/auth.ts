/**
 * Simple Email/Password Authentication
 * Uses JWT tokens and bcrypt for password hashing
 * Compatible with Google Sheets backend
 *
 * Security: JWT stored in httpOnly cookie (not accessible via JS)
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set. Cannot start application.");
}
const JWT_EXPIRES_IN = "7d";

export type UserRole = "ADMIN" | "CLIENT" | "VIEWER";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware helper to check authentication
 */
export async function getAuthUser(authHeader: string | null): Promise<AuthUser | null> {
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    name: payload.email.split("@")[0],
    role: payload.role,
  };
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Role hierarchy check
 */
export function canAccessAdminPanel(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canAccessClientPortal(role: UserRole): boolean {
  return role === "ADMIN" || role === "CLIENT";
}

export function canViewReports(role: UserRole): boolean {
  return role === "ADMIN" || role === "CLIENT" || role === "VIEWER";
}

/**
 * Set JWT token in httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear auth cookie (logout)
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Get token from httpOnly cookie (server-side)
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Get authenticated user from cookie (preferred) or header (fallback)
 */
export async function getAuthUserFromCookie(): Promise<AuthUser | null> {
  const token = await getTokenFromCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    name: payload.email.split("@")[0],
    role: payload.role,
  };
}
