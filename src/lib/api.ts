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
import {
  getBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
  fetchFullDatabaseDirect,
  upsertTableDirect,
  updateTableStatusDirect,
  deleteTableDirect,
  upsertMenuItemDirect,
  deleteMenuItemDirect,
  upsertCategoryDirect,
  deleteCategoryDirect,
  upsertInventoryDirect,
  adjustInventoryDirect,
  deleteInventoryDirect,
  upsertOrderDirect,
  updateOrderStatusDirect,
  upsertOfferDirect,
  deleteOfferDirect,
  upsertEmployeeDirect,
  deleteEmployeeDirect,
  insertAuditLogDirect,
  upsertSettingsDirect,
} from './supabaseClient';

/**
 * Universal Client API Bridge
 * Automatically uses Express backend routes (/api/*) when available.
 * Seamlessly falls back to direct browser-to-Supabase connection on static deployments (Netlify, Vercel, etc.).
 */

let backendServerAvailable: boolean | null = null;

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    // If Netlify serves 404 or index.html for unknown /api route
    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  // Check backend & Supabase connection status
  async checkStatus(): Promise<{ connected: boolean; storageBucket: string }> {
    // 1. Check if backend /api/status is responding (fullstack dev/prod mode)
    const res = await safeFetch<{ supabaseConnected: boolean; storageBucket: string }>('/api/status');
    if (res && typeof res.supabaseConnected === 'boolean') {
      backendServerAvailable = true;
      return {
        connected: res.supabaseConnected,
        storageBucket: res.storageBucket || 'menu-images',
      };
    }

    // 2. Fallback to direct client-side Supabase for static Netlify hosting
    backendServerAvailable = false;
    if (isBrowserSupabaseConfigured()) {
      const client = getBrowserSupabaseClient();
      if (client) {
        try {
          const { error } = await client.from('cafe_settings').select('id').limit(1);
          return {
            connected: !error,
            storageBucket: 'menu-images',
          };
        } catch {
          return {
            connected: true,
            storageBucket: 'menu-images',
          };
        }
      }
    }

    return {
      connected: false,
      storageBucket: 'menu-images',
    };
  },

  // Hydrate data from Supabase DB
  async initData(): Promise<{
    connected: boolean;
    data: {
      settings?: CafeSettings | null;
      tables: CafeTable[];
      menuItems: MenuItem[];
      categories: Category[];
      inventory: InventoryItem[];
      orders: Order[];
      offers: SpecialOffer[];
      employees: Employee[];
      auditLogs: AuditLog[];
    } | null;
  }> {
    if (backendServerAvailable !== false) {
      const res = await safeFetch<{
        success: boolean;
        connected: boolean;
        data: any;
      }>('/api/database/init');
      if (res && res.data) {
        return {
          connected: Boolean(res.connected),
          data: res.data,
        };
      }
    }

    // Direct Browser Supabase fallback for Netlify
    const directResult = await fetchFullDatabaseDirect();
    return directResult;
  },

  // Two-way sync everything
  async syncAll(payload: {
    settings?: CafeSettings;
    tables?: CafeTable[];
    menuItems?: MenuItem[];
    categories?: Category[];
    inventory?: InventoryItem[];
    orders?: Order[];
    offers?: SpecialOffer[];
    employees?: Employee[];
    auditLogs?: AuditLog[];
  }) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/database/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res) return res;
    }

    // Direct Browser Supabase fallback for Netlify
    try {
      const promises: Promise<any>[] = [];
      if (payload.settings) promises.push(upsertSettingsDirect(payload.settings));
      if (payload.tables) for (const t of payload.tables) promises.push(upsertTableDirect(t));
      if (payload.menuItems) for (const m of payload.menuItems) promises.push(upsertMenuItemDirect(m));
      if (payload.categories) for (const c of payload.categories) promises.push(upsertCategoryDirect(c));
      if (payload.inventory) for (const i of payload.inventory) promises.push(upsertInventoryDirect(i));
      if (payload.orders) for (const o of payload.orders) promises.push(upsertOrderDirect(o));
      if (payload.offers) for (const off of payload.offers) promises.push(upsertOfferDirect(off));
      if (payload.employees) for (const e of payload.employees) promises.push(upsertEmployeeDirect(e));
      if (payload.auditLogs) for (const l of payload.auditLogs) promises.push(insertAuditLogDirect(l));
      await Promise.allSettled(promises);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Settings operations
  async saveSettings(settings: CafeSettings) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      if (res) return res;
    }
    return upsertSettingsDirect(settings);
  },

  async getSettings(): Promise<CafeSettings | null> {
    if (backendServerAvailable !== false) {
      const res = await safeFetch<{ success: boolean; settings: CafeSettings | null }>('/api/settings');
      if (res?.settings) return res.settings;
    }
    const full = await fetchFullDatabaseDirect();
    return full.data?.settings || null;
  },

  // Table operations
  async saveTable(table: CafeTable) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/tables', {
        method: 'POST',
        body: JSON.stringify(table),
      });
      if (res) return res;
    }
    return upsertTableDirect(table);
  },

  async deleteTable(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/tables/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteTableDirect(id);
  },

  async updateTableStatus(tableNumber: number, status: CafeTable['status'], activeOrderId?: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/tables/${tableNumber}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, activeOrderId }),
      });
      if (res) return res;
    }
    return updateTableStatusDirect(tableNumber, status, activeOrderId);
  },

  // Menu items operations
  async saveMenuItem(item: MenuItem) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/menu-items', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (res) return res;
    }
    return upsertMenuItemDirect(item);
  },

  async deleteMenuItem(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteMenuItemDirect(id);
  },

  // Categories operations
  async saveCategory(cat: Category) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(cat),
      });
      if (res) return res;
    }
    return upsertCategoryDirect(cat);
  },

  async deleteCategory(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteCategoryDirect(id);
  },

  // Inventory operations
  async saveInventoryItem(item: InventoryItem) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (res) return res;
    }
    return upsertInventoryDirect(item);
  },

  async adjustStock(id: string, amount: number) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({ id, amount }),
      });
      if (res) return res;
    }
    return adjustInventoryDirect(id, amount);
  },

  async deleteInventoryItem(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteInventoryDirect(id);
  },

  // Orders operations
  async placeOrder(order: Order) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      if (res) return res;
    }
    return upsertOrderDirect(order);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      if (res) return res;
    }
    return updateOrderStatusDirect(orderId, status);
  },

  // Special Offers operations
  async saveOffer(offer: SpecialOffer) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/offers', {
        method: 'POST',
        body: JSON.stringify(offer),
      });
      if (res) return res;
    }
    return upsertOfferDirect(offer);
  },

  async deleteOffer(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/offers/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteOfferDirect(id);
  },

  // Staff / Employees operations
  async saveEmployee(emp: Employee) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(emp),
      });
      if (res) return res;
    }
    return upsertEmployeeDirect(emp);
  },

  async deleteEmployee(id: string) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (res) return res;
    }
    return deleteEmployeeDirect(id);
  },

  // Audit Log
  async addAuditLog(log: AuditLog) {
    if (backendServerAvailable !== false) {
      const res = await safeFetch('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify(log),
      });
      if (res) return res;
    }
    return insertAuditLogDirect(log);
  },
};
