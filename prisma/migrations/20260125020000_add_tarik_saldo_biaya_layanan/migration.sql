-- AlterTable: Tambah biayaLayanan & nilaiTransfer di TarikSaldo
ALTER TABLE "tarik_saldo" ADD COLUMN IF NOT EXISTS "biayaLayanan" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "tarik_saldo" ADD COLUMN IF NOT EXISTS "nilaiTransfer" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Backfill data lama: belum ada potongan biaya layanan saat itu,
-- jadi nilaiTransfer = jumlahNominal (bukan 0) supaya histori lama tetap masuk akal.
UPDATE "tarik_saldo" SET "nilaiTransfer" = "jumlahNominal" WHERE "nilaiTransfer" = 0;
