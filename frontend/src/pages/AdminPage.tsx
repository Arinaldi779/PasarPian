import React, { useMemo, useState } from 'react';
import {
  Ban,
  Check,
  History,
  KeyRound,
  Minus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { FilterTabs } from '../components/common/FilterTabs';
import { navItems } from '../layouts/AppLayout';
import { ROLE_LABELS } from '../utils/dashboardInsights';
import { auditActionLabels, permissionCodes, roleShortLabels, userStatusLabels, userStatusTransitions } from '../utils/adminDisplay';
import type { AuditLog, UserAccount, UserRole, UserStatus } from '../types';

/**
 * Halaman Administrasi & Jejak Audit — spesifikasi: DESIGN §3 (ADMIN) + IA §4.10.
 *
 * Apa ini? Tiga tampilan: akun internal, matriks peran×menu, dan jejak audit.
 * Untuk apa? ADMIN menjaga siapa boleh masuk (status akun), siapa boleh buka apa
 * (matriks izin), dan siapa mengubah apa (audit: siapa, kapan, entitas apa,
 * nilai lama vs baru).
 * Kenapa ada? Tanpa layar ini, perubahan akses dan data terjadi tanpa saksi —
 * keamanan dan auditability (AGENTS #9, #21) tidak bisa dibuktikan.
 *
 * State akun milik App (dipakai dashboard Fokus ADMIN juga); guard transisi +
 * audit di App. Matriks dibaca dari navItems sidebar — sumber kebenaran tunggal
 * sehingga yang tampil di sini selalu sama dengan menu yang dirender (#16).
 */
interface AdminPageProps {
  /** Akun internal dari App (state — perubahan status langsung tercermin). */
  users: UserAccount[];
  /** Jejak audit dari App (state — aksi semua halaman mengalir ke sini). */
  auditLogs: AuditLog[];
  /** Mengubah status akun; guard + audit ditangani App. */
  onChangeUserStatus: (userId: string, next: UserStatus) => void;
}

/** Tiga tampilan halaman: pengguna, matriks peran, jejak audit. */
type AdminTab = 'USERS' | 'ROLES' | 'AUDIT';

/** Opsi tab tampilan — ikon di sini karena tab berikon (didukung FilterTabs). */
const ADMIN_TAB_OPTIONS: { id: AdminTab; label: string }[] = [
  { id: 'USERS', label: 'Pengguna internal' },
  { id: 'ROLES', label: 'Peran & izin' },
  { id: 'AUDIT', label: 'Jejak audit' },
];

/** Ikon tab tampilan (terpisah dari label agar opsi tetap data murni). */
const adminTabIcons: Record<AdminTab, React.ReactNode> = {
  USERS: <Users className="h-4 w-4" aria-hidden="true" />,
  ROLES: <KeyRound className="h-4 w-4" aria-hidden="true" />,
  AUDIT: <History className="h-4 w-4" aria-hidden="true" />,
};

/** Seluruh menu sidebar (diratakan dari grup) + daftar peran sesuai SCHEMA. */
const allModules = navItems.flatMap((group) => group.items);
const allRoles: UserRole[] = ['MANAGEMENT', 'OPERATIONS', 'WAREHOUSE', 'SALES', 'FINANCE', 'MARKETING', 'ADMIN'];

/** Gaya badge status akun: ikon + tulisan (AGENTS #19). */
const userStatusStyles: Record<UserStatus, { chip: string; icon: React.ReactNode }> = {
  ACTIVE: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  INACTIVE: {
    chip: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: <Minus className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  SUSPENDED: {
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <Ban className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

/** Gaya badge jenis aksi audit (label dari util bersama). */
const auditActionStyles: Record<AuditLog['action'], string> = {
  CREATE: 'border-teal-200 bg-teal-50 text-teal-800',
  UPDATE: 'border-slate-200 bg-slate-100 text-slate-600',
  DELETE: 'border-rose-200 bg-rose-50 text-rose-800',
  STATUS_CHANGE: 'border-sky-200 bg-sky-50 text-sky-800',
  PAYMENT: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ADJUSTMENT: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const AdminPage: React.FC<AdminPageProps> = ({ users, auditLogs, onChangeUserStatus }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('USERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditLog['action'] | 'ALL'>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          !query ||
          [user.name, user.email, ROLE_LABELS[user.role], userStatusLabels[user.status]].some((value) =>
            value.toLowerCase().includes(query),
          ),
      ),
    [query, users],
  );

  const presentActions = useMemo(() => Array.from(new Set(auditLogs.map((log) => log.action))), [auditLogs]);
  // Opsi saringan aksi diturunkan dari data — jenis aksi baru otomatis jadi tab.
  const auditFilterOptions: { id: AuditLog['action'] | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Semua aksi' },
    ...presentActions.map((action) => ({ id: action, label: auditActionLabels[action] })),
  ];
  const filteredLogs = useMemo(
    () =>
      auditLogs.filter((log) => {
        if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
        if (!query) return true;
        return [log.actor, log.entity, log.entityId, log.oldValue, log.newValue, ROLE_LABELS[log.role]].some(
          (value) => value.toLowerCase().includes(query),
        );
      }),
    [actionFilter, auditLogs, query],
  );

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const attentionUsers = users.filter((user) => user.status !== 'ACTIVE').length;

  const countForAction = (action: AuditLog['action'] | 'ALL') =>
    action === 'ALL' ? auditLogs.length : auditLogs.filter((log) => log.action === action).length;

  /** Mengubah status lalu menampilkan hasilnya (hasil aksi harus jelas, AGENTS #14). */
  const changeStatus = (user: UserAccount, next: UserStatus) => {
    onChangeUserStatus(user.id, next);
    setNotice(`Status akun ${user.name} diubah menjadi ${userStatusLabels[next]}. Jejak audit dicatat otomatis.`);
  };

  /** Mengembalikan saringan ke awal — dipakai empty state. */
  const resetFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
  };

  return (
    <div className="page-backdrop space-y-6 p-3 sm:p-5">
      {/* Kepala halaman */}
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A70]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Sistem & kontrol
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administrasi & jejak audit</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Kelola siapa boleh masuk, siapa boleh buka apa, dan telusuri siapa mengubah apa. Setiap
            perubahan status akun otomatis tercatat sebagai bukti di jejak audit.
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

      {/* Ringkasan */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Ringkasan administrasi">
        <StatCard
          title="Total pengguna"
          value={`${users.length} akun`}
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          trendText="Akun internal terdaftar"
          trendDirection="neutral"
          onClick={() => setActiveTab('USERS')}
        />
        <StatCard
          title="Akun aktif"
          value={`${activeUsers} akun`}
          icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
          trendText="Dapat login dan bekerja"
          trendDirection="neutral"
          onClick={() => setActiveTab('USERS')}
        />
        <StatCard
          title="Perlu perhatian"
          value={`${attentionUsers} akun`}
          icon={<Ban className="h-5 w-5" aria-hidden="true" />}
          trendText="Akun nonaktif atau ditangguhkan"
          trendDirection="neutral"
          exceptionTag={attentionUsers > 0 ? 'Periksa akun' : undefined}
          exceptionType="warning"
          onClick={() => setActiveTab('USERS')}
        />
        <StatCard
          title="Jejak audit"
          value={`${auditLogs.length} catatan`}
          icon={<History className="h-5 w-5" aria-hidden="true" />}
          trendText="Perubahan data yang tercatat"
          trendDirection="neutral"
          onClick={() => setActiveTab('AUDIT')}
        />
      </section>

      {/* Kontrol akses & pelacakan */}
      <section className="glass rounded-2xl p-5" aria-label="Kontrol akses dan pelacakan">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kontrol akses & pelacakan</h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === 'AUDIT'
                ? 'Bukti operasional yang hanya-baca: siapa, kapan, apa, dan nilai sebelum–sesudah. Tidak dapat diubah dari antarmuka.'
                : activeTab === 'ROLES'
                  ? 'Fokus: menu yang boleh dibuka tiap peran. Matriks hanya-baca; perubahan izin melalui administrator.'
                  : 'Fokus: status akun — siapa boleh masuk. Aksi utama ada di kolom Aksi tabel.'}
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="admin-search" className="sr-only">
              Cari data administrasi
            </label>
            <input
              id="admin-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === 'AUDIT' ? 'Cari pelaku, entitas, atau nilai...' : 'Cari nama, email, atau peran...'}
              className="neu-pressed min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D7A70] focus:ring-2 focus:ring-[#0D7A70]/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <FilterTabs
            options={ADMIN_TAB_OPTIONS.map((option) => ({
              ...option,
              count: option.id === 'USERS' ? users.length : option.id === 'ROLES' ? allModules.length : auditLogs.length,
              icon: adminTabIcons[option.id],
            }))}
            activeId={activeTab}
            onChange={setActiveTab}
            ariaLabel="Tampilan administrasi"
          />
        </div>

        <div className="mt-5">
          {notice && activeTab === 'USERS' && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
            >
              {notice}
            </p>
          )}

          {activeTab === 'USERS' && (
            <div>
              <p className="mb-3 text-xs text-slate-500" aria-live="polite">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredUsers.length}</strong> dari{' '}
                <span className="font-mono-numbers">{users.length}</span> pengguna. Ubah status dari kolom
                Aksi; setiap perubahan tercatat otomatis. Kata sandi tidak pernah ditampilkan di halaman ini.
              </p>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[820px] text-left text-xs">
                    <caption className="sr-only">Daftar akun internal beserta peran, status, dan aksi status</caption>
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-3 py-3">Nama</th>
                        <th scope="col" className="px-3 py-3">Email</th>
                        <th scope="col" className="px-3 py-3">Peran</th>
                        <th scope="col" className="px-3 py-3">Status</th>
                        <th scope="col" className="px-3 py-3">Login terakhir</th>
                        <th scope="col" className="px-3 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-3 py-3 font-semibold text-slate-900">{user.name}</td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono-numbers text-slate-600">{user.email}</td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              {ROLE_LABELS[user.role]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${userStatusStyles[user.status].chip}`}
                            >
                              {userStatusStyles[user.status].icon}
                              {userStatusLabels[user.status]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono-numbers text-slate-500">
                            {user.lastLogin}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center">
                            <UserStatusActions user={user} onChange={changeStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-700">Belum ada akun terdaftar</h3>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                    Akun internal baru akan muncul di sini begitu didaftarkan.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-700">Pengguna tidak ditemukan</h3>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                    Coba ubah kata kunci pencarian.
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSearchQuery('')}>
                    Reset pencarian
                  </Button>
                </div>
              )}
              {users.some((user) => user.status === 'SUSPENDED') && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Pesan yang dilihat pemilik akun yang ditangguhkan:{' '}
                  <strong>“Akun Pian kada aktif atau belum memiliki izin akses. Silakan hubungi Administrator.”</strong>
                </p>
              )}
            </div>
          )}

          {activeTab === 'ROLES' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2" aria-live="polite">
                {allRoles.map((role) => {
                  const menuCount = allModules.filter((module) => module.roles.includes(role)).length;
                  const roleUsers = users.filter((user) => user.role === role).length;
                  return (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1.5 text-[11px] text-slate-600"
                    >
                      <span className="font-semibold text-slate-800">{ROLE_LABELS[role]}</span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="font-mono-numbers">{roleUsers}</span> pengguna
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="font-mono-numbers">{menuCount}/{allModules.length}</span> menu
                    </span>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <caption className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Menu yang dapat dibuka tiap peran — sama seperti yang tampil di bilah sisi
                  </caption>
                  <thead className="border-b border-slate-200 bg-white">
                    <tr>
                      <th scope="col" className="px-3 py-3 font-semibold text-slate-700">Menu</th>
                      {allRoles.map((role) => (
                        <th
                          key={role}
                          scope="col"
                          title={ROLE_LABELS[role]}
                          className="px-2 py-3 text-center text-[11px] font-semibold text-slate-600"
                        >
                          {roleShortLabels[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allModules.map((module) => (
                      <tr key={module.id} className="transition-colors hover:bg-slate-50/70">
                        <th scope="row" className="px-3 py-2.5 font-semibold text-slate-800">{module.label}</th>
                        {allRoles.map((role) => {
                          const allowed = module.roles.includes(role);
                          return (
                            <td key={role} className="px-2 py-2.5 text-center">
                              {allowed ? (
                                <>
                                  <Check className="mx-auto h-4 w-4 text-[#0D7A70]" aria-hidden="true" />
                                  <span className="sr-only">Diizinkan</span>
                                </>
                              ) : (
                                <>
                                  <Minus className="mx-auto h-4 w-4 text-slate-300" aria-hidden="true" />
                                  <span className="sr-only">Tidak diizinkan</span>
                                </>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Kode izin yang dipakai sistem
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {permissionCodes.map((code) => (
                    <code key={code} className="rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-700 shadow-xs">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  Daftar kode izin yang dipakai sistem. Penetapan izin rinci per peran diatur oleh
                  administrator sistem — hubungi administrator bila ada menu yang perlu dibuka atau dibatasi.
                  Matriks di atas adalah acuan yang tampil, sesuai menu di bilah sisi.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'AUDIT' && (
            <div>
              <div className="mb-4">
                <FilterTabs
                  options={auditFilterOptions.map((option) => ({ ...option, count: countForAction(option.id) }))}
                  activeId={actionFilter}
                  onChange={setActionFilter}
                  ariaLabel="Filter jenis aksi audit"
                />
              </div>

              <p className="mb-3 text-xs text-slate-500" aria-live="polite">
                Menampilkan <strong className="font-mono-numbers text-slate-800">{filteredLogs.length}</strong> dari{' '}
                <span className="font-mono-numbers">{auditLogs.length}</span> catatan. Saring berdasarkan
                jenis aksi untuk menelusuri kejadian.
              </p>

              {filteredLogs.length > 0 ? (
                <ol className="space-y-3">
                  {filteredLogs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{log.actor}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {ROLE_LABELS[log.role]}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${auditActionStyles[log.action]}`}
                            >
                              {auditActionLabels[log.action]}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {log.entity} ·{' '}
                            <span className="font-mono-numbers font-semibold text-slate-700">{log.entityId}</span>
                          </p>
                        </div>
                        <span className="shrink-0 font-mono-numbers text-[11px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-[11px] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sebelum</p>
                          <p className="mt-0.5 font-semibold text-slate-700">{log.oldValue}</p>
                        </div>
                        <span className="hidden text-slate-400 sm:block" aria-hidden="true">→</span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sesudah</p>
                          <p className="mt-0.5 font-semibold text-slate-800">{log.newValue}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : auditLogs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/70 px-5 py-14 text-center">
                  <History className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-700">Belum ada jejak audit</h3>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                    Perubahan status, pembayaran, dan penyesuaian akan tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-700">Belum ada catatan yang cocok</h3>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                    Ubah kata kunci atau pilih aksi lain.
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                    Reset filter
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/**
 * Tombol aksi status akun: hanya transisi sah dari status saat ini yang dirender.
 * Daftar tombol dibaca dari peta transisi bersama (sumber yang sama dengan guard App),
 * sedangkan ikon dan warna tombol adalah urusan tampilan halaman ini.
 */
const UserStatusActions: React.FC<{
  user: UserAccount;
  onChange: (user: UserAccount, next: UserStatus) => void;
}> = ({ user, onChange }) => {
  // Ikon + varian per tujuan: menangguhkan (merah, memutus akses) dibedakan
  // dari menonaktifkan (abu, arsip biasa) dan mengaktifkan (teal, memulihkan).
  const presentation: Record<UserStatus, { icon: React.ReactNode; variant: 'primary' | 'secondary' | 'destructive' }> = {
    ACTIVE: { icon: <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />, variant: 'primary' },
    INACTIVE: { icon: <UserX className="h-3.5 w-3.5" aria-hidden="true" />, variant: 'secondary' },
    SUSPENDED: { icon: <Ban className="h-3.5 w-3.5" aria-hidden="true" />, variant: 'destructive' },
  };
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {userStatusTransitions[user.status].map((transition) => {
        const style = presentation[transition.next];
        return (
          <Button
            key={transition.next}
            size="sm"
            variant={style.variant}
            leftIcon={style.icon}
            onClick={() => onChange(user, transition.next)}
          >
            {transition.label}
          </Button>
        );
      })}
    </div>
  );
};
