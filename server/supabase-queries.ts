import { getBackendSupabaseClient } from './supabase.js';

/**
 * Backend Supabase Queries & Database Operations
 * Strictly reads credentials from backend environment variables.
 * NO HARDCODED SECRETS.
 */

// Format mappers between frontend camelCase and Postgres snake_case
export function mapSettingsToDb(s: any) {
  return {
    id: 'primary',
    cafe_name: s.cafeName || 'BrewPulse Cafe & Roastery',
    tagline: s.tagline || '',
    address: s.address || '',
    phone: s.phone || '',
    whatsapp_number: s.whatsappNumber || '',
    gst_number: s.gstNumber || '',
    fssai_number: s.fssaiNumber || '',
    currency: s.currency || 'INR',
    currency_symbol: s.currencySymbol || '₹',
    default_tax_percent: s.defaultTaxPercent !== undefined ? s.defaultTaxPercent : 5,
    default_service_charge_percent: s.defaultServiceChargePercent !== undefined ? s.defaultServiceChargePercent : 0,
    birthday_discount_percent: s.birthdayDiscountPercent !== undefined ? s.birthdayDiscountPercent : 10,
    updated_at: new Date().toISOString(),
  };
}

export function mapSettingsFromDb(d: any) {
  return {
    cafeName: d.cafe_name || 'BrewPulse Cafe & Roastery',
    tagline: d.tagline || '',
    address: d.address || '',
    phone: d.phone || '',
    whatsappNumber: d.whatsapp_number || '',
    gstNumber: d.gst_number || '',
    fssaiNumber: d.fssai_number || '',
    currency: d.currency || 'INR',
    currencySymbol: d.currency_symbol || '₹',
    defaultTaxPercent: parseFloat(d.default_tax_percent) || 0,
    defaultServiceChargePercent: parseFloat(d.default_service_charge_percent) || 0,
    birthdayDiscountPercent: parseFloat(d.birthday_discount_percent) || 0,
  };
}

export function mapTableToDb(t: any) {
  return {
    id: t.id,
    table_number: t.tableNumber,
    capacity: t.capacity,
    section: t.section,
    status: t.status,
    active_order_id: t.activeOrderId || null,
  };
}

export function mapTableFromDb(d: any) {
  return {
    id: d.id,
    tableNumber: d.table_number,
    capacity: d.capacity,
    section: d.section,
    status: d.status,
    activeOrderId: d.active_order_id,
  };
}

export function mapMenuItemToDb(item: any) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    cost_price: item.costPrice || 0,
    description: item.description || '',
    image: item.image || '',
    dietary: item.dietary || 'veg',
    is_available: item.isAvailable !== false,
    preparation_time_minutes: item.preparationTimeMinutes || 5,
    popular: Boolean(item.popular),
    ingredients: item.ingredients || [],
    updated_at: new Date().toISOString(),
  };
}

export function mapMenuItemFromDb(d: any) {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    price: parseFloat(d.price) || 0,
    costPrice: parseFloat(d.cost_price) || 0,
    description: d.description || '',
    image: d.image || '',
    dietary: d.dietary || 'veg',
    isAvailable: d.is_available,
    preparationTimeMinutes: d.preparation_time_minutes || 5,
    popular: Boolean(d.popular),
    ingredients: d.ingredients || [],
  };
}

export function mapOrderToDb(o: any) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    table_number: o.tableNumber,
    customer: o.customer || {},
    items: o.items || [],
    status: o.status,
    payment_status: o.paymentStatus || 'unpaid',
    payment_method: o.paymentMethod || null,
    subtotal: o.subtotal || 0,
    discount_percentage: o.discountPercentage || 0,
    discount_amount: o.discountAmount || 0,
    tax_percentage: o.taxPercentage || 5,
    tax_amount: o.taxAmount || 0,
    service_charge_percentage: o.serviceChargePercentage || 0,
    service_charge_amount: o.serviceChargeAmount || 0,
    total: o.total || 0,
    notes: o.notes || '',
    created_at: o.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    billed_at: o.billedAt || null,
    billed_by: o.billedBy || null,
    whatsapp_sent_at: o.whatsappSentAt || null,
  };
}

