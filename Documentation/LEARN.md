# Catatan Belajar — Penyambungan Dashboard React

## Code flow

1. `main.tsx` merender `App` ke elemen `#root`.
2. `App.tsx` menjadi orchestration layer: menyimpan tab aktif, role simulasi, daftar order, stok, dan order yang sedang dibuka.
3. `AppLayout` menyediakan shell global: header, sidebar, pencarian, notifikasi, dan area kerja.
4. `renderPage()` memilih page berdasarkan `currentTab`.
5. Page menerima data dan callback dari `App`, sehingga perubahan state tetap mudah dilacak.
6. `OrderDetailModal` dan `StockAdjustmentModal` menangani interaksi lokal, lalu memanggil callback kembali ke `App`.

## Konsep yang dipelajari

- `useState` digunakan untuk **UI state** dan data simulasi yang berubah selama sesi.
- Props mengalir dari parent ke child; callback mengalirkan event dari child ke parent.
- `type` import diperlukan karena TypeScript memakai `verbatimModuleSyntax`.
- Mock data adalah pengganti sementara service/API. Backend belum dipanggil pada tahap ini.
- `validTransitions` menjaga status order tidak melompat sembarangan. Ini hanya guard UI simulasi; authorization dan validasi final tetap wajib dilakukan backend nanti.

## Keputusan teknis

- Tidak menambahkan state-management library atau query library.
- Tidak mengubah backend.
- Tidak membuat route baru; tab internal dipakai agar pekerjaan dashboard tetap sederhana.
- Halaman modul yang belum dibuat menampilkan placeholder, bukan data palsu tambahan.
- Dashboard mengikuti pola `ringkasan → perlu perhatian → analisis → tindakan`, sehingga pengguna tidak perlu memahami chart sebelum mengetahui apa yang harus dikerjakan.
- Chart dibuat dengan SVG native agar tidak menambah dependency chart sebelum kebutuhan API dan agregasi final ditentukan.

## Autentikasi frontend (PRD §8–10 · DESIGN §7.1)

- `AuthPage.tsx` menyatukan tampilan Masuk dan Daftar, tetapi tetap memisahkan mode form lewat `AuthMode`.
- `App.tsx` adalah pemilik sesi: `authenticatedUserId` menentukan apakah workspace atau gerbang autentikasi yang dirender.
- Login mencari akun mock berdasarkan email dan menolak `INACTIVE`/`SUSPENDED` dengan pesan aman yang tidak membocorkan apakah email ada.
- Pendaftaran hanya mengirim permintaan simulasi; tidak otomatis membuat akun aktif. Ini jujur karena pembuatan akun dan approval seharusnya permission/backend.
- Password sengaja tidak ditambahkan ke `UserAccount` atau disimpan di `localStorage`. Backend nanti harus memverifikasi password hash dan membuat session aman; frontend bukan lapisan authorization.
- Tombol Google OAuth memberi status belum tersambung, bukan berpura-pura membuat sesi.
- `AppLayout` menerima `currentUserName` dan `onLogout`, sehingga identitas header berasal dari sesi aktif dan logout kembali ke AuthPage.

**Redesain visual (mengikuti DESIGN, bukan template)**

- Tata letak dua panel: kiri gambar Pasar Terapung (SVG orisinal `MartapuraScene`: fajar, bukit, perahu klotok, penjual ber-caping) + scrim gelap, kanan panel tugas di atas latar bergradasi — kaca hanya di atas latar berwarna/bergradasi (DESIGN §5.0 aturan 1), jadi `glass-strong` sah di kartu maupun panel form.
- **Kenapa SVG, bukan foto/AI image?** Environment tidak punya tool generasi gambar; foto stok bertentangan dengan anti-kloning §2.3. SVG ikut warna Banua, bobot nol KB, tajam di segala ukuran, dan kartu kaca di atasnya baru terlihat blur-nya (aturan 1: kaca perlu latar berwarna).
- `useId()` dipakai untuk id gradien SVG karena adegan dirender dua kali (desktop + strip ponsel) — id ganda akan tabrakan.

**Foto asli & perbaikan layout (iterasi ke-3)**

- Latar panel kiri kini memakai foto aset proyek `assets/images/pasar terapung.jpg` (import Vite — nama ber*spasi* tetap sah karena path dikutip). Adegan SVG dipertahankan sebagai **fallback `onError`**: kalau foto gagal dimuat, panel tidak pernah kosong. Pola ini berlaku untuk strip ponsel juga.
- Judul aplikasi ("PasarPian") dibungkus chip `glass-strong` — inilah efek glassmorphosis yang diminta; blur foto di belakangnya terasa, teks `slate-900` tetap kontras.
- **Bug "panel kiri ikut memanjang"**: sebelumnya kedua kolom grid `align-items: stretch`, jadi saat tab Daftar menambah field dan kartu kanan tumbuh, tinggi baris bertambah → panel kiri ikut memanjang dan kontennya menyebar. Perbaikan: `<aside className="lg:sticky lg:top-0 lg:h-screen lg:self-start">` — tinggi kiri dikunci 100vh dan menempel di viewport, hanya kolom kanan yang tumbuh. `min-h-screen` pindah ke `<section>` kanan supaya kolomnya tetap terpusat.
- Semantik judul: satu `h1` per halaman (judul tugas di panel kanan); headline panel kiri turun jadi `<p>` bergaya display agar halaman tidak punya dua `h1`.
- Rapikan kanan: padding `p-6 sm:p-8`, ikon `HelpCircle` + penanda chevron pada `<details>`, catatan kaki berikon gembok, jarak vertikal 6-unit yang konsisten.

**Iterasi ke-4 (masukan screenshot)**

- Kartu & judul kiri: `glass-strong` (0.88, hampir solid) → **`glass` (0.70)** supaya foto Pasar Terapung tembus terlihat di balik kotak putih; teks diturunkan ke `slate-700`/`slate-900` agar kontras tetap ≥4.5:1 di atas kaca yang lebih tipis (§5.0 aturan 3 — tetap `--glass-bg-strong` bukan pilihan lagi karena justru menutup foto).
- Kanan diperkecil agar **muat 1 layar tanpa scroll**: judul `text-2xl` → `text-xl` (Title 2 §5.1-B), padding `p-6 sm:p-8` → `p-5 sm:p-6`, `space-y-4` → `3.5`, label `mb-1.5` → `mb-1`, tombol `lg` → `md`, divider `my-5` → `my-4`, details & footnote dirapatkan, kontainer `max-w-md` → `max-w-[26rem]`.
- Prinsipnya: tinggi = fungsi konten. Tab Daftar tetap menambah satu field, tapi sekarang masih di dalam anggaran viewport.

## Pemburuan "AI slop" (audit desain lintas source)

Daftar periksa 14 pola prompt-to-UI → temuan → tindakan. Prinsipnya: **perbaiki yang nyata, pertahankan yang konsisten** — konsistensi antar-halaman adalah keputusan desain, bukan slop.

| Pola slop | Temuan | Tindakan |
|---|---|---|
| Gradien arbitrer | `bg-[linear-gradient(165deg,#E6F4F2...#FFFBEB)]` di kanan Auth — hex di luar token, ada hanya supaya kaca "sah" | **Dihapus.** Ganti `bg-[#F8FAF9]` (token bg-app) + sheet `.page-backdrop` (konvensi semua halaman: glow teal/kunyit) |
| Glass tidak perlu | Chip judul + kartu + kotak catatan = 3 permukaan kaca/gelap di atas foto | Kotak catatan **digabung** ke kartu (footer `border-t`); kaca chip & kartu dipertahankan (diminta user, foto harus tembus) |
| Bayangan berlebih | CTA `shadow-xs` (Button) + `neu-raised` (2 lapis) = 3 bayangan di satu tombol | `neu-raised` **dilepas** dari CTA; satu bayangan per elemen. Ikon logo juga kehilangan `shadow-sm` (gradasi sudah cukup) |
| Border berlebih | `<details>` akun simulasi = border + bg + `open:shadow-xs` pada tautan teks | **Dibuat disclosure polos** — hanya chevron berputar. Hairline di kartu kiri dipertahankan (2 garis = 3 zona, struktur editorial) |
| Dekorasi tanpa fungsi | Kicker uppercase "RUANG KERJA INTERNAL" di atas judul form (pola kicker+judul generik; mengulang kicker panel kiri) | **Dihapus** — h1 langsung menyapa. Kicker panel kiri dipertahankan (konsisten dengan label seksi di semua halaman) |
| Pill/badge berlebih | Ikon pilar amber + badge Banua amber + kicker teal = 3 aksen bertaburan | Ikon pilar → **teal `#0A625A`**; amber hanya untuk badge Banua (satu aksen, satu makna) |
| Spasi "generated" | `mt-1.5` (6px), `space-y-3.5` (14px), `gap-2.5` (10px) — di luar baseline 4px DESIGN §5.1-C | Dinormalkan: `space-y-4`, `mt-1/mt-2`, `gap-2`. `top-3.5` **dipertahankan** (14px = rumus center ikon di input 44px, bukan estetika) |
| Hierarki tipografi generik | Bobot `font-black`/`font-extrabold` (900/800) melanggar §5.1-B (maks 700) | Diperbaiki di `AppLayout` (logo & brand) dan `App` (judul placeholder) → `font-bold` |
| Ikon tak konsisten | `HelpCircle` + `ChevronDown` pada disclosure yang sama | `HelpCircle` dilepas (teks sudah menjelaskan); sisa ikon semua lucide outline h-4 — Google SVG = pengecualian brand yang wajar |
| Semua jadi kartu | Kanan: sheet + kartu + strip + details = 4 lapis kotak | Kini: sheet (latar, bukan kartu) → 1 kartu → 1 disclosure tanpa kotak |

