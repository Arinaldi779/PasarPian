import type { Campaign } from '../types';

/**
 * Util tampilan modul Pemasaran & Kampanye.
 *
 * Apa ini? Label status, opsi filter, dan penghitung progres periode kampanye.
 * Untuk apa? Dipakai MarketingPage (dan label statusnya dipakai dashboard
 * Fokus MARKETING bila dibutuhkan) dari satu sumber.
 * Kenapa ada? Label saluran versi halaman ini pernah beda istilah dengan halaman
 * lain ("Institusi / B2B" vs "Institusi & Dinas") — label saluran kini memakai
 * channelMeta bersama, dan file ini hanya menyimpan yang memang khas pemasaran.
 */

/** Filter status tab — seluruh status lifecycle kampanye. */
export type CampaignFilter = 'ALL' | Campaign['status'];

/** Opsi tab filter kampanye — urutan: semua, tayang, disiapkan, dijeda, selesai. */
export const CAMPAIGN_FILTER_OPTIONS: { id: CampaignFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua kampanye' },
  { id: 'ACTIVE', label: 'Aktif' },
  { id: 'DRAFT', label: 'Draf' },
  { id: 'PAUSED', label: 'Dijeda' },
  { id: 'COMPLETED', label: 'Selesai' },
];

/** Label Indonesia untuk status kampanye (daftar status sesuai SCHEMA campaigns). */
export const campaignStatusLabels: Record<Campaign['status'], string> = {
  ACTIVE: 'Aktif',
  DRAFT: 'Draf',
  PAUSED: 'Dijeda',
  COMPLETED: 'Selesai',
};

/** Hasil penghitungan progres periode: persen jalan + catatan sisa hari. */
export interface CampaignPeriodProgress {
  /** 0–100, dibatasi agar tidak minus/melebihi skala. */
  percent: number;
  /** "Sisa N hari" atau "Periode sudah berakhir". */
  note: string;
}

/**
 * Menghitung progres periode kampanye dari tanggal mulai–selesai "YYYY-MM-DD".
 * Apa ini? Penghitung persen + sisa hari. Untuk apa? Bilah progres kartu dan panel.
 * Kenapa ada? Tanggal disimpan tanpa jam, jadi dipasang tengah malam lokal
 * ("T00:00:00") — tanpa itu, browser menafsir UTC dan tanggal bisa geser sehari.
 * Mengembalikan null bila rentang tidak valid supaya pemanggil menampilkan
 * empty state, bukan angka ngawur.
 */
export const campaignPeriodProgress = (
  startDate: string,
  endDate: string,
  nowMs: number = Date.now(),
): CampaignPeriodProgress | null => {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (!start || !end || end <= start) return null;
  const percent = Math.min(100, Math.max(0, Math.round(((nowMs - start) / (end - start)) * 100)));
  const daysLeft = Math.ceil((end - nowMs) / 86_400_000);
  return { percent, note: daysLeft > 0 ? `Sisa ${daysLeft} hari` : 'Periode sudah berakhir' };
};
