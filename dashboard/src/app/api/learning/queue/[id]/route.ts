import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Learning Queue Item API - Session 178
 * PATCH /api/learning/queue/[id] - Approve/Reject/Modify a fact
 *
 * Body:
 *   - action: 'approve' | 'reject' | 'modify'
 *   - reviewedBy: string (required)
 *   - modifiedFact?: string (required if action is 'modify')
 *   - notes?: string
 */

interface LearningFact {
  id: string;
  type: string;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queue = readQueue();
    const fact = queue.find(f => f.id === id);

    if (!fact) {
      return NextResponse.json(
        { success: false, error: 'Fact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fact
    });
  } catch (error) {
    console.error('[Learning Queue API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fact' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reviewedBy, modifiedFact, notes } = body;

    // Validate input
    if (!action || !['approve', 'reject', 'modify'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: approve, reject, or modify' },
        { status: 400 }
      );
    }

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'reviewedBy is required' },
        { status: 400 }
      );
    }

    if (action === 'modify' && !modifiedFact) {
      return NextResponse.json(
        { success: false, error: 'modifiedFact is required for modify action' },
        { status: 400 }
      );
    }

    // Read and update queue
    const queue = readQueue();
    const factIndex = queue.findIndex(f => f.id === id);

    if (factIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Fact not found' },
        { status: 404 }
      );
    }

    const fact = queue[factIndex];

    // Check if already processed
    if (fact.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Fact already ${fact.status}` },
        { status: 409 }
      );
    }

    // Map action to status
    const statusMap: Record<string, LearningFact['status']> = {
      approve: 'approved',
      reject: 'rejected',
      modify: 'modified'
    };

    // Update fact
    queue[factIndex] = {
      ...fact,
      status: statusMap[action],
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      ...(modifiedFact && { modifiedFact }),
      ...(notes && { notes })
    };

    // Write back
    writeQueue(queue);

    console.log(`[Learning Queue] Fact ${id} ${action}ed by ${reviewedBy}`);

    return NextResponse.json({
      success: true,
      data: queue[factIndex],
      message: `Fact ${action}ed successfully`
    });
  } catch (error) {
    console.error('[Learning Queue API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queue = readQueue();
    const factIndex = queue.findIndex(f => f.id === id);

    if (factIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Fact not found' },
        { status: 404 }
      );
    }

    // Remove fact
    queue.splice(factIndex, 1);
    writeQueue(queue);

    console.log(`[Learning Queue] Fact ${id} deleted`);

    return NextResponse.json({
      success: true,
      message: 'Fact deleted successfully'
    });
  } catch (error) {
    console.error('[Learning Queue API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete fact' },
      { status: 500 }
    );
  }
}
