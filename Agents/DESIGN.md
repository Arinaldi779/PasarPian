# Home of Stasis — Design Specification

**Document Version:** 1.0  
**Status:** Design Foundation  
**Product:** Internal Operations Management System  
**Related Documents:**
- `PRD.md`
- `SCHEMA.md`

> Dokumen ini mendefinisikan prinsip, information architecture, user flow, interaction behavior, information hierarchy, dan design requirements.
>
> Dokumen ini **tidak menentukan visual UI secara final**. Layout, warna, typography, spacing, component styling, chart type, dan visual direction ditentukan saat proses UI/UX design.

---

# 1. Design Objective

Aplikasi harus membuat data ERP yang kompleks menjadi mudah dipahami dan digunakan oleh tim internal.

Tujuan utama design:

1. Mempermudah pekerjaan operasional.
2. Mempercepat pencarian informasi.
3. Mengurangi kesalahan input.
4. Membuat status bisnis mudah dipahami.
5. Membuat hubungan antar-data mudah ditelusuri.
6. Membantu management mendapatkan informasi penting dengan cepat.
7. Menampilkan informasi sesuai role pengguna.
8. Menghindari visualisasi yang hanya terlihat bagus tetapi tidak membantu pekerjaan.

---

# 2. Design Philosophy

## 2.1 Business First

UI harus mengikuti proses bisnis.

Bukan:

> "Kita punya tabel, jadi kita tampilkan tabel."

Tetapi:

> "User ingin menyelesaikan pekerjaan apa?"

---

# 2.2 Information Before Decoration

Prioritas design:

```text
Information
↓
Hierarchy
↓
Interaction
↓
Visual
```

Visual tidak boleh mengalahkan keterbacaan informasi.

---

# 2.3 Contextual Information

User harus dapat memahami konteks sebuah data.

Contoh ketika melihat Order:

```text
Order
↓
Customer
↓
Items
↓
Payment
↓
Fulfillment
↓
Shipment
```

User tidak seharusnya dipaksa membuka banyak halaman hanya untuk memahami kondisi satu order.

---

# 2.4 Progressive Disclosure

Informasi ditampilkan secara bertahap.

Level pertama:

> informasi paling penting.

Level berikutnya:

> detail.

Level berikutnya:

> histori / audit / metadata.

Tujuannya menghindari information overload.

---

# 2.5 Action-Oriented

Setiap halaman operasional harus menjawab:

> "Apa yang bisa dilakukan user di sini?"

Contoh:

Order yang:

```text
Pending
```

harus memberikan kemungkinan action yang relevan.

Order yang:

```text
Delivered
```

tidak boleh menampilkan action yang tidak relevan.

---

# 3. Target Users

Design harus mempertimbangkan:

### Management

Fokus:

- monitoring
- overview
- comparison
- exception
- decision making

### Operations

Fokus:

- processing
- updating
- monitoring
- resolving issues

### Warehouse

Fokus:

- picking
- packing
- fulfillment
- inventory

### Sales

Fokus:

- customer
- order
- sales performance

### Finance

Fokus:

- payment
- invoice
- outstanding
- reconciliation

### Marketing

Fokus:

- channel
- campaign
- product performance

---

# 4. Information Architecture

Struktur informasi harus mengikuti domain bisnis.

Logical structure:

```text
HOME
│
├── DASHBOARD
│
├── SALES
│   ├── Orders
│   ├── Customers
│   └── Sales Channels
│
├── PRODUCTS
│   ├── Products
│   ├── Categories
│   └── Variants / SKU
│
├── INVENTORY
│   ├── Stock
│   ├── Warehouses
│   └── Stock Movements
│
├── FULFILLMENT
│   ├── Fulfillments
│   ├── Picking
│   └── Packing
│
├── SHIPPING
│   ├── Shipments
│   └── Tracking
│
├── FINANCE
│   ├── Payments
│   ├── Outstanding
│   └── Refunds
│
├── RETURNS
│   └── Return Requests
│
├── MARKETING
│   ├── Campaigns
│   └── Performance
│
└── ADMIN
    ├── Users
    ├── Roles
    └── Permissions
```

Actual navigation dapat disederhanakan atau dikelompokkan kembali berdasarkan hasil UI/UX design.

---

# 5. Global Navigation Principle

Navigation harus membantu user menjawab:

> "Saya sekarang berada di bagian mana?"

