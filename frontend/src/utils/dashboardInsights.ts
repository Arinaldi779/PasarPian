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
import { effectiveShipmentStatus, localTodayLabel } from './shipmentDisplay';

/**
 * Kumpulan perhitungan ringkas untuk halaman Beranda / Dashboard.
 *
 * Apa ini? Modul util murni (tanpa React) berisi logika agregasi dashboard:
 * format rupiah, daftar Exception Bar, dan kartu Fokus Peran.
 * Untuk apa? Dipanggil DashboardPage sebelum render, supaya komponen hanya
 * menampilkan angka, bukan menghitung sendiri (selesi layer Utils, AGENTS #4).
 * Kenapa ada? PRD #26 mewajibkan dashboard menjawab "apa yang terjadi / terlambat /
 * butuh tindakan" secara relevan-per-peran; logika dipisah dari komponen supaya
 * mudah ditinjau dan kelak diganti oleh endpoint agregasi backend
 * (AGENTS #6 & DESIGN §10.5 — dashboard dilarang memindai seluruh tabel transaksi
 * saat API sudah tersedia; hari ini semua data masih simulasi lokal).
 */

/** Format rupiah penuh: 1070000 → "Rp 1.070.000". Dipakai semua metrik uang di dashboard. */
export const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

/**
 * Format rupiah singkat untuk caption chart/legenda: 2264000 → "Rp 2.264.000" → "Rp 2,3 jt".
 * Apa ini? Pembungkas angka pendek. Untuk apa? Sumbu grafik, rata-rata harian, dan teks bantu.
 * Kenapa ada? Angka penuh terlalu panjang untuk caption sehingga panel mudah patah (DESIGN §31).
 */
export const formatShortRupiah = (value: number) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  return `Rp ${Math.round(value / 1000)} rb`;
};

/**
 * Ubah string waktu "2026-10-06 09:30" menjadi objek Date.
 * Apa ini? Parser tanggal data ERP. Untuk apa? Menghitung umur pesanan di Exception Bar.
 * Kenapa ada? Format data memakai spasi, sedangkan konstruksi Date paling konsisten dengan
 * pemisah "T"; spasi ditukar dulu supaya hasil identik di semua browser.
 */
const parseDateTime = (value: string) => new Date(value.includes('T') ? value : value.replace(' ', 'T'));

/**
 * Selisih milidetik → durasi yang mudah dibaca: 5 jam / 3 hari.
 * Apa ini? Penerjemah umur data. Untuk apa? Teks detail Exception Bar.
 * Kenapa ada? Angka jam mentah (mis. "73 jam") sulit dipahami pengguna non-teknis,
 * jadi di atas 48 jam dikonversi ke hari (AGENTS #31).
 */
const formatAge = (diffMs: number) => {
  const hours = Math.floor(diffMs / 3_600_000);
  return hours < 48 ? `${hours} jam` : `${Math.floor(hours / 24)} hari`;
};

/** Batas "pesanan tertahan" pada Exception Bar — DESIGN §8.1: pesanan yang belum terkirim >24 jam. */
const STALLED_LIMIT_MS = 24 * 3_600_000;

/**
 * Status pesanan yang masih berada di alur gudang (belum dikirim).
 * Apa ini? Daftar status yang dihitung sebagai "tertahan" bila umurnya lewat batas.
 * Kenapa ada? Pesanan SHIPPED/DELIVERED/CANCELLED sudah keluar dari kendali gudang,
 * jadi menghitungnya sebagai tertahan akan menyesatkan (AGENTS #15: status = state bisnis).
 */
const IN_WAREHOUSE_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PICKED', 'PACKED'];

/** Saluran yang termasuk "kanal digital" untuk fokus peran MARKETING (tipe SalesChannel dari SCHEMA). */
const DIGITAL_CHANNELS: SalesChannel[] = ['WEBSITE', 'MARKETPLACE', 'TIKTOK_SHOP', 'SOCIAL_COMMERCE'];

/** Kode kategori Exception Bar; sekaligus kunci pemilih ikon di ExceptionBar.tsx. */
export type ExceptionItemId =
  | 'stalledOrders'
  | 'lowStock'
  | 'delayedShipments'
  | 'unpaidBills'
  | 'pendingReturns';

