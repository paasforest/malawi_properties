# Fix RLS Recursion Error

## ⚠️ Error: "infinite recursion detected in policy"

This happens because the admin policy tries to check if a user is admin by querying `profiles`, but querying `profiles` triggers the policy check again... infinite loop!

---

## ✅ Solution: Run This SQL

**Go to Supabase SQL Editor:**
- https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Copy and paste this COMPLETE SQL:**

```sql
-- Step 1: Drop problematic admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 2: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 3: Create admin profile
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

-- Step 4: Create function to check admin (avoids recursion)
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

-- Step 5: Create admin policies using function (no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 6: Verify
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.user_type,
  p.is_verified,
  is_admin('0eb208ce-566c-420c-80a9-a30286568ccb'::uuid) as admin_check
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
```

**Click "Run"**

**Expected Result:**
- Should show `user_type = 'admin'`
- Should show `admin_check = true`

---

## ✅ After Running SQL

1. **Refresh browser** (clear cache if needed)
2. **Go to:** http://localhost:3000/admin/login
3. **Email:** `admin@malawiproperties.com`
4. **Password:** `Admin123!@#`
5. **Click "Login"**

**Should work now! The recursion is fixed! 🎉**

---

## 🔍 How This Fixes It

- **Before:** Policy checked `profiles` table → triggered policy → checked `profiles` → infinite loop
- **After:** Function uses `SECURITY DEFINER` which bypasses RLS when checking, so no recursion!




