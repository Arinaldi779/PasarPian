# PasarPian — Marketplace Operations & Management Design Specification

**Dokumen Versi:** 2.0  
**Status:** Spesifikasi Desain Resmi (Terintegrasi dengan PRD.md & Identitas Lokal Banua)  
**Produk:** PasarPian — Local-First Marketplace untuk Urang Banua  
**Tipe Sistem:** Web Application (Marketplace & Internal Operations Management)  
**Dokumen Terkait:**
- `PRD.md` (Product Requirements Document)
- `SCHEMA.md` (Database Reference Schema)
- `ARCHITECTURE.md` (System Architecture)

> **Pernyataan Desain:**  
> Dokumen ini merupakan spesifikasi desain resmi antarmuka (*frontend user experience*) untuk aplikasi PasarPian. Dokumen ini menetapkan prinsip desain, identitas visual lokal Banua, arsitektur informasi (*Information Architecture*), spesifikasi design system 3-layer, alur pengguna (*user flows*), perilaku interaksi, status penanganan data, dan efisiensi komunikasi frontend-ke-database.  
> Seluruh kebutuhan dalam dokumen ini berakar langsung pada `PRD.md` dan `SCHEMA.md`. Setiap aspek yang belum ditentukan secara eksplisit di PRD ditandai secara transparan sebagai **Rekomendasi / Keputusan Lanjutan** untuk dievaluasi lebih lanjut.
>
> **Tema Antarmuka Resmi:** Gabungan **Glassmorphism** (permukaan kaca tembus pandang + `backdrop-blur`) dan **Neumorphism** (permukaan lembut terangkat/tertekan dengan dua bayangan halus).
>
> **Font Keluarga Resmi:** **Poppins** — dipakai konsisten pada seluruh teks antarmuka (lihat Bagian 5.0 dan 5.1-B).

---

# 1. Product & Design Objectives

PasarPian adalah marketplace yang mempertemukan pembeli dan penjual dengan identitas lokal Banua serta pengalaman transaksi dan operasional yang sederhana, aman, terpercaya, dan modern.

Aplikasi menangani aktivitas transaksi marketplace (katalog, toko/seller, keranjang, checkout, pembayaran, pesanan, pemenuhan gudang, pengiriman, dan retur) sekaligus menjadi pusat visibilitas operasional bagi tim internal perusahaan.

### 1.1 Tujuan Utama Desain
1. **Mempermudah Pekerjaan Operasional:** Mengubah alur data marketplace yang kompleks menjadi antarmuka yang intuitif dan minim gesekan.
2. **Visibilitas Berbasis Peran (*Role-Based Visibility*):** Menyajikan data yang tepat bagi setiap departemen (Management, Operations, Warehouse, Sales, Finance, Marketing, Admin) tanpa membebani pengguna dengan informasi yang tidak relevan.
3. **Pencegahan Kesalahan Input (*Error Prevention*):** Menegakkan validasi kontekstual dan batasan status bisnis langsung pada interaksi antarmuka.
4. **Visibilitas Status & Pengecualian (*Exception-First*):** Masalah kritis operasional (stok menipis, pengiriman terlambat, pembayaran tertunggak, penumpukan pesanan) harus langsung tampak dan menuntut tindakan.
5. **Integritas & Penelusuran Data Antar-Entitas:** Memungkinkan penelusuran mulus dari Pesanan → Pelanggan → Pembayaran → Pemenuhan → Pengiriman → Retur tanpa kehilangan konteks.
6. **Efisiensi Beban Sistem (*Database & API Protection*):** Desain antarmuka memprioritaskan konsumsi data yang terukur melalui lazy loading, server-side pagination, debounced input, dan skeleton feedback.

---

# 2. Identitas Brand PasarPian (/brand)

### 2.1 Landasan Brand
- **Nama Brand:** PasarPian
- **Positioning:** *Local-first marketplace untuk urang Banua.*
- **Tagline Resmi:**
  > *"Pasar urang Banua, gasan pian."*
- **Karakter Brand:**
  - **Modern:** Visual bersih, rapi, responsif, tipografi kontemporer, dan alur kerja efisien.
  - **Friendly (Ramah):** Hangat, menyambut, tutur kata santun khas Banjar.
  - **Local (Lokal Banua):** Berakar kuat pada kearifan lokal Kalimantan Selatan (alam sungai, kerajinan sasirangan, ketangguhan kayu ulin, etika pasar terapung).
  - **Trustworthy (Terpercaya):** Transparan, data akurat, konfirmasi aman, dan akuntabel.
  - **Simple (Sederhana):** Tidak berbelit-belit, lugas, mengutamakan kemudahan tugas pengguna di atas dekorasi berlebih.

### 2.2 Pilar Filosofi Visual Banua
Identitas visual PasarPian dibangun secara orisinal dari empat pilar alam dan budaya Banua:

1. **Sungai Martapura & Barito (*The Flow of Commerce*):**
   - Direpresentasikan oleh warna **Nilam Sungai / River Emerald (`#0D7A70`)**.
   - Melambangkan ketenangan arus air, kesegaran, keterhubungan antarwilayah, dan kelancaran alur barang serta informasi.
2. **Kain Sasirangan (*The Warmth of Heritage*):**
   - Direpresentasikan oleh aksen **Kuning Kunyit / Sasirangan Amber (`#D97706`)**.
   - Melambangkan semangat wirausaha lokal, kehangatan hubungan penjual-pembeli, dan aksen penanda penting yang bermakna.
3. **Kayu Ulin (*Strength & Reliability*):**
   - Direpresentasikan oleh **Kelabu Ulin / Ironwood Slate (`#0F172A`)**.
   - Melambangkan pondasi yang kokoh, ketahanan integritas data, keamanan transaksi, dan auditabilitas yang tak lekang waktu.
4. **Pasar Terapung & Tradisi Akad (*Honest Trade*):**
   - Interaksi mengadopsi etika jual-beli Banjar: keterbukaan timbangan/kondisi, kejelasan kesepakatan, dan kepuasan kedua belah pihak.

### 2.3 Prinsip Orisinalitas & Anti-Kloning
PasarPian **TIDAK** dirancang sebagai klon atau tiruan dari marketplace manapun (seperti Tokopedia, Shopee, Bukalapak, atau Blibli):
- **Dilarang meniru palet warna klise:** Tidak menggunakan hijau monokrom e-commerce nasional atau oranye mencolok flash-sale.
- **Dilarang meniru antarmuka agresif:** Tidak menggunakan countdown timer panik, animasi pop-up judi berputar (lucky spin), atau banner berkedip yang mengaburkan konsentrasi kerja.
- **Tata letak mandiri:** Struktur navigasi, dashboard metrik, dan tabel kerja dirancang khusus untuk kenyamanan eksekutif dan staf operasional PasarPian.

### 2.4 Panduan Bahasa & Microcopy (Tone of Voice)
- **Bahasa Utama:** Bahasa Indonesia baku yang komunikatif dan profesional tetap menjadi bahasa utama sistem untuk seluruh label, form input, dan data teknis.
- **Sentuhan Bahasa Banjar Terukur:** Digunakan secara elegan pada sapaan (*greeting*), *empty state*, pesan konfirmasi ramah, dan *announcement*:
  - **Sapaan Header:** *"Selamat datang di PasarPian. Pian handak memantau apa hari ini?"*
  - **Konfirmasi Dialog:** *"Apakah Pian yakin handak mambatalakan pesanan ini? Tindakan ini kada kawa dibulikakan."*
  - **Empty State:** *"Balum ada pesanan hanyar nang masuk gasan kriteria ini."*
  - **Pemberitahuan Sukses:** *"Pesanan barhasil diproses. Data telah diperbarui."*
  - **Label Penting Tetap Standar:** Istilah seperti *SKU*, *Total Bayar*, *Nomor Resi*, *Stok Tersedia*, *Gudang*, dan *Tanggal Pesanan* tetap menggunakan Bahasa Indonesia/istilah industri standar agar tidak menimbulkan multitafsir operasional.

