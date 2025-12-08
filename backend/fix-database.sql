-- Run this SQL directly in your PostgreSQL database if the migration fails
-- This adds the missing columns that are causing the 500 error

-- Add username change tracking fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastUsernameChange" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usernameChangesThisWeek" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "weekStartDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usernameChangeHistory" JSONB NOT NULL DEFAULT '[]';

-- Add message status fields (for the tick indicators)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "User_lastUsernameChange_idx" ON "User"("lastUsernameChange");
CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"("status");

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User' 
AND column_name IN ('lastUsernameChange', 'usernameChangesThisWeek', 'weekStartDate', 'usernameChangeHistory');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Message' 
AND column_name IN ('status', 'deliveredAt', 'readAt');
