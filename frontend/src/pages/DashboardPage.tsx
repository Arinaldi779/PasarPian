import React, { useState } from 'react';
import {
  ArrowDownRight,
  Calendar,
  CloudOff,
  CreditCard,
  Eye,
  Info,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ExceptionBar } from '../components/common/ExceptionBar';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import {
  ROLE_FOCUS_HINTS,
  ROLE_LABELS,
  buildExceptionItems,
  buildRoleFocus,
  formatRupiah,
  formatShortRupiah,
} from '../utils/dashboardInsights';
import { movementLabels } from '../utils/inventoryDisplay';
import { channelMeta } from '../utils/orderDisplay';
import type { OrderFilter } from '../utils/orderDisplay';
import type {
  AuditLog,
  Campaign,
  Fulfillment,
  InventoryItem,
  Order,
  OrderStatus,
  ReturnRequest,
  SalesChannel,
  Shipment,
  StockMovement,
  UserAccount,
  UserRole,
} from '../types';

/**
 * Halaman Beranda / Dashboard — spesifikasi: Agents/DESIGN.md §8.1 & Arsitektur Informasi §4.
 *
 * Urutan konten: Greeting Bar → Exception Bar → Kartu KPI → Fokus Peran →
 * Distribusi Status Transaksi → Grafik Saluran → Aktivitas Terkini.
 *
 * Kepatuhan pada dokumen Agents:
 * - PRD #26: menjawab "apa yang terjadi / sedang berjalan / terlambat / bermasalah /
 *   membutuhkan tindakan" dan menampilkan informasi relevan per-peran (panel Fokus Peran).
 * - DESIGN IA §4: "Distribusi Status Transaksi & Saluran" (panel status + panel saluran).
 * - DESIGN §8.1: kelima komponen wajib ada, Exception Bar tetap prioritas teratas.
 * - AGENTS #6 & DESIGN §10.5: hari ini semua angka dihitung dari data lokal (belum ada API);
 *   saat backend siap, ganti blok perhitungan di bawah dengan satu endpoint agregasi
 *   ringkasan analitik — jangan mengambil seluruh tabel transaksi ke browser.
 * - Tema: Glassmorphism (panel) + Neumorphism (tombol), font Poppins (DESIGN §5.0 & §5.1-B).
 */

/**
 * Label + makna tiap status pesanan untuk tooltip hover.
 * Apa ini? Teks penjelasan per kode status. Untuk apa? Kartu tooltip pada
 * batang distribusi dan tombol legenda — supaya pengguna paham arti tiap
 * status tanpa membuka dokumentasi. Kenapa ditulis di sini? Labelnya sama
 * dengan yang dirender StatusBadge; maknanya disalin dari tabel DESIGN §5.3-B.
 */
const orderStatusHints: Record<string, { label: string; meaning: string }> = {
  PENDING: { label: 'Menunggu Konfirmasi', meaning: 'Pesanan baru masuk, menunggu verifikasi.' },
  CONFIRMED: { label: 'Terkonfirmasi', meaning: 'Pesanan telah dikonfirmasi operasional.' },
  PROCESSING: { label: 'Diproses Gudang', meaning: 'Pesanan masuk antrean gudang untuk pemenuhan.' },
  PICKED: { label: 'Selesai Diambil', meaning: 'Barang telah selesai diambil dari rak gudang.' },
  PACKED: { label: 'Selesai Dikemas', meaning: 'Barang terbungkus rapi dan berlabel resi.' },
  SHIPPED: { label: 'Dalam Pengiriman', meaning: 'Paket telah diserahkan ke kurir ekspedisi.' },
  DELIVERED: { label: 'Tiba di Tujuan', meaning: 'Paket telah berhasil diterima pelanggan.' },
  CANCELLED: { label: 'Dibatalkan', meaning: 'Pesanan dibatalkan sesuai aturan bisnis.' },
  RETURNED: { label: 'Retur Diajukan', meaning: 'Barang diajukan retur untuk inspeksi.' },
};

/** Ambil label + makna status; kode asing ditampilkan apa adanya dengan makna generik. */
const statusHint = (status: string) => orderStatusHints[status] ?? { label: status, meaning: 'Status pesanan.' };

/**
 * Isi kartu tooltip hover dasbor: posisi + judul + baris penjelasan.
 * Apa ini? State lokal satu-satunya untuk semua tooltip grafik. Untuk apa?
 * Menjelaskan angka di balik batang status, titik tren, dan bar saluran saat
 * kursor hover / elemen difokuskan keyboard. Kenapa satu state? Supaya hanya
 * satu kartu yang tampil dalam satu waktu dan logika posisinya terpusat.
 */
