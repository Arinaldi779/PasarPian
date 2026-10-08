import React from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Info } from 'lucide-react';

/**
 * Kartu metrik (KPI) di baris ringkasan dashboard.
 * Menampilkan label, nilai, tren, dan tag pengecualian dalam satu kartu yang bisa diklik
 * untuk membuka data pembentuk angka (drill-down) — spesifikasi DESIGN.md §5.3-D.
 * Dirender sebagai <button> saat punya onClick supaya bisa diakses keyboard (DESIGN §12.1).
 */
interface StatCardProps {
  /** Label metrik (DESIGN 5.3-D: 14px medium, warna muted) */
  title: string;
  /** Nilai utama (DESIGN 5.3-D: 24px/28px bold, angka tabular) */
  value: string | number;
  /** Ikon kategori di pojok kanan kartu; warnanya menyesuaikan tema, jadi cukup elemen ikonnya saja. */
  icon: React.ReactNode;
  /** Teks tren/keterangan periode, misal "Periode 1–6 Okt 2026". Opsional. */
  trendText?: string;
  /** Arah panah tren: up = hijau, down = merah, neutral = abu tanpa panah. */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Indikator pengecualian: item yang butuh tindakan */
  exceptionTag?: string;
  /** Warna tag pengecualian: danger = merah, warning = kuning, info = biru (AGENTS #20). */
  exceptionType?: 'danger' | 'warning' | 'info';
  /** Drill-down: tujuan kartu ke data yang membentuk angka tersebut */
  onClick?: () => void;
  /** Penjelasan angka saat kursor hover (title tooltip) + penanda ikon info.
      Opsional; hanya diisi bila angka butuh dijelaskan (mis. KPI dashboard). */
  hint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trendText,
  trendDirection = 'neutral',
  exceptionTag,
  exceptionType = 'warning',
  onClick,
  hint,
}) => {
  const isClickable = !!onClick;

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
          {title}
          {hint && <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0D7A70]">
          {icon}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono-numbers text-2xl font-bold leading-7 tracking-tight text-slate-900">
          {value}
        </span>

        {trendText && (
          <span className={`inline-flex items-center text-xs font-semibold ${
            trendDirection === 'up' ? 'text-emerald-700' : trendDirection === 'down' ? 'text-rose-700' : 'text-slate-500'
          }`}>
            {trendDirection === 'up' && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
            {trendDirection === 'down' && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            {trendText}
          </span>
        )}
      </div>

      {(exceptionTag || isClickable) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5">
          {exceptionTag ? (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
              exceptionType === 'danger'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : exceptionType === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-sky-200 bg-sky-50 text-sky-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                exceptionType === 'danger' ? 'bg-rose-500' : exceptionType === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
              }`} />
              {exceptionTag}
            </span>
          ) : <span />}
          {isClickable && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
              Buka detail <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </>
  );

  // Kartu yang bisa diklik dirender sebagai <button> agar dapat diakses keyboard (DESIGN 12.1).
  // `hint` diteruskan sebagai title: tooltip native saat hover + terbaca tooltip browser.
  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={hint}
        className="glass w-full cursor-pointer rounded-xl p-5 text-left transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0D7A70] focus:ring-offset-2"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-5" title={hint}>
      {body}
    </div>
  );
};
