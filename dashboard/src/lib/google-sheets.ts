/**
 * Google Sheets Database Layer
 * Uses Google Sheets as the primary database for 3A Dashboard
 */

interface SheetConfig {
  spreadsheetId: string;
  sheets: {
    users: string;
    leads: string;
    automations: string;
    interactions: string;
    metrics: string;
    activities: string;
  };
}

const config: SheetConfig = {
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || "",
  sheets: {
    users: "Users",
    leads: "Leads",
    automations: "Automations",
    interactions: "Interactions",
    metrics: "Metrics",
    activities: "Activities",
  },
};

// Google Sheets API endpoint via Apps Script
const SHEETS_API = process.env.GOOGLE_SHEETS_API_URL || "";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function sheetsRequest<T>(
  action: string,
  sheet: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    // Google Apps Script redirects POST requests
    // We need to follow the redirect to get the actual response
    const response = await fetch(SHEETS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sheet, data }),
      redirect: "follow",
    });

    // Get response as text first to handle any encoding issues
    const text = await response.text();

    // Try to parse as JSON
    try {
      const result = JSON.parse(text);
      return result;
    } catch {
      // If not JSON, it might be an error page
      console.error("Google Sheets API returned non-JSON:", text.substring(0, 200));
      return {
        success: false,
        error: "Invalid response from Google Sheets API",
      };
    }
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// USER OPERATIONS
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: "ADMIN" | "CLIENT" | "VIEWER";
  createdAt: string;
  lastLogin?: string;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sheetsRequest<User>("getByEmail", config.sheets.users, { email });
  return result.success ? result.data || null : null;
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User | null> {
  const result = await sheetsRequest<User>("create", config.sheets.users, {
    ...user,
    id: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  return result.success ? result.data || null : null;
}

export async function updateUserLastLogin(userId: string): Promise<boolean> {
  const result = await sheetsRequest("update", config.sheets.users, {
    id: userId,
    lastLogin: new Date().toISOString(),
  });
  return result.success;
}

// ============================================
// LEAD OPERATIONS
// ============================================

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  source: string;
  status: string;
  score: number;
  priority: string;
  notes?: string;
  tags: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  nextFollowUp?: string;
}

export async function getLeads(filters?: Partial<Lead>): Promise<Lead[]> {
  const result = await sheetsRequest<Lead[]>("list", config.sheets.leads, filters);
  return result.success ? result.data || [] : [];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await sheetsRequest<Lead>("getById", config.sheets.leads, { id });
  return result.success ? result.data || null : null;
}

export async function createLead(lead: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead | null> {
  const now = new Date().toISOString();
  const result = await sheetsRequest<Lead>("create", config.sheets.leads, {
    ...lead,
    id: `lead_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  });
  return result.success ? result.data || null : null;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const result = await sheetsRequest<Lead>("update", config.sheets.leads, {
    id,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return result.success ? result.data || null : null;
}

export async function deleteLead(id: string): Promise<boolean> {
  const result = await sheetsRequest("delete", config.sheets.leads, { id });
  return result.success;
}

// ============================================
// AUTOMATION OPERATIONS
// ============================================

export interface Automation {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "DISABLED";
  n8nWorkflowId?: string;
  schedule?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  ownerId: string;
  createdAt: string;
}

export async function getAutomations(filters?: Partial<Automation>): Promise<Automation[]> {
  const result = await sheetsRequest<Automation[]>("list", config.sheets.automations, filters);
  return result.success ? result.data || [] : [];
}

export async function updateAutomationStatus(
  id: string,
  status: Automation["status"]
): Promise<boolean> {
  const result = await sheetsRequest("update", config.sheets.automations, { id, status });
  return result.success;
}

export async function logAutomationExecution(
  id: string,
  success: boolean
): Promise<boolean> {
  const result = await sheetsRequest("incrementRun", config.sheets.automations, {
    id,
    success,
    lastRunAt: new Date().toISOString(),
  });
  return result.success;
}

// ============================================
// METRICS OPERATIONS
// ============================================

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  category: string;
  date: string;
}

export async function getMetrics(
  category?: string,
  startDate?: string,
  endDate?: string
): Promise<Metric[]> {
  const result = await sheetsRequest<Metric[]>("list", config.sheets.metrics, {
    category,
    startDate,
    endDate,
  });
  return result.success ? result.data || [] : [];
}

export async function recordMetric(metric: Omit<Metric, "id">): Promise<boolean> {
  const result = await sheetsRequest("create", config.sheets.metrics, {
    ...metric,
    id: `metric_${Date.now()}`,
  });
  return result.success;
}

// ============================================
// ACTIVITY OPERATIONS
// ============================================

export interface Activity {
  id: string;
  userId?: string;
  leadId?: string;
  action: string;
  details?: string;
  createdAt: string;
}

export async function getActivities(limit?: number): Promise<Activity[]> {
  const result = await sheetsRequest<Activity[]>("list", config.sheets.activities, { limit });
  return result.success ? result.data || [] : [];
}

export async function logActivity(activity: Omit<Activity, "id" | "createdAt">): Promise<boolean> {
  const result = await sheetsRequest("create", config.sheets.activities, {
    ...activity,
    id: `activity_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  return result.success;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  qualifiedLeads: number;
  conversionRate: number;
  activeAutomations: number;
  automationErrors: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await sheetsRequest<DashboardStats>("getDashboardStats", "system", {});
  return (
    result.data || {
      totalLeads: 0,
      newLeadsToday: 0,
      qualifiedLeads: 0,
      conversionRate: 0,
      activeAutomations: 0,
      automationErrors: 0,
      revenueThisMonth: 0,
      revenueGrowth: 0,
    }
  );
}
