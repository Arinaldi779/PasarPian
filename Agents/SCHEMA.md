**\# Home of Stasis --- ERP Database Schema**

**\*\*Schema Version:\*\*** 1.0  

**\*\*Status:\*\*** Reference Schema  

**\*\*Purpose:\*\*** Reference untuk developer internal application  

**\*\*Database:\*\*** Existing ERP Database  

**\*\*UI/UX:\*\*** Tidak dibahas dalam dokumen ini

\> Catatan:

\>

\> Schema ini merepresentasikan struktur data ERP yang diasumsikan
diberikan kepada developer. Developer menggunakan schema sebagai source
of truth untuk memahami entity dan relationship.

\>

\> Nama tabel/field dapat disesuaikan dengan schema ERP aktual
perusahaan.

---

**\# 1. Schema Overview**

Domain utama:

\`\`\`text

PRODUCT

├── PRODUCT CATEGORY

├── PRODUCT VARIANT

├── SKU

└── PRICE

WAREHOUSE

├── INVENTORY

└── INVENTORY MOVEMENT

CUSTOMER

├── CUSTOMER ADDRESS

└── CUSTOMER TYPE

SALES CHANNEL

└── ORDER

ORDER

├── ORDER ITEM

├── PAYMENT

├── FULFILLMENT

├── SHIPMENT

└── RETURN

FULFILLMENT

└── FULFILLMENT ITEM

SHIPMENT

└── TRACKING

RETURN

└── RETURN ITEM

MARKETING

└── CAMPAIGN

\`\`\`

---

**\# 2. Entity Relationship Overview**

Konsep relationship:

\`\`\`text

Customer

   │

   └──\< Order

           │

           ├──\< Order Item \>── Product Variant

           │                         │

           │                         └── Product

           │

           ├──\< Payment

           │

           ├──── Fulfillment

           │          │

           │          └──\< Fulfillment Item

           │

           ├──── Shipment

           │

           └──\< Return

Warehouse

   │

   └──\< Inventory

             │

             └── Product Variant

Product

   │

   └──\< Product Variant

\`\`\`

---

**\# 3. users**

Menyimpan user internal aplikasi.

**\## Fields**

\| Field \| Type \| Constraint \| Description \|

\|---\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \| User identifier \|

\| name \| VARCHAR \| NOT NULL \| User name \|

\| email \| VARCHAR \| UNIQUE \| Login email \|

\| password_hash \| VARCHAR \| NOT NULL \| Password hash \|

\| role_id \| FK \| NOT NULL \| User role \|

\| status \| ENUM \| NOT NULL \| User status \|

\| created_at \| TIMESTAMP \| NOT NULL \| Creation time \|

\| updated_at \| TIMESTAMP \| NOT NULL \| Last update \|

Relationship:

\`\`\`text

roles 1 ──── N users

\`\`\`

---

**\# 4. roles**

Menyimpan role user.

Contoh:

\`\`\`text

MANAGEMENT

OPERATIONS

WAREHOUSE

SALES

FINANCE

MARKETING

ADMIN

\`\`\`

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| name \| VARCHAR \| UNIQUE \|

\| description \| TEXT \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

---

**\# 5. permissions**

Menyimpan permission jika ERP mendukung permission-level authorization.

Contoh:

\`\`\`text

order.read

order.update

inventory.read

inventory.adjust

payment.read

payment.create

fulfillment.update

shipment.update

report.read

\`\`\`

Relationship:

\`\`\`text

roles N ──── N permissions

\`\`\`

---

**\# 6. customers**

Menyimpan customer.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| customer_code \| VARCHAR \| UNIQUE \|

\| name \| VARCHAR \| NOT NULL \|

\| type \| ENUM \| NOT NULL \|

\| email \| VARCHAR \| NULL \|

\| phone \| VARCHAR \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Customer type:

\`\`\`text

INDIVIDUAL

INSTITUTION

\`\`\`

Relationship:

\`\`\`text

customers 1 ──── N orders

customers 1 ──── N payments

\`\`\`

---

**\# 7. customer_addresses**

Menyimpan alamat customer.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| customer_id \| FK \| NOT NULL \|

\| label \| VARCHAR \| NULL \|

\| address \| TEXT \| NOT NULL \|

\| city \| VARCHAR \| NULL \|

\| province \| VARCHAR \| NULL \|

\| postal_code \| VARCHAR \| NULL \|

\| is_default \| BOOLEAN \| NOT NULL \|

Relationship:

\`\`\`text

customer 1 ──── N customer_addresses

\`\`\`

---

**\# 8. product_categories**

Menyimpan kategori product.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| name \| VARCHAR \| UNIQUE \|

\| description \| TEXT \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

category 1 ──── N products

\`\`\`

---

**\# 9. products**

Menyimpan master product.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| category_id \| FK \| NOT NULL \|

\| product_code \| VARCHAR \| UNIQUE \|

\| name \| VARCHAR \| NOT NULL \|

\| description \| TEXT \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

category 1 ──── N products

product 1 ──── N product_variants

\`\`\`

---

**\# 10. product_variants**

Menyimpan variasi product.

Contoh:

\`\`\`text

Product:

Airy Pro+ Standard

Variant:

Black / M

Black / L

Navy / M

Navy / L

\`\`\`

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| product_id \| FK \| NOT NULL \|

\| sku \| VARCHAR \| UNIQUE \|

\| size \| VARCHAR \| NULL \|

\| color \| VARCHAR \| NULL \|

\| variant_name \| VARCHAR \| NULL \|

\| price \| DECIMAL \| NOT NULL \|

\| cost \| DECIMAL \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

product 1 ──── N product_variants

product_variant 1 ──── N order_items

product_variant 1 ──── N inventory

product_variant 1 ──── N inventory_movements

\`\`\`

---

**\# 11. sales_channels**

Menyimpan sumber penjualan.

Contoh:

\`\`\`text

WEBSITE

MARKETPLACE

TIKTOK_SHOP

SOCIAL_COMMERCE

DIRECT

INSTITUTIONAL

\`\`\`

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| name \| VARCHAR \| UNIQUE \|

\| type \| ENUM \| NOT NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

sales_channel 1 ──── N orders

\`\`\`

---

**\# 12. orders**

Menyimpan transaksi order.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| order_number \| VARCHAR \| UNIQUE \|

\| customer_id \| FK \| NOT NULL \|

\| sales_channel_id \| FK \| NOT NULL \|

\| order_date \| TIMESTAMP \| NOT NULL \|

\| status \| ENUM \| NOT NULL \|

\| subtotal \| DECIMAL \| NOT NULL \|

\| discount \| DECIMAL \| DEFAULT 0 \|

\| shipping_fee \| DECIMAL \| DEFAULT 0 \|

\| tax \| DECIMAL \| DEFAULT 0 \|

\| total_amount \| DECIMAL \| NOT NULL \|

\| notes \| TEXT \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

customer 1 ──── N orders

sales_channel 1 ──── N orders

order 1 ──── N order_items

order 1 ──── N payments

order 1 ──── N fulfillments

order 1 ──── N shipments

order 1 ──── N returns

\`\`\`

---

**\# 13. order_items**

Menyimpan item dalam order.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| order_id \| FK \| NOT NULL \|

\| product_variant_id \| FK \| NOT NULL \|

\| quantity \| INTEGER \| NOT NULL \|

\| unit_price \| DECIMAL \| NOT NULL \|

\| discount \| DECIMAL \| DEFAULT 0 \|

\| subtotal \| DECIMAL \| NOT NULL \|

Relationship:

\`\`\`text

order 1 ──── N order_items

product_variant 1 ──── N order_items

\`\`\`

---

**\# 14. payments**

Menyimpan pembayaran.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| order_id \| FK \| NOT NULL \|

\| payment_date \| TIMESTAMP \| NULL \|

\| amount \| DECIMAL \| NOT NULL \|

\| method \| VARCHAR / ENUM \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| reference \| VARCHAR \| NULL \|

\| notes \| TEXT \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

order 1 ──── N payments

\`\`\`

---

**\# 15. warehouses**

Menyimpan lokasi warehouse.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| code \| VARCHAR \| UNIQUE \|

\| name \| VARCHAR \| NOT NULL \|

\| address \| TEXT \| NULL \|

\| city \| VARCHAR \| NULL \|

\| province \| VARCHAR \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Contoh:

\`\`\`text

BDG-WH

Warehouse Bandung

\`\`\`

---

**\# 16. inventories**

Menyimpan kondisi inventory per warehouse dan SKU.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| warehouse_id \| FK \| NOT NULL \|

\| product_variant_id \| FK \| NOT NULL \|

\| quantity \| INTEGER \| NOT NULL \|

\| reserved_quantity \| INTEGER \| DEFAULT 0 \|

\| available_quantity \| INTEGER \| DEFAULT 0 \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

warehouse 1 ──── N inventories

product_variant 1 ──── N inventories

\`\`\`

Constraint konseptual:

\`\`\`text

UNIQUE(

    warehouse_id,

    product_variant_id

)

\`\`\`

---

**\# 17. inventory_movements**

Menyimpan histori perubahan inventory.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| warehouse_id \| FK \| NOT NULL \|

\| product_variant_id \| FK \| NOT NULL \|

\| type \| ENUM \| NOT NULL \|

\| quantity \| INTEGER \| NOT NULL \|

\| reference_type \| VARCHAR \| NULL \|

\| reference_id \| UUID / BIGINT \| NULL \|

\| notes \| TEXT \| NULL \|

\| created_by \| FK \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

Movement type:

\`\`\`text

RECEIVE

RESERVE

RELEASE

PICK

SHIP

RETURN

ADJUSTMENT

TRANSFER_IN

TRANSFER_OUT

DAMAGE

\`\`\`

---

**\# 18. fulfillments**

Menyimpan proses pemenuhan order.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| fulfillment_number \| VARCHAR \| UNIQUE \|

\| order_id \| FK \| NOT NULL \|

\| warehouse_id \| FK \| NOT NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

order 1 ──── N fulfillments

warehouse 1 ──── N fulfillments

fulfillment 1 ──── N fulfillment_items

\`\`\`

---

**\# 19. fulfillment_items**

Menyimpan item yang diproses dalam fulfillment.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| fulfillment_id \| FK \| NOT NULL \|

\| order_item_id \| FK \| NOT NULL \|

\| quantity \| INTEGER \| NOT NULL \|

\| picked_quantity \| INTEGER \| DEFAULT 0 \|

\| packed_quantity \| INTEGER \| DEFAULT 0 \|

\| status \| ENUM \| NOT NULL \|

---

**\# 20. shipments**

Menyimpan proses pengiriman.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| shipment_number \| VARCHAR \| UNIQUE \|

\| order_id \| FK \| NOT NULL \|

\| fulfillment_id \| FK \| NULL \|

\| courier \| VARCHAR \| NULL \|

\| tracking_number \| VARCHAR \| NULL \|

\| shipping_address_id \| FK \| NULL \|

\| shipped_at \| TIMESTAMP \| NULL \|

\| delivered_at \| TIMESTAMP \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

order 1 ──── N shipments

fulfillment 1 ──── N shipments

\`\`\`

---

**\# 21. shipment_tracking**

Menyimpan histori status shipment.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| shipment_id \| FK \| NOT NULL \|

\| status \| ENUM \| NOT NULL \|

\| location \| VARCHAR \| NULL \|

\| description \| TEXT \| NULL \|

\| occurred_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

shipment 1 ──── N shipment_tracking

\`\`\`

---

**\# 22. returns**

Menyimpan return order.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| return_number \| VARCHAR \| UNIQUE \|

\| order_id \| FK \| NOT NULL \|

\| customer_id \| FK \| NOT NULL \|

\| reason \| VARCHAR \| NOT NULL \|

\| status \| ENUM \| NOT NULL \|

\| refund_amount \| DECIMAL \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

Relationship:

\`\`\`text

order 1 ──── N returns

customer 1 ──── N returns

return 1 ──── N return_items

\`\`\`

---

**\# 23. return_items**

Menyimpan item yang dikembalikan.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| return_id \| FK \| NOT NULL \|

\| order_item_id \| FK \| NOT NULL \|

\| quantity \| INTEGER \| NOT NULL \|

\| condition \| ENUM \| NULL \|

\| action \| ENUM \| NULL \|

Condition:

\`\`\`text

GOOD

DAMAGED

DEFECTIVE

UNKNOWN

\`\`\`

Action:

\`\`\`text

RESTOCK

REPAIR

DISPOSE

REPLACE

\`\`\`

---

**\# 24. campaigns**

Jika ERP menyediakan marketing data.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| name \| VARCHAR \| NOT NULL \|

\| channel_id \| FK \| NULL \|

\| start_date \| DATE \| NULL \|

\| end_date \| DATE \| NULL \|

\| status \| ENUM \| NOT NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

\| updated_at \| TIMESTAMP \| NOT NULL \|

---

**\# 25. campaign_products**

Relasi campaign dengan product.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| campaign_id \| FK \| NOT NULL \|

\| product_id \| FK \| NOT NULL \|

Relationship:

\`\`\`text

campaign N ──── N products

\`\`\`

---

**\# 26. Audit Logs**

Jika ERP menyediakan audit logging.

**\## Fields**

\| Field \| Type \| Constraint \|

\|---\|---\|---\|

\| id \| UUID / BIGINT \| PK \|

\| user_id \| FK \| NULL \|

\| entity_type \| VARCHAR \| NOT NULL \|

\| entity_id \| UUID / BIGINT \| NOT NULL \|

\| action \| VARCHAR \| NOT NULL \|

\| old_value \| JSON \| NULL \|

\| new_value \| JSON \| NULL \|

\| created_at \| TIMESTAMP \| NOT NULL \|

Contoh action:

\`\`\`text

CREATE

UPDATE

DELETE

STATUS_CHANGE

PAYMENT

ADJUSTMENT

\`\`\`

---

**\# 27. Relationship Summary**

**\## Customer**

\`\`\`text

Customer

 ├── Orders

 ├── Addresses

 ├── Payments

 └── Returns

\`\`\`

**\## Product**

\`\`\`text

Product

 ├── Category

 ├── Variants

 └── Campaigns

\`\`\`

**\## Product Variant**

\`\`\`text

Product Variant

 ├── Order Items

 ├── Inventory

 └── Inventory Movements

\`\`\`

**\## Order**

\`\`\`text

Order

 ├── Customer

 ├── Sales Channel

 ├── Order Items

 ├── Payments

 ├── Fulfillments

 ├── Shipments

 └── Returns

\`\`\`

**\## Fulfillment**

\`\`\`text

Fulfillment

 ├── Order

 ├── Warehouse

 └── Fulfillment Items

\`\`\`

**\## Shipment**

\`\`\`text

Shipment

 ├── Order

 ├── Fulfillment

 └── Tracking History

\`\`\`

---

**\# 28. Important Data Rules**

**\## Order Total**

Secara konseptual:

\`\`\`text

Subtotal

\- Discount

\+ Shipping

\+ Tax

=

Total

\`\`\`

Namun jika ERP memiliki formula berbeda, formula ERP menjadi source of
truth.

---

**\# 29. Payment Calculation**

Konsep:

\`\`\`text

Total Paid

=

SUM(Payments)

\`\`\`

Kemudian:

\`\`\`text

Outstanding

=

Order Total - Total Paid

\`\`\`

Refund dan adjustment harus diperhitungkan sesuai business rule ERP.

---

**\# 30. Inventory Calculation**

Konsep dasar:

\`\`\`text

Available

=

Physical

\-

Reserved

\`\`\`

Namun apabila ERP memiliki inventory calculation engine sendiri,
aplikasi harus menggunakan hasil ERP.

---

**\# 31. Status Rules**

Status bukan sekadar label UI.

Status merepresentasikan state bisnis.

Contoh:

\`\`\`text

Order:

Pending

Confirmed

Processing

Shipped

Delivered

Cancelled

\`\`\`

Aplikasi harus mencegah invalid transition.

Contoh:

\`\`\`text

Delivered

→

Pending

\`\`\`

tidak boleh dilakukan kecuali business rule secara eksplisit
mengizinkannya.

---

**\# 32. Referential Integrity**

Foreign key harus tetap valid.

Contoh:

\`\`\`text

order.customer_id

\`\`\`

harus merujuk ke customer yang valid.

Contoh:

\`\`\`text

order_item.product_variant_id

\`\`\`

harus merujuk ke product variant yang valid.

---

**\# 33. Data Source Principle**

Database ERP merupakan source of truth.

Internal application:

\- membaca data ERP

\- memproses data sesuai business rule

\- menampilkan data

\- melakukan update jika user memiliki permission

\- tidak membuat duplicate source of truth

---

**\# 34. Developer Responsibilities terhadap Schema**

Developer harus memahami:

1\. Entity.

2\. Primary key.

3\. Foreign key.

4\. One-to-one relationship.

5\. One-to-many relationship.

6\. Many-to-many relationship.

7\. Nullable fields.

8\. Enum.

9\. Constraints.

10\. Lifecycle/status.

11\. Data ownership.

12\. Source of truth.

---

**\# 35. Schema Validation**

Sebelum implementasi fitur, developer harus memastikan:

\- entity yang diperlukan tersedia

\- relationship tersedia

\- field yang diperlukan tersedia

\- status tersedia

\- aggregation dapat dilakukan

\- permission dapat diterapkan

\- data historis dapat ditelusuri

Jika requirement membutuhkan data yang tidak tersedia:

\`\`\`text

Requirement

      ↓

Schema Check

      ↓

Data tersedia?

  ┌───┴───┐

 YES      NO

  ↓        ↓

Build    Identify

         Dependency

\`\`\`

Developer tidak boleh diam-diam membuat asumsi terhadap data yang tidak
tersedia.

---

**\# 36. Important Note**

Schema di dokumen ini merupakan **\*\*logical reference model\*\***.

Schema aktual perusahaan harus dianggap sebagai sumber kebenaran final.

Jika terdapat perbedaan antara dokumen ini dengan database yang
diberikan:

**\*\*DATABASE ERP AKTUAL \> SCHEMA DOKUMEN INI\*\***

Developer harus menyesuaikan implementation dengan schema aktual dan
business rules yang berlaku.

------------------------------------------------------------------------

# 37. Naming, Slug, File Storage, and Invoice Rules

## 37.1 Technical ID vs Business Identifier vs Slug

The application distinguishes three concepts:

### Technical ID

Primary key used internally by the database and application.

Examples:

``` text
UUID / ULID
```

Technical IDs are not required to be human-readable.

### Business Identifier

Human-readable identifier used by business users.

Examples:

``` text
INV-2026-001
ORD-2026-001
FUL-2026-001
SHP-2026-001
```

Business identifiers must be unique within their business scope.

### Slug

Slug is a human-readable representation of an entity name.

Example:

``` text
name = "Airy Pro+ Standard"
slug = "airy-pro-standard"
```

Slug is intended for:

-   clean URL parameters
-   human-readable URLs
-   readable resource references where appropriate
-   search/navigation support

Slug is **not** the primary key and is **not** the storage filename.

Only entities that actually need human-readable URL/resource references
should have a slug.

Example:

``` text
/products/airy-pro-standard
```

is preferred over exposing a technical ID when the use case requires a
readable URL.

If the entity name changes, the application must follow the applicable
slug update policy. Existing URLs must not be broken accidentally.

------------------------------------------------------------------------

## 37.2 Invoice Number

Invoice number is a business identifier and must be stored separately
from the technical primary key.

Example:

``` text
id              = UUID / ULID
invoice_number  = INV-2026-001
```

Expected sequence:

``` text
INV-2026-001
INV-2026-002
INV-2026-003
...
```

The invoice number is generated by the backend/business layer.

The application must not determine the next invoice number using an
unsafe pattern such as:

``` text
SELECT latest invoice
+
1
```

without concurrency protection.

Two users creating invoices at the same time must never receive the same
invoice number.

Invoice number generation must use a database-safe strategy such as a
sequence, locked counter, or equivalent transactional mechanism
appropriate to the actual ERP database.

The exact invoice numbering format remains subject to the actual ERP
business rule.

------------------------------------------------------------------------

## 37.3 File Storage Principle

Uploaded files are stored in file/object storage, not as the primary
binary content inside PostgreSQL.

The database stores file metadata and the storage identifier/path.

Conceptually:

``` text
React
  ↓
