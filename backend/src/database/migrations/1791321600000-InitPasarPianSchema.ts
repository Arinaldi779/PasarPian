import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration awal schema PasarPian — 21 tabel definitif dari Agents/SCHEMA.md.
 *
 * Apa ini? DDL eksplisit (CREATE TABLE + constraint + index + trigger) yang
 * membangun seluruh database dari kosong. Untuk apa? Satu-satunya cara schema
 * boleh berubah (ARCHITECTURE §6: migration, bukan `synchronize: true`).
 * Kenapa raw SQL di dalam Migration class? SQL-nya presisi (tipe, CHECK,
 * trigger persis seperti didokumentasikan) sekaligus tercatat di histori
 * migration TypeORM (`migrations` table) sehingga bisa revert.
 *
 * Keputusan yang dicatat (alasan lengkap di LEARN.md backend):
 * - PK `UUID DEFAULT gen_random_uuid()` — SCHEMA menulis `UUID / BIGINT`
 *   belum diputus; UUID dipilih (aman concurrency, sesuai arah §37/§40).
 * - Kolom `status` yang nilainya TAK dienumerasi SCHEMA = VARCHAR polos
 *   (tanpa CHECK) — nilai pasti menunggu database/business-rule aktual.
 *   Hanya 4 enum pasti yang diberi CHECK: customer.type, movement.type,
 *   return condition/action.
 * - Uang = NUMERIC(15,2); waktu = TIMESTAMPTZ.
 * - Trigger `set_updated_at` untuk tiap tabel ber-`updated_at`.
 * - `available_quantity` disimpan sebagai kolom (mengikuti SCHEMA §14) meski
 *   didefinisikan sebagai derivasi — engine ERP aktual yang memutuskan.
 * - `shipments.shipping_address_id` → FK ke customer_addresses dan
 *   `inventory_movements.created_by` → FK ke users: target tak disebut
 *   SCHEMA (konflik #3), dipilih yang paling masuk akal + komentar SQL.
 *
 * SENGAJA TIDAK DIMIGRATE (kondisional di SCHEMA, menunggu verifikasi ERP):
 * permissions + role_permissions, campaigns + campaign_products, audit... —
 * kecuali `audit_logs` yang field-nya lengkap dan diwajibkan ARCHITECTURE §20.
 * Ditunda: invoices (§38), files (§37.7). Kolom `slug`: nol tabel
 * mendefinisikannya — tidak ditambahkan.
 */
export class InitPasarPianSchema1791321600000 implements MigrationInterface {
  name = 'InitPasarPianSchema1791321600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Urutan CREATE mengikuti dependensi FK: master dulu, transaksi belakangan.
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL UNIQUE,
        description TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        role_id UUID NOT NULL REFERENCES roles(id),
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_users_role_id ON users(role_id);
    `);

    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_code VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL CHECK (type IN ('INDIVIDUAL', 'INSTITUTION')),
        email VARCHAR NULL,
        phone VARCHAR NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE customer_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        label VARCHAR NULL,
        address TEXT NOT NULL,
        city VARCHAR NULL,
        province VARCHAR NULL,
        postal_code VARCHAR NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE
      );
      CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
    `);

    await queryRunner.query(`
      CREATE TABLE product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL UNIQUE,
        description TEXT NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES product_categories(id),
        product_code VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        description TEXT NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_products_category_id ON products(category_id);
    `);

    await queryRunner.query(`
      CREATE TABLE product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id),
        sku VARCHAR NOT NULL UNIQUE,
        size VARCHAR NULL,
        color VARCHAR NULL,
        variant_name VARCHAR NULL,
        price NUMERIC(15, 2) NOT NULL,
        cost NUMERIC(15, 2) NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
    `);

    await queryRunner.query(`
      CREATE TABLE sales_channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL UNIQUE,
        type VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        address TEXT NULL,
        city VARCHAR NULL,
        province VARCHAR NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR NOT NULL UNIQUE,
        customer_id UUID NOT NULL REFERENCES customers(id),
        sales_channel_id UUID NOT NULL REFERENCES sales_channels(id),
        order_date TIMESTAMPTZ NOT NULL,
        status VARCHAR NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL,
        total_amount NUMERIC(15, 2) NOT NULL,
        discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        shipping_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
        tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX idx_orders_channel_id ON orders(sales_channel_id);
      CREATE INDEX idx_orders_status ON orders(status);
    `);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        product_variant_id UUID NOT NULL REFERENCES product_variants(id),
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(15, 2) NOT NULL,
        discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        subtotal NUMERIC(15, 2) NOT NULL
      );
      CREATE INDEX idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX idx_order_items_variant_id ON order_items(product_variant_id);
    `);

    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        payment_date TIMESTAMPTZ NULL,
        amount NUMERIC(15, 2) NOT NULL,
        method VARCHAR NULL,
        status VARCHAR NOT NULL,
        reference VARCHAR NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_payments_order_id ON payments(order_id);
    `);

    await queryRunner.query(`
      CREATE TABLE inventories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        product_variant_id UUID NOT NULL REFERENCES product_variants(id),
        quantity INTEGER NOT NULL,
        reserved_quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_inventories_warehouse_variant UNIQUE (warehouse_id, product_variant_id)
      );
      COMMENT ON COLUMN inventories.available_quantity IS
        'Disimpan sebagai kolom mengikuti SCHEMA #14, meski didefinisikan sebagai Fisik - Reservasi. Engine ERP aktual yang memutuskan kebenaran.';
    `);

    await queryRunner.query(`
      CREATE TABLE inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        product_variant_id UUID NOT NULL REFERENCES product_variants(id),
        type VARCHAR NOT NULL CHECK (type IN (
          'RECEIVE', 'RESERVE', 'RELEASE', 'PICK', 'SHIP',
          'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE'
        )),
        quantity INTEGER NOT NULL,
        reference_type VARCHAR NULL,
        reference_id UUID NULL,
        notes TEXT NULL,
        created_by UUID NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      COMMENT ON COLUMN inventory_movements.reference_id IS
        'Polimorfik tanpa FK (mengikuti SCHEMA #15); integritas dijamin service layer.';
      COMMENT ON COLUMN inventory_movements.created_by IS
        'Target FK tak disebut SCHEMA (konflik #3); dipetakan ke users mengikuti pola audit_logs.user_id.';
      CREATE INDEX idx_movements_warehouse_id ON inventory_movements(warehouse_id);
      CREATE INDEX idx_movements_variant_id ON inventory_movements(product_variant_id);
      CREATE INDEX idx_movements_type ON inventory_movements(type);
    `);

    await queryRunner.query(`
      CREATE TABLE fulfillments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fulfillment_number VARCHAR NOT NULL UNIQUE,
        order_id UUID NOT NULL REFERENCES orders(id),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_fulfillments_order_id ON fulfillments(order_id);
      CREATE INDEX idx_fulfillments_warehouse_id ON fulfillments(warehouse_id);
    `);

    await queryRunner.query(`
      CREATE TABLE fulfillment_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fulfillment_id UUID NOT NULL REFERENCES fulfillments(id),
        order_item_id UUID NOT NULL REFERENCES order_items(id),
        quantity INTEGER NOT NULL,
        picked_quantity INTEGER NOT NULL DEFAULT 0,
        packed_quantity INTEGER NOT NULL DEFAULT 0,
        status VARCHAR NOT NULL
      );
      CREATE INDEX idx_fulfillment_items_fulfillment_id ON fulfillment_items(fulfillment_id);
    `);

    await queryRunner.query(`
      CREATE TABLE shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_number VARCHAR NOT NULL UNIQUE,
        order_id UUID NOT NULL REFERENCES orders(id),
        fulfillment_id UUID NULL REFERENCES fulfillments(id),
        courier VARCHAR NULL,
        tracking_number VARCHAR NULL,
        shipping_address_id UUID NULL REFERENCES customer_addresses(id),
        shipped_at TIMESTAMPTZ NULL,
        delivered_at TIMESTAMPTZ NULL,
        status VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      COMMENT ON COLUMN shipments.shipping_address_id IS
        'Target FK tak disebut SCHEMA (konflik #3); dipetakan ke customer_addresses sebagai satu-satunya tabel alamat.';
      CREATE INDEX idx_shipments_order_id ON shipments(order_id);
      CREATE INDEX idx_shipments_fulfillment_id ON shipments(fulfillment_id);
    `);

    await queryRunner.query(`
      CREATE TABLE shipment_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID NOT NULL REFERENCES shipments(id),
        status VARCHAR NOT NULL,
        location VARCHAR NULL,
        description TEXT NULL,
        occurred_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_tracking_shipment_id ON shipment_tracking(shipment_id);
    `);

    await queryRunner.query(`
      CREATE TABLE returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        return_number VARCHAR NOT NULL UNIQUE,
        order_id UUID NOT NULL REFERENCES orders(id),
        customer_id UUID NOT NULL REFERENCES customers(id),
        reason VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        refund_amount NUMERIC(15, 2) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_returns_order_id ON returns(order_id);
      CREATE INDEX idx_returns_customer_id ON returns(customer_id);
    `);

    await queryRunner.query(`
      CREATE TABLE return_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        return_id UUID NOT NULL REFERENCES returns(id),
        order_item_id UUID NOT NULL REFERENCES order_items(id),
        quantity INTEGER NOT NULL,
        condition VARCHAR NULL CHECK (condition IN ('GOOD', 'DAMAGED', 'DEFECTIVE', 'UNKNOWN')),
        action VARCHAR NULL CHECK (action IN ('RESTOCK', 'REPAIR', 'DISPOSE', 'REPLACE'))
      );
      CREATE INDEX idx_return_items_return_id ON return_items(return_id);
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NULL REFERENCES users(id),
        entity_type VARCHAR NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR NOT NULL,
        old_value JSONB NULL,
        new_value JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      COMMENT ON TABLE audit_logs IS
        'Di-migrate karena field lengkap di SCHEMA #26 dan diwajibkan ARCHITECTURE #20. Append-only: tanpa updated_at.';
      CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
    `);

    // Trigger updated_at: setiap UPDATE mengecap waktu tanpa campur tangan aplikasi.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const stamped = [
      'roles',
      'users',
      'customers',
      'product_categories',
      'products',
      'product_variants',
      'sales_channels',
      'warehouses',
      'orders',
      'payments',
      'inventories',
      'fulfillments',
      'shipments',
      'returns',
    ];
    for (const table of stamped) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const stamped = [
      'roles',
      'users',
      'customers',
      'product_categories',
      'products',
      'product_variants',
      'sales_channels',
      'warehouses',
      'orders',
      'payments',
      'inventories',
      'fulfillments',
      'shipments',
      'returns',
    ];
    for (const table of stamped) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at();`);

    // Kebalikan urutan CREATE agar FK tidak menghalangi DROP.
    const tables = [
      'audit_logs',
      'return_items',
      'returns',
      'shipment_tracking',
      'shipments',
      'fulfillment_items',
      'fulfillments',
      'inventory_movements',
      'inventories',
      'payments',
      'order_items',
      'orders',
      'warehouses',
      'sales_channels',
      'product_variants',
      'products',
      'product_categories',
      'customer_addresses',
      'customers',
      'users',
      'roles',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table};`);
    }
  }
}
