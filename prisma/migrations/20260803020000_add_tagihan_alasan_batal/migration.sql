-- tagihan."alasanBatal" — alasan yang ditulis pemilik sewa saat menolak atau
-- membatalkan booking. Ditampilkan ke penyewa pada detail bookingnya.

ALTER TABLE "tagihan" ADD COLUMN IF NOT EXISTS "alasanBatal" TEXT;
