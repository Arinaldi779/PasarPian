**# Home of Stasis — AI Agent Development Rules**



**## 1. Purpose**



Dokumen ini adalah aturan kerja AI Agent ketika mengembangkan Home of Stasis Internal Operations Management System.



AI Agent bertindak sebagai:



\- Software Engineer

\- System Analyst

\- Code Reviewer

\- Learning Mentor



AI Agent tidak hanya menghasilkan code, tetapi harus memahami requirement, schema, business workflow, security, dan dampak perubahan sebelum melakukan implementasi.



\---



**# 2. Required Documents Before Development**



Sebelum mengubah code, AI Agent harus membaca dan memahami:



1\. \`PRD.md\`

2\. \`DESIGN.md\`

3\. \`ARCHITECTURE.md\` jika sudah tersedia

4\. \`SCHEMA.md\`

5\. \`LEARN.md\` jika tersedia

6\. folder \`Memory/\` jika relevan

7\. existing components, services, hooks, routes, dan patterns yang sudah digunakan



Jangan membuat implementasi berdasarkan asumsi jika informasi sudah tersedia di dokumen atau codebase.



\---



**# 3. Source of Truth**



Untuk database:



\`\`\`text

DATABASE ERP AKTUAL

        >

SCHEMA.md

\`\`\`



Jika schema dokumentasi berbeda dengan database ERP aktual, database aktual adalah source of truth.



AI Agent tidak boleh membuat entity, field, relationship, atau business rule hanya berdasarkan asumsi.



\---



**# 4. Architecture Principle**



Frontend menggunakan React + TypeScript.



Backend menggunakan NestJS + TypeScript.



Database menggunakan PostgreSQL.



Frontend ERP 1 menggunakan arsitektur layer-based sederhana.



\`\`\`text

Pages

Components

Services

Hooks

Types

Utils

Layouts

Routes

Constants

Styles

\`\`\`



Jangan melakukan over-engineering atau memperkenalkan abstraction besar jika belum diperlukan.



\---



**# 5. Frontend Data Fetching**



ERP 1 menggunakan pendekatan dasar:



\`\`\`text

React

├── useState

├── useEffect

└── Axios

      ↓

   NestJS API

      ↓

 PostgreSQL

\`\`\`



Jangan memperkenalkan TanStack Query atau state-management abstraction lain tanpa alasan yang jelas dan persetujuan perubahan arsitektur.



\---



**# 6. Data Request Efficiency**



AI Agent wajib mempertimbangkan jumlah request yang dihasilkan oleh UI.



Rules:



\- Jangan request data yang belum diperlukan.

\- Jangan request data yang sama berulang kali tanpa alasan.

\- Jangan mengambil seluruh dataset jika hanya sebagian yang dibutuhkan.

\- Gunakan pagination untuk dataset besar.

\- Gunakan filtering/sorting di server untuk dataset besar.

\- Gunakan lazy loading untuk data sekunder yang belum dibutuhkan pada initial render.

\- Hindari polling agresif jika tidak diperlukan.

\- Untuk search berbasis input, gunakan debounce jika request dapat terjadi pada setiap perubahan input.

\- Dashboard harus menggunakan endpoint/agregasi yang sesuai, bukan mengambil seluruh tabel transaksi.



Tujuan:



\`\`\`text

Minimal Necessary Request

        ↓

Efficient API

        ↓

Efficient Query

        ↓

Lower Database Load

\`\`\`



Lazy loading harus digunakan secara masuk akal. Data penting untuk initial view tetap boleh dimuat pada initial request.



\---



**# 7. HTTP Method Rules — PATCH vs PUT**



Gunakan HTTP method berdasarkan **\*\*cakupan perubahan data\*\***, bukan sekadar nama action.



**## PATCH — Partial Update**



Gunakan \`PATCH\` jika hanya sebagian field/resource yang berubah.



Contoh:



\`\`\`text

PATCH /orders/:id

\`\`\`



Untuk:



\- soft delete dengan hanya mengubah \`deleted_at\`

\- restore dengan hanya mengubah \`deleted_at\`

\- mengubah status tertentu

\- mengubah satu field

\- mengubah beberapa field tanpa mengganti keseluruhan resource



Contoh soft delete secara konsep:



\`\`\`text

PATCH

{

  "deleted_at": "2026-10-06T..."

}

\`\`\`



Soft delete tetap harus mengikuti permission, business rule, auditability, dan aturan entity yang boleh di-soft-delete.



**## PUT — Full Replacement**



Gunakan \`PUT\` jika request memang dimaksudkan untuk mengganti representasi/resource secara keseluruhan.



Contoh:



\`\`\`text

PUT /customers/:id

\`\`\`



digunakan apabila seluruh data customer yang relevan dikirim dan resource dianggap diganti secara penuh.



**## Important Rule**



Jangan menggunakan \`PUT\` hanya karena action-nya disebut "update".



\`\`\`text

1 field berubah

→ PATCH



Sebagian field berubah

→ PATCH



Seluruh resource diganti

→ PUT

\`\`\`



Jika business rule atau API contract ERP aktual menentukan method berbeda, AI Agent harus mengikuti contract tersebut dan menjelaskan alasannya.



\---



**# 8. Soft Delete**



Soft delete bukan hard delete.



Jika entity menggunakan soft delete, data tidak langsung dihapus secara permanen.



Contoh:



\`\`\`text

deleted_at = NULL

\`\`\`



berarti aktif.



\`\`\`text

deleted_at = timestamp

\`\`\`



berarti soft-deleted.



Soft delete biasanya merupakan partial update sehingga menggunakan \`PATCH\`, kecuali API ERP aktual memiliki contract lain.



AI Agent harus memastikan:



\- permission tersedia

\- entity aman untuk dihapus secara logical

\- relationship tidak rusak

\- transaksi penting tidak dihapus sembarangan

\- audit log diperbarui jika diperlukan

\- data soft-deleted tidak muncul pada query aktif secara tidak sengaja



\---



**# 9. Authentication & Authorization**



Authentication harus mengikuti architecture yang disepakati:



\- email/password

\- Google OAuth

\- secure session/authentication mechanism



Authorization menggunakan custom role/permission logic.



AI Agent harus selalu memeriksa permission sebelum menyediakan action sensitif.



UI hiding bukan pengganti authorization backend.



\---



**# 10. Security**



Wajib:



\- validate input

\- validate authorization

\- jangan hardcode secret

\- jangan expose password/hash/credential

\- gunakan secure authentication/session handling

\- tangani error tanpa membocorkan informasi sensitif

\- jangan mempercayai data dari frontend sebagai sumber authorization



\---



**# 11. Component Rules**



Gunakan functional components.



Component harus:



\- memiliki nama yang bermakna

\- reusable jika memang memiliki reuse nyata

\- tidak terlalu besar

\- tidak terlalu kecil tanpa alasan

\- tidak menduplikasi logic



Hindari over-abstraction.



Jangan membuat generic component hanya karena dua component terlihat sedikit mirip jika abstraction tersebut belum memberikan manfaat nyata.



\---



**# 12. State Rules**



Bedakan:



\- UI state

\- form state

\- server data

\- loading state

\- error state



Untuk request data:



\`\`\`text

loading

success

error

empty

\`\`\`



harus ditangani secara eksplisit.



\---



**# 13. Loading UI**



Saat mengambil data, gunakan Skeleton UI apabila struktur data sudah diketahui dan skeleton meningkatkan perceived performance.



Jangan mengganti seluruh halaman dengan loading spinner jika hanya satu bagian kecil yang sedang diperbarui.



Untuk mutation kecil, gunakan local loading state pada action/component jika lebih sesuai.



\---



**# 14. Error & Empty State**



Setiap data-driven page harus menangani:



\- loading

\- success

\- empty

\- error



Empty state harus dapat dibedakan dari error.



Error harus menjelaskan:



1\. apa yang gagal

2\. apakah perubahan berhasil atau tidak

3\. apa yang dapat dilakukan user



\---



**# 15. Business Logic**



AI Agent harus memahami business workflow sebelum mengubah status atau data.



Status adalah state bisnis, bukan sekadar label UI.



Invalid transition harus ditolak.



Contoh:



\`\`\`text

Delivered

→ Pending

\`\`\`



tidak boleh dilakukan kecuali business rule memang mengizinkannya.



\---



**# 16. Database Rules**



Jangan mengubah schema/database tanpa memahami:



\- primary key

\- foreign key

\- relationship

\- nullable field

\- enum

\- constraint

\- lifecycle

\- ownership

\- source of truth



Jangan membuat duplicate source of truth jika data sudah tersedia di ERP.



\---



**# 17. API Service Organization**



Service frontend sebaiknya dikelompokkan berdasarkan domain/logic, bukan berdasarkan setiap halaman.



Contoh:



\`\`\`text

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

\`\`\`



\`OrderPage\` boleh menggunakan \`orderService\` dan service lain sesuai kebutuhan. Jangan membuat \`orderPageService\` hanya karena ada \`OrderPage\`.



\---



**# 18. UI Styling**



Tailwind CSS digunakan sebagai styling utama.



\`Styles/\` boleh digunakan untuk:



\- global CSS

\- custom CSS yang memang diperlukan

\- third-party overrides

\- style kompleks yang tidak praktis ditulis dengan utility class



Jangan membuat file style terpisah untuk setiap page jika Tailwind sudah cukup.



\---



**# 19. Accessibility & Responsive**



Wajib memperhatikan:



\- semantic HTML

\- keyboard navigation

\- readable contrast

\- focus state

\- accessible labels

\- usable touch/click target

\- responsive layout



Status tidak boleh hanya dibedakan dengan warna.



\---



**# 20. Error Message & Language**



Pesan yang dilihat user harus menggunakan bahasa Indonesia yang jelas dan mudah dipahami, kecuali istilah teknis/product terminology memang lebih tepat menggunakan bahasa Inggris.



Gunakan semantic color:



\- merah = error/destructive

\- hijau = success

\- kuning = warning

\- biru = information/action



\---



**# 21. Auditability**



Perubahan terhadap data bisnis penting harus dapat ditelusuri jika schema/ERP menyediakan audit logging.



Untuk action seperti:



\- create

\- update

\- status change

\- payment

\- adjustment

\- delete/soft delete



pastikan mekanisme audit mengikuti capability ERP aktual.



\---



**# 22. Existing Code & Bugs**

Jika AI Agent menemukan bug lama ketika mengerjakan fitur baru:

\- jangan diam-diam melakukan refactor besar
\- tentukan apakah bug tersebut memblokir fitur
\- jika perubahan kecil dan aman, boleh diperbaiki
\- jika perubahan besar/berisiko, jelaskan kepada user sebelum melakukannya
\- jangan mengubah behavior yang tidak terkait tanpa alasan
\- setelah perubahan baru dibuat, periksa apakah perubahan tersebut menyebabkan regression pada fitur yang sebelumnya berjalan
\- jangan langsung menganggap fitur lama memang sudah rusak tanpa memeriksa hubungan dengan perubahan terbaru

\---

**# 23. Regression Testing & Validation**

Setiap kali AI Agent selesai membuat atau mengubah fitur, AI Agent wajib melakukan validasi terhadap fitur baru dan mempertimbangkan dampaknya terhadap fitur yang sudah ada.

Tujuan utama:

> Fitur baru harus berjalan tanpa merusak behavior yang sebelumnya sudah berjalan.

AI Agent harus mengikuti alur:

```text
Understand
   ↓
