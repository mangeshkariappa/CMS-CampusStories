import { useState } from 'react';
import { MenuItem, Category, InventoryItem, CafeSettings, DietaryType } from '../../types/cafe';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  X,
  Clock,
  Layers,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';

interface Props {
  menuItems: MenuItem[];
  categories: Category[];
  inventory: InventoryItem[];
  settings: CafeSettings;
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddCategory: (category: Category) => void;
}

export default function MenuManagementView({
  menuItems,
  categories,
  inventory,
  settings,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAddCategory,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states for Menu Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'cat-espresso');
  const [price, setPrice] = useState('250');
  const [costPrice, setCostPrice] = useState('60');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [dietary, setDietary] = useState<DietaryType>('veg');
  const [isAvailable, setIsAvailable] = useState(true);
  const [prepTime, setPrepTime] = useState('5');
  const [popular, setPopular] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [inventoryQty, setInventoryQty] = useState('0.02');
  const [itemIngredients, setItemIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  // Category modal states
  const [newCatName, setNewCatName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadMessage('Uploading image to Cloud Storage...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/storage/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data,
              contentType: file.type,
            }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            setImage(json.url);
            setUploadMessage('Image uploaded and synced to Cloud Storage successfully!');
          } else {
            setUploadMessage('Upload failed: ' + (json.message || 'Error'));
          }
        } catch {
          setUploadMessage('Network error uploading image.');
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingImage(false);
      setUploadMessage('Could not read image file.');
    }
  };

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const openAddItemModal = () => {
    setEditingItem(null);
    setName('');
    setCategory(categories[0]?.id || '');
    setPrice('250');
    setCostPrice('60');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80');
    setDietary('veg');
    setIsAvailable(true);
    setPrepTime('5');
    setPopular(false);
    setItemIngredients([]);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setCostPrice(item.costPrice.toString());
    setDescription(item.description);
    setImage(item.image);
    setDietary(item.dietary);
    setIsAvailable(item.isAvailable);
    setPrepTime(item.preparationTimeMinutes.toString());
    setPopular(Boolean(item.popular));
    setItemIngredients(item.ingredients || []);
    setIsItemModalOpen(true);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedInventoryId) return;
    const qty = parseFloat(inventoryQty) || 0.01;
    setItemIngredients((prev) => [...prev, { inventoryItemId: selectedInventoryId, quantity: qty }]);
    setSelectedInventoryId('');
  };

  const handleRemoveIngredientFromRecipe = (idx: number) => {
    setItemIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const itemData: MenuItem = {
      id: editingItem ? editingItem.id : `item-${Date.now().toString(36)}`,
      name: name.trim(),
      category,
      price: parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || 0,
      description: description.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      dietary,
      isAvailable,
      preparationTimeMinutes: parseInt(prepTime, 10) || 5,
      popular,
      ingredients: itemIngredients,
    };

    if (editingItem) {
      onUpdateMenuItem(itemData);
    } else {
      onAddMenuItem(itemData);
    }
    setIsItemModalOpen(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: `cat-${newCatName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
      name: newCatName.trim(),
      displayOrder: categories.length + 1,
    };
    onAddCategory(newCat);
    setNewCatName('');
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-[#B86B3D]" /> Menu Engineering & Pricing
          </h1>
          <p className="text-xs text-[#617568] mt-0.5">
            Configure dishes, recipes, profit margins, dietary tags, and live table availability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-[#E3DCD1] hover:border-[#526B5A] text-[#2D3D33] font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-[#73897C]" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openAddItemModal}
            className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Dish</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'bg-white border border-[#E3DCD1] text-[#617568] hover:text-[#2D3D33]'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#526B5A] text-white shadow-xs'
                  : 'bg-white border border-[#E3DCD1] text-[#617568] hover:text-[#2D3D33]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E3DCD1] rounded-2xl pl-9 pr-4 py-2 text-xs text-[#2D3D33] placeholder:text-[#73897C] focus:outline-none focus:border-[#526B5A] shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const categoryName = categories.find((c) => c.id === item.category)?.name || item.category;
          const margin = item.price > 0 ? (((item.price - item.costPrice) / item.price) * 100).toFixed(0) : '0';

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                item.isAvailable ? 'border-[#E3DCD1] hover:border-[#526B5A]/40' : 'border-[#E3DCD1] opacity-60'
              }`}
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] text-[#2D3D33] font-bold border border-[#E3DCD1] shadow-xs">
                      {categoryName}
                    </span>
                    {item.popular && (
                      <span className="px-2 py-0.5 rounded-full bg-[#B86B3D] text-[10px] text-white font-bold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" /> Bestseller
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-[#2D3D33]">{item.name}</h3>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-[#B86B3D] font-mono">
                        {settings.currencySymbol}{item.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono font-bold">
                        {margin}% margin
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#617568] line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-[#73897C] pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#73897C]" /> {item.preparationTimeMinutes} min
                    </span>
                    <span>·</span>
                    <span className="capitalize">{item.dietary}</span>
                    {item.ingredients && item.ingredients.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-[#2D3D33] font-bold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-[#B86B3D]" /> {item.ingredients.length} recipes linked
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#F5F1E8] border-t border-[#E8EFEA] flex items-center justify-between">
                <button
                  onClick={() => onUpdateMenuItem({ ...item, isAvailable: !item.isAvailable })}
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer ${
                    item.isAvailable
                      ? 'text-[#617568] hover:text-rose-600'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditItemModal(item)}
                    className="p-1.5 rounded-lg text-[#73897C] hover:text-[#2D3D33] hover:bg-white transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMenuItem(item.id)}
                    className="p-1.5 rounded-lg text-[#73897C] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-lg w-full p-5 text-[#2D3D33] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">
                {editingItem ? 'Edit Menu Dish' : 'Create New Menu Dish'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Velvet Cappuccino"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Dietary Classification</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value as DietaryType)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-medium"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="gluten-free">Gluten-Free</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Selling Price ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Cost Price ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    required
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Rich tasting notes, texture, ingredients, or artisan origin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[#2D3D33] font-bold">Dish Image (Cloud Storage Upload)</label>
                  <label className="text-[11px] font-bold text-[#B86D43] hover:text-[#A45831] flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="https://... or upload image above"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] text-xs font-mono"
                />

                {uploadMessage && (
                  <p className={`text-[10px] font-medium ${isUploadingImage ? 'text-[#B86D43]' : 'text-emerald-700'}`}>
                    {uploadMessage}
                  </p>
                )}

                {image && (
                  <div className="flex items-center gap-2 pt-1">
                    <img src={image} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-[#DDD5C8]" />
                    <span className="text-[10px] text-[#617568]">Image ready for menu display</span>
                  </div>
                )}
              </div>

              {/* Recipe Inventory Linkage */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E3DCD1] space-y-2 shadow-xs">
                <span className="font-bold text-[#2D3D33] flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#B86B3D]" /> Link Ingredients (Stock Auto-deduction)
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedInventoryId}
                    onChange={(e) => setSelectedInventoryId(e.target.value)}
                    className="flex-1 bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-2.5 py-1.5 text-[#2D3D33]"
                  >
                    <option value="">Select ingredient from stock...</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="any"
                    placeholder="Qty"
                    value={inventoryQty}
                    onChange={(e) => setInventoryQty(e.target.value)}
                    className="w-20 bg-[#F5F1E8] border border-[#DDD5C8] rounded-xl px-2.5 py-1.5 text-[#2D3D33] font-mono font-bold"
                  />

                  <button
                    type="button"
                    onClick={handleAddIngredientToRecipe}
                    className="bg-[#526B5A] hover:bg-[#43594A] text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {itemIngredients.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {itemIngredients.map((ing, idx) => {
                      const invItem = inventory.find((i) => i.id === ing.inventoryItemId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] bg-[#F5F1E8] px-3 py-1.5 rounded-lg border border-[#E3DCD1]"
                        >
                          <span>
                            {invItem?.name || ing.inventoryItemId}: <strong>{ing.quantity} {invItem?.unit}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientFromRecipe(idx)}
                            className="text-[#73897C] hover:text-rose-600 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-[#2D3D33] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                  />
                  <span>Dish In-Stock for Guests</span>
                </label>

                <label className="flex items-center gap-2 text-[#2D3D33] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="rounded border-[#DDD5C8] text-[#526B5A] focus:ring-[#526B5A]"
                  />
                  <span>Feature as Bestseller</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#617568] hover:text-[#2D3D33] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-sm w-full p-5 text-[#2D3D33] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">Create Menu Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Cold Brews, Gluten-Free Bakes"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#617568] hover:text-[#2D3D33] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
