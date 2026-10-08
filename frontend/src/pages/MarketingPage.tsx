import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  CheckCircle2,
  Image,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Search,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import { channelMeta } from '../utils/orderDisplay';
import {
  CAMPAIGN_FILTER_OPTIONS,
  campaignPeriodProgress,
  campaignStatusLabels,
} from '../utils/marketingDisplay';
import type { CampaignFilter } from '../utils/marketingDisplay';
import { formatRupiah } from '../utils/dashboardInsights';
import type { Campaign } from '../types';

/**
 * Halaman Kampanye & Banner Promosi — spesifikasi: Agents/DESIGN.md §8.5.
 *
 * Apa ini? Daftar kampanye + pratinjau banner per rasio + aksi status.
 * Untuk apa? MARKETING mengatur periode, saluran, dan tampilan promosi;
 * MANAGEMENT memantau anggaran dan jangkauan (DESIGN §3).
 * Kenapa ada? Banner yang salah periode/saluran = promosi tidak terlihat
 * pelanggan — halaman ini memaksa periode, saluran, dan visual diperiksa
 * sebelum dan selama tayang.
 *
 * State kampanye milik App (bukan halaman) supaya perubahan status ikut
 * terlihat di dashboard Fokus MARKETING; guard transisi + audit di App.
 */
interface MarketingPageProps {
  /** Kampanye dari App (state — perubahan status langsung tercermin). */
  campaigns: Campaign[];
  /** Mengubah status kampanye mengikuti transisi sah; guard + audit di App. */
  onChangeStatus: (campaignId: string, next: Campaign['status']) => void;
  /** Pindah tab sidebar — dipakai CTA pratinjau menuju Katalog (DESIGN §8.5). */
  onNavigateTab: (tab: string) => void;
}

/** Rasio banner standar DESIGN §8.5: hero 4:1, kartu kanal 16:9, widget 1:1. */
type BannerRatio = 'HERO' | 'CARD' | 'WIDGET';

