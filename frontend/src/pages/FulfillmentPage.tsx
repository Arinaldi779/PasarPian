import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  PackageSearch,
  Search,
  Truck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import { fulfillmentStatusLabels } from '../utils/orderDisplay';
import { warehouseOptionsOf } from '../utils/inventoryDisplay';
import type { Fulfillment, FulfillmentStatus } from '../types';

/**
 * Halaman Antrean Pemenuhan — spesifikasi: Agents/DESIGN.md §8.3 + alur §7.2.
 *
 * Apa ini? Daftar kerja gudang bertahap: ambil (picking) → kemas (packing) →
 * siap diserahkan ke kurir.
 * Untuk apa? WAREHOUSE mengerjakan pesanan berurutan tanpa salah barang
 * (DESIGN §3: checklist berbasis SKU dan varian).
 * Kenapa ada? Pemenuhan adalah tahap paling rawan salah kirim; halaman ini
 * memaksa urutan kerja dan mencatat tiap perpindahan tahap ke jejak audit.
 */
interface FulfillmentPageProps {
  /** Antrean gudang dari App (state — aksi halaman ini mengubahnya). */
  fulfillments: Fulfillment[];
  /** Memajukan satu antrean ke tahap berikutnya yang sah (tombol per kartu & aksi massal). */
  onAdvanceFulfillment: (fulfillmentId: string) => void;
  /** Pindah tab sidebar — dipakai drill-down kartu siap-kirim ke Pengiriman. */
  onNavigateTab: (tab: string) => void;
}

/** Tiga tab tahap kerja sesuai DESIGN §8.3 (PICKING digabung ke PACKING). */
type QueueFilter = 'READY_TO_PICK' | 'PACKING' | 'READY_TO_SHIP';

/**
 * Label tombol aksi per tahap — hanya tahap yang punya langkah berikut yang
 * punya tombol; READY_TO_SHIP menunggu kurir sehingga tanpa tombol (DESIGN §7.2).
 */
const nextActionLabel: Partial<Record<FulfillmentStatus, string>> = {
  READY_TO_PICK: 'Mulai ambil barang',
  PICKING: 'Mulai kemas',
  PACKING: 'Konfirmasi siap kirim',
};

/**
 * Badge status antrean: ikon + tulisan (status tidak dibedakan warna saja, AGENTS #19).
 * Warna latar disamakan dengan legenda panel distribusi supaya konsisten.
 */
