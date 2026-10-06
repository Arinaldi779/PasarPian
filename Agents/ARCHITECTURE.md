# Home of Stasis --- Architecture Specification

**Document Version:** 2.0\
**Status:** Architecture Foundation\
**Product:** Internal Operations Management System\
**Related Documents:** `PRD.md`, `DESIGN.md`, `SCHEMA.md`, `AGENTS.md`

## 1. Tujuan Arsitektur

Arsitektur Home of Stasis harus sederhana untuk ERP 1, mudah dipahami,
aman, maintainable, dan mampu berkembang ketika jumlah data serta fitur
bertambah.

Prinsip utama:

> Gunakan solusi paling sederhana yang memenuhi kebutuhan bisnis tanpa
> mengorbankan security, maintainability, performance, dan kemampuan
> sistem untuk berkembang.

## 2. System Architecture

``` text
React + TypeScript
        |
        | REST API / Axios
        v
NestJS Modular Monolith
        |
        | TypeORM
        v
PostgreSQL
```

Frontend dan backend adalah aplikasi terpisah. Backend menggunakan
**Modular Monolith** dengan module berdasarkan domain bisnis.

## 3. Technology Stack

### Frontend

-   React + TypeScript
-   React Router
-   Axios
-   Tailwind CSS
-   shadcn/ui
-   Lucide React
-   Framer Motion bila memang bermanfaat

### Backend

-   NestJS + TypeScript
-   REST API
-   JWT
-   httpOnly Cookie
-   bcrypt
-   DTO + strict validation
-   TypeORM
-   TypeORM Migrations
-   Nodemailer

### Database

-   PostgreSQL

### Export

-   CSV
-   Excel dengan library yang sesuai seperti SheetJS/xlsx
-   PDF resmi bisnis diprioritaskan dibuat di backend

### Payment

-   DOKU untuk integrasi payment ketika sudah diperlukan
-   Dummy payment selama development

## 4. Frontend Architecture

ERP 1 menggunakan **Layer-Based Architecture**:

``` text
src/
├── Pages/
├── Components/
├── Services/
├── Hooks/
├── Types/
├── Utils/
├── Layouts/
├── Routes/
├── Constants/
├── Styles/
└── App.tsx
```

Jangan memperkenalkan feature-based architecture atau abstraction besar
tanpa alasan dan persetujuan perubahan arsitektur.

### Responsibilities

-   **Pages**: screen utama dan orchestration UI.
-   **Components**: komponen reusable.
-   **Services**: komunikasi API berdasarkan domain, bukan satu service
    per page.
-   **Hooks**: reusable React hooks jika diperlukan.
-   **Types**: type/interface lintas aplikasi.
-   **Utils**: utility yang benar-benar generic.
-   **Routes**: React Router dan route protection.
-   **Constants**: nilai konstan.
-   **Styles**: global/custom CSS atau override yang tidak praktis
    dengan Tailwind.

Contoh service:

``` text
Services/
├── authService.ts
├── orderService.ts
├── customerService.ts
├── productService.ts
├── inventoryService.ts
├── fulfillmentService.ts
├── shipmentService.ts
├── paymentService.ts
├── returnService.ts
├── notificationService.ts
└── exportService.ts
```

## 5. Frontend Data Fetching

ERP 1 menggunakan pendekatan fundamental:

``` text
React
├── useState
├── useEffect
└── Axios
      ↓
NestJS API
      ↓
PostgreSQL
```

TanStack Query atau state-management abstraction lain tidak digunakan
sebagai default.

## 6. Backend Architecture

NestJS menggunakan **Modular Monolith + Domain-Based Modules**.

Contoh:

``` text
src/
├── auth/
├── users/
├── roles/
├── permissions/
├── customers/
├── products/
├── inventory/
├── orders/
├── invoices/
├── payments/
├── fulfillment/
├── shipments/
├── returns/
├── notifications/
├── files/
├── reports/
└── common/
```

Struktur dapat berkembang sesuai domain yang benar-benar diperlukan.

Contoh module:

``` text
orders/
├── orders.module.ts
├── orders.controller.ts
├── orders.service.ts
├── dto/
├── entities/
└── ...
```

### Controller

Menerima HTTP request dan menentukan endpoint. Controller bukan tempat
utama business logic.

### Service

Menangani business logic dan orchestration.

### DTO

DTO (**Data Transfer Object**) adalah bentuk data yang boleh masuk atau
keluar melalui API.

DTO bukan Entity. Create, Update, dan Response DTO boleh berbeda.

