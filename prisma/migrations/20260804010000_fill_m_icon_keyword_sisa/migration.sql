-- Lanjutan pengisian m_icon."keyword" untuk ikon di luar 240 bawaan seed.
--
-- Yang tercakup di sini: ikon yang dibuat otomatis oleh aplikasi (kategori
-- keuangan "Booking") dan ikon Tabler lain yang umum dipakai di aplikasi ini.
--
-- Hanya mengisi baris yang keyword-nya masih kosong, jadi keyword yang sudah
-- kamu isi manual tidak akan tertimpa. Aman dijalankan berulang.

UPDATE "m_icon" AS m
SET "keyword" = v.kw
FROM (
  VALUES
    -- Dibuat otomatis saat pembayaran booking pertama berhasil
    ('tabler-cash-banknote', 'uang, tunai, kas, duit, lembaran, pendapatan'),
    ('tabler-cash-banknote-off', 'tanpa uang, tunai nonaktif, kas kosong'),

    -- Ikon yang dipakai di menu & notifikasi aplikasi
    ('tabler-calendar-check', 'jadwal disetujui, booking, agenda, tanggal'),
    ('tabler-calendar-plus', 'tambah jadwal, booking baru, agenda'),
    ('tabler-calendar-month', 'kalender bulanan, jadwal, bulan'),
    ('tabler-calendar-stats', 'statistik jadwal, laporan booking'),
    ('tabler-checkup-list', 'daftar periksa, ceklis, konfirmasi'),
    ('tabler-clock-hour-4', 'jam, menunggu, waktu, proses'),
    ('tabler-clock-x', 'kadaluarsa, waktu habis, expired'),
    ('tabler-help-circle', 'bantuan, tanya, pertanyaan'),
    ('tabler-shopping-cart-plus', 'tambah ke keranjang, belanja'),
    ('tabler-shopping-cart-off', 'keranjang kosong, tanpa belanja'),
    ('tabler-file-check', 'berkas disetujui, dokumen terverifikasi'),
    ('tabler-mail-opened', 'surat dibuka, sudah dibaca, email'),
    ('tabler-bell-off', 'notifikasi mati, senyap, bisu'),
    ('tabler-star-off', 'tanpa bintang, belum dinilai'),
    ('tabler-current-location', 'lokasi saya, gps, posisi sekarang'),
    ('tabler-building-skyscraper', 'gedung tinggi, pencakar langit, apartemen'),
    ('tabler-door-enter', 'masuk, pintu masuk, akses'),
    ('tabler-door-exit', 'keluar, pintu keluar, logout'),
    ('tabler-motorbike', 'motor, sepeda motor, kendaraan'),
    ('tabler-car', 'mobil, kendaraan, rental'),
    ('tabler-truck', 'truk, kendaraan, angkutan'),
    ('tabler-tools', 'perkakas, alat, peralatan, servis'),
    ('tabler-hammer', 'palu, perkakas, perbaikan'),
    ('tabler-air-conditioning', 'ac, pendingin, penyejuk udara'),
    ('tabler-wash-machine', 'mesin cuci, laundry, cucian'),
    ('tabler-fridge', 'kulkas, lemari es, pendingin'),
    ('tabler-tv', 'televisi, tv, layar'),
    ('tabler-wifi-off', 'tanpa wifi, internet mati'),
    ('tabler-parking', 'parkir, tempat parkir, kendaraan'),
    ('tabler-swimming', 'renang, kolam renang, olahraga'),
    ('tabler-toilet-paper', 'tisu, toilet, kamar mandi'),
    ('tabler-desk', 'meja, meja kerja, furnitur'),
    ('tabler-sofa', 'sofa, kursi panjang, furnitur'),
    ('tabler-lamp', 'lampu, penerangan, cahaya'),
    ('tabler-bulb', 'bohlam, lampu, ide'),
    ('tabler-flame-off', 'api mati, padam'),
    ('tabler-users-group', 'grup pengguna, kelompok, tim'),
    ('tabler-id', 'ktp, identitas, kartu identitas'),
    ('tabler-id-badge', 'kartu nama, identitas, lencana'),
    ('tabler-headset', 'headset, dukungan, layanan pelanggan'),
    ('tabler-lifebuoy', 'pelampung, bantuan, dukungan'),
    ('tabler-logout', 'keluar, logout, akhiri sesi'),
    ('tabler-login', 'masuk, login, mulai sesi'),
    ('tabler-login-2', 'masuk, login, mulai sesi'),
    ('tabler-external-link', 'tautan luar, buka tab baru'),
    ('tabler-link', 'tautan, link, sambungan'),
    ('tabler-arrows-exchange', 'tukar, pertukaran, transfer'),
    ('tabler-transfer', 'transfer, kirim, pindah dana'),
    ('tabler-arrow-back-up', 'kembali, batalkan, undo'),
    ('tabler-dots-circle-horizontal', 'titik, opsi, lainnya'),
    ('tabler-list', 'daftar, list, rincian'),
    ('tabler-list-check', 'daftar ceklis, tugas, checklist'),
    ('tabler-table', 'tabel, data, kisi'),
    ('tabler-database-export', 'ekspor data, unduh basis data'),
    ('tabler-database-import', 'impor data, unggah basis data'),
    ('tabler-file-export', 'ekspor berkas, unduh dokumen'),
    ('tabler-file-import', 'impor berkas, unggah dokumen'),
    ('tabler-file-spreadsheet', 'spreadsheet, excel, tabel'),
    ('tabler-file-invoice', 'faktur, invoice, tagihan'),
    ('tabler-file-dollar', 'dokumen keuangan, tagihan, nota'),
    ('tabler-pig-money', 'celengan, tabungan, hemat'),
    ('tabler-moneybag', 'karung uang, dana, modal'),
    ('tabler-discount', 'diskon, potongan harga, promo'),
    ('tabler-rosette-discount', 'diskon, promo, penawaran'),
    ('tabler-building-community', 'perumahan, komunitas, kompleks'),
    ('tabler-map-2', 'peta, denah, lokasi'),
    ('tabler-briefcase', 'tas kerja, koper, bisnis'),
    ('tabler-category', 'kategori, golongan, kelompok'),
    ('tabler-database', 'basis data, database, penyimpanan'),
    ('tabler-icons', 'ikon, lambang, simbol')
) AS v(code, kw)
WHERE m."code" = v.code
  AND (m."keyword" IS NULL OR btrim(m."keyword") = '');

-- Jaring pengaman: ikon yang keyword-nya masih kosong diisi dari namanya
-- (huruf kecil) supaya tetap bisa ditemukan lewat kolom keyword.
UPDATE "m_icon"
SET "keyword" = lower("nama")
WHERE "keyword" IS NULL OR btrim("keyword") = '';
