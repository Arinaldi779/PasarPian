import { useEffect, useState } from 'react'
import type { AppTheme } from './components/common/ThemeSwitcher'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { InventoryPage } from './pages/InventoryPage'
import { CatalogPage } from './pages/CatalogPage'
import { FulfillmentPage } from './pages/FulfillmentPage'
import { ShippingPage } from './pages/ShippingPage'
import { FinancePage } from './pages/FinancePage'
import { ReturnsPage } from './pages/ReturnsPage'
import { MarketingPage } from './pages/MarketingPage'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { OrderDetailModal } from './components/orders/OrderDetailModal'
import { mockAuditLogs, mockCampaigns, mockFulfillments, mockInventory, mockMovements, mockOrders, mockPayments, mockReturns, mockShipments, mockUsers } from './data/mockData'
import type { AuditLog, Campaign, Fulfillment, FulfillmentStatus, InventoryItem, Order, OrderStatus, PaymentRecord, RecordPaymentInput, ReturnRequest, StockMovement, UserAccount, UserRole, UserStatus } from './types'
import type { OrderFilter } from './utils/orderDisplay'
import type { ReturnStatus } from './utils/returnDisplay'
import { userStatusLabels, userStatusTransitions } from './utils/adminDisplay'
import { nowTimestamp } from './utils/inventoryDisplay'
import { formatRupiah } from './utils/dashboardInsights'
import './App.css'

const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
}

/**
 * Transisi sah tahap gudang (DESIGN §7.2): ambil → kemas → siap kirim.
 * READY_TO_SHIP terminal di halaman ini; penyerahan ke kurir dicatat sebagai
 * pesanan SHIPPED di halaman Pesanan (nomor resi terbit di sana).
 */
const fulfillmentTransitions: Record<FulfillmentStatus, FulfillmentStatus | null> = {
  READY_TO_PICK: 'PICKING',
  PICKING: 'PACKING',
  PACKING: 'READY_TO_SHIP',
  READY_TO_SHIP: null,
}

/**
 * Transisi sah pengajuan retur: menunggu → disetujui/ditolak → selesai.
 * REJECTED dan COMPLETED terminal (tidak bisa berubah lagi).
 */
const returnTransitions: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
  PENDING_INSPECTION: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
}

/**
 * Transisi sah status kampanye: draf → tayang; tayang ⇄ jeda; tayang/jeda → selesai.
 * COMPLETED terminal (kampanye selesai tidak dibuka lagi).
 */