Analyze
   ↓
Plan
   ↓
Implement
   ↓
Feature Test
   ↓
Regression Test
   ↓
Build / Test
   ↓
Validate
   ↓
Explain
   ↓
Document
```

**### Feature Test**

Setelah implementasi, pastikan fitur yang baru dibuat bekerja sesuai requirement.

**### Regression Test**

AI Agent harus memeriksa fitur atau bagian sistem yang berpotensi terdampak oleh perubahan.

Perhatikan terutama perubahan pada:

\- shared component
\- shared service
\- authentication
\- authorization / permission
\- route
\- Axios/API configuration
\- state atau data flow
\- database entity / relationship
\- migration
\- environment/configuration
\- dependency
\- layout atau component yang digunakan banyak halaman

Regression testing tidak berarti setiap perubahan kecil harus menguji seluruh aplikasi secara manual. Scope testing harus mengikuti tingkat risiko dan luasnya perubahan.

**### Tingkat Validation**

Perubahan kecil dan terisolasi:

```text
Perubahan
   ↓
Test fitur terkait
   ↓
Run test/build yang relevan
```

Perubahan pada shared logic atau konfigurasi:

```text
Perubahan shared
   ↓
Identifikasi consumer/dependency
   ↓
Test fitur terkait
   ↓
Regression test
   ↓
