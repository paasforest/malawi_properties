# 🔧 Fix Traffic Source Tracking

## Issue: Traffic Sources Not Being Recorded

### Problem
The `traffic_sources` table might have RLS policies blocking anonymous inserts, or the API route might be failing silently.

### Solution: Check and Fix RLS Policies

Run this SQL in Supabase SQL Editor to verify and fix:

```sql
-- 1. Check if traffic_sources table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'traffic_sources'
);

-- 2. Check current RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'traffic_sources';

-- 3. Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can insert traffic data" ON traffic_sources;

-- 4. Create policy that allows anonymous inserts (for tracking)
CREATE POLICY "Anyone can insert traffic data"
  ON traffic_sources FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 5. Verify the policy was created
SELECT * FROM pg_policies 
WHERE tablename = 'traffic_sources';
```

### Test Tracking

After fixing, test by:
1. Visit your website in incognito mode
2. Check database: `SELECT * FROM traffic_sources ORDER BY created_at DESC LIMIT 5;`
3. Should see new records