**Sengaja TIDAK diubah (bukan slop):**
- `shadow-2xl` pada Modal/SlideOver/GlobalSearch — elevasi overlay fungsional di atas scrim (panel harus "melayang").
- `uppercase tracking-[0.14em]` label seksi di ~12 halaman — konvensi app-wide yang konsisten; menghapus hanya di satu tempat justru menciptakan inkonsistensi.
- Titik `animate-pulse` di StatusBadge & SkeletonLoader — indikator status hidup + feedback loading (§11.1), bukan dekorasi.
- Gradien banner di MarketingPage (§8.5) — pratinjau aset kampanye, bukan chrome UI.
- Foto + scrim + sheet glow — karakter Banua yang diminta, bukan slop.

**Latihan untuk Dev**

```ts
// @ Ambil satu layar (mis. FinancePage) lalu jalankan daftar periksa 14 pola
//   di atas terhadapnya. Untuk tiap pola tulis: ADA/TIDAK, lokasi baris,
//   dan verdict: "slop → perbaiki" ATAU "konsisten → pertahankan" + alasan.
//   Contoh jawaban yang benar: "shadow-2xl di Modal.tsx:57 → TIDAK slop,
//   overlay perlu elevasi di atas scrim, konsisten dengan SlideOver."
```

Tujuan: membedakan *inkonsistensi/duplikasi* (slop) dari *konvensi yang disengaja* (desain). Tingkat: menengah.
Cara menilai: benar jika ≥12 dari 14 pola diberi verdict dengan alasan "fungsi vs dekorasi", dan minimal 2 temuan disarankan perbaikan tanpa merusak konsistensi antar-halaman.

## Shell scroll + hover dashboard (perbaikan shared)

- **Bug sidebar hilang saat scroll:** akar — root `min-h-screen` membuat baris konten memanjang mengikuti isi halaman; sidebar (tingginya mengikuti baris) ikut terseret. Perbaikan di `AppLayout`: root → `h-screen overflow-hidden`, baris → `flex min-h-0 flex-1`, `<main>` → `min-h-0 ... overflow-y-auto`, aside `shrink-0`. Kini hanya konten yang scroll; sidebar + header diam di semua halaman.
- **Hover penjelasan dashboard:** `StatCard` dapat prop opsional `hint` → `title` tooltip + ikon info kecil (aditif, halaman lain tak terpengaruh); 4 KPI, tombol fokus peran, tombol distribusi status, dan kartu `ExceptionBar` masing-masing dapat `title` natural; titik grafik tren dapat `<title>` + area sentuh transparan r=12; baris saluran dapat `title` nominal + persen. Tanpa library tooltip, tanpa ubah logika.
- **Tooltip kaca kustom (grafik dashboard):** `title` native diganti kartu `glass-strong` yang mengikuti kursor (satu state `HoverTip`, posisi flip tepi layar, `aria-hidden` karena duplikat aria-label). Segmen batang status naik kelas dari dekorasi `aria-hidden` menjadi tombol drill-down yang sama dengan legenda + tooltip label/makna (`orderStatusHints` dari tabel DESIGN §5.3-B); titik tren fokusable keyboard + banding rata-rata; bar saluran tooltip nominal + persen.
- Input = neumorf tertekan (`neu-pressed`), tombol = neumorf terangkat (`neu-raised`), badge = solid — satu elemen satu gaya (§5.0 aturan 5, tabel §5.3-E).
- Bobot font dibatasi 400/500/600/700 (§5.1-B); versi lama memakai `font-extrabold`/`font-black` yang dilarang spesifikasi.
- Konten panel kiri diambil dari empat pilar identitas §2.2 (Sungai Martapura, Sasirangan, Kayu Ulin, Pasar Terapung) sebagai data `brandPillars`, bukan kalimat dekoratif generik.
- Sapaan Banjar "Wilujeng sumping malih." mengikuti §2.4 (sentuhan Banjar untuk sapaan), label teknis tetap Bahasa Indonesia baku.
- Tab Masuk/Daftar memakai `FilterTabs` bersama — satu pola tab di seluruh aplikasi.

**Latihan untuk Dev**

```ts
// @ Telusuri AuthPage.tsx → App.tsx → AppLayout.tsx.
//   Gambar aliran: submit email/password → callback → authenticatedUserId → render.
//   Tandai mana form state, mana session state, dan mana data akun mock.
```

Tujuan: membedakan state form, session, dan server data. Tingkat: pemula-menengah.
Petunjuk: cari `useState`, lalu ikuti prop `onLogin` sampai fungsi di `App.tsx`.
Cara menilai: jawaban benar jika Dev dapat menjelaskan mengapa password tidak boleh
ditaruh di `UserAccount` dan mengapa validasi final harus tetap dilakukan backend.

## Dashboard baru

- KPI dihitung dari `orders` dan `inventory` state, bukan nilai tampilan yang terpisah.
- Grafik garis menjelaskan tren penjualan harian dengan satuan dan periode yang terlihat.
- Breakdown channel menggunakan bar horizontal karena lebih mudah dibanding pie chart untuk membandingkan nilai yang berdekatan.
- Setiap area penting memiliki action yang jelas menuju modul terkait.

## Alur bisnis simulasi

```text
Dashboard → klik KPI/exception → Pesanan atau Inventaris
Pesanan → buka detail → ubah status valid → state tabel ikut berubah
Inventaris → Sesuaikan → masukkan jumlah + alasan → stok lokal ikut berubah
```

## Langkah berikutnya

- Memindahkan mock data ke service domain saat API siap.
- Menambahkan loading, error, dan empty state saat endpoint tersedia.
- Menambahkan route protection berbasis role/permission dari session backend.

## Halaman Penjualan & Pesanan

- Halaman memakai tiga ringkasan sederhana sebelum tabel: total pesanan, jumlah yang perlu tindakan, dan total piutang.
- Filter status memakai label yang berorientasi pekerjaan seperti `Perlu konfirmasi`, bukan hanya enum teknis.
- Search mencakup nomor pesanan, pelanggan, kota, dan channel.
- Empty state membedakan “tidak ada hasil filter” dari error sistem dan menyediakan tombol reset.

## Halaman Pemenuhan

- Data pemenuhan mengikuti entity reference: nomor fulfillment, order, gudang, status, dan fulfillment items.
- Antrean mengikuti flow bisnis `Ready to Pick → Packing → Ready to Ship` dari `PRD.md` dan `DESIGN.md`.
- Filter gudang dan search membantu staf menemukan pekerjaan tanpa membaca seluruh tabel.
- Progress packing dihitung dari `packedQuantity / quantity` pada item fulfillment.
- Data mock hanya memakai order yang sudah dibayar untuk menghormati aturan “fulfillment setelah payment”; antrean kosong tetap ditampilkan sebagai empty state yang normal.

## Halaman Pengiriman

- Daftar shipment mengikuti entity reference: nomor shipment, order, kurir, nomor resi, tujuan, status, dan histori tracking.
- Ringkasan memisahkan paket dalam perjalanan, terkirim, dan yang terlambat agar masalah terlihat lebih cepat.
- Detail tracking ditampilkan di panel samping setelah pengguna memilih shipment; ini menerapkan progressive disclosure.
- Timeline menggunakan `shipment.timeline` dan tidak membuat status baru di UI.
- Search dan filter status membantu staf menemukan shipment tertentu tanpa membaca seluruh daftar.

## Halaman Keuangan

- Halaman mengikuti `DESIGN.md` 8.4: tab *Semua Pembayaran | Tagihan Tertunda (Outstanding) | Pengembalian Dana (Refund)*.
- Tiga metrik utama: Total Masuk Periode Ini, Total Piutang Belum Lunas, Total Refund Diproses.
- Semua angka dihitung dari data yang sudah ada (`payments`, `orders`, `returns`), bukan angka hardcoded, supaya rumusnya bisa dijelaskan ke pengguna non-teknis.
- Formula outstanding diberi keterangan teks: `total pesanan - total yang sudah dibayar`, sesuai aturan mudah dipahami.
- Metode pembayaran dan referensi transfer ditampilkan per transaksi sehingga rekonsiliasi bank bisa dicocokkan satu per satu.
- Nominal refund final masih menunggu backend; UI menampilkan pengajuan refund beserta status inspeksinya.

## Halaman Pengajuan Retur

- Mengikuti `DESIGN.md` modul 8 (RETUR): *Daftar Pengajuan Retur* + *Inspeksi & Disposisi*.
- Aturan utama `DESIGN.md` 7.5 dipenuhi: setiap pengajuan selalu menampilkan nomor pesanan asal dan pelanggannya, termasuk ringkasan total pesanan + status pembayaran dari `orders` (lookup via `orderNumber`) supaya keputusan refund bisa diambil tanpa buka halaman lain.
- Kondisi barang memakai enum PRD `GOOD | DAMAGED | DEFECTIVE | UNKNOWN` dan selalu diberi penjelasan singkat, bukan hanya warna/label.
- Disposisi memakai enum PRD `RESTOCK | REPAIR | DISPOSE | REPLACE` dengan hint dampaknya ke stok/gudang.
- Progressive disclosure: ringkasan kartu → daftar → panel detail di kanan; aksi *Setujui / Tolak* hanya dirender saat status `PENDING_INSPECTION` (aturan transisi status: aksi tidak boleh muncul untuk status yang salah).
- **Keputusan data flow:** status retur disimpan di `App.tsx` (`useState` + `decideReturn`), bukan di dalam page. Alasannya: halaman Keuangan membaca `returns` yang sama, jadi ketika retur disetujui, metrik *Refund sedang diproses* ikut berubah. Ini contoh *lifting state up* — state dimilikinya di level yang paling rendah (common ancestor), page cukup menerima `props` + callback `onDecide`.
- Menolak retur mengubah `refundAmount` menjadi 0 karena pengajuan yang ditolak tidak menghasilkan uang kembali; ini dicegah di App, bukan di page, supaya aturan bisnis tetap berada di satu tempat.
- Data masih lokal dan hilang saat refresh, karena belum ada backend/API.

## Halaman Pemasaran & Kampanye