/**
 * Satu kartu pada Exception Bar.
 * Apa ini? Struktur data kartu pengecualian. Untuk apa? Dirender ExceptionBar dan
 * dihitung jumlahnya oleh dashboard untuk badge "butuh tindakan".
 * Kenapa ada? Angka wajib berasal dari data, bukan ditulis di markup
 * (DESIGN §8.1 butir 2, AGENTS #31: status harus menjelaskan kondisi nyata).
 */
export interface ExceptionItem {
  /** Kategori exception — menentukan ikon dan tujuan drill-down. */
  id: ExceptionItemId;
  /** true bila kategori ini butuh tindakan; false bila kondisinya aman (tetap ditampilkan). */
  needsAction: boolean;
  /** Warna aksen kartu: danger = merah, warning = kuning, ok = hijau (AGENTS #20). */
  tone: 'danger' | 'warning' | 'ok';
  /** Judul singkat berisi keadaan, mis. "2 SKU Stok Menipis". */
  title: string;
  /** Penjelasan satu baris berisi fakta nyata dari data (siapa, berapa, sejak kapan). */
  detail: string;
  /** Rujukan kanan seperti nomor pesanan; "Aman" bila kategori tidak bermasalah. */
  ref: string;
  /** Tab tujuan klik kartu (drill-down). */
  targetTab: string;
}

/** Data mentah yang dibutuhkan buildExceptionItems. */
export interface ExceptionInput {
  orders: Order[];
  inventory: InventoryItem[];
  shipments: Shipment[];
  returns: ReturnRequest[];
}

/**
 * Menyusun 5 kartu Exception Bar sesuai DESIGN §8.1 butir 2 + modul Retur.
 *
 * Apa ini? Penghitung pengecualian operasional. Untuk apa? Menjawab PRD #26
 * "apa yang terlambat / bermasalah / membutuhkan tindakan" tanpa angka hafalan.
 * Kenapa ada? Kartu ditampilkan untuk semua kategori — yang aman diberi tanda hijau,
 * supaya pengguna tahu kategori itu memang dipantau, bukan lupa (AGENTS #14).
 */
