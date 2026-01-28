import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Learning Queue Batch API - Session 178
 * POST /api/learning/batch - Bulk approve/reject facts
 *
 * Body:
 *   - ids: string[] (required)
 *   - action: 'approve' | 'reject' (required)
 *   - reviewedBy: string (required)
 */

interface LearningFact {
  id: string;
  type: string;
  pattern: string;
  source: object;
  userMessage: string;
  aiResponse: string;
  extractedFact: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
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

function writeQueue(facts: LearningFact[]): void {
  const content = facts.map(f => JSON.stringify(f)).join('\n') + '\n';
  fs.writeFileSync(QUEUE_PATH, content);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, reviewedBy } = body;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: approve or reject' },
        { status: 400 }
      );
    }

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'reviewedBy is required' },
        { status: 400 }
      );
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 100;
    if (ids.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Batch size exceeds limit of ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }

    // Read and update queue
    const queue = readQueue();
    const statusMap: Record<string, LearningFact['status']> = {
      approve: 'approved',
      reject: 'rejected'
    };

    const results = {
      updated: 0,
      skipped: 0,
      notFound: 0
    };

    const idsSet = new Set(ids);
    const now = new Date().toISOString();

    for (let i = 0; i < queue.length; i++) {
      if (idsSet.has(queue[i].id)) {
        if (queue[i].status === 'pending') {
          queue[i] = {
            ...queue[i],
            status: statusMap[action],
            reviewedAt: now,
            reviewedBy
          };
          results.updated++;
        } else {
          results.skipped++;
        }
        idsSet.delete(queue[i].id);
      }
    }

    results.notFound = idsSet.size;

    // Write back
    writeQueue(queue);

    console.log(`[Learning Queue] Batch ${action}: ${results.updated} updated, ${results.skipped} skipped, ${results.notFound} not found`);

    return NextResponse.json({
      success: true,
      results,
      message: `Batch ${action} completed: ${results.updated} facts updated`
    });
  } catch (error) {
    console.error('[Learning Queue Batch API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process batch' },
      { status: 500 }
    );
  }
}
