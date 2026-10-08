# Dokumentasi Pengguna — Dashboard PasarPian

Dashboard PasarPian adalah tampilan operasional berbasis React dengan data simulasi lokal. Fitur yang tersedia saat ini:

- Beranda: sapaan, tanggal dan jam, serta keterangan peran yang sedang dipakai.
- Peringatan operasional di bagian paling atas: pesanan yang terlambat, stok yang menipis, kiriman melewati perkiraan tiba, tagihan yang belum lunas, dan retur yang menunggu diperiksa. Setiap peringatan bisa diklik untuk langsung ke halaman terkait; bila semuanya aman, muncul keterangan hijau "tidak ada hal mendesak".
- Empat angka utama (penjualan, pesanan, pemenuhan gudang, piutang) beserta penjelasan istilah seperti "Piutang (Outstanding)" dan "Pemenuhan".
- Fokus peran: tiga ringkasan yang disusun sesuai peran yang sedang aktif — misalnya peran Gudang melihat barang yang belum dikemas, peran Keuangan melihat pembayaran yang masuk. Pilih peran lain di pojok kanan atas untuk melihat isinya berubah.
- Cara pesanan tersebar: batang dan daftar jumlah pesanan untuk tiap status, bisa diklik untuk membuka daftar pesanan.
- Grafik tren penjualan, kontribusi tiap saluran penjualan, dan 5 aktivitas terakhir (pesanan maupun perpindahan stok) dengan tombol untuk membuka detailnya.
- Daftar pesanan dengan pencarian (nomor, pelanggan, kota, produk, SKU) dan filter status, saluran penjualan, status pembayaran, serta rentang tanggal. Tiga angka ringkasan di atasnya bisa diklik: total pesanan, yang menunggu konfirmasi, dan total piutang (membuka Keuangan).
- Detail pesanan 360° melalui klik baris atau tombol detail: identitas pesanan, pelanggan dan alamat, daftar produk lengkap dengan diskon tiap item, ringkasan biaya (termasuk pajak), riwayat pembayaran tiap catatan beserta sisa tagihan, status gudang (diambil/dikemas), info kurir-resi-estimasi plus riwayat perjalanan paket, dan jejak audit siapa mengubah apa dan kapan.
- Perubahan status pesanan melalui alur yang berurutan (konfirmasi → proses gudang → kirim → diterima). Membatalkan pesanan meminta konfirmasi dua langkah dan alasan wajib yang tercatat sebagai arsip.
- Katalog produk dan SKU: dikelompokkan per produk sesuai kategorinya, tiap produk bisa dibuka untuk melihat varian, kode SKU, harga jual, harga pokok, dan sisa stok tiap varian (varian yang menipis atau habis diberi tanda tulisan).
- Inventaris multi-gudang: saringan chip per gudang, empat angka ringkasan (SKU, fisik, terkunci, tersedia) beserta tanda bila ada yang menipis/habis, dan tabel stok (SKU, produk, varian, fisik, terkunci, tersedia, status Aman/Menipis/Habis).
- Penyesuaian stok: tombol Sesuaikan membuka form berisi alasan dan nomor referensi dokumen yang wajib diisi; pengurangan stok meminta konfirmasi kedua. Setiap penyesuaian otomatis tercatat di buku mutasi dan jejak audit.
- Buku mutasi stok: daftar kronologis bertipe bahasa Indonesia (penerimaan, reservasi, pengambilan, dst.) lengkap dengan gudang, jumlah bertanda +/−, referensi dokumen, petugas, dan catatan.
- Global search untuk order, SKU, resi, dan gudang.
- Antrean gudang: ambil barang → kemas → siap kirim, lengkap dengan pencarian, saringan gudang, progres packing tiap barang, tombol kerja per kartu maupun massal, dan pencatatan otomatis ke jejak audit.
- Lacak pengiriman: status paket (termasuk tanda otomatis bila melewati estimasi tiba), nomor resi dengan tombol salin, dan riwayat perjalanan paket.
- Keuangan: uang masuk, sisa tagihan yang belum lunas, dan pengembalian dana (refund). Tagihan yang belum lunas bisa dicatat pembayarannya (cicilan) langsung dari tabel — status lunas/sebagian mengikuti otomatis.
- Pengajuan retur: daftar keluhan pelanggan, kondisi barang, tindakan barang, dan persetujuan/penolakan berkonfirmasi (beserta penyelesaian refund), tiap pengajuan tertaut ke pesanan asalnya yang bisa dibuka detailnya.
- Pemasaran: daftar kampanye promosi (periode, saluran penjualan, status Aktif/Draf/Jeda/Selesai yang bisa diubah dan tercatat), serta pratinjau banner promosi dalam 3 ukuran (hero, kartu, widget) yang tombolnya membuka katalog.
- Administrasi: daftar pengguna internal (aktifkan/nonaktifkan/tangguhkan akun, otomatis tercatat), menu yang boleh dibuka tiap peran, dan riwayat perubahan data (jejak audit: siapa, kapan, data apa, nilai lama vs baru) yang hanya dapat dibaca.
- Tampilan: tiga tema (Terang, Gelap, Baca) bisa diganti lewat tombol matahari/bulan/buku di bar atas — pilihan tersimpan otomatis. Arahkan kursor ke angka, grafik, atau status di Beranda untuk melihat penjelasan nilainya.

- Autentikasi: halaman masuk dengan email/kata sandi, pesan penolakan akun nonaktif/ditangguhkan, tombol Google OAuth, pendaftaran permintaan akses, dan tombol keluar dari sesi. Halaman masuk memperkenalkan identitas PasarPian lewat foto Pasar Terapung dengan judul aplikasi berlapis kaca, lalu form masuk/daftar di sebelah kanan. Tersedia petunjuk akun simulasi yang bisa dicoba.

> Catatan: aplikasi belum terhubung ke backend atau database. Semua perubahan akan hilang saat halaman dimuat ulang.
> Login dan pendaftaran saat ini juga masih simulasi frontend. Password tidak disimpan; Google OAuth, session aman, hash password, dan approval akun menunggu API autentikasi.
