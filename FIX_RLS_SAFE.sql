-- FIX RLS RECURSION - Safe Version (No DELETE)
-- Run this in Supabase SQL Editor

-- Step 1: Drop problematic admin policies only (safe)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles via function" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles via function" ON profiles;

-- Step 2: Create safe, non-recursive policies (only if they don't exist)
-- Check existing policies first, then create only missing ones

-- Users can view own profile (safe - direct comparison)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update own profile (safe - direct comparison)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can insert own profile (safe - direct comparison)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Public read access (safe - already exists in original migration)
-- This should already exist from run_in_supabase.sql

-- Step 3: Create/Replace admin check function (safe - replaces if exists)
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

-- Step 4: Create admin policies using function (safe - no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 5: Confirm email (safe - just updates timestamp)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 6: Create admin profile (SAFE - uses ON CONFLICT, no DELETE)
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
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true,
    email = 'admin@malawiproperties.com',
    full_name = 'Admin User';

-- Step 7: Verify everything works
SELECT 
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