export function mapOrderFromDb(d: any) {
  return {
    id: d.id,
    orderNumber: d.order_number,
    tableNumber: d.table_number,
    customer: d.customer || {},
    items: d.items || [],
    status: d.status,
    paymentStatus: d.payment_status,
    paymentMethod: d.payment_method,
    subtotal: parseFloat(d.subtotal) || 0,
    discountPercentage: parseFloat(d.discount_percentage) || 0,
    discountAmount: parseFloat(d.discount_amount) || 0,
    taxPercentage: parseFloat(d.tax_percentage) || 5,
    taxAmount: parseFloat(d.tax_amount) || 0,
    serviceChargePercentage: parseFloat(d.service_charge_percentage) || 0,
    serviceChargeAmount: parseFloat(d.service_charge_amount) || 0,
    total: parseFloat(d.total) || 0,
    notes: d.notes || '',
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    billedAt: d.billed_at,
    billedBy: d.billed_by,
    whatsappSentAt: d.whatsapp_sent_at,
  };
}

export function mapInventoryToDb(i: any) {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    current_stock: i.currentStock,
    unit: i.unit,
    min_threshold: i.minThreshold,
    cost_per_unit: i.costPerUnit,
    supplier_name: i.supplierName || '',
    supplier_phone: i.supplierPhone || '',
    last_restocked_at: i.lastRestockedAt || '',
  };
}

export function mapInventoryFromDb(d: any) {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    currentStock: parseFloat(d.current_stock) || 0,
    unit: d.unit,
    minThreshold: parseFloat(d.min_threshold) || 0,
    costPerUnit: parseFloat(d.cost_per_unit) || 0,
    supplierName: d.supplier_name,
    supplierPhone: d.supplier_phone,
    lastRestockedAt: d.last_restocked_at,
  };
}

export function mapOfferToDb(off: any) {
  return {
    id: off.id,
    title: off.title,
    tagline: off.tagline || '',
    type: off.type,
    original_price: off.originalPrice || null,
    offer_price: off.offerPrice || 0,
    description: off.description || '',
    image: off.image || '',
    badge_text: off.badgeText || '',
    valid_until: off.validUntil || '',
    is_active: off.isActive !== false,
    featured_on_menu: Boolean(off.featuredOnMenu),
    linked_menu_item_ids: off.linkedMenuItemIds || [],
    broadcast_sent_count: off.broadcastSentCount || 0,
  };
}

export function mapOfferFromDb(d: any) {
  return {
    id: d.id,
    title: d.title,
    tagline: d.tagline,
    type: d.type,
    originalPrice: d.original_price ? parseFloat(d.original_price) : undefined,
    offerPrice: parseFloat(d.offer_price) || 0,
    description: d.description,
    image: d.image,
    badgeText: d.badge_text,
    validUntil: d.valid_until,
    isActive: d.is_active,
    featuredOnMenu: d.featured_on_menu,
    linkedMenuItemIds: d.linked_menu_item_ids || [],
    broadcastSentCount: d.broadcast_sent_count || 0,
  };
}

export function mapEmployeeToDb(e: any) {
  return {
    id: e.id,
    username: e.username,
    password: e.password || '',
    pin: e.pin,
    name: e.name,
    email: e.email || '',
    phone: e.phone || '',
    role: e.role,
    is_active: e.isActive !== false,
    permissions: e.permissions || {},
  };
}

export function mapEmployeeFromDb(d: any) {
  return {
    id: d.id,
    username: d.username,
    password: d.password,
    pin: d.pin,
    name: d.name,
    email: d.email,
    phone: d.phone,
    role: d.role,
    isActive: d.is_active,
    permissions: d.permissions,
  };
}

// ========================================================
// CORE SUPABASE CRUD OPERATIONS
// ========================================================

