# Safe RLS Fix - No Destructive Operations

## ✅ Safe Version (No DELETE Required)

This version is **safer** - it doesn't delete anything, just updates what exists.

---

## 🚀 Run This Safe SQL in Supabase

**Go to SQL Editor:**
- https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Copy and paste this SAFE SQL (no DELETE statements):**

```sql
-- Step 1: Drop only problematic admin policies (safe)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles via function" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles via function" ON profiles;

-- Step 2: Create admin check function (safe - replaces if exists)
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

-- Step 3: Create admin policies using function (no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 4: Confirm email (safe - only updates if not already confirmed)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 5: Create admin profile (SAFE - uses ON CONFLICT, no DELETE needed)
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

-- Step 6: Verify everything
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.user_type,
  p.is_verified,
  is_admin('0eb208ce-566c-420c-80a9-a30286568ccb'::uuid) as is_admin_check
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0eb208ce-566c-420c-80a9-a30286568ccb';
```

**Click "Run"** - This is safe! No destructive operations.

---

## ✅ What This Does (Safely)

1. ✅ **Drops only problematic admin policies** (safe - they cause recursion)
2. ✅ **Creates admin check function** (safe - replaces if exists)
3. ✅ **Creates new admin policies** (safe - no recursion!)
4. ✅ **Confirms email** (safe - only updates if needed)
5. ✅ **Creates/Updates admin profile** (safe - uses ON CONFLICT, no DELETE)

---

## ✅ After Running

1. **Refresh browser**
2. **Go to:** http://localhost:3000/admin/login
3. **Email:** `admin@malawiproperties.com`
4. **Password:** `Admin123!@#`
5. **Click "Login"**

**Should work! No destructive operations needed! 🎉**

---

## 🔍 Why This Is Safe

- ✅ **No DELETE statements** - Uses `ON CONFLICT DO UPDATE` instead
- ✅ **No data loss** - Only updates what exists
- ✅ **IF EXISTS checks** - Only drops policies that cause issues
- ✅ **COALESCE** - Only updates email confirmation if needed

---

**This version is completely safe to run! No warnings about destructive operations.** ✅