---

# 3. Target Pengguna & Model Mental Peran

Berdasarkan PRD Bagian 7 dan 13–31, aplikasi melayani 7 peran utama dengan fokus mental yang berbeda:

| Role | Kebutuhan Utama | Fokus Antarmuka | Anti-Pola yang Dihindari |
|---|---|---|---|
| **MANAGEMENT** | Ringkasan kinerja bisnis, tren omzet, pemantauan bottleneck, perbandingan periode. | Widget KPI level-tinggi, grafik tren penjualan per saluran, kartu pengecualian operasional (*delayed, backlog*). | Jangan tampilkan tabel baris mentah tanpa agregasi ringkasan. |
| **OPERATIONS** | Pemantauan lifecycle pesanan dari masuk hingga selesai, penanganan kendala pesanan. | Antrean status pesanan (*Pending → Confirmed → Processing*), filter cepat kendala, aksi transisi status pesanan. | Jangan sembunyikan pesanan bermasalah di balik filter berjenjang. |
| **WAREHOUSE** | Akurasi stok fisik vs reservasi, proses picking dan packing cepat tanpa salah barang. | Daftar pemenuhan per gudang, checklist picking berbasis SKU dan varian, form packing dengan berat/dimensi, riwayat mutasi stok. | Jangan gabungkan data multi-gudang tanpa pemisah yang jelas. |
| **SALES** | Pemantauan performa pesanan per saluran penjualan, profil pelanggan (Individu vs Institusi). | Filter saluran (*Website, Marketplace, TikTok Shop, Direct*), riwayat pesanan pelanggan, status konfirmasi pesanan. | Jangan campur-adukkan pelanggan institusi dan individu tanpa atribut pembeda. |
| **FINANCE** | Rekonsiliasi pembayaran, pelacakan sisa tagihan (*outstanding*), proses pengembalian dana (*refund*). | Status pembayaran (*Pending, Completed, Partial, Failed*), kartu kalkulasi `Total Paid vs Outstanding`, daftar refund terkait retur. | Jangan tampilkan pesanan seolah lunas jika pembayaran baru sebagian (*partial*). |
| **MARKETING** | Efektivitas kampanye promosi, pantauan produk yang dipromosikan, kontribusi saluran. | Kalender periode kampanye, daftar produk kampanye, metrik performa saluran penjualan. | Jangan tampilkan pengaturan teknis inventaris yang tidak relevan. |
| **ADMIN** | Keamanan sistem, manajemen akun pengguna internal, hak akses peran/permission, jejak audit. | Matriks izin peran (*role-permission matrix*), log audit (*siapa, kapan, entitas apa, nilai lama vs baru*), status akun pengguna (*Active, Inactive, Suspended*). | Jangan izinkan perubahan izin tanpa konfirmasi dan pencatatan audit. |

---

# 4. Arsitektur Informasi (Information Architecture)

Struktur informasi disusun berdasarkan domain bisnis marketplace yang ditentukan oleh PRD dan schema:

```text
PASARPIAN APP SHELL
│
├── 1. BERANDA (DASHBOARD)
│   ├── Ringkasan Eksekutif & KPI Bisnis
│   ├── Kartu Pengecualian Operasional (Exceptions Bar)
│   └── Distribusi Status Transaksi & Saluran
│
├── 2. PENJUALAN (SALES)
│   ├── Pesanan (Orders)
│   │   ├── Daftar Pesanan & Filter Status
│   │   └── Detail Pesanan (Informasi 360° Pesanan)
│   ├── Pelanggan (Customers)
│   │   ├── Daftar Pelanggan (Individu / Institusi)
│   │   └── Detail Pelanggan & Riwayat Transaksi
│   └── Saluran Penjualan (Sales Channels)
│       └── Pemantauan Kinerja per Channel (Website, Marketplace, Direct, dll)
│
├── 3. KATALOG PRODUK (PRODUCTS)
│   ├── Produk (Products)
│   │   ├── Daftar Produk & Status Publikasi
│   │   └── Detail Produk, Deskripsi & Foto
│   ├── Kategori Produk (Categories)
│   └── Varian & SKU (Variants, Ukuran, Warna, Harga & Modal)
│
├── 4. INVENTARIS (INVENTORY)
│   ├── Stok Barang (Stok Fisik, Reserved, Available)
│   ├── Gudang (Warehouses - Multi-gudang beserta Lokasi)
│   └── Mutasi Stok (Inventory Movements - 11 Tipe Pergerakan)
│
├── 5. PEMENUHAN (FULFILLMENT)
│   ├── Antrean Pemenuhan (Fulfillment Queue)
│   ├── Pengambilan Barang (Picking List & Verifikasi SKU)
│   └── Pengepakan (Packing, Dimensi Paket, Berat & Siap Kirim)
│
├── 6. PENGIRIMAN (SHIPPING)
│   ├── Pengiriman Aktif (Shipments - Kurir, Nomor Resi, Status Kirim)
│   └── Pelacakan Pengiriman (Tracking History Kronologis)
│
├── 7. KEUANGAN (FINANCE)
│   ├── Pembayaran (Payments - Metode, Tanggal, Referensi, Status)
│   ├── Tagihan Tertunda (Outstanding Balances)
│   └── Pengembalian Dana (Refunds - Terkait Retur & Pembatalan)
│
├── 8. RETUR (RETURNS)
│   ├── Daftar Pengajuan Retur (Return Requests)
│   └── Inspeksi & Disposisi (Kondisi Barang & Aksi Restock/Repair/Dispose)
│
├── 9. PEMASARAN (MARKETING)
│   ├── Kampanye Promosi (Campaigns & Status)
│   └── Produk & Saluran Kampanye
│
└── 10. ADMINISTRASI (ADMIN)
    ├── Pengguna Internal (Users Management)
    ├── Peran & Izin (Roles & Granular Permissions)
    └── Jejak Audit (Audit Trail Log)
```

---

# 5. Visual Direction & Design System 3-Layer (/design-system & /ui-styling)

Menerapkan arsitektur token tiga lapis: **Primitive Tokens → Semantic Tokens → Component Tokens**.

```text
Primitive Tokens (Nilai Mentah Warna, Skala, Font)
       ↓
Semantic Tokens (Makna Fungsi: Primary, Surface, Destructive, Text-Muted)
       ↓
Component Tokens (Spesifik Komponen: Button-Bg, Table-Row-Hover, Card-Border)
```

### 5.0 Tema Antarmuka: Glassmorphism × Neumorphism

Tema visual PasarPian adalah **gabungan Glassmorphism dan Neumorphism**. Keduanya dipakai secara teratur menurut fungsi elemen — bukan dicampur acak pada elemen yang sama:

