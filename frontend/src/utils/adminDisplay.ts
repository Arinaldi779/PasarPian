import type { AuditLog, UserRole, UserStatus } from '../types';

/**
 * Util tampilan modul Administrasi & Audit.
 *
 * Apa ini? Label status akun, singkatan peran, dan label aksi audit.
 * Untuk apa? Dipakai AdminPage (dan label peran/statusnya dipakai dashboard
 * Fokus ADMIN lewat ROLE_LABELS yang sudah ada).
 * Kenapa ada? Halaman ini pernah menulis "Management" sementara dashboard
 * menulis "Manajemen" untuk peran yang sama — satu istilah, satu sumber (#31).
 */

/** Label Indonesia untuk status akun (ACTIVE/INACTIVE/SUSPENDED, DESIGN §7.1). */
export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Nonaktif',
  SUSPENDED: 'Ditangguhkan',
};

/**
 * Singkatan peran untuk kepala kolom matriks (ruang sempit, 7 kolom).
 * Label penuh tetap tersedia di ROLE_LABELS (dashboardInsights) untuk teks biasa.
 */
export const roleShortLabels: Record<UserRole, string> = {
  MANAGEMENT: 'Mgmt',
  OPERATIONS: 'Operasi',
  WAREHOUSE: 'Gudang',
  SALES: 'Penjualan',
  FINANCE: 'Keuangan',
  MARKETING: 'Pemasaran',
  ADMIN: 'Admin',
};

/** Label Indonesia untuk jenis aksi jejak audit (daftar action SCHEMA audit). */
export const auditActionLabels: Record<AuditLog['action'], string> = {
  CREATE: 'Dibuat',
  UPDATE: 'Diperbarui',
  DELETE: 'Dihapus',
  STATUS_CHANGE: 'Ubah status',
  PAYMENT: 'Pembayaran',
  ADJUSTMENT: 'Penyesuaian stok',
};

/**
 * Kode izin granular — disalin persis dari contoh SCHEMA #5 permissions.
 * Apa ini? Daftar kode, bukan aturan aktif. Untuk apa? Ditampilkan sebagai
 * dokumentasi hidup bahwa izin rinci ada di schema.
 * Kenapa ada? Pemetaan peran → izin N:N belum tersedia di data simulasi,
 * jadi halaman jujur menampilkan yang benar-benar dipakai: matriks menu sidebar.
 */
export const permissionCodes = [
  'order.read',
  'order.update',
  'inventory.read',
  'inventory.adjust',
  'payment.read',
  'payment.create',
  'fulfillment.update',
  'shipment.update',
  'report.read',
];

/**
 * Transisi sah status akun (aturan turunan PRD otorisasi akun).
 * Apa ini? Peta status → daftar status tujuan yang boleh.
 * Untuk apa? Guard di App DAN daftar tombol di halaman — satu sumber supaya
 * tombol yang dirender selalu tepat yang diizinkan guard (AGENTS #15).
 * Kenapa ada di util (bukan App)? Peta ini murni data tanpa state; App mengimpor
 * untuk guard, halaman mengimpor untuk tombol — tidak ada duplikasi.
 */
export const userStatusTransitions: Record<UserStatus, { next: UserStatus; label: string }[]> = {
  ACTIVE: [
    { next: 'SUSPENDED', label: 'Tangguhkan' },
    { next: 'INACTIVE', label: 'Nonaktifkan' },
  ],
  INACTIVE: [{ next: 'ACTIVE', label: 'Aktifkan' }],
  SUSPENDED: [{ next: 'ACTIVE', label: 'Aktifkan' }],
};
