/**
 * Deretan tab/chip filter cepat — spesifikasi: DESIGN §5.3-E (Tab Aktif Neumorph).
 *
 * Apa ini? Komponen generik untuk saringan berbentuk tab berjumlah (status pesanan,
 * kategori katalog, dan saringan halaman lain nanti).
 * Untuk apa? Satu tampilan tab yang sama di semua halaman supaya pengguna tidak
 * belajar ulang di tiap modul (AGENTS #31: konsisten).
 * Kenapa ada? Aturan temanya eksplisit — tab AKTIF tampil tertekan (`neu-pressed`
 * + aksen teal + badge solid) dan tab non-aktif tampil rata — jadi polanya
 * dikunci di satu komponen, bukan ditulis ulang per halaman.
 * Umpan balik saat mouse ditahan diatur class `filter-tab` di index.css
 * (bayangan cekung + sedikit mengecil) supaya klik terasa hidup sebelum tab aktif.
 */
export interface FilterTabOption<T extends string> {
  /** Nilai unik tab, dikirim ke onChange saat diklik. */
  id: T;
  /** Label bahasa bisnis yang tampil. */
  label: string;
  /** Jumlah item tab ini; disembunyikan bila tidak diisi. */
  count?: number;
  /** Ikon opsional di kotak kiri (dipakai tab tahap Pemenuhan). */
  icon?: React.ReactNode;
  /** Penjelasan satu baris di bawah label (dipakai tab tahap Pemenuhan). */
  description?: string;
}

interface FilterTabsProps<T extends string> {
  /** Daftar tab yang dirender berurutan. */
  options: FilterTabOption<T>[];
  /** Tab yang sedang aktif — selalu tampil tertekan. */
  activeId: T;
  /** Dipanggil dengan id tab yang diklik. */
  onChange: (id: T) => void;
  /** Label aksesibilitas grup tab, mis. "Filter status pesanan". */
  ariaLabel: string;
}

export function FilterTabs<T extends string>({ options, activeId, onChange, ariaLabel }: FilterTabsProps<T>) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.id === activeId;
        const hasCardLayout = option.icon !== undefined || option.description !== undefined;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`filter-tab min-h-10 shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
              hasCardLayout ? 'flex min-h-[68px] flex-1 items-center gap-3 text-left' : ''
            } ${
              isActive
                ? 'neu-pressed border-teal-300 bg-teal-50/80 text-[#0D7A70]'
                : 'border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {option.icon && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? 'bg-[#0D7A70] text-white' : 'bg-slate-100 text-slate-500'
                }`}
                aria-hidden="true"
              >
                {option.icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono-numbers text-[10px] ${
                      isActive ? 'bg-[#0D7A70] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {option.count}
                  </span>
                )}
              </span>
              {option.description && (
                <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                  {option.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