| Gaya | Ciri Visual | Dipakai Untuk |
|---|---|---|
| **Glassmorphism** (Permukaan Kaca) | Warna kaca tembus pandang `rgba(255,255,255,0.60–0.85)`, `backdrop-blur` 12–20px, border tipis `1px rgba(255,255,255,0.60)`, bayangan lembut besar | Panel utama, kartu KPI, modal/dialog, sidebar & top bar, panel detail progresif, pratinjau banner |
| **Neumorphism** (Permukaan Lembut) | Permukaan warna latar yang sama dengan **dua bayangan halus**: terang di atas-kiri, gelap di bawah-kanan → kesan terangkat; bayangan dibalik (`inset`) → kesan tertekan | Tombol, input pencarian/form, tab & toggle, paginasi, chip filter, tombol aksi utama |

**Aturan Wajib Penerapan Tema:**

1. **Kaca hanya di atas latar berwarna/bergradasi.** Blur wajib aktif, karena teks di atas kaca tanpa blur akan kehilangan keterbacaan.
2. **Neumorfik hanya di atas latar solid.** Bayangan diambil dari warna latar setempat (putih terang + gelap tembus pandang), bukan hitam pekat.
3. **Kontras teks tetap raja.** Teks di atas permukaan kaca wajib memenuhi kontras minimal `4.5:1`. Jika tidak tercapai, gunakan varian `--glass-bg-strong` atau naikkan ketebalan teks.
4. **Elemen kecil tidak dikaca-kan.** Badge status, teks mikro, dan ikon tetap tajam dengan latar solid agar status tidak kehilangan arti.
5. **Satu elemen, satu gaya.** Jangan memberi efek kaca *dan* tekanan neumorfik pada elemen yang sama, agar hierarki visual tetap jelas.
6. **Fallback aksesibilitas.** Pada mode `prefers-reduced-transparency` / perangkat hemat daya, permukaan kaca jatuh ke `--bg-surface` solid dengan border tetap; cincin fokus keyboard tetap `2px solid var(--border-focus)`.

---

### 5.1 Layer 1: Primitive Tokens

#### A. Palet Warna Banua
```css
/* Netral & Elemen Dasar Ulin */
--primitive-ulin-950: #020617;
--primitive-ulin-900: #0F172A; /* Kayu Ulin Dark */
--primitive-ulin-800: #1E293B;
--primitive-ulin-700: #334155;
--primitive-ulin-500: #64748B;
--primitive-ulin-300: #CBD5E1;
--primitive-ulin-200: #E2E8F0;
--primitive-ulin-100: #F1F5F9;
--primitive-ulin-50:  #F8FAF9; /* Pasir Sungai Soft Background */
--primitive-white:    #FFFFFF;

/* Nilam Sungai Martapura (River Emerald / Teal) */
--primitive-river-900: #064E3B;
--primitive-river-800: #0A625A;
--primitive-river-700: #0D7A70; /* Brand Primary */
--primitive-river-600: #109489;
--primitive-river-500: #14B8A6;
--primitive-river-100: #CCFBF1;
--primitive-river-50:  #F0FDF4;

/* Kuning Sasirangan (Warm Amber / Ochre) */
--primitive-amber-800: #92400E;
--primitive-amber-700: #B45309;
--primitive-amber-600: #D97706; /* Brand Accent */
--primitive-amber-500: #F59E0B;
--primitive-amber-100: #FEF3C7;
--primitive-amber-50:  #FFFBEB;

/* Status Semantik Semesta */
--primitive-crimson-600: #E11D48; /* Destructive / Alert */
--primitive-crimson-100: #FFE4E6;
--primitive-forest-600:  #16A34A; /* Success */
--primitive-forest-100:  #DCFCE7;
--primitive-sky-600:     #0284C7; /* Shipping Info */
--primitive-sky-100:     #E0F2FE;
```

#### B. Tipografi — Keluarga Font: **Poppins**
- **Aturan Utama:** Seluruh teks antarmuka memakai **`Poppins`** secara konsisten — display, heading, body, label, tombol, form, tabel, badge, dan pesan. Tidak ada keluarga font lain pada teks UI.
- **Display & Heading:** `Poppins` — Bold (700) / Semibold (600), geometris, bersih, profesional.
- **Body & Interface:** `Poppins` — Regular (400) / Medium (500).
- **Angka Rupiah, Kuantitas, Nomor Dokumen (SKU, Resi, IDR):** `Poppins` dengan `font-variant-numeric: tabular-nums` agar kolom angka tetap rata dan tidak bergeser saat nilai berubah.
- **Monospace (hanya token teknis murni):** `JetBrains Mono` dibatasi untuk kode izin (`order.read`), hash, dan potongan log mentah — bukan untuk teks maupun angka antarmuka.
- **Bobot Font yang Diizinkan:** `400`, `500`, `600`, `700`. Jangan memakai bobot di luar rentang ini agar hierarki tetap stabil.
- **Skala Ukuran Tipografi (dengan Poppins):**
  - `Display`: `32px` / line-height `40px` / bold (700)
  - `Title 1`: `24px` / line-height `32px` / semibold (600)
  - `Title 2`: `20px` / line-height `28px` / semibold (600)
  - `Subhead`: `16px` / line-height `24px` / medium (500)
  - `Body Regular`: `14px` / line-height `20px` / normal (400)
  - `Body Medium`: `14px` / line-height `20px` / medium (500)
  - `Caption`: `12px` / line-height `16px` / normal (400)
  - `Micro`: `10px` / line-height `14px` / semibold (600) (untuk badge status kompak)

#### C. Spacing & Radius
- **Spacing Baseline (4px):** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
- **Border Radius:**
  - `sm`: `4px` (input controls, tag kecil)
  - `md`: `8px` (button, dropdown, badge)
  - `lg`: `12px` (card, modal, dialog, sheet)
  - `xl`: `16px` (panel besar, container utama)
  - `full`: `9999px` (pill badges, avatar)

#### D. Elevasi & Bayangan (River Mist Shadows)
- `shadow-xs`: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`
- `shadow-sm`: `0 1px 3px 0 rgba(15, 23, 42, 0.07), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`
- `shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)`
- `shadow-lg`: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`

#### E. Token Tema: Kaca (Glass) & Neumorf (Neumorph)
```css
/* Glassmorphism — permukaan kaca */
--glass-bg:         rgba(255, 255, 255, 0.70);   /* permukaan kaca standar */
--glass-bg-strong:  rgba(255, 255, 255, 0.88);   /* kaca pekat untuk teks padat */
--glass-border:     rgba(255, 255, 255, 0.60);   /* garis tipis kaca */
--glass-blur:       16px;                        /* backdrop-filter: blur(16px) */
--glass-shadow:     0 8px 24px rgba(15, 23, 42, 0.08);

/* Neumorphism — permukaan lembut (warna latar diambil dari latar sekitar) */
--neu-radius:       12px;
--neu-shadow:       6px 6px 12px rgba(15, 23, 42, 0.10),
                    -6px -6px 12px rgba(255, 255, 255, 0.85);   /* terangkat */
--neu-shadow-in:    inset 3px 3px 6px rgba(15, 23, 42, 0.10),
                    inset -3px -3px 6px rgba(255, 255, 255, 0.85); /* tertekan */
```

---

### 5.2 Layer 2: Semantic Tokens

