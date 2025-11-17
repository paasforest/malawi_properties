-- Fix Admin Profile - Complete Setup
-- User ID: 0eb208ce-566c-420c-80a9-a30286568ccb

-- Step 1: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 2: Create admin profile (with better error handling)
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

-- Step 3: Temporarily disable RLS to ensure profile is accessible (for testing)
-- This is safe because we're using ON CONFLICT DO UPDATE

-- Step 4: Verify everything
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.user_type,
  p.is_verified,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
