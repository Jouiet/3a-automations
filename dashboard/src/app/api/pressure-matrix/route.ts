import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

interface SensorData {
  status: string;
  lastUpdate: string;
  data?: Record<string, unknown>;
  error?: string;
}

interface PressureMatrixData {
  lastUpdate: string;
  sensors: Record<string, SensorData>;
  summary?: {
    total: number;
    ok: number;
    warning: number;
    error: number;
    healthScore: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sensor = searchParams.get("sensor");

    // Read pressure-matrix.json from landing-page-hostinger
    const matrixPath = path.join(
      process.cwd(),
      "..",
      "landing-page-hostinger",
      "data",
      "pressure-matrix.json"
    );

    if (!fs.existsSync(matrixPath)) {
      return NextResponse.json(
        { success: false, error: "Pressure matrix file not found" },
        { status: 404 }
      );
    }

    const matrixContent = fs.readFileSync(matrixPath, "utf8");
    const matrix: PressureMatrixData = JSON.parse(matrixContent);

    // If specific sensor requested
    if (sensor && matrix.sensors) {
      const sensorData = matrix.sensors[sensor];
      if (!sensorData) {
        return NextResponse.json(
          { success: false, error: `Sensor '${sensor}' not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          sensor,
          ...sensorData,
        },
      });
    }

    // Calculate summary if not present
    if (!matrix.summary && matrix.sensors) {
      const sensors = Object.values(matrix.sensors);
      const total = sensors.length;
      const ok = sensors.filter((s) => s.status === "ok" || s.status === "healthy").length;
      const warning = sensors.filter((s) => s.status === "warning" || s.status === "partial").length;
      const error = sensors.filter((s) => s.status === "error" || s.status === "blocked").length;
      const healthScore = total > 0 ? Math.round((ok / total) * 100) : 0;

      matrix.summary = { total, ok, warning, error, healthScore };
    }

    // Get age of data
    const lastUpdateTime = new Date(matrix.lastUpdate).getTime();
    const ageMinutes = Math.round((Date.now() - lastUpdateTime) / 60000);
    const isStale = ageMinutes > 30; // Consider stale after 30 minutes

    return NextResponse.json({
      success: true,
      data: {
        ...matrix,
        meta: {
          ageMinutes,
          isStale,
          source: "pressure-matrix.json",
        },
      },
    });
  } catch (error) {
    console.error("[API] Pressure matrix fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pressure matrix" },
      { status: 500 }
    );
  }
}
