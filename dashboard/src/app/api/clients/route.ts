import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromCookie } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CLIENTS_DIR = path.join(process.cwd(), '..', 'clients');

interface ClientConfig {
  tenant_id: string;
  name: string;
  vertical: string;
  plan: string;
  status: string;
  created_at: string;
  features: Record<string, boolean>;
  integrations: Record<string, { enabled: boolean; connected_at: string | null }>;
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

function generateTenantId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

function loadAllClients(): ClientConfig[] {
  if (!fs.existsSync(CLIENTS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true });
  const clients: ClientConfig[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const configPath = path.join(CLIENTS_DIR, entry.name, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          clients.push(config);
        } catch {
          console.error(`Error reading config for ${entry.name}`);
        }
      }
    }
  }

  return clients;
}

/**
 * GET /api/clients
 * List all clients (Admin only)
 */
export async function GET() {
  try {
    const user = await getAuthUserFromCookie();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const vertical: string | null = null;
    const status: string | null = null;
    const plan: string | null = null;

    let clients = loadAllClients();

    // Apply filters
    if (vertical) {
      clients = clients.filter(c => c.vertical === vertical);
    }
    if (status) {
      clients = clients.filter(c => c.status === status);
    }
    if (plan) {
      clients = clients.filter(c => c.plan === plan);
    }

    // Sort by created_at desc
    clients.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      clients,
      total: clients.length,
      filters: { vertical, status, plan }
    });
  } catch (error) {
    console.error('Error listing clients:', error);
    return NextResponse.json(
      { error: 'Failed to list clients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromCookie();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, vertical, email, plan, contact } = body;

    // Validate required fields
    const errors: string[] = [];
    if (!name) errors.push('name is required');
    if (!vertical || !['shopify', 'b2b', 'agency'].includes(vertical)) {
      errors.push('vertical must be one of: shopify, b2b, agency');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email is required');
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const tenantId = generateTenantId(name);
    const clientDir = path.join(CLIENTS_DIR, tenantId);

    // Check if client already exists
    if (fs.existsSync(clientDir)) {
      return NextResponse.json(
        { error: `Client with ID '${tenantId}' already exists` },
        { status: 409 }
      );
    }

    // Load template
    const templatePath = path.join(CLIENTS_DIR, '_template', 'config.json');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Client template not found' },
        { status: 500 }
      );
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    const now = new Date().toISOString();

    // Create config
    let configStr = template
      .replace(/\{\{TENANT_ID\}\}/g, tenantId)
      .replace(/\{\{CLIENT_NAME\}\}/g, name)
      .replace(/\{\{CREATED_AT\}\}/g, now)
      .replace(/\{\{CONTACT_NAME\}\}/g, contact || name)
      .replace(/\{\{CONTACT_EMAIL\}\}/g, email);

    const config: ClientConfig = JSON.parse(configStr);
    config.vertical = vertical;
    if (plan) config.plan = plan;

    // Set vertical-specific defaults
    if (vertical === 'shopify') {
      config.features.voice_widget = true;
      config.features.email_automation = true;
      config.features.churn_prediction = true;
      config.integrations.shopify.enabled = true;
      config.integrations.klaviyo.enabled = true;
    } else if (vertical === 'b2b') {
      config.features.voice_telephony = true;
      config.integrations.hubspot.enabled = true;
    }

    // Create directories
    fs.mkdirSync(clientDir, { recursive: true });
    fs.mkdirSync(path.join(clientDir, 'logs'), { recursive: true });

    // Write config
    fs.writeFileSync(
      path.join(clientDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Write automation status
    fs.writeFileSync(
      path.join(clientDir, 'automation-status.json'),
      JSON.stringify({
        tenant_id: tenantId,
        automations: {},
        last_run: null,
        created_at: now
      }, null, 2)
    );

    return NextResponse.json({
      success: true,
      client: config,
      message: `Client '${name}' created successfully`,
      tenant_id: tenantId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
