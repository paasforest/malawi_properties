-- Fix RLS Recursion Issue
-- The admin policies are causing infinite recursion
-- We need to fix the policies to avoid checking profiles while querying profiles

-- Step 1: Drop the problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 2: Create a better admin policy that doesn't cause recursion
-- Use a function or check auth.jwt() claims instead
-- For now, let's make profiles readable by authenticated users for their own profile
-- and keep the public read policy

-- The existing "Public profiles are viewable by everyone" should work
-- But let's add a policy that allows users to read their own profile without recursion

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Step 3: Allow admins to read all profiles (using a simpler check)
-- We'll use a service role or bypass RLS for admin operations
-- For now, let authenticated users read profiles if they're querying their own
-- Admin dashboard will need to use service role key or we'll fix this differently

-- Step 4: Confirm email and create profile
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 5: Create admin profile
DELETE FROM profiles WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora,
  created_at
) VALUES (
  '0eb208ce-566c-420c-80a9-a30286568ccb',
  'admin@malawiproperties.com',
  'Admin User',
  'admin',
  true,
  false,
  now()
);

-- Step 6: Verify
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.full_name,
  p.user_type,
  p.is_verified,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
