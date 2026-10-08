import React, { useMemo, useState } from 'react';
import { ChevronDown, PackageOpen, PackageSearch, Search } from 'lucide-react';
import { Button } from '../components/common/Button';
import { FilterTabs } from '../components/common/FilterTabs';
import { formatRupiah } from '../utils/dashboardInsights';
import type { InventoryItem } from '../types';

/**
 * Halaman Katalog Produk, Varian & SKU — spesifikasi: PRD #13 dan DESIGN IA §4.3.
 *
 * Apa ini? Daftar produk yang dikelompokkan per produk, tiap produk bisa dibuka
 * untuk melihat varian, SKU, harga, dan stoknya.
 * Untuk apa? SALES/MARKETING memastikan barang yang dijanjikan ke pelanggan benar
 * ada dan harganya benar; OPERATIONS/WAREHOUSE memeriksa kode SKU yang benar
 * sebelum picking (DESIGN §3).
 * Kenapa ada? PRD #13 mewajibkan struktur Produk → Varian → SKU; menampilkan
 * baris gudang mentah membuat satu produk pecah menjadi kartu ganda yang
 * membingungkan pengguna non-teknis.
 *
 * Sumber data hari ini = stok inventaris (satu-satunya data produk yang ada);
 * saat API produk tersedia, ganti props dengan endpoint master produk + varian
 * (SCHEMA #9–#10) tanpa mengubah tampilan.
 */
interface CatalogPageProps {
  /** Baris stok dari App — dikelompokkan per nama produk di sini. */
  inventory: InventoryItem[];
  /** Pindah tab sidebar — dipakai drill-down "Lihat stok di gudang" (DESIGN §5.3-D.5). */
  onNavigateTab?: (tab: string) => void;
}

/**
 * Satu produk beserta seluruh variannya.
 * Apa ini? Hasil pengelompokan baris inventaris per nama produk.
 * Untuk apa? Dirender sebagai satu kartu katalog yang bisa dibuka-tutup.
 */
