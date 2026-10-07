import { useState, useMemo } from 'react';
import { InventoryItem, CafeSettings } from '../../types/cafe';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  MessageCircle,
  Search,
  Trash2,
  Edit2,
  DollarSign,
  TrendingDown,
  X,
} from 'lucide-react';
import { getSupplierWhatsAppLink } from '../../lib/whatsapp';

interface Props {
  inventory: InventoryItem[];
  settings: CafeSettings;
  onAddInventoryItem: (item: InventoryItem) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onAdjustStock: (id: string, amount: number) => void;
  onDeleteInventoryItem: (id: string) => void;
}

export default function InventoryView({
  inventory,
  settings,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onAdjustStock,
  onDeleteInventoryItem,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [currentStock, setCurrentStock] = useState('10');
  const [unit, setUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('100');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  // Statistics
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.minThreshold);
  }, [inventory]);

  const totalInventoryValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0);
  }, [inventory]);

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.supplierName?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [inventory, categoryFilter, searchQuery]);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Coffee');
    setCurrentStock('10');
    setUnit('kg');
    setMinThreshold('5');
    setCostPerUnit('100');
    setSupplierName('');
    setSupplierPhone('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setCurrentStock(item.currentStock.toString());
    setUnit(item.unit);
    setMinThreshold(item.minThreshold.toString());
    setCostPerUnit(item.costPerUnit.toString());
    setSupplierName(item.supplierName || '');
    setSupplierPhone(item.supplierPhone || '');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      onUpdateInventoryItem({
        ...editingItem,
        name: name.trim(),
        category,
        currentStock: parseFloat(currentStock) || 0,
        unit,
        minThreshold: parseFloat(minThreshold) || 0,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplierName: supplierName.trim() || undefined,
        supplierPhone: supplierPhone.trim() || undefined,
      });
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now().toString(36)}`,
        name: name.trim(),
        category,
        currentStock: parseFloat(currentStock) || 0,
        unit,
        minThreshold: parseFloat(minThreshold) || 0,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplierName: supplierName.trim() || undefined,
        supplierPhone: supplierPhone.trim() || undefined,
        lastRestockedAt: new Date().toISOString().split('T')[0],
      };
      onAddInventoryItem(newItem);
    }

    setIsAddModalOpen(false);
  };

  const handleReorderWhatsApp = (item: InventoryItem) => {
    const recommendedReorder = Math.max(10, item.minThreshold * 2);
    const link = getSupplierWhatsAppLink(item, recommendedReorder, settings);
    window.open(link, '_blank');
  };

  const uniqueCategories = Array.from(new Set(inventory.map((i) => i.category)));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
            <Package className="w-6 h-6 text-[#B86B3D]" /> Cafe Inventory & Stock Control
          </h1>
          <p className="text-xs text-[#617568] mt-0.5">
            Auto-deducted on table orders, threshold alerts, and direct supplier WhatsApp reorders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Total Inventory Value</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {settings.currencySymbol}{totalInventoryValuation.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">{inventory.length} tracked items</p>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-black font-mono ${lowStockItems.length > 0 ? 'text-rose-700' : 'text-[#2D3D33]'}`}>
            {lowStockItems.length}
          </div>
          <p className="text-[11px] text-[#73897C] mt-1">Below minimum threshold</p>
        </div>

        <div className="bg-white border border-[#E3DCD1] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#617568] text-xs mb-1 font-medium">
            <span>Recipe Auto-Deductions</span>
            <TrendingDown className="w-4 h-4 text-[#526B5A]" />
          </div>
          <div className="text-2xl font-black text-[#2D3D33]">Active</div>
          <p className="text-[11px] text-[#73897C] mt-1">Beans, milk & bakes sync live</p>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FDF4EE] border border-[#F6D7C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B86B3D] shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-950">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running critically low!
              </p>
              <p className="text-[11px] text-[#B86B3D]">
                {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit} left)`).join(', ')}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-[#617568] font-medium">
            Click "Reorder via WhatsApp" below to message supplier.
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'bg-white border border-[#E3DCD1] text-[#617568] hover:text-[#2D3D33]'
            }`}
          >
            All Items
          </button>
          {uniqueCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === c
                  ? 'bg-[#526B5A] text-white shadow-xs'
                  : 'bg-white border border-[#E3DCD1] text-[#617568] hover:text-[#2D3D33]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#73897C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E3DCD1] rounded-2xl pl-9 pr-4 py-2 text-xs text-[#2D3D33] placeholder:text-[#73897C] focus:outline-none focus:border-[#526B5A] shadow-xs"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#E3DCD1] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2D3D33]">
            <thead className="bg-[#E8EFEA] text-[#2D3D33] font-bold border-b border-[#E3DCD1] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Min. Threshold</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Supplier & WhatsApp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EFEA]">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;

                return (
                  <tr key={item.id} className="hover:bg-[#F5F1E8] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2D3D33]">{item.name}</div>
                      <div className="text-[10px] text-[#617568]">{item.category}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isLow ? 'text-rose-700' : 'text-[#2D3D33]'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>

                        {/* Quick stock adjustments */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onAdjustStock(item.id, -1)}
                            className="p-1 rounded bg-[#E8EFEA] text-[#2D3D33] hover:bg-[#DDD5C8] cursor-pointer"
                            title="Decrease by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onAdjustStock(item.id, 1)}
                            className="p-1 rounded bg-[#E8EFEA] text-[#2D3D33] hover:bg-[#DDD5C8] cursor-pointer"
                            title="Increase by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#617568]">
                      {item.minThreshold} {item.unit}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#2D3D33] font-bold">
                      {settings.currencySymbol}{item.costPerUnit} / {item.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[#2D3D33] font-medium">{item.supplierName || 'General Distributor'}</div>
                      {item.supplierPhone ? (
                        <button
                          onClick={() => handleReorderWhatsApp(item)}
                          className="mt-1 text-[11px] text-[#2D3D33] hover:text-[#B86B3D] flex items-center gap-1 font-bold cursor-pointer transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" /> Reorder via WhatsApp
                        </button>
                      ) : (
                        <div className="text-[10px] text-[#73897C]">No phone set</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-[#73897C] hover:text-[#2D3D33] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInventoryItem(item.id)}
                          className="p-1.5 rounded-lg text-[#73897C] hover:text-rose-600 hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inventory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-md w-full p-5 text-[#2D3D33] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">
                {editingItem ? 'Edit Stock Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabica Coffee Beans, Oat Milk"
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
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Dairy-Free">Dairy-Free</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Tea">Tea</option>
                    <option value="Produce">Produce</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Syrups">Syrups & Flavors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, liters, pieces, packets"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Min. Alert Qty</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Cost ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Supplier Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Roasters Hub"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                  />
                </div>

                <div>
                  <label className="block text-[#2D3D33] font-bold mb-1">Supplier WhatsApp Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 919811223344"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#617568] hover:text-[#2D3D33] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
