import { useState, useEffect } from 'react';
import { CafeTable, CafeSettings } from '../../types/cafe';
import { CafeStore } from '../../lib/storage';
import {
  QrCode,
  Printer,
  ExternalLink,
  Plus,
  Coffee,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';

interface Props {
  tables: CafeTable[];
  settings: CafeSettings;
  onAddTable: (table: CafeTable) => void;
  onSelectTableForMenu: (tableNumber: number) => void;
}

export default function TableQrManager({
  tables,
  settings,
  onAddTable,
  onSelectTableForMenu,
}: Props) {
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});
  const [selectedStandeeTable, setSelectedStandeeTable] = useState<CafeTable | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState(tables.length + 1);
  const [newSection, setNewSection] = useState('Patio & Garden');
  const [newCapacity, setNewCapacity] = useState('4');

  // Generate QR codes for all tables
  useEffect(() => {
    async function loadQrCodes() {
      const generated: Record<number, string> = {};
      for (const tbl of tables) {
        const url = await CafeStore.generateTableQrDataUrl(tbl.tableNumber);
        generated[tbl.tableNumber] = url;
      }
      setQrCodes(generated);
    }
    loadQrCodes();
  }, [tables]);

  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTbl: CafeTable = {
      id: `tbl-${Date.now().toString(36)}`,
      tableNumber: newTableNum,
      capacity: parseInt(newCapacity, 10) || 4,
      section: newSection,
      status: 'available',
    };
    onAddTable(newTbl);
    setNewTableNum(newTableNum + 1);
    setIsAddTableOpen(false);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#B86B3D]" /> Table QR Codes & Acrylic Standees
          </h1>
          <p className="text-xs text-[#617568] mt-0.5">
            Printable QR standees for every table. Guests scan with their phone camera to browse the menu and order.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              if (tables.length > 0) setSelectedStandeeTable(tables[0]);
            }}
            className="bg-white border border-[#DDD5C8] hover:border-[#526B5A] text-[#2D3D33] font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#617568]" />
            <span>Print Standee Tent Card</span>
          </button>

          <button
            onClick={() => setIsAddTableOpen(true)}
            className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Grid of Table QR Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const qrUrl = qrCodes[table.tableNumber];

          return (
            <div
              key={table.id}
              className="bg-white border border-[#E3DCD1] rounded-3xl p-5 flex flex-col justify-between items-center text-center space-y-4 hover:border-[#526B5A]/40 transition-all shadow-xs group"
            >
              {/* Table details */}
              <div className="w-full flex items-center justify-between">
                <span className="font-extrabold text-base text-[#2D3D33] tracking-tight font-serif">
                  Table #{table.tableNumber}
                </span>
                <span className="text-[10px] text-[#2D3D33] font-bold px-2 py-0.5 rounded-full bg-[#F5F1E8] border border-[#DDD5C8]">
                  {table.section}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-2xl shadow-sm border-2 border-[#DDD5C8] group-hover:border-[#526B5A] transition-colors">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code Table ${table.tableNumber}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-[#73897C] text-xs">
                    Generating...
                  </div>
                )}
                <div className="text-[9px] font-mono text-[#2D3D33] font-bold mt-1 uppercase tracking-wider">
                  Scan to Order
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="text-[11px] text-[#617568] font-medium">
                  Seating Capacity: {table.capacity} Guests
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onSelectTableForMenu(table.tableNumber)}
                    className="bg-[#526B5A] hover:bg-[#43594A] text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Simulate scanning this table's QR"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Menu</span>
                  </button>

                  <button
                    onClick={() => setSelectedStandeeTable(table)}
                    className="bg-white hover:bg-[#F5F1E8] text-[#2D3D33] border border-[#DDD5C8] font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Acrylic Standee Modal / Preview */}
      {selectedStandeeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs print:p-0 print:bg-white">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-sm w-full p-5 text-[#2D3D33] shadow-2xl flex flex-col items-center print:border-none print:shadow-none print:p-0 print:w-full print:bg-white print:text-black">
            {/* Modal Controls */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E3DCD1] print:hidden mb-4">
              <span className="text-xs font-bold text-[#2D3D33] flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#B86B3D]" /> Acrylic Tent Card Standee Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStandee}
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Tent Card
                </button>
                <button
                  onClick={() => setSelectedStandeeTable(null)}
                  className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Standee Tent Card Layout */}
            <div className="w-full bg-white border-2 border-[#DDD5C8] text-[#2D3D33] rounded-3xl p-6 text-center space-y-4 shadow-md print:border-2 print:border-stone-800 print:rounded-2xl">
              {/* Cafe Branding */}
              <div className="space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#526B5A] text-white flex items-center justify-center shadow-xs">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black tracking-wide uppercase font-serif text-[#2D3D33]">{settings.cafeName}</h2>
                <p className="text-[11px] text-[#617568]">{settings.tagline}</p>
              </div>

              {/* Table Number Display */}
              <div className="py-1">
                <span className="text-3xl font-black text-[#B86D43] tracking-tight font-serif">
                  TABLE NO. {selectedStandeeTable.tableNumber}
                </span>
                <p className="text-xs text-[#617568] mt-0.5 font-medium">
                  {selectedStandeeTable.section} · Dedicated Table QR
                </p>
                <div className="inline-block mt-1 font-mono text-[10px] bg-[#F5F1E8] border border-[#DDD5C8] px-2 py-0.5 rounded text-[#2D3D33]">
                  URL: ?table={selectedStandeeTable.tableNumber}
                </div>
              </div>

              {/* High Res QR Box */}
              <div className="inline-block p-4 bg-white rounded-2xl shadow-xs border-2 border-[#DDD5C8]">
                {qrCodes[selectedStandeeTable.tableNumber] && (
                  <img
                    src={qrCodes[selectedStandeeTable.tableNumber]}
                    alt={`Table No. ${selectedStandeeTable.tableNumber} QR`}
                    className="w-48 h-48 object-contain mx-auto"
                  />
                )}
                <p className="text-[10px] font-black tracking-widest uppercase text-[#2D3D33] mt-2">
                  SCAN TO ORDER FOR TABLE NO. {selectedStandeeTable.tableNumber}
                </p>
              </div>

              {/* Instructions & Perks */}
              <div className="space-y-1.5 pt-1 text-xs text-[#2D3D33]">
                <p className="flex items-center justify-center gap-1 font-bold text-[#B86B3D]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B86B3D]" /> Enter your DOB for Birthday Treats!
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#617568] font-medium">
                  <Wifi className="w-3 h-3 text-[#73897C]" />
                  <span>Free WiFi: CafeGuest · Pass: freshbeans</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E3DCD1] text-[9px] text-[#73897C] font-medium">
                Direct WhatsApp Invoicing & Contactless Digital Billing
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F5F1E8] border border-[#E3DCD1] rounded-3xl max-w-sm w-full p-5 text-[#2D3D33] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DCD1]">
              <h3 className="text-base font-bold text-[#2D3D33] font-serif">Add Dining Table</h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="p-1 text-[#73897C] hover:text-[#2D3D33] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTable} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Table Number</label>
                <input
                  type="number"
                  required
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Section / Area</label>
                <input
                  type="text"
                  required
                  placeholder="Main Dining, Patio, Window Corner..."
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A]"
                />
              </div>

              <div>
                <label className="block text-[#2D3D33] font-bold mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C8] rounded-xl px-3 py-2 text-[#2D3D33] focus:outline-none focus:border-[#526B5A] font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-[#E3DCD1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#73897C] hover:text-[#2D3D33] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Create Table & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
