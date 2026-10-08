import bcrypt from 'bcrypt';
import type { DataSource, QueryRunner } from 'typeorm';

/**
 * Seeder database PasarPian — data contoh Banua yang konsisten antar tabel.
 *
 * Apa ini? Fungsi `seedDatabase` mengisi 21 tabel dengan satu transaksi atomik.
 * Untuk apa? Memberi backend data awal yang relasinya benar (order ↔ item ↔
 * pembayaran ↔ pemenuhan ↔ kiriman) supaya API/ modul berikutnya bisa
 * dikembangkan tanpa mengetik data manual. Angka-angka (total, outstanding,
 * available) dihitung konsisten mengikuti rumus SCHEMA.
 * Kenapa satu transaksi? Agar gagal di tengah = tidak ada data setengah jadi.
 *
 * CATATAN KEJUJURAN: nilai kolom `status`/`type`/`method` yang belum
 * dienumerasi SCHEMA memakai kosakata PRD/DESIGN/frontend (ACTIVE, PENDING,
 * COMPLETED, ...) sebagai interim sampai database/business-rule aktual
 * memastikan. Semua akun memakai kata sandi dev `pasarpian123` (bcrypt) —
 * JANGAN dipakai di production.
 */

/** Sisip satu baris lalu kembalikan id UUID-nya untuk dirangkai ke FK. */
async function insertId(qr: QueryRunner, sql: string, params: unknown[]): Promise<string> {
  const rows = (await qr.query(`${sql} RETURNING id`, params)) as Array<{ id: string }>;
  return rows[0].id;
}

