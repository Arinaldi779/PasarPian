import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  CreditCard,
  History,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  PackageOpen,
  Wallet,
} from 'lucide-react';
import type {
  AuditLog,
  Fulfillment,
  Order,
  OrderStatus,
  PaymentRecord,
  Shipment,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  channelMeta,
  fulfillmentStatusLabels,
  paymentMethodLabels,
  paymentRecordStatusLabels,
} from '../../utils/orderDisplay';
import { formatRupiah } from '../../utils/dashboardInsights';

/**
 * Panel detail pesanan 360° — spesifikasi: Agents/DESIGN.md §8.2 Blok 1–7.
 *
 * Apa ini? Slide-over yang merangkum satu pesanan utuh dalam 3 tab.
 * Untuk apa? Prinsip kontekstual PRD: pengguna memahami 1 pesanan tanpa membuka
 * 5 halaman berbeda (identitas → pelanggan → item → biaya → bayar → kirim → audit).
 * Kenapa ada? Detail terpusat mencegah salah baca status dan salah ambil tindakan.
 *
 * Data sekunder (riwayat bayar, pemenuhan, kiriman, audit) diterima sebagai props
 * dan disaring per pesanan di sini — belum ada API sehingga tanpa lazy loading;
 * saat API tiba, tab Logistik & Audit wajib lazy loading (DESIGN §10.5).
 */
interface OrderDetailModalProps {
  /** Pesanan yang dibuka; null berarti panel tertutup. */
  order: Order | null;
  /** Kendali tampil/sembunyi dari App. */
  isOpen: boolean;
  /** Menutup panel. */
  onClose: () => void;
  /**
   * Mengubah status pesanan mengikuti transisi sah (PRD #16, DESIGN §7.2).
   * Parameter ketiga = alasan pembatalan, wajib diisi saat status CANCELLED.
   */
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus, reason?: string) => void;
  /** Seluruh catatan pembayaran — disaring per nomor pesanan untuk Blok 5. */
  payments?: PaymentRecord[];
  /** Seluruh antrean gudang — dicari per orderId untuk Blok 6. */
  fulfillments?: Fulfillment[];
  /** Seluruh kiriman — dicari per nomor pesanan untuk Blok 6. */
  shipments?: Shipment[];
  /** Seluruh jejak audit — disaring per nomor pesanan untuk Blok 7. */
  auditLogs?: AuditLog[];
}

