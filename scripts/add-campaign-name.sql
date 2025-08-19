-- Add name column to campaigns if it doesn't exist
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';