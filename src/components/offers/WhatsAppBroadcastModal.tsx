import { useState, useMemo } from 'react';
import { SpecialOffer, Order, CafeSettings } from '../../types/cafe';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Users,
  Smartphone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  generateWhatsAppOfferBroadcastText,
  getWhatsAppOfferBroadcastLink,
  sanitizeWhatsAppPhone,
} from '../../lib/whatsapp';

interface Props {
  offer: SpecialOffer;
  orders: Order[];
  settings: CafeSettings;
  isOpen: boolean;
  onClose: () => void;
  onRecordBroadcastSent: (offerId: string, count: number) => void;
}

export default function WhatsAppBroadcastModal({
  offer,
  orders,
  settings,
  isOpen,
  onClose,
  onRecordBroadcastSent,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [isBulkBroadcasting, setIsBulkBroadcasting] = useState(false);
  const [bulkBroadcastComplete, setBulkBroadcastComplete] = useState(false);

  // Extract unique customers from prior table orders
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; lastOrderDate: string; ordersCount: number }>();
    orders.forEach((o) => {
      const cleanPhone = sanitizeWhatsAppPhone(o.customer.phone);
      if (cleanPhone.length >= 10) {
        if (!map.has(cleanPhone)) {
          map.set(cleanPhone, {
            name: o.customer.name,
            phone: cleanPhone,
            lastOrderDate: o.createdAt,
            ordersCount: 1,
          });
        } else {
          const existing = map.get(cleanPhone)!;
          existing.ordersCount += 1;
        }
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    if (!searchCustomer.trim()) return uniqueCustomers;
    const q = searchCustomer.toLowerCase();
    return uniqueCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [uniqueCustomers, searchCustomer]);

  if (!isOpen) return null;

  const sampleMessage = generateWhatsAppOfferBroadcastText(
    offer,
    settings,
    customName || (uniqueCustomers[0]?.name ?? 'Guest')
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToCustomer = (phone: string, name: string) => {
    const link = getWhatsAppOfferBroadcastLink(offer, phone, settings, name);
    window.open(link, '_blank');
    setSentMap((prev) => ({ ...prev, [phone]: true }));
    onRecordBroadcastSent(offer.id, 1);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim()) return;
    handleSendToCustomer(customPhone.trim(), customName.trim() || 'Guest');
  };

  const handleSimulateBulkBroadcast = () => {
    setIsBulkBroadcasting(true);
    setTimeout(() => {
      const allSent: Record<string, boolean> = {};
      uniqueCustomers.forEach((c) => {
        allSent[c.phone] = true;
      });
      setSentMap(allSent);
      setIsBulkBroadcasting(false);
      setBulkBroadcastComplete(true);
      onRecordBroadcastSent(offer.id, uniqueCustomers.length);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-3xl w-full text-[#2D3D33] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3DCD1] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2D3D33] font-serif">Broadcast Offer via WhatsApp</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDF4EE] text-[#B86B3D] border border-[#F6D7C3]">
                  {offer.badgeText}
                </span>
              </div>
              <p className="text-xs text-[#617568]">Reach customer guest list with special seasonal promotions</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-[#73897C] hover:text-[#2D3D33] rounded-lg hover:bg-[#F5F1E8] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Offer Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] flex items-center gap-4 shadow-xs">
            <img
              src={offer.image}
              alt={offer.title}
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-[#2D3D33] truncate">{offer.title}</h3>
              <p className="text-xs text-[#617568] line-clamp-1">{offer.tagline || offer.description}</p>
              <div className="flex items-center gap-3 text-[11px] mt-1">
                {offer.offerPrice > 0 && (
                  <span className="font-mono font-bold text-[#B86B3D]">
                    Price: {settings.currencySymbol}{offer.offerPrice}
                    {offer.originalPrice && offer.originalPrice > offer.offerPrice && (
                      <span className="text-stone-400 line-through ml-1 font-normal font-mono">
                        {settings.currencySymbol}{offer.originalPrice}
                      </span>
                    )}
                  </span>
                )}
                {offer.validUntil && (
                  <span className="text-[#73897C]">• Valid: {offer.validUntil}</span>
                )}
                <span className="text-emerald-700 font-bold">• {offer.broadcastSentCount || 0} already broadcasted</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2D3D33] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>WhatsApp Message Preview (Rich Markdown)</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="bg-white hover:bg-[#F5F1E8] text-[#2D3D33] border border-[#DDD5C8] font-bold px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Text!' : 'Copy Template'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#E8EFEA] border border-[#DDD5C8] text-[#2D3D33] font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {sampleMessage}
            </div>
          </div>

          {/* Broadcast Options: Customer Guest List & Direct Send */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Left: Customer Guest List */}
            <div className="space-y-3 bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#2D3D33] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B86B3D]" />
                  <span>Cafe Guest List ({uniqueCustomers.length})</span>
                </div>
                <button
                  onClick={handleSimulateBulkBroadcast}
                  disabled={isBulkBroadcasting || uniqueCustomers.length === 0}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  title="Simulate dispatch to all registered guest phone numbers"
                >
                  <Send className="w-3 h-3" />
                  <span>{isBulkBroadcasting ? 'Broadcasting...' : 'Bulk Send to All'}</span>
                </button>
              </div>

              {bulkBroadcastComplete && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Successfully marked broadcast dispatched to all {uniqueCustomers.length} guests!</span>
                </div>
              )}

              {/* Search customer */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#73897C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest by name or phone..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#2D3D33] placeholder:text-[#73897C] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredCustomers.length === 0 ? (
                  <p className="text-[#73897C] text-center py-6 text-[11px]">
                    No past guests found. Guests are saved when they order at tables.
                  </p>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSent = Boolean(sentMap[cust.phone]);

                    return (
                      <div
                        key={cust.phone}
                        className="p-2 rounded-xl bg-[#F5F1E8] border border-[#E3DCD1] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#2D3D33] truncate leading-tight">{cust.name}</p>
                          <p className="text-[10px] text-[#617568] font-mono">+{cust.phone}</p>
                        </div>

                        <button
                          onClick={() => handleSendToCustomer(cust.phone, cust.name)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isSent ? 'Sent ✅' : 'Send'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Custom Recipient / Test */}
            <div className="space-y-3 bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="font-bold text-[#2D3D33] flex items-center gap-1.5 mb-2">
                  <Send className="w-4 h-4 text-[#B86B3D]" />
                  <span>Send Test / Custom Broadcast</span>
                </div>
                <p className="text-[#617568] text-[11px] mb-3">
                  Send to any phone number or test on your own WhatsApp account before broadcasting to guests.
                </p>

                <form onSubmit={handleCustomSend} className="space-y-2.5">
                  <div>
                    <label className="block text-[#2D3D33] font-bold mb-1">Guest Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. VIP Member"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-3 py-1.5 text-[#2D3D33] text-xs focus:outline-none focus:border-[#526B5A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#2D3D33] font-bold mb-1">WhatsApp Phone Number</label>
                    <div className="flex items-center rounded-xl bg-[#F5F1E8] border border-[#DDD5C8] overflow-hidden">
                      <span className="px-2.5 py-1.5 text-xs font-mono text-[#73897C] bg-[#E8EFEA] border-r border-[#DDD5C8]">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="9820012345"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 text-[#2D3D33] text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer mt-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Launch WhatsApp Message</span>
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] text-[10px] text-[#73897C] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero monthly charges. Direct WhatsApp Click-to-Chat standard API.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3DCD1] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#526B5A] hover:bg-[#43594A] text-white font-bold px-5 py-2 rounded-2xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
