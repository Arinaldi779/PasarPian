import type { Shipment } from '../types';

/**
 * Util tampilan modul Pengiriman & Ekspedisi.
 *
 * Apa ini? Label status, aturan "terlambat", dan opsi filter kiriman.
 * Untuk apa? Dipakai ShippingPage dan dashboardInsights.buildExceptionItems supaya
 * definisi terlambat sama di semua halaman.
 * Kenapa ada? Dua halaman memakai dua aturan berbeda adalah bug konsistensi:
 * paket yang sama tidak boleh "aman" di satu halaman tapi "terlambat" di halaman lain.
 */

/**
 * Filter status pada daftar kiriman: semua status pengiriman plus 'ALL'.
 * Apa ini? Tipe nilai filter. Untuk apa? Tab FilterTabs halaman Pengiriman.
 */
export type ShipmentFilter = 'ALL' | Shipment['status'];

/** Opsi tab filter kiriman — urutan mengikuti alur: jalan → tiba → bermasalah. */
export const SHIPMENT_FILTER_OPTIONS: { id: ShipmentFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua pengiriman' },
  { id: 'IN_TRANSIT', label: 'Dalam perjalanan' },
  { id: 'DELIVERED', label: 'Terkirim' },
  { id: 'DELAYED', label: 'Terlambat' },
  { id: 'RETURNED_TO_SENDER', label: 'Kembali ke pengirim' },
];

/** Label Indonesia untuk status kiriman (daftar status sesuai SCHEMA shipments). */
export const shipmentStatusLabels: Record<Shipment['status'], string> = {
  IN_TRANSIT: 'Dalam perjalanan',
  DELIVERED: 'Terkirim',
  DELAYED: 'Terlambat',
  RETURNED_TO_SENDER: 'Kembali ke pengirim',
};

/**
 * Tanggal hari ini "YYYY-MM-DD" dari jam lokal komputer.
 * Apa ini? Acuan harian perbandingan estimasi tiba.
 * Untuk apa? Menentukan kiriman yang melewati estimasi.
 * Kenapa ada? Estimasi tiba disimpan sebagai tanggal saja, jadi dibandingkan
 * sebagai teks (format YYYY-MM-DD urut kronologis) — aman dari beda zona waktu.
 * Disusun dari waktu lokal, bukan toISOString(), agar mengikuti hari pengguna.
 */
export const localTodayLabel = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * Status efektif satu kiriman: IN_TRANSIT yang melewati estimasi tiba
 * dianggap DELAYED meskipun kurir belum memperbarui statusnya.
 * Apa ini? Satu-satunya definisi "terlambat" di aplikasi.
 * Untuk apa? Badge halaman Pengiriman dan kartu Exception Bar dashboard.
 * Kenapa ada? Status kurir sering basi; pengguna perlu tahu paketnya telat
 * dari faktanya (lewat estimasi), bukan menunggu kabar kurir (PRD #26:
 * "apa yang terlambat?").
 */
export const effectiveShipmentStatus = (
  shipment: Pick<Shipment, 'status' | 'estimatedDelivery'>,
  todayLabel: string = localTodayLabel(),
): Shipment['status'] => {
  if (shipment.status === 'DELAYED') return 'DELAYED';
  if (shipment.status === 'IN_TRANSIT' && shipment.estimatedDelivery < todayLabel) return 'DELAYED';
  return shipment.status;
};