/** Ambil id satu baris acuan (role/channel) berdasarkan kolom unik. */
async function findId(
  qr: QueryRunner,
  table: string,
  column: string,
  value: string,
): Promise<string> {
  const rows = (await qr.query(`SELECT id FROM ${table} WHERE ${column} = $1`, [value])) as Array<{
    id: string;
  }>;
  if (rows.length === 0) throw new Error(`Acuan tidak ditemukan: ${table}.${column} = ${value}`);
  return rows[0].id;
}

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const existing = (await dataSource.query(`SELECT COUNT(*)::int AS n FROM users`)) as Array<{ n: number }>;
  if (existing[0].n > 0) {
    console.log('Seeder dilewati: tabel users sudah berisi data.');
    return;
  }

  const passwordHash = await bcrypt.hash('pasarpian123', 10);
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    // --- 1. Peran (7 peran sesuai PRD #7) ---
    const roles: Array<[string, string]> = [
      ['MANAGEMENT', 'Manajemen — ringkasan kinerja dan keputusan bisnis.'],
      ['OPERATIONS', 'Operasi — lifecycle pesanan dari masuk sampai selesai.'],
      ['WAREHOUSE', 'Gudang — stok, picking, dan packing.'],
      ['SALES', 'Penjualan — pesanan per saluran dan pelanggan.'],
      ['FINANCE', 'Keuangan — pembayaran, outstanding, dan refund.'],
      ['MARKETING', 'Pemasaran — kampanye dan saluran promosi.'],
      ['ADMIN', 'Administrator — akun, peran, dan jejak audit.'],
    ];
    for (const [name, description] of roles) {
      await qr.query(`INSERT INTO roles (name, description) VALUES ($1, $2)`, [name, description]);
    }

    // --- 2. Akun internal (sama dengan mock frontend supaya alur QA nyambung) ---
    const users: Array<[string, string, string, string]> = [
      ['Ahmad Gazali, SE', 'ahmad.gazali@pasarpian.id', 'MANAGEMENT', 'ACTIVE'],
      ['Hj. Fatimah Zahra', 'fatimah@pasarpian.id', 'OPERATIONS', 'ACTIVE'],
      ['Akhmad Fauzi', 'fauzi.gudang@pasarpian.id', 'WAREHOUSE', 'ACTIVE'],
      ['M. Rizky Ramadhani', 'rizky.sales@pasarpian.id', 'SALES', 'ACTIVE'],
      ['Sri Wahyuni, Ak.', 'wahyuni.finance@pasarpian.id', 'FINANCE', 'ACTIVE'],
      ['Budi Santoso', 'budi.marketing@pasarpian.id', 'MARKETING', 'ACTIVE'],
      ['Administrator Sistem', 'admin@pasarpian.id', 'ADMIN', 'ACTIVE'],
      ['H. Rusli', 'rusli.gudang@pasarpian.id', 'WAREHOUSE', 'SUSPENDED'],
    ];
    const userIds: Record<string, string> = {};
    for (const [name, email, role, status] of users) {
      const roleId = await findId(qr, 'roles', 'name', role);
      userIds[email] = await insertId(
        qr,
        `INSERT INTO users (name, email, password_hash, role_id, status) VALUES ($1, $2, $3, $4, $5)`,
        [name, email, passwordHash, roleId, status],
      );
    }

    // --- 3. Gudang ---
    const bdj = await insertId(
      qr,
      `INSERT INTO warehouses (code, name, address, city, province, status) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
      ['WH-BDJ-01', 'Gudang Banjarmasin', 'Jl. A. Yani Km 7', 'Banjarmasin', 'Kalimantan Selatan'],
    );
    const bjb = await insertId(
      qr,
      `INSERT INTO warehouses (code, name, address, city, province, status) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
      ['WH-BJB-01', 'Gudang Banjarbaru', 'Jl. Karang Rejo', 'Banjarbaru', 'Kalimantan Selatan'],
    );

    // --- 4. Kategori + produk + varian/SKU ---
    const catIds: Record<string, string> = {};
    for (const name of ['Kain Sasirangan', 'Kopi & Pangan', 'Kerajinan Anyaman', 'Ikan Olahan']) {
      catIds[name] = await insertId(
        qr,
        `INSERT INTO product_categories (name, status) VALUES ($1, 'ACTIVE')`,
        [name],
      );
    }
    const productIds: Record<string, string> = {};
    const products: Array<[string, string, string]> = [
      ['PRD-001', 'Kain Sasirangan Katun Prima', 'Kain Sasirangan'],
      ['PRD-002', 'Kopi Pasak Bumi Aranio', 'Kopi & Pangan'],
      ['PRD-003', 'Tas Anyaman Purun Amuntai', 'Kerajinan Anyaman'],
      ['PRD-004', 'Ikan Haruan Kering Asam', 'Ikan Olahan'],
    ];
    for (const [code, name, category] of products) {
      productIds[code] = await insertId(
        qr,
        `INSERT INTO products (category_id, product_code, name, status) VALUES ($1, $2, $3, 'ACTIVE')`,
        [catIds[category], code, name],
      );
    }
    // [sku, product, variant_name, price, cost]
    const variants: Array<[string, string, string, number, number]> = [
      ['SAS-KTN-M', 'PRD-001', 'Kuning Kunyit / M', 205000, 120000],
      ['SAS-KTN-L', 'PRD-001', 'Kuning Kunyit / L', 215000, 125000],
      ['KPB-R250', 'PRD-002', 'Robusta Bubuk 250g', 177000, 95000],
      ['KPB-R500', 'PRD-002', 'Robusta Bubuk 500g', 340000, 180000],
      ['TAS-PRN', 'PRD-003', 'Natural Medium (Handle Kulit)', 1230000, 700000],
      ['IHR-V500', 'PRD-004', 'Vakum Kedap Udara 500g', 212000, 130000],
    ];
    const variantIds: Record<string, string> = {};
    for (const [sku, product, variantName, price, cost] of variants) {
      variantIds[sku] = await insertId(
        qr,
        `INSERT INTO product_variants (product_id, sku, variant_name, price, cost, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
        [productIds[product], sku, variantName, price, cost],
      );
    }

    // --- 5. Saluran penjualan (type memakai kode interim sampai ERP memastikan) ---
    const channels: Array<[string, string]> = [
      ['Website PasarPian', 'WEBSITE'],
      ['Marketplace Eksternal', 'MARKETPLACE'],
      ['TikTok Shop Banua', 'TIKTOK_SHOP'],
      ['Social Commerce', 'SOCIAL_COMMERCE'],
      ['Penjualan Langsung', 'DIRECT'],
      ['Institusi & Dinas', 'INSTITUTIONAL'],
    ];
    for (const [name, type] of channels) {
      await qr.query(`INSERT INTO sales_channels (name, type, status) VALUES ($1, $2, 'ACTIVE')`, [name, type]);
    }

    // --- 6. Pelanggan + alamat ---
    const custIds: Record<string, string> = {};
    const customers: Array<[string, string, string, string, string]> = [
      ['CUST-001', 'Hj. Mardiah Noor', 'INDIVIDUAL', 'mardiah.noor@example.id', '0811-1111-0001'],
      ['CUST-002', 'Drs. H. Syahrani', 'INDIVIDUAL', 'syahrani@example.id', '0811-1111-0002'],
      ['CUST-003', 'PT. Banua Sejahtera Bersama', 'INSTITUTION', 'pengadaan@banuasejahtera.example.id', '0511-222000'],
      ['CUST-004', 'Siti Rahmah', 'INDIVIDUAL', 'siti.rahmah@example.id', '0811-1111-0004'],
    ];
    for (const [code, name, type, email, phone] of customers) {
      custIds[code] = await insertId(
        qr,
        `INSERT INTO customers (customer_code, name, type, email, phone, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
        [code, name, type, email, phone],
      );
    }
    const addressIds: Record<string, string> = {};
    const addresses: Array<[string, string, string, string, boolean]> = [
      ['CUST-001', 'Rumah', 'Jl. Sungai Martapura No. 12, Banjarmasin', 'Banjarmasin', true],
      ['CUST-002', 'Kantor', 'Jl. Pangeran Antasari No. 8, Banjarbaru', 'Banjarbaru', true],
      ['CUST-003', 'Kantor Pusat', 'Jl. A. Yani Km 5, Banjarmasin', 'Banjarmasin', true],
      ['CUST-004', 'Rumah', 'Jl. Kelayan B No. 21, Banjarmasin', 'Banjarmasin', true],
    ];
    for (const [cust, label, address, city, isDefault] of addresses) {
      const id = await insertId(
        qr,
        `INSERT INTO customer_addresses (customer_id, label, address, city, province, is_default)
         VALUES ($1, $2, $3, $4, 'Kalimantan Selatan', $5)`,
        [custIds[cust], label, address, city, isDefault],
      );
      if (isDefault) addressIds[cust] = id;
    }

    // --- 7. Pesanan + item (total = subtotal - diskon + ongkir + pajak) ---
    interface SeedItem {
      sku: string;
      quantity: number;
    }
    const orders: Array<{
      number: string;
      customer: string;
      channel: string;
      date: string;
      status: string;
      shipping: number;
      notes: string | null;
      items: SeedItem[];
    }> = [
      {
        number: 'ORD-2026-0001', customer: 'CUST-001', channel: 'Penjualan Langsung',
        date: '2026-10-02 10:10:00+08', status: 'DELIVERED', shipping: 15000, notes: null,
        items: [{ sku: 'SAS-KTN-M', quantity: 2 }],
      },
      {
        number: 'ORD-2026-0002', customer: 'CUST-002', channel: 'Institusi & Dinas',
        date: '2026-10-06 08:15:00+08', status: 'CONFIRMED', shipping: 0, notes: 'Pembayaran termin institusi.',
        items: [{ sku: 'TAS-PRN', quantity: 1 }],
      },
      {
        number: 'ORD-2026-0003', customer: 'CUST-003', channel: 'Institusi & Dinas',
        date: '2026-10-05 14:20:00+08', status: 'PROCESSING', shipping: 25000, notes: 'Pengadaan 5 dus kopi.',
        items: [{ sku: 'KPB-R500', quantity: 5 }],
      },
      {
        number: 'ORD-2026-0004', customer: 'CUST-004', channel: 'Website PasarPian',
        date: '2026-10-04 11:00:00+08', status: 'SHIPPED', shipping: 12000, notes: null,
        items: [{ sku: 'SAS-KTN-L', quantity: 1 }],
      },
      {
        number: 'ORD-2026-0005', customer: 'CUST-001', channel: 'Marketplace Eksternal',
        date: '2026-10-06 09:05:00+08', status: 'PENDING', shipping: 10000, notes: null,
        items: [{ sku: 'IHR-V500', quantity: 1 }],
      },
      {
        number: 'ORD-2026-0006', customer: 'CUST-003', channel: 'Penjualan Langsung',
        date: '2026-10-03 16:45:00+08', status: 'CANCELLED', shipping: 0,
        notes: 'Dibatalkan: anggaran dinas dialihkan.',
        items: [{ sku: 'TAS-PRN', quantity: 1 }],
      },
    ];
    const orderIds: Record<string, string> = {};
    const orderItemIds: Record<string, string[]> = {};
    for (const order of orders) {
      const channelId = await findId(qr, 'sales_channels', 'name', order.channel);
      let subtotal = 0;
      const priced = order.items.map((item) => {
        const price = variants.find((v) => v[0] === item.sku)?.[3] ?? 0;
        subtotal += price * item.quantity;
        return { ...item, price };
      });
      const total = subtotal + order.shipping;
      orderIds[order.number] = await insertId(
        qr,
        `INSERT INTO orders (order_number, customer_id, sales_channel_id, order_date, status,
          subtotal, total_amount, discount, shipping_fee, tax, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 0, $9)`,
        [order.number, custIds[order.customer], channelId, order.date, order.status, subtotal, total, order.shipping, order.notes],
      );
      orderItemIds[order.number] = [];
      for (const item of priced) {
        const id = await insertId(
          qr,
          `INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price, discount, subtotal)
           VALUES ($1, $2, $3, $4, 0, $5)`,
          [orderIds[order.number], variantIds[item.sku], item.quantity, item.price, item.price * item.quantity],
        );
        orderItemIds[order.number].push(id);
      }
    }

    // --- 8. Pembayaran (TotalPaid = SUM; Outstanding = Total - TotalPaid) ---
    const payments: Array<[string, string, number, string, string, string]> = [
      // [order, date, amount, method, status, reference]
      ['ORD-2026-0001', '2026-10-02 13:00:00+08', 425000, 'TRANSFER_BANK', 'COMPLETED', 'BPD-KSL-880101'],
      ['ORD-2026-0002', '2026-10-06 10:30:00+08', 600000, 'TRANSFER_BANK', 'COMPLETED', 'BPD-KSL-882105'],
      ['ORD-2026-0004', '2026-10-04 12:00:00+08', 227000, 'QRIS', 'COMPLETED', 'QRIS-771204'],
    ];
    for (const [order, date, amount, method, status, reference] of payments) {
      await qr.query(
        `INSERT INTO payments (order_id, payment_date, amount, method, status, reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderIds[order], date, amount, method, status, reference],
      );
    }

    // --- 9. Stok (available = physical - reserved, konsisten per baris) ---
    const stocks: Array<[string, string, number, number]> = [
      // [warehouseId, sku, physical, reserved]
      [bdj, 'SAS-KTN-M', 40, 6],
      [bdj, 'SAS-KTN-L', 25, 1],
      [bdj, 'KPB-R250', 60, 0],
      [bdj, 'KPB-R500', 20, 5],
      [bdj, 'TAS-PRN', 8, 1],
      [bdj, 'IHR-V500', 30, 0],
      [bjb, 'SAS-KTN-M', 15, 0],
      [bjb, 'KPB-R250', 25, 0],
      [bjb, 'IHR-V500', 12, 0],
    ];
    for (const [warehouseId, sku, physical, reserved] of stocks) {
      await qr.query(
        `INSERT INTO inventories (warehouse_id, product_variant_id, quantity, reserved_quantity, available_quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [warehouseId, variantIds[sku], physical, reserved, physical - reserved],
      );
    }

    // --- 10. Mutasi stok (jejak RECEIVE + PICK + ADJUSTMENT) ---
    const fauzi = userIds['fauzi.gudang@pasarpian.id'];
    const movements: Array<[string, string, string, number, string, string, string | null]> = [
      // [warehouseId, sku, type, quantity, reference_type, reference_no/notes tanggal, actor]
      [bdj, 'SAS-KTN-M', 'RECEIVE', 40, 'PURCHASE', 'PO-2026-0091', fauzi],
      [bdj, 'KPB-R500', 'RECEIVE', 20, 'PURCHASE', 'PO-2026-0092', fauzi],
      [bjb, 'SAS-KTN-M', 'TRANSFER_IN', 15, 'TRANSFER', 'TRF-2026-0014', fauzi],
      [bdj, 'KPB-R500', 'PICK', -5, 'ORDER', 'ORD-2026-0003', fauzi],
      [bdj, 'SAS-KTN-L', 'PICK', -1, 'ORDER', 'ORD-2026-0004', fauzi],
      [bdj, 'SAS-KTN-M', 'ADJUSTMENT', -1, 'STOCK_OPNAME', 'Opname mingguan', fauzi],
    ];
    for (const [warehouseId, sku, type, quantity, refType, refNote, actor] of movements) {
      await qr.query(
        `INSERT INTO inventory_movements
           (warehouse_id, product_variant_id, type, quantity, reference_type, reference_id, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)`,
        [warehouseId, variantIds[sku], type, quantity, refType, refNote, actor],
      );
    }

    // --- 11. Pemenuhan gudang ---
    const ful1 = await insertId(
      qr,
      `INSERT INTO fulfillments (fulfillment_number, order_id, warehouse_id, status)
       VALUES ('FUL-2026-0001', $1, $2, 'PACKING')`,
      [orderIds['ORD-2026-0003'], bdj],
    );
    await qr.query(
      `INSERT INTO fulfillment_items (fulfillment_id, order_item_id, quantity, picked_quantity, packed_quantity, status)
       VALUES ($1, $2, 5, 5, 3, 'PACKING')`,
      [ful1, orderItemIds['ORD-2026-0003'][0]],
    );
    const ful2 = await insertId(
      qr,
      `INSERT INTO fulfillments (fulfillment_number, order_id, warehouse_id, status)
       VALUES ('FUL-2026-0002', $1, $2, 'READY_TO_SHIP')`,
      [orderIds['ORD-2026-0004'], bdj],
    );
    await qr.query(
      `INSERT INTO fulfillment_items (fulfillment_id, order_item_id, quantity, picked_quantity, packed_quantity, status)
       VALUES ($1, $2, 1, 1, 1, 'PACKED')`,
      [ful2, orderItemIds['ORD-2026-0004'][0]],
    );

    // --- 12. Pengiriman + tracking ---
    const shp1 = await insertId(
      qr,
      `INSERT INTO shipments (shipment_number, order_id, fulfillment_id, courier, tracking_number,
        shipping_address_id, shipped_at, status)
       VALUES ('SHP-2026-0001', $1, $2, 'JNE', 'JNE9928172635', $3, '2026-10-05 09:00:00+08', 'IN_TRANSIT')`,
      [orderIds['ORD-2026-0004'], ful2, addressIds['CUST-004']],
    );
    for (const [status, location, description, at] of [
      ['PICKUP', 'Banjarmasin', 'Paket diterima kurir di gudang.', '2026-10-05 09:00:00+08'],
      ['IN_TRANSIT', 'Hub Banjarbaru', 'Paket transit menuju kota tujuan.', '2026-10-06 07:30:00+08'],
    ] as Array<[string, string, string, string]>) {
      await qr.query(
        `INSERT INTO shipment_tracking (shipment_id, status, location, description, occurred_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [shp1, status, location, description, at],
      );
    }
    const shp2 = await insertId(
      qr,
      `INSERT INTO shipments (shipment_number, order_id, courier, tracking_number,
        shipping_address_id, shipped_at, delivered_at, status)
       VALUES ('SHP-2026-0002', $1, 'J&T Express', 'JT88210011', $2,
         '2026-10-03 10:00:00+08', '2026-10-04 15:20:00+08', 'DELIVERED')`,
      [orderIds['ORD-2026-0001'], addressIds['CUST-001']],
    );
    for (const [status, location, description, at] of [
      ['PICKUP', 'Banjarmasin', 'Paket diterima kurir di gudang.', '2026-10-03 10:00:00+08'],
      ['IN_TRANSIT', 'Hub Banjarmasin', 'Paket dalam perjalanan.', '2026-10-03 18:00:00+08'],
      ['DELIVERED', 'Banjarmasin', 'Paket diterima Hj. Mardiah Noor.', '2026-10-04 15:20:00+08'],
    ] as Array<[string, string, string, string]>) {
      await qr.query(
        `INSERT INTO shipment_tracking (shipment_id, status, location, description, occurred_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [shp2, status, location, description, at],
      );
    }

    // --- 13. Retur (kasus menunggu inspeksi) ---
    const ret1 = await insertId(
      qr,
      `INSERT INTO returns (return_number, order_id, customer_id, reason, status, refund_amount)
       VALUES ('RET-2026-0001', $1, $2, 'Warna tidak sesuai harapan.', 'PENDING_INSPECTION', NULL)`,
      [orderIds['ORD-2026-0001'], custIds['CUST-001']],
    );
    await qr.query(
      `INSERT INTO return_items (return_id, order_item_id, quantity, condition, action)
       VALUES ($1, $2, 1, 'UNKNOWN', NULL)`,
      [ret1, orderItemIds['ORD-2026-0001'][0]],
    );

    // --- 14. Jejak audit (siapa–kapan–entitas apa–lama vs baru) ---
    const fatimah = userIds['fatimah@pasarpian.id'];
    const sri = userIds['wahyuni.finance@pasarpian.id'];
    const admin = userIds['admin@pasarpian.id'];
    const audits: Array<[string | null, string, string, string, string, string, string]> = [
      [fatimah, 'Order', orderIds['ORD-2026-0002'], 'STATUS_CHANGE',
        'Status: PENDING', 'Status: CONFIRMED', '2026-10-06 09:35:00+08'],
      [sri, 'Payment', orderIds['ORD-2026-0002'], 'PAYMENT',
        'Total Paid: Rp 0, Outstanding: Rp 1.230.000',
        'Total Paid: Rp 600.000, Outstanding: Rp 630.000 (Partial)', '2026-10-06 08:45:00+08'],
      [fauzi, 'Inventory', variantIds['SAS-KTN-M'], 'ADJUSTMENT',
        'Stok Fisik: 15', 'Stok Fisik: 14 (Opname mingguan)', '2026-10-04 14:15:00+08'],
      [admin, 'User', userIds['rusli.gudang@pasarpian.id'], 'STATUS_CHANGE',
        'Status: ACTIVE', 'Status: SUSPENDED', '2026-10-04 14:00:00+08'],
    ];
    for (const [userId, entity, entityId, action, oldValue, newValue, at] of audits) {
      await qr.query(
        `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
        [userId, entity, entityId, action,
          JSON.stringify({ text: oldValue }), JSON.stringify({ text: newValue }), at],
      );
    }

    await qr.commitTransaction();
    console.log('Seeder selesai: 7 peran, 8 akun, 2 gudang, 4 produk/6 varian, 6 saluran,');
    console.log('4 pelanggan, 6 pesanan, 3 pembayaran, 2 pemenuhan, 2 kiriman, 1 retur, 4 audit.');
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
  }
}
