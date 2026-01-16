-- AlterTable: Change keuangan relation from m_icon to category_keuangan
-- Step 1: Add new column (nullable first to allow existing data)
ALTER TABLE "keuangan" ADD COLUMN "categoryKeuanganId" TEXT;

-- Step 2: Drop the old foreign key constraint and column
ALTER TABLE "keuangan" DROP CONSTRAINT "keuangan_iconId_fkey";
ALTER TABLE "keuangan" DROP COLUMN "iconId";

-- Step 3: Make categoryKeuanganId NOT NULL (after data migration if needed)
-- Note: You may need to manually update existing records first
-- UPDATE "keuangan" SET "categoryKeuanganId" = '<some-category-id>' WHERE "categoryKeuanganId" IS NULL;
ALTER TABLE "keuangan" ALTER COLUMN "categoryKeuanganId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "keuangan" ADD CONSTRAINT "keuangan_categoryKeuanganId_fkey" FOREIGN KEY ("categoryKeuanganId") REFERENCES "category_keuangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
