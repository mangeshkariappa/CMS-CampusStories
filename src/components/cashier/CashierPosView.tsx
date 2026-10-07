import { useState, useMemo } from 'react';
import { Order, CafeTable, CafeSettings, Employee, PaymentMethod } from '../../types/cafe';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  TrendingUp,
  Table as TableIcon,
  Sparkles,
  Phone,
  Cake,
} from 'lucide-react';
import BillModal from './BillModal';
import PrintableReceipt from './PrintableReceipt';
import { getWhatsAppBillLink } from '../../lib/whatsapp';

interface Props {
  orders: Order[];
  tables: CafeTable[];
  settings: CafeSettings;
  activeStaff: Employee;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onCompleteBilling: (
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
  ) => void;
  onRecordWhatsAppSent: (orderId: string) => void;
  onUpdateTableStatus: (tableNumber: number, status: CafeTable['status']) => void;
}

export default function CashierPosView({
  orders,
  tables,
  settings,
  activeStaff,
  onUpdateOrderStatus,
  onCompleteBilling,
  onRecordWhatsAppSent,
  onUpdateTableStatus,
}: Props) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [orderToPrintDirectly, setOrderToPrintDirectly] = useState<Order | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled');
    const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    return {
      totalRevenue,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      avgTicket,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (activeTab === 'active') return o.paymentStatus === 'unpaid' && o.status !== 'cancelled';
        if (activeTab === 'completed') return o.paymentStatus === 'paid';
        return true;
      })
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.tableNumber.toString().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab, searchQuery]);

  const handleQuickWhatsApp = (order: Order) => {
    const link = getWhatsAppBillLink(order, settings);
    window.open(link, '_blank');
    onRecordWhatsAppSent(order.id);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif">
              Cashier POS & Dining Operations
            </h1>
            <span className="text-xs bg-[#526B5A] text-[#F5F1E8] font-bold px-2.5 py-0.5 rounded-full">
              Counter POS
            </span>
          </div>
          <p className="text-xs text-[#617568] mt-0.5">
            Active staff cashier: <span className="text-[#2D3D33] font-bold">{activeStaff.name}</span> ({activeStaff.role}) · 1-click WhatsApp billing & thermal printing
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#526B5A]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2D3D33] font-mono">
            {settings.currencySymbol}{stats.totalRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">{stats.paidCount} bills settled</p>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Dining / Unpaid</span>
            <Clock className="w-4 h-4 text-[#B86B3D]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#B86B3D] font-mono">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">Awaiting billing</p>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Occupied Tables</span>
            <TableIcon className="w-4 h-4 text-[#526B5A]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2D3D33] font-mono">
            {tables.filter((t) => t.status === 'occupied' || t.status === 'billing').length} / {tables.length}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">
            {tables.filter((t) => t.status === 'available').length} free tables
          </p>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Avg Ticket Size</span>
            <Sparkles className="w-4 h-4 text-[#B86B3D]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2D3D33] font-mono">
            {settings.currencySymbol}{stats.avgTicket.toFixed(0)}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">Per settled bill</p>
        </div>
      </div>

      {/* Tables Floor Map Quick View */}
      <div className="bg-white border border-[#E3DCD1] rounded-3xl p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D3D33] flex items-center gap-1.5">
            <TableIcon className="w-4 h-4 text-[#B86B3D]" /> Live Dining Floor
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-[#617568]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B86B3D]" /> Dining
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Billing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {tables.map((tbl) => {
            const activeOrderForTable = orders.find(
              (o) => o.tableNumber === tbl.tableNumber && o.paymentStatus === 'unpaid' && o.status !== 'cancelled'
            );

            return (
              <div
                key={tbl.id}
                className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                  tbl.status === 'occupied'
                    ? 'border-[#F6D7C3] bg-[#FDF4EE]'
                    : tbl.status === 'billing'
                    ? 'border-purple-300 bg-purple-50/70'
                    : 'border-[#E3DCD1] bg-[#F5F1E8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D3D33]">T-{tbl.tableNumber}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tbl.status === 'occupied'
                        ? 'bg-[#B86B3D]'
                        : tbl.status === 'billing'
                        ? 'bg-purple-600'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-[#617568] mt-1 capitalize truncate">{tbl.section}</div>

                {activeOrderForTable ? (
                  <div className="mt-2 pt-2 border-t border-[#F6D7C3]">
                    <p className="text-[10px] font-bold text-[#2D3D33] truncate">
                      {activeOrderForTable.customer.name}
                    </p>
                    <p className="text-xs font-black text-[#B86B3D] font-mono">
                      {settings.currencySymbol}{activeOrderForTable.total.toFixed(0)}
                    </p>
                    <button
                      onClick={() => setSelectedOrderForBill(activeOrderForTable)}
                      className="mt-1.5 w-full bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-1 px-1.5 rounded-lg text-[10px] transition-colors cursor-pointer shadow-xs"
                    >
                      Bill Table
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-[#73897C]">Available</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E3DCD1] rounded-2xl shrink-0 shadow-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            Active Orders ({orders.filter((o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            Paid Bills ({orders.filter((o) => o.paymentStatus === 'paid').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            All History ({orders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, guest, WA phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E3DCD1] rounded-2xl pl-9 pr-4 py-2 text-xs text-[#2D3D33] placeholder:text-[#73897C] focus:outline-none focus:border-[#526B5A] shadow-xs"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#E3DCD1] rounded-3xl p-12 text-center text-[#73897C] space-y-1 shadow-xs">
            <Receipt className="w-8 h-8 mx-auto opacity-30 text-[#526B5A]" />
            <p className="text-sm font-bold text-[#2D3D33]">No orders found.</p>
            <p className="text-xs text-[#73897C]">Scan table QR codes or place an order in Table Menu mode.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPaid = order.paymentStatus === 'paid';
            const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white border border-[#E3DCD1] rounded-3xl p-4 hover:border-[#526B5A]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                {/* Left: Order Info & Customer Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#2D3D33]">{order.orderNumber}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDF4EE] text-[#B86B3D] border border-[#F6D7C3] text-xs font-bold">
                      Table #{order.tableNumber}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-[#FDF4EE] text-[#B86B3D] border border-[#F6D7C3]'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>

                    {order.customer.isBirthdayToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF4EE] text-[#B86B3D] border border-[#F6D7C3] flex items-center gap-1">
                        <Cake className="w-3 h-3 text-[#B86B3D]" /> BDAY GUEST
                      </span>
                    )}

                    <span className="text-xs text-[#73897C] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> {orderTime}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#617568]">
                    <span className="font-bold text-[#2D3D33]">{order.customer.name}</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-mono text-[#617568] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#73897C]" /> +{order.customer.phone}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[#73897C]">DOB: {order.customer.dob || 'N/A'}</span>
                  </div>

                  {/* Items summary */}
                  <p className="text-xs text-[#617568] line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                {/* Right: Bill Amount & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8EFEA]">
                  <div className="text-right">
                    <p className="text-[11px] text-[#73897C] uppercase tracking-wider font-semibold">Total Bill</p>
                    <p className="text-lg font-black text-[#2D3D33] font-mono">
                      {settings.currencySymbol}{order.total.toFixed(2)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Bill Button */}
                    <button
                      onClick={() => handleQuickWhatsApp(order)}
                      className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer shadow-xs"
                      title="Send Bill via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Print Bill Button */}
                    <button
                      onClick={() => setOrderToPrintDirectly(order)}
                      className="p-2.5 rounded-xl bg-white text-[#2D3D33] hover:bg-[#F5F1E8] border border-[#DDD5C8] transition-colors cursor-pointer shadow-xs"
                      title="Print Thermal POS Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Settle Bill / Generate Bill Modal (Coffee Orange 10% CTA) */}
                    {!isPaid ? (
                      <button
                        onClick={() => setSelectedOrderForBill(order)}
                        className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Generate Bill</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedOrderForBill(order)}
                        className="bg-white hover:bg-[#F5F1E8] text-[#2D3D33] font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-[#DDD5C8] cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill & Payment Modal */}
      {selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          settings={settings}
          activeStaff={activeStaff}
          onClose={() => setSelectedOrderForBill(null)}
          onSaveBilling={(billingData) => {
            onCompleteBilling(selectedOrderForBill.id, billingData);
          }}
          onRecordWhatsAppSent={onRecordWhatsAppSent}
        />
      )}

      {/* Direct Thermal Receipt Print Modal */}
      {orderToPrintDirectly && (
        <PrintableReceipt
          order={orderToPrintDirectly}
          settings={settings}
          onClose={() => setOrderToPrintDirectly(null)}
          autoPrint={true}
        />
      )}
    </div>
  );
}
