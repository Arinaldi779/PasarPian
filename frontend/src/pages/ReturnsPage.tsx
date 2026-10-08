import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterTabs } from '../components/common/FilterTabs';
import { Modal } from '../components/common/Modal';
import { returnActionLabels, returnConditionLabels, returnStatusLabels } from '../utils/returnDisplay';
import type { ReturnStatus } from '../utils/returnDisplay';
import { formatRupiah } from '../utils/dashboardInsights';
import type { Order, ReturnRequest } from '../types';

/**
 * Halaman Pengajuan Retur — spesifikasi: PRD #24 dan DESIGN §7.5.
 *
 * Apa ini? Daftar keluhan + panel inspeksi, disposisi, dan keputusan.
 * Untuk apa? OPERATIONS/WAREHOUSE memeriksa barang fisik, menentukan nasib
 * barang (disposisi) dan nasib uang pelanggan (refund) dalam satu tempat.
 * Kenapa ada? Retur menyentuh tiga modul (stok, uang, pelanggan) — tanpa layar
 * khusus, keputusannya tercecer dan refund tidak terlacak.
 *
 * Alur status: MENUNGGU → DISETUJUI/DITOLAK → SELESAI (refund dibayar).
 * Persetujuan = uang keluar → wajib konfirmasi dua-tahap (DESIGN §11.3).
 * Eksekusi disposisi fisik (restock/perbaikan/kirim pengganti) adalah workflow
 * backend; halaman ini mencatat keputusannya, bukan mengerjakannya.
 */
interface ReturnsPageProps {
  /** Pengajuan retur dari App (state — keputusan langsung terlihat). */
  returns: ReturnRequest[];
  /** Pesanan dari App — dicocokkan per nomor untuk panel "pesanan asal". */
  orders: Order[];
  /** Mengubah status pengajuan; guard transisi + audit ditangani App. */
  onDecide: (returnId: string, nextStatus: ReturnRequest['status']) => void;
  /** Membuka panel detail 360° pesanan asal (ketertelusuran, DESIGN §5.33). */
  onSelectOrder?: (order: Order) => void;
}

/** Filter status tab — seluruh status lifecycle retur. */
type ReturnFilter = 'ALL' | ReturnStatus;

/** Opsi tab filter — seluruh status lifecycle retur plus Semua. */
const RETURN_FILTER_OPTIONS: { id: ReturnFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua pengajuan' },
  { id: 'PENDING_INSPECTION', label: returnStatusLabels.PENDING_INSPECTION },
  { id: 'APPROVED', label: returnStatusLabels.APPROVED },
  { id: 'REJECTED', label: returnStatusLabels.REJECTED },
  { id: 'COMPLETED', label: returnStatusLabels.COMPLETED },
];

/** Keputusan yang menunggu konfirmasi dua-tahap pada dialog. */
interface PendingDecision {
  /** Pengajuan yang diputuskan. */
  item: ReturnRequest;
  /** Status tujuan yang diminta. */
  next: 'APPROVED' | 'REJECTED' | 'COMPLETED';
}

