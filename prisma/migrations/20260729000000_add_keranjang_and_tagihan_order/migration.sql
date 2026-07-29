-- Fitur keranjang belanja booking.
--
-- 1. tagihan."orderId" — penanda satu kali pembayaran dari keranjang. Beberapa
--    tagihan yang dibayar sekaligus berbagi orderId yang sama, dan nilai itulah
--    yang dikirim ke iPaymu sebagai referenceId.
-- 2. tabel "keranjang" — isi keranjang per user (hanya boleh 1 aset yang sama).

ALTER TABLE "tagihan" ADD COLUMN IF NOT EXISTS "orderId" TEXT;

CREATE INDEX IF NOT EXISTS "tagihan_orderId_idx" ON "tagihan"("orderId");

CREATE TABLE IF NOT EXISTS "keranjang" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "asetId" TEXT NOT NULL,
    "itemAsetId" TEXT NOT NULL,
    "jenisHarga" VARCHAR(20) NOT NULL,
    "mulaiSewa" TIMESTAMP(3) NOT NULL,
    "selesaiSewa" TIMESTAMP(3) NOT NULL,
    "durasi" INTEGER NOT NULL DEFAULT 1,
    "hargaSatuan" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keranjang_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "keranjang_userId_idx" ON "keranjang"("userId");
CREATE INDEX IF NOT EXISTS "keranjang_asetId_idx" ON "keranjang"("asetId");
CREATE INDEX IF NOT EXISTS "keranjang_itemAsetId_idx" ON "keranjang"("itemAsetId");
CREATE INDEX IF NOT EXISTS "keranjang_companyId_idx" ON "keranjang"("companyId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'keranjang_userId_fkey') THEN
        ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'keranjang_companyId_fkey') THEN
        ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_companyId_fkey"
            FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'keranjang_asetId_fkey') THEN
        ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_asetId_fkey"
            FOREIGN KEY ("asetId") REFERENCES "aset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'keranjang_itemAsetId_fkey') THEN
        ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_itemAsetId_fkey"
            FOREIGN KEY ("itemAsetId") REFERENCES "item_aset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
