-- COMPLETE ADMIN SETUP - Run this in Supabase SQL Editor
-- User ID: 0eb208ce-566c-420c-80a9-a30286568ccb

-- Step 1: Confirm email in auth.users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 2: Create or update admin profile
-- First, try to delete if exists (to avoid any conflicts)
DELETE FROM profiles WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Then insert the admin profile
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

-- Step 3: Verify everything
SELECT 
  'Auth User' as type,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb'

UNION ALL

SELECT 
  'Profile' as type,
  p.id,
  p.email,
  NULL::timestamptz as email_confirmed_at,
  p.created_at
FROM profiles p
WHERE p.id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 4: Final verification - should show admin user
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
