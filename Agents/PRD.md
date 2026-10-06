**\# Product Requirements Document**

**\# Home of Stasis --- Internal Operations Management System**

**\*\*Version:\*\*** 1.1  

**\*\*Status:\*\*** Draft  

**\*\*Company:\*\*** Home of Stasis  

**\*\*System Type:\*\*** Internal Web Application  

**\*\*Primary Users:\*\*** Management, Operations, Warehouse, Sales,
Finance, Marketing, Admin  

**\*\*Database:\*\*** Existing application Database

---

**\# 1. Product Overview**

PasarPian adalah marketplace yang mempertemukan pembeli dan penjual,
dengan identitas lokal Banua dan pengalaman belanja yang sederhana,
aman, dan modern.

Aplikasi menjadi platform transaksi marketplace yang menangani katalog,
toko, keranjang, checkout, pembayaran, pesanan, pengiriman, dan
aktivitas pengguna.

application database tetap menjadi **\*\*source of truth\*\***.

Aplikasi bertanggung jawab untuk:

\- membaca data application,

\- menampilkan data secara terstruktur,

\- menjalankan business workflow,

\- menyediakan operational monitoring,

\- menyediakan dashboard dan reporting,

\- melakukan update terhadap data application apabila user memiliki
permission,

\- menjaga auditability dan security.

Aplikasi tidak meniru marketplace lain secara visual maupun struktural.
Product experience dan design system dibuat sendiri dengan identitas
PasarPian.

---

\*\*# 1.1 Brand Identity

**Brand:** PasarPian

**Positioning:** Local-first marketplace untuk urang Banua.

**Brand character:** - modern - friendly - local - trustworthy - simple

**Brand principle:**

> PasarPian mengambil inspirasi dari budaya dan bahasa lokal Banjar
> tanpa membuat usability bergantung pada pemahaman bahasa Banjar.

Bahasa Indonesia tetap menjadi bahasa utama interface. Sentuhan Banjar
dapat digunakan pada brand, tagline, microcopy, dan konteks lokal secara
terukur.

Contoh positioning:

``` text
PasarPian
Pasar urang Banua, gasan pian.
```

## Originality Principle

PasarPian tidak dirancang sebagai clone marketplace tertentu.

Pola umum seperti katalog, cart, checkout, payment, order, dan shipment
boleh digunakan karena merupakan konsep umum marketplace. Namun:

-   brand harus original;
-   visual identity harus original;
-   layout tidak boleh sengaja meniru marketplace tertentu;
-   microcopy harus original;
-   component styling harus mengikuti design system PasarPian;
-   interaction flow boleh menggunakan best practice umum tetapi tidak
    menyalin implementasi proprietary marketplace lain.

# 2. Product Vision\*\*

PasarPian harus memberikan satu tempat bagi customer dan seller untuk
melakukan aktivitas marketplace utama:

\> Apa yang ingin dibeli, siapa yang menjualnya, bagaimana proses
pembayarannya, dan bagaimana pesanan sampai ke customer.

Sistem harus membantu setiap department melihat informasi yang relevan
dengan tanggung jawabnya.

Management membutuhkan visibility.

Operations membutuhkan workflow monitoring.

Warehouse membutuhkan inventory dan fulfillment visibility.

Sales membutuhkan order dan customer visibility.

Finance membutuhkan payment dan outstanding visibility.

Marketing membutuhkan sales channel dan campaign visibility.

---

**\# 3. Problems**

Sistem dibuat untuk mengatasi beberapa masalah utama:

\- data operasional tersebar,

\- sulit mengetahui kondisi order secara real-time,

\- inventory sulit dimonitor,

\- fulfillment backlog sulit diketahui,

\- shipment sulit dimonitor,

\- payment dan outstanding sulit dipantau,

\- informasi antar department tidak terintegrasi dengan baik,

\- historical operational data sulit dianalisis,

\- bottleneck operasional sulit ditemukan,

