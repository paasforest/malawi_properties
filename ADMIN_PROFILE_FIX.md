# Fix Admin Profile - Complete Setup

## ⚠️ Error: "Failed to check user permissions"

This means the **profile doesn't exist** yet or RLS is blocking access.

---

## ✅ Solution: Run This SQL in Supabase

**Go to SQL Editor:**
- https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Copy and paste this complete SQL:**

```sql
-- Step 1: Confirm email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 2: Delete existing profile if any (to avoid conflicts)
DELETE FROM profiles WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Step 3: Create admin profile
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

-- Step 4: Verify everything worked
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
```

**Click "Run"**

**Expected Result:**
- Should show one row with:
  - `user_type`: `admin`
  - `is_verified`: `true`
  - `email_confirmed_at`: should have a timestamp

---

## ✅ After Running SQL

1. **Refresh your browser** (or clear cache)
2. **Go to:** http://localhost:3000/admin/login
3. **Email:** `admin@malawiproperties.com`
4. **Password:** `Admin123!@#`
5. **Click "Login"**

**Should work now! 🎉**

---

## 🔍 If Still Getting Errors

1. **Check browser console** (F12) for detailed error
2. **Verify profile exists** - Run this in SQL Editor:
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@malawiproperties.com';
   ```
3. **Check RLS policies** - Make sure "Public profiles are viewable by everyone" policy exists



