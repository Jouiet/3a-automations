import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Learning Queue Stats API - Session 178
 * GET /api/learning/stats - Get queue statistics for dashboard widgets
 */

interface LearningFact {
  id: string;
  type: string;
  status: string;
  confidence: number;
  createdAt: string;
  reviewedAt?: string;
}

// Path goes up one directory from dashboard to project root
const QUEUE_PATH = path.join(process.cwd(), '..', 'data', 'learning', 'learning_queue.jsonl');

function readQueue(): LearningFact[] {
  if (!fs.existsSync(QUEUE_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(QUEUE_PATH, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as LearningFact;
        } catch {
          return null;
        }
      })
      .filter((f): f is LearningFact => f !== null);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const facts = readQueue();

    // Calculate stats
    const byStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      modified: 0
    };

    const byType: Record<string, number> = {
      gap: 0,
      correction: 0,
      insight: 0,
      faq: 0,
      feature_request: 0
    };

    let totalConfidence = 0;
    let oldestPendingDate: string | null = null;
    let newestPendingDate: string | null = null;

    for (const fact of facts) {
      // Count by status
      byStatus[fact.status] = (byStatus[fact.status] || 0) + 1;

      // Count by type
      byType[fact.type] = (byType[fact.type] || 0) + 1;

      // Track pending dates
      if (fact.status === 'pending') {
        totalConfidence += fact.confidence;
        if (!oldestPendingDate || fact.createdAt < oldestPendingDate) {
          oldestPendingDate = fact.createdAt;
        }
        if (!newestPendingDate || fact.createdAt > newestPendingDate) {
          newestPendingDate = fact.createdAt;
        }
      }
    }

    // Calculate average confidence of pending items
    const pendingCount = byStatus.pending || 0;
    const avgConfidence = pendingCount > 0 ? totalConfidence / pendingCount : 0;

    // Calculate approval rate
    const reviewed = (byStatus.approved || 0) + (byStatus.rejected || 0) + (byStatus.modified || 0);
    const approved = (byStatus.approved || 0) + (byStatus.modified || 0);
    const approvalRate = reviewed > 0 ? approved / reviewed : 0;

    // Calculate age of oldest pending (in hours)
    const oldestAgeHours = oldestPendingDate
      ? Math.round((Date.now() - new Date(oldestPendingDate).getTime()) / (1000 * 60 * 60))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        total: facts.length,
        byStatus,
        byType,
        pending: {
          count: pendingCount,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          oldestDate: oldestPendingDate,
          newestDate: newestPendingDate,
          oldestAgeHours
        },
        performance: {
          reviewed,
          approved,
          approvalRate: Math.round(approvalRate * 100)
        },
        health: {
          status: pendingCount > 100 ? 'warning' : pendingCount > 500 ? 'critical' : 'healthy',
          message: pendingCount > 100
            ? `${pendingCount} facts pending review`
            : 'Queue healthy'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Learning Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
