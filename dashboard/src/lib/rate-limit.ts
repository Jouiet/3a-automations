/**
 * Simple in-memory rate limiter for Next.js API routes
 * For production, use Redis-based solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  // Maximum requests allowed in the window
  maxRequests: number;
  // Time window in seconds
  windowSeconds: number;
  // Key prefix for different endpoints
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const key = `${config.keyPrefix || "default"}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check standard proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get first IP in chain (original client)
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in production behind proxy)
  return "127.0.0.1";
}

// Preset configurations for common use cases
export const RateLimitPresets = {
  // Login: 5 attempts per minute (strict to prevent brute force)
  login: { maxRequests: 5, windowSeconds: 60, keyPrefix: "login" },

  // API general: 60 requests per minute
  api: { maxRequests: 60, windowSeconds: 60, keyPrefix: "api" },

  // Password reset: 3 attempts per 15 minutes
  passwordReset: { maxRequests: 3, windowSeconds: 900, keyPrefix: "pwd-reset" },

  // File upload: 10 per minute
  upload: { maxRequests: 10, windowSeconds: 60, keyPrefix: "upload" },
} as const;