```css
:root {
  /* Surface & Background */
  --bg-app: var(--primitive-ulin-50);
  --bg-surface: var(--primitive-white);
  --bg-surface-subtle: var(--primitive-ulin-100);
  --bg-surface-hover: #F8FAFC;
  --bg-sidebar: var(--primitive-ulin-900);
  --bg-sidebar-active: var(--primitive-ulin-800);

  /* Brand Semantic */
  --color-primary: var(--primitive-river-700);
  --color-primary-hover: var(--primitive-river-800);
  --color-primary-subtle: var(--primitive-river-50);
  --color-accent: var(--primitive-amber-600);
  --color-accent-hover: var(--primitive-amber-700);
  --color-accent-subtle: var(--primitive-amber-50);

  /* Typography Semantic */
  --text-main: var(--primitive-ulin-900);
  --text-secondary: var(--primitive-ulin-700);
  --text-muted: var(--primitive-ulin-500);
  --text-on-primary: var(--primitive-white);
  --text-on-dark: var(--primitive-white);
  --text-on-accent: var(--primitive-white);

  /* Tema: Glassmorphism & Neumorphism */
  --surface-glass: var(--glass-bg);
  --surface-glass-strong: var(--glass-bg-strong);
  --surface-glass-blur: var(--glass-blur);
  --surface-glass-border: var(--glass-border);
  --elevation-raised: var(--neu-shadow);      /* kesan terangkat (tombol, kartu aksi) */
  --elevation-pressed: var(--neu-shadow-in);  /* kesan tertekan (input, tab aktif) */

  /* Borders & Dividers */
  --border-subtle: var(--primitive-ulin-200);
  --border-strong: var(--primitive-ulin-300);
  --border-focus: var(--primitive-river-700);

  /* Status Colors */
  --status-success-bg: var(--primitive-forest-100);
  --status-success-text: var(--primitive-forest-600);
  --status-warning-bg: var(--primitive-amber-100);
  --status-warning-text: var(--primitive-amber-800);
  --status-danger-bg: var(--primitive-crimson-100);
  --status-danger-text: var(--primitive-crimson-600);
  --status-info-bg: var(--primitive-sky-100);
  --status-info-text: var(--primitive-sky-600);
}
```

---

### 5.3 Layer 3: Component Specifications & Variant Tables

#### A. Tombol (Buttons)
| Varian | Default | Hover | Active / Focus | Disabled |
|---|---|---|---|---|
| **Primary (Banua)** | Background: `--color-primary`, Teks: Putih, Radius: 8px | Background: `--color-primary-hover`, Bayangan: `shadow-sm` | Outline: `2px solid var(--border-focus)`, Offset: 2px | Background: `--primitive-ulin-200`, Teks: `--primitive-ulin-500`, Kursor: `not-allowed` |
| **Secondary (Outline)** | Background: Transparan, Border: `1px solid var(--border-strong)`, Teks: `--text-main` | Background: `--bg-surface-subtle`, Border: `--color-primary` | Outline: `2px solid var(--border-focus)` | Border: `--primitive-ulin-200`, Teks: `--primitive-ulin-300` |
| **Accent (Sasirangan)** | Background: `--color-accent`, Teks: Putih | Background: `--color-accent-hover` | Outline: `2px solid var(--color-accent)` | Background: `--primitive-ulin-200`, Teks: Muted |
| **Destructive** | Background: `--status-danger-bg`, Border: `1px solid var(--primitive-crimson-600)`, Teks: `--primitive-crimson-600` | Background: `--primitive-crimson-600`, Teks: Putih | Outline: `2px solid var(--primitive-crimson-600)` | Opacity: 0.5, Kursor: `not-allowed` |
| **Ghost / Subtle** | Background: Transparan, Teks: `--text-secondary` | Background: `--bg-surface-subtle`, Teks: `--text-main` | Background: `--bg-surface-subtle` | Opacity: 0.4 |

#### B. Status Badges & Pills
Badge status operasional harus **selalu menggunakan kombinasi teks + warna latar belakang halus + ikon penanda visual** agar memenuhi standar aksesibilitas WCAG (tidak hanya mengandalkan warna semata).

| Status Bisnis | Background Token | Text Token | Ikon Penanda (Lucide) | Makna Bisnis di PasarPian |
|---|---|---|---|---|
| **Pending** | `--status-warning-bg` | `--status-warning-text` | `Clock` | Pesanan/Pembayaran baru masuk, menunggu verifikasi. |
| **Confirmed** | `--status-info-bg` | `--status-info-text` | `CheckCircle2` | Pesanan telah dikonfirmasi oleh penjual/operasional. |
| **Processing** | `--status-info-bg` | `--status-info-text` | `PackageSearch` | Pesanan masuk antrean gudang untuk pemenuhan. |
| **Picked** | `--primitive-river-100` | `--primitive-river-800` | `Boxes` | Barang telah selesai diambil dari rak gudang. |
| **Packed** | `--primitive-river-100` | `--primitive-river-800` | `PackageCheck` | Barang terbungkus rapi dan memiliki label resi. |
| **Shipped** | `--status-info-bg` | `--status-info-text` | `Truck` | Paket telah diserahkan ke pihak kurir ekspedisi. |
| **Delivered** | `--status-success-bg` | `--status-success-text` | `Home` | Paket telah berhasil diterima pelanggan. |
| **Cancelled** | `--status-danger-bg` | `--status-danger-text` | `XCircle` | Pesanan dibatalkan sesuai aturan bisnis. |
| **Returned** | `--primitive-amber-100` | `--primitive-amber-800` | `RotateCcw` | Barang diajukan/diterima retur untuk inspeksi. |

#### C. Tabel Kerja Operasional (Operational Data Table)
- **Header:** Sticky top, background `--bg-surface-subtle`, teks `--text-muted` (uppercase 12px semibold), border bawah tipis 1px.
- **Baris:** Tinggi kompak 48px, background `--bg-surface`, hover `--bg-surface-hover`, transisi 150ms.
- **Zebra Striping:** Opsional untuk tabel berkolom banyak (>8 kolom).
- **Format Data Numerik:** Seluruh angka harga, kuantitas, dan kode teknis diratakan kanan (*right-aligned*) menggunakan **Poppins** dengan `font-variant-numeric: tabular-nums` agar kolom tetap rapi; monospace hanya untuk token teknis murni (lihat Bagian 5.1-B).
- **Kolom Aksi:** Selalu diletakkan di sisi paling kanan dengan tombol aksi terarah atau dropdown menu elipsis (`MoreHorizontal`).
- **Paginasi Terpadu:** Kontrol baris per halaman (10, 25, 50, 100), jumlah total data aktif, dan tombol halaman responsif.

#### D. Kartu Metrik / Widget KPI
- **Struktur Kartu:** Background `--bg-surface`, border 1px `--border-subtle`, radius 12px, padding 20px.
- **Elemen:**
  1. Label Metrik (14px medium, `--text-muted`) + Ikon Kategori.
  2. Nilai Utama (24px/28px bold font angka, `--text-main`).
  3. Indikator Perbandingan / Tren (+/- % vs periode sebelumnya atau keterangan waktu).
  4. Indikator Pengecualian (*Exception Tag*) jika terdapat item yang butuh tindakan (misal: "3 pesanan terlambat").
  5. Target Drill-down interaktif (mengarah langsung ke daftar terfilter).

#### E. Penerapan Tema pada Komponen (Glass × Neumorph)

