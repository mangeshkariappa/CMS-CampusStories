import { useState, useMemo } from 'react';
import { MenuItem, Category, CafeSettings, OrderItem, Order, SpecialOffer } from '../../types/cafe';
import { Search, ShoppingBag, Sparkles, Coffee, Clock, Table as TableIcon, Plus } from 'lucide-react';
import ItemCustomizerModal from './ItemCustomizerModal';
import CartDrawer from './CartDrawer';
import OrderConfirmationModal from './OrderConfirmationModal';

interface Props {
  settings: CafeSettings;
  categories: Category[];
  menuItems: MenuItem[];
  offers: SpecialOffer[];
  tableNumber: number;
  onTableChange: (tableNumber: number) => void;
  onPlaceOrder: (order: Order) => void;
}

export default function CustomerOrderingView({
  settings,
  categories,
  menuItems,
  offers,
  tableNumber,
  onTableChange,
  onPlaceOrder,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'vegan'>('all');
  const [cart, setCart] = useState<(OrderItem & { image?: string })[]>([]);
  const [activeItemForCustomizer, setActiveItemForCustomizer] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (dietaryFilter === 'veg' && item.dietary !== 'veg' && item.dietary !== 'vegan') return false;
      if (dietaryFilter === 'vegan' && item.dietary !== 'vegan') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    customization?: { milk?: string; sweetness?: string; notes?: string }
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.menuItemId === item.id &&
          ci.customization?.milk === customization?.milk &&
          ci.customization?.sweetness === customization?.sweetness &&
          ci.customization?.notes === customization?.notes
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      return [
        ...prev,
        {
          id: `ci-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          customization,
          image: item.image,
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;

      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = { ...target, quantity: newQty };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderSubmitted = (order: Order) => {
    onPlaceOrder(order);
    setCart([]);
    setIsCartOpen(false);
    setConfirmedOrder(order);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const featuredOffers = useMemo(() => {
    return offers.filter((o) => o.isActive && o.featuredOnMenu);
  }, [offers]);

  const handleAddOfferToCart = (offer: SpecialOffer) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === offer.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === offer.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `off-item-${Date.now().toString(36)}`,
          menuItemId: offer.id,
          name: offer.title,
          price: offer.offerPrice > 0 ? offer.offerPrice : 0,
          quantity: 1,
          customization: {
            notes: `Offer Promo: ${offer.badgeText}`,
          },
          image: offer.image,
        },
      ];
    });
  };

  return (
    <div className="min-h-full bg-[#F5F1E8] text-[#2D3D33] pb-28">
      {/* Top Cafe Branding Bar */}
      <div className="border-b border-[#E3DCD1] bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
              <Coffee className="w-5 h-5 text-[#F5F1E8]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#2D3D33] tracking-tight leading-snug font-serif">
                {settings.cafeName}
              </h1>
              <p className="text-[11px] text-[#6E7A72]">{settings.tagline}</p>
            </div>
          </div>

          {/* Table Switcher Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE7DC] border border-[#DDD5C7] text-xs shadow-xs text-[#2D3D33]">
            <TableIcon className="w-3.5 h-3.5 text-[#B86B3D]" />
            <span className="font-bold">Table #{tableNumber}</span>
            <select
              aria-label="Select table number"
              value={tableNumber}
              onChange={(e) => onTableChange(Number(e.target.value))}
              className="bg-transparent text-[#2D3D33] text-xs focus:outline-none cursor-pointer hover:text-[#B86B3D] font-semibold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={num} className="bg-white text-[#2D3D33]">
                  Table {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Promo Bar (10% Coffee Orange Accent) */}
        <div className="bg-[#FBF2EC] border-t border-[#F2DACB] px-4 py-1.5 text-center text-xs text-[#B86B3D] flex items-center justify-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#B86B3D]" />
          <span>Celebrating today? Enter your DOB at checkout for a <strong>15% Birthday Treat!</strong></span>
        </div>
      </div>

      {/* Main Content Container (60% Soft Cream Background) */}
      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-6">
        {/* Seasonal Specials & Chef Offers Showcase */}
        {featuredOffers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B86B3D]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[#2D3D33]">
                  Seasonal Specials & Chef's Pairings
                </h2>
              </div>
              <span className="text-[11px] text-[#6E7A72] font-medium">Limited Time Only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {featuredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border border-[#E3DCD1] rounded-3xl p-3.5 flex gap-3 shadow-xs hover:border-[#526B5A]/50 transition-all group"
                >
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-stone-100">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1 left-1">
                      <span className="bg-[#B86B3D] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                        {offer.badgeText.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-[#2D3D33] truncate leading-snug">
                        {offer.title}
                      </h3>
                      <p className="text-[11px] text-[#6E7A72] line-clamp-1 mt-0.5">
                        {offer.tagline || offer.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#EDE7DC]">
                      <div>
                        {offer.offerPrice > 0 ? (
                          <span className="font-bold text-xs text-[#B86B3D] font-mono">
                            {settings.currencySymbol}{offer.offerPrice}
                          </span>
                        ) : (
                          <span className="font-bold text-[10px] text-[#2D3D33] uppercase">Promo Special</span>
                        )}
                        {offer.originalPrice && offer.originalPrice > offer.offerPrice && (
                          <span className="text-[10px] text-stone-400 line-through font-mono ml-1">
                            {settings.currencySymbol}{offer.originalPrice}
                          </span>
                        )}
                      </div>

                      {offer.offerPrice > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddOfferToCart(offer)}
                          className="bg-[#B86B3D] hover:bg-[#A35C31] text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>ADD</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Dietary Segmented Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coffee, bakery, breakfast, dessert..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E3DCD1] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#2D3D33] placeholder:text-[#8A968E] focus:outline-none focus:border-[#526B5A] focus:ring-1 focus:ring-[#526B5A] transition-colors shadow-xs"
            />
          </div>

          {/* Dietary Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E3DCD1] rounded-2xl shrink-0 shadow-xs">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                dietaryFilter === 'all'
                  ? 'bg-[#526B5A] text-white shadow-xs'
                  : 'text-[#6E7A72] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
                dietaryFilter === 'veg'
                  ? 'bg-[#43594A] text-white shadow-xs'
                  : 'text-[#6E7A72] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter('vegan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                dietaryFilter === 'vegan'
                  ? 'bg-[#B86B3D] text-white shadow-xs'
                  : 'text-[#6E7A72] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
              }`}
            >
              Vegan
            </button>
          </div>
        </div>

        {/* Category Horizontal Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#526B5A] border-[#526B5A] text-white shadow-xs'
                : 'bg-white border-[#DDD5C7] text-[#6E7A72] hover:border-[#526B5A] hover:text-[#2D3D33]'
            }`}
          >
            All Categories ({menuItems.filter((i) => i.isAvailable).length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.category === cat.id && i.isAvailable).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#526B5A] border-[#526B5A] text-white shadow-xs'
                    : 'bg-white border-[#DDD5C7] text-[#6E7A72] hover:border-[#526B5A] hover:text-[#2D3D33]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-[#8A968E] space-y-2">
            <p className="text-sm font-medium">No dishes match your filter.</p>
            <p className="text-xs text-[#8A968E]">Try clearing search or dietary toggles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E3DCD1] rounded-3xl overflow-hidden hover:border-[#526B5A]/40 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
              >
                <div className="p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* Dietary dot indicator */}
                      <span
                        className={`w-3 h-3 rounded-xs flex items-center justify-center border text-[8px] font-bold ${
                          item.dietary === 'veg'
                            ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                            : item.dietary === 'vegan'
                            ? 'border-green-600 text-green-600 bg-green-50'
                            : 'border-rose-600 text-rose-600 bg-rose-50'
                        }`}
                        title={item.dietary}
                      >
                        ●
                      </span>

                      {item.popular && (
                        <span className="text-[10px] text-[#B86B3D] bg-[#FBF2EC] border border-[#F2DACB] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Bestseller
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#2D3D33] group-hover:text-[#B86B3D] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#6E7A72] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#8A968E] mt-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#8A968E]" /> {item.preparationTimeMinutes}m prep
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-stone-100 shadow-xs">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Footer with Price and Coffee Orange 10% CTA */}
                <div className="px-4 py-3 bg-[#F5F1E8] border-t border-[#E3DCD1] flex items-center justify-between">
                  <div className="text-base font-extrabold text-[#2D3D33]">
                    {settings.currencySymbol}{item.price.toFixed(2)}
                  </div>

                  <button
                    onClick={() => setActiveItemForCustomizer(item)}
                    className="bg-[#B86B3D] hover:bg-[#A35C31] active:scale-95 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ADD</span>
                    <span className="text-xs font-normal opacity-90">+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Floating Bottom Cart Bar (Coffee Orange CTA) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-5 inset-x-4 max-w-md mx-auto z-30 animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#B86B3D] hover:bg-[#A35C31] text-white font-bold p-4 rounded-3xl shadow-xl flex items-center justify-between transition-all active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-[#B86B3D] flex items-center justify-center text-xs font-extrabold shadow-xs">
                {totalCartCount}
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">View Order Bag</p>
                <p className="text-sm font-extrabold">Table #{tableNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">
                {settings.currencySymbol}{totalCartAmount.toFixed(2)}
              </span>
              <ShoppingBag className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      {activeItemForCustomizer && (
        <ItemCustomizerModal
          item={activeItemForCustomizer}
          currencySymbol={settings.currencySymbol}
          onClose={() => setActiveItemForCustomizer(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        tableNumber={tableNumber}
        settings={settings}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOrderSubmitted={handleOrderSubmitted}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        settings={settings}
        onClose={() => setConfirmedOrder(null)}
      />
    </div>
  );
}
