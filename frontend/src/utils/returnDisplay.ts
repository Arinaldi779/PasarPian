import type { ReturnRequest } from '../types';

/**
 * Util tampilan modul Retur (dipakai halaman Keuangan tab Refund dan —
 * saat gilirannya — halaman Pengajuan Retur).
 *
 * Apa ini? Label Indonesia untuk status pengajuan retur.
 * Untuk apa? Badge/tab refund supaya satu istilah di semua halaman.
 * Kenapa ada? Halaman Keuangan dan Pengajuan Retur tadinya masing-masing punya
 * salinan label sendiri; salinan ganda akan berbeda ketika label berubah (AGENTS #11).
 */

/** Status pengajuan retur (tipe status dari SCHEMA returns). */
export type ReturnStatus = ReturnRequest['status'];

/** Label Indonesia untuk tiap status pengajuan retur. */
export const returnStatusLabels: Record<ReturnStatus, string> = {
  PENDING_INSPECTION: 'Menunggu inspeksi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  COMPLETED: 'Selesai',
};

/**
 * Label + penjelasan kondisi fisik barang retur (daftar Condition PRD #24).
 * Apa ini? Metadata tampilan kondisi. Untuk apa? Kartu kondisi di detail retur.
 */
export const returnConditionLabels: Record<string, { label: string; hint: string }> = {
  GOOD: { label: 'Kondisi baik', hint: 'Segel utuh, barang masih layak dijual kembali.' },
  DAMAGED: { label: 'Rusak', hint: 'Kemasan atau barang mengalami kerusakan fisik.' },
  DEFECTIVE: { label: 'Cacat', hint: 'Barang tidak berfungsi normal (cacat produksi).' },
  UNKNOWN: { label: 'Belum diperiksa', hint: 'Menunggu pemeriksaan fisik oleh staf gudang.' },
};

/**
 * Label + penjelasan aksi disposisi barang retur (daftar Action PRD #24,
 * makna tiap aksi sesuai DESIGN §7.5).
 * Apa ini? Metadata tampilan disposisi. Untuk apa? Kartu tindakan di detail retur.
 * Kenapa dipisah? Rencana tindakan (saat menunggu inspeksi) vs tindakan final
 * memakai teks yang sama — satu sumber mencegah beda istilah.
 */
export const returnActionLabels: Record<string, { label: string; hint: string }> = {
  RESTOCK: { label: 'Masuk stok lagi', hint: 'Barang dikembalikan ke stok tersedia gudang.' },
  REPAIR: { label: 'Masuk perbaikan', hint: 'Barang diprioritaskan untuk diperbaiki dulu.' },
  DISPOSE: { label: 'Dibuang', hint: 'Barang dikeluarkan dari inventaris dan tidak dijual.' },
  REPLACE: { label: 'Kirim pengganti', hint: 'Kirim unit baru ke pelanggan sebagai pengganti.' },
};
