-- Fix Admin Policies - No Recursion Version
-- Run this AFTER creating the admin profile

-- Step 1: Drop all existing admin policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 2: The existing policies should be enough:
-- - "Public profiles are viewable by everyone" (allows SELECT for everyone)
-- - "Users can update own profile" (allows UPDATE for own profile)
-- - "Users can insert own profile" (allows INSERT for own profile)

-- Step 3: For admin access, we'll use a different approach
-- Create a function that checks admin status without recursion
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

-- Step 4: Now create admin policies using the function (avoids recursion)
CREATE POLICY "Admins can view all profiles via function"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles via function"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 5: Verify the function works
SELECT is_admin('0eb208ce-566c-420c-80a9-a30286568ccb'::uuid) as is_admin_check;
