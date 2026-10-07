import { useEffect } from 'react';
import { Order, CafeSettings } from '../../types/cafe';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface Props {
  order: Order;
  settings: CafeSettings;
  onClose: () => void;
  autoPrint?: boolean;
}

export default function PrintableReceipt({ order, settings, onClose, autoPrint = false }: Props) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white">
      {/* On-screen modal wrapper (hidden in print) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-4 text-stone-100 shadow-2xl flex flex-col max-h-[92vh] print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F1BA9B]">
            <Printer className="w-4 h-4 text-[#B86B3D]" /> Thermal POS Print Preview (80mm)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Now
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="overflow-y-auto p-4 my-2 bg-white text-stone-900 font-mono text-xs rounded-xl shadow-inner print:p-0 print:shadow-none print:m-0 print:rounded-none">
          {/* Cafe Header */}
          <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-stone-300">
            <h2 className="text-base font-black tracking-wider uppercase">{settings.cafeName}</h2>
            <p className="text-[10px] text-stone-600">{settings.tagline}</p>
            <p className="text-[9px] text-stone-500">{settings.address}</p>
            <p className="text-[9px] text-stone-500">Ph: {settings.phone}</p>
            {settings.gstNumber && (
              <p className="text-[9px] font-bold text-stone-700">GSTIN: {settings.gstNumber}</p>
            )}
            {settings.fssaiNumber && (
              <p className="text-[9px] text-stone-500">FSSAI Lic: {settings.fssaiNumber}</p>
            )}
          </div>

          {/* Bill Meta */}
          <div className="py-2 border-b border-dashed border-stone-300 space-y-0.5 text-[10px]">
            <div className="flex justify-between font-bold">
              <span>ORDER: {order.orderNumber}</span>
              <span>TABLE: {order.tableNumber}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Date: {formattedDate}</span>
              <span>Time: {formattedTime}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Guest: {order.customer.name}</span>
              <span>WA: {order.customer.phone}</span>
            </div>
            {order.customer.dob && (
              <div className="flex justify-between text-stone-600">
                <span>DOB: {order.customer.dob}</span>
                {order.customer.isBirthdayToday && (
                  <span className="font-bold text-amber-700">🎂 BDAY GUEST!</span>
                )}
              </div>
            )}
            {order.billedBy && (
              <div className="text-stone-500">Cashier: {order.billedBy}</div>
            )}
          </div>

          {/* Items Header */}
          <div className="py-1.5 border-b border-stone-300 font-bold flex justify-between text-[10px]">
            <span className="w-1/2">ITEM</span>
            <span className="w-1/6 text-center">QTY</span>
            <span className="w-1/3 text-right">AMOUNT</span>
          </div>

          {/* Items List */}
          <div className="py-2 space-y-1.5 border-b border-dashed border-stone-300 text-[10px]">
            {order.items.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-start">
                  <span className="w-1/2 font-semibold truncate">{item.name}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/3 text-right">
                    {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                {item.customization && (
                  <div className="text-[9px] text-stone-500 pl-2">
                    {[item.customization.milk, item.customization.sweetness, item.customization.notes]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="py-2 space-y-1 border-b border-stone-400 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{settings.currencySymbol}{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-stone-700 font-medium">
                <span>Discount ({order.discountPercentage}%):</span>
                <span>-{settings.currencySymbol}{order.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {order.taxAmount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>GST ({order.taxPercentage}%):</span>
                <span>{settings.currencySymbol}{order.taxAmount.toFixed(2)}</span>
              </div>
            )}

            {order.serviceChargeAmount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Service Charge ({order.serviceChargePercentage}%):</span>
                <span>{settings.currencySymbol}{order.serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between pt-1 border-t border-stone-800 text-xs font-black">
              <span>NET TOTAL:</span>
              <span>{settings.currencySymbol}{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status & Footer */}
          <div className="pt-2 text-center space-y-1 text-[9px] text-stone-600">
            <div className="font-bold text-[10px] text-stone-800 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
              <span>STATUS: {order.paymentStatus.toUpperCase()} ({order.paymentMethod?.toUpperCase() || 'CASH'})</span>
            </div>

            <p className="mt-1">*** THANK YOU FOR VISITING ***</p>
            <p>Visit again soon for fresh roasts & acoustic evenings!</p>
            <div className="pt-2 font-mono text-[8px] text-stone-400">
              Generated by BrewPulse POS · Digital & Contactless Invoicing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
