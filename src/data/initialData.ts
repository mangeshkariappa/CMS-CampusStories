import { Category, MenuItem, InventoryItem, Employee, CafeTable, CafeSettings, Order, SpecialOffer, AuditLog } from '../types/cafe';
import { ROLE_DEFAULT_PERMISSIONS } from '../lib/permissions';

export const initialOffers: SpecialOffer[] = [];

export const initialSettings: CafeSettings = {
  cafeName: "BrewPulse Cafe & Roastery",
  tagline: "Artisanal Kitchen & Specialty Coffee",
  address: "Shop 14, Heritage Lane, Mumbai 400001",
  phone: "+91 98200 12345",
  whatsappNumber: "919820012345",
  gstNumber: "",
  fssaiNumber: "",
  currency: "INR",
  currencySymbol: "₹",
  defaultTaxPercent: 5,
  defaultServiceChargePercent: 0,
  birthdayDiscountPercent: 10,
};

export const initialCategories: Category[] = [];

export const initialInventory: InventoryItem[] = [];

export const initialMenuItems: MenuItem[] = [];

// Single Owner IAM account - all other dummy staff accounts removed
export const initialEmployees: Employee[] = [
  {
    id: 'emp-owner-1',
    username: 'owner',
    password: 'password123',
    pin: '1234',
    name: 'Aryan Mehta (Owner)',
    email: 'owner@brewbean.com',
    phone: '+91 98200 99881',
    role: 'owner',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: ROLE_DEFAULT_PERMISSIONS.owner,
  },
];

export const initialTables: CafeTable[] = [];

export const initialOrders: Order[] = [];

export const initialAuditLogs: AuditLog[] = [];
