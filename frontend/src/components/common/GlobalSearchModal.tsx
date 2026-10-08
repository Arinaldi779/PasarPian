import React, { useState, useEffect } from 'react';
import { Search, X, Package, ShoppingCart, Truck, Warehouse as WarehouseIcon } from 'lucide-react';
import { mockOrders, mockInventory, mockWarehouses, mockShipments } from '../../data/mockData';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled by parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingOrders = trimmed
    ? mockOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(trimmed) ||
          o.customerName.toLowerCase().includes(trimmed)
      )
    : mockOrders.slice(0, 3);

  const matchingProducts = trimmed
    ? mockInventory.filter(
        (p) =>
          p.productName.toLowerCase().includes(trimmed) ||
          p.sku.toLowerCase().includes(trimmed)
      )
    : mockInventory.slice(0, 2);

  const matchingShipments = trimmed
    ? mockShipments.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(trimmed) ||
          s.shipmentNumber.toLowerCase().includes(trimmed)
      )
    : mockShipments.slice(0, 2);

  const matchingWarehouses = trimmed
    ? mockWarehouses.filter(
        (w) =>
          w.name.toLowerCase().includes(trimmed) ||
          w.city.toLowerCase().includes(trimmed)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div 
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Header */}
          <div className="relative border-b border-slate-200 p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor pesanan (ORD-..), SKU, nama produk, nomor resi, atau gudang..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {/* Orders Section */}
            {matchingOrders.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Pesanan ({matchingOrders.length})
                </div>
                <div className="space-y-1">
                  {matchingOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(order.id);
                        if (onNavigateTab) onNavigateTab('orders');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D7A70] flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 font-mono-numbers flex items-center gap-2">
                            {order.orderNumber}
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans">
                              {order.salesChannel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {order.customerName} ({order.customerCity}) &bull; {order.items.length} item
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900 font-mono-numbers">
                          Rp {order.total.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-[#0D7A70] group-hover:underline">Buka detail &rarr;</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {matchingProducts.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Katalog & SKU ({matchingProducts.length})
                </div>
                <div className="space-y-1">
                  {matchingProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab('inventory');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            {item.productName}
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded">
                              {item.sku}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Varian: {item.variant} &bull; Stok Tersedia: <b className="text-slate-700">{item.availableStock}</b> unit
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono-numbers shrink-0">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipments Section */}
            {matchingShipments.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Pengiriman & Resi ({matchingShipments.length})
                </div>
                <div className="space-y-1">
                  {matchingShipments.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab('shipping');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 font-mono-numbers">
                            {s.trackingNumber} ({s.courier})
                          </div>
                          <div className="text-xs text-slate-500">
                            Tujuan: {s.destinationCity} &bull; Ref: {s.orderNumber}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-700 font-medium">Lacak Resi &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchingWarehouses.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Gudang Banua
                </div>
                <div className="space-y-1">
                  {matchingWarehouses.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab('inventory');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <WarehouseIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-800">{w.name} ({w.city})</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{w.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trimmed && matchingOrders.length === 0 && matchingProducts.length === 0 && matchingShipments.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Kada ditemukan hasil nang cocok lawan "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Coba cari dengan nomor pesanan, nama produk, atau kata kunci lain.</p>
              </div>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>Gunakan tombol panah untuk navigasi</span>
            <span className="text-[#0D7A70] font-medium">PasarPian Global Search &bull; Urang Banua</span>
          </div>
        </div>
      </div>
    </div>
  );
};
