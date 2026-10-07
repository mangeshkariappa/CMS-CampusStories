import { Order, CafeSettings } from '../../types/cafe';
import { CheckCircle2, MessageCircle, Clock, Utensils, Sparkles, X } from 'lucide-react';
import { generateCustomerOrderSummary } from '../../lib/whatsapp';

interface Props {
  order: Order | null;
  settings: CafeSettings;
  onClose: () => void;
  onViewBillPreview?: () => void;
}

export default function OrderConfirmationModal({ order, settings, onClose }: Props) {
  if (!order) return null;

  const handleWhatsAppSend = () => {
    const text = generateCustomerOrderSummary(order, settings);
    const cleanPhone = order.customer.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-md w-full p-6 text-[#2D3D33] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#E8EFEA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <h3 className="text-xl font-extrabold text-[#2D3D33] tracking-tight font-serif">Order Placed Successfully!</h3>
          <p className="text-xs text-[#617568] mt-1">
            Order <span className="font-mono text-[#B86B3D] font-bold">{order.orderNumber}</span> · Table #{order.tableNumber}
          </p>
        </div>

        {/* Live Status Tracker */}
        <div className="my-5 p-4 rounded-2xl bg-white border border-[#E3DCD1] space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#617568] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#B86B3D]" /> Prep Time
            </span>
            <span className="text-[#2D3D33] font-bold">~8 - 12 mins</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#617568] flex items-center gap-1.5 font-medium">
              <Utensils className="w-3.5 h-3.5 text-[#B86B3D]" /> Kitchen Status
            </span>
            <span className="text-[#2D3D33] font-bold capitalize flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B86B3D] animate-ping inline-block" />
              {order.status === 'pending' ? 'Received & Queued' : order.status}
            </span>
          </div>

          {order.customer.isBirthdayToday && (
            <div className="pt-2 border-t border-[#E3DCD1] text-xs text-[#B86B3D] flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-[#B86B3D] shrink-0" />
              <span>15% Birthday Treat discount has been applied to this bill!</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleWhatsAppSend}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open WhatsApp Ticket & Updates</span>
          </button>

          <button
            onClick={onClose}
            className="w-full bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            Back to Digital Menu
          </button>
        </div>
      </div>
    </div>
  );
}