NestJS
  ↓
Validate Upload
  ↓
Process File
  ↓
Storage
  ↓
File Metadata → PostgreSQL
```

The frontend must not depend on the internal filesystem structure.

------------------------------------------------------------------------

## 37.4 File Naming

Original user filenames must not be used directly as the physical
storage filename.

Recommended physical filename:

``` text
{UUID}-images-{uniqueID}.webp
```

or for documents:

``` text
{UUID}-documents-{uniqueID}.pdf
```

The unique portion must prevent collisions.

Example:

``` text
01K8ABC123-images-01K8XYZ789.webp
```

The physical filename is a storage concern, not a display name.

The original filename may still be retained as metadata when useful for
user-facing download/display purposes.

------------------------------------------------------------------------

## 37.5 File Storage Structure

Storage should be organized by business domain/entity.

Example:

``` text
storage/
├── products/
│   └── {productId}/
│       └── images/
│           └── {storageName}.webp
│
├── customers/
│   └── {customerId}/
│       └── documents/
│           └── {storageName}.pdf
│
├── orders/
│   └── {orderId}/
│       ├── images/
│       │   └── {storageName}.webp
│       └── documents/
│           └── {storageName}.pdf
│
└── returns/
    └── {returnId}/
        └── documents/
            └── {storageName}.pdf