interface HoverTip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}
interface DashboardPageProps {
  /** Daftar pesanan dari App — sumber tunggal KPI penjualan, piutang, distribusi status, dan tabel aktivitas. */
  orders: Order[];
  /** Antrean gudang — dipakai menghitung Persentase Pemenuhan Selesai (dipacked ÷ total barang). */
  fulfillments: Fulfillment[];
  /** Riwayat mutasi stok — digabung dengan pesanan untuk 5 baris "Aktivitas terkini" + fokus peran Gudang. */
  movements: StockMovement[];
  /** Stok gudang — mendeteksi SKU di bawah minimum untuk Exception Bar & fokus peran Gudang. */
  inventory: InventoryItem[];
  /** Data kiriman — mendeteksi pengiriman yang melewati estimasi tiba (DESIGN §8.1 butir 2). */
  shipments: Shipment[];
  /** Pengajuan retur — mendeteksi retur yang menunggu inspeksi dan fokus peran Keuangan. */
  returns: ReturnRequest[];
  /** Kampanye pemasaran — bahan kartu fokus peran MARKETING. */
  campaigns: Campaign[];
  /** Akun pengguna internal — bahan kartu fokus peran ADMIN. */
  users: UserAccount[];
  /** Jejak audit sistem — bahan kartu fokus peran ADMIN. */
  auditLogs: AuditLog[];
  /** Peran yang sedang aktif (dipilih di sidebar) — menentukan sapaan dan isi panel Fokus Peran. */
  activeRole: UserRole;
  /** Callback pindah tab navigasi sidebar, dipakai semua tombol drill-down (ExceptionBar, KPI, aksi tabel). */
  onNavigateTab: (tab: string) => void;
  /**
   * Drill-down ke daftar pesanan yang langsung terfilter status (DESIGN §5.3-D.5).
   * Dipakai legenda Distribusi Status dan KPI Total Pesanan; opsional supaya
   * halaman tetap bisa dipakai tanpa App (fallback ke onNavigateTab biasa).
   */
  onNavigateOrdersWithStatus?: (status: OrderFilter) => void;
  /** Callback membuka panel detail pesanan 360°, dipanggil saat baris pesanan diklik. */
  onSelectOrder: (order: Order) => void;
}

/**
 * Singkatan bulan (Jan–Des) untuk label tanggal.

/**
 * Singkatan bulan (Jan–Des) untuk label tanggal.
 * Apa ini? Tabel bulan lokal. Untuk apa? Caption periode dan sumbu-X grafik tren.
 * Kenapa ada? Tanggal data berformat ISO ("2026-10-06"), jadi perlu diterjemahkan
 * ke format pendek yang mudah dibaca pengguna.
 */
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Urutan status pesanan mengikuti lifecycle (PENDING → … → DELIVERED) dan ditutup
 * status bermasalah (RETURNED, CANCELLED). Apa ini? Pemeta urutan panel Distribusi
 * Status. Untuk apa? Agar sebaran terbaca sebagai alur kerja, bukan daftar acak.
 */
const ORDER_STATUS_FLOW: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PICKED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
];

/**
 * Warna segmen batang Distribusi Status. Warna sengaja disamakan dengan warna latar
 * badge pada StatusBadge.tsx supaya legend dan batang konsisten; label statusnya sendiri
 * tetap dirender lewat StatusBadge sehingga status tidak dibedakan oleh warna saja (AGENTS #19).
 */
const statusSegmentColors: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-400',
  CONFIRMED: 'bg-teal-500',
  PROCESSING: 'bg-sky-500',
  PICKED: 'bg-cyan-500',
  PACKED: 'bg-indigo-500',
  SHIPPED: 'bg-blue-500',
  DELIVERED: 'bg-emerald-500',
  RETURNED: 'bg-amber-600',
  CANCELLED: 'bg-rose-500',
};

