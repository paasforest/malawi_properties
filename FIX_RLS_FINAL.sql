-- FIX RLS RECURSION - Complete Safe Solution
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Step 2: Create safe, non-recursive policies
-- Enable RLS (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile (direct comparison, no query)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (direct comparison)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (direct comparison)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public read access (for marketplace, agents, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Step 3: Create function to check admin status (SECURITY DEFINER avoids recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND user_type = 'admin'
  );
$$;

-- Step 4: Create admin policies using the function (no recursion because function bypasses RLS)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 5: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 6: Create admin profile
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

-- Step 7: Verify everything works
SELECT 
  u.id,
  u.email as auth_email,
  u.email_confirmed_at,
  p.email as profile_email,
  p.full_name,
  p.user_type,
  p.is_verified,
  is_admin('0eb208ce-566c-420c-80a9-a30286568ccb'::uuid) as is_admin_check
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 8: Test the policies work (should return the admin profile)
SELECT id, email, user_type, is_verified 
FROM profiles 
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';