\- management membutuhkan dashboard untuk decision making.

---

**\# 4. Product Goals**

**\## 4.1 Marketplace Visibility**

Memberikan visibility terhadap katalog, toko, pesanan, pembayaran, dan
aktivitas marketplace.

**\## 4.2 Seller and Admin Visibility**

Seller dan admin dapat memahami kondisi bisnis dan operasional tanpa
proses manual yang tidak perlu.

**\## 4.3 Shopping Decision Support**

Informasi produk, harga, toko, stok, dan pesanan membantu customer
mengambil keputusan pembelian.

**\## 4.4 Transaction Workflow**

Customer dan seller dapat mengikuti lifecycle transaksi dari checkout
sampai selesai.

**\## 4.5 Data Integrity**

Data harus mengikuti relationship, constraint, permission, dan business
rule marketplace.

**\## 4.6 Auditability**

Perubahan penting terhadap data dan transaksi harus dapat ditelusuri.

**\## 4.7 Secure Access**

Akses terhadap fungsi seller/admin hanya diberikan kepada user yang
terautentikasi dan memiliki role/permission yang sesuai.

---

**\# 5. Non-Goals**

Sistem tidak bertujuan untuk:

\- menggantikan application database,

\- membuat duplicate source of truth,

\- mendesain ulang database application secara keseluruhan,

\- membuat full accounting system,

\- membuat payroll system,

\- membuat HRIS,

\- menentukan UI/UX final,

\- menentukan framework frontend,

\- menentukan framework backend,

\- menentukan infrastructure/cloud provider.

---

**\# 6. Application Database**

Application database merupakan source of truth untuk data marketplace.

Developer harus memahami schema marketplace sebelum implementasi.

Developer harus memahami:

1\. Entity.

2\. Primary key.

3\. Foreign key.

4\. Relationship.

5\. Nullable fields.

6\. Enum.

7\. Constraints.

8\. Status.

9\. Lifecycle.

10\. Data ownership.

11\. Permission.

12\. Auditability.

Jika terdapat perbedaan antara PRD, reference schema, dan database
aktual:

\> DATABASE application AKTUAL \> REFERENCE SCHEMA \> ASUMSI DEVELOPER

Developer tidak boleh membuat asumsi terhadap data yang tidak tersedia.

---

**\# 7. User Roles**

Role utama:

\- MANAGEMENT

\- OPERATIONS

\- WAREHOUSE

\- SALES

\- FINANCE

\- MARKETING

\- ADMIN

Role menentukan akses terhadap fitur marketplace.

Permission dapat digunakan pada level lebih granular.

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

---

**\# 8. Authentication**

Sistem wajib menyediakan authentication.

User harus dapat melakukan:

\- login,

\- logout,

\- session management,

\- authentication failure handling.

**\## 8.1 Email and Password**

User dapat login menggunakan:

