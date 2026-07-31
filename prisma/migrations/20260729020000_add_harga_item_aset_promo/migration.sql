-- Harga promo per jenis harga item aset.
--
-- Kalau "promoAktif" true dan "hargaPromo" > 0, nilai itulah yang dipakai untuk
-- tampilan di halaman publish, perhitungan booking, dan pembayaran.

ALTER TABLE "harga_item_aset" ADD COLUMN IF NOT EXISTS "promoAktif" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "harga_item_aset" ADD COLUMN IF NOT EXISTS "hargaPromo" DECIMAL(15,2) NOT NULL DEFAULT 0;
