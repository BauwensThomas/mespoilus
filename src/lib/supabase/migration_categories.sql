-- Migration: Multi-category support for articles
-- Run this on your Supabase project after migration_complete.sql

-- 1. Add categories array column
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- 2. Backfill from existing category field
UPDATE articles
SET categories = ARRAY[category]
WHERE categories IS NULL OR array_length(categories, 1) IS NULL OR array_length(categories, 1) = 0;

-- 3. GIN index for fast array containment queries (@>)
CREATE INDEX IF NOT EXISTS idx_articles_categories ON articles USING GIN (categories);
