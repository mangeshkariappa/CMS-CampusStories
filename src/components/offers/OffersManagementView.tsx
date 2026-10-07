import { useState, useMemo } from 'react';
import { SpecialOffer, OfferType, Order, CafeSettings } from '../../types/cafe';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Clock,
  X,
} from 'lucide-react';
import WhatsAppBroadcastModal from './WhatsAppBroadcastModal';

interface Props {
  offers: SpecialOffer[];
  orders: Order[];
  settings: CafeSettings;
  onAddOffer: (offer: SpecialOffer) => void;
  onUpdateOffer: (offer: SpecialOffer) => void;
  onDeleteOffer: (id: string) => void;
  onRecordBroadcastSent: (offerId: string, count: number) => void;
}

export default function OffersManagementView({
  offers,
  orders,
  settings,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  onRecordBroadcastSent,
}: Props) {
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [broadcastTargetOffer, setBroadcastTargetOffer] = useState<SpecialOffer | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [type, setType] = useState<OfferType>('seasonal_special');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('299');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badgeText, setBadgeText] = useState('SEASON SPECIAL');
  const [validUntil, setValidUntil] = useState('October 31, 2026');
  const [isActive, setIsActive] = useState(true);
  const [featuredOnMenu, setFeaturedOnMenu] = useState(true);

  const filteredOffers = useMemo(() => {
    if (filterType === 'all') return offers;
    return offers.filter((o) => o.type === filterType);
  }, [offers, filterType]);

  const openAddModal = () => {
    setEditingOffer(null);
    setTitle('');
    setTagline('');
    setType('seasonal_special');
    setOriginalPrice('350');
    setOfferPrice('280');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80');
    setBadgeText('SEASON SPECIAL');
    setValidUntil('This Weekend Only');
    setIsActive(true);
    setFeaturedOnMenu(true);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setTagline(offer.tagline || '');
    setType(offer.type);
    setOriginalPrice(offer.originalPrice ? offer.originalPrice.toString() : '');
    setOfferPrice(offer.offerPrice.toString());
    setDescription(offer.description);
    setImage(offer.image);
    setBadgeText(offer.badgeText);
    setValidUntil(offer.validUntil || '');
    setIsActive(offer.isActive);
    setFeaturedOnMenu(offer.featuredOnMenu);
    setIsModalOpen(true);
  };

  const handleTypeSelect = (selectedType: OfferType) => {
    setType(selectedType);
    if (!editingOffer) {
      if (selectedType === 'seasonal_special') setBadgeText('SEASON SPECIAL');
      else if (selectedType === 'chef_recommended') setBadgeText("CHEF'S PICK");
      else if (selectedType === 'combo_offer') setBadgeText('COMBO DEAL · SAVE 25%');
      else if (selectedType === 'discount_promo') setBadgeText('FLAT 20% OFF');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const offerData: SpecialOffer = {
      id: editingOffer ? editingOffer.id : `off-${Date.now().toString(36)}`,
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      type,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      offerPrice: parseFloat(offerPrice) || 0,
      description: description.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      badgeText: badgeText.trim() || 'SPECIAL OFFER',
      validUntil: validUntil.trim() || undefined,
      isActive,
      featuredOnMenu,
      createdAt: editingOffer ? editingOffer.createdAt : new Date().toISOString().split('T')[0],
      broadcastSentCount: editingOffer ? editingOffer.broadcastSentCount : 0,
    };

    if (editingOffer) {
      onUpdateOffer(offerData);
    } else {
      onAddOffer(offerData);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#B86B3D]" /> Seasonal Specials & Promotional Offers
          </h1>
          <p className="text-xs text-[#617568] mt-0.5">
            Create seasonal drinks, chef recommendations, discounted combos, and broadcast via WhatsApp to guests.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Special / Offer</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All Offers (${offers.length})` },
          { id: 'seasonal_special', label: 'Seasonal Specials' },
          { id: 'chef_recommended', label: "Chef's Recommendations" },
          { id: 'combo_offer', label: 'Combo Deals' },
          { id: 'discount_promo', label: 'Happy Hours & Promos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'bg-white border border-[#E3DCD1] text-[#617568] hover:text-[#2D3D33]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Offers */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white border border-[#E3DCD1] rounded-3xl p-16 text-center text-[#73897C] space-y-2 shadow-xs">
          <Sparkles className="w-10 h-10 mx-auto text-[#B86B3D] opacity-60" />
          <h3 className="text-base font-bold text-[#2D3D33]">No offers in this category</h3>
          <p className="text-xs text-[#73897C]">Create a seasonal specialty or combo to showcase on customer QR menus and WhatsApp!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const savings = offer.originalPrice && offer.originalPrice > offer.offerPrice ? offer.originalPrice - offer.offerPrice : 0;
            const savingsPercent = offer.originalPrice && offer.originalPrice > 0 && savings > 0 ? Math.round((savings / offer.originalPrice) * 100) : 0;

            return (
              <div
                key={offer.id}
                className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                  offer.isActive ? 'border-[#E3DCD1] hover:border-[#526B5A]/40' : 'border-[#E3DCD1] opacity-60'
                }`}
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#B86B3D] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        {offer.badgeText}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {offer.featuredOnMenu && (
                        <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-[#2D3D33] border border-[#E3DCD1] shadow-xs">
                          Table QR Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#2D3D33] leading-snug">{offer.title}</h3>
                      <div className="text-right shrink-0">
                        {offer.offerPrice > 0 ? (
                          <div className="text-base font-black text-[#B86B3D] font-mono">
                            {settings.currencySymbol}{offer.offerPrice}
                          </div>
                        ) : (
                          <div className="text-xs font-black text-[#2D3D33] uppercase">Discount Promo</div>
                        )}
                        {offer.originalPrice && offer.originalPrice > offer.offerPrice && (
                          <div className="text-[10px] text-stone-400 line-through font-mono">
                            {settings.currencySymbol}{offer.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>

                    {offer.tagline && (
                      <p className="text-xs font-semibold text-[#B86B3D] leading-tight">
                        {offer.tagline}
                      </p>
                    )}

                    <p className="text-xs text-[#617568] line-clamp-2 leading-relaxed">
                      {offer.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#73897C] pt-1">
                      {offer.validUntil && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#73897C]" /> {offer.validUntil}
                        </span>
                      )}
                      {savingsPercent > 0 && (
                        <span className="text-[#B86B3D] font-bold bg-[#FDF4EE] px-2 py-0.5 rounded-full border border-[#F6D7C3]">
                          Save {savingsPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-[#F5F1E8] border-t border-[#E3DCD1] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setBroadcastTargetOffer(offer)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Broadcast this offer to guests via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Broadcast via WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(offer)}
                      className="p-1.5 rounded-lg text-[#73897C] hover:text-[#2D3D33] hover:bg-white transition-colors cursor-pointer"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteOffer(offer.id)}
                      className="p-1.5 rounded-lg text-[#73897C] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-lg w-full p-5 text-[#2D3D33] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">
                {editingOffer ? 'Edit Special Offer' : 'Create Seasonal Special / Offer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Offer Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn Spiced Cold Brew, Weekend Brunch Duo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Tagline / Catchphrase (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Infused with organic maple syrup & spiced nutmeg cold foam"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Offer Type</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeSelect(e.target.value as OfferType)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-medium"
                  >
                    <option value="seasonal_special">Seasonal Special Item</option>
                    <option value="chef_recommended">Chef's Recommended Pairing</option>
                    <option value="combo_offer">Combo Bundle Deal</option>
                    <option value="discount_promo">Happy Hour / Percentage Promo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Badge Callout Text</label>
                  <input
                    type="text"
                    required
                    placeholder="SEASON SPECIAL, SAVE 25%"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#B86B3D] focus:outline-none focus:border-[#526B5A] font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">
                    Special Offer Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#B86B3D] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Was ₹..."
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#617568] focus:outline-none focus:border-[#526B5A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Description & Tasting Notes</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed tasting notes, pair combinations, or promotion specifics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Validity Period</label>
                  <input
                    type="text"
                    placeholder="e.g. October 31, 2026 or 4 PM - 7 PM"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-[#2D3D33] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredOnMenu}
                    onChange={(e) => setFeaturedOnMenu(e.target.checked)}
                    className="rounded border-[#DDD5C8] text-[#B86B3D] focus:ring-[#B86B3D]"
                  />
                  <span>Feature on Customer QR Table Menu</span>
                </label>

                <label className="flex items-center gap-2 text-[#2D3D33] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#DDD5C8] text-[#B86B3D] focus:ring-[#B86B3D]"
                  />
                  <span>Offer Active</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#73897C] hover:text-[#2D3D33] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Broadcast Modal */}
      {broadcastTargetOffer && (
        <WhatsAppBroadcastModal
          offer={broadcastTargetOffer}
          orders={orders}
          settings={settings}
          isOpen={Boolean(broadcastTargetOffer)}
          onClose={() => setBroadcastTargetOffer(null)}
          onRecordBroadcastSent={onRecordBroadcastSent}
        />
      )}
    </div>
  );
}
