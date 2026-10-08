import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  PackageSearch, 
  PackageCheck, 
  Truck, 
  Home, 
  XCircle, 
  RotateCcw,
  AlertCircle,
  CreditCard,
  Ban
} from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <Clock className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          Menunggu Konfirmasi
        </span>
      );

    case 'CONFIRMED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3 text-teal-600' : 'w-3.5 h-3.5 text-teal-600'} />
          Terkonfirmasi
        </span>
      );

    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-800 border border-sky-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <PackageSearch className={isSm ? 'w-3 h-3 text-sky-600' : 'w-3.5 h-3.5 text-sky-600'} />
          Diproses Gudang
        </span>
      );

    case 'PICKED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <PackageCheck className={isSm ? 'w-3 h-3 text-cyan-600' : 'w-3.5 h-3.5 text-cyan-600'} />
          Selesai Diambil
        </span>
      );

    case 'PACKED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <PackageCheck className={isSm ? 'w-3 h-3 text-indigo-600' : 'w-3.5 h-3.5 text-indigo-600'} />
          Selesai Dikemas
        </span>
      );

    case 'SHIPPED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <Truck className={isSm ? 'w-3 h-3 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
          Dalam Pengiriman
        </span>
      );

    case 'DELIVERED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <Home className={isSm ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
          Tiba di Tujuan
        </span>
      );

    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <XCircle className={isSm ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
          Dibatalkan
        </span>
      );

    case 'RETURNED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <RotateCcw className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          Retur Diajukan
        </span>
      );

    // Payment statuses
    case 'UNPAID':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <Ban className={isSm ? 'w-3 h-3 text-rose-500' : 'w-3.5 h-3.5 text-rose-500'} />
          Belum Dibayar
        </span>
      );

    case 'PARTIAL':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <CreditCard className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          Cicilan / Sebagian
        </span>
      );

    case 'PAID':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
          Lunas
        </span>
      );

    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktif
        </span>
      );

    case 'SUSPENDED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <AlertCircle className={isSm ? 'w-3 h-3 text-rose-500' : 'w-3.5 h-3.5 text-rose-500'} />
          Ditangguhkan
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          {status}
        </span>
      );
  }
};
