-- AlterTable: Tambah bukti transfer di TarikSaldo
ALTER TABLE "tarik_saldo" ADD COLUMN IF NOT EXISTS "buktiTransfer" TEXT;
