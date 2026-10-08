import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, PackageSearch, ShieldAlert, Truck } from 'lucide-react';
import type { ExceptionItem, ExceptionItemId } from '../../utils/dashboardInsights';

/**
 * Batang pengecualian operasional di posisi paling atas halaman Beranda.
 *
 * Apa ini? Komponen presentasional: hanya merender daftar kartu exception
 * yang sudah dihitung dashboardInsights.buildExceptionItems.
 * Untuk apa? Menjawab PRD #26 — "apa yang terlambat / bermasalah / butuh tindakan" —
 * dalam sekali lihat (DESIGN §8.1 butir 2).
 * Kenapa ada? Sengaja tidak menghitung apa pun di sini supaya logika bisnis berada
 * di satu tempat (utils) dan komponen tetap bisa dipakai ulang (AGENTS #11).
 */
interface ExceptionBarProps {
  /** Kartu exception hasil hitungan; kategori yang aman tetap dikirim agar ditampilkan bertanda hijau. */
  items: ExceptionItem[];
  /** Callback drill-down: membuka tab yang sesuai dengan isi kartu. */
  onNavigateTab?: (tab: string) => void;
}

/** Pemilih ikon per kategori — dipisah dari data supaya utils tidak bergantung pada React. */
const iconById: Record<ExceptionItemId, React.ReactNode> = {
  stalledOrders: <Clock className="h-4 w-4" aria-hidden="true" />,
  lowStock: <PackageSearch className="h-4 w-4" aria-hidden="true" />,
  delayedShipments: <Truck className="h-4 w-4" aria-hidden="true" />,
  unpaidBills: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
  pendingReturns: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
};

export const ExceptionBar: React.FC<ExceptionBarProps> = ({ items, onNavigateTab }) => {
  const actionCount = items.filter((item) => item.needsAction).length;

  // Tidak ada exception sama sekali → panel keberhasilan, bukan ruang kosong (AGENTS #14).
  if (items.length === 0 || actionCount === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-4 sm:flex-row sm:items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Tidak ada hal mendesak saat ini</p>
          <p className="text-xs text-emerald-800">
            Pesanan, stok, pengiriman, tagihan, dan retur masih dalam batas aman. Lanjutkan pekerjaan berikutnya.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const icon = iconById[item.id];
          const isOk = !item.needsAction;

          // Kartu aman tidak perlu drill-down mendesak, tetap diklik agar pengguna bisa memeriksa.
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigateTab?.(item.targetTab)}
                aria-label={`${item.title}. ${item.detail}. Buka ${item.targetTab}`}
                title={`${item.title} — ${item.detail}. Klik untuk membuka halaman terkait`}
                className={`group flex min-h-16 w-full items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
                  isOk
                    ? 'border-emerald-200/80 bg-white/90 hover:border-emerald-400'
                    : item.tone === 'danger'
                    ? 'border-rose-200/80 bg-white/90 hover:border-rose-400'
                    : 'border-amber-300/80 bg-white/90 hover:border-amber-400'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isOk ? 'bg-emerald-500 text-white' : item.tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">{item.title}</span>
                    <span className="block truncate text-[11px] text-slate-500">{item.detail}</span>
                  </span>
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    isOk ? 'text-emerald-700' : item.tone === 'danger' ? 'text-rose-700' : 'text-amber-700'
                  }`}
                >
                  {isOk ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Aman
                    </span>
                  ) : (
                    <span className="font-mono-numbers transition-transform group-hover:translate-x-0.5">{item.ref} →</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
