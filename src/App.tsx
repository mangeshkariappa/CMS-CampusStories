import { useState, useEffect, useCallback } from 'react';
import { CafeStore } from './lib/storage';
import {
  CafeSettings,
  Category,
  MenuItem,
  InventoryItem,
  Employee,
  CafeTable,
  Order,
  OrderStatus,
  PaymentMethod,
  SpecialOffer,
  AuditLog,
} from './types/cafe';
import { checkEmployeePermission } from './lib/permissions';
import Sidebar, { AppView } from './components/Sidebar';
import CustomerOrderingView from './components/customer/CustomerOrderingView';
import CashierPosView from './components/cashier/CashierPosView';
import KitchenDisplayView from './components/kitchen/KitchenDisplayView';
import InventoryView from './components/inventory/InventoryView';
import MenuManagementView from './components/menu/MenuManagementView';
import OffersManagementView from './components/offers/OffersManagementView';
import StaffManagementView from './components/staff/StaffManagementView';
import TableQrManager from './components/tables/TableQrManager';
import RoleLoginModal from './components/staff/RoleLoginModal';
import AccessRestrictedView from './components/common/AccessRestrictedView';
import IamLoginPage from './components/auth/IamLoginPage';
import AuditLogView from './components/audit/AuditLogView';
import PwaInstallModal from './components/common/PwaInstallModal';
import { ToastProvider, useToast } from './components/common/Toast';