dan:

> "Bagian apa yang dapat saya akses?"

Navigation harus mengikuti permission.

Contoh:

Warehouse user tidak perlu melihat seluruh finance functionality jika tidak memiliki permission.

---

# 6. Global Search

Jika diterapkan, global search harus dapat mencari entity penting.

Contoh:

```text
Order Number
Customer
SKU
Product
Shipment Number
Tracking Number
Invoice Number
```

Search result harus menunjukkan entity type agar user tidak bingung.

Contoh:

```text
ORD-00123
Order

Airy Pro+ Standard
Product

JNE123456789
Shipment
```

---

# 7. Entity Navigation

Data harus dapat ditelusuri antar-entity.

Contoh:

Dari Customer:

```text
Customer
↓
Orders
↓
Order Detail
↓
Fulfillment
↓
Shipment
```

Dari Product:

```text
Product
↓
Variants
↓
Inventory
↓
Orders
↓
Sales
```

Dari Order:

```text
Order
↓
Customer
↓
Items
↓
Payment
↓
Fulfillment
↓
Shipment
↓
Return
```

---

# 8. Dashboard Design Principle

Dashboard bukan sekadar kumpulan angka.

Dashboard harus menjawab:

1. Apa yang terjadi?
2. Seberapa besar?
3. Apakah normal?
4. Apakah ada masalah?
5. Apa yang membutuhkan perhatian?

Dashboard harus memprioritaskan:

```text
Critical Information
↓
Important Information
↓
Supporting Information
```

---

# 9. Dashboard Information Hierarchy

Dashboard dapat mengandung beberapa kategori informasi:

### Business Performance

- Revenue
- Orders
- Units Sold

### Inventory

- Available Stock
- Low Stock
- Out of Stock

### Fulfillment

- Pending
- Picking
- Packing
- Ready to Ship

### Shipping

- In Transit
- Delivered
- Delayed
- Failed

### Finance

- Paid
- Outstanding
- Overdue
- Refund

### Exceptions

- Low Stock
- Delayed Shipment
- Fulfillment Backlog
- Payment Overdue

Visual arrangement sepenuhnya ditentukan saat UI design.

---

# 10. KPI Principle

Setiap KPI harus mempunyai:

- definisi
- source data
- calculation
- time range
- optional comparison
- drill-down destination

Contoh:

```text
KPI:
Outstanding

Source:
Payments + Orders

Calculation:
Total Order Amount - Total Paid

Time:
Current period

Drill-down:
Outstanding transactions
```

Jangan membuat KPI yang tidak memiliki definisi jelas.

---

# 11. Filtering Principle

Filtering harus konsisten di seluruh sistem.

Common filters:

- Date
- Date Range
- Product
- Category
- SKU
- Customer
- Customer Type
- Sales Channel
- Warehouse
- Status

Filter hanya ditampilkan jika relevan dengan halaman.

---

# 12. Table Design Principle

Table digunakan ketika user perlu:

- membandingkan banyak data
- mencari data
- sorting
- filtering
- melakukan bulk operation
- membuka detail

Table harus memprioritaskan field yang paling penting.

Jangan menampilkan seluruh field database hanya karena field tersebut tersedia.

---

# 13. Detail Page Principle

Detail page harus menjawab:

> "Apa yang perlu saya ketahui tentang entity ini?"

Contoh Order Detail:

```text
Order Identity
↓
Customer
↓
Items
↓
Payment
↓
Fulfillment
↓
Shipment
↓
History
```

Tidak semua metadata database harus ditampilkan.

---

# 14. Status Design

Status harus mudah dikenali.

Status tidak boleh hanya bergantung pada warna.

Contoh:

```text
Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
```

Status harus dapat dibedakan melalui kombinasi:

- label
- visual indicator
- context

Warna hanya menjadi supplementary indicator.

---

# 15. Status Transition

UI harus menampilkan action berdasarkan status.

Contoh:

```text
Order: Pending

Available:
→ Confirm
→ Cancel
```

Setelah:

```text
Order: Confirmed

Available:
→ Process
→ Cancel
```

Setelah:

```text
Order: Delivered

Available:
→ View
→ Return
```

Action yang tidak valid tidak boleh tersedia sebagai action utama.

---

# 16. Workflow Visualization

Untuk workflow panjang, user harus dapat mengetahui:

