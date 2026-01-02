/**
 * Next.js Middleware for API Security
 * - Rate limiting for API routes (general protection)
 * - CSRF protection for state-changing requests
 * - Security headers
 *
 * Session 119 - 2026-01-02
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter for middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute for general API

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return `middleware:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Cleanup old entries periodically (every 100 requests)
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// CSRF: Check for custom header on state-changing requests
function validateCSRF(request: NextRequest): boolean {
  const method = request.method;

  // Only check state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  // Allow requests with X-Requested-With header (AJAX protection)
  // This header cannot be set by cross-origin requests without CORS preflight
  const xRequestedWith = request.headers.get("x-requested-with");
  if (xRequestedWith === "XMLHttpRequest" || xRequestedWith === "fetch") {
    return true;
  }

  // Allow requests with our custom CSRF header
  const csrfHeader = request.headers.get("x-csrf-token");
  if (csrfHeader) {
    return true;
  }

  // Allow requests with Content-Type: application/json
  // Cross-origin requests with this content-type trigger CORS preflight
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip rate limiting for health check
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  const { allowed, remaining } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // CSRF protection for non-GET requests
  if (!validateCSRF(request)) {
    return NextResponse.json(
      { error: "Invalid request. Missing security headers." },
      { status: 403 }
    );
  }

  // Add security headers to response
  const response = NextResponse.next();

  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