const campaignTransitions: Partial<Record<Campaign['status'], Campaign['status'][]>> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'COMPLETED'],
  PAUSED: ['ACTIVE', 'COMPLETED'],
}

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [activeRole, setActiveRole] = useState<UserRole>('MANAGEMENT')
  // Tema tampilan (Terang/Gelap/Baca): dibaca sekali dari localStorage lalu
  // ditulis ke atribut data-theme <html> — lapisan override CSS yang membaca
  // atribut itulah yang menata ulang seluruh aplikasi (DESIGN §13).
  // try/catch: localStorage bisa melempar di mode privat/iframe ketat.
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('pasarpian-theme');
      if (saved === 'dark' || saved === 'baca') return saved;
    } catch {
      /* abaikan — fallback ke terang */
    }
    return 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('pasarpian-theme', theme);
    } catch {
      /* abaikan — tema tetap berlaku untuk sesi ini */
    }
  }, [theme])
  // Sesi autentikasi lokal untuk simulasi frontend; token aman akan berasal dari API.
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory)
  const [returns, setReturns] = useState<ReturnRequest[]>(mockReturns)
  // Antrean gudang dijadikan state supaya tombol kerja halaman Pemenuhan benar-benar
  // memajukan tahap (bukan alert simulasi); Dashboard dan detail pesanan ikut hidup.
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>(mockFulfillments)
  // Catatan pembayaran dijadikan state supaya pencatatan cicilan langsung terlihat
  // di Keuangan dan detail pesanan — tanpa ini tombol "Catat" hanya omong kosong.
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments)
  // Kampanye dijadikan state supaya perubahan status ikut terlihat di dashboard
  // Fokus MARKETING; halaman tidak boleh menyimpan salinan sendiri (AGENTS #16).
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  // Akun internal dijadikan state supaya perubahan status ikut terlihat di
  // dashboard Fokus ADMIN; guard transisi + audit milik App (pola yang sama).
  const [users, setUsers] = useState<UserAccount[]>(mockUsers)
  // Buku mutasi & jejak audit dijadikan state (bukan konstanta mock) supaya aksi
  // pengguna — penyesuaian stok, keputusan retur — ikut tercatat di sini dan terlihat
  // di halaman Inventaris, Dashboard, dan Administrasi (AGENTS #21).
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  // Filter status daftar pesanan diangkat ke sini supaya drill-down dari dashboard
  // (panel Distribusi Status) bisa membuka daftar yang sudah terfilter (DESIGN §5.3-D.5).
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilter>('ALL')

  /** Memeriksa akun mock tanpa pernah menyimpan atau membandingkan password di client. */
  const handleLogin = (email: string, password: string): string | null => {
    const user = users.find((item) => item.email.toLowerCase() === email)
    if (!user || password.length < 8) return 'Email atau kata sandi belum cocok. Periksa kembali lalu coba lagi.'
    if (user.status !== 'ACTIVE') return 'Akun Pian kada aktif atau belum memiliki izin akses. Silakan hubungi Administrator.'
    setAuthenticatedUserId(user.id)
    setActiveRole(user.role)
    setCurrentTab('dashboard')
    return null
  }

  /** Menerima permintaan akses sebagai simulasi; aktivasi tetap tugas Administrator/backend. */
  const handleRegister = (name: string, email: string, password: string): string => {
    if (users.some((item) => item.email.toLowerCase() === email)) return 'Email tersebut sudah terdaftar. Silakan masuk atau hubungi Administrator.'
    void name
    void password
    return 'Permintaan akses sudah dicatat sebagai simulasi. Administrator perlu membuat dan mengaktifkan akun Anda.'
  }

  /** Mengakhiri sesi lokal dan mengembalikan pengguna ke halaman masuk. */
  const handleLogout = () => setAuthenticatedUserId(null)

  if (!authenticatedUserId) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={() => 'Google OAuth belum tersambung ke backend. Gunakan email/password simulasi.'} theme={theme} onChangeTheme={setTheme} />
  }

  const currentUser = users.find((user) => user.id === authenticatedUserId) ?? users[0]

  /**
   * Pindah tab dari sidebar/menu. Memilih menu Pesanan secara manual selalu
   * mereset filter ke Semua supaya tidak ada "filter basi" dari drill-down
   * sebelumnya yang membingungkan pengguna.
   */
  const handleSelectTab = (tab: string) => {
    if (tab === 'orders') setOrderStatusFilter('ALL')
    setCurrentTab(tab)
  }

  /**
   * Drill-down dari dashboard: buka daftar pesanan yang langsung terfilter
   * status tertentu (DESIGN §5.3-D.5 Target Drill-down interaktif).
   */
  const openOrdersWithStatus = (status: OrderFilter) => {
    setOrderStatusFilter(status)
    setCurrentTab('orders')
  }

  const selectOrderById = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId)
    if (order) setSelectedOrder(order)
  }

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus, reason?: string) => {
    const currentOrder = orders.find((order) => order.id === orderId)
    if (!currentOrder || !validTransitions[currentOrder.status]?.includes(nextStatus)) return

    // Alasan pembatalan disimpan ke catatan agar tampil di banner detail dan jejak audit (DESIGN §7.2).
    const updatedOrder = {
      ...currentOrder,
      status: nextStatus,
      notes: nextStatus === 'CANCELLED' && reason ? `Dibatalkan: ${reason}` : currentOrder.notes,
    }
    setOrders((currentOrders) => currentOrders.map((order) => (
      order.id === orderId ? updatedOrder : order
    )))
    setSelectedOrder(updatedOrder)
  }

  const adjustStock = (itemId: string, quantity: number, reason: string, referenceNo: string) => {
    const targetItem = inventory.find((item) => item.id === itemId)
    if (!targetItem || quantity === 0) return
    // Guard diulang di sini: validasi modal tidak boleh jadi satu-satunya penjaga
    // karena logika bisnis tinggal di pemilik state (AGENTS #15).
    if (targetItem.physicalStock + quantity < 0) return

    // Penyesuaian hanya menggeser Fisik & Tersedia; reservasi tidak disentuh sehingga
    // rumus Tersedia = Fisik − Reservasi tetap berlaku (DESIGN §7.4).
    setInventory((currentInventory) => currentInventory.map((item) => (
      item.id === itemId
        ? {
            ...item,
            physicalStock: item.physicalStock + quantity,
            availableStock: item.availableStock + quantity,
          }
        : item
    )))

    // Setiap penyesuaian wajib meninggalkan jejak mutasi + audit (DESIGN §7.4, AGENTS #21).
    // Identitas pelaku memakai peran aktif — belum ada login, jadi peran adalah
    // satu-satunya identitas jujur yang tersedia pada tahap simulasi ini.
    const timestamp = nowTimestamp()
    const movementEntry: StockMovement = {
      id: `mov-adj-${Date.now()}`,
      timestamp,
      type: 'ADJUSTMENT',
      sku: targetItem.sku,
      productName: targetItem.productName,
      warehouseName: targetItem.warehouseName,
      quantity,
      referenceNo,
      actor: activeRole,
      notes: reason,
    }
    setMovements((currentMovements) => [movementEntry, ...currentMovements])
    const auditEntry: AuditLog = {
      id: `adt-adj-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'Inventory',
      entityId: targetItem.sku,
      action: 'ADJUSTMENT',
      oldValue: `Stok Fisik: ${targetItem.physicalStock}`,
      newValue: `Stok Fisik: ${targetItem.physicalStock + quantity} (${reason})`,
    }
    setAuditLogs((currentLogs) => [auditEntry, ...currentLogs])
  }

  const decideReturn = (returnId: string, nextStatus: ReturnRequest['status']) => {
    const currentItem = returns.find((item) => item.id === returnId)
    // Keputusan hanya boleh mengikuti transisi sah dari status saat ini (AGENTS #15).
    if (!currentItem || !returnTransitions[currentItem.status]?.includes(nextStatus)) return

    // Retur yang ditolak tidak menghasilkan refund sama sekali.
    setReturns((currentReturns) => currentReturns.map((item) => {
      if (item.id !== returnId) return item
      return {
        ...item,
        status: nextStatus,
        // Penolakan menghapus hak refund; penyelesaian tidak mengubah nominal.
        refundAmount: nextStatus === 'REJECTED' ? 0 : item.refundAmount,
      }
    }))

    // Tiap keputusan dicatat ke jejak audit (AGENTS #21).
    const timestamp = nowTimestamp()
    setAuditLogs((currentLogs) => [{
      id: `adt-ret-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'Return',
      entityId: currentItem.returnNumber,
      action: 'STATUS_CHANGE',
      oldValue: `Status: ${currentItem.status}`,
      newValue: `Status: ${nextStatus}`,
    }, ...currentLogs])
  }

  /**
   * Memajukan satu antrean gudang ke tahap berikutnya yang sah.
   * Aturan kuantitas: masuk PACKING berarti seluruh item selesai diambil;
   * masuk READY_TO_SHIP berarti seluruh item selesai dikemas. Tahap PICKING
   * sengaja tidak mengubah kuantitas karena pengambilan masih berjalan.
   * Tiap perpindahan dicatat ke jejak audit (DESIGN §7.2, AGENTS #21).
   */
  const advanceFulfillment = (fulfillmentId: string) => {
    const current = fulfillments.find((item) => item.id === fulfillmentId)
    const nextStatus = current ? fulfillmentTransitions[current.status] : null
    if (!current || !nextStatus) return

    setFulfillments((currentList) => currentList.map((item) => {
      if (item.id !== fulfillmentId) return item
      return {
        ...item,
        status: nextStatus,
        items: item.items.map((line) => ({
          ...line,
          pickedQuantity:
            nextStatus === 'PACKING' || nextStatus === 'READY_TO_SHIP' ? line.quantity : line.pickedQuantity,
          packedQuantity: nextStatus === 'READY_TO_SHIP' ? line.quantity : line.packedQuantity,
        })),
      }
    }))

    const timestamp = nowTimestamp()
    setAuditLogs((currentLogs) => [{
      id: `adt-ful-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'Fulfillment',
      entityId: current.fulfillmentNumber,
      action: 'STATUS_CHANGE',
      oldValue: `Status: ${current.status}`,
      newValue: `Status: ${nextStatus}`,
    }, ...currentLogs])
  }

  /**
   * Mencatat pembayaran cicilan/tambahan (DESIGN §8.4).
   * Guard: order harus ada dan masih berpiutang; nominal (0, sisa]. Status bayar
   * diturunkan dari angka (lunas ⇔ sisa nol), bukan ditulis manual (DESIGN §7.3).
   * Status catatan = COMPLETED karena FINANCE mencatat sekaligus memverifikasi
   * pada tahap simulasi ini (nanti: PENDING_VERIFICATION + checker terpisah).
   */
  const recordPayment = (orderId: string, input: RecordPaymentInput) => {
    const currentOrder = orders.find((order) => order.id === orderId)
    if (!currentOrder || currentOrder.outstanding <= 0) return
    if (!(input.amount > 0) || input.amount > currentOrder.outstanding) return

    const timestamp = `${input.paymentDate} ${nowTimestamp().slice(11)}`
    const paymentEntry: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderNumber: currentOrder.orderNumber,
      customerName: currentOrder.customerName,
      paymentDate: timestamp,
      amount: input.amount,
      method: input.method,
      referenceNo: input.referenceNo,
      status: 'COMPLETED',
    }
    setPayments((currentPayments) => [paymentEntry, ...currentPayments])

    const newTotalPaid = currentOrder.totalPaid + input.amount
    const newOutstanding = currentOrder.total - newTotalPaid
    const newPaymentStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL'
    setOrders((currentOrders) => currentOrders.map((order) => (
      order.id === orderId
        ? { ...order, totalPaid: newTotalPaid, outstanding: newOutstanding, paymentStatus: newPaymentStatus }
        : order
    )))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...currentOrder, totalPaid: newTotalPaid, outstanding: newOutstanding, paymentStatus: newPaymentStatus })
    }

    setAuditLogs((currentLogs) => [{
      id: `adt-pay-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'Payment',
      entityId: currentOrder.orderNumber,
      action: 'PAYMENT',
      oldValue: `Total Paid: ${formatRupiah(currentOrder.totalPaid)}`,
      newValue: `Total Paid: ${formatRupiah(newTotalPaid)} (${input.method}, ref ${input.referenceNo})`,
    }, ...currentLogs])
  }

  /**
   * Mengubah status kampanye mengikuti transisi sah + mencatat ke jejak audit.
   * Guard diulang di sini karena tombol halaman tidak boleh jadi satu-satunya
   * penjaga (AGENTS #15).
   */
  const changeCampaignStatus = (campaignId: string, nextStatus: Campaign['status']) => {
    const current = campaigns.find((item) => item.id === campaignId)
    if (!current || !campaignTransitions[current.status]?.includes(nextStatus)) return

    setCampaigns((currentList) => currentList.map((item) => (
      item.id === campaignId ? { ...item, status: nextStatus } : item
    )))

    const timestamp = nowTimestamp()
    setAuditLogs((currentLogs) => [{
      id: `adt-cmp-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'Campaign',
      entityId: current.name,
      action: 'STATUS_CHANGE',
      oldValue: `Status: ${current.status}`,
      newValue: `Status: ${nextStatus}`,
    }, ...currentLogs])
  }

  /**
   * Mengubah status akun internal + mencatat ke jejak audit.
   * Guard mengikuti peta transisi bersama (sumber yang sama dengan tombol halaman).
   * Dialog konfirmasi tidak ditambahkan: §11.3 hanya mewajibkan dua-tahap untuk
   * aksi destruktif data/uang; penangguhan akun tetap tercatat + diumumkan.
   */
  const changeUserStatus = (userId: string, nextStatus: UserStatus) => {
    const current = users.find((item) => item.id === userId)
    if (!current || !userStatusTransitions[current.status]?.some((transition) => transition.next === nextStatus)) return

    setUsers((currentList) => currentList.map((item) => (
      item.id === userId ? { ...item, status: nextStatus } : item
    )))

    const timestamp = nowTimestamp()
    setAuditLogs((currentLogs) => [{
      id: `adt-usr-${Date.now()}`,
      timestamp,
      actor: activeRole,
      role: activeRole,
      entity: 'User',
      entityId: current.email,
      action: 'STATUS_CHANGE',
      oldValue: `Status: ${userStatusLabels[current.status]}`,
      newValue: `Status: ${userStatusLabels[nextStatus]}`,
    }, ...currentLogs])
  }

  const renderPage = () => {
    switch (currentTab) {
      case 'orders':
        return (
          <OrdersPage
            orders={orders}
            statusFilter={orderStatusFilter}
            onStatusFilterChange={setOrderStatusFilter}
            onSelectOrder={setSelectedOrder}
            onNavigateTab={setCurrentTab}
          />
        )
      case 'inventory':
        return (
          <InventoryPage
            inventory={inventory}
            movements={movements}
            onAdjustStock={adjustStock}
          />
        )
      case 'catalog':
        return <CatalogPage inventory={inventory} onNavigateTab={setCurrentTab} />
      case 'fulfillment':
        return (
          <FulfillmentPage
            fulfillments={fulfillments}
            onAdvanceFulfillment={advanceFulfillment}
            onNavigateTab={setCurrentTab}
          />
        )
      case 'shipping':
        return <ShippingPage shipments={mockShipments} />
      case 'finance':
        return (
          <FinancePage
            orders={orders}
            payments={payments}
            returns={returns}
            onRecordPayment={recordPayment}
            onSelectOrder={setSelectedOrder}
          />
        )
      case 'returns':
        return (
          <ReturnsPage
            returns={returns}
            orders={orders}
            onDecide={decideReturn}
            onSelectOrder={setSelectedOrder}
          />
        )
      case 'marketing':
        return (
          <MarketingPage
            campaigns={campaigns}
            onChangeStatus={changeCampaignStatus}
            onNavigateTab={setCurrentTab}
          />
        )
      case 'admin':
        return <AdminPage users={users} auditLogs={auditLogs} onChangeUserStatus={changeUserStatus} />
      case 'dashboard':
        return (
          <DashboardPage
            orders={orders}
            fulfillments={fulfillments}
            movements={movements}
            inventory={inventory}
            shipments={mockShipments}
            returns={returns}
            campaigns={campaigns}
            users={users}
            auditLogs={auditLogs}
            activeRole={activeRole}
            onNavigateTab={setCurrentTab}
            onNavigateOrdersWithStatus={openOrdersWithStatus}
            onSelectOrder={setSelectedOrder}
          />
        )
      default:
        return (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D7A70]">Modul berikutnya</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900">Halaman sedang disiapkan</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Dashboard, pesanan, katalog, dan inventaris sudah dapat digunakan dengan data simulasi lokal.
              Modul ini akan disambungkan ke workflow berikutnya tanpa mengubah sumber data ERP.
            </p>
          </section>
        )
    }
  }

    return (
      <AppLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      activeRole={activeRole}
        onChangeRole={setActiveRole}
        theme={theme}
        onChangeTheme={setTheme}
        onLogout={handleLogout}
        currentUserName={currentUser.name}
      onSelectOrder={selectOrderById}
    >
      {renderPage()}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={updateOrderStatus}
        payments={payments}
        fulfillments={fulfillments}
        shipments={mockShipments}
        auditLogs={auditLogs}
      />
    </AppLayout>
  )
}

export default App

