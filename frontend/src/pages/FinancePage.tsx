import React, { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Search,
  Undo2,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterTabs } from '../components/common/FilterTabs';
import { RecordPaymentModal } from '../components/finance/RecordPaymentModal';
import { paymentMethodLabels, paymentRecordStatusLabels } from '../utils/orderDisplay';
import { returnStatusLabels } from '../utils/returnDisplay';
import { formatRupiah } from '../utils/dashboardInsights';
import type { Order, PaymentRecord, RecordPaymentInput, ReturnRequest } from '../types';

/**
 * Halaman Keuangan & Rekonsiliasi — spesifikasi: Agents/DESIGN.md §8.4 + alur §7.3.
 *
 * Apa ini? Tiga tampilan: uang masuk, tagihan belum lunas, dan refund.
 * Untuk apa? FINANCE mencocokkan uang vs tagihan (rekonsiliasi), mencatat
 * cicilan, dan memantau refund (DESIGN §3).
 * Kenapa ada? Uang yang tidak dicocokkan secara rutin akan bocor pelan-pelan —
 * halaman ini memaksa TL;DR: masuk berapa, kurang berapa, keluar berapa.
 *
 * Rumus kebenaran (PRD #18, DESIGN §7.3): Total Paid = jumlah Payments;
 * Outstanding = Total − Total Paid. Status bayar diturunkan dari angkanya,
 * bukan sebaliknya: lunas ⇔ sisa nol; sebagian ⇔ sudah ada bayar tapi sisa > 0.
 */
interface FinancePageProps {
  /** Pesanan dari App — sumber Total, Total Paid, Outstanding, dan status bayar. */
  orders: Order[];
  /** Catatan pembayaran dari App (state — pencatatan baru ikut tampil di sini). */
  payments: PaymentRecord[];
  /** Pengajuan retur dari App — sumber tab Refund. */
  returns: ReturnRequest[];
  /** Mencatat cicilan/tambahan yang sudah lolos validasi modal. */
  onRecordPayment: (orderId: string, input: RecordPaymentInput) => void;
  /** Membuka panel detail 360° pesanan (ketertelusuran Pesanan → Keuangan, DESIGN §5.33). */
  onSelectOrder?: (order: Order) => void;
}

/** Tiga tab sesuai DESIGN §8.4: pembayaran | outstanding | refund. */
type FinanceTab = 'PAYMENTS' | 'OUTSTANDING' | 'REFUNDS';

