import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CafeTable,
  MenuItem,
  Category,
  InventoryItem,
  Order,
  OrderStatus,
  SpecialOffer,
  Employee,
  AuditLog,
  CafeSettings,
} from '../types/cafe';

const STORAGE_KEYS = {
  URL: 'brewpulse_supabase_url',
  ANON_KEY: 'brewpulse_supabase_key',
};

// Retrieve configured credentials from Vite build environment or user local storage
export function getClientSupabaseConfig(): { url: string; anonKey: string } {
  let envUrl = '';
  let envKey = '';
  try {
    envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  } catch {
    // env not available
  }

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = localStorage.getItem(STORAGE_KEYS.URL) || '';
    localKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY) || '';
  } catch {
    // storage not available
  }

  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || '',
  };
}

export function saveClientSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (url) localStorage.setItem(STORAGE_KEYS.URL, url.trim());
    else localStorage.removeItem(STORAGE_KEYS.URL);

    if (anonKey) localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEYS.ANON_KEY);

    browserClient = null; // Reset cached client
  } catch (err) {
    console.error('Error saving Supabase config to local storage:', err);
  }
}

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getClientSupabaseConfig();
  if (!url || !anonKey) return null;

  if (!browserClient) {
    try {
      browserClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize browser-side Supabase client:', err);
      return null;
    }
  }
  return browserClient;
}

export function isBrowserSupabaseConfigured(): boolean {
  const { url, anonKey } = getClientSupabaseConfig();
  return Boolean(url && anonKey);
}

// -------------------------------------------------------------
// Direct Database Mappers & Operations for Netlify Browser Mode
// -------------------------------------------------------------

export function mapSettingsToDb(s: CafeSettings) {
  return {
    id: 'primary',
    cafe_name: s.cafeName,
    tagline: s.tagline || '',
    address: s.address || '',
    phone: s.phone || '',
    whatsapp_number: s.whatsappNumber || '',
    gst_number: s.gstNumber || '',
    fssai_number: s.fssaiNumber || '',
    currency: s.currency || 'INR',
    currency_symbol: s.currencySymbol || '₹',
    default_tax_percent: s.defaultTaxPercent,
    default_service_charge_percent: s.defaultServiceChargePercent,
    birthday_discount_percent: s.birthdayDiscountPercent,
    updated_at: new Date().toISOString(),
  };
}

export function mapSettingsFromDb(d: any): CafeSettings {
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

export async function fetchFullDatabaseDirect() {
  const client = getBrowserSupabaseClient();
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
        tables: (tablesRes.data || []).map((d: any) => ({
          id: d.id,
          tableNumber: d.table_number,
          capacity: d.capacity,
          section: d.section,
          status: d.status,
          activeOrderId: d.active_order_id,
        })),
        menuItems: (menuRes.data || []).map((d: any) => ({
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
        })),
        categories: (catRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          displayOrder: c.display_order,
        })),
        inventory: (invRes.data || []).map((d: any) => ({
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
        })),
        orders: (ordersRes.data || []).map((d: any) => ({
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
        })),
        offers: (offersRes.data || []).map((d: any) => ({
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
          createdAt: d.created_at || new Date().toISOString(),
          broadcastSentCount: d.broadcast_sent_count || 0,
        })),
        employees: (empRes.data || []).map((d: any) => ({
          id: d.id,
          username: d.username,
          password: d.password,
          pin: d.pin,
          name: d.name,
          email: d.email,
          phone: d.phone,
          role: d.role,
          isActive: d.is_active,
          createdAt: d.created_at || new Date().toISOString(),
          permissions: d.permissions,
        })),
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
    console.warn('fetchFullDatabaseDirect error:', err.message);
    return { connected: false, error: err.message, data: null };
  }
}

