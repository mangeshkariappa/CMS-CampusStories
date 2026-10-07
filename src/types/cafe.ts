export type Role = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter';

export type DietaryType = 'veg' | 'non-veg' | 'vegan' | 'gluten-free' | 'beverage';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; // for inventory and profit margin
  description: string;
  image: string;
  dietary: DietaryType;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  popular?: boolean;
  ingredients?: {
    inventoryItemId: string;
    quantity: number; // units consumed per dish
  }[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  displayOrder: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'billed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'whatsapp_pay' | 'other';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customization?: {
    milk?: string;
    sweetness?: string;
    ice?: string;
    notes?: string;
  };
}

export interface CustomerDetails {
  name: string;
  phone: string; // WhatsApp number
  dob: string; // YYYY-MM-DD
  isBirthdayToday?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customer: CustomerDetails;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  discountReason?: string;
  taxPercentage: number;
  taxAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  billedAt?: string;
  billedBy?: string; // staff name
  whatsappSentAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string; // 'kg', 'liters', 'packets', 'pieces', 'cans'
  minThreshold: number; // alert if below this
  costPerUnit: number;
  supplierName?: string;
  supplierPhone?: string; // for whatsapp reorder
  lastRestockedAt?: string;
}

export type OfferType = 'seasonal_special' | 'chef_recommended' | 'combo_offer' | 'discount_promo';

export interface SpecialOffer {
  id: string;
  title: string;
  tagline?: string;
  type: OfferType;
  originalPrice?: number;
  offerPrice: number;
  description: string;
  image: string;
  badgeText: string; // e.g. "SEASON SPECIAL", "CHEF'S PICK", "SAVE 25%", "COMBO DEAL"
  validUntil?: string; // e.g. "2026-10-31" or "Daily 4 PM - 7 PM"
  isActive: boolean;
  featuredOnMenu: boolean;
  linkedMenuItemIds?: string[];
  createdAt: string;
  broadcastSentCount?: number;
}

export interface FeatureAccessPolicy {
  canAccessPos: boolean; // Cashier POS, Billing, Settle, Receipts
  canAccessKds: boolean; // Kitchen Display System
  canAccessInventory: boolean; // View stock, adjust stock, supplier WhatsApp
  canAccessMenu: boolean; // Add/edit menu dishes, recipes, categories
  canAccessOffers: boolean; // Create/edit seasonal specials, broadcast on WhatsApp
  canAccessStaff: boolean; // Create/edit employee accounts & credentials
  canAccessTableQr: boolean; // Table QR codes & printable tent standees
  canAccessSettings: boolean; // Cafe branding, currency, tax rates
  canAccessAudit?: boolean; // Owner-only audit log review
  canApplyCustomDiscount: boolean; // Apply discounts
  maxDiscountPercent: number; // Maximum discount allowed (0-100)
  canVoidOrders: boolean; // Cancel/void active dining orders
}

export type AuditActionCategory =
  | 'AUTH'
  | 'ORDER'
  | 'BILLING'
  | 'MENU'
  | 'INVENTORY'
  | 'STAFF'
  | 'TABLE'
  | 'OFFER';

export interface AuditLog {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  staffRole: Role;
  category: AuditActionCategory;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface Employee {
  id: string;
  username: string;
  password?: string;
  pin: string; // 4-digit quick pin
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  permissions?: FeatureAccessPolicy;
}

export type TableStatus = 'available' | 'occupied' | 'billing' | 'reserved';

export interface CafeTable {
  id: string;
  tableNumber: number;
  capacity: number;
  section: string;
  status: TableStatus;
  activeOrderId?: string;
  qrCodeDataUrl?: string;
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  gstNumber?: string;
  fssaiNumber?: string;
  currency: string;
  currencySymbol: string;
  defaultTaxPercent: number;
  defaultServiceChargePercent: number;
  birthdayDiscountPercent: number;
}
