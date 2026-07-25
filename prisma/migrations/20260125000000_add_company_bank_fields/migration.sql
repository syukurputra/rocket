-- AlterTable: Tambah field rekening penerimaan di Company (untuk Tarik Saldo)
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "bankPenerima" TEXT;
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "nomorRekening" TEXT;
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "rekeningPenerima" TEXT;
