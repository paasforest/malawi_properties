-- Admin User Creation SQL
-- Follow these steps:

-- STEP 1: Create the auth user in Supabase Dashboard
-- Go to: https://app.supabase.com/project/sejgrobmpsqctjripvaiu/auth/users
-- Click "Add User"
-- Email: admin@malawiproperties.com
-- Password: Admin123!@#
-- Auto Confirm: ✅ Check
-- Copy the User ID that gets generated

-- STEP 2: Run this SQL with the User ID from Step 1
-- Replace 'YOUR_USER_ID_HERE' with the actual User ID

INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with User ID from Supabase Auth
  'admin@malawiproperties.com',
  'Admin User',
  'admin',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true;

-- STEP 3: Verify admin user was created
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE user_type = 'admin';
