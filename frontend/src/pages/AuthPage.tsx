import React, { useId, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Shirt,
  Store,
  TreePine,
  UserPlus,
  Waves,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { FilterTabs } from '../components/common/FilterTabs';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import type { AppTheme } from '../components/common/ThemeSwitcher';
// Foto Pasar Terapung asli dari aset proyek — latar panel kiri (permintaan user).
import pasarTerapung from '../assets/images/pasar terapung.jpg';

/**
 * Mode tampilan autentikasi — dua form dalam satu halaman (PRD §8).
 * Apa ini? Pilihan antara Masuk dan Daftar. Untuk apa? Menentukan field
 * yang dirender tanpa pindah halaman. Kenapa ada? Keduanya gerbang yang
 * sama; memisah route hanya menambah navigasi tanpa manfaat (AGENTS #28).
 */
type AuthMode = 'LOGIN' | 'REGISTER';

interface AuthPageProps {
  /** Mencoba masuk dengan akun mock; validasi status dilakukan App. */
  onLogin: (email: string, password: string) => string | null;
  /** Mengirim permintaan pendaftaran lokal tanpa langsung memberi akses. */
  onRegister: (name: string, email: string, password: string) => string;
  /** Mengembalikan status integrasi Google OAuth (saat ini: belum tersambung). */
  onGoogleLogin: () => string;
  /** Tema tampilan aktif — halaman masuk ikut tema yang tersimpan. */
  theme: AppTheme;
  /** Dipanggil saat pengguna memilih tema Terang/Gelap/Baca. */
  onChangeTheme: (theme: AppTheme) => void;
}

/**
 * Empat pilar identitas visual Banua (DESIGN §2.2) untuk panel kiri.
 * Apa ini? Data konten brand. Untuk apa? Dirender sebagai daftar di bawah
 * gambar supaya halaman masuk berakar pada identitas produk, bukan stok
 * template. Kenapa di data? Agar urutan dan teksnya konsisten dan mudah diubah.
 */
const brandPillars: { title: string; note: string; icon: React.ReactNode }[] = [
  { title: 'Sungai Martapura', note: 'Alur barang & data mengalir lancar', icon: <Waves className="h-4 w-4" aria-hidden="true" /> },
  { title: 'Kain Sasirangan', note: 'Aksen hangat pada hal penting', icon: <Shirt className="h-4 w-4" aria-hidden="true" /> },
  { title: 'Kayu Ulin', note: 'Pondasi data kokoh & teraudit', icon: <TreePine className="h-4 w-4" aria-hidden="true" /> },
  { title: 'Pasar Terapung', note: 'Etika jual-beli yang terbuka', icon: <Store className="h-4 w-4" aria-hidden="true" /> },
];

/**
 * Ilustrasi fajar di Sungai Martapura dengan perahu pasar terapung.
 * Apa ini? Satu adegan SVG (langit fajar, bukit, air, tiga perahu klotok
 * dengan penjual ber-caping). Untuk apa? Latar panel kiri halaman masuk dan
 * strip versi kecil di layar ponsel.
 * Kenapa masih ada? Menjadi fallback bila foto `pasar terapung.jpg` gagal
 * dimuat (onError) — panel kiri tidak pernah kosong. Juga dipakai strip ponsel.
 * useId() membuat id gradien unik supaya dua instance adegan ini tidak tabrakan.
 */
const MartapuraScene: React.FC = () => {
  const uid = useId().replace(/:/g, '');
  const sky = `sky-${uid}`;
  const water = `water-${uid}`;
  const glow = `glow-${uid}`;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="42%" stopColor="#0A625A" />
          <stop offset="76%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={water} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A70" />
          <stop offset="55%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* langit fajar + matahari terbit di garis cakrawala */}
      <rect width="800" height="520" fill={`url(#${sky})`} />
      <circle cx="530" cy="486" r="170" fill={`url(#${glow})`} />
      <circle cx="530" cy="486" r="54" fill="#FDE68A" opacity="0.95" />

      {/* burung pagi */}
      <g stroke="#F8FAF9" strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M170 168 q10 -10 20 0 q10 -10 20 0" />
        <path d="M232 206 q8 -8 16 0 q8 -8 16 0" />
        <path d="M640 140 q8 -8 16 0 q8 -8 16 0" />
      </g>

      {/* dua jajar bukit — Kalimantan Selatan perbukitan rendah */}
      <path d="M0 502 L120 442 L242 486 L362 420 L502 478 L642 434 L800 494 L800 522 L0 522 Z" fill="#064E3B" opacity="0.92" />
      <path d="M0 522 L162 472 L302 512 L472 466 L622 510 L800 472 L800 546 L0 546 Z" fill="#0A625A" />

      {/* air sungai */}
      <rect y="516" width="800" height="384" fill={`url(#${water})`} />

      {/* pantulan matahari di air */}
      <g stroke="#FDE68A" strokeLinecap="round" opacity="0.5">
        <path d="M498 556 H566" strokeWidth="5" opacity="0.7" />
        <path d="M506 590 H558" strokeWidth="4" />
        <path d="M514 626 H550" strokeWidth="3" opacity="0.7" />
        <path d="M520 664 H544" strokeWidth="3" opacity="0.45" />
      </g>

      {/* riwayat ombak */}
      <g stroke="#CCFBF1" fill="none" strokeLinecap="round" opacity="0.16">
        <path d="M40 610 q40 -12 84 0" strokeWidth="3" />
        <path d="M660 656 q44 -14 92 0" strokeWidth="3" />
        <path d="M120 726 q52 -16 108 0" strokeWidth="4" />
        <path d="M540 774 q56 -16 116 0" strokeWidth="4" />
        <path d="M60 826 q64 -18 132 0" strokeWidth="5" />
        <path d="M470 856 q70 -18 146 0" strokeWidth="5" />
      </g>

      {/* perahu jauh — siluet kecil di kaki bukit */}
      <g transform="translate(468 546) scale(0.5)" opacity="0.85">
        <path d="M-120 -10 Q0 48 120 -10 L128 -20 Q0 30 -128 -20 Z" fill="#020617" />
        <circle cx="0" cy="-44" r="11" fill="#020617" />
        <path d="M-26 -46 L0 -78 L26 -46 Z" fill="#B45309" />
      </g>

      {/* perahu kanan — penjual membawa dagangan */}
      <g transform="translate(616 596) scale(0.74)">
        <path d="M-120 -10 Q0 48 120 -10 L128 -20 Q0 30 -128 -20 Z" fill="#020617" />
        <path d="M-116 -14 Q0 34 116 -14" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="3" fill="none" />
        <rect x="-84" y="-30" width="34" height="24" rx="5" fill="#FEF3C7" />
        <rect x="-46" y="-24" width="30" height="18" rx="5" fill="#D97706" />
        <path d="M46 -12 L96 20" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <rect x="-14" y="-46" width="28" height="40" rx="10" fill="#0F172A" />
        <circle cx="0" cy="-56" r="12" fill="#0F172A" />
        <path d="M-27 -58 L0 -92 L27 -58 Z" fill="#D97706" />
        <path d="M-31 -58 H31" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* perahu utama — pasar terapung di tengah adegan */}
      <g transform="translate(288 668)">
        <path d="M-138 -12 Q0 56 138 -12 L146 -24 Q0 36 -146 -24 Z" fill="#020617" />
        <path d="M-132 -17 Q0 42 132 -17" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" fill="none" />
        {/* keranjang & bungkusan dagangan */}
        <rect x="-104" y="-34" width="42" height="30" rx="6" fill="#FEF3C7" />
        <rect x="-60" y="-27" width="34" height="23" rx="6" fill="#F59E0B" />
        <rect x="-24" y="-32" width="30" height="28" rx="6" fill="#CCFBF1" />
        {/* penjual dengan caping */}
        <path d="M52 -14 L110 24" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <rect x="30" y="-58" width="34" height="48" rx="12" fill="#0F172A" />
        <circle cx="47" cy="-70" r="14" fill="#0F172A" />
        <path d="M17 -72 L47 -112 L77 -72 Z" fill="#D97706" />
        <path d="M12 -72 H82" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
        {/* boncengan sasirangan di buritan */}
        <rect x="88" y="-30" width="40" height="22" rx="6" fill="#0D7A70" />
        <rect x="94" y="-40" width="28" height="10" rx="4" fill="#14B8A6" />
      </g>

      {/* titik cahaya di air (kilau pagi) */}
      <g fill="#CCFBF1" opacity="0.35">
        <circle cx="150" cy="640" r="2.5" />
        <circle cx="370" cy="700" r="2" />
        <circle cx="700" cy="720" r="2.5" />
        <circle cx="250" cy="780" r="2" />
        <circle cx="620" cy="836" r="2.5" />
      </g>
    </svg>
  );
};

