-- Fix Traffic Source Tracking - RLS Policy Fix
-- Run this in Supabase SQL Editor

-- Step 1: Verify table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'traffic_sources'
) as table_exists;

-- Step 2: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'traffic_sources';

-- Step 3: Check existing policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'traffic_sources';

-- Step 4: Drop existing policy if it exists (to recreate)
DROP POLICY IF EXISTS "Anyone can insert traffic data" ON traffic_sources;
DROP POLICY IF EXISTS "Public can insert traffic data" ON traffic_sources;
DROP POLICY IF EXISTS "Anonymous can insert traffic data" ON traffic_sources;

-- Step 5: Ensure RLS is enabled
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policy that allows BOTH authenticated AND anonymous users to insert
CREATE POLICY "Anyone can insert traffic data"
  ON traffic_sources FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Step 7: Verify policy was created
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'traffic_sources';

-- Step 8: Test insert (should work)
-- This should succeed if policy is correct
INSERT INTO traffic_sources (
  session_id,
  source,
  medium,
  landing_page,
  device_type,
  browser,
  os,
  first_visit_at,
  last_activity_at,
  page_views
) VALUES (
  'test-session-' || extract(epoch from now()),
  'test',
  'test',
  '/test',
  'desktop',
  'test',
  'test',
  now(),
  now(),
  1
);

-- Step 9: Clean up test data
DELETE FROM traffic_sources WHERE session_id LIKE 'test-session-%';

-- Step 10: Verify admin can view (should already exist)
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'traffic_sources' 
AND policyname LIKE '%admin%';

