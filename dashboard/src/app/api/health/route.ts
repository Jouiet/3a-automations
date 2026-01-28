import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const response = NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "3a-dashboard",
    buildId: process.env.BUILD_ID || "unknown",
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "MISSING",
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? "SET" : "MISSING",
      GOOGLE_SHEETS_API_URL: process.env.GOOGLE_SHEETS_API_URL ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV || "unknown"
    }
  });

  // Explicitly disable ALL caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}