/**
 * Halaman masuk & pendaftaran PasarPian — spesifikasi: DESIGN §7.1 + §5.0.
 *
 * Apa ini? Gerbang autentikasi sebelum workspace ERP dirender.
 * Untuk apa? Menampilkan form email/password, tombol Google OAuth, dan
 * permintaan akses baru beserta pesan penolakan status akun.
 * Kenapa begini? Tata letak dua panel: kiri foto Pasar Terapung (identitas
 * Banua, DESIGN §2.2) dengan kartu kaca di atasnya; kanan panel tugas di atas
 * sheet `.page-backdrop` (konvensi semua halaman) supaya kaca punya latar
 * berwarna (§5.0 aturan 1) tanpa gradien hex sembarangan.
 *
 * Anti "AI slop" (audit desain): tanpa kicker uppercase generik, tanpa tumpukan
 * bayangan (tombol cukup shadow dari Button, bukan +neu-raised), tanpa gradien
 * dekoratif, catatan akses digabung ke kartu (bukan kotak keempat), disclosure
 * tanpa kotak, jarak kelipatan 4px, ikon pilar teal — amber hanya badge Banua.
 *
 * Simulasi frontend: password tidak pernah disimpan; verifikasi hash dan
 * session aman tetap milik backend (PRD §8.1, AGENTS #9/#10).
 */