export const buildExceptionItems = ({ orders, inventory, shipments, returns }: ExceptionInput): ExceptionItem[] => {
  const items: ExceptionItem[] = [];
  // Waktu "sekarang" disimpan sekali supaya seluruh kartu memakai acuan jam yang sama.
  const nowMs = Date.now();

  // 1. Pesanan yang belum terkirim tapi sudah lewat 24 jam sejak masuk.
  const stalledOrders = orders
    .filter(
      (order) =>
        IN_WAREHOUSE_FLOW.includes(order.status) &&
        nowMs - parseDateTime(order.orderDate).getTime() > STALLED_LIMIT_MS,
    )
    .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const oldestStalled = stalledOrders[0];
  items.push({
    id: 'stalledOrders',
    needsAction: stalledOrders.length > 0,
    tone: stalledOrders.length > 0 ? 'danger' : 'ok',
    title: stalledOrders.length > 0 ? `${stalledOrders.length} Pesanan Tertahan` : 'Tidak Ada Pesanan Tertahan',
    detail: oldestStalled
      ? `Belum terkirim ${formatAge(nowMs - parseDateTime(oldestStalled.orderDate).getTime())} sejak pesanan masuk`
      : 'Semua pesanan bergerak lebih cepat dari batas 24 jam',
    ref: oldestStalled ? oldestStalled.orderNumber : 'Aman',
    targetTab: 'orders',
  });

  // 2. SKU yang stok tersedia-nya sudah di bawah batas minimum gudang.
  const lowStockItems = inventory
    .filter((item) => item.availableStock <= item.minThreshold)
    .sort((a, b) => a.availableStock - b.availableStock);
  const lowestStock = lowStockItems[0];
  items.push({
    id: 'lowStock',
    needsAction: lowStockItems.length > 0,
    tone: lowStockItems.length > 0 ? 'danger' : 'ok',
    title: lowStockItems.length > 0 ? `${lowStockItems.length} SKU Stok Menipis` : 'Stok Semua Aman',
    detail: lowestStock
      ? `${lowestStock.productName} (${lowestStock.variant}) sisa ${lowestStock.availableStock} unit`
      : 'Semua SKU masih di atas batas minimum',
    ref: lowestStock ? `${lowStockItems.length} SKU` : 'Aman',
    targetTab: 'inventory',
  });

  // 3. Kurir yang telat = status efektif DELAYED (definisi tunggal di shipmentDisplay:
  //    status DELAYED dari kurir, ATAU masih jalan tapi lewat estimasi tiba).
  const todayLabel = localTodayLabel();
  const delayedShipments = shipments.filter(
    (shipment) => effectiveShipmentStatus(shipment, todayLabel) === 'DELAYED',
  );
  const firstDelayed = delayedShipments[0];
  items.push({
    id: 'delayedShipments',
    needsAction: delayedShipments.length > 0,
    tone: delayedShipments.length > 0 ? 'warning' : 'ok',
    title: delayedShipments.length > 0 ? `${delayedShipments.length} Pengiriman Terlambat` : 'Pengiriman Sesuai Estimasi',
    detail: firstDelayed
      ? `${firstDelayed.shipmentNumber} ke ${firstDelayed.destinationCity} melewati estimasi ${firstDelayed.estimatedDelivery}`
      : 'Belum ada kiriman yang melewati estimasi tiba',
    ref: firstDelayed ? firstDelayed.courier : 'Aman',
    targetTab: 'shipping',
  });

  // 4. Tagihan belum lunas. DESIGN §8.1 menyebut "jatuh tempo", tetapi schema tidak punya
  //    tanggal jatuh tempo — jadi diberi label "belum lunas" supaya tidak mengklaim tanggal
  //    yang tidak ada pada data (AGENTS #3: jangan membuat field/asumsi sendiri).
  const unpaidOrders = orders.filter((order) => order.status !== 'CANCELLED' && order.outstanding > 0);
  const unpaidTotal = unpaidOrders.reduce((sum, order) => sum + order.outstanding, 0);
  items.push({
    id: 'unpaidBills',
    needsAction: unpaidOrders.length > 0,
    tone: unpaidOrders.length > 0 ? 'warning' : 'ok',
    title: unpaidOrders.length > 0 ? `${unpaidOrders.length} Tagihan Belum Lunas` : 'Tagihan Sudah Lunas',
    detail: unpaidTotal > 0 ? `Sisa piutang ${formatRupiah(unpaidTotal)}` : 'Tidak ada sisa tagihan pada periode ini',
    ref: unpaidOrders.length > 0 ? `${unpaidOrders.length} pesanan` : 'Aman',
    targetTab: 'finance',
  });

  // 5. Retur yang menunggu hasil inspeksi gudang (modul Retur, PRD Bagian 24).
  const pendingReturns = returns.filter((item) => item.status === 'PENDING_INSPECTION');
  const firstReturn = pendingReturns[0];
  items.push({
    id: 'pendingReturns',
    needsAction: pendingReturns.length > 0,
    tone: pendingReturns.length > 0 ? 'warning' : 'ok',
    title: pendingReturns.length > 0 ? `${pendingReturns.length} Retur Menunggu Cek` : 'Retur Tidak Menumpuk',
    detail: firstReturn ? `${firstReturn.returnNumber} · ${firstReturn.customerName}` : 'Semua pengajuan retur sudah diputuskan',
    ref: firstReturn ? (pendingReturns.length > 1 ? `${pendingReturns.length} retur` : firstReturn.returnNumber) : 'Aman',
    targetTab: 'returns',
  });

  return items;
};

/** Label Indonesia untuk tiap peran pengguna (tipe UserRole dari SCHEMA). */
export const ROLE_LABELS: Record<UserRole, string> = {
  MANAGEMENT: 'Manajemen',
  OPERATIONS: 'Operasional',
  WAREHOUSE: 'Gudang',
  SALES: 'Penjualan',
  FINANCE: 'Keuangan',
  MARKETING: 'Pemasaran',
  ADMIN: 'Administrasi',
};