/** Gaya badge status: ikon + tulisan (AGENTS #19). */
const statusStyles: Record<ReturnStatus, { chip: string; icon: React.ReactNode }> = {
  PENDING_INSPECTION: {
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  APPROVED: {
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  REJECTED: {
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  COMPLETED: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

export const ReturnsPage: React.FC<ReturnsPageProps> = ({ returns, orders, onDecide, onSelectOrder }) => {
  const [selectedStatus, setSelectedStatus] = useState<ReturnFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(returns[0]?.id ?? null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Keputusan yang sedang dikonfirmasi pada dialog dua-tahap (DESIGN §11.3).
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const filteredReturns = useMemo(
    () =>
      returns.filter((item) => {
        if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
        if (!query) return true;
        return [item.returnNumber, item.orderNumber, item.customerName, item.productName, item.reason].some(
          (value) => value.toLowerCase().includes(query),
        );
      }),
    [returns, selectedStatus, query],
  );

  const countFor = (status: ReturnFilter) =>
    status === 'ALL' ? returns.length : returns.filter((item) => item.status === status).length;

  const pendingCount = countFor('PENDING_INSPECTION');
  const refundInProcess = returns
    .filter((item) => item.status === 'APPROVED' || item.status === 'PENDING_INSPECTION')
    .reduce((sum, item) => sum + item.refundAmount, 0);
  const finishedCount = countFor('COMPLETED') + countFor('REJECTED');

  const selected = returns.find((item) => item.id === selectedId) ?? null;
  const relatedOrder = selected
    ? orders.find((order) => order.orderNumber === selected.orderNumber)
    : undefined;

  /** Menjalankan keputusan sesudah dialog konfirmasi + menampilkan hasilnya (AGENTS #14). */
  const confirmDecision = () => {
    if (!pendingDecision) return;
    const { item, next } = pendingDecision;
    onDecide(item.id, next);
    setPendingDecision(null);
    setNotice(
      next === 'APPROVED'
        ? { type: 'success', message: `Pengajuan ${item.returnNumber} disetujui. Refund ${formatRupiah(item.refundAmount)} diteruskan ke Keuangan.` }
        : next === 'REJECTED'
        ? { type: 'error', message: `Pengajuan ${item.returnNumber} ditolak. Tidak ada refund yang diproses.` }
        : { type: 'success', message: `Pengajuan ${item.returnNumber} ditandai selesai. Refund dianggap sudah dibayarkan.` },
    );
  };

  /** Mengembalikan saringan ke awal — dipakai empty state. */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retur · penanganan kasus
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengajuan retur</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Tangani setiap pengajuan sebagai satu kasus: periksa keluhan, cocokkan pesanan asal, lalu putuskan
            tindakan barang dan refundnya. Alur: Pengajuan → Inspeksi → Keputusan → Refund/Disposisi.
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

      {/* Ringkasan: dua kartu pertama menuju saringannya (DESIGN §5.3-D.5) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan pengajuan retur">
        <StatCard
          title="Menunggu inspeksi"
          value={`${pendingCount} pengajuan`}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          trendText="Barang fisik menunggu pemeriksaan gudang"
          trendDirection="neutral"
          exceptionTag={pendingCount > 0 ? 'Perlu diperiksa' : undefined}
          exceptionType="warning"
          onClick={() => setSelectedStatus('PENDING_INSPECTION')}
        />
        <StatCard
          title="Nilai refund diproses"
          value={formatRupiah(refundInProcess)}
          icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
          trendText="Untuk pengajuan yang masih diproses; nominal final ikut hasil inspeksi"
          trendDirection="neutral"
          onClick={() => setSelectedStatus('APPROVED')}
        />
        <StatCard
          title="Sudah ditangani"
          value={`${finishedCount} pengajuan`}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          trendText="Selesai atau ditolak, tidak perlu tindakan lagi"
          trendDirection="neutral"
        />
      </section>

      {/* Daftar + detail */}
      <section className="glass rounded-2xl p-5" aria-labelledby="returns-title">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="returns-title" className="text-base font-semibold text-slate-900">
              Daftar dan penanganan kasus
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Langkah 1 — pilih satu kasus. Langkah 2 — periksa dan putuskan pada panel keputusan.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="returns-search" className="sr-only">
              Cari pengajuan retur
            </label>
            <input
              id="returns-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nomor retur, order, produk, alasan..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <FilterTabs
            options={RETURN_FILTER_OPTIONS.map((option) => ({ ...option, count: countFor(option.id) }))}
            activeId={selectedStatus}
            onChange={setSelectedStatus}
            ariaLabel="Filter status pengajuan retur"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          {/* Daftar pengajuan */}
          <div className="space-y-3" aria-live="polite">
            {filteredReturns.length > 0 ? (
              filteredReturns.map((item) => {
                const style = statusStyles[item.status];
                const isActive = selected?.id === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setNotice(null);
                    }}
                    aria-pressed={isActive}
                    aria-label={`Pilih ${item.returnNumber} milik ${item.customerName}, ${returnStatusLabels[item.status]}`}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
                      isActive
                        ? 'neu-pressed border-teal-300 bg-teal-50/60'
                        : 'border-slate-200 bg-white/85 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-numbers text-sm font-bold text-slate-900">
                            {item.returnNumber}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono-numbers text-[10px] font-semibold text-slate-600">
                            {item.orderNumber}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{item.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.productName} · {item.variant} · {item.quantity} unit
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}
                      >
                        {style.icon}
                        {returnStatusLabels[item.status]}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                      <span className="min-w-0 flex-1 truncate text-slate-500">
                        Alasan: <span className="text-slate-700">{item.reason}</span>
                      </span>
                      <span className="shrink-0 font-mono-numbers font-semibold text-slate-800">
                        {item.status === 'REJECTED' ? 'Tanpa refund' : formatRupiah(item.refundAmount)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : returns.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Belum ada pengajuan retur</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Keluhan pelanggan yang masuk akan muncul di sini untuk diperiksa.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Pengajuan tidak ditemukan</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Coba ubah kata kunci atau pilih status lain.
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                  Reset filter
                </Button>
              </div>
            )}
          </div>

          {/* Panel detail */}
          {selected ? (
            <aside className="h-fit rounded-xl border border-slate-200 bg-white/85 p-5 xl:sticky xl:top-4" aria-label={`Keputusan kasus ${selected.returnNumber}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Kasus aktif · detail dan keputusan
                  </p>
                  <h3 className="mt-1 font-mono-numbers text-lg font-bold text-slate-900">
                    {selected.returnNumber}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Diajukan {selected.requestDate} oleh {selected.customerName}
                  </p>
                  <ol aria-label="Posisi kasus dalam alur" className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium">
                    {(['Pengajuan', 'Inspeksi', 'Keputusan', 'Refund/Disposisi'] as const).map((step, index) => {
                      const currentStep =
                        selected.status === 'PENDING_INSPECTION' ? 1 : selected.status === 'APPROVED' ? 3 : 4;
                      const isDone = index < currentStep;
                      const isCurrent = index === currentStep;
                      return (
                        <li key={step} className="flex items-center gap-1.5">
                          {index > 0 && (
                            <span aria-hidden="true" className="text-slate-300">
                              →
                            </span>
                          )}
                          <span
                            aria-current={isCurrent ? 'step' : undefined}
                            className={
                              isDone
                                ? 'text-[#0D7A70]'
                                : isCurrent
                                ? 'font-semibold text-slate-900'
                                : 'text-slate-400'
                            }
                          >
                            {step}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[selected.status].chip}`}
                >
                  {statusStyles[selected.status].icon}
                  {returnStatusLabels[selected.status]}
                </span>
              </div>

              {notice && (
                <p
                  role="status"
                  className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    notice.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {notice.message}
                </p>
              )}

              {/* Pesanan asal: ketertelusuran Retur → Pesanan (DESIGN §7.5 + IA) */}
              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pesanan asal</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono-numbers font-semibold text-slate-900">{selected.orderNumber}</span>
                  {relatedOrder && <StatusBadge status={relatedOrder.status} size="sm" />}
                </div>
                {relatedOrder ? (
                  <>
                    <dl className="mt-2 space-y-1 text-slate-600">
                      <div className="flex justify-between gap-2">
                        <dt>Total pesanan</dt>
                        <dd className="font-mono-numbers font-semibold text-slate-800">
                          {formatRupiah(relatedOrder.total)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt>Status pembayaran</dt>
                        <dd>
                          <StatusBadge status={relatedOrder.paymentStatus} size="sm" />
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Kota pelanggan</dt>
                        <dd className="font-semibold text-slate-800">{relatedOrder.customerCity}</dd>
                      </div>
                    </dl>
                    {onSelectOrder && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="neu-raised mt-3 w-full"
                        onClick={() => onSelectOrder(relatedOrder)}
                      >
                        Buka detail pesanan <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-slate-500">Pesanan asal tidak ditemukan untuk nomor ini. Cocokkan kembali nomor pesanan pada pengajuan.</p>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Alasan pelanggan</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-800">“{selected.reason}”</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {selected.productName} · {selected.variant} · {selected.quantity} unit
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kondisi barang</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {returnConditionLabels[selected.condition]?.label ?? selected.condition}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {returnConditionLabels[selected.condition]?.hint ?? ''}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {selected.status === 'PENDING_INSPECTION' ? 'Rencana tindakan' : 'Tindakan barang'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {returnActionLabels[selected.action]?.label ?? selected.action}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {returnActionLabels[selected.action]?.hint ?? ''}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Nilai refund</p>
                  <p className="mt-1 text-[11px] text-slate-500">Diteruskan ke halaman Keuangan.</p>
                </div>
                <p className="font-mono-numbers text-lg font-bold text-slate-900">
                  {selected.status === 'REJECTED' ? 'Rp 0' : formatRupiah(selected.refundAmount)}
                </p>
              </div>

              {selected.status === 'PENDING_INSPECTION' && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-slate-700">Keputusan pengajuan</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Setujui bila keluhan terbukti, lalu refund diteruskan ke tim keuangan. Tolak bila barang
                    tidak memenuhi syarat retur. Keduanya meminta konfirmasi karena final.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={() => setPendingDecision({ item: selected, next: 'APPROVED' })}
                    >
                      Setujui pengajuan
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      leftIcon={<XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={() => setPendingDecision({ item: selected, next: 'REJECTED' })}
                    >
                      Tolak pengajuan
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'APPROVED' && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-slate-700">Penyelesaian refund</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Tandai selesai setelah uang dikembalikan ke pelanggan.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="neu-raised mt-3 w-full"
                    onClick={() => setPendingDecision({ item: selected, next: 'COMPLETED' })}
                  >
                    Tandai refund selesai
                  </Button>
                </div>
              )}

              {(selected.status === 'REJECTED' || selected.status === 'COMPLETED') && (
                <p className="mt-5 border-t border-slate-200 pt-4 text-[11px] leading-4 text-slate-500">
                  Pengajuan ini sudah tidak memerlukan tindakan. Riwayat keputusan tetap dapat dilihat oleh tim terkait.
                </p>
              )}
            </aside>
          ) : (
            <aside className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-xs text-slate-500">
              Pilih salah satu pengajuan untuk melihat detailnya.
            </aside>
          )}
        </div>
      </section>

      {/* Dialog konfirmasi dua-tahap (DESIGN §11.3): persetujuan = uang keluar */}
      <Modal
        isOpen={pendingDecision !== null}
        onClose={() => setPendingDecision(null)}
        title={
          pendingDecision?.next === 'APPROVED'
            ? `Setujui ${pendingDecision.item.returnNumber}?`
            : pendingDecision?.next === 'REJECTED'
            ? `Tolak ${pendingDecision.item.returnNumber}?`
            : `Selesaikan ${pendingDecision?.item.returnNumber ?? ''}?`
        }
        subtitle={
          pendingDecision?.next === 'APPROVED'
            ? 'Tindakan destruktif — refund diteruskan ke Keuangan.'
            : pendingDecision?.next === 'REJECTED'
            ? 'Keputusan final — pelanggan tidak menerima refund.'
            : 'Penutupan administrasi sesudah refund dibayarkan.'
        }
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPendingDecision(null)}>
              Kembali (aman)
            </Button>
            <Button
              variant={pendingDecision?.next === 'APPROVED' ? 'destructive' : 'primary'}
              size="sm"
              onClick={confirmDecision}
            >
              {pendingDecision?.next === 'APPROVED'
                ? 'Ya, setujui & teruskan refund'
                : pendingDecision?.next === 'REJECTED'
                ? 'Ya, tolak pengajuan'
                : 'Ya, tandai selesai'}
            </Button>
          </>
        }
      >
        {pendingDecision && (
          <div className="space-y-3 text-sm">
            <dl className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Pelanggan:</dt>
                <dd className="text-right font-medium text-slate-800">{pendingDecision.item.customerName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Barang:</dt>
                <dd className="text-right font-medium text-slate-800">
                  {pendingDecision.item.productName} · {pendingDecision.item.quantity} unit
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Disposisi:</dt>
                <dd className="text-right font-medium text-slate-800">
                  {returnActionLabels[pendingDecision.item.action]?.label ?? pendingDecision.item.action}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Nilai refund:</dt>
                <dd className="font-mono-numbers font-semibold text-slate-800">
                  {pendingDecision.next === 'REJECTED' ? 'Rp 0 (tanpa refund)' : formatRupiah(pendingDecision.item.refundAmount)}
                </dd>
              </div>
            </dl>
            {pendingDecision.next === 'COMPLETED' && (
              <p className="text-xs leading-5 text-slate-600">
                Pastikan uang sudah benar-benar sampai ke pelanggan sebelum menutup pengajuan ini.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
