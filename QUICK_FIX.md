# Quick Fix for "Failed to Fetch" Error

## ⚠️ Most Likely Cause: Admin User Not Created Yet

The error happens because you're trying to login with credentials that don't exist in Supabase yet.

## ✅ Solution: Create Admin User First

### Step 1: Create Auth User in Supabase

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/sejgrobmpsqctjripvaiu/auth/users

2. **Click "Add User" button**

3. **Fill in the form:**
   - **Email**: `admin@malawiproperties.com`
   - **Password**: `Admin123!@#`
   - ✅ **Check "Auto Confirm User"**
   - Click **"Create User"**

4. **IMPORTANT:** Copy the **User ID** (UUID) that appears after creation

### Step 2: Create Admin Profile

1. **Go to SQL Editor in Supabase:**
   - https://app.supabase.com/project/sejgrobmpsqctjripvaiu/editor

2. **Run this SQL** (replace `YOUR_USER_ID_HERE` with the UUID you copied):

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',
  'admin@malawiproperties.com',
  'Admin User',
  'admin',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true;
```

3. **Verify it worked:**
```sql
SELECT id, email, user_type FROM profiles WHERE user_type = 'admin';
```

### Step 3: Restart Your Server

```bash
# Stop the server (Ctrl+C if running)
# Then restart:
npm run dev
```

### Step 4: Try Login Again

1. Go to: http://localhost:3000/admin/login
2. Enter:
   - Email: `admin@malawiproperties.com`
   - Password: `Admin123!@#`
3. Click "Login"

---

## 🔍 If Still Getting "Failed to Fetch":

1. **Check browser console** (F12) for detailed error
2. **Check `.env.local`** exists and has correct values
3. **Restart Next.js server** (env vars only load on startup)
4. **Verify Supabase project is active** in dashboard

---

## ✅ After Creating Admin User

Once admin user exists, the login should work immediately.

Check browser console for detailed error messages if it still fails.



