import { getBackendSupabaseClient } from './supabase.js';

/**
 * Backend Supabase Queries & Database Operations
 * Strictly reads credentials from backend environment variables.
 * NO HARDCODED SECRETS.
 */

// 1. Audit Logs Queries
export async function insertAuditLog(log: {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  category: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
}) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'Supabase client not configured in backend environment' };

  try {
    const { data, error } = await client.from('audit_logs').insert([
      {
        id: log.id,
        timestamp: log.timestamp,
        staff_id: log.staffId,
        staff_name: log.staffName,
        staff_role: log.staffRole,
        category: log.category,
        action: log.action,
        details: log.details,
        metadata: log.metadata || {},
      },
    ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('insertAuditLog error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function fetchAuditLogs(limit: number = 100) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, logs: [] };

  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      timestamp: d.timestamp,
      staffId: d.staff_id,
      staffName: d.staff_name,
      staffRole: d.staff_role,
      category: d.category,
      action: d.action,
      details: d.details,
      metadata: d.metadata,
    }));

    return { success: true, logs: mapped };
  } catch (err: any) {
    console.error('fetchAuditLogs error:', err.message);
    return { success: false, logs: [], error: err.message };
  }
}

// 2. Menu Items & Cloud Storage
export async function uploadMenuImageToStorage(
  fileName: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getBackendSupabaseClient();
  if (!client) {
    return {
      success: true,
      url: base64Data, // Fallback if no backend keys
    };
  }

  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `dishes/${Date.now()}-${cleanFileName}`;
    const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');

    const { data, error } = await client.storage
      .from('menu-images')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload error, using inline fallback:', error.message);
      return { success: true, url: base64Data };
    }

    const { data: publicUrlData } = client.storage
      .from('menu-images')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('uploadMenuImageToStorage exception:', err.message);
    return { success: true, url: base64Data };
  }
}

export async function fetchMenuItems() {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, items: [] };

  try {
    const { data, error } = await client.from('menu_items').select('*').order('name');
    if (error) throw error;
    return { success: true, items: data || [] };
  } catch (err: any) {
    return { success: false, items: [], error: err.message };
  }
}

export async function upsertMenuItem(item: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };

  try {
    const { error } = await client.from('menu_items').upsert([item]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 3. Orders Queries
export async function fetchOrders() {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, orders: [] };

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return { success: true, orders: data || [] };
  } catch (err: any) {
    return { success: false, orders: [], error: err.message };
  }
}

export async function upsertOrder(order: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };

  try {
    const { error } = await client.from('orders').upsert([order]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 4. Cafe Tables
export async function fetchTables() {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, tables: [] };

  try {
    const { data, error } = await client.from('cafe_tables').select('*').order('table_number');
    if (error) throw error;
    return { success: true, tables: data || [] };
  } catch (err: any) {
    return { success: false, tables: [], error: err.message };
  }
}

export async function upsertTable(table: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };

  try {
    const { error } = await client.from('cafe_tables').upsert([table]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 5. Employees & IAM Verification
export async function fetchEmployees() {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, employees: [] };

  try {
    const { data, error } = await client.from('employees').select('*');
    if (error) throw error;
    return { success: true, employees: data || [] };
  } catch (err: any) {
    return { success: false, employees: [], error: err.message };
  }
}
