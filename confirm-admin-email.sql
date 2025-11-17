-- Confirm Admin User Email and Create Profile
-- User ID: 0eb208ce-566c-420c-80a9-a30286568ccb

-- Step 1: Confirm email in auth.users (only email_confirmed_at, not confirmed_at)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 2: Create admin profile
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  '0eb208ce-566c-420c-80a9-a30286568ccb',
  'admin@malawiproperties.com',
  'Admin User',
  'admin',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true,
    email = 'admin@malawiproperties.com',
    full_name = 'Admin User';

-- Step 3: Verify everything
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.user_type,
  p.is_verified
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
