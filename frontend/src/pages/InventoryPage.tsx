import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  History,
  Boxes,
  Search,
} from 'lucide-react';
import type { InventoryItem, StockMovement } from '../types';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { movementLabels, stockConditionOf, warehouseOptionsOf } from '../utils/inventoryDisplay';

/**
 * Halaman Inventaris & Multi-Gudang — spesifikasi: Agents/DESIGN.md §8.3 + §7.4.
 *
 * Apa ini? Stok per SKU per gudang beserta buku mutasinya.
 * Untuk apa? WAREHOUSE menjaga akurasi fisik vs reservasi dan memproses
 * penyesuaian yang tercatat; peran lain memantau ketersediaan (DESIGN §3).
 * Kenapa ada? Stok adalah uang yang diam — selisih fisik vs catatan harus
 * terlihat dan setiap perubahan harus beralasan serta tercatat (AGENTS #21).
 *
 * Rumus kebenaran: Tersedia = Fisik − Reservasi (DESIGN §7.4). Penyesuaian tidak
 * mengubah reservasi, sehingga rumusnya tetap berlaku sesudah penyesuaian.
 */
interface InventoryPageProps {
  /** Baris stok dari App (state, supaya penyesuaian langsung tercermin). */
  inventory: InventoryItem[];
  /** Buku mutasi dari App (state — penyesuaian baru ikut tercatat di sini). */
  movements: StockMovement[];
  /** Menyimpan penyesuaian: (id baris, jumlah +/−, alasan, nomor referensi). */
  onAdjustStock: (itemId: string, quantity: number, reason: string, referenceNo: string) => void;
}

/** Dua tampilan halaman: daftar stok vs buku mutasi. */
type InventoryView = 'stock' | 'movements';

/**
 * Badge kondisi stok: Aman / Menipis / Habis (DESIGN §8.3).
 * Selalu ikon + tulisan supaya kondisi tidak dibedakan oleh warna saja (AGENTS #19).
 */
const StockConditionBadge: React.FC<{ item: InventoryItem }> = ({ item }) => {
  const condition = stockConditionOf(item);
  if (condition === 'HABIS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        <Ban className="h-3 w-3" aria-hidden="true" />
        Habis
      </span>
    );
  }
  if (condition === 'MENIPIS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Menipis (≤{item.minThreshold})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      Aman
    </span>
  );
};