```

The exact storage provider may change without requiring a frontend
architecture change.

Possible implementations include local/private storage, object storage,
or another compatible storage service.

------------------------------------------------------------------------

## 37.6 Image Upload Conversion

For supported image uploads:

``` text
JPG
JPEG
PNG
   ↓
Backend validation
   ↓
Image processing
   ↓
WebP
   ↓
Storage
```

The original JPG/JPEG/PNG file should not be used as the canonical
stored image when the application policy requires WebP conversion.

The database should record the resulting storage representation, for
example:

``` text
mime_type = image/webp
storage_name = 01K8ABC123-images-01K8XYZ789.webp
```

The backend must validate file type, MIME type, file size, and other
applicable upload security rules before processing.

File extension alone must never be treated as sufficient security
validation.

------------------------------------------------------------------------

## 37.7 File Metadata

A generic file/attachment metadata entity may contain:

``` text
files
├── id
├── entity_type
├── entity_id
├── original_name
├── storage_name
├── storage_path
├── mime_type
├── file_size
├── created_by
└── created_at
```

Conceptual meaning:

  Field             Purpose
  ----------------- ----------------------------------------
  `id`              Technical file identifier
  `entity_type`     Business entity owning the file
  `entity_id`       ID of the owning entity
  `original_name`   Original filename supplied by the user
  `storage_name`    Actual generated storage filename
  `storage_path`    Storage location/reference
  `mime_type`       Actual stored file type
  `file_size`       Stored file size
  `created_by`      User who uploaded the file
  `created_at`      Upload timestamp

The actual ERP schema remains authoritative. If the ERP already has a
document/attachment table, the application must use that instead of
creating a duplicate source of truth.

------------------------------------------------------------------------

## 37.8 File Retrieval

React must not construct or assume an internal filesystem path.

Preferred conceptual flow:

``` text
React
  ↓
