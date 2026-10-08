import React from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';

/**
 * Tema tampilan aplikasi: Terang (default), Gelap, Baca (kertas sepia).
 * Apa ini? Satu-satunya nilai tema yang sah di seluruh aplikasi.
 * Untuk apa? State di App + `data-theme` di <html> + lapisan override CSS.
 * Kenapa 3 nilai tetap (bukan string bebas)? Pilihan terbatas = tidak ada
 * salah ketik tema yang lolos validasi saat baca localStorage.
 */
export type AppTheme = 'light' | 'dark' | 'baca';

interface ThemeSwitcherProps {
  /** Tema aktif — tombol yang cocok tampil tertekan (bahasa FilterTabs). */
  theme: AppTheme;
  /** Dipanggil dengan tema baru saat pengguna memilih. */
  onChange: (theme: AppTheme) => void;
}

/** Tiga opsi tema: ikon + label Indonesia (label tampil sebagai tooltip). */
const themeOptions: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Terang', icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
  { id: 'dark', label: 'Gelap', icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
  { id: 'baca', label: 'Baca', icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> },
];

/**
 * Pengalih tema Terang / Gelap / Baca.
 *
 * Apa ini? Tiga tombol ikon dalam satu pil. Untuk apa? Dipakai header
 * aplikasi (post-login) dan halaman masuk (pre-login) — satu komponen,
 * dua konsumen. Kenapa ikon + tooltip (bukan teks)? Hemat ruang header;
 * `aria-label` + `title` Indonesia menjaga kejelasan (AGENTS #31).
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChange }) => {
  return (
    <div
      role="group"
      aria-label="Pilih tema tampilan"
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-white/85 p-0.5"
    >
      {themeOptions.map((option) => {
        const isActive = option.id === theme;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            aria-label={`Tema ${option.label.toLowerCase()}`}
            title={`Tema ${option.label.toLowerCase()}`}
            onClick={() => onChange(option.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
              isActive
                ? 'neu-pressed bg-teal-50 text-[#0D7A70]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
};
