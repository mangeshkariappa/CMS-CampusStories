import { useState } from 'react';
import { MenuItem } from '../../types/cafe';
import { X, Plus, Minus, Coffee, Sparkles } from 'lucide-react';

interface Props {
  item: MenuItem;
  currencySymbol: string;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, customization?: { milk?: string; sweetness?: string; notes?: string }) => void;
}

export default function ItemCustomizerModal({ item, currencySymbol, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [milk, setMilk] = useState('Standard / Whole Milk');
  const [sweetness, setSweetness] = useState('Regular (100%)');
  const [notes, setNotes] = useState('');

  const isBeverage = item.category.includes('espresso') || item.category.includes('coldbrew') || item.category.includes('tea');

  const handleAdd = () => {
    onAddToCart(item, quantity, {
      milk: isBeverage ? milk : undefined,
      sweetness: isBeverage ? sweetness : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E3DCD1] text-[#2D3D33] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-48 w-full shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-xl font-bold tracking-tight">{item.name}</h3>
            <p className="text-[#F1BA9B] font-extrabold text-lg">{currencySymbol}{item.price}</p>
          </div>
        </div>

        {/* Content (Soft Cream) */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm bg-[#F5F1E8]">
          <p className="text-[#617568] leading-relaxed text-xs">{item.description}</p>

          {isBeverage && (
            <>
              {/* Milk Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#2D3D33] flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-[#B86B3D]" /> Milk Choice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Standard / Whole Milk', 'Oat Milk (+₹40)', 'Almond Milk (+₹40)', 'No Milk (Black)'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMilk(m)}
                      className={`py-2 px-3 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                        milk === m
                          ? 'border-[#B86B3D] bg-[#FDF4EE] text-[#B86B3D] font-bold shadow-xs'
                          : 'border-[#DDD5C8] bg-white text-[#2D3D33] hover:border-[#526B5A]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#2D3D33] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B86B3D]" /> Sweetness Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Sugar-Free', 'Less Sweet (50%)', 'Regular (100%)'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSweetness(s)}
                      className={`py-2 px-2 text-center text-xs rounded-xl border transition-all cursor-pointer ${
                        sweetness === s
                          ? 'border-[#B86B3D] bg-[#FDF4EE] text-[#B86B3D] font-bold shadow-xs'
                          : 'border-[#DDD5C8] bg-white text-[#2D3D33] hover:border-[#526B5A]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2D3D33]">
              Kitchen Instructions / Allergies (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. extra hot, no cinnamon, less ice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] text-xs focus:outline-none focus:border-[#526B5A] focus:ring-1 focus:ring-[#526B5A]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3DCD1] bg-white flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border border-[#DDD5C8] rounded-xl bg-[#F5F1E8] overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-[#617568] hover:text-[#2D3D33] hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-[#2D3D33]">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-[#617568] hover:text-[#2D3D33] hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Primary CTA (10% Coffee Orange) */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Add to Order</span>
            <span>·</span>
            <span>{currencySymbol}{(item.price * quantity).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