const FulfillmentStatusBadge: React.FC<{ status: FulfillmentStatus }> = ({ status }) => {
  const styles: Record<FulfillmentStatus, { chip: string; icon: React.ReactNode }> = {
    READY_TO_PICK: {
      chip: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    PICKING: {
      chip: 'border-sky-200 bg-sky-50 text-sky-800',
      icon: <PackageSearch className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    PACKING: {
      chip: 'border-indigo-200 bg-indigo-50 text-indigo-800',
      icon: <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    READY_TO_SHIP: {
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      icon: <Truck className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  };
  const style = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}>
      {style.icon}
      {fulfillmentStatusLabels[status] ?? status}
    </span>
  );
};

export const FulfillmentPage: React.FC<FulfillmentPageProps> = ({
  fulfillments,
  onAdvanceFulfillment,
  onNavigateTab,
}) => {
  const [activeQueue, setActiveQueue] = useState<QueueFilter>('READY_TO_PICK');
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  /** Antrean per tahap; PICKING dihitung masuk tab Packing (tahap kerja yang sama). */
  const countFor = (queue: QueueFilter) =>
    fulfillments.filter((item) =>
      queue === 'PACKING' ? item.status === 'PACKING' || item.status === 'PICKING' : item.status === queue,
    ).length;

  // Opsi gudang diturunkan dari data antrean (bukan hardcode).
  const warehouseOptions = useMemo(
    () =>
      warehouseOptionsOf(
        fulfillments.map((item) => ({ warehouseId: item.warehouseId, warehouseName: item.warehouseName })),
      ),
    [fulfillments],
  );

  const filteredFulfillments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return fulfillments.filter((item) => {
      const matchesQueue =
        activeQueue === 'PACKING'
          ? item.status === 'PACKING' || item.status === 'PICKING'
          : item.status === activeQueue;
      if (!matchesQueue) return false;
      if (warehouseId !== 'ALL' && item.warehouseId !== warehouseId) return false;
      if (!query) return true;
      return [
        item.orderNumber,
        item.fulfillmentNumber,
        item.customerName,
        item.warehouseName,
        ...item.items.flatMap((line) => [line.productName, line.sku]),
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [activeQueue, fulfillments, searchQuery, warehouseId]);

  const totalUnits = fulfillments.reduce(
    (sum, fulfillment) => sum + fulfillment.items.reduce((inner, line) => inner + line.quantity, 0),
    0,
  );
  const packedUnits = fulfillments.reduce(
    (sum, fulfillment) => sum + fulfillment.items.reduce((inner, line) => inner + line.packedQuantity, 0),
    0,
  );

  // Target aksi massal (DESIGN §8.3): yang terlihat di saringan saat ini.
  const bulkPickTargets = filteredFulfillments.filter((item) => item.status === 'READY_TO_PICK');
  const bulkPackTargets = filteredFulfillments.filter((item) => item.status === 'PACKING');

  /** Mengembalikan saringan ke awal — dipakai kartu ringkasan dan empty state. */
  const resetFilters = () => {
    setActiveQueue('READY_TO_PICK');
    setWarehouseId('ALL');
    setSearchQuery('');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman: judul + saringan gudang */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <Boxes className="h-4 w-4" aria-hidden="true" /> Gudang & pemenuhan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Antrean pemenuhan</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Kerjakan pesanan secara berurutan: ambil barang, kemas, lalu serahkan ke kurir.
            Setiap perpindahan tahap tercatat di jejak audit.
          </p>
        </div>
      </header>

      {/* Ringkasan pendukung (dibuat tenang): fakta antrean, tanpa kata kerja perintah (DESIGN §5.3-D.5) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan pendukung pemenuhan">
        <StatCard
          title="Total antrean"
          value={`${fulfillments.length} antrean`}
          icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
          trendText="Seluruh tahap kerja"
          trendDirection="neutral"
          onClick={resetFilters}
        />
        <StatCard
          title="Menunggu diambil"
          value={`${countFor('READY_TO_PICK')} antrean`}
          icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
          trendText="Tahap pertama"
          trendDirection="neutral"
          exceptionTag={countFor('READY_TO_PICK') > 0 ? 'Kerjakan lebih dulu' : undefined}
          exceptionType="warning"
          onClick={() => setActiveQueue('READY_TO_PICK')}
        />
        <StatCard
          title="Sudah dikemas"
          value={`${packedUnits} / ${totalUnits} unit`}
          icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
          trendText="Kemajuan kemasan unit"
          trendDirection="neutral"
        />
      </section>

      {/* Tahap kerja + saringan */}
      <section className="glass rounded-2xl p-5" aria-labelledby="queue-title">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="queue-title" className="text-base font-semibold text-slate-900">
              Pilih pekerjaan yang ingin dikerjakan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Urutan proses membantu mencegah barang tertukar atau terkirim sebelum siap.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="fulfillment-search" className="sr-only">
              Cari antrean
            </label>
            <input
              id="fulfillment-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nomor order, pelanggan, SKU..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <FilterTabs
            options={[
              { id: 'READY_TO_PICK', label: 'Siap diambil', description: 'Langkah 1 · Ambil barang dari rak', count: countFor('READY_TO_PICK'), icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> },
              { id: 'PACKING', label: 'Sedang dikemas', description: 'Langkah 2 · Periksa isi dan jumlah', count: countFor('PACKING'), icon: <PackageCheck className="h-4 w-4" aria-hidden="true" /> },
              { id: 'READY_TO_SHIP', label: 'Siap dikirim', description: 'Langkah 3 · Serahkan ke kurir', count: countFor('READY_TO_SHIP'), icon: <Truck className="h-4 w-4" aria-hidden="true" /> },
            ] as { id: QueueFilter; label: string; description: string; count: number; icon: React.ReactNode }[]}
            activeId={activeQueue}
            onChange={setActiveQueue}
            ariaLabel="Tahap pemenuhan"
          />
        </div>

        <div className="mt-3">
          <FilterTabs
            options={[
              { id: 'ALL', label: 'Semua gudang', count: fulfillments.length },
              ...warehouseOptions.map((option) => ({ id: option.id, label: option.label, count: option.count })),
            ]}
            activeId={warehouseId}
            onChange={setWarehouseId}
            ariaLabel="Filter gudang antrean"
          />
        </div>

        {/* Satu aksi utama per tahap (DESIGN §8.3): bekerja pada hasil saringan, tombol mati bila tidak ada target */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/70 pt-4">
          <span className="text-xs text-slate-500" aria-live="polite">
            Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredFulfillments.length}</strong> antrean tahap ini
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            {activeQueue === 'READY_TO_PICK' ? (
              <Button
                variant="primary"
                size="sm"
                className="neu-raised"
                disabled={bulkPickTargets.length === 0}
                onClick={() => bulkPickTargets.forEach((item) => onAdvanceFulfillment(item.id))}
              >
                Ambil semua yang tampil ({bulkPickTargets.length})
              </Button>
            ) : activeQueue === 'PACKING' ? (
              <Button
                variant="primary"
                size="sm"
                className="neu-raised"
                disabled={bulkPackTargets.length === 0}
                onClick={() => bulkPackTargets.forEach((item) => onAdvanceFulfillment(item.id))}
              >
                Selesaikan kemasan yang tampil ({bulkPackTargets.length})
              </Button>
            ) : (
              <span className="text-xs text-slate-500">Serahkan paket ke kurir lewat halaman Pengiriman.</span>
            )}
          </span>
        </div>

        {/* Kartu antrean */}
        <div className="mt-4 space-y-3">
          {filteredFulfillments.length > 0 ? (
            filteredFulfillments.map((fulfillment) => {
              const unitCount = fulfillment.items.reduce((sum, line) => sum + line.quantity, 0);
              const packedCount = fulfillment.items.reduce((sum, line) => sum + line.packedQuantity, 0);
              const progress = unitCount > 0 ? Math.round((packedCount / unitCount) * 100) : 0;
              const actionLabel = nextActionLabel[fulfillment.status];

              return (
                <article key={fulfillment.id} className="rounded-xl border border-slate-200 bg-white/85 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0D7A70]">
                        <Boxes className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-mono-numbers text-sm font-bold text-slate-900">
                            {fulfillment.orderNumber}
                          </h3>
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono-numbers text-[10px] font-semibold text-slate-600">
                            {fulfillment.fulfillmentNumber}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{fulfillment.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {fulfillment.warehouseName} · Masuk {fulfillment.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <FulfillmentStatusBadge status={fulfillment.status} />
                      {actionLabel ? (
                        <Button variant="primary" size="sm" className="neu-raised" onClick={() => onAdvanceFulfillment(fulfillment.id)}>
                          {actionLabel}
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" className="neu-raised" onClick={() => onNavigateTab('shipping')}>
                          Buka pengiriman <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <ul className="space-y-2">
                      {fulfillment.items.map((line) => (
                        <li
                          key={line.id}
                          className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800">{line.productName}</span>
                            <span className="ml-2 text-slate-500">
                              {line.variant} · SKU <span className="font-mono">{line.sku}</span>
                            </span>
                          </div>
                          <span className="shrink-0 font-mono-numbers text-slate-600">
                            Ambil <strong className="text-slate-900">{line.pickedQuantity}/{line.quantity}</strong>
                            {' · '}Kemas <strong className="text-slate-900">{line.packedQuantity}/{line.quantity}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                        <span>Kemajuan kemasan</span>
                        <span className="font-mono-numbers font-semibold text-slate-700">{progress}%</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Kemajuan kemasan ${progress} persen`}
                      >
                        <div className="h-full rounded-full bg-[#0D7A70]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : fulfillments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
              <Boxes className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-slate-700">Belum ada antrean pemenuhan</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Pesanan yang dikonfirmasi dan diteruskan ke gudang akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-slate-700">Antrean tidak ditemukan</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Tidak ada pekerjaan yang cocok dengan tahap, gudang, atau pencarian saat ini.
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                Atur ulang filter
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
