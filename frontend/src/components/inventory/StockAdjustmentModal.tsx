import React, { useState } from 'react';
import type { InventoryItem } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Modal penyesuaian stok gudang — spesifikasi: DESIGN §8.3 + §7.4 + §11.3.
 *
 * Apa ini? Form koreksi selisih fisik vs catatan (opname, barang rusak, koreksi supplier).
 * Untuk apa? WAREHOUSE meluruskan catatan tanpa merusak rumus Tersedia = Fisik − Reservasi
 * (penyesuaian hanya menggeser Fisik & Tersedia, reservasi tidak disentuh).
 * Kenapa ada? Selisih stok pasti terjadi di gudang nyata; tanpa jalur resmi yang
 * tercatat, selisih hanya bisa "diakali" lewat data — auditability hancur (AGENTS #21).
 *
 * Aturan main: pengurangan stok (qty negatif) = destruktif → wajib konfirmasi dua-tahap
 * (DESIGN §11.3). Nomor referensi dokumen + alasan wajib diisi (DESIGN §7.4) dan
 * diteruskan ke pencatat agar muncul di buku mutasi dan jejak audit.
 */
interface StockAdjustmentModalProps {
  /** Baris stok yang dikoreksi; null berarti modal tertutup. */
  item: InventoryItem | null;
  /** Kendali tampil/sembunyi dari halaman Inventaris. */
  isOpen: boolean;
  /** Menutup modal (dan membatalkan tahap konfirmasi). */
  onClose: () => void;
  /** Menyimpan: (id baris, jumlah +/−, alasan, nomor referensi dokumen). */
  onSubmit: (itemId: string, adjustmentQty: number, reason: string, referenceNo: string) => void;
}

/** Tahap modal: isi form dulu, konfirmasi hanya untuk pengurangan stok. */
type AdjustmentStep = 'form' | 'confirm';

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [reason, setReason] = useState('Hasil Perhitungan Fisik (Stock Opname Rutin)');
  const [referenceNo, setReferenceNo] = useState('');
  const [step, setStep] = useState<AdjustmentStep>('form');
  const [formError, setFormError] = useState('');

  if (!isOpen || !item) return null;

  const newPhysical = item.physicalStock + adjustmentQty;
  const newAvailable = item.availableStock + adjustmentQty;
  const isReduction = adjustmentQty < 0;
  const canSubmit = adjustmentQty !== 0 && newPhysical >= 0 && referenceNo.trim() !== '';

  /** Validasi tahap form; pengurangan lanjut ke konfirmasi, penambahan langsung simpan. */
  const handlePrimaryAction = (event: React.FormEvent) => {
    event.preventDefault();
    if (adjustmentQty === 0) {
      setFormError('Jumlah penyesuaian belum diisi — tulis angka selain nol.');
      return;
    }
    if (newPhysical < 0) {
      setFormError(`Stok fisik tidak boleh minus (hasilnya ${newPhysical}). Kecilkan pengurangannya.`);
      return;
    }
    if (referenceNo.trim() === '') {
      setFormError('Nomor referensi dokumen wajib diisi, mis. nomor Berita Acara opname.');
      return;
    }
    setFormError('');
    if (isReduction) setStep('confirm');
    else {
      onSubmit(item.id, adjustmentQty, reason, referenceNo.trim());
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'form' ? 'Penyesuaian Stok Gudang' : 'Konfirmasi Pengurangan Stok'}
      subtitle={`SKU: ${item.sku} • ${item.warehouseName}`}
      maxWidth="md"
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrimaryAction} disabled={!canSubmit}>
              {isReduction ? 'Lanjut ke konfirmasi' : 'Simpan Perubahan Stok'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => setStep('form')}>
              Kembali (aman)
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onSubmit(item.id, adjustmentQty, reason, referenceNo.trim());
                onClose();
              }}
            >
              Ya, kurangi {Math.abs(adjustmentQty)} unit
            </Button>
          </>
        )
      }
    >
      {step === 'form' ? (
        <form onSubmit={handlePrimaryAction} className="space-y-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-sm font-bold text-slate-900">{item.productName}</div>
            <div className="mt-0.5 text-slate-500">Varian: {item.variant}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center">
              <div>
                <div className="text-slate-400">Fisik</div>
                <div className="font-mono-numbers text-base font-medium text-slate-600">{item.physicalStock}</div>
              </div>
              <div>
                <div className="text-slate-400">Terkunci</div>
                <div className="font-mono-numbers text-base font-medium text-amber-700">{item.reservedStock}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-500">Tersedia</div>
                <div className="font-mono-numbers text-lg font-bold text-[#0D7A70]">{item.availableStock}</div>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Penyesuaian hanya menggeser Fisik (Tersedia ikut berubah); stok Terkunci tidak berubah.
            </p>
          </div>

          <div>
            <label htmlFor="adjust-qty" className="mb-1 block font-semibold text-slate-700">
              Jumlah penyesuaian (+ tambah, − kurang) <span className="text-rose-600">*</span>
            </label>
            <input
              id="adjust-qty"
              type="number"
              value={adjustmentQty}
              onChange={(event) => {
                setAdjustmentQty(Number.parseInt(event.target.value, 10) || 0);
                if (formError) setFormError('');
              }}
              placeholder="Contoh: 5 atau -2"
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-numbers text-sm font-bold text-slate-900 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Fisik baru: <strong className="font-mono-numbers text-slate-800">{newPhysical}</strong> unit</span>
              <span>Tersedia baru: <strong className="font-mono-numbers text-slate-800">{newAvailable}</strong> unit</span>
            </div>
          </div>

          <div>
            <label htmlFor="adjust-reason" className="mb-1 block font-semibold text-slate-700">
              Alasan penyesuaian (wajib untuk audit) <span className="text-rose-600">*</span>
            </label>
            <select
              id="adjust-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs outline-none focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            >
              <option>Hasil Perhitungan Fisik (Stock Opname Rutin)</option>
              <option>Kerusakan / Cacat Barang di Gudang (Damage)</option>
              <option>Koreksi Selisih Pengiriman Supplier</option>
              <option>Pelepasan Retur Manual</option>
              <option>Lainnya (Pencatatan Khusus)</option>
            </select>
          </div>

          <div>
            <label htmlFor="adjust-ref" className="mb-1 block font-semibold text-slate-700">
              Nomor referensi dokumen (Berita Acara / surat jalan) <span className="text-rose-600">*</span>
            </label>
            <input
              id="adjust-ref"
              type="text"
              value={referenceNo}
              onChange={(event) => {
                setReferenceNo(event.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Contoh: BA-OPNAME-2026-011"
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>

          {formError && (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-600" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="text-[11px]">
              Tercatat ke <strong>buku mutasi stok</strong> dan <strong>jejak audit</strong> sebagai
              penyesuaian stok. Pengurangan stok meminta konfirmasi kedua setelah ini.
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <p className="text-xs leading-5">
              Pian mengurangi <strong className="font-mono-numbers">{Math.abs(adjustmentQty)} unit</strong> dari{' '}
              <strong>{item.productName}</strong> ({item.sku}). Stok fisik {item.physicalStock} →{' '}
              <strong className="font-mono-numbers">{newPhysical}</strong>, tersedia {item.availableStock} →{' '}
              <strong className="font-mono-numbers">{newAvailable}</strong>. Tindakan ini tidak bisa dibatalkan
              dan tercatat atas peran yang sedang aktif.
            </p>
          </div>
          <dl className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Alasan:</dt>
              <dd className="text-right font-medium text-slate-800">{reason}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Referensi:</dt>
              <dd className="font-mono-numbers font-medium text-slate-800">{referenceNo.trim()}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
};