- Mengikuti `DESIGN.md` 8.5 dan PRD #25: daftar kampanye memuat nama, periode aktif, saluran target, dan status (`Draft, Active, Paused, Completed`).
- **Keputusan penempatan state:** kampanye pakai state lokal di page, berbeda dengan retur yang diangkat ke `App.tsx`. Alasannya sederhana dan penting dipahami: *state diletakkan di level paling rendah yang masih dikonsumsi bersama*. Kampanye hanya dibaca halaman ini, jadi mengangkatnya ke App hanya menambah kerumitan tanpa manfaat.
- Transisi status dibatasi lewat record `allowedTransitions`; tombol yang dirender berasal dari daftar itu, bukan ditulis manual satu-satu, sehingga mustahil menghasilkan aksi ilegal (misal Draf → Selesai). Guard tetap diulang di dalam handler (`isLegal`) karena UI bukan sumber kebenaran.
- Progress bar periode dihitung dari `startDate`/`endDate` vs `Date.now()` dan hanya dirender untuk status Aktif/Dijeda — status Draf/Selesai tidak punya “progres berjalan”.
- **Pratinjau banner** menerapkan spesifikasi rasio `4:1` (hero), `16:9` (kartu kanal), `1:1` (widget) dengan label ukuran piksel, plus daftar hierarki konten: headline → periode & syarat → visual orisinal → satu CTA.
- Banner dibuat dengan CSS (gradien + pola berulang motif sasirangan) tanpa gambar eksternal, supaya tidak menambah request dan tetap kontras minimal 4,5:1 untuk teks putih di atas latar gelap.

## Halaman Administrasi & Audit

