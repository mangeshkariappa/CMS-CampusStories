import { useState, useMemo } from 'react';
import { Order, CafeSettings, PaymentMethod, Employee } from '../../types/cafe';
import {
  X,
  MessageCircle,
  Printer,
  CheckCircle2,
  Percent,
  Cake,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';
import { getWhatsAppBillLink } from '../../lib/whatsapp';
import { getEffectivePermissions } from '../../lib/permissions';
import PrintableReceipt from './PrintableReceipt';

interface Props {
  order: Order;
  settings: CafeSettings;
  activeStaff: Employee;
  onClose: () => void;
  onSaveBilling: (billingData: {
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
  }) => void;
  onRecordWhatsAppSent: (orderId: string) => void;
}

export default function BillModal({
  order,
  settings,
  activeStaff,
  onClose,
  onSaveBilling,
  onRecordWhatsAppSent,
}: Props) {
  const [discountPercent, setDiscountPercent] = useState<number>(order.discountPercentage || (order.customer.isBirthdayToday ? 15 : 0));
  const [discountReason, setDiscountReason] = useState<string>(
    order.discountReason || (order.customer.isBirthdayToday ? 'Birthday Special Discount' : '')
  );
  const [taxPercent, setTaxPercent] = useState<number>(order.taxPercentage ?? settings.defaultTaxPercent);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(
    order.serviceChargePercentage ?? settings.defaultServiceChargePercent
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || 'upi');
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);
  const [isWhatsAppSent, setIsWhatsAppSent] = useState(Boolean(order.whatsappSentAt));
  const [markTableAvailable, setMarkTableAvailable] = useState(true);

  // Feature policy limit for discounts
  const permissions = getEffectivePermissions(activeStaff);
  const maxAllowedDiscount = permissions.maxDiscountPercent ?? 100;
  const canApplyDiscount = permissions.canApplyCustomDiscount;

  // Subtotal
  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Financial calculations
  const discountAmount = useMemo(() => {
    return Number(((subtotal * discountPercent) / 100).toFixed(2));
  }, [subtotal, discountPercent]);

  const discountedSubtotal = subtotal - discountAmount;

  const taxAmount = useMemo(() => {
    return Number(((discountedSubtotal * taxPercent) / 100).toFixed(2));
  }, [discountedSubtotal, taxPercent]);

  const serviceChargeAmount = useMemo(() => {
    return Number(((discountedSubtotal * serviceChargePercent) / 100).toFixed(2));
  }, [discountedSubtotal, serviceChargePercent]);

  const total = useMemo(() => {
    return Number((discountedSubtotal + taxAmount + serviceChargeAmount).toFixed(2));
  }, [discountedSubtotal, taxAmount, serviceChargeAmount]);

  const currentBilledOrder: Order = {
    ...order,
    discountPercentage: discountPercent,
    discountAmount,
    discountReason: discountReason.trim() || undefined,
    taxPercentage: taxPercent,
    taxAmount,
    serviceChargePercentage: serviceChargePercent,
    serviceChargeAmount,
    total,
    paymentMethod,
    paymentStatus: 'paid',
    billedBy: `${activeStaff.name} (${activeStaff.role})`,
    billedAt: new Date().toISOString(),
  };

  const handleSendWhatsApp = () => {
    const link = getWhatsAppBillLink(currentBilledOrder, settings);
    window.open(link, '_blank');
    setIsWhatsAppSent(true);
    onRecordWhatsAppSent(order.id);
  };

  const handleCompleteOrder = () => {
    onSaveBilling({
      discountPercentage: discountPercent,
      discountAmount,
      discountReason: discountReason.trim() || undefined,
      taxPercentage: taxPercent,
      taxAmount,
      serviceChargePercentage: serviceChargePercent,
      serviceChargeAmount,
      total,
      paymentMethod,
      billedBy: `${activeStaff.name} (${activeStaff.role})`,
      markTableAvailable,
    });
    onClose();
  };

  const handleDiscountChange = (val: number) => {
    const clamped = Math.max(0, Math.min(maxAllowedDiscount, val));
    setDiscountPercent(clamped);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-2xl w-full text-[#2D3D33] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3DCD1] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2D3D33] font-serif">Table Bill & Settle Invoice</h2>
                <span className="text-xs font-mono font-bold text-[#B86B3D]">{order.orderNumber}</span>
              </div>
              <p className="text-xs text-[#617568]">
                Table #{order.tableNumber} · Guest: {order.customer.name} (+{order.customer.phone})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#F5F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Birthday Badge Alert */}
          {order.customer.isBirthdayToday && (
            <div className="p-3.5 rounded-2xl bg-[#FDF4EE] border border-[#F6D7C3] text-[#B86B3D] flex items-center gap-2.5">
              <Cake className="w-5 h-5 text-[#B86B3D] shrink-0" />
              <div className="text-xs">
                <strong>Birthday Guest:</strong> Today is {order.customer.name}'s birthday! A 15% birthday celebration discount has been pre-selected.
              </div>
            </div>
          )}

          {/* Ordered Dishes Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#617568]">
              Ordered Dishes ({order.items.length})
            </h3>
            <div className="border border-[#E3DCD1] rounded-2xl bg-white overflow-hidden shadow-xs">
              <div className="divide-y divide-[#E8EFEA]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2D3D33]">{item.name}</span>
                      <span className="text-[#73897C] font-mono ml-2">× {item.quantity}</span>
                      {item.customization && (
                        <p className="text-[11px] text-[#617568]">
                          {[item.customization.milk, item.customization.sweetness, item.customization.notes]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#2D3D33]">
                      {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Adjustments: Discount & Taxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#E3DCD1] shadow-xs">
            {/* Discount Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#617568] flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-[#B86B3D]" /> Discount (%)
                </label>
                <span className="text-[10px] text-[#73897C]">Max: {maxAllowedDiscount}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={maxAllowedDiscount}
                  disabled={!canApplyDiscount}
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-3 py-1.5 text-[#2D3D33] font-mono text-xs focus:outline-none focus:border-[#526B5A] disabled:opacity-50"
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      disabled={!canApplyDiscount || pct > maxAllowedDiscount}
                      onClick={() => handleDiscountChange(pct)}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold transition-colors cursor-pointer disabled:opacity-30 ${
                        discountPercent === pct
                          ? 'bg-[#B86B3D] text-white border-[#B86B3D]'
                          : 'bg-[#F5F1E8] border-[#DDD5C8] text-[#617568] hover:text-[#2D3D33]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Discount reason (e.g. Birthday, Loyalty, Goodwill)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-3 py-1.5 text-[#2D3D33] text-[11px] focus:outline-none focus:border-[#526B5A]"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#617568]">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-[#526B5A] bg-[#526B5A] text-white font-bold shadow-xs'
                      : 'border-[#DDD5C8] bg-white text-[#617568] hover:border-[#526B5A]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-[#B86B3D] bg-[#B86B3D] text-white font-bold shadow-xs'
                      : 'border-[#DDD5C8] bg-white text-[#617568] hover:border-[#B86B3D]'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#526B5A] bg-[#526B5A] text-white font-bold shadow-xs'
                      : 'border-[#DDD5C8] bg-white text-[#617568] hover:border-[#526B5A]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card / POS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Financial Calculation Box */}
          <div className="p-4 rounded-2xl bg-white border border-[#E3DCD1] space-y-2 text-xs shadow-xs">
            <div className="flex justify-between text-[#617568]">
              <span>Subtotal ({order.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
              <span className="font-mono font-bold text-[#2D3D33]">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[#B86B3D] font-bold">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#617568]">
              <span>GST ({taxPercent}%):</span>
              <span className="font-mono text-[#2D3D33]">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>

            {serviceChargeAmount > 0 && (
              <div className="flex justify-between text-[#617568]">
                <span>Service Charge ({serviceChargePercent}%):</span>
                <span className="font-mono text-[#2D3D33]">{settings.currencySymbol}{serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-[#E3DCD1] pt-2.5 flex justify-between items-center text-sm font-extrabold text-[#2D3D33]">
              <span>Final Total Payable:</span>
              <span className="text-[#B86B3D] font-mono text-xl">{settings.currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Table status auto-release checkbox */}
          <div className="flex items-center gap-2 text-xs text-[#2D3D33]">
            <input
              type="checkbox"
              id="markAvail"
              checked={markTableAvailable}
              onChange={(e) => setMarkTableAvailable(e.target.checked)}
              className="rounded border-[#DDD5C8] text-[#B86B3D] focus:ring-[#B86B3D]"
            />
            <label htmlFor="markAvail" className="cursor-pointer font-medium">
              Mark Table #{order.tableNumber} as "Available" after completing payment
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E3DCD1] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isWhatsAppSent ? 'Resend on WhatsApp' : 'Send WhatsApp Bill'}</span>
            </button>

            <button
              onClick={() => setIsPrintReceiptOpen(true)}
              className="bg-white hover:bg-[#F5F1E8] text-[#2D3D33] border border-[#DDD5C8] font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-[#73897C] hover:text-[#2D3D33] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteOrder}
              className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Settle & Mark Paid ({settings.currencySymbol}{total.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Preview Modal */}
      {isPrintReceiptOpen && (
        <PrintableReceipt
          order={currentBilledOrder}
          settings={settings}
          onClose={() => setIsPrintReceiptOpen(false)}
          autoPrint={true}
        />
      )}
    </div>
  );
}
