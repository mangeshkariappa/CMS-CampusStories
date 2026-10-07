import { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../../types/cafe';
import { Utensils, CheckCircle2, Flame, Bell } from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export default function KitchenDisplayView({ orders, onUpdateOrderStatus }: Props) {
  const [filter, setFilter] = useState<'pending' | 'preparing' | 'all-active'>('all-active');

  const kitchenOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'billed' && o.status !== 'cancelled' && o.status !== 'served')
      .filter((o) => {
        if (filter === 'pending') return o.status === 'pending';
        if (filter === 'preparing') return o.status === 'preparing';
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, filter]);

  const getTimeElapsedMinutes = (dateString: string) => {
    const elapsedMs = Date.now() - new Date(dateString).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E8] text-[#2D3D33]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D3D33] tracking-tight font-serif flex items-center gap-2">
              <Utensils className="w-6 h-6 text-[#B86B3D]" /> Kitchen & Barista Display (KDS)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FDF4EE] text-[#B86B3D] border border-[#F6D7C3] font-bold">
              {kitchenOrders.length} Live Tickets
            </span>
          </div>
          <p className="text-xs text-[#617568] mt-0.5">
            Real-time table orders queue for baristas, chefs, and prep cooks.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E3DCD1] rounded-2xl self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setFilter('all-active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filter === 'all-active'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            All Live ({kitchenOrders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filter === 'preparing'
                ? 'bg-[#526B5A] text-white shadow-xs'
                : 'text-[#617568] hover:text-[#2D3D33] hover:bg-[#F5F1E8]'
            }`}
          >
            Preparing
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="bg-white border border-[#E3DCD1] rounded-3xl p-16 text-center text-[#73897C] space-y-2 shadow-xs">
          <CheckCircle2 className="w-10 h-10 mx-auto text-[#526B5A] opacity-80" />
          <h3 className="text-base font-bold text-[#2D3D33]">All Kitchen Orders Cleared!</h3>
          <p className="text-xs text-[#617568]">Every cup brewed and plate served. Ready for new table orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenOrders.map((order) => {
            const minutesElapsed = getTimeElapsedMinutes(order.createdAt);
            const isUrgent = minutesElapsed > 15;
            const isWarning = minutesElapsed > 8;

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
                  isUrgent
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : isWarning
                    ? 'border-[#F6D7C3] ring-2 ring-[#F6D7C3]'
                    : 'border-[#E3DCD1]'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isUrgent
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : isWarning
                      ? 'bg-[#FDF4EE] border-[#F6D7C3] text-[#B86B3D]'
                      : 'bg-[#E8EFEA] border-[#E3DCD1] text-[#2D3D33]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[#2D3D33] tracking-wide font-serif">
                        TABLE #{order.tableNumber}
                      </span>
                      <span className="font-mono text-xs text-[#617568] font-bold">({order.orderNumber})</span>
                    </div>
                    <div className="text-[11px] text-[#617568] font-medium">Guest: {order.customer.name}</div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isUrgent
                          ? 'bg-rose-200 text-rose-900'
                          : isWarning
                          ? 'bg-[#FDF4EE] text-[#B86B3D]'
                          : 'bg-[#F5F1E8] text-[#2D3D33] border border-[#DDD5C8]'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>{minutesElapsed}m ago</span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                  {order.items.map((item) => (
                    <div key={item.id} className="pb-3 border-b border-[#E8EFEA] last:border-none last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-[#2D3D33] leading-tight">
                          <span className="text-[#B86B3D] font-black mr-2 text-base">{item.quantity}x</span>
                          {item.name}
                        </span>
                      </div>

                      {/* Customization Details */}
                      {item.customization && (
                        <div className="mt-1 pl-6 text-xs text-[#617568] space-y-0.5 font-medium bg-[#F5F1E8] p-2 rounded-xl border border-[#E3DCD1]">
                          {item.customization.milk && <div>• Milk: <strong>{item.customization.milk}</strong></div>}
                          {item.customization.sweetness && <div>• Sweetness: <strong>{item.customization.sweetness}</strong></div>}
                          {item.customization.notes && (
                            <div className="italic text-[#2D3D33]">• Note: "{item.customization.notes}"</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* General order note */}
                  {order.notes && (
                    <div className="p-2.5 rounded-xl bg-[#FDF4EE] border border-[#F6D7C3] text-xs text-[#B86B3D] italic font-medium">
                      Special Table Request: "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="p-3.5 bg-[#F5F1E8] border-t border-[#E3DCD1] flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-[#B86B3D] hover:bg-[#A35C32] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-white" />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="flex-1 bg-[#526B5A] hover:bg-[#43594A] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#F1BA9B]" />
                      <span>Mark Ready to Serve</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'served')}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Served to Table #{order.tableNumber}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
