import { Role, FeatureAccessPolicy, Employee } from '../types/cafe';

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, FeatureAccessPolicy> = {
  owner: {
    canAccessPos: true,
    canAccessKds: true,
    canAccessInventory: true,
    canAccessMenu: true,
    canAccessOffers: true,
    canAccessStaff: true,
    canAccessTableQr: true,
    canAccessSettings: true,
    canAccessAudit: true,
    canApplyCustomDiscount: true,
    maxDiscountPercent: 100,
    canVoidOrders: true,
  },
  manager: {
    canAccessPos: true,
    canAccessKds: true,
    canAccessInventory: true,
    canAccessMenu: true,
    canAccessOffers: true,
    canAccessStaff: false,
    canAccessTableQr: true,
    canAccessSettings: false,
    canAccessAudit: false,
    canApplyCustomDiscount: true,
    maxDiscountPercent: 50,
    canVoidOrders: true,
  },
  cashier: {
    canAccessPos: true,
    canAccessKds: false,
    canAccessInventory: false,
    canAccessMenu: false,
    canAccessOffers: true, // Cashier can view and broadcast offers to guests
    canAccessStaff: false,
    canAccessTableQr: true,
    canAccessSettings: false,
    canAccessAudit: false,
    canApplyCustomDiscount: true,
    maxDiscountPercent: 20,
    canVoidOrders: false,
  },
  kitchen: {
    canAccessPos: false,
    canAccessKds: true,
    canAccessInventory: false,
    canAccessMenu: false,
    canAccessOffers: false,
    canAccessStaff: false,
    canAccessTableQr: false,
    canAccessSettings: false,
    canAccessAudit: false,
    canApplyCustomDiscount: false,
    maxDiscountPercent: 0,
    canVoidOrders: false,
  },
  waiter: {
    canAccessPos: false,
    canAccessKds: false,
    canAccessInventory: false,
    canAccessMenu: false,
    canAccessOffers: false,
    canAccessStaff: false,
    canAccessTableQr: true,
    canAccessSettings: false,
    canAccessAudit: false,
    canApplyCustomDiscount: false,
    maxDiscountPercent: 0,
    canVoidOrders: false,
  },
};

export function getEffectivePermissions(employee: Employee | null | undefined): FeatureAccessPolicy {
  if (!employee) {
    return ROLE_DEFAULT_PERMISSIONS.waiter;
  }
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[employee.role] || ROLE_DEFAULT_PERMISSIONS.cashier;
  return {
    ...roleDefaults,
    ...(employee.permissions || {}),
  };
}

export function checkEmployeePermission(
  employee: Employee | null | undefined,
  permissionKey: keyof FeatureAccessPolicy
): boolean {
  if (!employee) return false;
  if (!employee.isActive) return false;
  if (employee.role === 'owner') return true; // Owner always has master bypass
  const perms = getEffectivePermissions(employee);
  return Boolean(perms[permissionKey]);
}
