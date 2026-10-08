import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  Eye,
  Filter,
  PackageOpen,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import { Button } from '../components/common/Button';
import { ORDER_STATUS_TABS, channelMeta, paymentStatusLabels } from '../utils/orderDisplay';
import type { OrderFilter } from '../utils/orderDisplay';
import { formatRupiah } from '../utils/dashboardInsights';
import type { Order, PaymentStatus, SalesChannel } from '../types';

/**
 * Halaman Penjualan & Pesanan — spesifikasi: Agents/DESIGN.md §8.2 (daftar).
 *
 * Apa ini? Daftar seluruh pesanan Urang Banua dengan ringkasan, filter cepat,
 * dan tabel operasional. Untuk apa? OPERATIONS memantau lifecycle
 * PENDING → DELIVERED dan menangani pesanan bermasalah (DESIGN §3).
 * Kenapa ada? Satu layar harus menjawab "pesanan mana yang butuh saya sentuh
 * sekarang?" tanpa membuka tiap pesanan (AGENTS #31, progressive disclosure).
 *
 * Filter status diangkat ke App (controlled) supaya drill-down dari dashboard
 * bisa membuka daftar yang sudah terfilter (DESIGN §5.3-D.5); filter lain
 * (cari, saluran, bayar, tanggal) tetap state lokal halaman.
 */