/** Satu baris = satu kegiatan terbaru, bisa berasal dari pesanan ATAU mutasi stok. */
interface ActivityItem {
  id: string;
  timestamp: string;
  kind: 'order' | 'movement';
  order?: Order;
  movement?: StockMovement;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  orders,
  fulfillments,
  movements,
  inventory,
  shipments,
  returns,
  campaigns,
  users,
  auditLogs,
  activeRole,
  onNavigateTab,
  onNavigateOrdersWithStatus,
  onSelectOrder,
}) => {
  // --- Ringkasan angka (diolah dari data, bukan diketik manual) ---
  const activeOrders = orders.filter((order) => order.status !== 'CANCELLED');
  const cancelledCount = orders.length - activeOrders.length;
  const salesTotal = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const outstandingOrders = activeOrders.filter((order) => order.outstanding > 0);
  const outstandingTotal = outstandingOrders.reduce((sum, order) => sum + order.outstanding, 0);
  const partialCount = activeOrders.filter((order) => order.paymentStatus === 'PARTIAL').length;

  // Pemenuhan selesai = barang yang sudah SELESAI DIKEMAS ÷ total barang dalam antrean gudang.
  // Dipakai supaya pengguna non-teknis paham: angka ini soal kerja gudang, bukan soal uang.
  const totalFulfilQty = fulfillments.reduce(
    (sum, item) => sum + item.items.reduce((inner, line) => inner + line.quantity, 0),
    0,
  );
  const packedFulfilQty = fulfillments.reduce(
    (sum, item) => sum + item.items.reduce((inner, line) => inner + line.packedQuantity, 0),
    0,
  );
  const fulfillmentPercent = totalFulfilQty > 0 ? Math.round((packedFulfilQty / totalFulfilQty) * 100) : 0;

  // --- Periode data + penjualan per hari (tanggal diambil dari data, bukan hardcode) ---
  const orderDates = Array.from(new Set(orders.map((order) => order.orderDate.slice(0, 10)))).sort();
  const firstDate = orderDates[0];
  const lastDate = orderDates[orderDates.length - 1];
  const periodLabel = firstDate && lastDate
    ? `${Number(firstDate.slice(8))}–${Number(lastDate.slice(8))} ${MONTH_SHORT[Number(firstDate.slice(5, 7)) - 1]} ${firstDate.slice(0, 4)}`
    : 'Belum ada data periode';

  const dailySales = orderDates.map((date) => {
    const value = activeOrders
      .filter((order) => order.orderDate.startsWith(date))
      .reduce((sum, order) => sum + order.total, 0);
    return {
      label: `${Number(date.slice(8))} ${MONTH_SHORT[Number(date.slice(5, 7)) - 1]}`,
      valueInThousands: Math.round(value / 1000),
    };
  });

  // Skala sumbu-Y dibulatkan ke atas supaya garis tidak pernah menyentuh tepi panel.
  const maxDaily = dailySales.reduce((max, day) => Math.max(max, day.valueInThousands), 0);
  const chartMax = Math.max(Math.ceil(maxDaily / 200) * 200, 200);
  const chartWidth = 640;
  const chartHeight = 220;
  const chartPoints = dailySales.map((day, index) => ({
    ...day,
    x: dailySales.length > 1 ? (index / (dailySales.length - 1)) * chartWidth : chartWidth / 2,
    y: chartHeight - (day.valueInThousands / chartMax) * chartHeight,
  }));
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const tickValues = [0, chartMax * 0.25, chartMax * 0.5, chartMax * 0.75, chartMax];
  const averageDaily = dailySales.length > 0 ? salesTotal / dailySales.length : 0;
  const peakDay = dailySales.reduce<{ label: string; valueInThousands: number } | null>(
    (best, day) => (best === null || day.valueInThousands > best.valueInThousands ? day : best),
    null,
  );

  // --- Distribusi omzet per saluran (DESIGN §8.1 butir 4) ---
  const channelBreakdown = (Object.keys(channelMeta) as SalesChannel[])
    .map((channel) => ({
      channel,
      value: activeOrders
        .filter((order) => order.salesChannel === channel)
        .reduce((sum, order) => sum + order.total, 0),
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((entry) => ({
      ...entry,
      label: channelMeta[entry.channel].label,
      color: channelMeta[entry.channel].color,
      percent: salesTotal > 0 ? Math.round((entry.value / salesTotal) * 100) : 0,
    }));

  // --- Drill-down terfilter: buka daftar pesanan dengan status tertentu bila
  // App menyediakan callback-nya; kalau tidak, fallback ke tab pesanan biasa.
  const openOrdersWithStatus = (status: OrderFilter) => {
    if (onNavigateOrdersWithStatus) onNavigateOrdersWithStatus(status);
    else onNavigateTab('orders');
  };

  // --- Exception Bar: dihitung sekali, dipakai kartu dan badge jumlah (DESIGN §8.1 butir 2) ---
  const exceptionItems = buildExceptionItems({ orders, inventory, shipments, returns });
  const actionExceptionCount = exceptionItems.filter((item) => item.needsAction).length;

  // --- Fokus Peran: 3 ringkasan yang dipilih sesuai peran aktif (PRD #26) ---
  // Label saluran & hari puncak dilewatkan dari panel di atas supaya tidak dihitung dua kali.
  const focusItems = buildRoleFocus({
    role: activeRole,
    orders,
    fulfillments,
    inventory,
    movements,
    returns,
    campaigns,
    users,
    auditLogs,
    topChannelLabel: channelBreakdown[0]?.label,
    peakDayLabel: peakDay ? `${peakDay.label} · ${formatShortRupiah(peakDay.valueInThousands * 1000)}` : undefined,
  });

  // --- Distribusi Status Transaksi (DESIGN IA §4, PRD #27 "order status distribution") ---
  // Hanya status yang benar-benar ada isinya yang dirender, supaya legenda tidak penuh baris 0.
  const statusBreakdown = ORDER_STATUS_FLOW.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }))
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      ...entry,
      percent: orders.length > 0 ? (entry.count / orders.length) * 100 : 0,
    }));

  // --- Aktivitas terkini: 5 baris terakhir dari pesanan + mutasi stok (DESIGN §8.1 butir 5) ---
  const activityItems: ActivityItem[] = [
    ...orders.map((order) => ({
      id: `ord-${order.id}`,
      timestamp: order.orderDate,
      kind: 'order' as const,
      order,
    })),
    ...movements.map((movement) => ({
      id: `mov-${movement.id}`,
      timestamp: movement.timestamp,
      kind: 'movement' as const,
      movement,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // --- Tooltip hover kustom: satu state untuk seluruh panel dasbor ---
  // Native `title` tidak dipakai di area grafik karena tampilannya polos dan
  // tidak mengikuti kursor; kartu kaca kecil ini selalu muncul di dekat penunjuk.
  const [hoverTip, setHoverTip] = useState<HoverTip | null>(null);

  /** Menempatkan kartu di dekat kursor; digeser bila mepet tepi layar. */
  const placeTip = (clientX: number, clientY: number) => ({
    x: clientX > window.innerWidth - 264 ? clientX - 258 : clientX + 14,
    y: clientY > window.innerHeight - 170 ? clientY - 140 : clientY + 16,
  });

  /** Tampilkan tooltip dari posisi kursor (dipakai onMouseEnter). */
  const showTipAt = (clientX: number, clientY: number, title: string, lines: string[]) => {
    setHoverTip({ ...placeTip(clientX, clientY), title, lines });
  };

  /** Tampilkan tooltip dari elemen yang difokuskan keyboard (tanpa mouse). */
  const showTipForElement = (element: Element, title: string, lines: string[]) => {
    const rect = element.getBoundingClientRect();
    showTipAt(rect.left + rect.width / 2, rect.bottom, title, lines);
  };

  /** Geser tooltip mengikuti kursor tanpa mengubah isinya. */
  const moveTip = (event: React.MouseEvent) => {
    setHoverTip((current) => (current ? { ...current, ...placeTip(event.clientX, event.clientY) } : current));
  };

  const hideTip = () => setHoverTip(null);

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* 1. Greeting Bar (DESIGN §8.1 butir 1): sapaan + waktu + status sinkronisasi */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D7A70] text-white shadow-xs sm:flex">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">Ringkasan operasional</p>
            <h1 className="mt-1 text-[26px] font-bold leading-8 tracking-tight text-slate-900 sm:text-[32px] sm:leading-10">
              Selamat datang, Pian Ahmad Gazali
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-500">
              Pian handak memantau apa hari ini? Lihat dulu bagian{' '}
              <strong className="font-semibold text-slate-700">Perlu perhatian</strong> — di situ tindakan yang paling
              mendesak.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {/* Peran aktif ditampilkan di sini supaya pengguna paham isi dashboard ini disusun untuk siapa (PRD #26). */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/90 px-3 py-2 text-xs font-semibold text-[#0D7A70]">
            <Users className="h-4 w-4" aria-hidden="true" />
            Peran aktif: {ROLE_LABELS[activeRole]}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {dateLabel} · {timeLabel}
          </div>
          {/* Status data: jujur bahwa ini masih data contoh lokal khusus sesi ini. */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-800">
            <CloudOff className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Mode contoh — perubahan hanya tersimpan di sesi ini
          </div>
        </div>
      </header>

      {/* 2. Exception Bar — FOKUS UTAMA halaman (DESIGN §8.1 butir 2); jumlahnya dihitung dari data */}
      <section aria-labelledby="attention-title">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 id="attention-title" className="text-2xl font-bold leading-8 tracking-tight text-slate-900">
            Perlu perhatian
          </h2>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              actionExceptionCount > 0
                ? 'border-amber-200 bg-amber-100 text-amber-800'
                : 'border-emerald-200 bg-emerald-100 text-emerald-800'
            }`}
          >
            {actionExceptionCount > 0 ? `${actionExceptionCount} butuh tindakan` : 'Semua aman'}
          </span>
          <span className="text-xs text-slate-500">Masalah yang paling dekat dengan pekerjaan hari ini</span>
        </div>
        <ExceptionBar items={exceptionItems} onNavigateTab={onNavigateTab} />
      </section>

      {/* 3. Kartu KPI utama (DESIGN §8.1 butir 3) — prioritas kedua setelah Perlu perhatian */}
      <section aria-labelledby="summary-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="summary-title" className="text-xl font-semibold leading-7 text-slate-900">
              Ringkasan angka utama
            </h2>
            <p className="text-xs text-slate-500">Klik kartu untuk membuka data yang membentuk angka tersebut.</p>
          </div>
          <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">
            <Info className="h-3.5 w-3.5" aria-hidden="true" /> Angka dihitung dari data pesanan & antrean gudang
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Penjualan"
            value={formatRupiah(salesTotal)}
            icon={<TrendingUp className="h-5 w-5" />}
            trendText={`Periode ${periodLabel}`}
            trendDirection="neutral"
            hint="Total nilai pesanan aktif pada periode ini (pesanan batal tidak dihitung). Klik untuk membuka daftar pesanan."
            onClick={() => onNavigateTab('orders')}
          />
          <StatCard
            title="Total Pesanan"
            value={`${activeOrders.length} pesanan`}
            icon={<ShoppingCart className="h-5 w-5" />}
            trendText={`${cancelledCount} dibatalkan dari ${orders.length} pesanan masuk`}
            trendDirection="neutral"
            hint="Jumlah pesanan aktif (di luar yang dibatalkan). Klik untuk membuka daftar pesanan."
            exceptionTag={pendingCount > 0 ? `${pendingCount} menunggu konfirmasi` : undefined}
            exceptionType="warning"
            onClick={() => openOrdersWithStatus('ALL')}
          />
          <StatCard
            title="Persentase Pemenuhan Selesai"
            value={totalFulfilQty > 0 ? `${fulfillmentPercent}%` : '–'}
            icon={<PackageCheck className="h-5 w-5" />}
            trendText={
              totalFulfilQty > 0
                ? `${packedFulfilQty} dari ${totalFulfilQty} barang sudah dikemas`
                : 'Belum ada antrean gudang'
            }
            trendDirection="neutral"
            hint="Porsi barang yang sudah selesai dikemas dari seluruh antrean gudang. Klik untuk membuka antrean pemenuhan."
            exceptionTag={
              totalFulfilQty > 0 && fulfillmentPercent < 100
                ? `${totalFulfilQty - packedFulfilQty} barang belum dikemas`
                : undefined
            }
            exceptionType="warning"
            onClick={() => onNavigateTab('fulfillment')}
          />
          <StatCard
            title="Total Piutang"
            value={formatRupiah(outstandingTotal)}
            icon={<CreditCard className="h-5 w-5" />}
            trendText={`${outstandingOrders.length} pesanan belum lunas`}
            trendDirection="neutral"
            hint="Sisa tagihan yang belum dibayar pelanggan. Klik untuk membuka halaman keuangan."
            exceptionTag={partialCount > 0 ? `${partialCount} pembayaran sebagian` : undefined}
            exceptionType="warning"
            onClick={() => onNavigateTab('finance')}
          />
        </div>

        {/* Helper text istilah (AGENTS #31): istilah asing tetap dijelaskan meski tampilannya sudah ramah. */}
        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
          <span>
            <strong className="font-semibold text-slate-700">Piutang (Outstanding)</strong>: tagihan yang belum
            dibayar pelanggan.
          </span>
          <span>
            <strong className="font-semibold text-slate-700">Pemenuhan</strong>: pekerjaan gudang memilih dan
            mengemas barang sebelum dikirim.
          </span>
        </p>
      </section>

      {/* 4. Fokus Peran (PRD #26): 3 ringkasan yang dipilih sesuai peran aktif, bukan angka yang sama untuk semua orang */}
      <section className="glass rounded-2xl p-5" aria-labelledby="role-focus-title">
        <div className="mb-4">
          <h2 id="role-focus-title" className="text-lg font-semibold leading-7 text-slate-900">
            Fokus {ROLE_LABELS[activeRole]} hari ini
          </h2>
          {/* Kalimat panduan menjelaskan kenapa isi panel ini berbeda tiap peran (AGENTS #31). */}
          <p className="mt-1 text-xs leading-5 text-slate-500">{ROLE_FOCUS_HINTS[activeRole]}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {focusItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.targetTab)}
              aria-label={`${item.label}: ${item.value}. Buka data terkait`}
              title={`${item.label}: ${item.value}. Klik untuk membuka data terkait`}
              className="neu-raised group flex flex-col items-start rounded-xl p-4 text-left transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0D7A70] focus:ring-offset-2"
            >
              <span className="font-mono-numbers text-2xl font-bold leading-7 tracking-tight text-slate-900">
                {item.value}
              </span>
              <span className="mt-1 text-xs leading-4 text-slate-500">{item.label}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D7A70]">
                Buka
                <ArrowDownRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Distribusi Status Transaksi (DESIGN IA §4 & PRD #27): menjawab "apa yang sedang berjalan?" */}
      <section className="glass rounded-2xl p-5" aria-labelledby="status-dist-title">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="status-dist-title" className="text-lg font-semibold leading-7 text-slate-900">
              Bagaimana status pesanan?
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Klik salah satu status untuk membuka daftar pesanan · {periodLabel}
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-[#0D7A70]">
            {orders.length} pesanan
          </span>
        </div>

        {statusBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Belum ada pesanan tercatat. Distribusi status akan muncul begitu pesanan masuk.
          </p>
        ) : (
          <>
            {/* Batang bertumpuk kini interaktif: tiap segmen adalah tombol drill-down
                yang sama dengan legenda di bawahnya, plus tooltip arti status.
                Lebar segmen = porsi nyata status tersebut dari seluruh pesanan. */}
            <div
              className="flex h-3 w-full overflow-hidden rounded-full border border-white/70 bg-white/60"
              role="group"
              aria-label="Porsi tiap status pesanan — klik segmen untuk membuka daftar terfilter"
            >
              {statusBreakdown.map((entry) => {
                const hint = statusHint(entry.status);
                const tipTitle = `${hint.label}: ${entry.count} pesanan (${Math.round(entry.percent)}%)`;
                const tipLines = [hint.meaning, 'Klik untuk membuka daftar pesanan terfilter.'];
                return (
                  <button
                    key={entry.status}
                    type="button"
                    onClick={() => openOrdersWithStatus(entry.status)}
                    aria-label={`${tipTitle}. ${hint.meaning}`}
                    onMouseEnter={(event) => showTipAt(event.clientX, event.clientY, tipTitle, tipLines)}
                    onMouseMove={moveTip}
                    onMouseLeave={hideTip}
                    onFocus={(event) => showTipForElement(event.currentTarget, tipTitle, tipLines)}
                    onBlur={hideTip}
                    style={{ width: `${entry.percent}%` }}
                    className={`h-full min-w-4 cursor-pointer transition hover:brightness-90 focus:outline-none ${statusSegmentColors[entry.status]}`}
                  />
                );
              })}
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {statusBreakdown.map((entry) => {
                const hint = statusHint(entry.status);
                const tipTitle = `${hint.label}: ${entry.count} pesanan (${Math.round(entry.percent)}%)`;
                const tipLines = [hint.meaning, 'Klik untuk membuka daftar pesanan terfilter.'];
                return (
                  <li key={entry.status}>
                    <button
                      type="button"
                      onClick={() => openOrdersWithStatus(entry.status)}
                      aria-label={`${tipTitle}. Buka daftar pesanan terfilter`}
                      onMouseEnter={(event) => showTipAt(event.clientX, event.clientY, tipTitle, tipLines)}
                      onMouseMove={moveTip}
                      onMouseLeave={hideTip}
                      onFocus={(event) => showTipForElement(event.currentTarget, tipTitle, tipLines)}
                      onBlur={hideTip}
                      className="flex w-full min-h-11 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-left transition-colors hover:border-teal-300 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
                    >
                      <StatusBadge status={entry.status} size="sm" />
                      <span className="shrink-0 text-xs text-slate-600">
                        <strong className="font-mono-numbers text-slate-900">{entry.count}</strong> pesanan ·{' '}
                        <span className="font-mono-numbers text-slate-500">{Math.round(entry.percent)}%</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 border-t border-white/70 pt-3 text-xs text-slate-500">
              Total {orders.length} pesanan tercatat · {statusBreakdown.length} status sedang dipakai.
            </p>
          </>
        )}
      </section>

      {/* 6. Grafik: tren harian + distribusi per saluran (DESIGN §8.1 butir 4) */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]" aria-label="Analisis penjualan">
        <div className="glass rounded-2xl p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold leading-6 text-slate-900">Tren penjualan harian</h2>
              <p className="mt-1 text-xs leading-4 text-slate-500">
                Satuan: ribuan rupiah · pesanan dibatalkan tidak dihitung · {periodLabel}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {periodLabel}
            </div>
          </div>

          {dailySales.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Belum ada pesanan pada periode ini. Tren penjualan akan muncul begitu ada pesanan masuk.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <svg
                  className="trend-chart min-w-[560px]"
                  viewBox={`-56 -12 ${chartWidth + 68} ${chartHeight + 54}`}
                  role="img"
                  aria-label={`Grafik garis penjualan harian dalam ribuan rupiah, dari ${dailySales[0].label} sampai ${dailySales[dailySales.length - 1].label}, nilai ${dailySales[0].valueInThousands} sampai ${maxDaily} ribu`}
                >
                  {tickValues.map((tick) => {
                    const y = chartHeight - (tick / chartMax) * chartHeight;
                    return (
                      <g key={tick}>
                        <line x1="0" x2={chartWidth} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="4 6" />
                        <text x="-10" y={y + 4} textAnchor="end" fontSize="10" fill="#64748B">
                          {tick}
                        </text>
                      </g>
                    );
                  })}
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="#0D7A70"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartPoints.map((point) => {
                    const tipTitle = point.label;
                    const tipLines = [
                      `Penjualan ${formatShortRupiah(point.valueInThousands * 1000)}`,
                      `Rata-rata periode ${formatShortRupiah(averageDaily)}`,
                    ];
                    return (
                      <g
                        key={point.label}
                        tabIndex={0}
                        role="img"
                        aria-label={`${tipTitle}: ${tipLines[0]}`}
                        onMouseEnter={(event) => showTipAt(event.clientX, event.clientY, tipTitle, tipLines)}
                        onMouseMove={moveTip}
                        onMouseLeave={hideTip}
                        onFocus={(event) => showTipForElement(event.currentTarget, tipTitle, tipLines)}
                        onBlur={hideTip}
                        className="outline-none"
                      >
                        {/* Area sentuh transparan agar hover/fokus mudah kena walau titiknya kecil. */}
                        <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
                        <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#0D7A70" strokeWidth="3" className="trend-point" />
                        <text x={point.x} y={chartHeight + 25} textAnchor="middle" fontSize="10" fill="#475569">
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/70 pt-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded bg-[#0D7A70]" aria-hidden="true" />
                  Penjualan harian · Rata-rata{' '}
                  <strong className="font-mono-numbers font-semibold text-slate-900">{formatShortRupiah(averageDaily)}</strong>
                </span>
                {peakDay && (
                  <span>
                    Hari tertinggi <strong className="font-mono-numbers font-semibold text-slate-900">{peakDay.label}</strong>{' '}
                    <span className="font-mono-numbers">
                      ({formatShortRupiah(peakDay.valueInThousands * 1000)})
                    </span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-5 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold leading-6 text-slate-900">Dari mana penjualan datang?</h2>
              <p className="mt-1 text-xs leading-4 text-slate-500">Kontribusi omzet tiap saluran · {periodLabel}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-[#0D7A70]">
              {channelBreakdown.length} saluran
            </span>
          </div>

          {channelBreakdown.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Belum ada penjualan aktif, sehingga belum ada saluran yang bisa ditampilkan.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {channelBreakdown.map((entry) => (
                  <div
                    key={entry.channel}
                    onMouseEnter={(event) =>
                      showTipAt(event.clientX, event.clientY, entry.label, [
                        `${formatRupiah(entry.value)} dari total ${formatShortRupiah(salesTotal)}`,
                        `${entry.percent}% dari total penjualan periode ini`,
                      ])
                    }
                    onMouseMove={moveTip}
                    onMouseLeave={hideTip}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-700">{entry.label}</span>
                      <span className="font-mono-numbers font-semibold text-slate-900">
                        {formatRupiah(entry.value)} <span className="font-sans text-slate-500">({entry.percent}%)</span>
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full border border-white/70 bg-white/60"
                      role="img"
                      aria-label={`${entry.label}: ${entry.percent} persen dari total penjualan`}
                    >
                      <div className={`h-full rounded-full ${entry.color}`} style={{ width: `${entry.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-white/70 pt-3 text-xs text-slate-500">
                Persentase dihitung dari total penjualan periode ini ({formatShortRupiah(salesTotal)}).
              </p>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="neu-raised mt-4 w-full"
            onClick={() => openOrdersWithStatus('ALL')}
          >
            Lihat rincian saluran <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* 7. Aktivitas terkini (DESIGN §8.1 butir 5): 5 transaksi/mutasi terakhir + link detail */}
      <section className="glass rounded-2xl p-5" aria-labelledby="recent-activity-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="recent-activity-title" className="text-lg font-semibold leading-7 text-slate-900">
              Aktivitas terkini
            </h2>
            <p className="text-xs text-slate-500">
              5 pesanan & mutasi stok terakhir — klik tombol aksi untuk membuka detailnya.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="neu-raised" onClick={() => openOrdersWithStatus('ALL')}>
            Buka semua pesanan
          </Button>
        </div>

        {activityItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Belum ada aktivitas. Pesanan atau mutasi stok terbaru akan muncul di sini.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Waktu</th>
                  <th className="px-3 py-3">Jenis</th>
                  <th className="px-3 py-3">Aktivitas</th>
                  <th className="px-3 py-3 text-right">Nilai</th>
                  <th className="px-3 py-3">Status / Rujukan</th>
                  <th className="px-3 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityItems.map((item) => {
                  const order = item.order;
                  const movement = item.movement;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => (order ? onSelectOrder(order) : onNavigateTab('inventory'))}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-3 py-3 font-mono-numbers text-slate-600">{item.timestamp}</td>
                      <td className="px-3 py-3">
                        {order ? (
                          <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                            Pesanan
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                            Mutasi stok
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {order ? (
                          <>
                            <div className="font-semibold text-slate-800">{order.orderNumber}</div>
                            <div className="text-[11px] text-slate-500">
                              {order.customerName} · {channelMeta[order.salesChannel]?.label ?? order.salesChannel}
                            </div>
                          </>
                        ) : movement ? (
                          <>
                            <div className="font-semibold text-slate-800">
                              {movementLabels[movement.type]} · {movement.productName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {movement.warehouseName} · {movement.actor}
                            </div>
                          </>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {order ? (
                          <span className="font-mono-numbers font-semibold text-slate-900">
                            {formatRupiah(order.total)}
                          </span>
                        ) : movement ? (
                          <span className="font-mono-numbers font-semibold text-slate-900">
                            {movement.quantity > 0 ? '+' : ''}
                            {movement.quantity} unit
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {order ? (
                          <StatusBadge status={order.status} size="sm" />
                        ) : movement ? (
                          <span className="font-mono-numbers text-slate-500">{movement.referenceNo}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          aria-label={order ? `Buka detail ${order.orderNumber}` : `Buka mutasi ${movement?.referenceNo ?? ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (order) onSelectOrder(order);
                            else onNavigateTab('inventory');
                          }}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 font-semibold text-[#0D7A70] hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {order ? 'Buka' : 'Buka stok'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 px-1 text-xs text-slate-500">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Mode contoh — data dan perubahan hanya tersimpan di sesi ini.
      </p>

      {/* Kartu tooltip hover: kaca pekat, non-interaktif, aria-hidden karena
          isinya duplikat dari aria-label/label yang sudah terbaca screen reader. */}
      {hoverTip && (
        <div
          aria-hidden="true"
          className="glass-strong pointer-events-none fixed z-50 w-60 rounded-xl p-3 shadow-lg"
          style={{ left: hoverTip.x, top: hoverTip.y }}
        >
          <p className="text-xs font-semibold text-slate-900">{hoverTip.title}</p>
          <ul className="mt-1 space-y-0.5">
            {hoverTip.lines.map((line) => (
              <li key={line} className="text-[11px] leading-4 text-slate-600">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