function CafeAppContent() {
  const { showToast } = useToast();

  // Primary state
  const [settings, setSettings] = useState<CafeSettings>(CafeStore.getSettings());
  const [categories, setCategories] = useState<Category[]>(CafeStore.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(CafeStore.getMenuItems());
  const [inventory, setInventory] = useState<InventoryItem[]>(CafeStore.getInventory());
  const [employees, setEmployees] = useState<Employee[]>(CafeStore.getEmployees());
  const [tables, setTables] = useState<CafeTable[]>(CafeStore.getTables());
  const [orders, setOrders] = useState<Order[]>(CafeStore.getOrders());
  const [offers, setOffers] = useState<SpecialOffer[]>(CafeStore.getOffers());
  const [activeStaff, setActiveStaff] = useState<Employee>(CafeStore.getActiveStaff());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(CafeStore.getAuditLogs());

  // IAM Auth & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(CafeStore.isAuthenticated());
  const [isCustomerDirectMode, setIsCustomerDirectMode] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('cashier');
  const [currentTableNumber, setCurrentTableNumber] = useState<number>(1);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Read URL query parameter "?table=X" on mount for direct table QR code scans
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        const num = parseInt(tableParam, 10);
        if (!isNaN(num) && num > 0) {
          setCurrentTableNumber(num);
          setCurrentView('table-menu');
          setIsCustomerDirectMode(true);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  // Listen for storage changes across tabs/components
  useEffect(() => {
    const handleStorageUpdate = () => {
      setSettings(CafeStore.getSettings());
      setCategories(CafeStore.getCategories());
      setMenuItems(CafeStore.getMenuItems());
      setInventory(CafeStore.getInventory());
      setEmployees(CafeStore.getEmployees());
      setTables(CafeStore.getTables());
      setOrders(CafeStore.getOrders());
      setOffers(CafeStore.getOffers());
      setActiveStaff(CafeStore.getActiveStaff());
      setAuditLogs(CafeStore.getAuditLogs());
      setIsAuthenticated(CafeStore.isAuthenticated());
    };

    window.addEventListener('brewpulse_store_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('brewpulse_store_updated', handleStorageUpdate);
    };
  }, []);

  // IAM Login handler
  const handleIamLogin = useCallback(
    (emp: Employee) => {
      CafeStore.setActiveStaff(emp);
      CafeStore.setAuthenticated(true);
      setActiveStaff(emp);
      setIsAuthenticated(true);
      setIsCustomerDirectMode(false);

      // Record audit event
      CafeStore.addAuditLog({
        staffId: emp.id,
        staffName: emp.name,
        staffRole: emp.role,
        category: 'AUTH',
        action: 'IAM Login Successful',
        details: `${emp.name} logged in with role ${emp.role.toUpperCase()}`,
        metadata: { username: emp.username, role: emp.role },
      });
      setAuditLogs(CafeStore.getAuditLogs());

      // Route strictly to first permitted view for this IAM user
      if (emp.role === 'kitchen') {
        setCurrentView('kitchen');
      } else if (emp.role === 'waiter') {
        setCurrentView('table-menu');
      } else if (emp.role === 'manager') {
        setCurrentView('cashier');
      } else if (emp.role === 'owner') {
        setCurrentView('cashier');
      } else {
        setCurrentView('cashier');
      }

      showToast('Welcome!', `Logged in as ${emp.name} (${emp.role.toUpperCase()})`, 'success');
    },
    [showToast]
  );

  // IAM Sign Out handler
  const handleSignOut = useCallback(() => {
    CafeStore.addAuditLog({
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      staffRole: activeStaff.role,
      category: 'AUTH',
      action: 'IAM User Signed Out',
      details: `${activeStaff.name} logged out from terminal.`,
    });
    setAuditLogs(CafeStore.getAuditLogs());
    CafeStore.setAuthenticated(false);
    setIsAuthenticated(false);
    setIsCustomerDirectMode(false);
    showToast('Signed Out', 'You have been safely signed out.', 'info');
  }, [activeStaff, showToast]);

  // Handlers for orders
  const handlePlaceOrder = useCallback(
    (newOrder: Order) => {
      CafeStore.addOrder(newOrder);
      setOrders(CafeStore.getOrders());
      setTables(CafeStore.getTables());
      setInventory(CafeStore.getInventory());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'ORDER',
        action: 'Order Placed',
        details: `Order #${newOrder.orderNumber} for Table #${newOrder.tableNumber} (${newOrder.customer.name || 'Guest'})`,
        metadata: { orderId: newOrder.id, tableNumber: newOrder.tableNumber, total: newOrder.total },
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast(
        `Order ${newOrder.orderNumber} Placed!`,
        `Table #${newOrder.tableNumber} for ${newOrder.customer.name}`,
        'success'
      );
    },
    [activeStaff, showToast]
  );

  const handleUpdateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      CafeStore.updateOrderStatus(orderId, status);
      setOrders(CafeStore.getOrders());
      setTables(CafeStore.getTables());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'ORDER',
        action: 'Order Status Changed',
        details: `Order ${orderId} marked as ${status.toUpperCase()}`,
        metadata: { orderId, status },
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Order Status Updated', `Order marked as ${status}`, 'info');
    },
    [activeStaff, showToast]
  );

  const handleCompleteBilling = useCallback(
    (
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
        markTableAvailable: boolean;
      }
    ) => {
      const completed = CafeStore.completeAndBillOrder(orderId, billingData);
      if (completed) {
        setOrders(CafeStore.getOrders());
        setTables(CafeStore.getTables());

        CafeStore.addAuditLog({
          staffId: activeStaff.id,
          staffName: activeStaff.name,
          staffRole: activeStaff.role,
          category: 'BILLING',
          action: 'Bill Settled',
          details: `Order #${completed.orderNumber} (Table ${completed.tableNumber}) settled for ${settings.currencySymbol}${completed.total.toFixed(2)} via ${billingData.paymentMethod.toUpperCase()}`,
          metadata: {
            orderId: completed.id,
            total: completed.total,
            paymentMethod: billingData.paymentMethod,
            discountPercentage: billingData.discountPercentage,
          },
        });
        setAuditLogs(CafeStore.getAuditLogs());

        showToast(
          'Bill Settled & Completed',
          `Order ${completed.orderNumber} (Table ${completed.tableNumber}) settled for ${settings.currencySymbol}${completed.total.toFixed(2)}`,
          'success'
        );
      }
    },
    [activeStaff, settings.currencySymbol, showToast]
  );

  const handleRecordWhatsAppSent = useCallback((orderId: string) => {
    CafeStore.recordWhatsAppSent(orderId);
    setOrders(CafeStore.getOrders());
  }, []);

  // Handlers for Inventory
  const handleAddInventoryItem = useCallback(
    (item: InventoryItem) => {
      CafeStore.addInventoryItem(item);
      setInventory(CafeStore.getInventory());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'INVENTORY',
        action: 'Stock Item Added',
        details: `Added ${item.name} (${item.currentStock} ${item.unit})`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Stock Item Added', item.name, 'success');
    },
    [activeStaff, showToast]
  );

  const handleUpdateInventoryItem = useCallback(
    (item: InventoryItem) => {
      CafeStore.updateInventoryItem(item);
      setInventory(CafeStore.getInventory());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'INVENTORY',
        action: 'Stock Item Updated',
        details: `Updated ${item.name} stock: ${item.currentStock} ${item.unit}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Stock Item Updated', item.name, 'info');
    },
    [activeStaff, showToast]
  );

  const handleAdjustStock = useCallback(
    (id: string, amount: number) => {
      CafeStore.adjustStock(id, amount);
      setInventory(CafeStore.getInventory());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'INVENTORY',
        action: 'Stock Adjusted',
        details: `Adjusted stock by ${amount > 0 ? '+' : ''}${amount} for item ${id}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());
    },
    [activeStaff]
  );

  const handleDeleteInventoryItem = useCallback(
    (id: string) => {
      CafeStore.deleteInventoryItem(id);
      setInventory(CafeStore.getInventory());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'INVENTORY',
        action: 'Stock Item Removed',
        details: `Removed stock item ${id}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Stock Item Removed', undefined, 'info');
    },
    [activeStaff, showToast]
  );

  // Handlers for Menu
  const handleAddMenuItem = useCallback(
    (item: MenuItem) => {
      CafeStore.addMenuItem(item);
      setMenuItems(CafeStore.getMenuItems());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'MENU',
        action: 'Dish Added',
        details: `Created menu dish "${item.name}" (${settings.currencySymbol}${item.price.toFixed(2)})`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Dish Added to Menu', item.name, 'success');
    },
    [activeStaff, settings.currencySymbol, showToast]
  );

  const handleUpdateMenuItem = useCallback(
    (item: MenuItem) => {
      CafeStore.updateMenuItem(item);
      setMenuItems(CafeStore.getMenuItems());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'MENU',
        action: 'Dish Updated',
        details: `Updated "${item.name}" price: ${settings.currencySymbol}${item.price.toFixed(2)}, available: ${item.isAvailable}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Dish Updated', item.name, 'info');
    },
    [activeStaff, settings.currencySymbol, showToast]
  );

  const handleDeleteMenuItem = useCallback(
    (id: string) => {
      CafeStore.deleteMenuItem(id);
      setMenuItems(CafeStore.getMenuItems());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'MENU',
        action: 'Dish Deleted',
        details: `Removed dish ${id} from menu`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Dish Removed from Menu', undefined, 'info');
    },
    [activeStaff, showToast]
  );

  const handleAddCategory = useCallback(
    (category: Category) => {
      const cats = CafeStore.getCategories();
      cats.push(category);
      CafeStore.saveCategories(cats);
      setCategories(cats);

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'MENU',
        action: 'Category Created',
        details: `Created category "${category.name}"`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Category Created', category.name, 'success');
    },
    [activeStaff, showToast]
  );

  // Handlers for Staff
  const handleAddEmployee = useCallback(
    (emp: Employee) => {
      CafeStore.addEmployee(emp);
      setEmployees(CafeStore.getEmployees());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'STAFF',
        action: 'IAM Staff Account Created',
        details: `Created staff user "${emp.username}" (${emp.name}) with role ${emp.role.toUpperCase()}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Employee Account Created', `${emp.name} (${emp.role})`, 'success');
    },
    [activeStaff, showToast]
  );

  const handleUpdateEmployee = useCallback(
    (emp: Employee) => {
      CafeStore.updateEmployee(emp);
      setEmployees(CafeStore.getEmployees());
      if (activeStaff.id === emp.id) {
        CafeStore.setActiveStaff(emp);
        setActiveStaff(emp);
      }

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'STAFF',
        action: 'IAM Staff Account Updated',
        details: `Updated permissions/status for "${emp.name}" (${emp.role})`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Credentials & Policies Updated', emp.name, 'info');
    },
    [activeStaff, showToast]
  );

  const handleDeleteEmployee = useCallback(
    (id: string) => {
      CafeStore.deleteEmployee(id);
      setEmployees(CafeStore.getEmployees());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'STAFF',
        action: 'IAM Staff Account Removed',
        details: `Deleted employee profile ${id}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Employee Account Removed', undefined, 'info');
    },
    [activeStaff, showToast]
  );

  const handleSwitchStaff = useCallback(
    (emp: Employee) => {
      CafeStore.setActiveStaff(emp);
      setActiveStaff(emp);

      CafeStore.addAuditLog({
        staffId: emp.id,
        staffName: emp.name,
        staffRole: emp.role,
        category: 'AUTH',
        action: 'Switched Active Staff Profile',
        details: `Switched terminal session to ${emp.name} (${emp.role.toUpperCase()})`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Switched Account', `Logged in as ${emp.name} (${emp.role.toUpperCase()})`, 'success');
    },
    [showToast]
  );

  // Handlers for Tables
  const handleAddTable = useCallback(
    (tbl: CafeTable) => {
      CafeStore.addTable(tbl);
      setTables(CafeStore.getTables());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'TABLE',
        action: 'Dining Table Added',
        details: `Created Table #${tbl.tableNumber} in ${tbl.section}`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Table Created', `Table #${tbl.tableNumber}`, 'success');
    },
    [activeStaff, showToast]
  );

  const handleUpdateTableStatus = useCallback(
    (tableNumber: number, status: CafeTable['status']) => {
      CafeStore.updateTableStatus(tableNumber, status);
      setTables(CafeStore.getTables());
    },
    []
  );

  // Handlers for Offers & Specials
  const handleAddOffer = useCallback(
    (offer: SpecialOffer) => {
      CafeStore.addOffer(offer);
      setOffers(CafeStore.getOffers());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'OFFER',
        action: 'Special Offer Created',
        details: `Created offer "${offer.title}" (${offer.badgeText})`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('Offer Created', offer.title, 'success');
    },
    [activeStaff, showToast]
  );

  const handleUpdateOffer = useCallback(
    (offer: SpecialOffer) => {
      CafeStore.updateOffer(offer);
      setOffers(CafeStore.getOffers());
      showToast('Offer Updated', offer.title, 'info');
    },
    [showToast]
  );

  const handleDeleteOffer = useCallback(
    (id: string) => {
      CafeStore.deleteOffer(id);
      setOffers(CafeStore.getOffers());
      showToast('Offer Removed', undefined, 'info');
    },
    [showToast]
  );

  const handleRecordBroadcastSent = useCallback(
    (offerId: string, count: number) => {
      CafeStore.incrementBroadcastCount(offerId, count);
      setOffers(CafeStore.getOffers());

      CafeStore.addAuditLog({
        staffId: activeStaff.id,
        staffName: activeStaff.name,
        staffRole: activeStaff.role,
        category: 'OFFER',
        action: 'WhatsApp Broadcast Dispatched',
        details: `Delivered broadcast for offer ${offerId} to ${count} customers`,
      });
      setAuditLogs(CafeStore.getAuditLogs());

      showToast('WhatsApp Broadcast Dispatched', `Broadcast delivered to ${count} customer(s)!`, 'success');
    },
    [activeStaff, showToast]
  );

  const activeOrdersCount = orders.filter(
    (o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled'
  ).length;

  // IF NOT AUTHENTICATED AND NOT IN CUSTOMER DIRECT MODE: Render dedicated IAM Login Page
  if (!isAuthenticated && !isCustomerDirectMode) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] text-[#2D3D33] font-sans selection:bg-[#B86B3D]/25 selection:text-[#2D3D33]">
        <IamLoginPage
          employees={employees}
          cafeName={settings.cafeName}
          onLoginSuccess={handleIamLogin}
          onOpenCustomerView={() => {
            setIsCustomerDirectMode(true);
            setCurrentView('table-menu');
          }}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          currentTableNumber={currentTableNumber}
        />
        <PwaInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2D3D33] flex flex-col md:flex-row font-sans selection:bg-[#B86B3D]/25 selection:text-[#2D3D33]">
      {/* Side Navigation Bar - Only assigned features are visible for the IAM user */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        settings={settings}
        activeStaff={activeStaff}
        tableNumber={currentTableNumber}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onSignOut={handleSignOut}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Main Content Area with Strict IAM Policy Enforcement */}
      <main className="flex-1 min-w-0 bg-[#F5F1E8]">
        {currentView === 'table-menu' && (
          <CustomerOrderingView
            settings={settings}
            categories={categories}
            menuItems={menuItems}
            offers={offers}
            tableNumber={currentTableNumber}
            onTableChange={setCurrentTableNumber}
            onPlaceOrder={handlePlaceOrder}
          />
        )}

        {currentView === 'cashier' &&
          (checkEmployeePermission(activeStaff, 'canAccessPos') ? (
            <CashierPosView
              orders={orders}
              tables={tables}
              settings={settings}
              activeStaff={activeStaff}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onCompleteBilling={handleCompleteBilling}
              onRecordWhatsAppSent={handleRecordWhatsAppSent}
              onUpdateTableStatus={handleUpdateTableStatus}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Cashier POS & Billing"
              requiredPermissionLabel="POS & Billing Authority (canAccessPos)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'kitchen' &&
          (checkEmployeePermission(activeStaff, 'canAccessKds') ? (
            <KitchenDisplayView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Kitchen Display System (KDS)"
              requiredPermissionLabel="Kitchen & Barista Ticket Authority (canAccessKds)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'inventory' &&
          (checkEmployeePermission(activeStaff, 'canAccessInventory') ? (
            <InventoryView
              inventory={inventory}
              settings={settings}
              onAddInventoryItem={handleAddInventoryItem}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onAdjustStock={handleAdjustStock}
              onDeleteInventoryItem={handleDeleteInventoryItem}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Inventory & Stock Control"
              requiredPermissionLabel="Inventory Management Authority (canAccessInventory)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'menu-editor' &&
          (checkEmployeePermission(activeStaff, 'canAccessMenu') ? (
            <MenuManagementView
              menuItems={menuItems}
              categories={categories}
              inventory={inventory}
              settings={settings}
              onAddMenuItem={handleAddMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onAddCategory={handleAddCategory}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Menu Engineering & Pricing"
              requiredPermissionLabel="Menu Modification Authority (canAccessMenu)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'offers' &&
          (checkEmployeePermission(activeStaff, 'canAccessOffers') ? (
            <OffersManagementView
              offers={offers}
              orders={orders}
              settings={settings}
              onAddOffer={handleAddOffer}
              onUpdateOffer={handleUpdateOffer}
              onDeleteOffer={handleDeleteOffer}
              onRecordBroadcastSent={handleRecordBroadcastSent}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Special Offers, Recommendations & WhatsApp Broadcast"
              requiredPermissionLabel="Offers & Marketing Authority (canAccessOffers)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'staff' &&
          (checkEmployeePermission(activeStaff, 'canAccessStaff') ? (
            <StaffManagementView
              employees={employees}
              activeStaff={activeStaff}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onSwitchStaff={handleSwitchStaff}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Staff Accounts & Credentials Admin"
              requiredPermissionLabel="Staff Administration Authority (canAccessStaff)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'table-qr' &&
          (checkEmployeePermission(activeStaff, 'canAccessTableQr') ? (
            <TableQrManager
              tables={tables}
              settings={settings}
              onAddTable={handleAddTable}
              onSelectTableForMenu={(tableNum) => {
                setCurrentTableNumber(tableNum);
                setCurrentView('table-menu');
              }}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Table QR Standees & Tent Cards"
              requiredPermissionLabel="Table QR Standee Access (canAccessTableQr)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('table-menu')}
            />
          ))}

        {currentView === 'audit-log' &&
          (activeStaff.role === 'owner' || checkEmployeePermission(activeStaff, 'canAccessAudit') ? (
            <AuditLogView
              auditLogs={auditLogs}
              employees={employees}
              activeStaff={activeStaff}
              onClearLogs={() => {
                CafeStore.clearAuditLogs();
                setAuditLogs([]);
                showToast('Audit Logs Cleared', 'Security & event records have been wiped.', 'info');
              }}
            />
          ) : (
            <AccessRestrictedView
              moduleName="Owner Security & Audit Trail"
              requiredPermissionLabel="Owner Privilege Authority (canAccessAudit)"
              activeStaff={activeStaff}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNavigateToAllowed={() => setCurrentView('cashier')}
            />
          ))}
      </main>

      {/* IAM Role Switcher Modal */}
      <RoleLoginModal
        employees={employees}
        activeStaff={activeStaff}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectEmployee={handleSwitchStaff}
      />

      {/* Download App Shortcut Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CafeAppContent />
    </ToastProvider>
  );
}
