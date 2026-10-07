import { useState } from 'react';
import { CafeSettings, Employee } from '../types/cafe';
import { checkEmployeePermission } from '../lib/permissions';
import {
  Coffee,
  QrCode,
  Receipt,
  Utensils,
  Package,
  UtensilsCrossed,
  Users,
  Menu as MenuIcon,
  X,
  Sparkles,
  ShieldAlert,
  Download,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export type AppView =
  | 'table-menu'
  | 'cashier'
  | 'kitchen'
  | 'inventory'
  | 'menu-editor'
  | 'offers'
  | 'staff'
  | 'table-qr'
  | 'audit-log';

interface Props {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  settings: CafeSettings;
  activeStaff: Employee;
  tableNumber: number;
  onOpenLoginModal: () => void;
  onOpenInstallModal: () => void;
  onSignOut: () => void;
  activeOrdersCount: number;
}

export default function Sidebar({
  currentView,
  onSelectView,
  settings,
  activeStaff,
  tableNumber,
  onOpenLoginModal,
  onOpenInstallModal,
  onSignOut,
  activeOrdersCount,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check feature policies for current employee
  const permissionsMap: Record<AppView, boolean> = {
    'table-menu': true, // Customer QR menu
    'cashier': checkEmployeePermission(activeStaff, 'canAccessPos'),
    'kitchen': checkEmployeePermission(activeStaff, 'canAccessKds'),
    'inventory': checkEmployeePermission(activeStaff, 'canAccessInventory'),
    'menu-editor': checkEmployeePermission(activeStaff, 'canAccessMenu'),
    'offers': checkEmployeePermission(activeStaff, 'canAccessOffers'),
    'staff': checkEmployeePermission(activeStaff, 'canAccessStaff'),
    'table-qr': checkEmployeePermission(activeStaff, 'canAccessTableQr'),
    'audit-log': activeStaff.role === 'owner' || checkEmployeePermission(activeStaff, 'canAccessAudit'),
  };

  const allNavItems = [
    {
      id: 'table-menu' as AppView,
      label: 'QR Table Menu',
      sublabel: `Active Table #${tableNumber}`,
      icon: Coffee,
      highlight: true,
      allowed: true,
    },
    {
      id: 'cashier' as AppView,
      label: 'Cashier POS & Billing',
      sublabel: 'WhatsApp & Print Receipts',
      icon: Receipt,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      allowed: permissionsMap['cashier'],
    },
    {
      id: 'kitchen' as AppView,
      label: 'Kitchen KDS',
      sublabel: 'Live Prep Tickets',
      icon: Utensils,
      allowed: permissionsMap['kitchen'],
    },
    {
      id: 'inventory' as AppView,
      label: 'Inventory & Stock',
      sublabel: 'Deductions & Supplier WA',
      icon: Package,
      allowed: permissionsMap['inventory'],
    },
    {
      id: 'menu-editor' as AppView,
      label: 'Menu Engineering',
      sublabel: 'Dishes, Pricing & Margins',
      icon: UtensilsCrossed,
      allowed: permissionsMap['menu-editor'],
    },
    {
      id: 'offers' as AppView,
      label: 'Offers & Specials',
      sublabel: 'Seasonal & WA Broadcast',
      icon: Sparkles,
      allowed: permissionsMap['offers'],
    },
    {
      id: 'staff' as AppView,
      label: 'Staff & Credentials',
      sublabel: 'Roles & Access Policies',
      icon: Users,
      allowed: permissionsMap['staff'],
    },
    {
      id: 'table-qr' as AppView,
      label: 'Table QR Standees',
      sublabel: 'Printable Tent Cards',
      icon: QrCode,
      allowed: permissionsMap['table-qr'],
    },
    {
      id: 'audit-log' as AppView,
      label: 'Owner Audit Log',
      sublabel: 'Security & Operations Trail',
      icon: ShieldAlert,
      allowed: permissionsMap['audit-log'],
    },
  ];

  // Strictly filter out any features that the IAM user does not have permission for!
  const visibleNavItems = allNavItems.filter((item) => item.allowed);

  const handleNavClick = (view: AppView) => {
    onSelectView(view);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#526B5A] text-[#F5F1E8] select-none border-r border-[#43594A]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#43594A] bg-[#43594A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B86D43] text-white flex items-center justify-center shadow-md">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#F5F1E8] text-base tracking-tight font-serif">
                BrewPulse
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider bg-[#B86D43]/30 text-[#F5D8C7] px-1.5 py-0.5 rounded border border-[#B86D43]/40">
                POS
              </span>
            </div>
            <p className="text-xs text-[#D6DFD8] truncate mt-0.5 font-medium">{settings.cafeName}</p>
          </div>
        </div>
      </div>

      {/* Navigation List - Only authorized features are rendered! */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#CBD5CE]">
          Assigned Features ({activeStaff.role.toUpperCase()})
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#B86D43] text-white font-bold shadow-md shadow-black/15'
                  : 'text-[#E7EDE8] hover:bg-[#43594A] hover:text-[#F5F1E8] font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#CBD5CE] group-hover:text-white'
                  }`}
                />
                <div className="truncate">
                  <div className="leading-snug">
                    <span>{item.label}</span>
                  </div>
                  <div
                    className={`text-[10px] truncate leading-tight ${
                      isActive ? 'text-white/80 font-normal' : 'text-[#CBD5CE]'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ml-1 ${
                    isActive
                      ? 'bg-[#F5F1E8] text-[#526B5A]'
                      : 'bg-[#B86D43] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Tool Bar: Download App + IAM Account & Sign Out */}
      <div className="p-3 border-t border-[#43594A] space-y-2 bg-[#43594A]">
        {/* Download App Shortcut Button */}
        <button
          onClick={() => {
            onOpenInstallModal();
            setMobileOpen(false);
          }}
          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-[#4C6454] text-[#E7EDE8] border border-[#597361] hover:bg-[#3D5244] flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-[#F5D8C7]" />
            <span>Download App Shortcut</span>
          </div>
          <span className="text-[10px] font-bold text-white bg-[#B86D43] px-1.5 py-0.5 rounded">
            Chrome
          </span>
        </button>

        {/* Active Staff Tile + Sign Out Switcher */}
        <div className="p-2.5 rounded-xl border border-[#597361] bg-[#4C6454] flex items-center justify-between text-left shadow-xs">
          <button
            onClick={() => {
              onOpenLoginModal();
              setMobileOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer text-left"
            title="Switch IAM Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#B86D43] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {activeStaff.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F5F1E8] truncate leading-tight flex items-center gap-1">
                <span>{activeStaff.name}</span>
                <ChevronDown className="w-3 h-3 text-[#CBD5CE]" />
              </div>
              <div className="text-[10px] uppercase font-semibold text-[#F5D8C7] tracking-wider">
                {activeStaff.role}
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onSignOut();
              setMobileOpen(false);
            }}
            className="p-1.5 rounded-lg text-[#CBD5CE] hover:text-white hover:bg-[#3D5244] transition-colors cursor-pointer"
            title="Sign Out of IAM"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#526B5A] border-b border-[#43594A] px-4 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden text-[#F5F1E8]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg border border-[#597361] bg-[#4C6454] text-[#F5F1E8] hover:bg-[#3D5244] cursor-pointer"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#B86D43] text-white flex items-center justify-center text-xs shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-bold text-[#F5F1E8] text-sm font-serif">{settings.cafeName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInstallModal}
            className="p-1.5 rounded-lg bg-[#4C6454] border border-[#597361] text-[#F5F1E8] cursor-pointer"
            title="Download App"
          >
            <Download className="w-4 h-4 text-[#F5D8C7]" />
          </button>

          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4C6454] border border-[#597361] text-xs font-medium text-[#F5F1E8] cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#B86D43]" />
            <span className="capitalize">{activeStaff.role}</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30 print:hidden">
        {navContent}
      </aside>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-[#CBD5CE] hover:text-[#F5F1E8] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
