-- item_aset."konfirmasiBooking" — kalau aktif, booking pada item ini tidak
-- langsung bisa dibayar. Tagihan dibuat dengan status "MENUNGGU KONFIRMASI"
-- sampai pemilik menyetujui (lanjut bayar) atau menolak (dibatalkan).

ALTER TABLE "item_aset" ADD COLUMN IF NOT EXISTS "konfirmasiBooking" BOOLEAN NOT NULL DEFAULT false;