| Komponen | Gaya Tema | Token | Catatan Penerapan |
|---|---|---|---|
| Panel Konten & Kartu KPI | **Glass** | `--surface-glass` + `--surface-glass-blur` | Latar di balik panel dibuat lembut agar blur terlihat; teks wajib kontras ≥4.5:1 |
| Sidebar & Top Bar | **Glass pekat** | `--surface-glass-strong` | Kaca lebih pekat agar teks navigasi tidak terbaca buram |
| Modal / Dialog | **Glass pekat di atas scrim** | `--surface-glass-strong` + scrim `rgba(15,23,42,0.4)` | Dialog selalu punya latar gelap tipis agar fokus tugas terjaga |
| Tombol (Primary, Secondary, Accent, Destructive) | **Neumorph terangkat** | `--elevation-raised` | Default terangkat → `:active` memakai `--elevation-pressed` |
| Input, Pencarian, Textarea | **Neumorph tertekan** | `--elevation-pressed` | Bentuk "ditekan" menandakan area yang bisa diisi |
| Tab Aktif, Toggle, Paginasi, Chip Filter | **Neumorph** | `--elevation-raised` / `--elevation-pressed` | Tab aktif tertekan, tab non-aktif rata |
| Badge / Pill Status | **Solid datar** | `--status-*-bg` | Sengaja tanpa kaca/neumorf agar status selalu tajam & terbaca |
| Tabel Kerja Operasional | **Solid** | `--bg-surface` | Baris tabel tidak boleh transparan agar angka mudah dipindai; header boleh glass pekat |

Seluruh komponen pada tabel di atas memakai **Poppins** (Bagian 5.1-B) sebagai satu-satunya keluarga font antarmuka.

---

# 6. Tata Letak Shell Aplikasi & Navigasi Global

### 6.1 Master App Shell
Aplikasi menggunakan tata letak panel terintegrasi (*Split-pane shell*):

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [Logo PasarPian] | Breadcrumbs | Global Search (Ctrl+K) | Notif | Profil/Role │
├───────────────┬────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR       │ MAIN CONTENT WORKSPACE                                                 │
│ [Beranda]     │ ┌────────────────────────────────────────────────────────────────────┐ │
│ [Penjualan]   │ │ Page Header: Judul Halaman + Contextual Actions (Filter, Export)   │ │
│ [Katalog]     │ ├────────────────────────────────────────────────────────────────────┤ │
│ [Inventaris]  │ │ Exception / Alert Bar (Jika ada bottleneck/overdue)                │ │
│ [Pemenuhan]   │ ├────────────────────────────────────────────────────────────────────┤ │
│ [Pengiriman]  │ │ Metric Summary Cards (Jika berlaku)                                │ │
│ [Keuangan]    │ ├────────────────────────────────────────────────────────────────────┤ │
│ [Retur]       │ │ Data Workspace: Filter Bar + Data Table / Detailed Panels          │ │
│ [Pemasaran]   │ │                                                                    │ │
│ [Admin]       │ └────────────────────────────────────────────────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Navigasi Sidebar Responsif
- **Identitas Visual:** Warna dasar `--bg-sidebar` (Ulin Slate gelap yang kokoh), logo PasarPian dengan aksen Nilam River dan Sasirangan.
- **Grouping Navigasi:** Dikelompokkan rapi ke dalam 4 zona:
  1. *Utama:* Beranda / Dashboard.
  2. *Operasi Transaksi:* Penjualan, Katalog, Inventaris, Pemenuhan, Pengiriman.
  3. *Finansial & Pasca-Jual:* Keuangan, Retur, Pemasaran.
  4. *Sistem:* Administrasi, Pengaturan Akun.
- **Penyaringan Berdasarkan Permission:** Menu yang tidak diizinkan oleh peran pengguna **tidak dirender** di sidebar untuk menjaga kebersihan visual dan keamanan pengguna.
- **Status Aktif:** Item navigasi aktif memiliki aksen latar belakang `--bg-sidebar-active` dan garis indikator kiri Nilam River (`3px solid var(--color-primary)`).

### 6.3 Global Search Terpadu (Cmd/Ctrl+K)
Mencari langsung ke entitas operasional dengan identifikasi tipe hasil pencarian yang jelas:
- Masukan input: `ORD-2026-0012` → Hasil: `[Pesanan] ORD-2026-0012 — Pelanggan: Hj. Mardiah`
- Masukan input: `Airy Pro` → Hasil: `[Produk] Airy Pro+ Standard — SKU: AP-STD-01`
- Masukan input: `JNE99120` → Hasil: `[Pengiriman] JNE99120817 — Kurir: JNE Regular`
- Masukan input: `Banjarmasin` → Hasil: `[Gudang] Gudang Banjarmasin Barat (WH-BDJ-01)`

---

# 7. Spesifikasi Alur Pengguna (User Flows & Blueprints)

### 7.1 Alur Autentikasi & Sesi Pengguna
Sesuai PRD Bagian 8 & 9:
1. **Pilihan Masuk:**
   - Masuk dengan Email & Password terenkripsi.
   - Masuk dengan Google OAuth terverifikasi.
