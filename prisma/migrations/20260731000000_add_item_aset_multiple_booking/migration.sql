-- item_aset."multipleBooking" — kalau aktif, item boleh dibooking beberapa kali
-- pada rentang waktu yang sama (validasi bentrok jadwal dilewati) dan tombol
-- Schedule tidak ditampilkan di halaman publish.

ALTER TABLE "item_aset" ADD COLUMN IF NOT EXISTS "multipleBooking" BOOLEAN NOT NULL DEFAULT false;