/**
 * Kalimat panduan singkat per peran — diambil dari kebutuhan utama tiap peran
 * pada DESIGN §3 (Model Mental Peran). Apa ini? Teks bantu statis, bukan data.
 * Untuk apa? Menjelaskan panel Fokus Peran sehingga pengguna paham kenapa isi panel
 * berbeda ketika peran diganti (AGENTS #31: dashboard harus menjawab "apa yang harus
 * saya lakukan?" tanpa perlu dokumentasi).
 */
export const ROLE_FOCUS_HINTS: Record<UserRole, string> = {
  MANAGEMENT: 'Ringkasan kinerja bisnis dan bottleneck operasional — tanpa perlu membuka tabel mentah.',
  OPERATIONS: 'Pastikan tidak ada pesanan tertahan, lalu dorong status ke tahap berikutnya.',
  WAREHOUSE: 'Kemas antrean gudang dan jaga stok tetap di atas batas minimum.',
  SALES: 'Konfirmasi pesanan baru dan pantau saluran mana yang paling produktif.',
  FINANCE: 'Cocokkan pembayaran dengan tagihan serta kejar piutang yang belum lunas.',
  MARKETING: 'Pantau kontribusi tiap saluran penjualan dan kampanye yang sedang berjalan.',
  ADMIN: 'Jaga akun pengguna, izin peran, dan jejak audit tetap lengkap.',
};

/**
 * Satu ringkasan yang relevan untuk kartu Fokus Peran.
 * Apa ini? Struktur kartu fokus. Untuk apa? Dirender sebagai tombol di panel fokus peran.
 * Kenapa ada? PRD #26 mewajibkan dashboard memberi informasi relevan per peran,
 * bukan tumpukan angka yang sama untuk semua orang.
 */
export interface RoleFocusItem {
  /** Kunci unik kartu di dalam panel. */
  id: string;
  /** Nilai ringkas, mis. "3 pesanan" atau "Rp 1.070.000". */
  value: string;
  /** Keterangan apa nilai itu, bahasa bisnis sehari-hari. */
  label: string;
  /** Tab tujuan klik kartu. */
  targetTab: string;
}