\`\`\`text

Email

Password

\`\`\`

Password tidak boleh disimpan sebagai plaintext.

Database harus menyimpan password dalam bentuk secure password hash.

Reference schema menyediakan:

\`\`\`text

users.password_hash

\`\`\`

**\## 8.2 Google OAuth**

User juga dapat melakukan authentication menggunakan Google OAuth.

Flow secara konseptual:

\`\`\`text

User

 ↓

Google Authentication

 ↓

OAuth Callback

 ↓

Identify User

 ↓

Validate User Access

 ↓

Create Application Session

 ↓

Authenticated User

\`\`\`

Google OAuth digunakan sebagai authentication mechanism.

Authorization tetap ditentukan oleh role dan permission aplikasi.

Google account tidak otomatis memberikan role tertentu.

**\## 8.3 Authentication Failure**

Sistem harus menangani:

\- incorrect email/password,

\- invalid credentials,

\- unauthorized account,

\- disabled account,

\- invalid OAuth response,

\- OAuth account yang belum terdaftar/diizinkan,

\- expired session.

Pesan error tidak boleh membocorkan informasi sensitif.

---

**\# 9. Authorization**

Authentication dan authorization harus dipisahkan.

Authentication menjawab:

\> Siapa user ini?

Authorization menjawab:

\> Apa yang boleh dilakukan user ini?

Permission harus diperiksa pada backend.

Frontend tidak boleh menjadi satu-satunya security layer.

Contoh:

\`\`\`text

User

 ↓

Role

 ↓

Permission

 ↓

Allowed Action

\`\`\`

---

**\# 10. User Account Management**

User internal dapat memiliki:

\- name,

\- email,

\- password credential,

\- role,

\- status.

User status digunakan untuk menentukan apakah account dapat digunakan.

Contoh:

\`\`\`text

ACTIVE

INACTIVE

SUSPENDED

\`\`\`

Status aktual harus mengikuti application database.

Admin/authorized user dapat mengelola account sesuai permission.

---

**\# 11. Email Notification**

Sistem harus dapat mengirim pemberitahuan melalui email kepada user
apabila terdapat event tertentu yang membutuhkan perhatian.

Email notification merupakan product capability.

Contoh event:

\- order membutuhkan tindakan,

\- payment berhasil,

\- payment membutuhkan verifikasi,

\- fulfillment mengalami masalah,

\- shipment mengalami status penting,

\- return membutuhkan tindakan,

\- account/security event,

\- operational alert.

Jenis event final harus mengikuti business requirement.

Email notification harus:

\- dikirim kepada recipient yang sesuai,

\- tidak mengandung informasi sensitif yang tidak diperlukan,

\- memiliki subject yang jelas,

\- memiliki isi yang menjelaskan event,

\- menangani kegagalan pengiriman,

\- tidak mengganggu workflow utama apabila email provider mengalami
masalah.

Detail provider email, SMTP, API provider, queue, retry mechanism, dan
infrastructure ditentukan pada Architecture.

---

**\# 12. Notification Principle**

Notification tidak boleh menggantikan system state.

Contoh:

\`\`\`text

Order Status

     ↓

Business Event

     ↓

Notification

\`\`\`

Email hanya memberitahukan event.

Source of truth tetap berada pada application/application state.

---

**\# 13. Product and Catalog Management**

Sistem harus mendukung informasi:

\- Product Category

\- Product

\- Product Variant

\- SKU

\- Price

\- Cost

\- Product Status

Product dapat memiliki beberapa variant.

Contoh:

\`\`\`text

Product

Airy Pro+ Standard

Variants

├── Black / M

├── Black / L

├── Navy / M

└── Navy / L

\`\`\`

---

**\# 14. Customer Management**

Customer dapat memiliki:

\- customer code,

\- name,

\- type,

\- email,

\- phone,

\- status,

\- addresses.

Customer type:

\`\`\`text

INDIVIDUAL

INSTITUTION

\`\`\`

Customer dapat memiliki banyak:

\- orders,

\- addresses,

\- payments,

\- returns.

---

**\# 15. Store and Seller**

Sistem harus dapat mengelola seller dan toko sebagai pihak yang
menyediakan produk.

Contoh:

\`\`\`text

WEBSITE

MARKETPLACE

TIKTOK_SHOP

SOCIAL_COMMERCE

DIRECT

INSTITUTIONAL

\`\`\`

---

**\# 16. Cart, Checkout, and Order Management**

Order memiliki:

\- order number,

\- customer,

\- sales channel,

\- order date,

\- status,

\- order items,

\- subtotal,

\- discount,

\- shipping fee,

\- tax,

\- total,

\- notes.

Order lifecycle harus mengikuti status application.

Contoh:

\`\`\`text

Pending

 ↓

Confirmed

 ↓

Processing

 ↓

Shipped

 ↓

Delivered

\`\`\`

Cancellation mengikuti business rule marketplace.

Invalid status transition harus dicegah.

---

**\# 17. Order Items**

Setiap order dapat memiliki banyak order item.

Order item memiliki:

\- product variant,

\- quantity,

\- unit price,

\- discount,

\- subtotal.

---

**\# 18. Payment Management**

Sistem harus menyediakan visibility terhadap payment.

Payment memiliki:

\- order,

\- payment date,

\- amount,

\- method,

\- status,

\- reference,

\- notes.

Secara konseptual:

\`\`\`text

Total Paid = SUM(Payments)

Outstanding = Order Total - Total Paid

\`\`\`

Namun formula application aktual menjadi source of truth.

---

**\# 19. Inventory Management**

Seller harus dapat mengelola inventory berdasarkan:

\- warehouse,

\- product variant,

\- quantity,

\- reserved quantity,

\- available quantity.

Konsep dasar:

\`\`\`text

Available

=

Physical

\-

Reserved

\`\`\`

Namun apabila application memiliki inventory calculation engine sendiri,
hasil application harus digunakan.

---

**\# 20. Inventory Movement**

Sistem harus dapat menelusuri perubahan inventory.

Movement dapat berupa:

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

Inventory movement harus dapat ditelusuri ke actor/reference apabila
tersedia.

---

**\# 21. Warehouse**

Warehouse memiliki:

\- code,

\- name,

\- address,

\- city,

\- province,

\- status.

Inventory terkait dengan warehouse.

---

**\# 22. Fulfillment**

Fulfillment digunakan untuk memproses order setelah pembayaran dan
sebelum shipment.

Flow:

\`\`\`text

Order

 ↓

Fulfillment

 ↓

Picking

 ↓

Packing

 ↓

Ready to Ship

\`\`\`

Fulfillment dapat memiliki:

\- fulfillment number,

\- order,

\- warehouse,

\- status,

\- fulfillment items.

---

**\# 23. Shipment**

Shipment digunakan untuk memonitor proses pengiriman.

Shipment memiliki:

\- shipment number,

\- order,

\- fulfillment,

\- courier,

\- tracking number,

\- shipping address,

\- shipped time,

\- delivered time,

\- status.

Tracking history harus dapat ditampilkan.

---

**\# 24. Return**

Return harus dapat dikaitkan dengan order dan customer.

Return memiliki:

\- return number,

\- order,

\- customer,

\- reason,

\- status,

\- refund amount,

\- return items.

Return item memiliki:

\- order item,

\- quantity,

\- condition,

\- action.

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

**\# 25. Marketing**

Apabila application menyediakan marketing data, sistem dapat
menampilkan:

\- campaigns,

\- campaign products,

\- campaign channel,

\- campaign period,

\- campaign status.

---

**\# 26. Dashboard**

Dashboard harus memberikan informasi yang relevan berdasarkan role.

Dashboard bukan sekadar kumpulan angka.

Dashboard harus membantu menjawab:

\`\`\`text

Apa yang terjadi?

Apa yang sedang berjalan?

Apa yang terlambat?

Apa yang bermasalah?

Apa yang membutuhkan tindakan?

\`\`\`

---

**\# 27. Marketplace KPI**

Admin dashboard dapat mencakup:

\- total orders,

\- order status distribution,

\- sales,

\- payment,

\- outstanding,

\- inventory,

\- fulfillment backlog,

\- shipment status,

\- return,

\- operational bottleneck,

\- performance berdasarkan periode,

\- performance berdasarkan sales channel.

KPI harus berasal dari data transaksi marketplace.

---

**\# 28. Seller Monitoring**

Seller dapat memonitor:

\- pending orders,

\- processing orders,

\- fulfillment backlog,

\- shipment backlog,

\- delayed shipment,

\- return,

\- operational exceptions.

---

**\# 29. Admin Monitoring**

Admin dapat memonitor:

\- inventory,

\- low stock,

\- reserved stock,

\- fulfillment queue,

\- picking,

\- packing,

\- inventory movement.

---

**\# 30. Payment Monitoring**

User dan admin yang berwenang dapat memonitor:

\- payments,

\- payment status,

\- total paid,

\- outstanding,

\- refund,

\- payment history.

---

**\# 31. Seller Sales Monitoring**

Seller dapat memonitor:

\- orders,

\- customers,

\- sales channel,

\- order status,

\- customer history,

\- sales performance.

---

**\# 32. Marketplace Discovery and Promotion**

Marketplace dapat menyediakan discovery dan promotion capability apabila
dibutuhkan:

\- campaign,

\- sales channel,

\- product performance,

\- campaign period,

\- campaign-related metrics apabila tersedia.

---

**\# 33. Reporting**

System harus dapat menghasilkan marketplace reports berdasarkan data
yang tersedia.

Report dapat difilter berdasarkan:

\- date range,

\- status,

\- warehouse,

\- product,

\- product variant,

\- customer,

\- sales channel,

\- payment,

\- shipment.

---

**\# 34. Search and Filtering**

Data operasional yang besar harus dapat dicari dan difilter.

Search/filter harus mengikuti field yang tersedia pada application.

System tidak boleh membuat filter terhadap data yang sebenarnya tidak
tersedia.

---

**\# 35. Soft Delete and Data Lifecycle**

Soft delete digunakan untuk data yang secara bisnis boleh dinonaktifkan
tetapi historical record tetap harus dipertahankan.

Soft delete **\*\*bukan berarti semua entity boleh dihapus secara soft
delete\*\***.

Business-critical transactional data seperti:

\- order,

\- payment,

\- shipment,

\- fulfillment,

\- inventory movement,

\- return,

pada dasarnya harus mempertahankan historical record.

Untuk data transactional, status seperti:

\`\`\`text

CANCELLED

VOID

REJECTED

\`\`\`

lebih tepat apabila business rule memang membutuhkan pembatalan daripada
penghapusan.

**\## 35.1 Soft Delete Requirement**

Untuk entity yang memang mendukung deletion:

\`\`\`text

Delete

 ↓

Soft Delete

 ↓

Record remains in database

 ↓

Normal application queries hide deleted record

\`\`\`

Permanent deletion hanya boleh dilakukan apabila secara eksplisit
diperbolehkan oleh business rule dan authorization.

**\## 35.2 Soft Delete Audit**

Soft delete harus dapat diketahui:

\- siapa yang melakukan,

\- kapan dilakukan,

\- entity apa yang dihapus,

\- record apa yang tapplicationengaruh.

Apabila schema marketplace mendukung audit log, perubahan tersebut harus
tercatat.

**\## 35.3 Restore**

Restore hanya tersedia untuk entity yang secara bisnis memang dapat
dipulihkan.

Restore membutuhkan permission yang sesuai.

---

**\# 36. Auditability**

Perubahan penting harus dapat ditelusuri.

Audit dapat mencatat:

\`\`\`text

CREATE

UPDATE

DELETE

STATUS_CHANGE

PAYMENT

ADJUSTMENT

\`\`\`

Audit log idealnya menyimpan:

\- user,

\- entity,

\- entity ID,

\- action,

\- old value,

\- new value,

\- timestamp.

Reference schema menyediakan audit log dengan struktur tersebut apabila
application mendukungnya.

---

**\# 37. Data Integrity**

System harus menjaga:

\- referential integrity,

\- valid foreign key,

\- valid status transition,

\- valid numeric calculation,

\- permission,

\- historical consistency.

Contoh:

\`\`\`text

order.customer_id

\`\`\`

harus mengarah ke customer yang valid.

---

**\# 38. Business Rules**

Status bukan sekadar label UI.

Status adalah state bisnis.

Contoh:

\`\`\`text

Delivered

    ↓

Pending

\`\`\`

tidak boleh dilakukan apabila business rule tidak mengizinkannya.

Business rule application menjadi source of truth.

---

**\# 39. Error Handling**

System harus menangani:

\- validation error,

\- authentication error,

\- authorization error,

\- database error,

\- business rule violation,

\- unavailable service,

\- email delivery failure,

\- invalid request.

User harus mendapatkan error message yang dapat dipahami.

Error tidak boleh membocorkan:

\- password,

\- secret,

\- API key,

\- database credentials,

\- internal security information.

---

**\# 40. Security**

System wajib menerapkan:

\- authentication,

\- authorization,

\- role-based access,

\- permission checking,

\- secure session,

\- password hashing,

\- input validation,

\- protection terhadap unauthorized access,

\- protection terhadap SQL injection,

\- protection terhadap script injection/XSS,

\- protection terhadap insecure data exposure,

\- secure handling of financial information.

Secret dan credential tidak boleh disimpan di source code.

---

**\# 41. Performance**

System harus mempertimbangkan:

\- efficient database queries,

\- pagination,

\- filtering,

\- indexing sesuai kebutuhan,

\- avoidance of N+1 queries,

\- efficient aggregation,

\- appropriate caching apabila dibutuhkan.

---

**\# 42. Acceptance Criteria**

Product dianggap memenuhi requirement apabila:

1\. User dapat login menggunakan email dan password.

2\. User dapat logout.

3\. User yang diizinkan dapat login menggunakan Google OAuth.

4\. Authorization berdasarkan role/permission berjalan.

5\. User tidak dapat mengakses resource tanpa permission.

6\. Password tidak disimpan sebagai plaintext.

7\. Event tertentu dapat menghasilkan email notification.

8\. Email failure tidak merusak transaction utama.

9\. Data yang mendukung deletion menggunakan soft delete sesuai business
rule.

10\. Transactional history tidak hilang karena delete biasa.

11\. Audit perubahan penting dapat ditelusuri.

12\. Order lifecycle mengikuti valid transition.

13\. Inventory mengikuti business rule marketplace.

14\. Payment dan outstanding mengikuti source of truth application.

15\. Referential integrity tetap terjaga.

16\. Dashboard menggunakan data application.

17\. Developer tidak membuat duplicate source of truth.

18\. Database aktual menjadi sumber kebenaran final apabila berbeda
dengan reference schema.

---

**\# 43. Development Principle**

Urutan pengembangan:

\`\`\`text

Business Requirement

        ↓

Understand application Schema

        ↓

Understand Relationships

        ↓

Understand Workflow

        ↓

Define Application Behavior

        ↓

Implement

        ↓

Validate

        ↓

Test

        ↓

Document

\`\`\`

Developer tidak boleh langsung membuat fitur hanya berdasarkan asumsi
UI.

---

**\# 44. Documentation Boundaries**

**\## PRD**

Menentukan:

\> WHAT dan WHY

**\## ARCHITECTURE**

Menentukan:

\> HOW system dibangun

**\## SCHEMA**

Menentukan:

\> HOW data direpresentasikan

**\## DESIGN_SYSTEM**

Menentukan:

\> HOW interface bapplicationerilaku dan terlihat

**\## AGENTS.md**

Menentukan:

\> HOW AI Agent bekerja di dalam project

---

**\# 45. Final Product Definition**

PasarPian adalah local-first marketplace yang menyediakan:

\- secure authentication,

\- role and permission based authorization,

\- operational monitoring,

\- product management,

\- customer management,

\- order management,

\- payment monitoring,

\- inventory management,

\- warehouse monitoring,

\- fulfillment monitoring,

\- shipment tracking,

\- return management,

\- marketing visibility,

\- reporting,

\- dashboard,

\- auditability,

\- soft-delete lifecycle untuk entity yang sesuai,

\- email notification,

\- dan centralized operational visibility.

application database tetap menjadi source of truth.

Aplikasi bertugas menyediakan operational experience di atas data
tersebut tanpa membuat duplicate source of truth.