DTO mengikuti `SCHEMA.md` dan kontrak API aktual. Aturan validation
mengikuti `AGENTS.md`.

### Entity

Entity adalah mapping ORM TypeORM terhadap database, termasuk
relationship seperti `@OneToMany` dan `@ManyToOne`.

Entity tidak menggantikan migration.

### Migration

TypeORM Migration digunakan untuk perubahan schema database secara
eksplisit.

Gunakan:

``` text
TypeORM Migration
```

bukan:

``` text
synchronize: true
```

## 7. Database

Database menggunakan PostgreSQL.

Source of truth:

``` text
DATABASE ERP AKTUAL
        >
BUSINESS RULE ERP AKTUAL
        >
SCHEMA.md
```

Database aktual dan business rule aktual selalu lebih tinggi daripada
dokumentasi apabila terjadi perbedaan.

## 8. Entity, Relationship, dan Migration

Relationship ORM didefinisikan pada Entity, tetapi foreign key dan
constraint database harus benar-benar dibentuk melalui schema/migration.

``` text
Entity
↓
ORM mapping

Migration
↓
Database schema / FK / constraints
```

## 9. Authentication

Authentication menggunakan:

-   email/password
-   Google OAuth
-   JWT
-   httpOnly Cookie
-   bcrypt

Alur:

``` text
Login
↓
Validate credentials
↓
Generate JWT
↓
Set httpOnly Cookie
↓
Authenticated request
↓
Validate JWT
```

JWT tidak disimpan di `localStorage` sebagai mekanisme utama
authentication.

## 10. Authorization

Authorization menggunakan custom:

``` text
Role + Permission
```

Contoh role:

-   MANAGEMENT
-   OPERATIONS
-   WAREHOUSE
-   SALES
-   FINANCE
-   MARKETING
-   ADMIN

Backend adalah enforcement utama. Frontend hanya membantu UX.

## 11. REST API Convention

API menggunakan REST.

Default CRUD resource:

``` text
GET    /orders
GET    /orders/:id
POST   /orders
PATCH  /orders/:id
DELETE /orders/:id
```

  -----------------------------------------------------------------------
  Method                              Tujuan
  ----------------------------------- -----------------------------------
  GET                                 mengambil data

  POST                                mengirim request untuk diproses;
                                      sering digunakan untuk membuat
                                      resource

  PATCH                               mengubah sebagian resource

  PUT                                 full replacement bila memang
                                      dibutuhkan

  DELETE                              menghapus resource sesuai aturan
                                      domain
  -----------------------------------------------------------------------

HTTP method tidak boleh dipahami hanya sebagai operasi database.

### POST dan Business Action

POST tidak selalu berarti INSERT.

Contoh:

``` text
POST /orders
POST /orders/:id/approve
POST /orders/:id/cancel
POST /orders/:id/ship
POST /payments/:id/refund
```

Business action dapat mengubah status, inventory, audit log,
notification, dan data lain sekaligus.

### PUT vs PATCH

-   `PUT`: full replacement.
-   `PATCH`: partial update.
-   PATCH dapat digunakan untuk perubahan status, soft delete, dan
    restore jika secara konseptual merupakan partial update.

## 12. Business Action Endpoint

Gunakan business action jika operasi memiliki workflow atau business
rule tersendiri.

Pola:

``` text
POST /resources/:id/:action
```

Contoh:

``` text
POST /orders/:id/approve
POST /orders/:id/cancel
POST /orders/:id/ship
POST /payments/:id/refund
```

Alur:

``` text
POST /orders/123/approve
        ↓
validate permission
        ↓
validate current status
        ↓
business logic
        ↓
audit
        ↓
notification bila diperlukan
```

Jangan memaksa business action menjadi CRUD biasa hanya demi konsistensi
URL.

## 13. Filtering, Sorting, dan Pagination

Untuk dataset yang berpotensi besar, filtering, sorting, dan pagination
dilakukan di backend.

Contoh:

``` text
GET /orders?page=1&limit=20
GET /orders?status=PAID
GET /orders?sort=createdAt&order=desc
GET /orders?page=1&limit=20&status=PAID&sort=createdAt&order=desc
```

Response dapat memiliki metadata:

``` json
{
  "success": true,
  "message": "Data pesanan berhasil diambil",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1578,
    "totalPages": 79
  }
}
```

Dataset kecil boleh diambil sekaligus dan diproses lokal di React jika
memang sederhana dan aman untuk performance.

> Dataset kecil boleh local processing; dataset besar diproses di
> server/database.

## 14. Search