```text
Current State
Previous State
Next Possible State
```

Contoh:

```text
Confirmed
   ↓
Processing  ← Current
   ↓
Packed
   ↓
Shipped
   ↓
Delivered
```

User tidak perlu menebak posisi transaksi dalam lifecycle.

---

# 17. Order Experience

Order merupakan salah satu entity utama.

Order detail harus memungkinkan user memahami:

```text
WHO
Customer

WHAT
Products / Items

HOW MUCH
Total / Payment

WHERE
Shipping Address

WHERE IS IT NOW
Fulfillment / Shipment

WHAT HAPPENED
History
```

---

# 18. Product Experience

Product detail harus memungkinkan user memahami:

```text
Product
↓
Variants
↓
SKU
↓
Price
↓
Inventory
↓
Sales
```

User harus dapat berpindah dari product ke variant dan inventory dengan mudah.

---

# 19. Inventory Experience

Inventory page harus membantu warehouse dan management menjawab:

> "Berapa barang yang tersedia?"

> "Di mana barang tersebut?"

> "SKU mana yang hampir habis?"

> "Mengapa stock berubah?"

Inventory detail dapat menyediakan:

```text
Current Stock
↓
Reserved
↓
Available
↓
Movement History
```

---

# 20. Fulfillment Experience

Fulfillment harus berorientasi pada pekerjaan warehouse.

User harus dapat mengetahui:

```text
What order?
↓
What items?
↓
How many?
↓
What has been picked?
↓
What has been packed?
↓
What remains?
```

Progress harus mudah dipahami.

---

# 21. Picking Experience

Picking harus meminimalkan kesalahan.

User harus dapat memverifikasi:

- SKU
- Product
- Variant
- Quantity
- Location jika tersedia

Quantity picked tidak boleh melebihi quantity yang diperbolehkan tanpa explicit override/business rule.

---

# 22. Packing Experience

Packing harus memperlihatkan:

- Order
- Items
- Quantity
- Package
- Weight/dimension jika tersedia
- Packing status

Setelah packing selesai, user harus dapat melanjutkan workflow ke shipping sesuai permission.

---

# 23. Shipping Experience

Shipment detail harus menjawab:

```text
What order?
Who receives?
Where?
Which courier?
Tracking number?
Current status?
Last update?
```

Tracking history harus mudah dipahami secara kronologis.

---

# 24. Payment Experience

Payment detail harus memperlihatkan:

```text
Order Total
Paid
Outstanding
Payment Status
Payment History
```

Untuk partial payment:

```text
Total
↓
Payment #1
↓
Payment #2
↓
Outstanding
```

Finance user harus dapat mengetahui transaksi mana yang belum selesai.

---

# 25. Return Experience

Return harus selalu memiliki hubungan dengan original order.

User harus dapat mengetahui:

```text
Original Order
↓
Returned Item
↓
Reason
↓
Inspection
↓
Decision
↓
Refund / Replacement
```

---

# 26. Exception-First Design

Sistem harus memberi perhatian khusus kepada data yang membutuhkan tindakan.

Contoh:

```text
Low Stock
Delayed Shipment
Overdue Payment
Fulfillment Backlog
Failed Delivery
Failed Payment
```

Exception tidak boleh tersembunyi di antara data normal.

---

# 27. Empty State

Setiap halaman harus memiliki kondisi empty state yang jelas.

Contoh:

Tidak ada order:

> No orders found.

Tidak ada hasil filter:

> No results match the current filters.

Tidak ada inventory:

> No inventory data available.

Empty state harus membedakan:

### Truly Empty

Belum ada data.

### Filtered Empty

Data ada tetapi tidak sesuai filter.

### Error

Data gagal dimuat.

---

# 28. Loading State

Loading harus memberikan feedback bahwa sistem sedang memproses.

Untuk data besar, gunakan loading yang tidak membuat seluruh aplikasi terasa berhenti.

---

# 29. Error State

Error harus menjelaskan:

1. Apa yang gagal.
2. Apakah data berhasil disimpan atau tidak.
3. Apa yang bisa dilakukan user.

Contoh:

```text
Failed to update order status.

The order was not changed.

Try again.
```

---

# 30. Confirmation Principle

Confirmation diperlukan untuk action yang:

- destructive
- irreversible
- financially significant
- memengaruhi banyak data

Contoh:

