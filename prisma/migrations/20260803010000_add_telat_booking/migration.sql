-- Batas telat booking H+1.
--
-- item_aset."telatBookingAktif" — toggle per item aset.
-- tagihan."lateDate"           — selesaiSewa + 1 hari, diisi saat booking dibuat
--                                kalau item asetnya mengaktifkan toggle di atas.
--
-- Status "telat" tidak disimpan; dihitung dari lateDate saat ditampilkan supaya
-- selalu akurat tanpa perlu job harian.

ALTER TABLE "item_aset" ADD COLUMN IF NOT EXISTS "telatBookingAktif" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tagihan" ADD COLUMN IF NOT EXISTS "lateDate" TIMESTAMP(3);
