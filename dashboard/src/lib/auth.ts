/**
 * Simple Email/Password Authentication
 * Uses JWT tokens and bcrypt for password hashing
 * Compatible with Google Sheets backend
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "3a-automation-secret-key-2025";
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