// 1. Fetch entire database state from Supabase
export async function fetchFullDatabase() {
  const client = getBackendSupabaseClient();
  if (!client) return { connected: false, data: null };

  try {
    const [
      settingsRes,
      tablesRes,
      menuRes,
      catRes,
      invRes,
      ordersRes,
      offersRes,
      empRes,
      logsRes,
    ] = await Promise.all([
      client.from('cafe_settings').select('*').limit(1).maybeSingle(),
      client.from('cafe_tables').select('*').order('table_number'),
      client.from('menu_items').select('*').order('name'),
      client.from('categories').select('*').order('display_order'),
      client.from('inventory_items').select('*').order('name'),
      client.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      client.from('special_offers').select('*'),
      client.from('employees').select('*'),
      client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
    ]);

    return {
      connected: true,
      data: {
        settings: settingsRes.data ? mapSettingsFromDb(settingsRes.data) : null,
        tables: (tablesRes.data || []).map(mapTableFromDb),
        menuItems: (menuRes.data || []).map(mapMenuItemFromDb),
        categories: (catRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          displayOrder: c.display_order,
        })),
        inventory: (invRes.data || []).map(mapInventoryFromDb),
        orders: (ordersRes.data || []).map(mapOrderFromDb),
        offers: (offersRes.data || []).map(mapOfferFromDb),
        employees: (empRes.data || []).map(mapEmployeeFromDb),
        auditLogs: (logsRes.data || []).map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp,
          staffId: l.staff_id,
          staffName: l.staff_name,
          staffRole: l.staff_role,
          category: l.category,
          action: l.action,
          details: l.details,
          metadata: l.metadata,
        })),
      },
    };
  } catch (err: any) {
    console.error('fetchFullDatabase error:', err.message);
    return { connected: false, error: err.message, data: null };
  }
}