Search yang memicu request backend harus menggunakan debounce jika
request dapat terjadi pada setiap perubahan input.

Jangan mengambil seluruh dataset ke React hanya untuk melakukan search
terhadap dataset besar.

### Slug

Slug adalah identifier yang readable untuk URL dan navigasi ketika
diperlukan.

Contoh:

``` text
name = "Airy Pro+ Standard"
slug = "airy-pro-standard"
```

URL:

``` text
/products/airy-pro-standard
```

Slug:

-   disimpan di database jika entity memang membutuhkan readable
    URL/reference;
-   bukan primary key;
-   bukan storage filename;
-   tidak menggantikan UUID/ULID;
-   harus unik sesuai scope entity;
-   tidak boleh digunakan sebagai alasan untuk mengekspos struktur
    storage.

Tidak semua tabel harus memiliki slug.

## 15. Standard API Response

Success:

``` json
{
  "success": true,
  "message": "Data pesanan berhasil diambil",
  "data": []
}
```

Error:

``` json
{
  "success": false,
  "message": "Pesanan tidak ditemukan",
  "data": null
}
```

Pesan yang terlihat user harus jelas dan berbahasa Indonesia. Jangan
mengembalikan stack trace, query, secret, atau detail internal yang
sensitif.

## 16. Soft Delete

Soft delete hanya digunakan untuk entity yang aman secara bisnis.

Transactional entity seperti Order, Payment, dan Shipment umumnya
menggunakan status/cancellation daripada menghapus transaksi.

Untuk entity yang menggunakan soft delete:

-   perubahan `deleted_at` dilakukan sebagai partial update;
-   restore juga merupakan partial update;
-   API aktual dan DTO menentukan bentuk payload final.

## 17. Loading, Lazy Loading, dan Error State

Data fetching harus memiliki state yang jelas:

``` text
Idle
↓
Loading / Skeleton
↓
Success
```

atau:

``` text
Idle
↓
Loading / Skeleton
↓
Error
```

Gunakan Skeleton UI ketika struktur data sudah diketahui.

Data sekunder dapat di-load secara lazy.

Jangan request seluruh data hanya karena halaman memiliki akses terhadap
entity tersebut.

## 18. API dan Database Efficiency

Tujuan:

``` text
Minimal Necessary Request
        ↓
Efficient API
        ↓
Efficient Database Query
        ↓
Lower Database Load
```

Hindari:

-   request yang tidak diperlukan;
-   duplicate request;
-   full dataset fetch untuk dataset besar;
-   polling agresif;
-   payload berlebihan;
-   dashboard yang mengambil seluruh tabel transaksi.

## 19. Error Handling

Validasi dilakukan pada beberapa lapisan:

``` text
Frontend validation
        ↓
Server validation / business rule
        ↓
Database constraint
```

UI harus menangani:

-   loading;
-   success;
-   empty;
-   error.

## 20. Auditability

Operasi penting harus dapat dilacak melalui audit log.

Data audit minimal:

-   user;
-   entity type;
-   entity ID;
-   action;
-   old value;
-   new value;
-   timestamp.

Audit terutama penting untuk perubahan data penting, status change,
payment, inventory adjustment, dan destructive action.

## 21. Business Status

Status adalah bagian dari business logic.

Contoh:

``` text
PENDING
↓
CONFIRMED
↓
PROCESSING
↓
SHIPPED
↓
DELIVERED
```

Tidak semua status transition diperbolehkan.

Backend harus memvalidasi status transition. Frontend menampilkan action
berdasarkan status dan permission.

## 22. Export

### CSV

Boleh diproses sederhana di frontend atau backend sesuai ukuran dan
kebutuhan.

### Excel

Gunakan library spreadsheet seperti SheetJS/xlsx jika diperlukan.

### PDF

Dokumen resmi bisnis diprioritaskan dibuat di backend agar data dan
hasil dokumen konsisten serta dapat diaudit.

## 23. Email

``` text
Business Event
↓
NestJS Service
↓
Notification Service
↓
Nodemailer
↓
SMTP / Email Provider
```

Mailpit/MailHog dapat digunakan untuk development lokal.

Credential SMTP tidak boleh di-hardcode.

## 24. Payment

``` text
React
↓
NestJS
↓
Payment Service
↓
DOKU / Provider
```

Frontend tidak dipercaya untuk menentukan status payment final. Status
payment diverifikasi dan diproses oleh backend.

## 25. File Upload, Storage, dan Naming

### Prinsip utama

File binary disimpan di storage. PostgreSQL menyimpan metadata dan
referensi storage.

