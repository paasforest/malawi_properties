-- Create Admin Profile
-- User ID from auth: 0eb208ce-566c-420c-80a9-a30286568ccb

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

-- Verify admin was created
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';