export const InventoryPage: React.FC<InventoryPageProps> = ({
  inventory,
  movements,
  onAdjustStock,
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<InventoryView>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // Opsi gudang diturunkan dari data — gudang baru otomatis jadi chip (SCHEMA tidak hardcode).
  const warehouseOptions = useMemo(() => warehouseOptionsOf(inventory), [inventory]);

  // Saringan: gudang + pencarian nama/varian/SKU/kategori (DESIGN §8.3).
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return inventory.filter((item) => {
      if (selectedWarehouse !== 'ALL' && item.warehouseId !== selectedWarehouse) return false;
      if (!query) return true;
      return [item.productName, item.variant, item.sku, item.category].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [inventory, selectedWarehouse, searchQuery]);

  // Ringkasan dihitung dari hasil saringan supaya angka selalu cocok dengan tabel.
  const totalPhysical = filteredItems.reduce((sum, item) => sum + item.physicalStock, 0);
  const totalReserved = filteredItems.reduce((sum, item) => sum + item.reservedStock, 0);
  const totalAvailable = filteredItems.reduce((sum, item) => sum + item.availableStock, 0);
  const lowStockCount = filteredItems.filter((item) => stockConditionOf(item) !== 'AMAN').length;

  /** Mengembalikan saringan ke awal — dipakai kartu ringkasan dan empty state. */
  const resetFilters = () => {
    setSelectedWarehouse('ALL');
    setSearchQuery('');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala + rumus akurasi (AGENTS #31: rumus ditampilkan, bukan disembunyikan) */}
      <header className="glass rounded-2xl p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
          <Boxes className="h-4 w-4" aria-hidden="true" /> Inventaris
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventaris & Multi-Gudang</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Patokan utama halaman ini adalah <strong className="text-slate-700">Stok Tersedia</strong> — jumlah yang
          masih bisa dijual. Rumus: <strong className="font-mono-numbers text-slate-700">Tersedia = Fisik − Reservasi</strong>.
          Stok terkunci adalah barang yang sudah dipesan pelanggan sehingga tidak boleh dijual dua kali.
        </p>
      </header>

      {/* Ringkasan: kartu pertama bisa diklik untuk mereset saringan (DESIGN §5.3-D.5) */}
      <section aria-label="Ringkasan stok" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total SKU terdaftar"
          value={`${filteredItems.length} SKU`}
          icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
          trendText="Klik untuk tampilkan semua"
          trendDirection="neutral"
          onClick={resetFilters}
        />
        <StatCard
          title="Stok Fisik"
          value={`${totalPhysical} unit`}
          icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
          trendText="Barang nyata di rak gudang"
          trendDirection="neutral"
        />
        <StatCard
          title="Stok Terkunci"
          value={`${totalReserved} unit`}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          trendText="Sudah dipesan pelanggan"
          trendDirection="neutral"
        />
        <StatCard
          title="Stok Tersedia"
          value={`${totalAvailable} unit`}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          trendText="Siap dijual — fokus utama"
          trendDirection="neutral"
          exceptionTag={lowStockCount > 0 ? `${lowStockCount} SKU menipis/habis` : undefined}
          exceptionType="warning"
        />
      </section>

      {/* Saringan gudang: chip terpisah per gudang (anti-pola DESIGN §3: jangan campur multi-gudang tanpa pemisah) */}
      <section className="glass rounded-2xl p-5" aria-label="Saringan dan daftar stok">
        <FilterTabs
          options={[
            { id: 'ALL', label: 'Semua Gudang', count: inventory.length },
            ...warehouseOptions.map((option) => ({ id: option.id, label: option.label, count: option.count })),
          ]}
          activeId={selectedWarehouse}
          onChange={setSelectedWarehouse}
          ariaLabel="Filter gudang fisik"
        />

        {/* Tab tampilan: stok vs buku mutasi (gaya garis bawah, sama seperti tab detail pesanan) */}
        <div className="mt-4 flex gap-6 border-b border-slate-200 text-xs font-semibold" role="tablist" aria-label="Tampilan inventaris">
          {([
            { id: 'stock', label: `Daftar Stok Produk (${filteredItems.length})`, icon: <Boxes className="h-4 w-4" aria-hidden="true" /> },
            { id: 'movements', label: `Buku Mutasi Stok (${movements.length})`, icon: <History className="h-4 w-4" aria-hidden="true" /> },
          ] as { id: InventoryView; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeView === tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 border-b-2 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D7A70] ${
                activeView === tab.id
                  ? 'border-[#0D7A70] text-[#0D7A70]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'stock' && lowStockCount > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 font-mono-numbers text-[10px] font-semibold text-rose-800">
                  {lowStockCount} menipis
                </span>
              )}
            </button>
          ))}
        </div>

        {activeView === 'stock' && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <label htmlFor="inventory-search" className="sr-only">
                  Cari SKU, produk, varian, atau kategori
                </label>
                <input
                  id="inventory-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari SKU, produk, varian, kategori..."
                  className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
                />
              </div>
              <p className="text-xs text-slate-500" aria-live="polite">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredItems.length}</strong> dari{' '}
                <span className="font-mono-numbers">{inventory.length}</span> baris stok
              </p>
            </div>

            {/* Tabel stok: solid agar angka mudah dipindai (DESIGN §5.3-E); kolom sesuai §8.3 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">SKU & Kategori</th>
                    <th scope="col" className="px-4 py-3">Nama Produk & Varian</th>
                    <th scope="col" className="px-4 py-3">Gudang</th>
                    <th scope="col" className="px-4 py-3 text-right" title="Jumlah barang nyata di rak gudang">Fisik</th>
                    <th scope="col" className="px-4 py-3 text-right" title="Sudah dipesan pelanggan, tidak boleh dijual dua kali">Terkunci</th>
                    <th scope="col" className="px-4 py-3 text-right" title="Fisik dikurangi Terkunci — jumlah yang masih bisa dijual">Tersedia</th>
                    <th scope="col" className="px-4 py-3 text-center">Kondisi</th>
                    <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-900">
                            {item.sku}
                          </span>
                          <div className="mt-1 text-[11px] text-slate-400">{item.category}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="mt-1 text-[11px] text-slate-500">Varian: {item.variant}</div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600">{item.warehouseName}</td>
                        <td className="px-4 py-3.5 text-right font-mono-numbers font-medium text-slate-600">
                          {item.physicalStock}
                        </td>
                        <td className="bg-amber-50/30 px-4 py-3.5 text-right font-mono-numbers font-medium text-amber-700">
                          {item.reservedStock}
                        </td>
                        <td className="bg-teal-50/30 px-4 py-3.5 text-right font-mono-numbers text-lg font-bold text-[#0D7A70]">
                          {item.availableStock}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StockConditionBadge item={item} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Button variant="secondary" size="sm" onClick={() => setAdjustingItem(item)}>
                            Sesuaikan stok
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Boxes className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                        <div className="mt-3 font-semibold text-slate-700">Belum ada baris stok tercatat</div>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Penerimaan stok dari supplier akan muncul di sini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                        <div className="mt-3 font-semibold text-slate-700">Tidak ada stok yang cocok</div>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Saringan gudang atau kata kunci terlalu ketat, bukan kesalahan sistem.
                        </p>
                        <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                          Reset semua saringan
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'movements' && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-500">
              Setiap baris mencatat gudang, SKU, jumlah perubahan, nomor referensi dokumen, dan alasan.
              Tanda <strong className="font-mono-numbers">+</strong> berarti stok
              bertambah, <strong className="font-mono-numbers">−</strong> berarti berkurang.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Waktu</th>
                    <th scope="col" className="px-4 py-3">Tipe Mutasi</th>
                    <th scope="col" className="px-4 py-3">SKU & Produk</th>
                    <th scope="col" className="px-4 py-3">Gudang</th>
                    <th scope="col" className="px-4 py-3 text-center">Kuantitas</th>
                    <th scope="col" className="px-4 py-3">Referensi Dokumen</th>
                    <th scope="col" className="px-4 py-3">Aktor / Petugas</th>
                    <th scope="col" className="px-4 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.length > 0 ? (
                    movements.map((movement) => (
                      <tr key={movement.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers text-slate-500">
                          {movement.timestamp}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {movementLabels[movement.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">{movement.productName}</span>
                          <div className="font-mono text-[10px] text-slate-400">{movement.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{movement.warehouseName}</td>
                        <td className={`whitespace-nowrap px-4 py-3 text-center font-mono-numbers font-semibold ${
                          movement.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers font-medium text-slate-700">
                          {movement.referenceNo}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{movement.actor}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={movement.notes}>
                          {movement.notes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <History className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                        <div className="mt-3 font-semibold text-slate-700">Belum ada mutasi tercatat</div>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Penerimaan, reservasi, dan penyesuaian stok akan tercatat di sini.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal penyesuaian: kunci pakai id supaya form selalu reset tiap ganti baris */}
      <StockAdjustmentModal
        key={adjustingItem?.id ?? 'closed'}
        item={adjustingItem}
        isOpen={adjustingItem !== null}
        onClose={() => setAdjustingItem(null)}
        onSubmit={onAdjustStock}
      />
    </div>
  );
};
