-- Add invitation fields to user table
-- This migration is safe and only adds new nullable columns
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add invitation token field (unique, nullable)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitationToken" VARCHAR(255) UNIQUE;

-- Add invitation expiry field (nullable)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitationExpiry" TIMESTAMP(3);

-- Add invited at timestamp (nullable)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);

-- Add invited by user id (nullable, foreign key)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitedById" VARCHAR(100);

-- Add foreign key constraint for invitedById
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_invitedById_fkey'
    ) THEN
        ALTER TABLE "user"
        ADD CONSTRAINT "user_invitedById_fkey"
        FOREIGN KEY ("invitedById")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index on invitationToken for faster lookups
CREATE INDEX IF NOT EXISTS "user_invitationToken_idx" ON "user"("invitationToken");

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
AND column_name IN ('invitationToken', 'invitationExpiry', 'invitedAt', 'invitedById')
ORDER BY column_name;