/** Gaya badge status kampanye: ikon + tulisan (AGENTS #19). */
const statusStyles: Record<Campaign['status'], { chip: string; icon: React.ReactNode }> = {
  ACTIVE: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  DRAFT: {
    chip: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: <Image className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  PAUSED: {
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  COMPLETED: {
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

const bannerRatios: { id: BannerRatio; label: string; ratio: string; size: string; boxClass: string; textClass: string }[] = [
  { id: 'HERO', label: 'Spanduk utama', ratio: '4:1', size: '1200×300 (mobile 600×200)', boxClass: 'aspect-[4/1]', textClass: 'text-sm sm:text-base' },
  { id: 'CARD', label: 'Kartu promo kanal', ratio: '16:9', size: '800×450', boxClass: 'aspect-video', textClass: 'text-base sm:text-lg' },
  { id: 'WIDGET', label: 'Widget promo ringkas', ratio: '1:1', size: '300×300', boxClass: 'aspect-square', textClass: 'text-base' },
];

export const MarketingPage: React.FC<MarketingPageProps> = ({ campaigns, onChangeStatus, onNavigateTab }) => {
  const [selectedStatus, setSelectedStatus] = useState<CampaignFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(campaigns[0]?.id ?? null);
  const [bannerRatio, setBannerRatio] = useState<BannerRatio>('HERO');
  const [notice, setNotice] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((item) => {
        if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
        if (!query) return true;
        return [item.name, item.bannerHeadline, ...item.channels.map((channel) => channelMeta[channel].label)].some(
          (value) => value.toLowerCase().includes(query),
        );
      }),
    [campaigns, query, selectedStatus],
  );

  const countFor = (status: CampaignFilter) =>
    status === 'ALL' ? campaigns.length : campaigns.filter((item) => item.status === status).length;

  const activeCount = countFor('ACTIVE');
  const totalBudget = campaigns.reduce((sum, item) => sum + item.budgetAllocated, 0);
  const totalProducts = campaigns.reduce((sum, item) => sum + item.productsCount, 0);

  const selected = campaigns.find((item) => item.id === selectedId) ?? null;
  const selectedRatio = bannerRatios.find((item) => item.id === bannerRatio) ?? bannerRatios[0];

  /** Tombol aksi per status — hanya transisi sah yang dirender (AGENTS #15). */
  const actionsFor = (campaign: Campaign): { next: Campaign['status']; label: string; icon: React.ReactNode; primary: boolean }[] => {
    switch (campaign.status) {
      case 'DRAFT':
        return [{ next: 'ACTIVE', label: 'Aktifkan kampanye', icon: <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />, primary: true }];
      case 'ACTIVE':
        return [
          { next: 'PAUSED', label: 'Jeda kampanye', icon: <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />, primary: false },
          { next: 'COMPLETED', label: 'Selesaikan', icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />, primary: true },
        ];
      case 'PAUSED':
        return [
          { next: 'ACTIVE', label: 'Lanjutkan kampanye', icon: <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />, primary: true },
          { next: 'COMPLETED', label: 'Selesaikan', icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />, primary: false },
        ];
      default:
        return [];
    }
  };

  /** Mengubah status lalu menampilkan hasilnya (AGENTS #14: hasil aksi harus jelas). */
  const changeStatus = (campaign: Campaign, next: Campaign['status']) => {
    onChangeStatus(campaign.id, next);
    setNotice(`Status "${campaign.name}" diubah menjadi ${campaignStatusLabels[next]}.`);
  };

  /** Mengembalikan saringan ke awal — dipakai empty state. */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <Megaphone className="h-4 w-4" aria-hidden="true" /> Pemasaran
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kampanye & banner promosi</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Atur periode kampanye, saluran penjualan, dan tampilan banner promosinya.
            Pilih satu kampanye untuk melihat pratinjau banner dan mengubah statusnya.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="neu-raised shrink-0"
          onClick={() => alert('Fitur ekspor CSV segera hadir — data yang tampil masih contoh.')}
        >
          Ekspor data
        </Button>
      </header>

      {/* Ringkasan: kartu menuju saringannya (DESIGN §5.3-D.5) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan pemasaran">
        <StatCard
          title="Kampanye aktif"
          value={`${activeCount} kampanye`}
          icon={<Megaphone className="h-5 w-5" aria-hidden="true" />}
          trendText="Sedang tayang di saluran penjualan"
          trendDirection="neutral"
          exceptionTag={activeCount === 0 ? 'Tidak ada yang tayang' : undefined}
          exceptionType="warning"
          onClick={() => setSelectedStatus('ACTIVE')}
        />
        <StatCard
          title="Total anggaran"
          value={formatRupiah(totalBudget)}
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          trendText="Seluruh kampanye yang terdaftar"
          trendDirection="neutral"
        />
        <StatCard
          title="Produk dipromosikan"
          value={`${totalProducts} produk`}
          icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
          trendText="Jumlah produk dalam seluruh kampanye"
          trendDirection="neutral"
          onClick={() => onNavigateTab('catalog')}
        />
      </section>

      {/* Ruang kerja kampanye: daftar, detail terpilih, dan banner dalam satu workspace */}
      <section className="glass rounded-2xl p-5" aria-labelledby="campaign-workspace-title">
        <div className="border-b border-white/70 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            Ruang kerja kampanye
          </p>
          <h2 id="campaign-workspace-title" className="mt-1 text-base font-semibold text-slate-900">
            Daftar dan detail kampanye
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredCampaigns.length} dari {campaigns.length} kampanye ditampilkan
            {selected ? ` · Terpilih: ${selected.name}` : ' · Pilih satu kampanye untuk melihat detail dan bannernya'}.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        {/* Daftar kampanye */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 sm:p-5" aria-labelledby="campaign-list-title">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 id="campaign-list-title" className="text-base font-semibold text-slate-900">
                Daftar kampanye
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Nama, periode aktif, saluran target, dan status kampanye.
              </p>
            </div>
            <div className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="campaign-search" className="sr-only">
                Cari kampanye
              </label>
              <input
                id="campaign-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama kampanye atau saluran..."
                className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
              />
            </div>
          </div>

          <div className="mt-5">
            <FilterTabs
              options={CAMPAIGN_FILTER_OPTIONS.map((option) => ({ ...option, count: countFor(option.id) }))}
              activeId={selectedStatus}
              onChange={setSelectedStatus}
              ariaLabel="Filter status kampanye"
            />
          </div>

          <div className="mt-5 space-y-3" aria-live="polite">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => {
                const style = statusStyles[campaign.status];
                const isActive = selected?.id === campaign.id;
                // Progres hanya bermakna selama periode berjalan (aktif/dijeda).
                const progress =
                  campaign.status === 'ACTIVE' || campaign.status === 'PAUSED'
                    ? campaignPeriodProgress(campaign.startDate, campaign.endDate)
                    : null;
                return (
                  <button
                    type="button"
                    key={campaign.id}
                    onClick={() => {
                      setSelectedId(campaign.id);
                      setNotice(null);
                    }}
                    aria-pressed={isActive}
                    aria-label={`Pilih kampanye ${campaign.name}, ${campaignStatusLabels[campaign.status]}`}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7A70] ${
                      isActive
                        ? 'neu-pressed border-teal-300 bg-teal-50/60'
                        : 'border-slate-200 bg-white/85 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">{campaign.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 font-mono-numbers text-xs text-slate-500">
                          <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" /> {campaign.startDate} → {campaign.endDate}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}
                      >
                        {style.icon}
                        {campaignStatusLabels[campaign.status]}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {campaign.channels.map((channel) => (
                        <span
                          key={channel}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                        >
                          {channelMeta[channel].label}
                        </span>
                      ))}
                    </div>

                    {progress && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Periode berjalan</span>
                          <span className="font-mono-numbers">
                            {progress.percent}% · {progress.note}
                          </span>
                        </div>
                        <div
                          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                          role="img"
                          aria-label={`Periode berjalan ${progress.percent} persen, ${progress.note}`}
                        >
                          <div
                            className={`h-full rounded-full ${campaign.status === 'PAUSED' ? 'bg-amber-400' : 'bg-[#0D7A70]'}`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>
                        <strong className="font-mono-numbers text-slate-800">{campaign.productsCount}</strong> produk
                        dipromosikan
                      </span>
                      <span className="font-mono-numbers font-semibold text-slate-800">
                        {formatRupiah(campaign.budgetAllocated)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : campaigns.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
                <Megaphone className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Belum ada kampanye terdaftar</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Kampanye baru akan muncul di sini begitu didaftarkan.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-700">Kampanye tidak ditemukan</h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Coba ubah kata kunci atau pilih status lain.
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                  Reset semua filter
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Detail + pratinjau banner */}
        {selected ? (
          <aside className="space-y-5" aria-label="Detail kampanye dan pratinjau banner">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Kampanye terpilih
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-6 text-slate-900">{selected.name}</h3>
                  <p className="mt-1 font-mono-numbers text-xs text-slate-500">
                    {selected.startDate} → {selected.endDate}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[selected.status].chip}`}
                >
                  {statusStyles[selected.status].icon}
                  {campaignStatusLabels[selected.status]}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <dt className="text-slate-400">Saluran target</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {selected.channels.map((channel) => channelMeta[channel].label).join(', ')}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <dt className="text-slate-400">Produk kampanye</dt>
                  <dd className="mt-1 font-mono-numbers font-semibold text-slate-800">
                    {selected.productsCount} produk
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <dt className="text-slate-400">Anggaran</dt>
                  <dd className="mt-1 font-mono-numbers font-semibold text-slate-800">
                    {formatRupiah(selected.budgetAllocated)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {campaignStatusLabels[selected.status]}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-white/70 pt-4">
                {actionsFor(selected).length > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-slate-700">Tindakan status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {actionsFor(selected).map((action) => (
                        <Button
                          key={action.next}
                          size="sm"
                          variant={action.primary ? 'primary' : 'secondary'}
                          leftIcon={action.icon}
                          onClick={() => changeStatus(selected, action.next)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] leading-4 text-slate-500">
                    Kampanye sudah selesai dan tidak memiliki tindakan status lain.
                  </p>
                )}
                {notice && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                  >
                    {notice}
                  </p>
                )}
              </div>
            </div>

            {/* Pratinjau banner (DESIGN §8.5): headline + periode + CTA per rasio */}
            <div className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Banner kampanye ini</h3>
                  <p className="mt-1 text-xs text-slate-500">{selected.name} · pilih rasio sesuai tempat banner dipasang.</p>
                </div>
                <FilterTabs
                  options={bannerRatios.map((option) => ({ id: option.id, label: option.ratio }))}
                  activeId={bannerRatio}
                  onChange={setBannerRatio}
                  ariaLabel="Pilih rasio banner"
                />
              </div>

              <div
                className={`mt-4 w-full overflow-hidden rounded-xl bg-[linear-gradient(115deg,#0D7A70_0%,#0A625A_55%,#B45309_100%)] shadow-sm ${selectedRatio.boxClass}`}
                role="img"
                aria-label={`Pratinjau banner ${selectedRatio.label}: ${selected.bannerHeadline}`}
              >
                <div className="flex h-full flex-col justify-center gap-1.5 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.07)_0_12px,transparent_12px_24px)] p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    Promo Urang Banua
                  </p>
                  <p className={`font-bold leading-tight text-white ${selectedRatio.textClass}`}>
                    {selected.bannerHeadline}
                  </p>
                  <p className="line-clamp-2 text-[11px] leading-4 text-white/90 sm:text-xs">
                    {selected.bannerSubtext}
                  </p>
                  <p className="text-[10px] font-medium text-white/85">
                    Periode {selected.startDate} – {selected.endDate} · berlaku selama periode berjalan
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('catalog')}
                    className="mt-1 w-fit rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0A625A] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    Lihat Produk Kampanye
                  </button>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                Rasio {selectedRatio.ratio} · {selectedRatio.label} · {selectedRatio.size} piksel
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Susunan konten banner
                </p>
                <ol className="mt-2 list-none space-y-1.5 text-[11px] leading-4 text-slate-600">
                  <li><span className="font-semibold text-slate-800">1. Headline khas Banua</span> — sapaan lokal yang mudah diingat.</li>
                  <li><span className="font-semibold text-slate-800">2. Periode &amp; syarat</span> — teks sekunder dengan kontras minimal 4,5:1.</li>
                  <li><span className="font-semibold text-slate-800">3. Visual orisinal</span> — motif sasirangan atau foto produk sendiri, bukan stok generik.</li>
                  <li><span className="font-semibold text-slate-800">4. Satu tombol aksi (CTA)</span> — satu tujuan, misalnya “Lihat Produk Kampanye”.</li>
                </ol>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="rounded-xl border border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
            Pilih satu kampanye untuk melihat pratinjau banner.
          </aside>
        )}
        </div>
      </section>
    </div>
  );
};