/** Data mentah + angka turunan yang sudah dihitung panel lain (tidak dihitung dua kali). */
export interface RoleFocusInput {
  role: UserRole;
  orders: Order[];
  fulfillments: Fulfillment[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  returns: ReturnRequest[];
  campaigns: Campaign[];
  users: UserAccount[];
  auditLogs: AuditLog[];
  /** Label saluran dengan omzet terbesar — dihitung panel grafik saluran. */
  topChannelLabel?: string;
  /** Label hari dengan omzet tertinggi — dihitung panel tren harian. */
  peakDayLabel?: string;
}

/**
 * Menyusun tepat 3 kartu fokus untuk peran yang sedang aktif.
 *
 * Apa ini? Pembuat konten panel "Fokus {peran} hari ini".
 * Untuk apa? Menjawab PRD #26 ("dashboard harus memberikan informasi yang relevan
 * berdasarkan role") dan DESIGN §3 (tiap peran punya fokus mental berbeda).
 * Kenapa ada? Semua nilainya dihitung dari data yang sama — hanya dipilih dan
 * disusun sesuai peran, jadi tidak ada angka karangan dan tidak ada logika bisnis baru.
 */
export const buildRoleFocus = ({
  role,
  orders,
  fulfillments,
  inventory,
  movements,
  returns,
  campaigns,
  users,
  auditLogs,
  topChannelLabel = 'Belum ada penjualan',
  peakDayLabel = 'Belum ada data',
}: RoleFocusInput): RoleFocusItem[] => {
  const activeOrders = orders.filter((order) => order.status !== 'CANCELLED');
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const inWarehouseCount = orders.filter((order) => IN_WAREHOUSE_FLOW.includes(order.status) && order.status !== 'PENDING').length;
  const shippedCount = orders.filter((order) => order.status === 'SHIPPED').length;
  const paidTotal = activeOrders.reduce((sum, order) => sum + order.totalPaid, 0);
  const partialCount = activeOrders.filter((order) => order.paymentStatus === 'PARTIAL').length;
  const pendingReturnCount = returns.filter((item) => item.status === 'PENDING_INSPECTION').length;
  const lowStockCount = inventory.filter((item) => item.availableStock <= item.minThreshold).length;
  const readyToShipCount = fulfillments.filter((item) => item.status === 'READY_TO_SHIP').length;
  const unpackedQty = fulfillments.reduce(
    (sum, item) => sum + item.items.reduce((inner, line) => inner + line.quantity - line.packedQuantity, 0),
    0,
  );
  const digitalTotal = activeOrders
    .filter((order) => DIGITAL_CHANNELS.includes(order.salesChannel))
    .reduce((sum, order) => sum + order.total, 0);
  const activeTotal = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const digitalPercent = activeTotal > 0 ? Math.round((digitalTotal / activeTotal) * 100) : 0;
  const activeCampaignCount = campaigns.filter((item) => item.status === 'ACTIVE').length;
  const activeUserCount = users.filter((item) => item.status === 'ACTIVE').length;
  const roleCount = new Set(users.map((item) => item.role)).size;

  // Peta peran → 3 kartu fokus. Ditulis sebagai Record (bukan switch) supaya TypeScript
  // menolak build bila ada peran baru di SCHEMA yang belum diberi konten fokus.
  const focusByRole: Record<UserRole, RoleFocusItem[]> = {
    MANAGEMENT: [
      { id: 'topChannel', value: topChannelLabel, label: 'Saluran penjualan teratas', targetTab: 'orders' },
      { id: 'peakDay', value: peakDayLabel, label: 'Hari dengan omzet tertinggi', targetTab: 'orders' },
      { id: 'pendingReturns', value: `${pendingReturnCount} retur`, label: 'Retur menunggu keputusan', targetTab: 'returns' },
    ],
    OPERATIONS: [
      { id: 'pending', value: `${pendingCount} pesanan`, label: 'Menunggu konfirmasi Anda', targetTab: 'orders' },
      { id: 'inWarehouse', value: `${inWarehouseCount} pesanan`, label: 'Dalam antrian pengerjaan', targetTab: 'orders' },
      { id: 'readyToShip', value: `${readyToShipCount} antrean`, label: 'Siap dikirim dari gudang', targetTab: 'fulfillment' },
    ],
    WAREHOUSE: [
      { id: 'unpacked', value: `${unpackedQty} unit`, label: 'Barang belum dikemas', targetTab: 'fulfillment' },
      { id: 'lowStock', value: `${lowStockCount} SKU`, label: 'Stok di bawah minimum', targetTab: 'inventory' },
      { id: 'movements', value: `${movements.length} mutasi`, label: 'Mutasi stok tercatat', targetTab: 'inventory' },
    ],
    SALES: [
      { id: 'pending', value: `${pendingCount} pesanan`, label: 'Menunggu konfirmasi', targetTab: 'orders' },
      { id: 'topChannel', value: topChannelLabel, label: 'Saluran dengan omzet terbesar', targetTab: 'orders' },
      { id: 'shipped', value: `${shippedCount} pesanan`, label: 'Sedang dalam pengiriman', targetTab: 'shipping' },
    ],
    FINANCE: [
      { id: 'paid', value: formatRupiah(paidTotal), label: 'Pembayaran diterima', targetTab: 'finance' },
      { id: 'partial', value: `${partialCount} pesanan`, label: 'Pembayaran masih sebagian', targetTab: 'finance' },
      { id: 'refunds', value: `${pendingReturnCount} retur`, label: 'Menunggu pengembalian dana', targetTab: 'returns' },
    ],
    MARKETING: [
      { id: 'topChannel', value: topChannelLabel, label: 'Saluran kontribusi terbesar', targetTab: 'orders' },
      { id: 'digitalShare', value: `${digitalPercent}% omzet`, label: 'Berasal dari kanal digital', targetTab: 'orders' },
      { id: 'campaigns', value: `${activeCampaignCount} kampanye`, label: 'Sedang berjalan', targetTab: 'marketing' },
    ],
    ADMIN: [
      { id: 'activeUsers', value: `${activeUserCount} akun`, label: 'Pengguna aktif', targetTab: 'admin' },
      { id: 'roles', value: `${roleCount} peran`, label: 'Peran terdaftar', targetTab: 'admin' },
      { id: 'auditLogs', value: `${auditLogs.length} catatan`, label: 'Jejak audit tercatat', targetTab: 'admin' },
    ],
  };

  return focusByRole[role];
};