- Cancel Order
- Delete
- Refund
- Inventory Adjustment
- Bulk Update

Tidak semua action harus menggunakan confirmation.

---

# 31. Bulk Action

Bulk action dapat digunakan jika operational workload tinggi.

Contoh:

- update status beberapa order
- assign fulfillment
- export
- mark processed

Bulk action harus:

- jelas scope-nya
- menunjukkan jumlah item
- membutuhkan confirmation jika berisiko
- menangani partial failure

---

# 32. Form Design

Form harus mengikuti business workflow.

Form tidak boleh meminta user mengisi field yang sebenarnya dapat diperoleh dari entity lain.

Contoh:

Jika customer dipilih:

```text
Customer
↓
Customer Address
↓
Available Information
```

Data yang sudah diketahui sistem sebaiknya tidak diminta ulang.

---

# 33. Validation

Validation dibagi menjadi:

### Client Validation

Validasi UX cepat.

### Server Validation

Validasi business rule.

### Database Constraint

Validasi integritas data.

Ketiganya tidak boleh dianggap sama.

---

# 34. Destructive Actions

Action destructive harus dibedakan dari action normal.

Contoh:

-
# 34. Destructive Actions

Action destructive harus dibedakan dari action normal.

Contoh:

- Cancel Order
- Delete
- Refund
- Inventory Adjustment
- Bulk Update

Untuk soft delete, UI harus menjelaskan bahwa data tidak benar-benar dihapus dari database apabila mekanisme soft delete digunakan.

Contoh:

> Data akan dihapus dari tampilan aktif dan ditandai sebagai deleted.

Action destructive harus:

- menggunakan confirmation jika berisiko
- menjelaskan dampaknya
- mengikuti permission user
- menampilkan feedback setelah action selesai

---

# 35. Skeleton Loading State

Ketika halaman atau component sedang mengambil data dari API, UI harus menampilkan **Skeleton UI** apabila struktur data yang akan ditampilkan sudah diketahui.

Skeleton digunakan untuk:

- table rows
- cards
- KPI
- detail information
- list data
- dashboard widgets

Tujuan:

1. Memberikan feedback bahwa data sedang dimuat.
2. Mempertahankan struktur layout selama loading.
3. Mengurangi layout shift.
4. Membuat aplikasi terasa responsif tanpa menampilkan data palsu.

Contoh:

```text
Loading Order List

┌────────────────────────────────────────────┐
│ ████████  ████████  ███████  ██████████  │
│ ████████  ████████  ███████  ██████████  │
│ ████████  ████████  ███████  ██████████  │
└────────────────────────────────────────────┘
```

Skeleton tidak boleh digunakan untuk menyamarkan error. Jika request gagal, UI harus berpindah ke Error State.

Untuk action kecil yang hanya mengubah sebagian data, gunakan loading indicator lokal pada component/action tersebut jika lebih tepat daripada mengganti seluruh halaman dengan skeleton.

---

# 36. Data Loading & Lazy Loading

Data tidak boleh diambil seluruhnya hanya karena halaman memiliki akses terhadap entity tersebut.

Gunakan **lazy loading** untuk data yang belum diperlukan oleh user pada saat initial render.

Prinsip:

```text
Initial Page
    ↓
Load Critical Data
    ↓
Render UI
    ↓
User needs more data?
    ↓
Request Additional Data
```

Contoh:

Pada Order Detail:

```text
Initial
↓
Order + Customer + Summary

User membuka tab Payment
↓
Load Payment Data

User membuka tab Fulfillment
↓
Load Fulfillment Data

User membuka History
↓
Load History Data
```

Lazy loading digunakan untuk mengurangi request yang tidak diperlukan dan mencegah database/API menerima beban request berlebihan.

Lazy loading **bukan berarti menunda semua request**. Data yang benar-benar diperlukan untuk initial view tetap harus dimuat sejak awal.

---

# 37. Request Efficiency & Database Protection

Frontend dan backend harus dirancang agar tidak melakukan request berulang yang tidak diperlukan.

Rules:

- Jangan melakukan request yang sama berkali-kali tanpa alasan.
- Jangan melakukan polling agresif jika tidak diperlukan.
- Jangan mengambil seluruh dataset jika halaman hanya membutuhkan sebagian data.
- Gunakan pagination untuk dataset besar.
- Gunakan filtering dan sorting di server untuk dataset besar.
- Gunakan lazy loading untuk data sekunder.
- Hindari request setiap perubahan kecil pada input jika tidak diperlukan.
- Untuk search, gunakan mekanisme seperti debounce apabila request dilakukan berdasarkan input user.
- Dashboard harus meminta agregasi yang dibutuhkan, bukan seluruh tabel transaksi.