2. **Validasi & Penentuan Sesi:**
   - Sistem memeriksa kecocokan kredensial dan status akun (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
   - Jika akun `SUSPENDED` atau tidak memiliki peran yang sesuai, antarmuka menampilkan pesan santun namun tegas: *"Akun Pian kada aktif atau belum memiliki izin akses. Silakan hubungi Administrator."*
3. **Pengalihan Berdasarkan Peran (*Role Routing*):**
   - Peran `MANAGEMENT` diarahkan ke Beranda Dashboard Eksekutif.
   - Peran `WAREHOUSE` diarahkan ke Antrean Pemenuhan & Stok Gudang.
   - Peran `OPERATIONS` diarahkan ke Antrean Pesanan Masuk.
   - Peran `FINANCE` diarahkan ke Ringkasan Pembayaran & Outstanding.

```text
[User Akses Login]
       │
       ├── Input Email/Password ───┐
       └── Klik Google OAuth ──────┤
                                   ↓
                         [Autentikasi Backend]
                                   │
                     ┌─────────────┴─────────────┐
                     ↓                           ↓
             [Kredensial Valid]          [Kredensial Gagal]
                     │                           │
           [Cek Status Akun]             [Tampilkan Pesan Error
                     │                    Aman tanpa leak info]
          ┌──────────┴──────────┐
          ↓                     ↓
       [ACTIVE]        [SUSPENDED / INACTIVE]
          │                     │
   [Inisialisasi         [Akses Ditolak:
    Sesi & Role]          Tampilkan Kontak Admin]
          │
          ↓
[Arahkan ke Ruang Kerja Sesuai Role]
```

---

### 7.2 Alur Lifecycle Pesanan & Pemenuhan (Order-to-Delivery Flow)
Sesuai PRD Bagian 16, 22, dan 23:

```text
[Pesanan Baru: PENDING]
       │
       ├── Aksi: Konfirmasi Pesanan ───> [CONFIRMED]
       │                                     │
       ├── Aksi: Batalkan Pesanan            ├── Aksi: Masukkan ke Pemenuhan Gudang
       │         (Alasan Pembatalan)         │
       │                                     ↓
       ↓                               [PROCESSING]
  [CANCELLED]                                │
                                       [Antrean Gudang: PICKING]
                                             │
                                       (Verifikasi SKU & Kuantitas Fisik)
                                             │
                                             ↓
                                       [Antrean Gudang: PACKING]
                                             │
                                       (Input Berat/Dimensi & Tempel Resi)
                                             │
                                             ↓
                                       [READY TO SHIP]
                                             │
                                       (Penyerahan ke Kurir & Catat Jam Kirim)
                                             │
                                             ↓
                                       [SHIPPED / IN TRANSIT]
                                             │
                                       (Pelacakan Resi Kronologis)
                                             │
                                             ↓
                                       [DELIVERED]
                                             │
                                             ├── Transaksi Selesai
                                             └── Pengajuan Retur (Jika ada komplain)
```

**Aturan Transisi Status:**
- Aksi pada UI hanya boleh merender transisi yang sah.
- Pesanan yang sudah `DELIVERED` tidak boleh memiliki tombol aksi `Batal` atau `Proses Gudang`.
- Setiap perubahan status memicu penulisan ke riwayat log audit internal.

---

### 7.3 Alur Keuangan, Pembayaran & Outstanding
Sesuai PRD Bagian 18:
- **Formula Bisnis Source of Truth:**
  $$\text{Total Paid} = \sum \text{Payments}$$
  $$\text{Outstanding} = \text{Order Total} - \text{Total Paid}$$
- **Tampilan Antarmuka Keuangan:**
  - Baris pesanan menampilkan badge status pembayaran: `UNPAID` ($0$), `PARTIAL` ($>0 < \text{Total}$), `PAID` ($=\text{Total}$), atau `OVERPAID`.
  - Pada halaman detail pembayaran, terdapat rekapitulasi pembayaran bertahap (*multi-payment installment log*) lengkap dengan nomor referensi bank, tanggal bayar, metode bayar, dan sisa outstanding terkini.

---

### 7.4 Alur Inventaris & 11 Tipe Mutasi Stok
Sesuai PRD Bagian 19–20:
- **Formula Stok:**
  $$\text{Stok Tersedia (Available)} = \text{Stok Fisik (Physical)} - \text{Stok Reservasi (Reserved)}$$
- **11 Tipe Mutasi yang Didukung Antarmuka:**
  1. `RECEIVE`: Penerimaan stok masuk dari supplier/pembelian.
  2. `RESERVE`: Penguncian stok saat pesanan dikonfirmasi.
  3. `RELEASE`: Pelepasan stok saat pesanan dibatalkan.
  4. `PICK`: Pengambilan fisik barang dari rak.
  5. `SHIP`: Pengurangan stok saat barang diberangkatkan.
  6. `RETURN`: Penambahan stok kembali dari barang retur yang layak jual.
  7. `ADJUSTMENT`: Penyesuaian stok saat opname/perhitungan ulang fisik.
  8. `TRANSFER_IN`: Penerimaan barang transfer dari gudang lain.
  9. `TRANSFER_OUT`: Pengiriman barang transfer ke gudang lain.
  10. `DAMAGE`: Pencatatan stok rusak di gudang.
  11. `DISPOSE`: Pemusnahan barang rusak yang tidak dapat diperbaiki.

Setiap form mutasi wajib mencatat: Gudang asal, Varian/SKU, Jumlah perubahan, Nomor referensi dokumen, dan Catatan alasan.

---

### 7.5 Alur Penanganan Retur & Disposisi Barang
Sesuai PRD Bagian 24:
- Pengajuan retur harus selalu terhubung dengan Nomor Pesanan orisinal dan Pelanggan bersangkutan.
- **Kondisi Barang yang Diterima:**
  - `GOOD` (Kondisi baik/segel utuh)
  - `DAMAGED` (Kemasan/barang rusak fisik)
  - `DEFECTIVE` (Cacat produksi/fungsi tidak normal)
  - `UNKNOWN` (Belum diinspeksi)
- **Aksi Disposisi:**
  - `RESTOCK`: Masukkan kembali ke stok tersedia gudang.
  - `REPAIR`: Masukkan ke antrean perbaikan.
  - `DISPOSE`: Buang/musnahkan dari inventaris.
  - `REPLACE`: Kirimkan barang pengganti baru ke pelanggan.
- **Penyelesaian Finansial:**
  - Integrasi pencatatan `Refund Amount` yang otomatis mengalir ke modul Finance.

---

# 8. Spesifikasi Pengalaman Setiap Halaman (Page Experience)

### 8.1 Halaman Beranda / Dashboard
- **Komponen Utama:**
  1. **Greeting Bar:** Sapaan bersahabat *"Selamat datang, Pian [Nama Pengguna]"* dengan keterangan waktu dan status sinkronisasi sistem.
  2. **Exception Bar (Prioritas Paling Atas):** Kartu sorotan berwarna lembut penanda hal mendesak:
     - Pesanan tertahan pemenuhan >24 jam.
     - Stok SKU berada di bawah batas minimum (*low stock*).
     - Pengiriman kurir yang terlambat (*delayed shipments*).
     - Tagihan pesanan yang jatuh tempo.
  3. **Row Kartu KPI Utama:** Total Penjualan, Total Pesanan, Persentase Pemenuhan Selesai, Total Piutang (*Outstanding*).
  4. **Grafik Kinerja Saluran Penjualan:** Distribusi omzet per saluran (*Website, Marketplace, TikTok Shop, Direct*).
  5. **Tabel Ringkas Aktivitas Terkini:** 5 transaksi atau mutasi stok terakhir dengan link langsung ke detail.

### 8.2 Halaman Pesanan (Order List & Detail 360°)
- **Daftar Pesanan:**
  - Filter cepat: Status Pesanan (*Semua, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled*), Saluran Penjualan, Rentang Tanggal, dan Status Pembayaran.
  - Kolom: No. Pesanan, Tanggal, Pelanggan, Saluran, Total Belanja, Status Pesanan, Status Bayar, Aksi Cepat.
- **Detail Pesanan 360° (Single Source of Truth View):**
  - Mengikuti prinsip kontekstual PRD: User tidak perlu membuka 5 halaman berbeda untuk memahami 1 pesanan.
  - **Blok 1 (Identitas):** Nomor Pesanan, Waktu Masuk, Channel, Status Lifecycle.
  - **Blok 2 (Pelanggan):** Nama, Tipe (Individu/Institusi), Kontak, Alamat Pengiriman Lengkap.
  - **Blok 3 (Item Belanja):** Tabel Varian, SKU, Harga Satuan, Diskon, Subtotal.
  - **Blok 4 (Ringkasan Biaya):** Subtotal, Ongkos Kirim, Diskon, Pajak, Total Akhir.
  - **Blok 5 (Pembayaran):** Daftar riwayat pembayaran yang masuk, metode, tanggal, dan sisa *Outstanding*.
  - **Blok 6 (Pemenuhan & Pengiriman):** Status Picking, Packing, Kurir, Nomor Resi, dan Riwayat Pelacakan.
  - **Blok 7 (Jejak Audit):** Riwayat perubahan status kronologis (siapa yang mengubah dan kapan).

### 8.3 Halaman Gudang, Pemenuhan & Mutasi Stok
- **Antrean Pemenuhan (Fulfillment):**
  - Tampilan tab: *Siap Diambil (Ready to Pick) → Sedang Dikemas (Packing) → Siap Dikirim (Ready to Ship)*.
  - Tombol aksi massal (*Bulk Action*): Cetak Dokumen Picking Masal, Konfirmasi Packing Masal.
- **Stok Gudang (Inventory Grid):**
  - Filter berdasarkan Gudang Fisik (*Gudang Banjarmasin, Gudang Banjarbaru, dll*).
  - Kolom: SKU, Nama Produk, Varian, Stok Fisik, Stok Terkunci (Reserved), Stok Tersedia (Available), Indikator Status (Aman / Menipis / Habis).
  - Aksi: Tombol *Sesuaikan Stok (Adjustment)* dengan modal dialog beralasan wajib.

### 8.4 Halaman Keuangan & Rekonsiliasi
- **Tab Navigasi:** *Semua Pembayaran | Tagihan Tertunda (Outstanding) | Pengembalian Dana (Refund)*.
- **Metrik Utama:** Total Masuk Periode Ini, Total Piutang Belum Lunas, Total Refund Diproses.
- **Detail Pembayaran:** Menampilkan nomor invoice/referensi transfer, bukti verifikasi, dan tombol aksi pencatatan pembayaran cicilan/tambahan jika belum lunas.

### 8.5 Halaman Pemasaran & Banner Promosi (/banner-design)
Sesuai PRD Bagian 25 dan 32 (Marketplace Discovery & Promotion):
- **Daftar Kampanye:** Nama kampanye, Periode aktif, Saluran target, Status (*Draft, Active, Completed, Paused*).
- **Spesifikasi Banner Promosi & Pengumuman Internal:**
  - **Rasio Aspek Standar:**
    - *Hero Announcement Banner:* Rasio `4:1` (desktop `1200x300px`, mobile `600x200px`).
    - *Card Promosi Kanal:* Rasio `16:9` (`800x450px`).
    - *Widget Promo Kompak:* Rasio `1:1` (`300x300px`).
  - **Hierarki Konten Banner:**
    1. *Headline Khas Banua:* Sapaan lokal yang santun (misal: *"Promo Haruan Basar: Diskon Belanja Urang Banua"*).
    2. *Keterangan Periode & Syarat:* Teks sekunder yang terbaca jelas dengan kontras minimal 4.5:1.
    3. *Visual Orisinal:* Menggunakan elemen motif sasirangan minimalis atau fotografi produk nyata, bukan stok visual generik luar negeri.
    4. *Aksi Tunggal (CTA):* Tombol aksi yang jelas (misal: *"Lihat Produk Kampanye"*).

---

# 9. Kontrak Antarmuka Frontend & Batasan API (/api-and-interface-design)

Untuk menjaga kestabilan antarmuka dan integritas komunikasi data dengan backend:

### 9.1 Amplop Standar Respon Data (Response Envelope Contract)
Setiap panggilan data dari antarmuka mengharapkan format amplop standar:

```typescript
// Kontrak Standar Respon API untuk Frontend PasarPian
interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### 9.2 Kontrak Permintaan Data (Query Parameters Contract)
Antarmuka mengirimkan parameter terstandar pada setiap tabel data:
- `page`: Nomor halaman aktif (default: `1`).
- `limit`: Jumlah baris per halaman (default: `25`).
- `sort_by`: Nama field acuan pengurutan (misal: `created_at`, `total_amount`).
- `order`: Arah pengurutan (`asc` atau `desc`).
- `search`: Kata kunci pencarian teks bebas (selalu di-*debounce* 350ms di sisi klien).
- `filters[field_name]`: Filter berdasar kolom spesifik (misal: `filters[status]=PENDING&filters[warehouse_id]=WH-01`).

### 9.3 Optimistic vs Pessimistic UI Updates
1. **Pessimistic Update (Wajib untuk Transaksi Kritis):**
   - Transisi status pesanan, pembayaran baru, perubahan stok gudang, dan pembatalan pesanan **WAJIB** menunggu konfirmasi sukses dari backend sebelum UI memperbarui state visual. Tombol menampilkan spinner lokal dan berada dalam kondisi `disabled` selama proses.
2. **Optimistic Update (Hanya untuk Preferensi Klien):**
   - Buka-tutup filter sidebar, bookmark lokal, atau collapse panel detail.

---

# 10. Efisiensi Permintaan & Perlindungan Database (Request Efficiency)

Sesuai ketentuan teknis dari `DESIGN.md` dan `PRD.md`:

1. **Debounce pada Input Pencarian:**
   - Input pencarian pada tabel data menggunakan batas tunda (*debounce*) `350ms` sebelum mengirim request ke API guna mencegah ratusan query database yang sia-sia saat pengguna mengetik.
2. **Paginasi & Pengambilan Data Terbatas di Sisi Server (*Server-Side Only*):**
   - Dilarang keras mengambil seluruh baris tabel dari database lalu melakukan paginasi di browser (*in-memory*).
   - Seluruh paginasi, pencarian, dan penyortiran wajib dieksekusi di level query database melalui parameter API.
3. **Pemuatan Bertahap (*Lazy Loading Sub-Resources*):**
   - Pada halaman Detail Pesanan, data tab sekunder (seperti Riwayat Lengkap Pelacakan Logistik atau Log Jejak Audit) tidak dimuat saat render awal halaman, melainkan baru diambil ketika pengguna mengklik tab terkait.
4. **Pencegahan Polling Agresif:**
   - Tidak menggunakan `setInterval` polling cepat tanpa jeda. Jika dibutuhkan penyegaran data berkala, gunakan interval wajar (minimal 60 detik) dengan opsi tombol penyegaran manual (*Manual Refresh Button*).
5. **Agregasi Khusus untuk Dashboard:**
   - Halaman Dashboard meminta endpoint ringkasan analitik teragregasi dari backend, bukan mengambil ribuan data pesanan mentah lalu menghitung totalnya di sisi klien.

---

# 11. Penanganan Status Antarmuka (State Management & Feedback)

Antarmuka harus selalu memiliki kejelasan kondisi bagi pengguna:

```text
[Idle State]
     │
     ├── Inisiasi Pengambilan Data ───> [Skeleton Loading State]
     │                                           │
     ├── Data Berhasil Diterima                  ├── Request Gagal
     │                                           │
     ↓                                           ↓
[Success Render State]                    [Error State dengan Aksi Retry]
     │
     ├── Data Kosong Karena Belum Ada Data ───> [Truly Empty State]
     └── Data Kosong Karena Filter Tidak Cocok > [Filtered Empty State]
```

### 11.1 Skeleton Loading State (Zero Layout Shift)
- Saat data sedang diambil, komponen merender siluet kerangka (*skeleton shimmer*) dengan dimensi tinggi dan lebar yang persis sama dengan elemen asli.
- Mencegah fenomena *Cumulative Layout Shift (CLS)* yang membingungkan mata pengguna.
- Digunakan pada: Baris tabel, kartu metrik KPI, detail pesanan, dan widget ringkasan.

### 11.2 Penanganan Empty State yang Terarah
Antarmuka membedakan dengan tegas 3 macam kondisi kosong:
1. **Truly Empty (Belum Ada Data Sama Sekali):**
   - Ikon ramah + Judul + Pesan edukatif + Tombol aksi pembuka.
   - Contoh: *"Belum ada produk terdaftar di katalog. Klik 'Tambah Produk Baru' gasan memulai."*
2. **Filtered Empty (Data Ada, Namun Filter Terlalu Ketat):**
   - Ikon filter + Keterangan + Tombol *"Reset Semua Filter"*.
   - Contoh: *"Kada ditemukan pesanan nang cocok lawan filter status 'Dibatalkan'. Coba reset filter Pian."*
3. **Error Empty (Gagal Mengambil Data):**
   - Ikon peringatan + Keterangan kendala jaringan/server + Tombol *"Coba Lagi (Retry)"*.

### 11.3 Dialog Konfirmasi Aksi Destruktif & Soft-Delete
Sesuai PRD Bagian 30, 34, dan 35:
- Setiap tindakan destruktif (*Cancel Order, Return Refund, Soft-Delete, Penyesuaian Stok Negatif*) **WAJIB** menampilkan modal dialog konfirmasi dua-tahap.
- Dialog harus secara transparan menjelaskan implikasi bisnis:
  > *"Pemberitahuan: Data pengguna ini akan dinonaktifkan (soft delete) dan disembunyikan dari daftar aktif. Riwayat transaksi historis tetap tersimpan aman di database untuk keperluan audit."*
- Tombol konfirmasi menggunakan varian *Destructive* berwarna merah teratai, dengan tombol *Batal* sebagai opsi default yang aman.

---

# 12. Aksesibilitas (WCAG 2.2 AA) & Responsivitas

### 12.1 Standar Aksesibilitas
1. **Rasio Kontras Warna:** Semua teks antarmuka terhadap latarnya memiliki rasio kontras minimal `4.5:1` untuk teks reguler dan `3:1` untuk teks besar/badge tebal.
2. **Navigasi Keyboard Penuh:** Seluruh elemen interaktif (tombol, link, tab, input form, dropdown) dapat dijelajahi dengan tombol `Tab`, `Shift+Tab`, `Enter`, dan `Space`.
3. **Fokus Visual Jelas (*Visible Focus Ring*):** Setiap elemen dalam kondisi fokus keyboard menampilkan cincin luar `2px solid var(--border-focus)` dengan offset `2px`.
4. **Semantik HTML & Pembaca Layar (Screen Reader):** Menggunakan elemen HTML5 semantik (`<nav>`, `<main>`, `<aside>`, `<header>`, `<table>`, `<button>`). Ikon murni dekoratif dilengkapi `aria-hidden="true"`, sedangkan ikon aksi interaktif memiliki `aria-label` deskriptif.

### 12.2 Perilaku Responsif Layar
Aplikasi ERP & Marketplace Operations utamanya diakses melalui Desktop/Laptop, namun tata letak dirancang adaptif:
- **Desktop Luas (≥1440px):** Tampilan optimal dengan sidebar permanen, tabel multi-kolom penuh, dan panel ringkasan berdampingan.
- **Laptop Standar (1024px – 1439px):** Sidebar dapat dikompres menjadi mode ikon kompak, spasi tabel menyesuaikan.
- **Tablet / Layar Sentuh (768px – 1023px):** Sidebar beralih menjadi panel geser (*slide-over sheet*), tabel lebar menggunakan horizontal scroll halus dengan kolom pertama (*No. Pesanan/SKU*) terkunci (*sticky column*).
- **Mobile (375px – 767px):** Fokus pada pemantauan cepat dan persetujuan mendesak; kartu metrik ditumpuk satu kolom secara vertikal.

---

# 13. Rekomendasi & Keputusan Lanjutan (Under Evaluation)

Sesuai instruksi batasan spesifikasi: Aspek yang tidak didefinisikan secara eksplisit di `PRD.md` atau `SCHEMA.md` **tidak dikarang sebagai requirement mutlak**, melainkan didokumentasikan di sini sebagai rekomendasi desain yang perlu dikonfirmasi saat implementasi frontend lanjutan:

1. **Rekomendasi Format Barcode / QR Code Scanner Gudang:**
   - *Status:* Rekomendasi Desain.
   - *Detail:* PRD menentukan alur Picking & Packing untuk memverifikasi SKU. Disarankan menambahkan dukungan input kamera/scanner USB keyboard-wedge pada input SKU di antarmuka gudang untuk mempercepat verifikasi fisik tanpa ketik manual.
2. **Rekomendasi Ekspor Laporan (Excel / PDF):**
   - *Status:* Rekomendasi Desain.
   - *Detail:* PRD Bagian 33 mendefinisikan kapabilitas pelaporan (*Reporting*). Disarankan menyediakan tombol ekspor data terfilter dalam format `.xlsx` dan `.csv` pada setiap tabel utama untuk kebutuhan audit internal finance dan manajemen.
3. **Rekomendasi Tema Gelap (*Dark Mode Support*):**
   - *Status:* Keputusan Lanjutan.
   - *Detail:* Token arsitektur Layer 1 & 2 telah mendukung pemetaan variabel CSS. Keputusan apakah staf gudang atau operasional membutuhkan mode gelap dapat diaktifkan melalui preferensi pengguna di rilis berikutnya.
4. **Rekomendasi Notifikasi Webhook Real-time (WebSocket / SSE):**
   - *Status:* Rekomendasi Arsitektur Frontend.
   - *Detail:* PRD Bagian 11 & 12 mendefinisikan notifikasi via email. Untuk pengalaman operasional dashboard yang lebih responsif di masa depan, disarankan evaluasi penggunaan Server-Sent Events (SSE) untuk menyalakan lonceng notifikasi di Top Bar saat ada pesanan baru masuk tanpa merefresh halaman.

---

# 14. Checklist Evaluasi Kualitas Desain (Design Review Checklist)

Sebelum sebuah rancangan antarmuka atau halaman dianggap memenuhi spesifikasi PasarPian, periksa seluruh butir berikut:

- [ ] **Identitas Orisinal Banua:** Apakah visual terasa modern dan bernuansa lokal Banua tanpa meniru marketplace lain?
- [ ] **Tone of Voice:** Apakah microcopy santun, ramah, dan penggunaan dialek Banjar terukur tanpa mengorbankan pemahaman teknis?
- [ ] **Kesesuaian Peran:** Apakah halaman menampilkan informasi yang relevan dengan tanggung jawab peran pengguna saat ini?
- [ ] **Prioritas Pengecualian (*Exception-First*):** Apakah kendala operasional (stok kritis, pesanan terlambat, outstanding) langsung terlihat sebelum data reguler?
- [ ] **Akurasi Status Bisnis:** Apakah opsi aksi tombol sesuai dengan diagram transisi status yang valid di PRD?
- [ ] **Loading & Skeleton:** Apakah antarmuka menggunakan skeleton loader saat data dimuat untuk mencegah layout shift?
- [ ] **Perlindungan Database:** Apakah pencarian menggunakan debounce dan tabel besar menggunakan pagination sisi server?
- [ ] **Kejelasan Empty State:** Apakah kondisi kosong dibedakan dengan jelas antara *Truly Empty*, *Filtered Empty*, dan *Error*?
- [ ] **Aksesibilitas Status:** Apakah badge status memuat kombinasi teks, warna kontras, dan ikon visual penanda?
- [ ] **Aman & Akuntabel:** Apakah aksi destruktif menyertakan konfirmasi dua tahap dan penjelasan efek soft-delete?
- [ ] **Konsistensi Tema:** Apakah permukaan memakai Glassmorphism (kaca) atau Neumorphism (lembut) sesuai fungsinya, tanpa mencampur kedua gaya pada elemen yang sama?
- [ ] **Konsistensi Tipografi:** Apakah seluruh teks antarmuka memakai **Poppins** dengan bobot 400/500/600/700, dan tidak ada keluarga font lain yang bocor ke UI?

---

# 15. Bintang Penuntun Desain (Design North Star)

> *"Setiap komponen, warna, kata, dan alur interaksi dalam antarmuka PasarPian harus membantu urang Banua—baik pembeli, penjual, maupun tim operasional—menyelesaikan pekerjaannya dengan lebih mudah, lebih cepat, dan dengan rasa saling percaya yang mendalam."*
