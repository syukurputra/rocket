-- Add unique constraint to m_icon.code column
-- This migration adds a unique constraint to ensure icon codes are unique

-- First, check if there are any duplicate codes (optional, for safety)
-- SELECT code, COUNT(*)
-- FROM m_icon
-- GROUP BY code
-- HAVING COUNT(*) > 1;

-- Add the unique constraint
ALTER TABLE "m_icon"
ADD CONSTRAINT "m_icon_code_key" UNIQUE ("code");
