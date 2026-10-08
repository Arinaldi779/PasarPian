import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { paymentMethodLabels } from '../../utils/orderDisplay';
import { localTodayLabel } from '../../utils/shipmentDisplay';
import { formatRupiah } from '../../utils/dashboardInsights';
import type { Order, PaymentRecord, RecordPaymentInput } from '../../types';

/**
 * Modal pencatatan pembayaran cicilan/tambahan — spesifikasi: DESIGN §8.4
 * ("tombol aksi pencatatan pembayaran cicilan/tambahan jika belum lunas").
 *
 * Apa ini? Form pencatatan bayar untuk satu pesanan yang masih berpiutang.
 * Untuk apa? FINANCE mencatat cicilan/instansi bayar bertahap; hasilnya
 * menggerakkan Total Paid → Outstanding → status bayar (DESIGN §7.3).
 * Kenapa ada? Tanpa jalur resmi, pembayaran tunai/transfer hanya tercatat di
 * kertas — piutang aplikasi tidak pernah lunas dan rekonsiliasi mustahil.
 *
 * Batasan sadar: nominal dibatasi sisa tagihan (kelebihan bayar/OVERPAID tidak
 * diterima karena schema tidak punya statusnya); status catatan = COMPLETED
 * karena FINANCE mencatat sekaligus memverifikasi di simulasi ini.
 */
interface RecordPaymentModalProps {
  /** Pesanan yang dibayar; null berarti modal tertutup. */
  order: Order | null;
  /** Kendali tampil/sembunyi dari halaman Keuangan. */
  isOpen: boolean;
  /** Menutup modal. */
  onClose: () => void;
  /** Menyimpan masukan yang sudah lolos validasi form. */
  onSubmit: (orderId: string, input: RecordPaymentInput) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentRecord['method']>('TRANSFER_BANK');
  const [paymentDate, setPaymentDate] = useState(localTodayLabel());
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen || !order) return null;

  const remaining = order.outstanding;
  const canSubmit = amount > 0 && amount <= remaining && referenceNo.trim() !== '' && paymentDate !== '';

  /** Validasi form lalu teruskan; guard nominal diulang di App (AGENTS #15). */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!(amount > 0)) {
      setFormError('Nominal harus lebih dari Rp 0.');
      return;
    }
    if (amount > remaining) {
      setFormError(
        `Nominal melebihi sisa tagihan (${formatRupiah(remaining)}). Kelebihan bayar tidak diterima — pecah menjadi dua pencatatan bila perlu.`,
      );
      return;
    }
    if (referenceNo.trim() === '') {
      setFormError('Nomor referensi/bukti bayar wajib diisi untuk rekonsiliasi.');
      return;
    }
    if (paymentDate === '') {
      setFormError('Tanggal bayar wajib diisi.');
      return;
    }
    setFormError('');
    onSubmit(order.id, { amount, method, paymentDate, referenceNo: referenceNo.trim(), notes: notes.trim() || undefined });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Catat pembayaran — ${order.orderNumber}`}
      subtitle={`${order.customerName} · Sisa tagihan ${formatRupiah(remaining)}`}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            Simpan pembayaran
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex justify-between text-slate-600">
            <span>Total pesanan:</span>
            <span className="font-mono-numbers font-semibold text-slate-900">{formatRupiah(order.total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-slate-600">
            <span>Sudah dibayar:</span>
            <span className="font-mono-numbers font-semibold text-emerald-700">{formatRupiah(order.totalPaid)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1.5 font-bold">
            <span className="text-slate-800">Sisa tagihan:</span>
            <span className="font-mono-numbers text-amber-800">{formatRupiah(remaining)}</span>
          </div>
        </div>

        <div>
          <label htmlFor="pay-amount" className="mb-1 block font-semibold text-slate-700">
            Nominal pembayaran (maks {formatRupiah(remaining)}) <span className="text-rose-600">*</span>
          </label>
          <input
            id="pay-amount"
            type="number"
            min={1}
            max={remaining}
            value={amount}
            onChange={(event) => {
              setAmount(Number.parseInt(event.target.value, 10) || 0);
              if (formError) setFormError('');
            }}
            placeholder="Contoh: 300000"
            className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-numbers text-sm font-bold text-slate-900 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pay-method" className="mb-1 block font-semibold text-slate-700">
              Metode <span className="text-rose-600">*</span>
            </label>
            <select
              id="pay-method"
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentRecord['method'])}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            >
              {(Object.keys(paymentMethodLabels) as PaymentRecord['method'][]).map((value) => (
                <option key={value} value={value}>
                  {paymentMethodLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pay-date" className="mb-1 block font-semibold text-slate-700">
              Tanggal bayar <span className="text-rose-600">*</span>
            </label>
            <input
              id="pay-date"
              type="date"
              value={paymentDate}
              max={localTodayLabel()}
              onChange={(event) => {
                setPaymentDate(event.target.value);
                if (formError) setFormError('');
              }}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pay-ref" className="mb-1 block font-semibold text-slate-700">
            Nomor referensi / bukti bayar <span className="text-rose-600">*</span>
          </label>
          <input
            id="pay-ref"
            type="text"
            value={referenceNo}
            onChange={(event) => {
              setReferenceNo(event.target.value);
              if (formError) setFormError('');
            }}
            placeholder="Contoh: BPD-KSL-882105"
            className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
          />
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Dipakai untuk mencocokkan dengan mutasi bank.
          </p>
        </div>

        <div>
          <label htmlFor="pay-notes" className="mb-1 block font-semibold text-slate-700">
            Catatan (opsional)
          </label>
          <input
            id="pay-notes"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contoh: Cicilan pertama via transfer"
            className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
          />
        </div>

        {formError && (
          <p className="flex items-center gap-1 text-xs font-medium text-rose-600" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
};
