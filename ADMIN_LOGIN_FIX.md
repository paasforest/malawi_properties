# 🔐 Admin Login - Create Admin User

## ❌ Current Error
**"Invalid email or password"** - This means the admin user doesn't exist in Supabase yet.

## ✅ Solution: Create Admin User in Supabase

### Step 1: Go to Supabase Dashboard

**Visit:** https://app.supabase.com/project/ofuyghemecqstflnhixy/auth/users

(If that URL doesn't work, find your project at: https://app.supabase.com/)

---

### Step 2: Create Auth User

1. Click **"Add User"** button (top right)
2. Fill in the form:
   - **Email**: `admin@malawiproperties.com`
   - **Password**: `Admin123!@#`
   - ✅ **Check "Auto Confirm User"** (important!)
   - Click **"Create User"**
3. **IMPORTANT:** Copy the **User ID** (UUID) that appears - you'll need it in Step 3!

---

### Step 3: Create Admin Profile

1. Go to **SQL Editor** in Supabase:
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

2. Run this SQL (replace `YOUR_USER_ID_HERE` with the User ID from Step 2):

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',  -- Paste the User ID from Step 2 here
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

3. Click **"Run"** button

---

### Step 4: Verify Admin User Exists

Run this SQL to verify:

```sql
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE user_type = 'admin';
```

You should see your admin user with `user_type = 'admin'`.

---

### Step 5: Login

**URL:** Go to your deployed site or `http://localhost:3000/admin/login`

**Credentials:**
- **Email**: `admin@malawiproperties.com`
- **Password**: `Admin123!@#`

Click **"Login"**

---

## 🔍 Troubleshooting

**Still getting "Invalid email or password"?**

1. **Check if auth user exists:**
   - Go to Supabase Dashboard > Authentication > Users
   - Look for `admin@malawiproperties.com`
   - If not there, go back to Step 2

2. **Check if profile exists:**
   - Run the SQL from Step 4
   - If no results, go back to Step 3

3. **Check password:**
   - Password is: `Admin123!@#` (with capital A, numbers, and special chars)
   - Make sure there are no extra spaces

4. **Check browser console (F12):**
   - Look for detailed error messages
   - Check Network tab for failed requests

---

## ✅ Expected Result

After completing all steps, you should be able to:
- ✅ Login at `/admin/login`
- ✅ See the Admin Dashboard
- ✅ Access Analytics and Intelligence pages