Tujuan utamanya:

```text
Efficient Request
        ↓
Efficient API
        ↓
Efficient Database Query
        ↓
Lower Database Load
```

Aplikasi harus mengoptimalkan jumlah dan ukuran request, bukan sekadar membuat UI terlihat cepat.

---

# 38. Data Fetching Feedback

Setiap proses pengambilan data harus memiliki state yang jelas:

```text
Idle
↓
Loading / Skeleton
↓
Success
```

atau:

```text
Idle
↓
Loading / Skeleton
↓
Error
```

Untuk data tambahan yang dimuat secara lazy:

```text
User requests section
↓
Local Loading
↓
Section Data
```

Jika data sebelumnya sudah berhasil dimuat dan sedang dilakukan refresh, UI sebaiknya mempertahankan data lama selama request berlangsung jika aman dilakukan, lalu memberikan indikator refresh yang sesuai.

---

# 39. Data Fetching and Interaction Principle

User interaction tidak boleh menyebabkan request yang tidak perlu.

Contoh yang harus dihindari:

```text
User membuka dropdown
↓
Request semua data database
```

Lebih baik:

```text
User membuka dropdown
↓
Request hanya data yang diperlukan
↓
Gunakan pagination/search jika dataset besar
```

Untuk halaman dengan banyak section/tab, jangan otomatis mengambil seluruh data setiap kali halaman dibuka apabila data tersebut belum diperlukan.

---

# 40. Performance Principle

Performance merupakan bagian dari design experience.

Design harus mempertimbangkan:

- perceived performance
- network usage
- API request count
- database load
- payload size
- rendering cost
- pagination
- lazy loading
- skeleton loading

Targetnya bukan hanya:

> "Halaman berhasil tampil."

Tetapi:

> "Halaman tampil dengan cepat, request efisien, dan user memahami apa yang sedang terjadi."

---

# 41. Responsive Design

Internal ERP primarily digunakan melalui desktop/laptop, tetapi layout harus tetap usable pada ukuran layar yang lebih kecil.

Responsive behavior harus menjaga:

- table usability
- form readability
- navigation clarity
- action accessibility
- hierarchy informasi

Untuk table yang terlalu lebar, gunakan horizontal scrolling atau alternatif responsive yang tetap mempertahankan informasi penting.

---

# 42. Accessibility

UI harus memperhatikan:

- keyboard navigation
- readable contrast
- visible focus state
- semantic HTML
- accessible labels
- meaningful button text
- status tidak hanya dibedakan berdasarkan warna

---

# 43. Design System Relationship

`DESIGN.md` mendefinisikan prinsip UX, information hierarchy, interaction behavior, loading behavior, dan performance-oriented UX.

Detail visual seperti:

- warna final
- typography final
- spacing token
- component styling
- iconography
- chart styling

dapat ditentukan dalam design system/UI implementation selama tetap mengikuti prinsip dokumen ini.

---

# 44. Design Review Checklist

Sebelum sebuah halaman dianggap selesai, periksa:

- Apakah user tahu tujuan halaman?
- Apakah informasi paling penting terlihat lebih dahulu?
- Apakah action yang tersedia sesuai status dan permission?
- Apakah loading state menggunakan skeleton ketika cocok?
- Apakah error state jelas?
- Apakah empty state membedakan truly empty dan filtered empty?
- Apakah data sekunder dimuat secara lazy jika tidak diperlukan pada initial view?
- Apakah request yang tidak perlu sudah dihindari?
- Apakah dataset besar menggunakan pagination/filtering?
- Apakah UI tetap usable pada layar kecil?
- Apakah status dapat dipahami tanpa bergantung pada warna?
- Apakah destructive action cukup jelas dan aman?

---

# 45. Design North Star

Setiap keputusan design harus dapat menjawab pertanyaan:

> **"Apakah design ini membantu user memahami kondisi bisnis dan menyelesaikan pekerjaannya dengan lebih cepat dan lebih aman?"**

Jika tidak, design tersebut harus dipertanyakan kembali.
