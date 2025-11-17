# Fix RLS Recursion - Final Solution

## ✅ Complete Safe Fix

This fixes the "infinite recursion detected in policy" error by:
1. Removing all problematic self-referencing policies
2. Creating safe policies that use `auth.uid()` directly (no queries)
3. Using a `SECURITY DEFINER` function for admin checks (avoids recursion)
4. Creating the admin profile

---

## 🚀 Run This SQL in Supabase

**Go to SQL Editor:**
- https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Copy and paste this COMPLETE SQL:**

```sql
-- Step 1: Drop ALL problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Step 2: Create safe, non-recursive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view own profile (direct comparison, no query)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Public read access (for marketplace)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Step 3: Create admin check function (SECURITY DEFINER avoids recursion)
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

-- Step 4: Create admin policies using function (no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 5: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 6: Create admin profile
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

-- Step 7: Verify everything
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

**Click "Run"**

---

## ✅ After Running SQL

1. **Refresh browser** (or clear cache)
2. **Go to:** http://localhost:3000/admin/login
3. **Email:** `admin@malawiproperties.com`
4. **Password:** `Admin123!@#`
5. **Click "Login"**

**Should work now! No more recursion! 🎉**

---

## 🔍 How This Fixes It

### Before (Problematic):
```sql
-- BAD: Queries profiles while checking profiles access
CREATE POLICY "Admins can view profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles  -- ❌ Recursion! Queries profiles to check access
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );
```

### After (Fixed):
```sql
-- GOOD: Function bypasses RLS (SECURITY DEFINER)
CREATE FUNCTION is_admin(user_id uuid) ... SECURITY DEFINER ...

-- GOOD: Uses function, no recursion
CREATE POLICY "Admins can view profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));  -- ✅ No recursion!
```

---

## ✅ Key Points

1. ✅ **Direct comparison**: `auth.uid() = id` (no queries)
2. ✅ **SECURITY DEFINER function**: Bypasses RLS when checking admin
3. ✅ **No self-referencing**: Policies don't query profiles to check access
4. ✅ **Safe structure**: Each policy has a clear, non-recursive purpose

---

**This should completely fix the recursion issue! Run the SQL above and try logging in again.** 🚀