/** Gaya badge status retur: ikon + tulisan (AGENTS #19). */
const refundStatusStyles: Record<ReturnRequest['status'], { chip: string; icon: React.ReactNode }> = {
  PENDING_INSPECTION: {
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  APPROVED: {
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  REJECTED: {
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  COMPLETED: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

export const FinancePage: React.FC<FinancePageProps> = ({
  orders,
  payments,
  returns,
  onRecordPayment,
  onSelectOrder,
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('PAYMENTS');
  const [searchQuery, setSearchQuery] = useState('');
  // Pesanan yang sedang dicatat pembayarannya; dikunci per id supaya form selalu baru.
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  // --- Metrik utama (DESIGN §8.4): dihitung dari data, bukan ditulis manual ---
  // Hanya COMPLETED yang dihitung sebagai uang masuk; menunggu verifikasi/gagal
  // belum boleh dianggap lunas (ARCHITECTURE: frontend tak menentukan status final).
  const completedPayments = payments.filter((payment) => payment.status === 'COMPLETED');
  const paymentTotal = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingOrders = orders.filter((order) => order.status !== 'CANCELLED' && order.outstanding > 0);
  const outstandingTotal = outstandingOrders.reduce((sum, order) => sum + order.outstanding, 0);
  // "Diproses" = menunggu inspeksi + disetujui (belum dibayarkan); ditolak/selesai keluar.
  const pendingRefunds = returns.filter(
    (returnRequest) => returnRequest.status === 'APPROVED' || returnRequest.status === 'PENDING_INSPECTION',
  );
  const pendingRefundTotal = pendingRefunds.reduce((sum, returnRequest) => sum + returnRequest.refundAmount, 0);

  const query = searchQuery.trim().toLowerCase();

  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          !query ||
          [payment.orderNumber, payment.customerName, payment.referenceNo, paymentMethodLabels[payment.method]]
            .some((value) => value.toLowerCase().includes(query)),
      ),
    [payments, query],
  );

  const filteredOutstanding = useMemo(
    () =>
      outstandingOrders.filter(
        (order) =>
          !query ||
          [order.orderNumber, order.customerName, order.customerCity].some((value) =>
            value.toLowerCase().includes(query),
          ),
      ),
    // outstandingOrders turunan orders — deps orders + query sudah mencakupnya.
    [orders, query],
  );

  const filteredReturns = useMemo(
    () =>
      returns.filter(
        (returnRequest) =>
          !query ||
          [
            returnRequest.returnNumber,
            returnRequest.orderNumber,
            returnRequest.customerName,
            returnRequest.productName,
          ].some((value) => value.toLowerCase().includes(query)),
      ),
    [returns, query],
  );

  /** Mengembalikan tab + saringan ke awal — dipakai kartu ringkasan dan empty state. */
  const resetAll = (tab: FinanceTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <CreditCard className="h-4 w-4" aria-hidden="true" /> Keuangan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pembayaran & rekonsiliasi</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Lihat uang yang sudah masuk, tagihan yang belum lunas, dan refund yang sedang diproses.
            Semua angka berasal dari data pesanan, pembayaran, dan retur.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="neu-raised shrink-0"
          leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => alert('Fitur ekspor CSV segera hadir — data yang tampil masih contoh.')}
        >
          Ekspor data
        </Button>
      </header>

      {/* Metrik utama: kartu bisa diklik menuju tabnya (DESIGN §5.3-D.5) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan keuangan">
        <StatCard
          title="Total pembayaran masuk"
          value={formatRupiah(paymentTotal)}
          icon={<Banknote className="h-5 w-5" aria-hidden="true" />}
          trendText={`${completedPayments.length} pembayaran terverifikasi`}
          trendDirection="neutral"
          onClick={() => resetAll('PAYMENTS')}
        />
        <StatCard
          title="Sisa tagihan belum lunas"
          value={formatRupiah(outstandingTotal)}
          icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
          trendText="Total pesanan − total yang sudah dibayar"
          trendDirection="neutral"
          exceptionTag={outstandingOrders.length > 0 ? `${outstandingOrders.length} pesanan menunggak` : undefined}
          exceptionType="warning"
          onClick={() => resetAll('OUTSTANDING')}
        />
        <StatCard
          title="Refund sedang diproses"
          value={formatRupiah(pendingRefundTotal)}
          icon={<Undo2 className="h-5 w-5" aria-hidden="true" />}
          trendText={`${pendingRefunds.length} pengajuan menunggu penyelesaian`}
          trendDirection="neutral"
          onClick={() => resetAll('REFUNDS')}
        />
      </section>

      {/* Rekonsiliasi: 3 tab + pencarian lintas tab */}
      <section className="glass rounded-2xl p-5" aria-labelledby="finance-title">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="finance-title" className="text-base font-semibold text-slate-900">
              Rekonsiliasi
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih tampilan yang paling sesuai dengan pekerjaan hari ini.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="finance-search" className="sr-only">
              Cari data keuangan
            </label>
            <input
              id="finance-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari order, pelanggan, atau referensi..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <FilterTabs
            options={[
              { id: 'PAYMENTS', label: 'Semua pembayaran', count: payments.length },
              { id: 'OUTSTANDING', label: 'Tagihan tertunda', count: outstandingOrders.length },
              { id: 'REFUNDS', label: 'Pengembalian dana', count: returns.length },
            ] as { id: FinanceTab; label: string; count: number }[]}
            activeId={activeTab}
            onChange={setActiveTab}
            ariaLabel="Tampilan keuangan"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white" aria-live="polite">
          {activeTab === 'PAYMENTS' && (
            <div className="min-w-[760px]">
              <p className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredPayments.length}</strong> dari{' '}
                <span className="font-mono-numbers">{payments.length}</span> pembayaran. Cicilan tampil per transaksi —
                satu order bisa punya beberapa baris.
              </p>
              {filteredPayments.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Tanggal</th>
                      <th scope="col" className="px-4 py-3">Order</th>
                      <th scope="col" className="px-4 py-3">Pelanggan</th>
                      <th scope="col" className="px-4 py-3">Metode</th>
                      <th scope="col" className="px-4 py-3">Referensi</th>
                      <th scope="col" className="px-4 py-3 text-right">Nominal</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers text-slate-500">
                          {payment.paymentDate}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers font-semibold text-slate-900">
                          {payment.orderNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{payment.customerName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {paymentMethodLabels[payment.method]}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers text-slate-600">
                          {payment.referenceNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono-numbers text-sm font-bold text-emerald-700">
                          {formatRupiah(payment.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {payment.status === 'COMPLETED' ? (
                            <StatusBadge status="PAID" size="sm" />
                          ) : (
                            <span className="text-slate-500">
                              {paymentRecordStatusLabels[payment.status] ?? payment.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <FinanceEmpty
                  title={payments.length === 0 ? 'Belum ada pembayaran tercatat' : 'Tidak ada pembayaran yang cocok'}
                  hint={
                    payments.length === 0
                      ? 'Pembayaran yang dicatat tim keuangan akan muncul di sini per transaksi.'
                      : 'Saringan terlalu ketat, bukan kesalahan sistem.'
                  }
                  showReset={payments.length > 0}
                  onReset={() => setSearchQuery('')}
                />
              )}
            </div>
          )}

          {activeTab === 'OUTSTANDING' && (
            <div className="min-w-[860px]">
              <p className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredOutstanding.length}</strong> dari{' '}
                <span className="font-mono-numbers">{outstandingOrders.length}</span> pesanan berpiutang.
                Klik baris untuk melihat detail pesanan, tekan Catat untuk mencatat cicilan.
              </p>
              {filteredOutstanding.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Order</th>
                      <th scope="col" className="px-4 py-3">Pelanggan</th>
                      <th scope="col" className="px-4 py-3">Status pembayaran</th>
                      <th scope="col" className="px-4 py-3 text-right">Total order</th>
                      <th scope="col" className="px-4 py-3 text-right">Sudah dibayar</th>
                      <th scope="col" className="px-4 py-3 text-right">Sisa tagihan</th>
                      <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOutstanding.map((order) => (
                      <tr
                        key={order.id}
                        tabIndex={onSelectOrder ? 0 : undefined}
                        onClick={() => onSelectOrder?.(order)}
                        onKeyDown={(event) => {
                          if (onSelectOrder && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            onSelectOrder(order);
                          }
                        }}
                        aria-label={`Buka detail ${order.orderNumber}, sisa ${formatRupiah(order.outstanding)}`}
                        className={
                          onSelectOrder
                            ? 'cursor-pointer transition-colors hover:bg-slate-50/70 focus:outline-none focus-visible:bg-teal-50/60'
                            : 'transition-colors hover:bg-slate-50/70'
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono-numbers font-semibold text-slate-900">
                          {order.orderNumber}
                          <div className="mt-0.5 font-sans text-[11px] font-normal text-slate-400">
                            {order.orderDate}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{order.customerName}</div>
                          <div className="text-[11px] text-slate-400">{order.customerCity}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={order.paymentStatus} size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono-numbers text-slate-700">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono-numbers text-sm font-bold text-emerald-700">
                          {formatRupiah(order.totalPaid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono-numbers text-sm font-bold text-amber-800">
                          {formatRupiah(order.outstanding)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            type="button"
                            aria-label={`Catat pembayaran untuk ${order.orderNumber}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPayingOrder(order);
                            }}
                            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 font-semibold text-[#0D7A70] transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0D7A70]"
                          >
                            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                            Catat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <FinanceEmpty
                  title={
                    outstandingOrders.length === 0 ? 'Semua tagihan sudah lunas' : 'Tidak ada piutang yang cocok'
                  }
                  hint={
                    outstandingOrders.length === 0
                      ? 'Tidak ada sisa tagihan pada periode ini. Pertahankan!'
                      : 'Saringan terlalu ketat, bukan kesalahan sistem.'
                  }
                  showReset={outstandingOrders.length > 0}
                  onReset={() => setSearchQuery('')}
                />
              )}
            </div>
          )}

          {activeTab === 'REFUNDS' && (
            <div className="min-w-[760px]">
              <p className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredReturns.length}</strong> dari{' '}
                <span className="font-mono-numbers">{returns.length}</span> pengajuan. Nominal final mengikuti hasil
                inspeksi dan keputusan di halaman Retur.
              </p>
              {filteredReturns.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Return</th>
                      <th scope="col" className="px-4 py-3">Order</th>
                      <th scope="col" className="px-4 py-3">Pelanggan</th>
                      <th scope="col" className="px-4 py-3">Produk</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3 text-right">Nominal refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReturns.map((returnRequest) => {
                      const style = refundStatusStyles[returnRequest.status];
                      return (
                        <tr key={returnRequest.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-3 font-mono-numbers font-semibold text-slate-900">
                            {returnRequest.returnNumber}
                            <div className="mt-0.5 font-sans text-[11px] font-normal text-slate-400">
                              Diajukan {returnRequest.requestDate}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono-numbers text-slate-700">
                            {returnRequest.orderNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{returnRequest.customerName}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{returnRequest.productName}</div>
                            <div className="text-[11px] text-slate-400">
                              {returnRequest.variant} · {returnRequest.quantity} unit
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}
                            >
                              {style.icon}
                              {returnStatusLabels[returnRequest.status]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono-numbers text-sm font-bold text-slate-900">
                            {formatRupiah(returnRequest.refundAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <FinanceEmpty
                  title={returns.length === 0 ? 'Belum ada pengajuan retur' : 'Tidak ada refund yang cocok'}
                  hint={
                    returns.length === 0
                      ? 'Pengajuan retur pelanggan akan muncul di sini.'
                      : 'Saringan terlalu ketat, bukan kesalahan sistem.'
                  }
                  showReset={returns.length > 0}
                  onReset={() => setSearchQuery('')}
                />
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          <strong className="font-semibold text-slate-700">Status bayar</strong> mengikuti angka, bukan sebaliknya:
          lunas berarti sisa nol; sebagian berarti sudah ada bayar tapi sisa masih ada.
        </p>
      </section>

      {/* Modal catat bayar: dikunci per id pesanan supaya form selalu baru tiap dibuka */}
      <RecordPaymentModal
        key={payingOrder?.id ?? 'closed'}
        order={payingOrder}
        isOpen={payingOrder !== null}
        onClose={() => setPayingOrder(null)}
        onSubmit={onRecordPayment}
      />
    </div>
  );
};

/**
 * Empty state tabel keuangan (DESIGN §11): pesan dibedakan antara "belum ada data"
 * dan "saringan terlalu ketat", tombol reset hanya pada kasus kedua.
 */
const FinanceEmpty: React.FC<{ title: string; hint: string; showReset: boolean; onReset: () => void }> = ({
  title,
  hint,
  showReset,
  onReset,
}) => (
  <div className="px-4 py-14 text-center">
    <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
    <div className="mt-3 font-semibold text-slate-700">{title}</div>
    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">{hint}</p>
    {showReset && (
      <Button variant="ghost" size="sm" className="mt-3" onClick={onReset}>
        Reset pencarian
      </Button>
    )}
  </div>
);
