export type UserRole = 
  | 'MANAGEMENT'
  | 'OPERATIONS'
  | 'WAREHOUSE'
  | 'SALES'
  | 'FINANCE'
  | 'MARKETING'
  | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PICKED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export type SalesChannel = 
  | 'WEBSITE'
  | 'MARKETPLACE'
  | 'TIKTOK_SHOP'
  | 'SOCIAL_COMMERCE'
  | 'DIRECT'
  | 'INSTITUTIONAL';

export interface OrderItem {
  id: string;
  productName: string;
  variant: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'INSTITUTION';
  customerPhone: string;
  customerCity: string;
  shippingAddress: string;
  salesChannel: SalesChannel;
  orderDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  totalPaid: number;
  outstanding: number;
  notes?: string;
  courier?: string;
  trackingNumber?: string;
  warehouseId?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  sku: string;
  productName: string;
  category: string;
  variant: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minThreshold: number;
  unitPrice: number;
  costPrice: number;
}

export type MovementType = 
  | 'RECEIVE'
  | 'RESERVE'
  | 'RELEASE'
  | 'PICK'
  | 'SHIP'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'DAMAGE'
  | 'DISPOSE';

export interface StockMovement {
  id: string;
  timestamp: string;
  type: MovementType;
  sku: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  referenceNo: string;
  actor: string;
  notes: string;
}

export type FulfillmentStatus = 'READY_TO_PICK' | 'PICKING' | 'PACKING' | 'READY_TO_SHIP';

export interface FulfillmentItem {
  id: string;
  sku: string;
  productName: string;
  variant: string;
  quantity: number;
  pickedQuantity: number;
  packedQuantity: number;
}

export interface Fulfillment {
  id: string;
  fulfillmentNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: FulfillmentStatus;
  createdAt: string;
  items: FulfillmentItem[];
}

export interface TrackingStep {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderNumber: string;
  customerName: string;
  destinationCity: string;
  courier: string;
  service: string;
  trackingNumber: string;
  shippedAt: string;
  estimatedDelivery: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'RETURNED_TO_SENDER';
  timeline: TrackingStep[];
}

export interface PaymentRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: 'TRANSFER_BANK' | 'QRIS' | 'VIRTUAL_ACCOUNT' | 'COD' | 'CREDIT_TERMS';
  referenceNo: string;
  status: 'COMPLETED' | 'PENDING_VERIFICATION' | 'FAILED' | 'REFUNDED';
}

/**
 * Masukan form pencatatan pembayaran cicilan/tambahan (DESIGN §8.4).
 * Apa ini? Data yang diisi FINANCE saat mencatat bayar. Untuk apa? Dibuat
 * RecordPaymentModal, divalidasi App.recordPayment menjadi PaymentRecord penuh.
 * Kenapa ada? Dipisah dari PaymentRecord karena id, nama pelanggan, dan status
 * final ditentukan sistem saat pencatatan — bukan diketik pengguna.
 */
export interface RecordPaymentInput {
  /** Nominal (> 0 dan tidak melebihi sisa tagihan — kelebihan tidak diterima). */
  amount: number;
  /** Cara bayar sesuai daftar metode SCHEMA payments. */
  method: PaymentRecord['method'];
  /** Tanggal bayar "YYYY-MM-DD" dari input kalender. */
  paymentDate: string;
  /** Nomor referensi/bukti transfer — wajib untuk rekonsiliasi. */
  referenceNo: string;
  /** Catatan tambahan, boleh kosong. */
  notes?: string;
}

export type ReturnCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | 'UNKNOWN';
export type ReturnAction = 'RESTOCK' | 'REPAIR' | 'DISPOSE' | 'REPLACE';

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  requestDate: string;
  productName: string;
  variant: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
  action: ReturnAction;
  status: 'PENDING_INSPECTION' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  refundAmount: number;
}

export interface Campaign {
  id: string;
  name: string;
  bannerHeadline: string;
  bannerSubtext: string;
  channels: SalesChannel[];
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'COMPLETED';
  productsCount: number;
  budgetAllocated: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'PAYMENT' | 'ADJUSTMENT';
  oldValue: string;
  newValue: string;
}
