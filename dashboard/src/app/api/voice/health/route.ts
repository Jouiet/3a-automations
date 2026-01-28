import { NextResponse } from "next/server";
import http from "http";

interface VoiceService {
  name: string;
  port: number;
  status: "healthy" | "unhealthy" | "unknown";
  latency: number | null;
  lastCheck: string;
  details?: Record<string, unknown>;
}

const VOICE_SERVICES = [
  { name: "Voice API", port: 3004, healthPath: "/health" },
  { name: "Grok Realtime", port: 3007, healthPath: "/health" },
  { name: "Telephony Bridge", port: 3009, healthPath: "/health" },
];

async function checkServiceHealth(
  service: typeof VOICE_SERVICES[0]
): Promise<VoiceService> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        name: service.name,
        port: service.port,
        status: "unknown",
        latency: null,
        lastCheck: new Date().toISOString(),
      });
    }, 5000);

    const req = http.get(
      {
        hostname: "localhost",
        port: service.port,
        path: service.healthPath,
        timeout: 4000,
      },
      (res) => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          let details: Record<string, unknown> = {};
          try {
            details = JSON.parse(data);
          } catch {
            // Not JSON response
          }

          resolve({
            name: service.name,
            port: service.port,
            status: res.statusCode === 200 ? "healthy" : "unhealthy",
            latency,
            lastCheck: new Date().toISOString(),
            details: Object.keys(details).length > 0 ? details : undefined,
          });
        });
      }
    );

    req.on("error", () => {
      clearTimeout(timeout);
      resolve({
        name: service.name,
        port: service.port,
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      });
    });

    req.on("timeout", () => {
      clearTimeout(timeout);
      req.destroy();
      resolve({
        name: service.name,
        port: service.port,
        status: "unknown",
        latency: null,
        lastCheck: new Date().toISOString(),
      });
    });
  });
}

export async function GET() {
  try {
    // Check all voice services in parallel
    const results = await Promise.all(
      VOICE_SERVICES.map(checkServiceHealth)
    );

    // Calculate overall health
    const healthyCount = results.filter((r) => r.status === "healthy").length;
    const totalServices = results.length;
    const overallHealth = Math.round((healthyCount / totalServices) * 100);

    // Get average latency of healthy services
    const healthyLatencies = results
      .filter((r) => r.status === "healthy" && r.latency !== null)
      .map((r) => r.latency as number);
    const avgLatency =
      healthyLatencies.length > 0
        ? Math.round(
            healthyLatencies.reduce((a, b) => a + b, 0) / healthyLatencies.length
          )
        : null;

    // Voice stack info
    const voiceStack = {
      primary: "Grok-4-1-fast",
      fallback1: "Atlas-Chat-9B",
      fallback2: "Atlas-Chat-27B",
      tts: "ElevenLabs",
      stt: "ElevenLabs Scribe",
    };

    // Languages supported
    const languages = [
      { code: "fr", name: "Francais", status: "active" },
      { code: "en", name: "English", status: "active" },
      { code: "ar", name: "العربية", status: "active" },
      { code: "es", name: "Espanol", status: "active" },
      { code: "darija", name: "Darija", status: "beta" },
    ];

    return NextResponse.json({
      success: true,
      data: {
        services: results,
        summary: {
          healthy: healthyCount,
          total: totalServices,
          healthPercentage: overallHealth,
          avgLatencyMs: avgLatency,
        },
        stack: voiceStack,
        languages,
      },
    });
  } catch (error) {
    console.error("[API] Voice health fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch voice health" },
      { status: 500 }
    );
  }
}