/** Tab panel: rincian utama, logistik-pengiriman, dan jejak audit. */
type DetailTab = 'details' | 'logistics' | 'audit';

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  payments = [],
  fulfillments = [],
  shipments = [],
  auditLogs = [],
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  // Dialog konfirmasi batal + alasan wajib (DESIGN §11.3 & alur §7.2).
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Ganti pesanan → mulai dari tab Rincian dan tutup dialog batal (state basi menipu).
  useEffect(() => {
    setActiveTab('details');
    setCancelOpen(false);
    setCancelReason('');
    setCancelError('');
  }, [order?.id]);

  // Tombol Escape menutup panel (navigasi keyboard penuh, DESIGN §12.1).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !cancelOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cancelOpen, onClose]);

  if (!isOpen || !order) return null;

  // --- Langkah lifecycle untuk stepper (PRD #16 + DESIGN §7.2) ---
  const lifecycleSteps: { label: string; status: OrderStatus; icon: React.ReactNode }[] = [
    { label: 'Pending', status: 'PENDING', icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" /> },
    { label: 'Terkonfirmasi', status: 'CONFIRMED', icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> },
    { label: 'Gudang (Picking)', status: 'PROCESSING', icon: <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" /> },
    { label: 'Pengiriman', status: 'SHIPPED', icon: <Truck className="h-3.5 w-3.5" aria-hidden="true" /> },
    { label: 'Tiba di Tujuan', status: 'DELIVERED', icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> },
  ];

  /** Posisi pesanan pada alur; -1 untuk status di luar alur normal (CANCELLED/RETURNED). */
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING':
      case 'PICKED':
      case 'PACKED': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return -1;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  // --- Data sekunder per pesanan (disaring dari props, bukan ditulis manual) ---
  const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
  const orderFulfillment = fulfillments.find((item) => item.orderId === order.id);
  const orderShipment = shipments.find((item) => item.orderNumber === order.orderNumber);
  // Jejak audit: entri "dibuat" selalu ada dari data pesanan, sisanya dari log sistem.
  const orderAudits = auditLogs
    .filter((log) => log.entityId === order.orderNumber)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  /** Konfirmasi batal: alasan wajib; dialog ditutup dan panel menampilkan status baru. */
  const confirmCancel = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError('Alasan pembatalan wajib diisi supaya tercatat di jejak audit.');
      return;
    }
    onUpdateStatus?.(order.id, 'CANCELLED', reason);
    setCancelOpen(false);
    setCancelReason('');
    setCancelError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="flex w-screen max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          {/* Blok 1 (Identitas, DESIGN §8.2): nomor, waktu masuk, saluran, status lifecycle */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 font-bold text-[#0D7A70]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono-numbers text-base font-bold text-slate-900">{order.orderNumber}</h3>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    Saluran: {channelMeta[order.salesChannel].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Waktu Masuk: {order.orderDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup detail pesanan"
                className="ml-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Stepper alur: hanya untuk pesanan dalam alur normal */}
          {!isCancelled && currentStep >= 0 && (
            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Alur pesanan
              </div>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-4 right-4 top-3.5 -z-0 h-0.5 bg-slate-200" aria-hidden="true" />
                {lifecycleSteps.map((step, idx) => {
                  const isPassed = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#0D7A70] text-white shadow-xs ring-4 ring-teal-100'
                          : isPassed
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-400'
                      }`}>
                        {step.icon}
                      </div>
                      <span className={`mt-1.5 text-[10px] ${isCurrent ? 'font-bold text-[#0D7A70]' : isPassed ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-6 py-3 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>Pesanan ini telah Dibatalkan. Alasan: {order.notes || 'Pembatalan oleh pembeli/sistem'}.</span>
            </div>
          )}

          {/* Tab progresif: rincian dulu, logistik & audit menyusul (progressive disclosure, AGENTS #31) */}
          <div className="flex gap-6 border-b border-slate-200 bg-white px-6 text-xs font-semibold" role="tablist" aria-label="Bagian detail pesanan">
            {([
              { id: 'details', label: 'Rincian Pesanan' },
              { id: 'logistics', label: 'Logistik & Pengiriman' },
              { id: 'audit', label: 'Jejak Audit' },
            ] as { id: DetailTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D7A70] ${
                  activeTab === tab.id
                    ? 'border-[#0D7A70] text-[#0D7A70]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.id === 'audit' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    {tab.label}
                  </span>
                ) : tab.label}
              </button>
            ))}
          </div>

          {/* Isi tab */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {activeTab === 'details' && (
              <>
                {/* Blok 2 (Pelanggan): nama, tipe, kontak, alamat lengkap */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    Informasi Pelanggan
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div>
                      <div className="text-slate-400">Nama Pelanggan:</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">{order.customerName}</div>
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        order.customerType === 'INSTITUTION' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        Tipe: {order.customerType === 'INSTITUTION' ? 'Lembaga / Instansi' : 'Individu'}
                      </span>
                    </div>

                    <div>
                      <div className="text-slate-400">Kontak & Kota:</div>
                      <div className="mt-0.5 flex items-center gap-1 font-medium text-slate-800">
                        <Phone className="h-3 w-3 text-slate-400" aria-hidden="true" /> {order.customerPhone}
                      </div>
                      <div className="mt-0.5 text-slate-600">{order.customerCity}, Kalimantan Selatan</div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2 sm:col-span-2">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" /> Alamat Pengiriman Lengkap:
                      </div>
                      <div className="mt-0.5 font-medium text-slate-800">{order.shippingAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Blok 3 (Item Belanja): varian, SKU, harga satuan, diskon, subtotal */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Daftar Produk ({order.items.length} Item)
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                        <tr>
                          <th scope="col" className="px-3 py-2.5">Produk & SKU</th>
                          <th scope="col" className="px-3 py-2.5 text-right">Harga</th>
                          <th scope="col" className="px-3 py-2.5 text-center">Qty</th>
                          <th scope="col" className="px-3 py-2.5 text-right">Diskon</th>
                          <th scope="col" className="px-3 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-3">
                              <div className="font-bold text-slate-900">{item.productName}</div>
                              <div className="text-[11px] text-slate-500">Varian: {item.variant}</div>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                                {item.sku}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono-numbers text-slate-700">
                              {formatRupiah(item.unitPrice)}
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono-numbers text-slate-700">
                              {item.discount > 0 ? `- ${formatRupiah(item.discount)}` : '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono-numbers font-bold text-slate-900">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Blok 4 (Ringkasan Biaya): subtotal, ongkir, diskon, pajak, total akhir */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ringkasan Biaya
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Item:</span>
                      <span className="font-mono-numbers">{formatRupiah(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Potongan Diskon:</span>
                        <span className="font-mono-numbers">- {formatRupiah(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Ongkos Kirim Kurir:</span>
                      <span className="font-mono-numbers">{formatRupiah(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak:</span>
                      <span className="font-mono-numbers">{formatRupiah(order.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                      <span>Total Pesanan (Order Total):</span>
                      <span className="font-mono-numbers text-base text-[#0D7A70]">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>
                  {order.notes && !isCancelled && (
                    <p className="mt-3 border-t border-slate-200/70 pt-2 text-xs text-slate-500">
                      Catatan: {order.notes}
                    </p>
                  )}
                </div>

                {/* Blok 5 (Pembayaran): riwayat bayar per catatan + sisa outstanding */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <CreditCard className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      Riwayat Pembayaran
                    </span>
                    <StatusBadge status={order.paymentStatus} size="sm" />
                  </div>

                  {orderPayments.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                      <Wallet className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      Belum ada pembayaran tercatat untuk pesanan ini.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {orderPayments.map((payment) => (
                        <li
                          key={payment.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800">
                              {paymentMethodLabels[payment.method] ?? payment.method} · {payment.paymentDate}
                            </div>
                            <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                              Ref: {payment.referenceNo} · {paymentRecordStatusLabels[payment.status] ?? payment.status}
                            </div>
                          </div>
                          <span className="shrink-0 font-mono-numbers font-bold text-emerald-700">
                            {formatRupiah(payment.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Telah Dibayar (Total Paid):</span>
                      <span className="font-mono-numbers font-semibold text-emerald-700">
                        {formatRupiah(order.totalPaid)}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between rounded-lg border p-2.5 font-bold ${
                      order.outstanding > 0
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}>
                      <div>
                        <div>Sisa Tagihan Tertunda (Outstanding):</div>
                        <div className="text-[10px] font-normal text-slate-500">Formula: Total Pesanan − Total Bayar</div>
                      </div>
                      <span className="font-mono-numbers text-sm">
                        {formatRupiah(order.outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'logistics' && (
              <div className="space-y-4">
                {/* Blok 6a (Pemenuhan): antrean gudang pesanan ini */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <PackageCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    Status Pemenuhan Gudang
                  </div>
                  {!orderFulfillment ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                      <PackageOpen className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {isCancelled
                        ? 'Pesanan dibatalkan sehingga tidak masuk antrean gudang.'
                        : order.status === 'PENDING'
                        ? 'Pesanan belum dikonfirmasi sehingga belum masuk antrean gudang.'
                        : 'Belum ada antrean pemenuhan tercatat untuk pesanan ini.'}
                    </div>
                  ) : (
                    <div className="text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-numbers font-bold text-slate-900">
                          {orderFulfillment.fulfillmentNumber}
                        </span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-800">
                          {fulfillmentStatusLabels[orderFulfillment.status] ?? orderFulfillment.status}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">{orderFulfillment.warehouseName}</p>
                      <ul className="mt-2 space-y-1.5">
                        {orderFulfillment.items.map((line) => (
                          <li
                            key={line.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-slate-800">
                                {line.productName} · {line.variant}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">{line.sku}</span>
                            </span>
                            <span className="shrink-0 text-right font-mono-numbers text-[11px] text-slate-600">
                              Diambil {line.pickedQuantity}/{line.quantity} · Dikemas {line.packedQuantity}/{line.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Blok 6b (Pengiriman): kurir, resi, estimasi, riwayat pelacakan dari data */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Truck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    Informasi Ekspedisi Pengiriman
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400">Kurir Pengirim:</div>
                      <div className="font-bold text-slate-800">{order.courier || orderShipment?.courier || 'Belum ditugaskan'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Nomor Resi Pelacakan:</div>
                      <div className="font-mono font-bold text-blue-700">{order.trackingNumber || orderShipment?.trackingNumber || 'Belum terbit'}</div>
                    </div>
                    {orderShipment && (
                      <div className="col-span-2 text-slate-500">
                        Estimasi tiba: <span className="font-mono-numbers font-semibold text-slate-700">{orderShipment.estimatedDelivery}</span>
                        {' · '}Layanan: {orderShipment.service}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pelacakan Kronologis
                    </div>
                    {!orderShipment || orderShipment.timeline.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Paket masih berada dalam antrean pemrosesan gudang. Resi dan riwayat kurir akan muncul setelah barang diserahkan ke ekspedisi.
                      </div>
                    ) : (
                      <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-slate-200">
                        {orderShipment.timeline.map((step, index) => (
                          <div key={`${step.timestamp}-${index}`} className="relative">
                            <div
                              className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ${
                                index === orderShipment.timeline.length - 1
                                  ? 'bg-blue-600 ring-4 ring-blue-100'
                                  : 'bg-slate-300'
                              }`}
                              aria-hidden="true"
                            />
                            <div className="text-xs font-bold text-slate-900">{step.description}</div>
                            <div className="font-mono-numbers text-[11px] text-slate-500">{step.timestamp} • {step.location}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Riwayat Audit Transaksi (Audit Trail)
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 text-xs">
                  {/* Entri awal selalu diturunkan dari data pesanan — bukan dari hafalan. */}
                  <div className="flex items-start gap-3 bg-slate-50/50 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <div>
                      <div className="font-bold text-slate-900">Pesanan Dibuat oleh Pelanggan</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Oleh: {order.customerName} via {channelMeta[order.salesChannel].label} • {order.orderDate}
                      </div>
                      <div className="mt-1 rounded border border-slate-200 bg-white p-1.5 text-[11px] text-slate-600">
                        Status awal PENDING, total {formatRupiah(order.total)}
                      </div>
                    </div>
                  </div>

                  {orderAudits.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 bg-slate-50/50 p-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      <div>
                        <div className="font-bold text-slate-900">
                          {log.action === 'STATUS_CHANGE' ? `Perubahan Status Pesanan ke ${log.newValue.replace('Status: ', '')}` : log.action}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Oleh: {log.actor} ({log.role}) • {log.timestamp}
                        </div>
                        <div className="mt-1 rounded border border-slate-200 bg-white p-1.5 font-mono-numbers text-[11px] text-slate-600">
                          {log.oldValue} → {log.newValue}
                        </div>
                      </div>
                    </div>
                  ))}

                  {orderAudits.length === 0 && (
                    <p className="bg-white p-3 text-[11px] text-slate-500">
                      Belum ada perubahan tercatat setelah pesanan dibuat.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aksi kontekstual: hanya transisi sah yang dirender (DESIGN §7.2, AGENTS #15) */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="text-xs text-slate-500">
              ID Pesanan: <span className="font-mono font-bold text-slate-700">{order.id}</span>
            </div>

            <div className="flex items-center gap-2">
              {order.status === 'PENDING' && onUpdateStatus && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCancelReason('');
                      setCancelError('');
                      setCancelOpen(true);
                    }}
                  >
                    Batalkan Pesanan
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                  >
                    Konfirmasi Pesanan
                  </Button>
                </>
              )}

              {order.status === 'CONFIRMED' && onUpdateStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, 'PROCESSING')}
                >
                  Kirim ke Gudang (Proses)
                </Button>
              )}

              {order.status === 'PROCESSING' && onUpdateStatus && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                >
                  Tandai Telah Dikirim
                </Button>
              )}

              {order.status === 'SHIPPED' && onUpdateStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                >
                  Konfirmasi Paket Diterima
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog konfirmasi batal dua-tahap + alasan wajib (DESIGN §11.3, alur §7.2) */}
      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Batalkan ${order.orderNumber}?`}
        subtitle="Tindakan destruktif — pesanan keluar dari antrean dan stok reservasi dilepas."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)}>
              Kembali (aman)
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmCancel}>
              Ya, batalkan pesanan
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs leading-5 text-slate-600">
            Pembatalan tidak bisa dibatalkan lagi. Tulis alasannya supaya tercatat di jejak audit
            dan bisa dipertanggungjawabkan ke pelanggan ({order.customerName}).
          </p>
          <div>
            <label htmlFor="cancel-reason" className="mb-1 block text-xs font-semibold text-slate-700">
              Alasan pembatalan <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value);
                if (cancelError) setCancelError('');
              }}
              rows={3}
              placeholder="Contoh: Pelanggan meminta batal via telepon karena salah pilih varian"
              className="neu-pressed min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
            {cancelError && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-600" role="alert">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {cancelError}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
