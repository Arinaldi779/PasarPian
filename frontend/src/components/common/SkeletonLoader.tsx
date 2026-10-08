import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
  type?: 'table' | 'card' | 'detail';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  rows = 5, 
  type = 'table' 
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded-sm w-24"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded-sm w-32"></div>
            <div className="h-3 bg-slate-100 rounded-sm w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
        <div className="h-4 bg-slate-200 rounded-sm w-28"></div>
        <div className="h-4 bg-slate-200 rounded-sm w-40"></div>
        <div className="h-4 bg-slate-200 rounded-sm w-24"></div>
        <div className="h-4 bg-slate-200 rounded-sm w-32 ml-auto"></div>
      </div>
      <div className="divide-y divide-slate-100 p-2 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-3">
            <div className="h-4 bg-slate-200 rounded-sm w-24"></div>
            <div className="h-4 bg-slate-100 rounded-sm w-48"></div>
            <div className="h-6 bg-slate-200 rounded-full w-28"></div>
            <div className="h-4 bg-slate-100 rounded-sm w-20"></div>
            <div className="h-4 bg-slate-200 rounded-sm w-24 ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
