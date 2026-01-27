import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromCookie, AuthUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const CLIENTS_DIR = path.join(process.cwd(), '..', 'clients');

interface ClientConfig {
  tenant_id: string;
  name: string;
  vertical: string;
  plan: string;
  status: string;
  created_at: string;
  features: Record<string, boolean>;
  integrations: Record<string, unknown>;
  contacts: {
    primary: { name: string; email: string; phone: string | null };
  };
  voice_config: {
    persona: string;
    language: string;
    theme: { primary_color: string; position: string };
  };
  billing: {
    stripe_customer_id: string | null;
    plan_started_at: string | null;
    monthly_revenue: number;
  };
}

function loadClient(tenantId: string): ClientConfig | null {
  const configPath = path.join(CLIENTS_DIR, tenantId, 'config.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
}

function saveClient(tenantId: string, config: ClientConfig): void {
  const configPath = path.join(CLIENTS_DIR, tenantId, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function canAccessClient(
  user: AuthUser,
  tenantId: string
): boolean {
  // Admin can access all clients
  if (user.role === 'ADMIN') return true;

  // Client can only access their own tenant (tenantId would be in user.id or a custom field)
  // For now, we allow clients to access only if they're admin
  // TODO: Add tenantId to AuthUser when multi-tenant is fully implemented

  return false;
}

/**
 * GET /api/clients/[id]
 * Get client details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromCookie();
    const { id: tenantId } = await params;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!canAccessClient(user, tenantId)) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this client.' },
        { status: 403 }
      );
    }

    const client = loadClient(tenantId);

    if (!client) {
      return NextResponse.json(
        { error: `Client '${tenantId}' not found` },
        { status: 404 }
      );
    }

    // Load automation status if exists
    const statusPath = path.join(CLIENTS_DIR, tenantId, 'automation-status.json');
    let automationStatus = null;
    if (fs.existsSync(statusPath)) {
      try {
        automationStatus = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      client,
      automation_status: automationStatus
    });
  } catch (error) {
    console.error('Error getting client:', error);
    return NextResponse.json(
      { error: 'Failed to get client' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id]
 * Update client configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromCookie();
    const { id: tenantId } = await params;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!canAccessClient(user, tenantId)) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this client.' },
        { status: 403 }
      );
    }

    const client = loadClient(tenantId);

    if (!client) {
      return NextResponse.json(
        { error: `Client '${tenantId}' not found` },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Allowed updates for CLIENT role
    const clientAllowedFields = [
      'voice_config',
      'contacts',
      'features'
    ];

    // Admin can update anything except tenant_id and created_at
    const adminProtectedFields = ['tenant_id', 'created_at'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = client as any;

    if (user.role === 'ADMIN') {
      // Remove protected fields from updates
      for (const field of adminProtectedFields) {
        delete updates[field];
      }

      // Deep merge updates
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          clientAny[key] = { ...clientAny[key], ...value };
        } else {
          clientAny[key] = value;
        }
      }
    } else {
      // CLIENT role - only allowed fields
      for (const field of clientAllowedFields) {
        if (field in updates) {
          if (typeof updates[field] === 'object' && updates[field] !== null) {
            clientAny[field] = { ...clientAny[field], ...updates[field] };
          } else {
            clientAny[field] = updates[field];
          }
        }
      }
    }

    // Save updated config
    saveClient(tenantId, client);

    return NextResponse.json({
      success: true,
      client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromCookie();
    const { id: tenantId } = await params;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const clientDir = path.join(CLIENTS_DIR, tenantId);

    if (!fs.existsSync(clientDir)) {
      return NextResponse.json(
        { error: `Client '${tenantId}' not found` },
        { status: 404 }
      );
    }

    // Soft delete - rename directory
    const deletedDir = path.join(CLIENTS_DIR, `_deleted_${tenantId}_${Date.now()}`);
    fs.renameSync(clientDir, deletedDir);

    return NextResponse.json({
      success: true,
      message: `Client '${tenantId}' deleted (soft delete)`,
      archived_to: deletedDir
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
