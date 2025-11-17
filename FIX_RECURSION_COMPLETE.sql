-- COMPLETE FIX FOR RLS RECURSION
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 2: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 3: Create admin profile (using the public read policy which doesn't recurse)
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

-- Step 4: Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS when checking, avoiding recursion
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

-- Step 5: Create admin policies using the function (no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 6: Verify everything
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.full_name,
  p.user_type,
  p.is_verified,
  u.email_confirmed_at,
  is_admin('0eb208ce-566c-420c-80a9-a30286568ccb'::uuid) as admin_check
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