``` text
React
  ↓
multipart/form-data
  ↓
NestJS
  ↓
validate
  ↓
process
  ↓
Storage
  ↓
metadata → PostgreSQL
```

Frontend tidak mengetahui filesystem internal.

### Storage structure

``` text
storage/
├── products/{productId}/images/
├── customers/{customerId}/documents/
├── orders/{orderId}/images/
├── orders/{orderId}/documents/
└── returns/{returnId}/documents/
```

### Physical filename

Original filename user tidak dipakai sebagai physical storage filename.

Pola:

``` text
{UUID}-images-{uniqueID}.webp
{UUID}-documents-{uniqueID}.pdf
```

Contoh:

``` text
01K8ABC123-images-01K8XYZ789.webp
```

### Database metadata

Minimal secara konseptual:

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

Jika ERP aktual sudah memiliki attachment/document table, gunakan table
tersebut dan jangan membuat duplicate source of truth.

### Image conversion

Untuk upload:

``` text
JPG / JPEG / PNG
        ↓
backend validation
        ↓
image processing
        ↓
WebP
        ↓
storage
```

Database mencatat hasil canonical file, misalnya:

``` text
mime_type   = image/webp
storage_name = 01K8ABC123-images-01K8XYZ789.webp
```

Validasi harus mencakup MIME/type, size, dan security rules. Extension
saja tidak cukup.

### File retrieval

React tidak menyusun filesystem path sendiri.

``` text
React
  ↓
GET /orders/:id
  ↓
NestJS
  ↓
resolve authorized file/resource URL
  ↓
API response
  ↓
React
  ↓
<img src={order.imageUrl} />
```

Contoh response:

``` json
{
  "id": "01K8...",
  "imageUrl": "/storage/orders/01K8.../01K8ABC123-images-01K8XYZ789.webp"
}
```

URL tersebut adalah resource reference dari API, bukan kontrak
filesystem internal.

### Security

-   private business documents tidak otomatis public;
-   backend memeriksa authorization;
-   generated filename tidak mempercayai input user;
-   storage credentials tidak boleh masuk frontend;
-   storage provider dapat diganti tanpa mengubah frontend architecture.

## 26. Business Identifier dan Invoice Numbering

Technical ID, business identifier, slug, dan storage filename memiliki
fungsi berbeda.

``` text
Technical ID
↓
UUID / ULID

Business Identifier
↓
INV-2026-001
ORD-2026-001
SKU-001

Slug
↓
airy-pro-standard

Storage Identifier
↓
01K8ABC123-images-01K8XYZ789.webp
```

### Invoice number

Invoice number adalah business identifier, bukan primary key.

``` text
id              = UUID / ULID
invoice_number  = INV-2026-001
```

Sequence:

``` text
INV-2026-001
INV-2026-002
INV-2026-003
...
```

Nomor invoice dibuat oleh backend/business layer dan harus
concurrency-safe.

Jangan menggunakan pola:

``` text
ambil nomor terakhir + 1
```

tanpa mekanisme database yang aman.

Gunakan sequence, locked counter, atau mekanisme transaksi yang setara
sesuai database/ERP aktual.

Format akhir nomor invoice mengikuti business rule ERP aktual.

## 27. Architecture Change

Perubahan besar terhadap:

-   frontend architecture;
-   backend architecture;
-   database strategy;
-   authentication;
-   authorization;
-   API convention;
-   storage strategy;
-   major dependency;

harus dibahas sebelum implementasi.

## 28. Final Data Flow

``` text
User
 ↓
React UI
 ↓
React Service
 ↓
Axios
 ↓
NestJS Controller
 ↓
DTO Validation
 ↓
NestJS Domain Service
 ↓
TypeORM
 ↓
PostgreSQL
```

Untuk file:

``` text
User
 ↓
React upload
 ↓
NestJS upload endpoint
 ↓
Validation
 ↓
Image/document processing
 ↓
Storage
 ↓
File metadata → PostgreSQL
 ↓
API returns resource URL/reference
 ↓
React displays/downloads file
```

## 29. Source of Truth

Priority:

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

Jika implementasi menemukan konflik dengan database atau business rule
aktual, jangan diam-diam membuat asumsi baru. Identifikasi konflik dan
selesaikan sebelum melanjutkan.

## 30. Architecture North Star

> **Apakah arsitektur ini membuat sistem cukup sederhana untuk dipahami
> sekarang, tetapi cukup kuat untuk berkembang tanpa menciptakan
> technical debt yang tidak perlu?**