GET /orders/{id}
  ↓
NestJS
  ↓
Resolve authorized file/resource URL
  ↓
React receives URL/path
  ↓
<img src={imageUrl} />
```

For example, the API may return:

``` json
{
  "id": "01K8...",
  "imageUrl": "/storage/orders/01K8.../01K8ABC-images-01K8XYZ.webp"
}
```

React then uses the returned value:

``` tsx
<img src={order.imageUrl} alt={order.name} />
```

The exact URL structure is an API/storage implementation detail.

------------------------------------------------------------------------

## 37.9 File Security

File access must respect authorization.

Rules:

-   private business documents must not automatically become public
-   backend must validate whether the current user can access the file
-   upload MIME/type and size must be validated
-   generated storage names must not trust user input
-   secrets and internal storage credentials must not be exposed to
    React
-   storage implementation may be changed without changing business
    entities

------------------------------------------------------------------------

# 38. Schema Extension: Invoices

If the ERP has a dedicated invoice entity, the logical reference model
is:

## invoices

Stores invoices generated from business transactions.

### Fields

  Field            Type            Constraint   Description
  ---------------- --------------- ------------ -------------------------------
  id               UUID / BIGINT   PK           Technical invoice identifier
  invoice_number   VARCHAR         UNIQUE       Human-readable invoice number
  order_id         FK              NOT NULL     Related order
  invoice_date     TIMESTAMP       NOT NULL     Invoice creation/issue date
  status           ENUM            NOT NULL     Invoice status
  subtotal         DECIMAL         NOT NULL     Invoice subtotal
  discount         DECIMAL         DEFAULT 0    Discount
  tax              DECIMAL         DEFAULT 0    Tax
  total_amount     DECIMAL         NOT NULL     Final invoice total
  created_at       TIMESTAMP       NOT NULL     Creation time
  updated_at       TIMESTAMP       NOT NULL     Last update

Relationship:

``` text
order 1 ──── N invoices
```

If the actual ERP uses one invoice per order, that relationship should
be changed to one-to-one according to the actual database.

The actual ERP schema remains the final source of truth.

------------------------------------------------------------------------

# 39. Schema Design Principles Added for ERP 1

## 39.1 Do Not Store Derived UI URLs as Business Data

A frontend URL such as:

``` text
/products/airy-pro-standard
```

is not the same thing as the product's technical identity.

The database stores the entity data and slug where required. The
frontend/router constructs or consumes the URL according to the API
contract.

## 39.2 Do Not Expose Storage Internals

React should consume an API-provided URL/resource reference rather than
assuming:

``` text
storage/orders/...
```

as an internal filesystem contract.

This keeps the frontend independent from the storage implementation.

## 39.3 Do Not Duplicate ERP Source of Truth

Before adding a table such as:

``` text
files
invoices
```

the developer must verify whether the actual ERP database already
provides an equivalent entity.

If an equivalent table exists, use the existing ERP table instead of
creating a duplicate.

------------------------------------------------------------------------

# 40. Final Data Identity Rule

The application uses the following distinction:

``` text
Technical Identity
    ↓
UUID / ULID

Business Identity
    ↓
INV-2026-001
ORD-2026-001
SKU-001

Human-readable Reference
    ↓
slug
airy-pro-standard

Storage Identity
    ↓
01K8ABC123-images-01K8XYZ789.webp
```

These identifiers serve different purposes and must not be treated as
interchangeable.

------------------------------------------------------------------------

# 41. Final Source-of-Truth Rule

Priority order:

``` text
ACTUAL ERP DATABASE
        ↓
ACTUAL ERP BUSINESS RULE
        ↓
SCHEMA.md
        ↓
ARCHITECTURE.md
        ↓
IMPLEMENTATION
```

If implementation assumptions conflict with the actual ERP database or
business rule, the developer must stop, identify the conflict, and
resolve it before silently introducing a new data model.
