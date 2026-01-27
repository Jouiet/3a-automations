import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Learning Queue API - Session 178
 * GET /api/learning/queue - List pending facts for human validation
 *
 * Query params:
 *   - status: 'pending' | 'approved' | 'rejected' | 'all' (default: 'pending')
 *   - type: 'gap' | 'correction' | 'insight' | 'faq' | 'feature_request'
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */

interface LearningFact {
  id: string;
  type: 'gap' | 'correction' | 'insight' | 'faq' | 'feature_request';
  pattern: string;
  source: {
    sessionId: string;
    messageIndex: number;
    timestamp: string;
  };
  userMessage: string;
  aiResponse: string;
  extractedFact: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  modifiedFact?: string;
}

const QUEUE_PATH = path.join(process.cwd(), 'data', 'learning', 'learning_queue.jsonl');

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

function getStats(facts: LearningFact[]) {
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const fact of facts) {
    byStatus[fact.status] = (byStatus[fact.status] || 0) + 1;
    byType[fact.type] = (byType[fact.type] || 0) + 1;
  }

  return {
    total: facts.length,
    byStatus,
    byType
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pending';
    const typeFilter = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const allFacts = readQueue();

    // Filter by status
    let filtered = statusFilter === 'all'
      ? allFacts
      : allFacts.filter(f => f.status === statusFilter);

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(f => f.type === typeFilter);
    }

    // Sort by confidence (highest first) and date (newest first)
    filtered.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);
    const stats = getStats(allFacts);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length
      },
      stats
    });
  } catch (error) {
    console.error('[Learning Queue API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning queue' },
      { status: 500 }
    );
  }
}
