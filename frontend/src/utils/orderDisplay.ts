import type { OrderStatus, PaymentStatus, SalesChannel } from '../types';

/**
 * Util tampilan modul Penjualan & Pesanan.
 *
 * Apa ini? Kumpulan tipe filter, label ramah, dan warna saluran yang dipakai
 * OrdersPage dan OrderDetailModal (dan DashboardPage untuk label saluran).
 * Untuk apa? Satu sumber kebenaran label/warna supaya tidak ada duplikasi
 * antar halaman (AGENTS #11) dan pengguna selalu melihat istilah yang sama.
 * Kenapa ada? Kode mentah seperti `WEBSITE` atau `TRANSFER_BANK` tidak boleh
 * tampil apa adanya ke pengguna non-teknis (AGENTS #20, #31).
 */

/**
 * Filter status pada daftar pesanan: semua status lifecycle plus 'ALL'.
 * Apa ini? Tipe nilai filter. Untuk apa? Dipakai App (state terangkat) dan
 * OrdersPage (tab terkontrol) supaya drill-down dari dashboard bisa membuka
 * daftar yang sudah terfilter (DESIGN §5.3-D.5).
 */
export type OrderFilter = 'ALL' | OrderStatus;

/**
 * Tab status utama pada daftar pesanan — sesuai urutan lifecycle PRD #16
 * (Pending → Confirmed → Processing → Shipped → Delivered) ditambah Semua
 * dan Dibatalkan. Status gudang menengah (PICKED/PACKED/RETURNED) tidak dibuatkan
 * tab karena jarang dipakai; bila aktif lewat drill-down, tampil sebagai chip
 * yang bisa dihapus.
 */
export const ORDER_STATUS_TABS: { id: OrderFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'PENDING', label: 'Perlu konfirmasi' },
  { id: 'CONFIRMED', label: 'Terkonfirmasi' },
  { id: 'PROCESSING', label: 'Diproses gudang' },
  { id: 'SHIPPED', label: 'Dikirim' },
  { id: 'DELIVERED', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
];

/**
 * Label Indonesia + warna batang untuk tiap saluran penjualan
 * (daftar saluran sesuai SCHEMA #11 sales_channels).
 * Apa ini? Metadata tampilan saluran. Untuk apa? Filter saluran, kolom tabel,
 * panel grafik dashboard, dan Blok Identitas detail pesanan.
 */
export const channelMeta: Record<SalesChannel, { label: string; color: string }> = {
  WEBSITE: { label: 'Website PasarPian', color: 'bg-[#0D7A70]' },
  MARKETPLACE: { label: 'Marketplace eksternal', color: 'bg-sky-500' },
  TIKTOK_SHOP: { label: 'TikTok Shop Banua', color: 'bg-rose-500' },
  SOCIAL_COMMERCE: { label: 'Sosial media (WA/IG)', color: 'bg-fuchsia-500' },
  DIRECT: { label: 'Penjualan langsung', color: 'bg-emerald-500' },
  INSTITUTIONAL: { label: 'Institusi & Dinas', color: 'bg-violet-500' },
};

/**
 * Label Indonesia untuk status pembayaran (tipe PaymentStatus dari SCHEMA).
 * Dipakai opsi filter dan teks bantu; badge-nya sendiri dirender StatusBadge.
 */
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: 'Belum dibayar',
  PARTIAL: 'Dibayar sebagian',
  PAID: 'Lunas',
  REFUNDED: 'Dana dikembalikan',
};

/**
 * Label Indonesia untuk metode pembayaran (dipakai riwayat pembayaran Blok 5).
 * CREDIT_TERMS berarti "tempo/kredit": barang boleh jalan dulu, bayar kemudian.
 */
export const paymentMethodLabels: Record<string, string> = {
  TRANSFER_BANK: 'Transfer bank',
  QRIS: 'QRIS',
  VIRTUAL_ACCOUNT: 'Virtual account',
  COD: 'Bayar di tempat (COD)',
  CREDIT_TERMS: 'Tempo / kredit',
};

/**
 * Label Indonesia untuk status satu catatan pembayaran (dipakai riwayat Blok 5).
 * PENDING_VERIFICATION berarti uang sudah masuk tapi belum dicek Finance,
 * sehingga belum boleh dihitung sebagai pelunasan final (ARCHITECTURE §payment).
 */
export const paymentRecordStatusLabels: Record<string, string> = {
  COMPLETED: 'Berhasil',
  PENDING_VERIFICATION: 'Menunggu verifikasi',
  FAILED: 'Gagal',
  REFUNDED: 'Dikembalikan',
};

/**
 * Label Indonesia untuk status antrean gudang (dipakai Blok 6 Pemenuhan).
 * READY_TO_SHIP berarti barang sudah dikemas dan menunggu diserahkan ke kurir.
 */
export const fulfillmentStatusLabels: Record<string, string> = {
  READY_TO_PICK: 'Siap diambil',
  PICKING: 'Sedang diambil',
  PACKING: 'Sedang dikemas',
  READY_TO_SHIP: 'Siap dikirim',
};
