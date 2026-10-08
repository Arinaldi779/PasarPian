import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Clock3,
  MapPin,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import {
  SHIPMENT_FILTER_OPTIONS,
  effectiveShipmentStatus,
  localTodayLabel,
  shipmentStatusLabels,
} from '../utils/shipmentDisplay';
import type { ShipmentFilter } from '../utils/shipmentDisplay';
import type { Shipment } from '../types';

/**
 * Halaman Pengiriman & Ekspedisi — spesifikasi: PRD #23 dan DESIGN IA §4.6.
 *
 * Apa ini? Daftar kiriman aktif beserta pelacakan kronologis tiap paket.
 * Untuk apa? OPERATIONS/SALES menjawab "paket sudah sampai mana?" tanpa
 * menelepon kurir; pengguna non-teknis cukup membaca timeline.
 * Kenapa ada? PRD #23 menegaskan shipment = memonitor — halaman ini sengaja
 * hanya-baca: perubahan status tiba dari kurir/API, bukan diklik manual
 * (kecuali penanda "diterima" yang memang milik halaman Pesanan).
 */
interface ShippingPageProps {
  /** Seluruh kiriman — masih data statis sampai ada umpan kurir/API. */
  shipments: Shipment[];
}

/** Gaya badge per status efektif: ikon + tulisan (AGENTS #19). */
const statusStyles: Record<Shipment['status'], { chip: string; icon: React.ReactNode }> = {
  IN_TRANSIT: {
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: <Truck className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  DELIVERED: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  DELAYED: {
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  RETURNED_TO_SENDER: {
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

export const ShippingPage: React.FC<ShippingPageProps> = ({ shipments }) => {
  const [statusFilter, setStatusFilter] = useState<ShipmentFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0] ?? null);
  // Umpan balik tombol salin resi: 'copied' ✓ hijau, 'failed' merah, null normal.
  const [copyFeedback, setCopyFeedback] = useState<'copied' | 'failed' | null>(null);

  // Acuan "hari ini" dihitung sekali per render agar seluruh kartu memakai tanggal sama.
  const todayLabel = useMemo(() => localTodayLabel(), []);

  /** Status efektif tiap kiriman (IN_TRANSIT lewat estimasi = DELAYED). */
  const effectiveOf = (shipment: Shipment) => effectiveShipmentStatus(shipment, todayLabel);

  /** Jumlah per tab: IN_TRANSIT murni yang masih sesuai estimasi; yang lewat masuk Terlambat. */
  const countFor = (status: ShipmentFilter) =>
    status === 'ALL'
      ? shipments.length
      : shipments.filter((shipment) => effectiveOf(shipment) === status).length;

  const delayedCount = countFor('DELAYED');

  const filteredShipments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return shipments.filter((shipment) => {
      if (statusFilter !== 'ALL' && effectiveOf(shipment) !== statusFilter) return false;
      if (!query) return true;
      return [
        shipment.shipmentNumber,
        shipment.orderNumber,
        shipment.customerName,
        shipment.destinationCity,
        shipment.courier,
        shipment.service,
        shipment.trackingNumber,
      ].some((value) => value.toLowerCase().includes(query));
    });
    // effectiveOf/todayLabel stabil per render; todayLabel ikut deps agar saringan
    // dihitung ulang bila hari berganti saat halaman dibiarkan terbuka.
  }, [searchQuery, statusFilter, shipments, todayLabel]);

  const selectionVisible =
    selectedShipment !== null && filteredShipments.some((shipment) => shipment.id === selectedShipment.id);

  /** Menyalin nomor resi ke clipboard dengan fallback browser lama/konteks non-HTTPS. */
  const copyTrackingNumber = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement('textarea');
        area.value = value;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopyFeedback('copied');
    } catch {
      setCopyFeedback('failed');
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  };

  /** Mengembalikan saringan ke awal — dipakai kartu ringkasan dan empty state. */
  const resetFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <Truck className="h-4 w-4" aria-hidden="true" /> Logistik
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengiriman & ekspedisi</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Pantau posisi paket, nomor resi, dan riwayat perjalanannya. Pilih satu pengiriman di
            daftar — detail tracking-nya tampil di samping. Paket yang melewati estimasi tiba otomatis
            ditandai Terlambat.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="neu-raised shrink-0"
          onClick={() => alert('Fitur ekspor CSV segera hadir — data yang tampil masih contoh.')}
        >
          Ekspor data
        </Button>
      </header>

      {/* Ringkasan: kartu bisa diklik menuju saringannya (DESIGN §5.3-D.5) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan pengiriman">
        <StatCard
          title="Dalam perjalanan"
          value={`${countFor('IN_TRANSIT')} paket`}
          icon={<Truck className="h-5 w-5" aria-hidden="true" />}
          trendText="Paket sedang diproses kurir"
          trendDirection="neutral"
          onClick={() => setStatusFilter('IN_TRANSIT')}
        />
        <StatCard
          title="Sudah terkirim"
          value={`${countFor('DELIVERED')} paket`}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          trendText="Berhasil diterima pelanggan"
          trendDirection="neutral"
          onClick={() => setStatusFilter('DELIVERED')}
        />
        <StatCard
          title="Perlu perhatian"
          value={`${delayedCount} paket`}
          icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
          trendText="Pengiriman terlambat"
          trendDirection="neutral"
          exceptionTag={delayedCount > 0 ? 'Hubungi kurir' : undefined}
          exceptionType="warning"
          onClick={() => setStatusFilter('DELAYED')}
        />
      </section>

      {/* Daftar + detail tracking (DESIGN IA §4.6) */}
      <section className="glass rounded-2xl p-5" aria-label="Daftar dan detail pelacakan pengiriman">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="shipment-list-title" className="text-base font-semibold text-slate-900">
              Daftar pengiriman
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Cari berdasarkan order, resi, pelanggan, kota, atau nama kurir.
            </p>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              Menampilkan {filteredShipments.length} dari {shipments.length} pengiriman
              {selectionVisible && selectedShipment
                ? ` — dipantau: ${selectedShipment.shipmentNumber} ke ${selectedShipment.destinationCity}.`
                : ' — pilih satu untuk dipantau.'}
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="shipment-search" className="sr-only">
              Cari pengiriman
            </label>
            <input
              id="shipment-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari resi, order, kota..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <FilterTabs
            options={SHIPMENT_FILTER_OPTIONS.map((option) => ({ ...option, count: countFor(option.id) }))}
            activeId={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter status pengiriman"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          {/* Daftar kiriman */}
          <div className="space-y-3" aria-live="polite">
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => {
                const effective = effectiveOf(shipment);
                const style = statusStyles[effective];
                const isActive = selectedShipment?.id === shipment.id;
                return (
                  <button
                    type="button"
                    key={shipment.id}
                    onClick={() => {
                      setSelectedShipment(shipment);
                      setCopyFeedback(null);
                    }}
                    aria-pressed={isActive}
                    aria-current={isActive ? true : undefined}
                    aria-label={`Pantau ${shipment.shipmentNumber} ke ${shipment.destinationCity}, ${shipmentStatusLabels[effective]}`}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
                      isActive
                        ? 'neu-pressed border-teal-300 bg-teal-50/60'
                        : 'border-slate-200 bg-white/85 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-numbers text-sm font-bold text-slate-900">
                            {shipment.shipmentNumber}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {shipment.courier}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-[#0D7A70] px-2 py-0.5 text-[10px] font-semibold text-white">
                              Sedang dipantau
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Order {shipment.orderNumber} · {shipment.customerName}
                        </div>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}
                      >
                        {style.icon}
                        {shipmentStatusLabels[effective]}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-3">
                      <div>
                        <div className="text-slate-400">Nomor resi</div>
                        <div className="mt-1 truncate font-mono-numbers font-semibold text-slate-800">
                          {shipment.trackingNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Tujuan</div>
                        <div className="mt-1 font-semibold text-slate-800">{shipment.destinationCity}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Estimasi tiba</div>
                        <div className="mt-1 font-mono-numbers font-semibold text-slate-800">
                          {shipment.estimatedDelivery}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : shipments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
                <Truck className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Belum ada pengiriman tercatat</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Kiriman baru muncul di sini begitu barang diserahkan ke ekspedisi.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Pengiriman tidak ditemukan</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Coba ubah kata kunci atau pilih status lain.
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                  Reset filter
                </Button>
              </div>
            )}
          </div>

          {/* Panel detail tracking */}
          {selectionVisible && selectedShipment && (
            <aside className="h-fit rounded-xl border border-slate-200 bg-white/85 p-5 xl:sticky xl:top-4" aria-label="Detail tracking pengiriman">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Detail tracking · {selectedShipment.shipmentNumber}
                  </p>
                  <h3 className="mt-1 font-mono-numbers text-lg font-bold text-slate-900">
                    {selectedShipment.trackingNumber}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedShipment.courier} · {selectedShipment.service}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[effectiveOf(selectedShipment)].chip
                  }`}
                >
                  {statusStyles[effectiveOf(selectedShipment)].icon}
                  {shipmentStatusLabels[effectiveOf(selectedShipment)]}
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-[#0D7A70]" aria-hidden="true" />
                  Tujuan: {selectedShipment.destinationCity}
                </div>
                <div className="mt-2 flex items-center gap-2 text-slate-500">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Estimasi tiba:{' '}
                  <span className="font-mono-numbers font-semibold text-slate-700">
                    {selectedShipment.estimatedDelivery}
                  </span>
                </div>
                <div className="mt-2 text-slate-500">
                  Order <span className="font-mono-numbers font-semibold text-slate-700">{selectedShipment.orderNumber}</span>
                  {' · '}Dikirim <span className="font-mono-numbers">{selectedShipment.shippedAt}</span>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Riwayat perjalanan
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Diurut dari awal kirim sampai kabar terbaru di bawah.
                </p>
                {selectedShipment.timeline.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Kurir belum mengirim kabar perjalanan paket ini.
                  </p>
                ) : (
                  <ol className="mt-3" aria-label="Riwayat perjalanan paket dari awal sampai terbaru">
                    {selectedShipment.timeline.map((step, index) => {
                      const isLatest = index === selectedShipment.timeline.length - 1;
                      return (
                        <li
                          key={`${step.timestamp}-${step.status}-${index}`}
                          aria-current={isLatest ? 'step' : undefined}
                          className="relative flex gap-3 pb-5 last:pb-0"
                        >
                          <div className="relative flex w-5 justify-center" aria-hidden="true">
                            <span
                              className={`z-10 mt-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                isLatest ? 'bg-[#0D7A70] ring-1 ring-[#0D7A70]' : 'bg-slate-300 ring-1 ring-slate-300'
                              }`}
                            />
                            {!isLatest && <span className="absolute top-3 h-full w-px bg-slate-300" />}
                          </div>
                          <div className="-mt-1 min-w-0">
                            {isLatest && (
                              <span className="mb-1 inline-block rounded-full bg-[#0D7A70] px-2 py-0.5 text-[10px] font-semibold text-white">
                                Posisi terkini
                              </span>
                            )}
                            <div
                              className={`text-xs ${isLatest ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}
                            >
                              {step.description}
                            </div>
                            <div className="mt-1 font-mono-numbers text-[11px] text-slate-500">
                              {step.timestamp} · {step.location}
                            </div>
                            <div className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                              Kode kurir: {step.status}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                className="neu-raised mt-5 w-full"
                leftIcon={
                  copyFeedback === 'copied' ? (
                    <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                }
                onClick={() => copyTrackingNumber(selectedShipment.trackingNumber)}
              >
                {copyFeedback === 'copied'
                  ? 'Nomor resi tersalin!'
                  : copyFeedback === 'failed'
                  ? 'Gagal menyalin — catat manual'
                  : 'Salin nomor resi'}
              </Button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                Tempel nomor ini di aplikasi kurir untuk cek lanjutan.
              </p>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
};
