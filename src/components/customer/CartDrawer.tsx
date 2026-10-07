import { useState, useMemo } from 'react';
import { MenuItem, OrderItem, CafeSettings, Order } from '../../types/cafe';
import { X, Trash2, Plus, Minus, Cake, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem extends OrderItem {
  image?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  tableNumber: number;
  settings: CafeSettings;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onOrderSubmitted: (order: Order) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  tableNumber,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onOrderSubmitted,
}: Props) {
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if today is the user's birthday based on DOB (month and day match)
  const isBirthday = useMemo(() => {
    if (!dob) return false;
    try {
      const parts = dob.split('-');
      if (parts.length === 3) {
        const birthMonth = parseInt(parts[1], 10);
        const birthDay = parseInt(parts[2], 10);
        const now = new Date();
        return now.getMonth() + 1 === birthMonth && now.getDate() === birthDay;
      }
    } catch {
      return false;
    }
    return false;
  }, [dob]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountPercentage = isBirthday ? settings.birthdayDiscountPercent : 0;
  const discountAmount = Number(((subtotal * discountPercentage) / 100).toFixed(2));
  const discountedSubtotal = subtotal - discountAmount;

  const taxAmount = Number(((discountedSubtotal * settings.defaultTaxPercent) / 100).toFixed(2));
  const serviceChargeAmount = Number(
    ((discountedSubtotal * settings.defaultServiceChargePercent) / 100).toFixed(2)
  );
  const total = Number((discountedSubtotal + taxAmount + serviceChargeAmount).toFixed(2));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Your order bag is empty. Add dishes to continue.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    if (!dob) {
      setErrorMsg('Please select your Date of Birth.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isBirthday) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      const newOrder: Order = {
        id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
        orderNumber: `BP-${new Date().getFullYear().toString().substr(-2)}${(new Date().getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        tableNumber,
        customer: {
          name: customerName.trim(),
          phone: cleanPhone,
          dob,
          isBirthdayToday: isBirthday,
        },
        items: cart.map((ci) => ({
          id: ci.id,
          menuItemId: ci.menuItemId,
          name: ci.name,
          price: ci.price,
          quantity: ci.quantity,
          customization: ci.customization,
        })),
        status: 'pending',
        paymentStatus: 'unpaid',
        subtotal,
        discountPercentage,
        discountAmount,
        discountReason: isBirthday ? `Birthday Special (${discountPercentage}%)` : undefined,
        taxPercentage: settings.defaultTaxPercent,
        taxAmount,
        serviceChargePercentage: settings.defaultServiceChargePercent,
        serviceChargeAmount,
        total,
        notes: orderNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onOrderSubmitted(newOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F5F1E8] border-l border-[#E3DCD1] text-[#2D3D33] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-[#E3DCD1] flex items-center justify-between bg-white">
            <div>
              <h2 className="text-base font-bold text-[#2D3D33] font-serif">Your Table Order</h2>
              <div className="flex items-center gap-2 text-xs text-[#617568] mt-0.5">
                <span className="text-[#B86B3D] font-bold">Table #{tableNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#F5F1E8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-12 text-[#73897C] text-sm">
                <p>Your bag is empty.</p>
                <p className="text-xs text-[#617568] mt-1">Add items from the menu to start your order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#617568]">Items in Bag</div>
                {cart.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] flex items-start gap-3 shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#2D3D33] truncate">{item.name}</h4>
                        <span className="text-xs font-extrabold text-[#2D3D33]">
                          {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {item.customization && (
                        <p className="text-[11px] text-[#617568] mt-0.5 line-clamp-1">
                          {[item.customization.milk, item.customization.sweetness, item.customization.notes]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-[#DDD5C8] rounded-lg bg-[#F5F1E8]">
                          <button
                            onClick={() => onUpdateQuantity(idx, -1)}
                            className="p-1 text-[#617568] hover:text-[#2D3D33] hover:bg-stone-200 rounded cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#2D3D33]">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(idx, 1)}
                            className="p-1 text-[#617568] hover:text-[#2D3D33] hover:bg-stone-200 rounded cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-[#73897C] hover:text-rose-600 p-1 text-xs transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mandatory Customer Info Form */}
            {cart.length > 0 && (
              <form id="orderForm" onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#E3DCD1]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2D3D33]">
                    Customer Information
                  </span>
                  <span className="text-[11px] text-[#617568] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp bill & perks
                  </span>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1">
                    Your Name <span className="text-[#B86B3D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] text-xs focus:outline-none focus:border-[#526B5A] focus:ring-1 focus:ring-[#526B5A] transition-colors"
                  />
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1">
                    WhatsApp Phone Number <span className="text-[#B86B3D]">*</span>
                  </label>
                  <div className="flex items-center rounded-xl bg-white border border-[#DDD5C8] overflow-hidden focus-within:border-[#526B5A] focus-within:ring-1 focus-within:ring-[#526B5A] transition-colors">
                    <span className="px-2.5 py-2 text-xs font-mono text-[#617568] border-r border-[#DDD5C8] bg-[#F5F1E8]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9820012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-[#2D3D33] text-xs focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#617568] mt-1">Your bill and order updates will be sent here.</p>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-[#2D3D33] mb-1">
                    Date of Birth (DOB) <span className="text-[#B86B3D]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] text-xs focus:outline-none focus:border-[#526B5A] focus:ring-1 focus:ring-[#526B5A] transition-colors cursor-pointer"
                  />
                  {isBirthday ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#FDF4EE] border border-[#F6D7C3] text-[#B86B3D] text-xs flex items-center gap-2">
                      <Cake className="w-4 h-4 text-[#B86B3D] shrink-0" />
                      <span>🎉 <strong>Happy Birthday!</strong> A 15% birthday celebration discount has been unlocked for your order!</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#617568] mt-1">
                      Enjoy a special 15% discount on your birthday celebration!
                    </p>
                  )}
                </div>

                {/* Optional Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-[#617568] mb-1">
                    Note for Barista / Chef (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please bring water glasses, extra napkins"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] text-xs focus:outline-none focus:border-[#526B5A] focus:ring-1 focus:ring-[#526B5A]"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {errorMsg}
                  </div>
                )}
              </form>
            )}

            {/* Bill Summary Preview */}
            {cart.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-[#E3DCD1] space-y-2 text-xs shadow-xs">
                <div className="flex justify-between text-[#617568]">
                  <span>Subtotal</span>
                  <span className="font-mono">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#B86B3D] font-bold">
                    <span>Birthday Promo ({discountPercentage}%)</span>
                    <span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#617568]">
                  <span>GST ({settings.defaultTaxPercent}%)</span>
                  <span className="font-mono">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>

                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-[#617568]">
                    <span>Service Charge ({settings.defaultServiceChargePercent}%)</span>
                    <span className="font-mono">{settings.currencySymbol}{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-[#E3DCD1] pt-2.5 flex justify-between text-sm font-black text-[#2D3D33]">
                  <span>Total Payable</span>
                  <span className="text-[#B86B3D]">{settings.currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA (10% Coffee Orange Primary Button) */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#E3DCD1] bg-white">
              <button
                type="submit"
                form="orderForm"
                disabled={isSubmitting}
                className="w-full bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Place Table #{tableNumber} Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