- Mengikuti `DESIGN.md` modul 10: *Pengguna Internal | Peran & Izin | Jejak Audit*.
- **Refactor kecil yang dilakukan:** `navItems` dipindah dari dalam komponen `AppLayout` ke level module lalu di-`export`. Alasan: matriks izin di halaman Admin harus menampilkan menu yang **sama persis** dengan sidebar. Kalau daftarnya ditulis ulang di halaman Admin, ada dua sumber kebenaran dan pasti akan melenceng suatu saat. Setelah dipindah, build tetap lolos → termasuk regression check pada komponen bersama.
- Matriks peran × menu dihitung dari `module.roles.includes(role)`, jadi angka “X/10 menu” dan tanda ✓ dihitung, bukan ditulis manual.
- **Izin granular sengaja tidak dipetakan ke peran.** SCHEMA #5 hanya memberi contoh kode izin (`order.read`, `inventory.adjust`, …) dan relasi N:N, tetapi tidak ada data pemetaan peran→izin. Mengarang pemetaan itu melanggar aturan *no assumption* (AGENTS #3), jadi ditampilkan sebagai daftar referensi + catatan bahwa datanya belum ada.
- Transisi status akun memakai pola yang sama seperti kampanye: `userTransitions` → tombol dirender dari map, guard diulang di handler.
- **Auditability (AGENTS #21) disimulasikan:** saat status akun diubah, halaman menambah satu entri `AuditLog` berisi pelaku, entitas, nilai lama, dan nilai baru. Tujuannya membuktikan alurnya dulu di UI; nanti di backend, penulisan log harus terjadi di server, bukan di browser.
- Log audit hanya-baca: tidak ada tombol edit/hapus, karena log harus immutable.
- Menambahkan 1 akun `SUSPENDED` (H. Rusli) supaya status non-aktif, pesan penolakan login dari DESIGN, dan indikator “perlu perhatian” bisa terlihat.

## Tema & Tipografi (Pembaruan Spesifikasi DESIGN.md)

- **Tema resmi: Glassmorphism + Neumorphism.** Keduanya tidak dicampur acak — kaca (`rgba(255,255,255,0.7)` + `backdrop-blur`) untuk panel, kartu, modal, sidebar; neumorf (dua bayangan halus) untuk tombol, input, tab, chip. Satu elemen hanya satu gaya supaya hierarki tetap jelas.
- Token tema ditambahkan di 3 tempat sesuai pola 3-layer: **primitive** (`--glass-*`, `--neu-*` di 5.1-E) → **semantic** (`--surface-glass`, `--elevation-raised/pressed` di 5.2) → **component** (tabel penerapan di 5.3-E). Ini contoh nyata kenapa token dipisah berlapis: komponen tidak perlu tahu nilai `rgba`, cukup panggil token semantic.
- **Font resmi: Poppins** untuk seluruh teks UI (menggantikan `Plus Jakarta Sans`), bobot 400/500/600/700. Angka rupiah/kuantitas pakai Poppins + `tabular-nums`; `JetBrains Mono` hanya untuk token teknis murni (kode izin, hash, log).
- **Penerapan pertama (frontend):** `frontend/index.html` kini memuat Google Fonts **Poppins** (400/500/600/700) + `JetBrains Mono`, dan `src/index.css` menyetel `--font-sans: 'Poppins'`. Class lama `font-mono-numbers` **nama tetap, isi berubah** — sekarang menunjuk `Poppins` + `font-variant-numeric: tabular-nums` sesuai spesifikasi, jadi semua angka rupiah/kuantitas ikut konsisten tanpa perlu menyentuh puluhan file halaman. `JetBrains Mono` tersisa hanya untuk `font-mono` (kode izin, resi mentah).

## Halaman Beranda / Dashboard (Dibangun Ulang Ikut DESIGN §8.1)

- **Urutan halaman kini persis seperti spesifikasi:** Greeting Bar → Exception Bar → Kartu KPI → Grafik saluran → Aktivitas terkini. Urutan ini bukan selera pribadi; DESIGN menempatkan Exception Bar paling atas karena pertanyaan pertama pengguna adalah *"apa yang harus saya lakukan?"*, baru kemudian *"berapa angkanya?"*. **(Diperbarui sesudah audit dokumen Agents: kini disisipkan panel Fokus Peran dan Distribusi Status Transaksi — rinciannya di bagian "Kepatuhan Dashboard pada Dokumen Agents".)**
- **Greeting Bar** memuat sapaan `Selamat datang, Pian [Nama]`, tanggal/jam, dan **status sinkronisasi yang jujur**: "Data simulasi lokal · belum tersambung API". Menyembunyikan kenyataan bahwa data belum tersambung server akan membuat pengguna salah mengira perubahannya tersimpan.
- **4 KPI sesuai spesifikasi** (Total Penjualan, Total Pesanan, Persentase Pemenuhan Selesai, Total Piutang). KPI lama "Stok menipis" dihapus dari baris KPI karena informasinya sudah tampil di Exception Bar — hindari duplikasi metrik (AGENTS #31: jangan tampilkan metrik yang tidak membantu keputusan).
- **Semua angka dihitung dari data, bukan ditulis manual.** Pelajaran penting: kode lama punya `channelBreakdown` hardcode (`34%, 12%, 6%...`) dan `trendPoints` hardcode. Sekarang:
  - KPI dihitung dari `orders` (filter `CANCELLED`), `fulfillments` (packed ÷ total), dan `outstanding`.
  - Tren harian dikelompokkan dari `orderDate`, skala sumbu-Y dibulatkan ke atas (`chartMax`), rata-rata & hari tertinggi dihitung dari array yang sama.
  - Distribusi saluran difilter dari channel yang benar-benar punya omzet, diurutkan dari yang terbesar.
  - **Kenapa ini wajib:** saat API dipasang, hanya sumber data yang diganti; tampilan tidak perlu diubah. Angka hardcode harus selalu bisa ditelusuri ke datanya, kalau tidak ia akan bohong pelan-pelan.
- **Aktivitas terkini = gabungan 2 sumber** (`orders` + `movements`), digabung lalu diurutkan `localeCompare` pada timestamp dan dipotong 5. Karena format waktu di mock sama (`YYYY-MM-DD HH:mm`), pengurutan string = pengurutan kronologis — trik sederhana yang berhenti bekerja kalau format waktunya campur, jadi catat ini.
- **Tema diterapkan sesuai tabel DESIGN §5.3-E:** panel memakai class `.glass`, tombol sekunder memakai `.neu-raised`, latar halaman memakai `.page-backdrop` (gradien lembut) **karena kaca butuh "isi" di belakangnya** — kalau latarnya polos putih, `backdrop-blur` tidak terlihat dan kartu hanya terlihat buram. Badge status tetap solid datar supaya warna status tajam.
- **Kartu KPI (StatCard) diubah jadi `<button>`** saat punya `onClick`. Versi lama memakai `<div onClick>` yang tidak bisa dicapai `Tab` — pelanggaran DESIGN §12.1. Div yang terlihat bisa diklik tapi dilewati keyboard adalah bug aksesibilitas yang sering tidak disadari.

## Aturan Comment Wajib (Pembaruan AGENTS #24)

- **Sebelumnya tidak ada aturan comment.** Dicek ulang seluruh `AGENTS.md`: `#1` hanya menyebut AI sebagai *Learning Mentor* (terlalu umum), `#24` hanya mewajibkan comment pada **kode eksperimen**, dan `#25` menyangkut file dokumentasi terpisah — bukan comment di code. Jadi `interface`, `type`, function, dan konstanta **tidak punya kewajiban comment**.
- User memilih **memperkuat #24** (bukan menambah aturan #32 baru), supaya semua aturan belajar TypeScript/React berada di satu tempat.
- Isi yang ditambahkan ke `AGENTS.md` #24:
  1. **Apa yang wajib dikomentari:** `interface`/`type`/`enum`, `function`/`method`/`hook`/`service`/`component`, konstanta lintas tempat, variable yang namanya tidak menjelaskan kegunaannya.
  2. **Tiga pertanyaan wajib dijawab:** *Apa ini? · Untuk apa? · Kenapa ada?* — pertanyaan ketiga adalah yang paling sering hilang dan justru paling berharga untuk pemula, karena alasan keputusan tidak pernah terbaca dari code.
  3. **Larangan noise:** comment yang mengulang nama variable (`// i = index`) dilarang — comment basi justru menyesatkan pembaca baru.
  4. **Batas scope:** code lama hanya dikomentari saat file itu memang sedang disentuh, supaya tidak memicu refactor besar (tetap tunduk pada #26).
- **Trade-off yang disadari:** "semua code wajib comment" bisa berujung pada comment yang menyalin ulang baris kode. Karena itu aturan ini memisahkan *wajib comment* (deklarasi) dari *dilarang comment* (pengulangan isi code).

### Latihan untuk Dev (ketik sendiri)

**Latihan dashboard** — coba lihat bagian `dailySales` di `DashboardPage.tsx`:

```ts
// @ Kosongkan lalu tulis ulang: kelompokkan activeOrders per tanggal (orderDate.slice(0, 10))
//   lalu jumlahkan total-nya. Petunjuk: map tanggal -> reduce total order yang tanggalnya sama.
const dailySales = orderDates.map((date) => {
  // ...
});
```

Alasan menulis ini sendiri: seluruh grafik tren (skala sumbu, rata-rata, hari tertinggi) bergantung pada array ini. Kalau kamu belum pernah menulis pengelompokan data seperti ini, kamu tidak akan paham dari mana angka di layar berasal saat nanti memasang API.

Lalu coba `countForAction()` di `AdminPage.tsx`. Keduanya menghitung angka untuk ditampilkan. Kosongkan salah satu isinya lalu tulis ulang sendiri:

```ts
// @ Isi fungsi ini agar mengembalikan jumlah log untuk satu jenis aksi.
//   Petunjuk: bandingkan log.action dengan parameter action, lalu .length kan hasilnya.
const countForAction = (action: AuditLog['action'] | 'ALL') => {
  // ...
}
```

## Kepatuhan Dashboard pada Dokumen Agents (Audit PRD #26 · DESIGN §3/§4/§8.1 · AGENTS #6/#19/#31)

Audit dilakukan dengan membaca ulang `PRD.md` (#26, #27), `DESIGN.md` (§3 peran, §4 arsitektur informasi, §8.1), `ARCHITECTURE.md` (baris soal dashboard), dan `AGENTS.md`. Kesenjangan beserta perbaikannya:

| Kewajiban dokumen | Kondisi sebelum audit | Perbaikan |
|---|---|---|
| PRD #26 "informasi relevan berdasarkan role" | Dashboard identik untuk 7 peran | Panel **Fokus Peran** (3 kartu per peran) + chip "Peran aktif" pada sapaan |
| PRD #26 "apa yang sedang berjalan?" | Belum dijawab | Panel **Bagaimana status pesanan?** |
| DESIGN IA §4 "Distribusi Status Transaksi & Saluran" | Baru saluran | Batang bertumpuk status + legenda |
| DESIGN §8.1 butir 2 "pengiriman kurir terlambat" | Tidak ada | Kategori `delayedShipments` (status `DELAYED` atau `IN_TRANSIT` lewat estimasi tiba) |
| DESIGN §8.1 "pesanan tertahan >24 jam" | Exception Bar menulis ">12 jam" dengan angka hardcode | Ambang 24 jam, dihitung dari `orderDate` |
| PRD #27 "order status distribution" | Tidak ada | Ikut panel distribusi status |
| AGENTS #31 helper text istilah | "Piutang/Outstanding" tidak dijelaskan | Helper text di bawah baris KPI |
| AGENTS #6 + DESIGN §10.5 agregasi | Logika tercecer di komponen | Dipindah ke `utils/dashboardInsights.ts` + komentar penanda penggantian endpoint |

**Kenapa logika dipisah ke `frontend/src/utils/dashboardInsights.ts`:**
- Mengikuti layer `Utils` pada AGENTS #4, dan `DashboardPage.tsx` sudah lebih dari 500 baris — memindahkan perhitungan ke util menjaga komponen tetap terbaca (AGENTS #11).
- `ExceptionBar` kini komponen **presentasional murni** (menerima `items`, tidak menghitung apa pun), sehingga bisa dipakai ulang di halaman lain.
- Saat API tersedia, file inilah **tempat pertama yang diganti** oleh pemanggilan endpoint ringkasan analitik — bukan komponennya.

**Keputusan & alasannya:**
- **Exception Bar selalu menampilkan ke-5 kategori.** Yang aman diberi tanda hijau "Aman", yang bermasalah amber/rose. Kalau kategori disembunyikan saat bernilai nol, pengguna tidak bisa membedakan "tidak dipantau" dengan "aman" (AGENTS #14). Badge "n butuh tindakan" dihitung dari `needsAction`, bukan ditulis manual.
- **Label "Belum Lunas", bukan "Jatuh Tempo".** DESIGN §8.1 menyebut tagihan jatuh tempo, tetapi schema tidak punya field tanggal jatuh tempo. Menulis "jatuh tempo" berarti mengarang informasi (AGENTS #3), jadi dipakai fakta yang benar-benar ada: `outstanding > 0`.
- **Waktu acuan exception memakai jam komputer (`new Date()`), bukan timestamp data.** Konsekuensi yang disadari: data mock diam di 2–6 Okt 2026, sehingga umur "pesanan tertahan" akan membesar tiap hari sampai API terpasang dan datanya selalu segar. Ini dipilih supaya aturan ">24 jam" benar-benar diuji dengan logika waktu nyata, bukan angka pura-pura.
- **Label status memakai `StatusBadge`, warna segmen disimpan di map terpisah.** Alasannya `StatusBadge` tidak mengekspor palet warnanya. Pelajaran: komponen badge yang baik sebaiknya mengekspor *metadata* (label + warna) supaya konsumen tidak menebak-nebak — kandidat perbaikan berikutnya.
- **Fokus Peran ditulis sebagai `Record<UserRole, RoleFocusItem[]>`, bukan `switch`.** TypeScript langsung error kalau SCHEMA menambah peran baru yang belum punya konten fokus; keamanan compile-time menggantikan lupa menambah `case`.
- **Aksesibilitas (AGENTS #19):** semua kartu exception, fokus, dan legenda status dirender `<button>` dengan `aria-label`; batang bertumpuk diberi `aria-hidden` karena seluruh angkanya tersedia pada legenda berlabel `StatusBadge` (ikon + teks), jadi status tidak dibedakan oleh warna saja.

**Yang belum — sengaja dijaga scope-nya (AGENTS #26):**
1. **Drill-down status masih membuka daftar tanpa filter.** `OrdersPage` menyimpan filter statusnya sendiri (`useState` lokal). Agar panel distribusi bisa langsung membuka daftar terfilter, state filter harus diangkat ke `App.tsx` plus di-reset saat klik sidebar — perubahan lintas halaman yang berisiko memunculkan "filter basi". Jadi dikerjakan terpisah.
2. **Loading/error state dashboard** (AGENTS #12–14) baru relevan ketika sudah ada request; data lokal selalu sinkron, jadi saat ini hanya *empty* state yang disiapkan.
3. **Role routing saat login** (DESIGN §7.1: WAREHOUSE → antrean pemenuhan, FINANCE → ringkasan pembayaran, dst.) belum diterapkan karena belum ada alur login; pengalihan peran kini hanya lewat pemilih peran di sidebar.
4. **Agregasi harus pindah ke backend** (AGENTS #6, DESIGN §10.5, `ARCHITECTURE.md`): jangan biarkan dashboard memindai seluruh tabel transaksi begitu API tersedia.

**Validasi:** `npm run build` PASS (tsc + Vite, 1918 modul), tanpa browser sesuai AGENTS #30.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan satu blok pada focusByRole (misal blok WAREHOUSE) lalu isi ulang
//   dengan 3 kartu milik peran Gudang. Petunjuk: pakai variabel unpackedQty,
//   lowStockCount, dan movements yang sudah dihitung di atas — jangan hitung ulang.
const focusByRole: Record<UserRole, RoleFocusItem[]> = {
  // ...
};
```

Alasannya: inti PRD #26 adalah *satu set data mentah yang sama* dipilih menjadi tiga angka bermakna untuk satu peran. Kalau kamu bisa menulis blok ini sendiri, kamu sudah paham bagaimana dashboard role-based bekerja — bukan sekadar menyalinnya.

## Halaman Penjualan & Pesanan (Audit DESIGN §8.2 · §7.2 · §5.3-D · §11.3 · §12.1)

Audit menemukan daftar dan detail belum memenuhi spesifikasi. Tabel kesenjangan:

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| §8.2 filter: status, saluran, tanggal, bayar | Hanya tab status + search | Select saluran, select bayar, input tanggal dari–sampai |
| §8.2 kolom: Tanggal, Status Bayar | Tanggal menempel di nomor; tanpa Status Bayar | Kolom Tanggal sendiri + kolom Status Bayar (badge + sisa) |
| §8.2 "label bisnis familiar" | Saluran mentah (`WEBSITE`) | Label Indonesia via `utils/orderDisplay.ts` |
| §5.3-D.5 drill-down terfilter | Dashboard membuka daftar tanpa filter | Filter status diangkat ke `App.tsx`; sidebar reset ke Semua |
| §8.2 Blok 3 (Varian, SKU, Harga, Diskon, Subtotal) | Tanpa kolom Diskon | Kolom Diskon per item |
| §8.2 Blok 4 (Subtotal, Ongkir, Diskon, Pajak, Total) | Tanpa Pajak; tercampur Total Bayar | Baris Pajak + Blok 4 murni biaya |
| §8.2 Blok 5 (riwayat bayar + outstanding) | Hanya total, tanpa daftar | Daftar catatan bayar (metode, tanggal, ref, jumlah) |
| §8.2 Blok 6 (picking, packing, kurir, resi, tracking) | Timeline karangan hardcode | Antrean gudang + timeline kiriman dari data; empty state bila belum ada |
| §8.2 Blok 7 (siapa, kapan) | Aktor hardcode | Disaring dari `auditLogs` + entri "dibuat" dari data pesanan |
| §7.2 + §11.3 batal = destruktif | Langsung batal tanpa alasan | Dialog konfirmasi dua-tahap + alasan wajib → tersimpan di `notes` |
| §12.1 keyboard | Baris `<tr onClick>` tak terjangkau Tab | `tabIndex` + Enter/Spasi + Escape menutup panel |
| §5.1-B / §5.3-E tema | Kartu putih lama + `font-black` (900, di luar 400–700) | `glass`, `neu-raised`/`neu-pressed`, `page-backdrop`, `font-bold` |
| §11 empty state | Satu gaya untuk semua kosong | Bedakan: belum ada data vs filter terlalu ketat |

**Keputusan & alasannya:**
- **Kolom "Isi pesanan" dipertahankan** meski tidak ada di daftar kolom §8.2 — nama produk membantu pengguna non-teknis mengenali baris tanpa membuka detail (AGENTS #31). Penyimpangan sadar, dicatat di sini.
- **Status gudang menengah (PICKED/PACKED/RETURNED) tidak dibuatkan tab** — tab mengikuti lifecycle utama PRD #16; status kiriman dashboard yang tak punya tab tampil sebagai chip yang bisa dihapus.
- **Filter status milik App, filter lain milik halaman.** Hanya status yang dibutuhkan drill-down lintas halaman; mengangkat semuanya akan menggemukkan App tanpa manfaat (AGENTS #28: solusi paling sederhana).
- **Klik menu Pesanan mereset filter ke Semua** (`handleSelectTab`) — mencegah "filter basi" dari drill-down sebelumnya. Ini contoh *state milik siapa*: filter yang dipakai dua halaman tinggal di pemilik bersama (App).
- **`channelMeta` dipindah ke `utils/orderDisplay.ts`** — Dashboard dan Pesanan tadinya masing-masing punya salinan label saluran; duplikasi 7 baris ini akan berbohong pelan-pelan saat label berubah (AGENTS #11).
- **Pencarian tetap tanpa debounce** — debounce 350ms (DESIGN §10) hanya wajib saat tiap ketikan memicu request API; filter lokal tidak memicu request apa pun. Komentar penanda ditulis di kode supaya tidak lupa saat API tiba.
- **Alasan batal minimal diisi (tidak dibatasi panjang)** — validasi cukup "tidak kosong" karena backend nanti yang menegakkan aturan formal; frontend hanya memastikan jejak audit punya isi.

**Yang belum (sengaja dijaga scope, AGENTS #26):** paginasi server + filter server (AGENTS #6, baru relevan saat data besar/API); permission aksi per peran (AGENTS #9 — tombol Konfirmasi/Batal masih terlihat semua peran yang membuka halaman); ekspor CSV masih simulasi `alert` (ekspor beneran = rekomendasi DESIGN §13, bukan kewajiban).

**Validasi:** `npm run build` PASS (tsc + Vite, 1919 modul), tanpa browser (AGENTS #30). Regression: `ExceptionBar`, `StatCard`, halaman lain tidak disentuh kecuali `DashboardPage` (impor `channelMeta` + 3 tombol drill-down memakai callback baru dengan fallback).

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Tambahkan satu tab status baru (misal 'RETURNED' → label 'Retur Diajukan')
//   ke ORDER_STATUS_TABS di utils/orderDisplay.ts, lalu jalankan build dan buka
//   halaman Pesanan. Perhatikan: chip jumlah otomatis ikut benar TANPA mengubah
//   OrdersPage — kenapa bisa begitu?
```

Alasannya: tab dirender dari data (`ORDER_STATUS_TABS.map`), bukan ditulis satu per satu. Latihan ini mengajarkan pola *data-driven UI*: tambah data → tampilan ikut, nol logika baru. Bandingkan dengan kode lama yang menulis tiap `<button>` filter secara manual.

## Pola Tab Filter (Konteks lintas halaman — dipakai Pesanan, Katalog, dan halaman berikut)

Masalah yang ditemukan: tab aktif versi lama memakai blok teal solid datar (`bg-[#0D7A70] text-white` + badge `bg-white/20`) sehingga terlihat "ditekan paksa" dan badge-nya pudar — padahal tabel tema DESIGN §5.3-E sudah mengatur: **tab aktif = tertekan (`neu-pressed`), tab non-aktif = rata**.

Keputusan: pola dikunci di komponen bersama `components/common/FilterTabs.tsx`, bukan di tiap halaman:
- Aktif: `neu-pressed` (bayangan ke dalam = efek ditekan) + `bg-teal-50/80` + teks teal tua + **badge solid teal** (putih di atas teal = kontras tajam, badge pudar dilarang).
- Non-aktif: rata (`bg-white/85`, tanpa bayangan) + badge abu.
- Generik `<T extends string>` sehingga tiap halaman cukup kirim `options/activeId/onChange/ariaLabel` — tidak ada logika tampilan di halaman.
- Umpan balik tekan-tahan: class `filter-tab:active` di `index.css` (bayangan cekung + mengecil 2%) supaya tab terasa hidup saat mouse ditahan, bukan hanya sesudah aktif.
- Halaman Pesanan dan Katalog sudah pindah ke komponen ini; **halaman berikutnya (Inventaris, Pemenuhan, Keuangan, Retur, Pemasaran) wajib memakai `FilterTabs` juga** — jangan menulis tab manual lagi.

## Halaman Katalog Produk (Audit PRD #13 · SCHEMA #8–#10 · DESIGN IA §4.3)

Audit menemukan halaman menampilkan baris gudang mentah, bukan struktur Produk → Varian → SKU:

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| PRD #13 "satu produk, banyak varian" | Tiap baris = 1 kartu (produk pecah ganda) | Dikelompokkan per nama produk; varian dibuka-tutup |
| SCHEMA #8 kategori | Daftar kategori ditulis manual di kode | Diturunkan dari data + jumlah produk per chip |
| Bahasa bisnis (§5.1, #31) | `warehouseName.split(' ')[1]` ("Sentral" untuk Martapura) | Hack dihapus; kartu memakai total stok lintas gudang |
| §5.3-D.5 drill-down | Tanpa tombol ke modul lain | "Lihat stok di gudang" → tab Inventaris |
| §11 empty state | Grid kosong tanpa penjelasan | Bedakan: belum ada produk vs saringan ketat + reset |
| §12.1 keyboard | Chip tanpa `aria-selected`, tanpa label search | `role=tab` + `aria-selected`, `aria-expanded`, label `sr-only` |
| Tema §5 | Kartu putih lama + `font-black` | `glass`, `neu-raised`/`neu-pressed`, `page-backdrop`, `font-bold` |
| #24 comment | Nol JSDoc | Seluruh deklarasi dikomentari Indonesia |

**Keputusan & alasannya:**
- **Sumber data tetap inventaris** (props dari App agar penyesuaian stok ikut tercermin). Master produk + foto + deskripsi + status publikasi (DESIGN IA: "Daftar Produk & Status Publikasi") tidak ada di mock — mengarang foto/deskripsi/status berarti mengarang data (AGENTS #3). Kartu mencatat batas ini di komentar kode; API produk (SCHEMA #9–#10) nanti menggantikan props tanpa mengubah tampilan.
- **Harga rentang, bukan rata-rata.** Produk multivarian menampilkan "Rp 185.000 – Rp 195.000" — rata-rata harga antar varian adalah angka menyesatkan yang tidak membantu keputusan (#31).
- **HPP tetap tampil per varian** seperti sebelumnya (tidak ditambah, tidak disembunyikan). Menyembunyikannya per peran butuh sistem permission yang belum ada (#9) — dicatat sebagai future work, bukan dikarang sendiri.
- **Satu kartu terbuka dalam satu waktu** (`expandedProduct` tunggal). Akordeon multi-buka butuh `Set` + logika tambahan tanpa manfaat nyata hari ini (#28).
- **Layout masonry kolom CSS** (`columns-*` + `break-inside-avoid`), bukan grid: grid memaksa satu baris sama tinggi sehingga kartu tertutup ikut melar saat tetangga dibuka. Konsekuensi sadar: urutan visual per-kolom, urutan DOM/keyboard tetap alfabetis.
- **Tanpa metrik margin** — selisih jual−HPP dalam persen adalah metrik baru yang tidak diminta dokumen; menampilkannya melanggar #31.

**Validasi:** `npm run build` PASS (1919 modul), tanpa browser (#30). Regression: hanya `App.tsx` baris `case 'catalog'` yang berubah; halaman lain tidak tersentuh.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan isi useMemo "products" lalu tulis ulang pengelompokan
//   inventory → Map<productName, InventoryItem[]> → ProductGroup.
//   Petunjuk: Map.get(...) ?? [] untuk ambil/tampung, lalu hitung
//   totalAvailable (reduce), priceMin/priceMax (Math.min/Math.max + spread).
```

Alasannya: pengelompokan ini adalah pola yang sama dengan `dailySales` di dashboard (pecah → kelompok → agregat). Kalau dua-duanya bisa ditulis sendiri, pola "turunkan tampilan dari data" sudah dikuasai — bukan hafalan sintaks.

## Halaman Inventaris & Multi-Gudang (Audit DESIGN §8.3 · §7.4 · §11.3 · AGENTS #21)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| §8.3 filter per gudang fisik | `<select>` hardcode 3 opsi | Chip `FilterTabs` dari data (`warehouseOptionsOf`) + jumlah SKU |
| §8.3 indikator Aman/Menipis/Habis | Hanya Aman/Menipis | Tiga kondisi via `stockConditionOf` (ikon + tulisan, #19) |
| §7.4 form mutasi wajib: gudang, SKU, jumlah, referensi, alasan | Tanpa nomor referensi | Input referensi wajib → jadi `referenceNo` mutasi |
| §11.3 penyesuaian negatif = destruktif | Sekali klik simpan | Konfirmasi dua-tahap + ringkasan dampak, tombol merah |
| #21 + janji modal "tercatat ke mutasi" | Stok berubah diam-diam | `movements` + `auditLogs` jadi state App; penyesuaian menambah keduanya |
| #11 satu istilah mutasi | Tabel memakai kode mentah (`RECEIVE`) | `movementLabels` di `utils/inventoryDisplay.ts`, dipakai Inventaris + Dashboard |
| §12.1 keyboard | Tab tanpa role | `role=tablist/tab` + `aria-selected`, label `sr-only` |
| §11 empty state | Tabel kosong polos | Bedakan: belum ada stok / saringan ketat / belum ada mutasi |
| Tema §5 | Kartu putih + `font-black` | `glass`, `neu-pressed`, `page-backdrop`, `font-bold`, ringkasan `StatCard` |

**Keputusan & alasannya:**
- **Guard minus diulang di App.** Modal menolak fisik minus, tapi `adjustStock` memeriksa lagi — validasi tampilan tidak boleh jadi satu-satunya penjaga karena logika bisnis tinggal di pemilik state (#15).
- **Pelaku = peran aktif.** Belum ada login, jadi `actor: activeRole` adalah satu-satunya identitas jujur; nama orang akan karangan (#3). Ditulis eksplisit di komentar kode.
- **Modal di-`key` per id baris** supaya form selalu reset tiap ganti SKU — `adjustmentQty` basi yang terbawa ke barang lain adalah bug nyata yang ditemukan saat audit.
- **Ringkasan dihitung dari hasil saringan**, bukan seluruh data — angka di atas tabel harus selalu cocok dengan isi tabel (#31: metrik menyesatkan dilarang).
- **Tab Stok/Mutasi tetap gaya garis bawah** (seperti tab detail pesanan), bukan `FilterTabs` — itu pengalih tampilan, bukan saringan bernilai; konteks pola tab tercatat di bagian "Pola Tab Filter".

**Yang belum (#26):** paginasi server saat data besar (#6); permission penyesuaian per peran (#9 — tombol Sesuaikan masih terlihat semua peran); mutasi selain ADJUSTMENT masih data statis sampai API tiba.

**Validasi:** `npm run build` PASS (1921 modul), tanpa browser (#30). Regression: Dashboard (label mutasi + data `movements` hidup), Admin (audit hidup), Katalog (tak tersentuh) — hanya impor dan props yang berubah, diverifikasi via build.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan fungsi stockConditionOf lalu tulis ulang: kembalikan 'HABIS' bila
//   availableStock <= 0, 'MENIPIS' bila <= minThreshold, selain itu 'AMAN'.
//   Lalu cari semua pemakainya (Inventaris, Katalog, Exception Bar) dan jelaskan
//   kenapa satu fungsi dipakai tiga tempat — apa yang rusak bila aturannya
//   ditulis terpisah di tiap halaman?
```

Alasannya: latihan ini tentang *single source of truth untuk aturan bisnis*. Ambang menipis yang ditulis di tiga tempat akan berbeda saat diubah — bug klasik yang hanya bisa dicegah dengan satu fungsi bersama.

## Halaman Antrean Pemenuhan (Audit DESIGN §8.3 · §7.2 · AGENTS #21)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| §7.2 tahap PICKING→PACKING→READY TO SHIP | Tombol `alert()` simulasi | `advanceFulfillment` di App: status + kuantitas benar-benar maju |
| §8.3 aksi massal | Satu tombol `alert` | "Mulai picking massal" + "Konfirmasi packing massal" pada hasil saringan, mati bila nol target |
| #11 satu label status | `statusLabel` lokal duplikat | Dihapus; pakai `fulfillmentStatusLabels` dari util |
| Konteks pola tab | Tab tahap custom gaya lama | `FilterTabs` + dukungan ikon/deskripsi (komponen diperluas, default tak berubah) |
| #21 jejak audit | Tanpa catatan | Tiap perpindahan tahap → entri `STATUS_CHANGE` (pelaku = peran aktif) |
| Tema §5 + #24 + #14 | Kartu putih, `font-black`, tanpa JSDoc, satu empty state | `glass`/`StatCard`/`neu`, JSDoc, beda kosong vs saringan ketat |

**Keputusan & alasannya:**
- **Aturan kuantitas eksplisit di komentar:** masuk PACKING = seluruh item selesai diambil; masuk READY_TO_SHIP = selesai dikemas; PICKING tidak mengubah angka karena pengambilan masih berjalan. Tanpa aturan tertulis ini, angka `picked/packedQuantity` akan diisi asal.
- **READY_TO_SHIP tanpa tombol** — penyerahan ke kurir (nomor resi) dicatat sebagai pesanan SHIPPED di halaman Pesanan; tombolnya drill-down "Buka pengiriman". Satu tahap, satu pemilik.
- **Aksi massal memanggil `onAdvanceFulfillment` per item** (bukan fungsi massal baru) — satu jalur transisi = satu guard + satu audit, tidak ada jalan pintas yang lolos pencatatan (#15).
- **Saringan gudang memakai `warehouseOptionsOf`** yang digeneralisasi menerima irisan field gudang — dipakai baris stok maupun antrean tanpa `as never`.

**Yang belum (#26):** verifikasi SKU per item saat picking (butuh input scanner — rekomendasi DESIGN §13); penyerahan kurir + resi masih manual di halaman Pesanan/Pengiriman; paginasi server.

**Validasi:** `npm run build` PASS (1921 modul), tanpa browser (#30). Regression: Dashboard (KPI pemenuhan + aktivitas ikut hidup), detail pesanan Blok 6 (status gudang ikut berubah), Admin (audit bertambah) — semua lewat props yang sudah ada.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan fungsi advanceFulfillment di App.tsx lalu tulis ulang: cari antrean
//   by id, tolak bila tidak ada tahap berikut, maju status + kuantitas sesuai aturan,
//   lalu tambah entri audit. Petunjuk: pakai fulfillmentTransitions untuk tahap
//   berikut; picked penuh saat masuk PACKING/READY_TO_SHIP, packed penuh hanya
//   saat masuk READY_TO_SHIP.
```

Alasannya: ini pola *transisi state bisnis* yang sama dengan `updateOrderStatus` dan `decideReturn` — cari → validasi → ubah → catat. Tiga fungsi ini satu pola; kuasai polanya, bukan hafalkan fungsinya.

## Halaman Pengiriman & Ekspedisi (Audit PRD #23 · DESIGN IA §4.6 · AGENTS #11/#31)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| Satu definisi "terlambat" (#11) | Dashboard vs Pengiriman beda aturan | `effectiveShipmentStatus` di `utils/shipmentDisplay.ts`, dipakai keduanya |
| #31 aksi harus berbuat sesuatu | Link "Buka resi" di-`preventDefault` (mati) | Link mati dibuang; panel detail + timeline sudah terlihat langsung |
| #31 hasil aksi harus jelas | "Salin resi" hanya `alert()` | Clipboard beneran + fallback + umpan balik "tersalin/gagal" |
| Konteks pola tab | Tab gaya lama | `FilterTabs` + jumlah per status |
| §5.3-D.5 drill-down | Ringkasan statis | 3 `StatCard` menuju saringannya |
| Tema §5 + #24 + #14 | Kartu putih, `font-black`, minim comment, satu empty state | `glass`/`neu`, JSDoc, beda kosong vs saringan ketat |

**Keputusan & alasannya:**
- **Halaman ini sengaja hanya-baca.** PRD #23: shipment = memonitor; status tiba dari kurir/API (nanti via webhook/SSE, rekomendasi DESIGN §13). Tombol ubah-status manual justru melanggar sumber kebenaran — penanda "diterima" tetap milik halaman Pesanan. Keputusan sadar, bukan kekurangan.
- **IN_TRANSIT lewat estimasi tampil sebagai Terlambat** di badge, tab, ringkasan, dan Exception Bar — seragam. Tab "Dalam perjalanan" hanya menampung yang masih sesuai estimasi ("apa yang berjalan" vs "apa yang terlambat", PRD #26).
- **Ekspor CSV tetap simulasi `alert`** — ekspor beneran = rekomendasi DESIGN §13, konsisten dengan halaman Pesanan.

**Yang belum (#26):** umpan status kurir otomatis (webhook/SSE); pencetakan label/resi; pelacakan real-time.

**Validasi:** `npm run build` PASS (1922 modul), tanpa browser (#30). Regression: Exception Bar (aturan terlambat kini lewat fungsi bersama — perilaku identik, diverifikasi via build + review); halaman lain tak tersentuh.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan fungsi effectiveShipmentStatus lalu tulis ulang: kembalikan
//   'DELAYED' bila statusnya DELAYED, atau IN_TRANSIT tapi estimatedDelivery
//   < todayLabel; selain itu kembalikan status aslinya. Lalu jawab: kenapa
//   parameter todayLabel punya nilai default, dan kapan pemanggil mengisinya
//   sendiri? (Petunjuk: lihat pemakaiannya di dashboardInsights vs ShippingPage.)
```

Alasannya: latihan tentang *parameter default sebagai injeksi dependensi sederhana* — dashboard dan halaman pengiriman memakai "hari ini" yang sama tanpa mengimpor jam global di tiap tempat, dan fungsi tetap bisa diuji dengan tanggal pura-pura.

## Halaman Keuangan & Rekonsiliasi (Audit DESIGN §8.4 · §7.3 · PRD #18)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| §8.4 aksi catat cicilan/tambahan | Tab Outstanding hanya-baca | Tombol Catat per baris → `RecordPaymentModal` → angka bergerak |
| PRD #18 + §7.3 rumus | Status ditulis di data | Status diturunkan dari angka (lunas ⇔ sisa nol); guard di modal + App |
| #11 satu istilah | `methodLabel` + status retur duplikat | Pakai `paymentMethodLabels`, `paymentRecordStatusLabels`, `returnStatusLabels` bersama |
| Konteks pola tab | Tab gaya lama | `FilterTabs` + jumlah |
| §5.3-D.5 drill-down | Ringkasan statis | 3 `StatCard` menuju tabnya; baris piutang → detail 360° |
| §11 empty state | Tabel kosong polos | `FinanceEmpty`: beda belum-ada vs saringan-ketat, per tab |
| Tema §5 + #24 | Kartu putih, `font-black`, minim comment | `glass`/`neu`, JSDoc, `scope` kolom, `aria-live` |

**Keputusan & alasannya:**
- **Nominal dibatasi sisa tagihan.** Schema tidak punya status OVERPAID (disebut DESIGN §7.3 tapi tak ada di tipe) — menerima kelebihan berarti menciptakan status siluman (#3). Pesan error menyarankan pecah dua pencatatan.
- **Status catatan = COMPLETED.** Alur maker-checker (catat → verifikasi orang kedua) butuh peran/sistem yang belum ada; FINANCE mencatat sekaligus memverifikasi di simulasi — ditulis eksplisit di komentar, bukan disembunyikan.
- **Tanggal bayar boleh masa lalu, tidak boleh masa depan** (`max` = hari ini) — backdate wajar untuk setoran kemarin; future-date tidak.
- **Refund "diproses" = menunggu inspeksi + disetujui.** Nominal retur menunggu-inspeksi memang belum final — ikut dihitung sebagai "diproses" dengan catatan jujur di caption, bukan sebagai uang keluar.
- **`key` modal per id pesanan** (pola yang sama dengan modal stok) — form tak pernah basi.

**Yang belum (#26):** bukti verifikasi (foto/struk — schema belum punya fieldnya); maker-checker verifikasi; OVERPAID bila bisnis membutuhkannya (butuh status schema dulu); paginasi server.

**Validasi:** `npm run build` PASS (1924 modul), tanpa browser (#30). Regression: detail pesanan Blok 5 (riwayat ikut bertambah), dashboard KPI piutang + fokus FINANCE (angka ikut lunas), Keuangan lain tak tersentuh.

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan fungsi recordPayment di App.tsx lalu tulis ulang: validasi order +
//   nominal, buat PaymentRecord, tambah ke payments, turunkan totalPaid/outstanding/
//   paymentStatus order, sinkronkan selectedOrder bila sama, tambah entri audit.
//   Lalu jawab: kenapa status bayar TIDAK boleh diterima sebagai parameter input?
```

Alasannya: latihan pamungkas pola *turunkan, jangan tulis* — status adalah cermin angka. Kalau status bisa ditulis langsung, cermin dan wajah bisa berbeda (itulah bug "lunas padahal sisa ada" yang dilarang DESIGN §3 FINANCE).

## Halaman Pengajuan Retur (Audit PRD #24 · DESIGN §7.5/§11.3)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| Lifecycle menunggu→setuju/tolak→selesai | APPROVED tak bisa jadi COMPLETED (status terminal mati) | Aksi "Tandai refund selesai" + guard `returnTransitions` di App |
| §11.3 "Return Refund" destruktif | Setuju/tolak sekali klik | Dialog konfirmasi dua-tahap berisi pelanggan, disposisi, nominal |
| #21 audit keputusan | `decideReturn` diam-diam | Tiap keputusan → entri `STATUS_CHANGE` (pelaku = peran aktif) |
| #11 satu istilah | 3 map lokal (status, kondisi, aksi) | Pindah ke `utils/returnDisplay.ts` (status dipakai Keuangan juga) |
| Konteks pola tab | Tab gaya lama | `FilterTabs` + jumlah |
| §5.3-D.5 + ketertelusuran | Ringkasan statis, pesanan asal teks | 3 `StatCard` menuju saringan; tombol "Buka detail pesanan" |
| §11 empty state | Satu gaya | Bedakan: belum-ada vs saringan-ketat |
| Tema §5 + #24 | Kartu putih, `font-black`, minim comment | `glass`/`neu`, JSDoc, `aria-pressed`, panel sticky |

**Keputusan & alasannya:**
- **Tanpa auto-restock saat disetujui.** Return mock tidak punya SKU dan schema menautkan return_items ke order_item (dipecahkan backend) — mencocokkan via string nama produk adalah logika karangan yang rapuh (#3). Disposisi fisik (restock/perbaikan/kirim pengganti) = workflow backend; halaman ini mencatat *keputusan*, bukan mengeksekusinya.
- **Tolak juga dikonfirmasi** (bukan hanya setujui) — menolak menghilangkan hak refund pelanggan sehingga final; tombol finalnya merah untuk setujui (uang keluar) dan teal untuk tolak/selesai.
- **Hasil keputusan memakai `role="status"`** yang sudah ada — dipertahankan, hanya teksnya diperjelas nominalnya.
- **Pencarian mencakup alasan pelanggan** ("luntur", "longgar") — keluhan dicari dengan bahasanya sendiri, bukan nomornya (#31).

**Yang belum (#26):** eksekusi disposisi fisik (restock otomatis, antrean repair, pengiriman pengganti); upload foto bukti kondisi; paginasi server.

**Validasi:** `npm run build` PASS (1924 modul), tanpa browser (#30). Regression: Keuangan tab Refund (label + status hidup), dashboard Exception Bar retur (angka ikut keputusan), Admin (audit bertambah).

### Latihan untuk Dev (ketik sendiri)

```ts
// @ Kosongkan returnTransitions di App.tsx lalu tulis ulang peta transisi retur:
//   PENDING_INSPECTION → [APPROVED, REJECTED], APPROVED → [COMPLETED].
//   Lalu jawab: kenapa REJECTED dan COMPLETED tidak perlu ditulis sebagai kunci
//   (cukup tidak ada), dan apa yang terjadi bila decideReturn dipanggil dengan
//   pasangan yang tidak ada di peta?
```

Alasannya: latihan tentang *state machine eksplisit* — aturan "boleh ke mana" ditulis sebagai data, bukan tersebar di `if` tiap tombol. Guard satu baris (`?.includes`) menggantikan belasan pengecekan manual.

## Halaman Administrasi & Jejak Audit (Audit DESIGN §3/IA §4.10 · AGENTS #9/#16/#21)

Halaman terakhir dari 10 modul — seluruh frontend kini selesai diaudit.

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| State milik pemilik bersama (#16) | `userList` + `logList` lokal → dashboard basi | State `users` di App + transisi beraudit; audit sudah state |
| #21 audit perubahan akun | Aktor hardcode "Administrator Sistem" | Pelaku = peran aktif, konsisten dengan semua aksi lain |
| #31 satu istilah | `roleLabel` "Management" vs dashboard "Manajemen"; `formatTimestamp` duplikat | Pakai `ROLE_LABELS` + `nowTimestamp` bersama; label ke `adminDisplay.ts` |
| Konteks pola tab | 2 tab gaya lama | `FilterTabs` (tampilan + saringan aksi dinamis dari data) |
| §5.3-D.5 drill-down | Ringkasan statis | 4 `StatCard` menuju tabnya |
| §11 empty state | Satu gaya | Bedakan: belum-ada vs saringan-ketat, per tab |
| Tema §5 + #24 | Kartu putih, `font-black`, minim comment | `glass`/`neu`, JSDoc, `scope` kolom, `sr-only`/`aria-live` |

**Keputusan & alasannya:**
- **Suspend tanpa dialog konfirmasi.** §11.3 mewajibkan dua-tahap hanya untuk destruktif data/uang; penangguhan akun tetap tercatat + diumumkan via `role="status"`. Bukan kelalaian — batas dokumen.
- **Peta transisi akun sebagai data di util** (`userStatusTransitions`) — guard App dan tombol halaman membaca sumber yang sama; tombol yang dirender selalu tepat yang diizinkan (#15).
- **Matriks tetap dibaca dari `navItems` sidebar** — satu sumber kebenaran: yang tampil di sini = yang dirender (#16). Kode permission SCHEMA #5 diverifikasi persis sebelum ditampilkan sebagai dokumentasi.
- **Opsi saringan audit dari data** — jenis aksi baru (mis. aksi modul berikutnya) otomatis jadi tab tanpa edit halaman.

**Yang belum (#26):** perubahan izin granular per peran (butuh backend permission N:N); pembuatan akun baru dari UI; login sungguhan + penegakan peran di backend (#9); paginasi server.

**Validasi:** `npm run build` PASS (1926 modul), tanpa browser (#30). Regression: dashboard Fokus ADMIN (akun + peran + audit hidup); halaman lain tak tersentuh. **Frontend 10 modul selesai.**

### Latihan untuk Dev (ketik sendiri)

**Tujuan:** memahami pola pemilik-state yang dipakai di seluruh aplikasi (kampanye, pembayaran, antrean, audit, akun).
**Tingkat:** menengah — butuh melihat 5+ fungsi App sekaligus.
**Tugas:**
```ts
// @ Buka App.tsx dan daftarkan SEMUA useState di atas kertas: orders, inventory,
//   returns, movements, auditLogs, fulfillments, payments, campaigns, users.
//   Untuk tiap state, tulis: (1) halaman apa yang mengubahnya, (2) halaman apa
//   yang ikut berubah karenanya, (3) fungsi App apa penghubungnya.
//   Petunjuk: cari set<Nama> di seluruh file untuk menemukan penulisnya.
```
**Cara menilai benar:** bisa menjawab "kalau tambah state baru X yang dipakai halaman A dan B, taruh di mana?" dengan benar (di App bila >1 konsumen, di halaman bila 1 konsumen) plus menunjuk satu contoh nyata tiap kasus.

## Halaman Kampanye & Banner Promosi (Audit DESIGN §8.5 · PRD #25/#32)

| Kewajiban dokumen | Kondisi lama | Perbaikan |
|---|---|---|
| State milik pemilik bersama (#16) | `useState(campaigns)` di halaman → dashboard basi | State + transisi + audit di App; halaman murni tampilan |
| #21 audit | Perubahan status diam-diam | `changeCampaignStatus` beraudit (guard peta diulang di App) |
| #31 satu istilah | `channelLabel` lokal beda ("Institusi / B2B") | Dihapus; pakai `channelMeta` bersama |
| Konteks pola tab | Tab status + tombol rasio gaya lama | Keduanya `FilterTabs`; label status ke `marketingDisplay.ts` |
| §5.3-D.5 drill-down | Ringkasan statis; CTA pratinjau span mati | 3 `StatCard` (produk → Katalog); CTA "Lihat Produk Kampanye" → Katalog |
| §5.1-B bobot font | `font-black` (900) di 3 tempat | `font-bold` (700); pratinjau `role="img"` + label |
| §11 empty state | Satu gaya | Bedakan: belum-ada vs saringan-ketat |
| #24 | Minim comment | JSDoc seluruh deklarasi; progres periode di util + teruji logikanya |

**Keputusan & alasannya:**
- **Aksi status tanpa dialog konfirmasi.** §11.3 mewajibkan dua-tahap hanya untuk destruktif (batal, refund, hapus, kurang-stok) — jeda/lanjut/selesai kampanye tidak menghancurkan data maupun uang, jadi konfirmasi hanya menambah klik (#28). Hasil aksi tetap diumumkan via `role="status"`.
- **Progres memakai tengah-malam lokal**, bukan UTC — tanpa `T00:00:00`, `new Date("2026-10-01")` dibaca UTC dan tanggal geser sehari di zona WIB. Bug klasik tanggal-yang-tampak-benar.
- **CTA pratinjau menuju Katalog umum**, bukan produk kampanye spesifik — mock belum punya relasi campaign_products per kampanye (SCHEMA #25); mengarang daftarnya = data karangan (#3).

**Yang belum (#26):** relasi produk per kampanye (SCHEMA #25) + tombol CTA ke daftar terfilter; banner visual asli (foto/sasirangan — kini gradien + motif garis); penjadwalan tayang otomatis; paginasi server.

**Validasi:** `npm run build` PASS (1925 modul), tanpa browser (#30). Regression: dashboard Fokus MARKETING (status + jumlah kampanye aktif ikut berubah), Admin (audit bertambah); halaman lain tak tersentuh.

### Latihan untuk Dev (ketik sendiri)

**Tujuan:** memahami kenapa state yang dipakai dua tempat tidak boleh tinggal di salah satunya (lifting state up).
**Tingkat:** menengah — butuh paham aliran data App → halaman.
**Tugas:**
```ts
// @ Kembalikan MarketingPage ke state lokal (useState dari props campaigns),
//   jalankan aplikasi, ubah status kampanye di halaman, lalu buka dashboard
//   dan peran MARKETING. Catat apa yang tidak berubah — itulah bug "data basi".
//   Kembalikan ke state App sesudahnya.
//   Petunjuk: dashboard membaca campaigns dari props App, bukan dari halaman.
```
**Cara menilai benar:** bisa menjelaskan dengan kata sendiri kenapa `campaigns` harus di App (dipakai 2 konsumen: halaman + dashboard) sedangkan `searchQuery` boleh di halaman (1 konsumen) - tanpa menghafal, dengan menunjuk alur props-nya.

## Audit polish Glass×Neu: consistency without repetition

**Tujuan:** memahami beda *redesign* vs *refine*, dan beda *slop* vs *konvensi*.
**Tingkat:** menengah — butuh melihat 10 halaman sebagai satu produk.

Prinsip yang dipakai: **consistency without repetition** — yang sama (tipografi, warna, radius, elevasi, bahasa tombol/status, spacing 4px) tetap sama; yang boleh beda (ukuran/posisi seksi, dominasi workspace, density, split panel, prioritas aksi) dibuat beda sesuai pekerjaan modulnya. Contoh: tabel Pesanan = workspace utama (baris solid), Katalog = kartu produk berjenjang 4 tingkat, Fulfillment = aliran Langkah 1·2·3 dengan aksi operator dominan, Marketing = satu section glass "Ruang kerja kampanye", Admin = audit sebagai bukti (kartu solid + label SEBELUM/SESUDAH).

Aturan microcopy: teks `(PRD §…)/(DESIGN §…)/SCHEMA/AGENTS/"simulasi"` yang TERLIHAT user dihapus → bahasa Indonesia natural yang tetap jujur ("Mode contoh — perubahan hanya tersimpan di sesi ini"). Komentar kode boleh tetap memuat referensi § — itu dokumentasi dev, bukan teks user.

**Tugas:**
```ts
// @ Pilih satu halaman, lalu audit dengan dua pertanyaan per elemen visual:
//   (1) "Elemen ini melayani pekerjaan modul apa?" — jika jawabannya
//   "agar terlihat menarik", itu dekorasi tanpa fungsi → hapus.
//   (2) "Pola ini dipakai di halaman lain?" — jika ya dan konsisten,
//   itu konvensi → pertahankan, jangan "dirapikan" sendirian.
//   Tulis 3 temuan: 1 slop → perbaiki, 2 konvensi → pertahankan + alasan.
```
**Cara menilai benar:** bisa memberi verdict "slop → perbaiki" vs "konsisten → pertahankan" dengan alasan fungsi-vs-dekorasi, tanpa menghapus identitas Glass×Neu hanya karena "terlihat seperti template AI".

## Backend: migration + seeder PostgreSQL (21 tabel definitif)

**Tujuan:** memahami kenapa migration ditulis eksplisit dan apa yang SENGAJA tidak di-migrate.
**Tingkat:** menengah — butuh baca SCHEMA.md + file migration sekali.

Yang dibangun (`backend/src/database/`): `data-source.ts` (satu DataSource, `synchronize: false` — ARCHITECTURE §6 melarang sinkronisasi otomatis), migration `1791321600000-InitPasarPianSchema.ts` (raw SQL dalam class TypeORM agar presisi + tercatat di tabel `migrations`), `seeds/seed.ts` + `run-seed.ts` (transaksi atomik, idempoten), `database.module.ts` (provider `DATA_SOURCE` untuk service modul domain). Perintah: `npm run db:migrate`, `db:revert`, `db:seed`. Hasil terverifikasi: 21 tabel terisi, total pesanan = Σ item + ongkir, `available = physical − reserved` (0 pelanggaran), trigger `updated_at` jalan.

Keputusan dan alasannya:
- **PK UUID** (`gen_random_uuid()`): SCHEMA menulis `UUID / BIGINT` belum diputus; UUID dipilih — aman concurrency, sesuai arah §37/§40.
- **`status` = VARCHAR polos** bila nilainya tak dienumerasi SCHEMA (tanpa CHECK hasil karangan). Hanya 4 enum pasti yang diberi CHECK: `customer.type`, `movement.type` (10 nilai), return `condition`/`action`. Nilai frontend (ACTIVE, PENDING, ...) dipakai seeder sebagai interim sampai database aktual memastikan.
- **Uang NUMERIC(15,2), waktu TIMESTAMPTZ**, trigger `set_updated_at` di 14 tabel ber-`updated_at`.
- **Asumsi tercatat** (target FK tak disebut SCHEMA, konflik #3): `shipments.shipping_address_id → customer_addresses`, `inventory_movements.created_by → users` — keduanya diberi `COMMENT` SQL.
- **Tidak di-migrate** (kondisional, menunggu verifikasi ERP): `permissions` + pivot `role_permissions` (field tak didefinisikan), `campaigns` + `campaign_products`, `invoices` (§38), `files` (§37.7). **Pengecualian:** `audit_logs` ikut di-migrate — field-nya lengkap dan diwajibkan ARCHITECTURE §20. Kolom `slug` tidak ditambahkan ke tabel mana pun (nol tabel mendefinisikannya).
- Seeder: 7 peran, 8 akun (kata sandi dev `pasarpian123`, bcrypt), 6 pesanan lintas 6 status, pembayaran lunas/sebagian/belum, 9 baris stok, 6 mutasi, 2 pemenuhan, 2 kiriman + 5 tracking, 1 retur, 4 audit — angka konsisten dengan mock frontend.

**Tugas:**
```ts
// @ Buka migration dan jawab tanpa menebak: (1) tabel apa yang TIDAK punya
//   created_at, dan kenapa itu benar menurut SCHEMA? (2) tabel apa yang TIDAK
//   punya trigger updated_at, dan kenapa? (3) sebut 2 tabel yang SENGAJA tidak
//   dibuat + alasan masing-masing.
//   Petunjuk: bandingkan daftar kolom tiap CREATE TABLE dengan ringkasan di atas.
```
**Cara menilai benar:** jawaban menyebut tabel + alasan dokumen (bukan "lupa dibuat"), dan bisa menjelaskan beda `synchronize: false` vs `true` dalam satu kalimat.

## Frontend: 3 tema tampilan — Terang / Gelap / Baca (DESIGN §13)

**Tujuan:** memahami cara menema 10 halaman sekaligus tanpa edit massal.
**Tingkat:** menengah — butuh paham cascade layers + CSS variables.

Arsitektur: state `theme` di `App.tsx` (persist `localStorage`, tulis `data-theme` ke `<html>`) → satu lapisan override terpusat di `index.css` memetakan ulang skala netral + teks + border + badge + hover + scrollbar per tema. CSS tak-berlapis menang atas utilities Tailwind yang berlapis (`@layer`), jadi pemetaan berlaku tanpa `dark:` di tiap halaman. Variabel `--surface-glass`/`--elevation-*` ikut ditimpa per tema sehingga kaca & neumorfik otomatis menyesuaikan (Gelap: kaca Ulin + bayangan pekat; Baca: kaca kertas + bayangan cokelat hangat). Yang TIDAK dipetakan: warna brand, badge semantik (hanya disesuaikan terang/gelapnya), sidebar, foto auth, grafik isi (hanya garis bantu + label sumbu via `.trend-chart`). Pengalih: `ThemeSwitcher` (ikon Sun/Moon/BookOpen, `aria-pressed`, bahasa FilterTabs) dipakai header + halaman masuk.

**Tugas:**
```ts
// @ Buka DevTools → paksa <html data-theme="dark">, lalu hover satu badge
//   status dan satu input. Jawab: (1) dari mana warna latar badge berasal
//   (class apa → override apa)? (2) kenapa .bg-[#0D7A70] TIDAK di-override?
//   (3) apa yang terjadi bila localStorage diblokir browser?
//   Petunjuk: baca blok "Tema tampilan" di index.css + state theme di App.tsx.
```
**Cara menilai benar:** bisa menunjuk rantai `state → data-theme → override CSS` (bukan "Tailwind otomatis"), menjelaskan brand tidak dipetakan karena identitas, dan menyebut fallback try/catch ke terang.