interface ProductGroup {
  /** Nama produk — kunci pengelompokan (sama persis antar barisnya). */
  productName: string;
  /** Kategori diambil dari baris pertama; satu produk diasumsikan satu kategori. */
  category: string;
  /** Seluruh baris varian produk ini. */
  variants: InventoryItem[];
  /** Jumlah SKU = jumlah varian. */
  skuCount: number;
  /** Total unit tersedia lintas gudang. */
  totalAvailable: number;
  /** Harga jual terendah antar varian — awal rentang harga kartu. */
  priceMin: number;
  /** Harga jual tertinggi antar varian — akhir rentang harga kartu. */
  priceMax: number;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ inventory, onNavigateTab }: CatalogPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  // Nama produk yang sedang dibuka variannya; null berarti semua kartu tertutup.
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Kelompokkan baris inventaris menjadi produk (PRD #13: satu produk, banyak varian).
  const products: ProductGroup[] = useMemo(() => {
    const byName = new Map<string, InventoryItem[]>();
    inventory.forEach((item) => {
      const group = byName.get(item.productName) ?? [];
      group.push(item);
      byName.set(item.productName, group);
    });
    return Array.from(byName.entries())
      .map(([productName, variants]) => ({
        productName,
        category: variants[0].category,
        variants,
        skuCount: variants.length,
        totalAvailable: variants.reduce((sum, variant) => sum + variant.availableStock, 0),
        priceMin: Math.min(...variants.map((variant) => variant.unitPrice)),
        priceMax: Math.max(...variants.map((variant) => variant.unitPrice)),
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName, 'id'));
  }, [inventory]);

  // Kategori diturunkan dari data (SCHEMA #8) — kategori baru otomatis muncul tanpa edit kode.
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b, 'id')),
    [products],
  );

  /** Jumlah produk per kategori — ditampilkan pada chip seperti tab pesanan. */
  const countForCategory = (category: string) =>
    category === 'ALL' ? products.length : products.filter((product) => product.category === category).length;

  // Filter: kategori + pencarian nama produk / varian / SKU.
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return false;
      if (!query) return true;
      return (
        product.productName.toLowerCase().includes(query) ||
        product.variants.some(
          (variant) =>
            variant.variant.toLowerCase().includes(query) || variant.sku.toLowerCase().includes(query),
        )
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const totalSkus = filteredProducts.reduce((sum, product) => sum + product.skuCount, 0);

  /** Mengembalikan saringan ke awal — dipakai tombol reset empty state dan bar saringan. */
  const resetFilters = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setExpandedProduct(null);
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman: judul + penjelasan pengelompokan produk */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <PackageSearch className="h-4 w-4" aria-hidden="true" /> Katalog
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Katalog Produk, Varian & SKU</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Dikelompokkan per produk — buka satu produk untuk melihat varian, SKU, harga resmi,
            dan stoknya. Rincian stok per gudang ada di halaman Inventaris.
          </p>
        </div>
        {onNavigateTab && (
          <Button variant="secondary" size="sm" className="neu-raised shrink-0" onClick={() => onNavigateTab('inventory')}>
            Lihat stok di gudang
          </Button>
        )}
      </header>

      {/* Saringan kategori: chip dari data + pencarian */}
      <section className="glass rounded-2xl p-5" aria-label="Saringan katalog">
        <FilterTabs
          options={['ALL', ...categories].map((category) => ({
            id: category,
            label: category === 'ALL' ? 'Semua Kategori' : category,
            count: countForCategory(category),
          }))}
          activeId={selectedCategory}
          onChange={(category) => {
            setSelectedCategory(category);
            setExpandedProduct(null);
          }}
          ariaLabel="Filter kategori produk"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search" className="sr-only">
              Cari produk, varian, atau SKU
            </label>
            <input
              id="catalog-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari produk, varian, atau SKU..."
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
          <p className="text-xs text-slate-500" aria-live="polite">
            <strong className="font-mono-numbers text-slate-800">{filteredProducts.length}</strong> produk ·{' '}
            <span className="font-mono-numbers">{totalSkus}</span> SKU ditemukan
          </p>
        </div>
      </section>

      {/* Daftar produk — empty state dibedakan: belum ada data vs saringan ketat (DESIGN §11) */}
      {filteredProducts.length === 0 ? (
        inventory.length === 0 ? (
          <div className="glass rounded-2xl px-5 py-16 text-center">
            <PackageOpen className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <div className="mt-3 font-semibold text-slate-700">Belum ada produk terdaftar di katalog</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              Produk baru akan muncul di sini begitu didaftarkan ke master produk.
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl px-5 py-16 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <div className="mt-3 font-semibold text-slate-700">Tidak ada produk yang cocok</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              Saringan terlalu ketat, bukan kesalahan sistem. Longgarkan kata kunci atau reset saringan.
            </p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
              Reset semua saringan
            </Button>
          </div>
        )
      ) : (
        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {/* Masonry kolom (cara standar katalog website besar): tiap kartu hanya setinggi
              isinya sendiri. Grid biasa memaksa satu baris sama tinggi sehingga kartu yang
              tertutup ikut melar saat tetangganya dibuka. Konsekuensi yang disadari: urutan
              visual menjadi per-kolom (atas→bawah), sedangkan urutan DOM/keyboard tetap
              alfabetis produk — tab tetap mengikuti urutan nama yang logis. */}
          {filteredProducts.map((product) => {
            const isExpanded = expandedProduct === product.productName;
            return (
              <article
                key={product.productName}
                className="glass mb-4 flex w-full flex-col rounded-2xl p-5 break-inside-avoid"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0D7A70]">
                    {product.category}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono-numbers text-[10px] font-semibold text-slate-600">
                    {product.skuCount} SKU
                  </span>
                </div>

                <h2 className="mt-2 text-base font-bold leading-snug text-slate-900">{product.productName}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {product.skuCount} varian · Total tersedia{' '}
                  <strong className="font-mono-numbers text-slate-800">{product.totalAvailable}</strong> unit
                </p>

                <div className="mt-3 border-t border-white/70 pt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Harga jual</span>
                  <div className="font-mono-numbers text-lg font-bold text-slate-900">
                    {product.priceMin === product.priceMax
                      ? formatRupiah(product.priceMin)
                      : `${formatRupiah(product.priceMin)} – ${formatRupiah(product.priceMax)}`}
                  </div>
                </div>

                {/* Varian dibuka-tutup (progressive disclosure): ringkasan dulu, rincian setelah dipilih */}
                {isExpanded && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th scope="col" className="px-3 py-2.5">Varian & SKU</th>
                          <th scope="col" className="px-3 py-2.5 text-right">Harga</th>
                          <th scope="col" className="px-3 py-2.5 text-right">Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {product.variants.map((variant) => (
                          <tr key={variant.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">
                              <div className="text-[13px] font-semibold leading-5 text-slate-800">{variant.variant}</div>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                                {variant.sku}
                              </span>
                              <div className="mt-1 text-[11px] text-slate-400">
                                HPP <span className="font-mono-numbers">{formatRupiah(variant.costPrice)}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono-numbers font-bold text-slate-900">
                              {formatRupiah(variant.unitPrice)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                              <span className="font-mono-numbers font-semibold text-slate-900">
                                {variant.availableStock}
                              </span>
                              {variant.availableStock <= 0 ? (
                                <div className="text-[11px] font-semibold text-rose-600">Habis</div>
                              ) : variant.availableStock <= variant.minThreshold ? (
                                <div className="text-[11px] font-semibold text-amber-700">Menipis</div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedProduct(isExpanded ? null : product.productName)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Tutup' : 'Buka'} varian ${product.productName}`}
                  className="neu-raised mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#0D7A70] transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0D7A70] focus:ring-offset-2"
                >
                  {isExpanded ? 'Tutup varian' : `Lihat ${product.skuCount} varian`}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Helper istilah (AGENTS #31): SKU dan HPP dijelaskan sekali di sini, bukan di tiap kartu */}
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-slate-500">
        <span>
          <strong className="font-semibold text-slate-700">SKU</strong>: kode unik tiap varian, dipakai memastikan
          barang yang diambil gudang tidak salah.
        </span>
        <span>
          <strong className="font-semibold text-slate-700">HPP</strong>: harga pokok (modal) per unit sebelum dijual.
        </span>
      </p>
    </div>
  );
};