interface OrdersPageProps {
  /** Seluruh pesanan dari App — satu-satunya sumber daftar ini. */
  orders: Order[];
  /** Filter status aktif (milik App agar bisa diisi dari dashboard). */
  statusFilter: OrderFilter;
  /** Mengubah filter status — dipakai tab, chip, dan kartu ringkasan. */
  onStatusFilterChange: (status: OrderFilter) => void;
  /** Membuka panel detail 360° satu pesanan. */
  onSelectOrder: (order: Order) => void;
  /** Pindah tab sidebar — dipakai drill-down kartu piutang ke Keuangan. */
  onNavigateTab: (tab: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  statusFilter,
  onStatusFilterChange,
  onSelectOrder,
  onNavigateTab,
}) => {
  // --- Filter lokal halaman (tidak perlu diangkat ke App karena hanya dipakai di sini) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | SalesChannel>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // --- Ringkasan angka (dihitung dari data, bukan ditulis manual) ---
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const activeCount = orders.filter((order) => !['CANCELLED', 'DELIVERED'].includes(order.status)).length;
  const unpaidOrders = orders.filter((order) => order.status !== 'CANCELLED' && order.outstanding > 0);
  const outstandingTotal = unpaidOrders.reduce((sum, order) => sum + order.outstanding, 0);

  // Daftar terfilter: status (milik App) + cari + saluran + bayar + rentang tanggal (DESIGN §8.2).
  // Pencarian lokal sehingga tanpa debounce; saat tersambung API, pencarian wajib debounce
  // 350ms sebelum request (DESIGN §10) dan filter/paginasi pindah ke server (AGENTS #6).
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (channelFilter !== 'ALL' && order.salesChannel !== channelFilter) return false;
      if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) return false;
      const orderDay = order.orderDate.slice(0, 10);
      if (dateFrom && orderDay < dateFrom) return false;
      if (dateTo && orderDay > dateTo) return false;
      if (!query) return true;
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerCity,
        channelMeta[order.salesChannel].label,
        ...order.items.flatMap((item) => [item.productName, item.sku]),
      ];
      return haystack.some((value) => value.toLowerCase().includes(query));
    });
  }, [orders, statusFilter, channelFilter, paymentFilter, dateFrom, dateTo, searchQuery]);

  /** Jumlah pesanan per tab status — dihitung dari seluruh data, bukan dari hasil filter. */
  const countFor = (status: OrderFilter) =>
    status === 'ALL' ? orders.length : orders.filter((order) => order.status === status).length;

  // Status dari drill-down dashboard (mis. RETURNED) tidak punya tab: tampil sebagai chip hapus.
  const isExtraStatus = !ORDER_STATUS_TABS.some((option) => option.id === statusFilter);

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    channelFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    searchQuery.trim() !== '';

  /** Mengembalikan seluruh filter ke awal — dipakai tombol reset empty state dan filter bar. */
  const resetFilters = () => {
    onStatusFilterChange('ALL');
    setChannelFilter('ALL');
    setPaymentFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  /** Baris tabel bisa dibuka lewat keyboard (Enter/Spasi) — baris onClick saja tidak cukup (DESIGN §12.1). */
  const handleRowKeyDown = (event: React.KeyboardEvent, order: Order) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectOrder(order);
    }
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman: judul + aksi utama (DESIGN §8.2, AGENTS #31: satu tindakan utama per area) */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Penjualan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pesanan masuk</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Pantau perjalanan pesanan dari checkout sampai selesai. Pilih satu pesanan untuk melihat
            pelanggan, pembayaran, dan langkah berikutnya.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="neu-raised shrink-0"
          leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => alert('Fitur ekspor CSV segera hadir — data yang tampil masih contoh.')}
        >
          Ekspor data
        </Button>
      </header>

      {/* Ringkasan: kartu bisa diklik menuju data pembentuknya (DESIGN §5.3-D.5) */}
      <section aria-label="Ringkasan pesanan" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total pesanan"
          value={`${orders.length} pesanan`}
          icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
          trendText={`${activeCount} masih berjalan`}
          trendDirection="neutral"
          onClick={() => onStatusFilterChange('ALL')}
        />
        <StatCard
          title="Perlu tindakan sekarang"
          value={`${pendingCount} pesanan`}
          icon={<Eye className="h-5 w-5" aria-hidden="true" />}
          trendText="Menunggu konfirmasi"
          trendDirection="neutral"
          exceptionTag={pendingCount > 0 ? 'Prioritas hari ini' : undefined}
          exceptionType="warning"
          onClick={() => onStatusFilterChange('PENDING')}
        />
        <StatCard
          title="Total piutang"
          value={formatRupiah(outstandingTotal)}
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          trendText={`${unpaidOrders.length} pesanan belum lunas`}
          trendDirection="neutral"
          onClick={() => onNavigateTab('finance')}
        />
      </section>

      {/* Filter + daftar (DESIGN §8.2: status, saluran, tanggal, bayar, pencarian) */}
      <section className="glass rounded-2xl p-5" aria-labelledby="orders-list-title">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="orders-list-title" className="text-base font-semibold text-slate-900">
              Daftar pesanan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Saring berdasarkan status, saluran, pembayaran, atau tanggal — lalu pilih baris untuk melihat
              detail lengkap.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="order-search" className="sr-only">
              Cari pesanan
            </label>
            <input
              id="order-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nomor, pelanggan, kota, produk, SKU..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        {/* Tab status: aktif tampil tertekan + badge solid (DESIGN §5.3-E, komponen FilterTabs) */}
        <div className="mt-5 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FilterTabs
              options={ORDER_STATUS_TABS.map((option) => ({ ...option, count: countFor(option.id) }))}
              activeId={statusFilter}
              onChange={onStatusFilterChange}
              ariaLabel="Filter status pesanan"
            />
          </div>
          {isExtraStatus && (
            <span className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-teal-300 bg-teal-50 px-3 text-xs font-semibold text-teal-800">
              <StatusBadge status={statusFilter} size="sm" />
              <button
                type="button"
                onClick={() => onStatusFilterChange('ALL')}
                aria-label="Hapus filter status tambahan"
                className="rounded p-0.5 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>

        {/* Filter lanjutan: saluran, pembayaran, rentang tanggal */}
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="order-channel-filter" className="mb-1 block text-xs font-semibold text-slate-600">
              Saluran penjualan
            </label>
            <select
              id="order-channel-filter"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as 'ALL' | SalesChannel)}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            >
              <option value="ALL">Semua saluran</option>
              {(Object.keys(channelMeta) as SalesChannel[]).map((channel) => (
                <option key={channel} value={channel}>
                  {channelMeta[channel].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="order-payment-filter" className="mb-1 block text-xs font-semibold text-slate-600">
              Status pembayaran
            </label>
            <select
              id="order-payment-filter"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as 'ALL' | PaymentStatus)}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            >
              <option value="ALL">Semua pembayaran</option>
              {(Object.keys(paymentStatusLabels) as PaymentStatus[]).map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="order-date-from" className="mb-1 block text-xs font-semibold text-slate-600">
              Dari tanggal
            </label>
            <input
              id="order-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
          <div>
            <label htmlFor="order-date-to" className="mb-1 block text-xs font-semibold text-slate-600">
              Sampai tanggal
            </label>
            <input
              id="order-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Filter aktif — hasilnya menyempit mengikuti pilihan di atas.
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold text-[#0D7A70] hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset semua filter
            </button>
          </div>
        )}

        <div
          className="mt-4 flex items-center justify-between gap-3 border-y border-slate-200/70 px-1 py-2.5 text-xs text-slate-500"
          aria-live="polite"
        >
          <span>
            Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredOrders.length}</strong> dari{' '}
            <span className="font-mono-numbers">{orders.length}</span> pesanan
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-mono-numbers">{activeCount}</span> pesanan masih berjalan
          </span>
        </div>

        {/* Tabel operasional: solid agar angka mudah dipindai (DESIGN §5.3-E); angka rata kanan tabular */}
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[1020px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3">No. Pesanan</th>
                <th scope="col" className="px-4 py-3">Tanggal</th>
                <th scope="col" className="px-4 py-3">Pelanggan</th>
                <th scope="col" className="px-4 py-3">Isi pesanan</th>
                <th scope="col" className="px-4 py-3">Saluran</th>
                <th scope="col" className="px-4 py-3 text-right">Total Belanja</th>
                <th scope="col" className="px-4 py-3">Status Pesanan</th>
                <th scope="col" className="px-4 py-3">Status Bayar</th>
                <th scope="col" className="px-4 py-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    onClick={() => onSelectOrder(order)}
                    onKeyDown={(event) => handleRowKeyDown(event, order)}
                    aria-label={`Buka detail ${order.orderNumber} milik ${order.customerName}`}
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-teal-50/60"
                  >
                    <td className="px-5 py-4 font-mono-numbers font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono-numbers text-slate-600">
                      {order.orderDate}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">{order.customerName}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {order.customerCity} · {order.customerType === 'INSTITUTION' ? 'Instansi' : 'Individu'}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-4 py-4">
                      <div className="truncate font-semibold text-slate-800">
                        {order.items[0]?.productName ?? '—'}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {order.items.length > 1
                          ? `+${order.items.length - 1} item lainnya`
                          : order.items[0]?.variant ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                        {channelMeta[order.salesChannel].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono-numbers font-semibold text-slate-900">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                      {order.outstanding > 0 && (
                        <div className="mt-1 font-mono-numbers text-[11px] font-semibold text-amber-800">
                          Sisa {formatRupiah(order.outstanding)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        aria-label={`Buka detail ${order.orderNumber}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 font-semibold text-[#0D7A70] transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <PackageOpen className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                    <div className="mt-3 font-semibold text-slate-700">Belum ada pesanan tercatat</div>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                      Pesanan baru dari semua saluran akan muncul di sini begitu pelanggan checkout.
                    </p>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Filter className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                    <div className="mt-3 font-semibold text-slate-700">Tidak ada pesanan yang cocok</div>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                      Filter terlalu ketat, bukan kesalahan sistem. Longgarkan filter atau reset semuanya.
                    </p>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                      Reset semua filter
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          <strong className="font-semibold text-slate-700">Status Bayar</strong>: Lunas berarti sudah bayar penuh;
          sebagian berarti masih ada sisa; sisa tagihan = Total Belanja − Total Bayar.
        </p>
      </section>
    </div>
  );
};
