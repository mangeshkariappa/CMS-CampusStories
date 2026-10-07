import {
  MenuItem,
  Category,
  Order,
  InventoryItem,
  Employee,
  CafeTable,
  CafeSettings,
  OrderStatus,
  PaymentMethod,
  SpecialOffer,
  AuditLog,
} from '../types/cafe';
import {
  initialSettings,
  initialCategories,
  initialMenuItems,
  initialInventory,
  initialEmployees,
  initialTables,
  initialOrders,
  initialOffers,
  initialAuditLogs,
} from '../data/initialData';
import QRCode from 'qrcode';

const STORAGE_KEYS = {
  SETTINGS: 'brewpulse_settings',
  CATEGORIES: 'brewpulse_categories',
  MENU_ITEMS: 'brewpulse_menu_items',
  INVENTORY: 'brewpulse_inventory',
  EMPLOYEES: 'brewpulse_employees',
  TABLES: 'brewpulse_tables',
  ORDERS: 'brewpulse_orders',
  OFFERS: 'brewpulse_offers',
  ACTIVE_STAFF: 'brewpulse_active_staff',
  AUDIT_LOGS: 'brewpulse_audit_logs',
  IS_AUTHENTICATED: 'brewpulse_is_authenticated',
};

// Automatic one-time cache purge to remove old dummy data in user browsers
const CLEAN_STORAGE_VERSION = 'v2_clean_platform_testing';
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const currentVersion = localStorage.getItem('brewpulse_data_version');
    if (currentVersion !== CLEAN_STORAGE_VERSION) {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('brewpulse_data_version', CLEAN_STORAGE_VERSION);
    }
  } catch (err) {
    console.warn('Storage migration notice:', err);
  }
}

