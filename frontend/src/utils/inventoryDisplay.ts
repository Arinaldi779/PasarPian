import type { InventoryItem, MovementType } from '../types';

/**
 * Util tampilan modul Inventaris & Gudang.
 *
 * Apa ini? Label tipe mutasi, penentu status stok, pembangun opsi gudang, dan
 * penanda waktu lokal untuk entri baru.
 * Untuk apa? Dipakai InventoryPage, StockAdjustmentModal, App (pencatatan
 * penyesuaian), dan DashboardPage (label aktivitas) dari satu sumber yang sama.
 * Kenapa ada? Kode tipe seperti `RECEIVE` tidak boleh tampil mentah ke pengguna
 * (AGENTS #20, #31), dan status stok harus konsisten di semua halaman (AGENTS #11).
 */

/**
 * Label Indonesia untuk 11 tipe mutasi stok (tipe MovementType dari SCHEMA,
 * daftar sesuai DESIGN §7.4). Dipakai tabel mutasi Inventaris dan tabel
 * aktivitas dashboard — satu map supaya istilahnya tidak beda-beda.
 */
export const movementLabels: Record<MovementType, string> = {
  RECEIVE: 'Penerimaan stok',
  RESERVE: 'Reservasi stok',
  RELEASE: 'Pelepasan reservasi',
  PICK: 'Pengambilan barang',
  SHIP: 'Barang dikirim',
  RETURN: 'Retur masuk',
  ADJUSTMENT: 'Penyesuaian stok',
  TRANSFER_IN: 'Transfer masuk',
  TRANSFER_OUT: 'Transfer keluar',
  DAMAGE: 'Barang rusak',
  DISPOSE: 'Pemusnahan stok',
};

/** Tiga kondisi stok sesuai DESIGN §8.3: Aman / Menipis / Habis. */
export type StockCondition = 'AMAN' | 'MENIPIS' | 'HABIS';

/**
 * Menentukan kondisi satu baris stok.
 * Apa ini? Aturan status stok terpusat. Untuk apa? Badge tabel inventaris,
 * tanda varian katalog, dan penghitung Exception Bar memakai aturan yang sama.
 * Kenapa ada? Ambang "menipis" milik tiap SKU (`minThreshold`), bukan angka
 * global — 6 unit bisa aman untuk satu barang tapi kritis untuk barang lain.
 */
export const stockConditionOf = (item: Pick<InventoryItem, 'availableStock' | 'minThreshold'>): StockCondition => {
  if (item.availableStock <= 0) return 'HABIS';
  if (item.availableStock <= item.minThreshold) return 'MENIPIS';
  return 'AMAN';
};

/**
 * Opsi filter gudang diturunkan dari data (bukan ditulis manual).
 * Apa ini? Daftar gudang unik + jumlah baris per gudang.
 * Untuk apa? Chip FilterTabs halaman Inventaris dan Pemenuhan.
 * Kenapa ada? Gudang baru otomatis muncul sebagai opsi; opsi hardcode akan
 * tertinggal dan melanggar anti-pola DESIGN §3 (data multi-gudang tanpa pemisah jelas).
 * Menerima irisan field gudang saja supaya bisa dipakai baris stok maupun antrean.
 */
export const warehouseOptionsOf = (
  rows: Pick<InventoryItem, 'warehouseId' | 'warehouseName'>[],
): { id: string; label: string; count: number }[] => {
  const byWarehouse = new Map<string, { name: string; count: number }>();
  rows.forEach((row) => {
    const entry = byWarehouse.get(row.warehouseId) ?? { name: row.warehouseName, count: 0 };
    entry.count += 1;
    byWarehouse.set(row.warehouseId, entry);
  });
  return Array.from(byWarehouse.entries())
    .map(([id, entry]) => ({ id, label: entry.name, count: entry.count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id'));
};

/**
 * Stempel waktu lokal "YYYY-MM-DD HH:mm" untuk entri mutasi/audit baru.
 * Apa ini? Formatter waktu konsisten dengan format timestamp data mock.
 * Untuk apa? Entri ADJUSTMENT dan audit yang dibuat dari aksi pengguna.
 * Kenapa ada? Disusun dari waktu lokal (bukan toISOString/UTC) supaya tanggal
 * yang tercatat = tanggal di komputer pengguna, sama seperti data lainnya.
 */
export const nowTimestamp = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
