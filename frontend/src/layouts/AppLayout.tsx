import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Boxes, 
  Truck, 
  CreditCard, 
  RotateCcw, 
  Megaphone, 
  ShieldCheck, 
  Search, 
  Bell, 
  Menu, 
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { UserRole } from '../types';
import type { AppTheme } from '../components/common/ThemeSwitcher';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';

// Role permissions map dari PRD Bagian 7.
// Ditaruh di level module karena dipakai dua tempat: sidebar (AppLayout)
// dan matriks izin di halaman Administrasi. Satu sumber kebenaran →
// kalau ada perubahan izin, cukup ubah di satu tempat.
export interface NavGroup {
  group: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
  }[];
}

export const navItems: NavGroup[] = [
  {
    group: 'Utama',
    items: [
      { id: 'dashboard', label: 'Beranda / Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'SALES', 'FINANCE', 'MARKETING', 'ADMIN', 'WAREHOUSE'] },
    ]
  },
  {
    group: 'Operasi Transaksi',
    items: [
      { id: 'orders', label: 'Penjualan & Pesanan', icon: <ShoppingCart className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'SALES', 'FINANCE', 'ADMIN'] },
      { id: 'catalog', label: 'Katalog Produk & SKU', icon: <Package className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'SALES', 'MARKETING', 'ADMIN'] },
      { id: 'inventory', label: 'Inventaris & Multi-Gudang', icon: <Warehouse className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'ADMIN'] },
      { id: 'fulfillment', label: 'Pemenuhan (Fulfillment)', icon: <Boxes className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'ADMIN'] },
      { id: 'shipping', label: 'Pengiriman & Ekspedisi', icon: <Truck className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'ADMIN'] },
    ]
  },
  {
    group: 'Finansial & Pasca-Jual',
    items: [
      { id: 'finance', label: 'Keuangan & Tagihan', icon: <CreditCard className="w-4 h-4" />, roles: ['MANAGEMENT', 'FINANCE', 'ADMIN'] },
      { id: 'returns', label: 'Pengajuan Retur', icon: <RotateCcw className="w-4 h-4" />, roles: ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'SALES', 'ADMIN'] },
      { id: 'marketing', label: 'Pemasaran & Kampanye', icon: <Megaphone className="w-4 h-4" />, roles: ['MANAGEMENT', 'MARKETING', 'ADMIN'] },
    ]
  },
  {
    group: 'Sistem & Kontrol',
    items: [
      { id: 'admin', label: 'Administrasi & Audit', icon: <ShieldCheck className="w-4 h-4" />, roles: ['ADMIN', 'MANAGEMENT'] },
    ]
  }
];

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  /** Tema tampilan aktif — diteruskan ke ThemeSwitcher di header. */
  theme: AppTheme;
  /** Dipanggil saat pengguna memilih tema Terang/Gelap/Baca. */
  onChangeTheme: (theme: AppTheme) => void;
  /** Menutup sesi lokal; token/session sungguhan akan dikelola backend nanti. */
  onLogout: () => void;
  /** Identitas akun aktif untuk header, bukan data credential. */
  currentUserName: string;
  onSelectOrder?: (orderId: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  activeRole,
  onChangeRole,
  theme,
  onChangeTheme,
  onLogout,
  currentUserName,
  onSelectOrder,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getBreadcrumb = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Beranda';
      case 'orders': return 'Penjualan / Daftar Pesanan';
      case 'catalog': return 'Katalog Produk / Varian & SKU';
      case 'inventory': return 'Inventaris / Stok & Mutasi';
      case 'fulfillment': return 'Pemenuhan / Antrean Gudang';
      case 'shipping': return 'Pengiriman / Lacak Resi';
      case 'finance': return 'Keuangan / Pembayaran & Outstanding';
      case 'returns': return 'Retur / Pengajuan & Disposisi';
      case 'marketing': return 'Pemasaran / Kampanye Promosi';
      case 'admin': return 'Administrasi / Pengguna & Audit Trail';
      default: return 'Beranda';
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAF9] antialiased">
      {/* Shell viewport tetap: hanya <main> yang scroll. Tanpa h-screen di sini,
          baris konten ikut memanjang mengikuti isi halaman sehingga sidebar
          (yang tingginya mengikuti baris) ikut terseret saat di-scroll. */}
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => onSelectTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {/* Banua River Mark Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D7A70] to-[#0A625A] text-white flex items-center justify-center font-bold shadow-xs tracking-tight">
                P
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-[#0F172A] tracking-tight group-hover:text-[#0D7A70] transition-colors">
                    PasarPian
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-200/70">
                    Banua
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Pasar urang Banua, gasan pian
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-4 border-l border-slate-200 ml-2">
              <span>Aplikasi</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-slate-700">{getBreadcrumb(currentTab)}</span>
            </div>
          </div>

          {/* Right: Search, Role Switcher, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/80 hover:bg-slate-100 hover:text-slate-600 rounded-lg border border-slate-200/80 transition-colors w-36 sm:w-64 justify-between"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5" />
                <span className="truncate">Cari order, SKU, resi...</span>
              </span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                Ctrl+K
              </kbd>
            </button>

            {/* Role Switcher (Simulator for Evaluation) */}
            <div className="relative">
              <select
                value={activeRole}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                className="text-xs font-semibold bg-teal-50/80 text-[#0D7A70] border border-teal-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D7A70] cursor-pointer"
                title="Lihat aplikasi sebagai peran lain"
              >
                <option value="MANAGEMENT">Peran: MANAGEMENT</option>
                <option value="OPERATIONS">Peran: OPERATIONS</option>
                <option value="WAREHOUSE">Peran: WAREHOUSE</option>
                <option value="SALES">Peran: SALES</option>
                <option value="FINANCE">Peran: FINANCE</option>
                <option value="MARKETING">Peran: MARKETING</option>
                <option value="ADMIN">Peran: ADMIN</option>
              </select>
            </div>

            {/* Pengalih tema Terang/Gelap/Baca — di header agar selalu terjangkau
                dari halaman mana pun, sebelum lonceng notifikasi. */}
            <ThemeSwitcher theme={theme} onChange={onChangeTheme} />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                  <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Pemberitahuan Sistem (4)</span>
                    <span className="text-[10px] text-[#0D7A70] cursor-pointer hover:underline">Tandai telah dibaca</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    <div className="py-2.5">
                      <div className="font-semibold text-slate-800">Pesanan Baru: ORD-2026-0081</div>
                      <div className="text-slate-500 text-[11px]">Hj. Mardiah Noor memesan 2 Kain Sasirangan.</div>
                    </div>
                    <div className="py-2.5">
                      <div className="font-semibold text-rose-700">Peringatan Stok Menipis!</div>
                      <div className="text-slate-500 text-[11px]">Kain Sasirangan Kuning Kunyit sisa 6 unit di Gudang Banjarmasin.</div>
                    </div>
                    <div className="py-2.5">
                      <div className="font-semibold text-amber-700">Pembayaran Sebagian Masuk</div>
                      <div className="text-slate-500 text-[11px]">Rp 600.000 dari Drs. H. Syahrani (ORD-0082).</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {currentUserName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{currentUserName}</div>
                <button type="button" onClick={onLogout} className="text-[10px] text-slate-400 font-medium hover:text-rose-600">Keluar dari sesi</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar — tinggi baris dikunci (min-h-0) supaya
          sidebar setinggi viewport dan <main> scroll sendiri di dalamnya. */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside 
          className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 bg-[#0F172A] text-slate-300 transform transition-transform duration-200 ease-in-out lg:static lg:inset-auto flex flex-col ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-0 lg:translate-x-0'
          } ${isSidebarOpen ? 'block' : 'hidden lg:flex'}`}
        >
          {/* Mobile Sidebar Close Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
            <div className="font-bold text-white text-sm">Navigasi PasarPian</div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navItems.map((group, groupIdx) => {
              // Filter items allowed for activeRole
              const allowedItems = group.items.filter((item) => item.roles.includes(activeRole));
              if (allowedItems.length === 0) return null;

              return (
                <div key={groupIdx}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    {group.group}
                  </div>
                  <nav className="space-y-0.5">
                    {allowedItems.map((item) => {
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-[#1E293B] text-white shadow-xs border-l-3 border-[#0D7A70]'
                              : 'text-slate-300 hover:bg-[#1E293B]/60 hover:text-white border-l-3 border-transparent'
                          }`}
                        >
                          <span className={isActive ? 'text-[#14B8A6]' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>

          {/* Banua Branding Footer */}
          <div className="p-3.5 border-t border-slate-800 bg-[#090D16]">
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Identitas Lokal Banua</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                PasarPian dirancang orisinal gasan kenyamanan operasional Urang Banua.
              </p>
            </div>
          </div>
        </aside>

        {/* Workspace Content Area — satu-satunya daerah yang scroll (min-h-0
            supaya flex item boleh lebih kecil dari kontennya dan scroll aktif). */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAF9] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectOrder={onSelectOrder}
        onNavigateTab={onSelectTab}
      />
    </div>
  );
};