export async function upsertTableDirect(table: CafeTable) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const { data: existing } = await client
      .from('cafe_tables')
      .select('id')
      .eq('table_number', table.tableNumber)
      .maybeSingle();

    if (existing) {
      await client
        .from('cafe_tables')
        .update({
          capacity: table.capacity,
          section: table.section,
          status: table.status,
          active_order_id: table.activeOrderId || null,
        })
        .eq('table_number', table.tableNumber);
    } else {
      await client.from('cafe_tables').insert([
        {
          id: table.id,
          table_number: table.tableNumber,
          capacity: table.capacity,
          section: table.section,
          status: table.status,
          active_order_id: table.activeOrderId || null,
        },
      ]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTableStatusDirect(
  tableNumber: number,
  status: CafeTable['status'],
  activeOrderId?: string
) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const payload: any = { status };
    if (activeOrderId !== undefined) payload.active_order_id = activeOrderId;
    await client.from('cafe_tables').update(payload).eq('table_number', tableNumber);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTableDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('cafe_tables').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertMenuItemDirect(item: MenuItem) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = {
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
    await client.from('menu_items').upsert([row]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMenuItemDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('menu_items').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertCategoryDirect(cat: Category) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('categories').upsert([
      {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || null,
        display_order: cat.displayOrder || 1,
      },
    ]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCategoryDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('categories').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertInventoryDirect(item: InventoryItem) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('inventory_items').upsert([
      {
        id: item.id,
        name: item.name,
        category: item.category,
        current_stock: item.currentStock,
        unit: item.unit,
        min_threshold: item.minThreshold,
        cost_per_unit: item.costPerUnit,
        supplier_name: item.supplierName || '',
        supplier_phone: item.supplierPhone || '',
        last_restocked_at: item.lastRestockedAt || '',
      },
    ]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adjustInventoryDirect(id: string, deltaAmount: number) {
  const client = getBrowserSupabaseClient();
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

export async function deleteInventoryDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('inventory_items').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertOrderDirect(order: Order) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      table_number: order.tableNumber,
      customer: order.customer || {},
      items: order.items || [],
      status: order.status,
      payment_status: order.paymentStatus || 'unpaid',
      payment_method: order.paymentMethod || null,
      subtotal: order.subtotal || 0,
      discount_percentage: order.discountPercentage || 0,
      discount_amount: order.discountAmount || 0,
      tax_percentage: order.taxPercentage || 5,
      tax_amount: order.taxAmount || 0,
      service_charge_percentage: order.serviceChargePercentage || 0,
      service_charge_amount: order.serviceChargeAmount || 0,
      total: order.total || 0,
      notes: order.notes || '',
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      billed_at: order.billedAt || null,
      billed_by: order.billedBy || null,
      whatsapp_sent_at: order.whatsappSentAt || null,
    };
    await client.from('orders').upsert([row]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusDirect(orderId: string, status: OrderStatus) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertOfferDirect(offer: SpecialOffer) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = {
      id: offer.id,
      title: offer.title,
      tagline: offer.tagline || '',
      type: offer.type,
      original_price: offer.originalPrice || null,
      offer_price: offer.offerPrice || 0,
      description: offer.description || '',
      image: offer.image || '',
      badge_text: offer.badgeText || '',
      valid_until: offer.validUntil || '',
      is_active: offer.isActive !== false,
      featured_on_menu: Boolean(offer.featuredOnMenu),
      linked_menu_item_ids: offer.linkedMenuItemIds || [],
      broadcast_sent_count: offer.broadcastSentCount || 0,
    };
    await client.from('special_offers').upsert([row]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteOfferDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('special_offers').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertEmployeeDirect(emp: Employee) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const { data: existing } = await client
      .from('employees')
      .select('id')
      .eq('username', emp.username)
      .maybeSingle();

    if (existing) {
      await client
        .from('employees')
        .update({
          password: emp.password || '',
          pin: emp.pin,
          name: emp.name,
          email: emp.email || '',
          phone: emp.phone || '',
          role: emp.role,
          is_active: emp.isActive !== false,
          permissions: emp.permissions || {},
        })
        .eq('username', emp.username);
    } else {
      await client.from('employees').insert([
        {
          id: emp.id,
          username: emp.username,
          password: emp.password || '',
          pin: emp.pin,
          name: emp.name,
          email: emp.email || '',
          phone: emp.phone || '',
          role: emp.role,
          is_active: emp.isActive !== false,
          permissions: emp.permissions || {},
        },
      ]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteEmployeeDirect(id: string) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    await client.from('employees').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function insertAuditLogDirect(log: AuditLog) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = {
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      staff_id: log.staffId,
      staff_name: log.staffName,
      staff_role: log.staffRole,
      category: log.category,
      action: log.action,
      details: log.details,
      metadata: log.metadata || {},
    };
    await client.from('audit_logs').upsert([row], { onConflict: 'id', ignoreDuplicates: true });
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function upsertSettingsDirect(settings: CafeSettings) {
  const client = getBrowserSupabaseClient();
  if (!client) return { success: false };
  try {
    const row = mapSettingsToDb(settings);
    await client.from('cafe_settings').upsert([row]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