export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister, onGoogleLogin, theme, onChangeTheme }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  /** Ganti mode dan bersihkan pesan + kata sandi agar tidak ada sisa input. */
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage(null);
    setPassword('');
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 8) {
      setMessage({ type: 'error', text: 'Masukkan email yang valid dan kata sandi minimal 8 karakter.' });
      return;
    }

    if (mode === 'LOGIN') {
      // App yang memutuskan: kredensial cocok? status akun ACTIVE?
      const error = onLogin(cleanEmail, password);
      setMessage(error ? { type: 'error', text: error } : null);
      return;
    }

    if (name.trim().length < 3) {
      setMessage({ type: 'error', text: 'Nama lengkap minimal 3 karakter.' });
      return;
    }
    setMessage({ type: 'success', text: onRegister(name.trim(), cleanEmail, password) });
    setPassword('');
  };

  // Input form: kesan tertekan neumorfik (area yang bisa diisi), fokus teal 2px.
  const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 neu-pressed outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/25';

  return (
    <main className="min-h-screen bg-[#F8FAF9] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Pengalih tema mengambang — halaman masuk tampil sebelum shell aplikasi. */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeSwitcher theme={theme} onChange={onChangeTheme} />
      </div>
      {/* Panel kiri: foto Pasar Terapung sebagai latar (permintaan user), SVG di
          bawahnya hanya sebagai fallback onError. Sticky + tinggi viewport:
          saat form Daftar memanjang, hanya panel kanan yang tumbuh — panel kiri
          tetap diam di tempat (bug layout yang diperbaiki). */}
      <aside className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start">
        <MartapuraScene />
        <img
          src={pasarTerapung}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            // Foto gagal dimuat → sembunyikan, adegan SVG di belakangnya tampil.
            event.currentTarget.style.display = 'none';
          }}
        />
        {/* scrim gelap: menjaga kontras teks di atas foto (§5.0 aturan 3) */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#020617]/75 via-[#020617]/45 to-[#020617]/85"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-10 xl:p-12">
          {/* Judul aplikasi di atas kaca standar (0.70) — foto tetap terlihat
              di baliknya, teks slate-900 aman kontras (DESIGN §5.0 aturan 1 & 3) */}
          <div className="glass inline-flex w-fit items-center gap-3 rounded-xl px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#0A625A] text-base font-bold text-white">
              P
            </div>
            <div>
              <p className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                PasarPian
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  Banua
                </span>
              </p>
              <p className="text-xs font-normal text-slate-700">Pasar urang Banua, gasan pian.</p>
            </div>
          </div>

          {/* Kartu kaca standar (0.70): kotak putih tembus pandang supaya foto
              Pasar Terapung kelihatan di baliknya — bukan panel solid. Teks
              diturunkan ke slate-700/900 agar kontras tetap ≥4.5:1 di atas kaca
              (§5.0 aturan 3); blur 16px menjaga keterbacaan. */}
          <div className="glass rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0A625A]">
              Marketplace &amp; operasional internal
            </p>
            <p className="mt-3 text-[32px] font-bold leading-10 text-slate-900">
              Dagang Banua, berlayar satu arus.
            </p>
            <p className="mt-3 text-sm font-normal leading-6 text-slate-700">
              Pesanan, stok multi-gudang, pemenuhan, pengiriman, keuangan, retur, dan kampanye
              berjalan di atas data yang sama — lengkap dengan jejak siapa mengubah apa.
            </p>

            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-900/10 pt-5">
              {brandPillars.map((pillar) => (
                <li key={pillar.title}>
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                    {/* Ikon teal (bukan amber): amber disimpan khusus untuk badge
                        Banua — satu aksen, satu makna (DESIGN §2.2). */}
                    <span className="text-[#0A625A]">{pillar.icon}</span>
                    {pillar.title}
                  </span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-slate-700">{pillar.note}</span>
                </li>
              ))}
            </ul>

            {/* Catatan akses digabung ke kartu: sebelumnya kotak keempat di atas
                foto (border + bg gelap + backdrop-blur) hanya menumpuk kartu. */}
            <p className="mt-5 flex items-start gap-2 border-t border-slate-900/10 pt-4 text-xs font-normal leading-5 text-slate-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0A625A]" aria-hidden="true" />
              Akses mengikuti peran dan status akun. Bila ada kendala, hubungi Administrator sistem.
            </p>
          </div>
        </div>
      </aside>

      {/* Panel tugas — satu-satunya kolom yang memanjang saat form bertambah. */}
      <section className="flex min-h-screen items-center justify-center bg-[#F8FAF9] px-4 py-6 sm:px-8">
        {/* Sheet `.page-backdrop` (konvensi semua halaman): glow teal/kunyit di
            belakang kartu = "isi" yang membuat kaca jujur (DESIGN §5.0 aturan 1);
            gradien hex sembarangan dihapus. Juga dipakai strip ponsel & catatan. */}
        <div className="page-backdrop w-full max-w-[26rem] p-4">
          {/* Strip foto versi ponsel: foto yang sama + scrim, scene SVG fallback */}
          <div className="relative mb-4 h-40 overflow-hidden rounded-2xl lg:hidden">
            <MartapuraScene />
            <img
              src={pasarTerapung}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/85 to-[#020617]/25" aria-hidden="true" />
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D7A70] text-sm font-bold text-white">
                P
              </div>
              <span className="text-sm font-semibold text-white">
                PasarPian <span className="text-amber-400">Banua</span>
              </span>
              <span className="ml-auto hidden text-[11px] font-normal text-slate-300 sm:inline">
                Pasar urang Banua, gasan pian.
              </span>
            </div>
          </div>

          {/* Kaca pekat (0.88): teks padat butuh kontras ≥4.5:1 (§5.0 aturan 3) */}
          <div className="glass-strong rounded-2xl p-5 sm:p-6">
            {/* Satu h1 per halaman: judul tugas. Label kicker uppercase dihapus —
                pola kicker+judul terlalu generik dan mengulang kicker panel kiri. */}
            <h1 className="text-xl font-semibold leading-7 tracking-tight text-slate-900">
              {mode === 'LOGIN' ? 'Wilujeng sumping malih.' : 'Ajukan akses baru.'}
            </h1>
            <p className="mt-2 text-sm font-normal leading-5 text-slate-500">
              {mode === 'LOGIN'
                ? 'Masuk untuk melanjutkan pekerjaan operasional Pian hari ini.'
                : 'Isi data berikut. Administrator meninjau permintaan sebelum akun diaktifkan.'}
            </p>

            <div className="mt-4">
              <FilterTabs<AuthMode>
                options={[
                  { id: 'LOGIN', label: 'Masuk' },
                  { id: 'REGISTER', label: 'Daftar' },
                ]}
                activeId={mode}
                onChange={switchMode}
                ariaLabel="Pilih masuk atau daftar"
              />
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              {mode === 'REGISTER' && (
                <div>
                  <label htmlFor="auth-name" className="mb-1 block text-xs font-medium text-slate-700">
                    Nama lengkap
                  </label>
                  <div className="relative">
                    <UserPlus className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="auth-name"
                      type="text"
                      className={`${fieldClass} pl-10`}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Contoh: Siti Rahmah"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-1 block text-xs font-medium text-slate-700">
                  Email kerja
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    className={`${fieldClass} pl-10`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="nama@pasarpian.id"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="mb-1 block text-xs font-medium text-slate-700">
                  Kata sandi
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className={`${fieldClass} pl-10 pr-11`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-2 rounded-md p-2 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]/30"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] font-normal leading-4 text-slate-500">
                  {mode === 'LOGIN'
                    ? 'Lupa kata sandi? Hubungi Administrator untuk pengaturan ulang.'
                    : 'Kata sandi disimpan sebagai hash oleh server — tidak pernah dalam bentuk asli.'}
                </p>
              </div>

              {message && (
                <div
                  role={message.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium leading-5 ${
                    message.type === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : message.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-sky-200 bg-sky-50 text-sky-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Tanpa neu-raised: Button sudah punya bayangan sendiri —
                  menumpuk bayangan = shadow xs + 2 lapis neu (slop visual). */}
              <Button type="submit" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {mode === 'LOGIN' ? 'Masuk ke workspace' : 'Kirim permintaan akses'}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] font-normal text-slate-400">
              <span className="h-px flex-1 bg-slate-300/70" />
              atau
              <span className="h-px flex-1 bg-slate-300/70" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              leftIcon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.9z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.26a12 12 0 0 0 0 10.76l4.01-3.11z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 1.26 6.62l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
              }
              onClick={() => setMessage({ type: 'info', text: onGoogleLogin() })}
            >
              Masuk dengan Google
            </Button>

            {/* Disclosure tanpa kotak: border+bg+shadow pada teks tautan hanya
                menambah satu "kartu" lagi tanpa fungsi — cukup chevron berputar. */}
            <details className="group mt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-1 text-xs font-medium text-slate-600 transition-colors hover:text-[#0D7A70] focus:outline-none focus:ring-2 focus:ring-[#0D7A70]/30 [&::-webkit-details-marker]:hidden">
                <span>Belum punya email akses? Lihat akun contoh</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="mt-2 space-y-1 text-[11px] font-normal leading-5 text-slate-500">
                <li><span className="font-medium text-slate-700">ahmad.gazali@pasarpian.id</span> — Management</li>
                <li><span className="font-medium text-slate-700">admin@pasarpian.id</span> — Administrator</li>
                <li><span className="font-medium text-slate-700">rusli.gudang@pasarpian.id</span> — Gudang (ditangguhkan, untuk menguji pesan penolakan)</li>
                <li className="pt-1">Kata sandi: minimal 8 karakter, isi apa pun (data contoh).</li>
              </ul>
            </details>
          </div>

          <p className="mx-auto mt-3 flex max-w-[26rem] items-start justify-center gap-2 px-1 text-center text-[11px] font-normal leading-4 text-slate-500">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              Masuk saat ini memakai data contoh. Saat sistem asli tersambung,
              kata sandi diverifikasi server dan sesi diamankan otomatis.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
};
