/**
 * PKCE (Proof Key for Code Exchange) Utilities
 *
 * Implements RFC 7636 for OAuth 2.0 with PKCE
 * Used by providers requiring enhanced security (Klaviyo, etc.)
 */

import crypto from "crypto";

/**
 * Generate a cryptographically random code verifier
 * @returns 43-128 character base64url-encoded string
 */
export function generateCodeVerifier(): string {
  // 32 bytes = 43 characters in base64url
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate code challenge from verifier using S256 method
 * @param verifier - The code verifier
 * @returns SHA-256 hash of verifier, base64url-encoded
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generate a cryptographically random state parameter
 * @returns 32 character hex string
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate a cryptographically random nonce
 * @returns 32 character hex string
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate complete PKCE pair for OAuth flow
 * @returns Object with verifier, challenge, and state
 */
export function generatePKCEPair(): {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
} {
  const codeVerifier = generateCodeVerifier();
  return {
    codeVerifier,
    codeChallenge: generateCodeChallenge(codeVerifier),
    state: generateState(),
    nonce: generateNonce(),
  };
}

/**
 * Verify state parameter matches
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyState(received: string, stored: string): boolean {
  if (received.length !== stored.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(
      Buffer.from(received),
      Buffer.from(stored)
    );
  } catch {
    return false;
  }
}