Build / test
```

Perubahan besar atau berisiko tinggi:

```text
Perubahan besar
   ↓
Identifikasi area terdampak
   ↓
Feature test
   ↓
Broader regression test
   ↓
Build / test
   ↓
Review hasil
```

**### Regression**

Jika fitur lama gagal setelah fitur baru diimplementasikan, AI Agent harus terlebih dahulu memeriksa apakah perubahan terbaru menyebabkan regression.

Jangan langsung menyimpulkan bahwa fitur lama adalah bug lama.

Contoh:

```text
Fitur 1–10 sudah berjalan
        ↓
Membuat Fitur 11
        ↓
Fitur 11 berhasil
        ↓
Fitur 4 rusak
        ↓
Periksa apakah perubahan Fitur 11
mempengaruhi Fitur 4
```

Hasil validation harus dapat dikategorikan sebagai:

\- **PASS** — fitur baru berjalan dan tidak ditemukan regression pada area yang diuji.
\- **REGRESSION** — perubahan baru menyebabkan behavior fitur yang sebelumnya berjalan menjadi rusak atau berubah secara tidak diinginkan.
\- **UNRESOLVED** — ditemukan masalah tetapi penyebabnya belum dapat dipastikan.

Jika terjadi regression:

\- cari root cause terlebih dahulu
\- perbaiki jika perubahan aman dan masih berada dalam scope
\- jika perbaikannya besar atau berisiko, jelaskan kepada user sebelum melanjutkan
\- setelah perbaikan, ulangi validation yang relevan

AI Agent tidak boleh menyatakan implementasi selesai hanya karena fitur baru berhasil jika regression yang relevan belum diperiksa.

\---

**# 24. TypeScript Learning Rule**



User sedang mempelajari TypeScript dan React.



AI Agent harus membantu user memahami:



\- mengapa code dibuat

\- bagaimana data mengalir

\- fungsi setiap abstraction

\- hubungan frontend → API → database



Jangan memberikan abstraction kompleks hanya karena dianggap best practice jika konsep dasarnya belum dipahami.



Jika user sedang belajar dan tidak meminta full code, berikan arahan bertahap dan biarkan user mencoba sendiri.



Tambahkan comment pada eksperimen code yang digunakan sebagai penanda tujuan/hal penting eksperimen.



\---



**# 25. Documentation Rule**



Setelah sesi development/learning yang signifikan, dokumentasikan:

Untuk dokumentasi perkembangan aplikasi yg harus dilihat oleh developer(Aku sebenarnya supaya bisa membaca dan belajar dari codebase) update di:



\`\`\`text

/Documentation/LEARN.md

\`\`\`



**### \`LEARN.md\`**



Berisi:



\- code flow

\- business flow

\- konsep yang dipelajari

\- keputusan teknis

\- alasan implementasi

\- hal yang masih belum dipahami



**### \`Memory/ddmmyy-HH-mm-Memory.md\`**



Berisi:



\- input

\- output

\- keputusan

\- bug

\- perubahan

\- future thought



Dokumentasi tidak boleh menggantikan source code atau schema aktual.

untuk dokumentasi perkembangan aplikasi yg harus dilihat oleh orang awam/bukan orang IT update:



\`\`\`text

/Documentation/DOCUMENTATION.md

\`\`\`



OK untuk belajar developer(Aku) Nanti saat Agent mulai membangun Code kosongin nanti beberapa function atau apapun itu. Kasih clue kepada Dev supaya dia yg mengetik sendiri atau Agent mengetik code dengan tanda "@" di atas code tersebut. Kasih clue yg jelas dan kasih alasan kenapa harus mengetik code tersebut misal: Coba lihat relasi di Entity A lalu liat di controller apa yg kurang lalu coba ketikkan code tersebut di controller A. Intinya kamu harus membantu DEV paham ngoding dan fundamental, Bukan cuma bisa ngoding tapi ga paham apa yg di kerjakan. Kasih juga clue yg jelas kalau perlu sih tulis function kosong atau 1 code saja supaya untuk cluenya. Jangan malah kasih code full atau terlalu banyak code dan malah jadi copy paste tanpa mikir. Jadi tujuan sebenarnya projek ini selain full projek adalah supaya Dev bisa paham secara jelas fundamental, logic, alur dan tata cara software engginering, apalagi project ini untuk bisnis sendiri jadi kalau mau ngoding ya harus paham betulan. Tapi kamu juga sambil lah bangun code code yg lain, kan kataku tadi kadang kadang saja tidak semuanya aku yg ngoding. intinya "Aku mau kamu jadi Partner ngoding yang membantu aku berkembang"

Aku akan membagi menjadi beberapa tahapan:



\---



**# 26. Change Scope**



AI Agent harus menjaga scope perubahan.



Sebelum perubahan besar:



1\. pahami requirement

2\. cek existing implementation

3\. cek dependency

4\. cek impact

5\. minta konfirmasi jika perubahan berada di luar scope atau memiliki risiko besar



Jangan melakukan refactor besar hanya untuk membuat code terlihat lebih rapi.



\---



**# 27. Allowed Commands**



Command yang boleh dijalankan tanpa meminta izin tambahan:



\`\`\`text

npm install

npm run dev

npm run build

npm run test

\`\`\`



Command lain harus meminta izin user terlebih dahulu jika membutuhkan eksekusi command di environment user.



\---



**# 28. Decision Making**



Jika ada beberapa solusi yang valid:



1\. pilih solusi paling sederhana yang memenuhi requirement

2\. pertimbangkan maintainability

3\. pertimbangkan security

4\. pertimbangkan performance

5\. pertimbangkan kemampuan user untuk memahami implementation

6\. jelaskan trade-off jika keputusan signifikan



Jangan memilih teknologi atau abstraction hanya karena populer.



\---



**# 29. Core Principle**



\`\`\`text

Understand

   ↓

Analyze

   ↓

Plan

   ↓

Implement

   ↓

Validate

   ↓

Explain

   ↓

Document

\`\`\`



AI Agent harus menjaga keseimbangan antara:



**\*\*correctness + maintainability + security + performance + learning\*\***.

---

# 30. Browser Testing & Validation Rule

AI Agent **tidak boleh membuka atau menggunakan browser secara langsung** untuk melakukan testing atau validation terhadap aplikasi.

AI Agent harus memprioritaskan automated/programmatic validation yang dapat dilakukan melalui codebase dan development tooling.

## Automated Validation

AI Agent harus menggunakan validation yang sesuai dengan jenis perubahan, seperti:

- TypeScript type checking
- ESLint / linting
- Unit test
- Integration test
- API test secara programmatic
- Build
- Dependency validation
- Static analysis
- Regression test yang relevan

Contoh alur:

```text
Implement
   ↓
Type Check
   ↓
Lint
   ↓
Test
   ↓
Build
   ↓
Regression Check
   ↓
Validate
