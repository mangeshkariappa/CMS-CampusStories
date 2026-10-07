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

/**
 * Client API Bridge to Backend Supabase Endpoints
 * All database operations are forwarded to the server-side Supabase client.
 */

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      console.warn(`API ${url} responded with status: ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`API call error on ${url}:`, err);
    return null;
  }
}

export const api = {
  // Check backend & Supabase connection status
  async checkStatus(): Promise<{ connected: boolean; storageBucket: string }> {
    const res = await safeFetch<{ supabaseConnected: boolean; storageBucket: string }>('/api/status');
    return {
      connected: Boolean(res?.supabaseConnected),
      storageBucket: res?.storageBucket || 'menu-images',
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
    const res = await safeFetch<{
      success: boolean;
      connected: boolean;
      data: any;
    }>('/api/database/init');
    return {
      connected: Boolean(res?.connected),
      data: res?.data || null,
    };
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
    return safeFetch('/api/database/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Settings operations
  async saveSettings(settings: CafeSettings) {
    return safeFetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async getSettings(): Promise<CafeSettings | null> {
    const res = await safeFetch<{ success: boolean; settings: CafeSettings | null }>('/api/settings');
    return res?.settings || null;
  },

  // Table operations
  async saveTable(table: CafeTable) {
    return safeFetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify(table),
    });
  },

  async deleteTable(id: string) {
    return safeFetch(`/api/tables/${id}`, {
      method: 'DELETE',
    });
  },

  async updateTableStatus(tableNumber: number, status: CafeTable['status'], activeOrderId?: string) {
    return safeFetch(`/api/tables/${tableNumber}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, activeOrderId }),
    });
  },

  // Menu items operations
  async saveMenuItem(item: MenuItem) {
    return safeFetch('/api/menu-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteMenuItem(id: string) {
    return safeFetch(`/api/menu-items/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories operations
  async saveCategory(cat: Category) {
    return safeFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  },

  async deleteCategory(id: string) {
    return safeFetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Inventory operations
  async saveInventoryItem(item: InventoryItem) {
    return safeFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async adjustStock(id: string, amount: number) {
    return safeFetch('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ id, amount }),
    });
  },

  async deleteInventoryItem(id: string) {
    return safeFetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Orders operations
  async placeOrder(order: Order) {
    return safeFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return safeFetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // Special Offers operations
  async saveOffer(offer: SpecialOffer) {
    return safeFetch('/api/offers', {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  },

  async deleteOffer(id: string) {
    return safeFetch(`/api/offers/${id}`, {
      method: 'DELETE',
    });
  },

  // Staff / Employees operations
  async saveEmployee(emp: Employee) {
    return safeFetch('/api/employees', {
      method: 'POST',
      body: JSON.stringify(emp),
    });
  },

  async deleteEmployee(id: string) {
    return safeFetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  },

  // Audit Log
  async addAuditLog(log: AuditLog) {
    return safeFetch('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
};