// Settings Operations
export async function upsertSettingsInDb(settings: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'No Supabase client' };
  try {
    const row = mapSettingsToDb(settings);
    const { data, error } = await client.from('cafe_settings').upsert([row]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('upsertSettingsInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function fetchSettingsFromDb() {
  const client = getBackendSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('cafe_settings').select('*').limit(1).maybeSingle();
    if (error || !data) return null;
    return mapSettingsFromDb(data);
  } catch {
    return null;
  }
}

// 2. Tables Operations
export async function upsertTableInDb(table: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'No Supabase client' };
  try {
    const row = mapTableToDb(table);
    // In cafe_tables, table_number is unique. Check if table with this table_number exists:
    const { data: existing } = await client
      .from('cafe_tables')
      .select('id')
      .eq('table_number', row.table_number)
      .maybeSingle();

    if (existing) {
      const { data, error } = await client
        .from('cafe_tables')
        .update({
          capacity: row.capacity,
          section: row.section,
          status: row.status,
          active_order_id: row.active_order_id,
        })
        .eq('table_number', row.table_number)
        .select();
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await client.from('cafe_tables').insert([row]).select();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (err: any) {
    console.error('upsertTableInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteTableFromDb(idOrNumber: string | number) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    let query = client.from('cafe_tables').delete();
    if (typeof idOrNumber === 'number' || !isNaN(Number(idOrNumber))) {
      query = query.or(`id.eq.${idOrNumber},table_number.eq.${Number(idOrNumber)}`);
    } else {
      query = query.eq('id', idOrNumber);
    }
    const { error } = await query;
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTableStatusInDb(tableNumber: number, status: string, activeOrderId?: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const payload: any = { status };
    if (activeOrderId !== undefined) payload.active_order_id = activeOrderId;
    const { error } = await client.from('cafe_tables').update(payload).eq('table_number', tableNumber);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('updateTableStatusInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

// 3. Menu Items Operations
export async function upsertMenuItemInDb(item: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'No Supabase client' };
  try {
    const row = mapMenuItemToDb(item);
    const { data, error } = await client.from('menu_items').upsert([row]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('upsertMenuItemInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteMenuItemFromDb(id: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 4. Categories Operations
export async function upsertCategoryInDb(cat: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = {
      id: cat.id,
      name: cat.name,
      icon: cat.icon || null,
      display_order: cat.displayOrder || 1,
    };
    const { error } = await client.from('categories').upsert([row]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCategoryFromDb(id: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 5. Orders Operations
export async function upsertOrderInDb(order: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'No Supabase client' };
  try {
    const row = mapOrderToDb(order);
    const { data, error } = await client.from('orders').upsert([row]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('upsertOrderInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusInDb(orderId: string, status: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 6. Inventory Operations
export async function upsertInventoryInDb(item: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = mapInventoryToDb(item);
    const { error } = await client.from('inventory_items').upsert([row]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adjustInventoryInDb(id: string, deltaAmount: number) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { data: current } = await client.from('inventory_items').select('current_stock').eq('id', id).single();
    if (current) {
      const newStock = Math.max(0, (parseFloat(current.current_stock) || 0) + deltaAmount);
      await client.from('inventory_items').update({ current_stock: newStock }).eq('id', id);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteInventoryFromDb(id: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. Offers Operations
export async function upsertOfferInDb(offer: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = mapOfferToDb(offer);
    const { error } = await client.from('special_offers').upsert([row]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteOfferFromDb(id: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client.from('special_offers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 8. Employees Operations
export async function upsertEmployeeInDb(employee: any) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = mapEmployeeToDb(employee);
    // In employees table, username is UNIQUE. Check if employee with username exists:
    const { data: existing } = await client
      .from('employees')
      .select('id')
      .eq('username', row.username)
      .maybeSingle();

    if (existing) {
      const { data, error } = await client
        .from('employees')
        .update({
          password: row.password,
          pin: row.pin,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          is_active: row.is_active,
          permissions: row.permissions,
        })
        .eq('username', row.username)
        .select();
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await client.from('employees').insert([row]).select();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (err: any) {
    console.error('upsertEmployeeInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteEmployeeFromDb(id: string) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false };
  try {
    const { error } = await client.from('employees').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 9. Audit Logs Operations
export async function insertAuditLogInDb(log: {
  id?: string;
  timestamp?: string;
  staffId?: string;
  staff_id?: string;
  staffName?: string;
  staff_name?: string;
  staffRole?: string;
  staff_role?: string;
  category?: string;
  action?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}) {
  const client = getBackendSupabaseClient();
  if (!client) return { success: false, reason: 'No Supabase client' };
  try {
    const row = {
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      staff_id: log.staffId || log.staff_id || 'system',
      staff_name: log.staffName || log.staff_name || 'System',
      staff_role: log.staffRole || log.staff_role || 'owner',
      category: log.category || 'SYSTEM',
      action: log.action || 'ACTION',
      details: log.details || '',
      metadata: log.metadata || {},
    };

    // Use upsert with onConflict on 'id' and ignoreDuplicates: true
    const { error } = await client
      .from('audit_logs')
      .upsert([row], { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      if (
        error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('audit_logs_pkey')
      ) {
        return { success: true, message: 'Log already exists' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (
      err.code === '23505' ||
      err.message?.includes('duplicate key') ||
      err.message?.includes('audit_logs_pkey')
    ) {
      return { success: true, message: 'Log already exists' };
    }
    console.error('insertAuditLogInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function upsertAuditLogsInDb(logs: any[]) {
  const client = getBackendSupabaseClient();
  if (!client || !Array.isArray(logs) || logs.length === 0) return { success: true };
  try {
    const rows = logs.map((log) => ({
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      staff_id: log.staffId || log.staff_id || 'system',
      staff_name: log.staffName || log.staff_name || 'System',
      staff_role: log.staffRole || log.staff_role || 'owner',
      category: log.category || 'SYSTEM',
      action: log.action || 'ACTION',
      details: log.details || '',
      metadata: log.metadata || {},
    }));

    const { error } = await client
      .from('audit_logs')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      if (
        error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('audit_logs_pkey')
      ) {
        return { success: true, message: 'Logs synced' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (
      err.code === '23505' ||
      err.message?.includes('duplicate key') ||
      err.message?.includes('audit_logs_pkey')
    ) {
      return { success: true, message: 'Logs synced' };
    }
    console.error('upsertAuditLogsInDb error:', err.message);
    return { success: false, error: err.message };
  }
}

// 10. Storage Upload
export async function uploadMenuImageToStorage(
  fileName: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getBackendSupabaseClient();
  if (!client) {
    return { success: true, url: base64Data };
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
      console.warn('Storage upload error, using fallback:', error.message);
      return { success: true, url: base64Data, error: error.message };
    }

    const { data: publicUrlData } = client.storage
      .from('menu-images')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('uploadMenuImageToStorage error:', err.message);
    return { success: true, url: base64Data, error: err.message };
  }
}