// Safe JSON parser
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('brewpulse_store_updated', { detail: { key } }));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export class CafeStore {
  // Settings
  static getSettings(): CafeSettings {
    return getStored<CafeSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  static saveSettings(settings: CafeSettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
  }

  // Categories
  static getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  }

  static saveCategories(categories: Category[]): void {
    setStored(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Menu Items
  static getMenuItems(): MenuItem[] {
    return getStored<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, initialMenuItems);
  }

  static saveMenuItems(items: MenuItem[]): void {
    setStored(STORAGE_KEYS.MENU_ITEMS, items);
  }

  static addMenuItem(item: MenuItem): void {
    const items = this.getMenuItems();
    items.unshift(item);
    this.saveMenuItems(items);
  }

  static updateMenuItem(updated: MenuItem): void {
    const items = this.getMenuItems().map((item) => (item.id === updated.id ? updated : item));
    this.saveMenuItems(items);
  }

  static deleteMenuItem(id: string): void {
    const items = this.getMenuItems().filter((item) => item.id !== id);
    this.saveMenuItems(items);
  }

  // Inventory
  static getInventory(): InventoryItem[] {
    return getStored<InventoryItem[]>(STORAGE_KEYS.INVENTORY, initialInventory);
  }

  static saveInventory(inventory: InventoryItem[]): void {
    setStored(STORAGE_KEYS.INVENTORY, inventory);
  }

  static addInventoryItem(item: InventoryItem): void {
    const inv = this.getInventory();
    inv.unshift(item);
    this.saveInventory(inv);
  }

  static updateInventoryItem(updated: InventoryItem): void {
    const inv = this.getInventory().map((item) => (item.id === updated.id ? updated : item));
    this.saveInventory(inv);
  }

  static adjustStock(id: string, amount: number): void {
    const inv = this.getInventory().map((item) => {
      if (item.id === id) {
        return {
          ...item,
          currentStock: Math.max(0, Number((item.currentStock + amount).toFixed(2))),
          lastRestockedAt: amount > 0 ? new Date().toISOString().split('T')[0] : item.lastRestockedAt,
        };
      }
      return item;
    });
    this.saveInventory(inv);
  }

  static deleteInventoryItem(id: string): void {
    const inv = this.getInventory().filter((item) => item.id !== id);
    this.saveInventory(inv);
  }

  // Deduct inventory when order is placed
  static deductInventoryForOrder(order: Order): void {
    const menuItems = this.getMenuItems();
    const inventory = this.getInventory();
    let inventoryChanged = false;

    order.items.forEach((orderItem) => {
      const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId);
      if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
        menuItem.ingredients.forEach((ing) => {
          const invItem = inventory.find((i) => i.id === ing.inventoryItemId);
          if (invItem) {
            const consumed = ing.quantity * orderItem.quantity;
            invItem.currentStock = Math.max(0, Number((invItem.currentStock - consumed).toFixed(3)));
            inventoryChanged = true;
          }
        });
      }
    });

    if (inventoryChanged) {
      this.saveInventory(inventory);
    }
  }

  // Employees
  static getEmployees(): Employee[] {
    return getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  }

  static saveEmployees(employees: Employee[]): void {
    setStored(STORAGE_KEYS.EMPLOYEES, employees);
  }

  static addEmployee(employee: Employee): void {
    const list = this.getEmployees();
    list.push(employee);
    this.saveEmployees(list);
  }

  static updateEmployee(updated: Employee): void {
    const list = this.getEmployees().map((emp) => (emp.id === updated.id ? updated : emp));
    this.saveEmployees(list);
  }

  static deleteEmployee(id: string): void {
    const list = this.getEmployees().filter((emp) => emp.id !== id);
    this.saveEmployees(list);
  }

  static getActiveStaff(): Employee {
    const stored = getStored<Employee | null>(STORAGE_KEYS.ACTIVE_STAFF, null);
    if (stored) {
      const match = this.getEmployees().find((e) => e.id === stored.id && e.isActive);
      if (match) return match;
    }
    return this.getEmployees()[0] || initialEmployees[0];
  }

  static setActiveStaff(employee: Employee): void {
    setStored(STORAGE_KEYS.ACTIVE_STAFF, employee);
  }

  // Tables
  static getTables(): CafeTable[] {
    return getStored<CafeTable[]>(STORAGE_KEYS.TABLES, initialTables);
  }

  static saveTables(tables: CafeTable[]): void {
    setStored(STORAGE_KEYS.TABLES, tables);
  }

  static updateTableStatus(tableNumber: number, status: CafeTable['status'], activeOrderId?: string): void {
    const tables = this.getTables().map((tbl) => {
      if (tbl.tableNumber === tableNumber) {
        return {
          ...tbl,
          status,
          activeOrderId: activeOrderId !== undefined ? activeOrderId : tbl.activeOrderId,
        };
      }
      return tbl;
    });
    this.saveTables(tables);
  }

  static addTable(table: CafeTable): void {
    const tables = this.getTables();
    tables.push(table);
    this.saveTables(tables);
  }

  // Orders
  static getOrders(): Order[] {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
  }

  static saveOrders(orders: Order[]): void {
    setStored(STORAGE_KEYS.ORDERS, orders);
  }

  static addOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);

    // Update table status to occupied
    this.updateTableStatus(order.tableNumber, 'occupied', order.id);

    // Auto deduct inventory ingredients
    this.deductInventoryForOrder(order);
  }

  static updateOrderStatus(orderId: string, status: OrderStatus): void {
    const orders = this.getOrders().map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return ord;
    });
    this.saveOrders(orders);

    // If order is served / completed or cancelled, handle table status
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      if (status === 'billed') {
        this.updateTableStatus(targetOrder.tableNumber, 'billing', targetOrder.id);
      } else if (status === 'cancelled') {
        this.updateTableStatus(targetOrder.tableNumber, 'available', undefined);
      }
    }
  }

  static completeAndBillOrder(
    orderId: string,
    billingData: {
      discountPercentage: number;
      discountAmount: number;
      discountReason?: string;
      taxPercentage: number;
      taxAmount: number;
      serviceChargePercentage: number;
      serviceChargeAmount: number;
      total: number;
      paymentMethod: PaymentMethod;
      billedBy: string;
      markTableAvailable?: boolean;
    }
  ): Order | undefined {
    let completedOrder: Order | undefined;
    const orders = this.getOrders().map((ord) => {
      if (ord.id === orderId) {
        completedOrder = {
          ...ord,
          status: 'billed',
          paymentStatus: 'paid',
          paymentMethod: billingData.paymentMethod,
          discountPercentage: billingData.discountPercentage,
          discountAmount: billingData.discountAmount,
          discountReason: billingData.discountReason,
          taxPercentage: billingData.taxPercentage,
          taxAmount: billingData.taxAmount,
          serviceChargePercentage: billingData.serviceChargePercentage,
          serviceChargeAmount: billingData.serviceChargeAmount,
          total: billingData.total,
          billedAt: new Date().toISOString(),
          billedBy: billingData.billedBy,
          updatedAt: new Date().toISOString(),
        };
        return completedOrder;
      }
      return ord;
    });

    this.saveOrders(orders);

    if (completedOrder) {
      if (billingData.markTableAvailable) {
        this.updateTableStatus(completedOrder.tableNumber, 'available', undefined);
      } else {
        this.updateTableStatus(completedOrder.tableNumber, 'available', undefined);
      }
    }

    return completedOrder;
  }

  static recordWhatsAppSent(orderId: string): void {
    const orders = this.getOrders().map((ord) =>
      ord.id === orderId ? { ...ord, whatsappSentAt: new Date().toISOString() } : ord
    );
    this.saveOrders(orders);
  }

  // Special Offers & Seasonal Specials
  static getOffers(): SpecialOffer[] {
    return getStored<SpecialOffer[]>(STORAGE_KEYS.OFFERS, initialOffers);
  }

  static saveOffers(offers: SpecialOffer[]): void {
    setStored(STORAGE_KEYS.OFFERS, offers);
  }

  static addOffer(offer: SpecialOffer): void {
    const list = this.getOffers();
    list.unshift(offer);
    this.saveOffers(list);
  }

  static updateOffer(updated: SpecialOffer): void {
    const list = this.getOffers().map((off) => (off.id === updated.id ? updated : off));
    this.saveOffers(list);
  }

  static deleteOffer(id: string): void {
    const list = this.getOffers().filter((off) => off.id !== id);
    this.saveOffers(list);
  }

  static incrementBroadcastCount(id: string, countDelta: number = 1): void {
    const list = this.getOffers().map((off) => {
      if (off.id === id) {
        return {
          ...off,
          broadcastSentCount: (off.broadcastSentCount || 0) + countDelta,
        };
      }
      return off;
    });
    this.saveOffers(list);
  }

  // Audit Logs (Owner View)
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  static saveAuditLogs(logs: AuditLog[]): void {
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  static addAuditLog(entry: {
    staffId: string;
    staffName: string;
    staffRole: AuditLog['staffRole'];
    category: AuditLog['category'];
    action: string;
    details: string;
    metadata?: Record<string, unknown>;
  }): AuditLog {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.unshift(newEntry);
    // Keep max 500 audit logs locally
    const trimmed = logs.slice(0, 500);
    this.saveAuditLogs(trimmed);
    return newEntry;
  }

  static clearAuditLogs(): void {
    this.saveAuditLogs([]);
  }

  // IAM Authentication State
  static isAuthenticated(): boolean {
    return getStored<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, true);
  }

  static setAuthenticated(status: boolean): void {
    setStored(STORAGE_KEYS.IS_AUTHENTICATED, status);
  }

  // QR Code generator helper
  static async generateTableQrDataUrl(tableNumber: number, baseUrl?: string): Promise<string> {
    const origin = baseUrl || window.location.origin;
    // URL with table parameter
    const tableUrl = `${origin}?table=${tableNumber}`;
    try {
      const dataUrl = await QRCode.toDataURL(tableUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      return dataUrl;
    } catch (err) {
      console.error('QR code generation error:', err);
      return '';
    }
  }

  // Reset to clean platform data
  static resetToDemo(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }
}
