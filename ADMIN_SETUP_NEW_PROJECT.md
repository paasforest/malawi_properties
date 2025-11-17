# Admin Setup for New Supabase Project

## ✅ Updated Supabase Configuration

**New Project URL:** `https://ofuyghemecqstflnhixy.supabase.co`  
**New API Key:** Updated in `.env.local`

---

## 🔐 Create Admin User (Step-by-Step)

### Step 1: Restart Next.js Server

**IMPORTANT:** Environment variables only load when the server starts.

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Create Auth User in Supabase

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/auth/users

2. **Click "Add User"**

3. **Fill in the form:**
   - **Email**: `admin@malawiproperties.com`
   - **Password**: `Admin123!@#`
   - ✅ **Auto Confirm User** - Check this box
   - Click **"Create User"**

4. **IMPORTANT:** Copy the **User ID** (UUID) that appears after creation

### Step 3: Run Database Migration

**IMPORTANT:** First, you need to create the database schema!

1. **Go to SQL Editor in Supabase:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

2. **Run the main migration** to create all tables:
   - Copy contents from: `supabase/migrations/20251116143250_create_real_estate_platform.sql`
   - Paste in SQL Editor
   - Click "Run"

3. **Run admin policies** (optional, for admin access):
   - Copy contents from: `supabase/migrations/20251116000000_add_admin_policies.sql`
   - Paste in SQL Editor
   - Click "Run"

### Step 4: Create Admin Profile

**In Supabase SQL Editor**, run this (replace `YOUR_USER_ID_HERE` with the User ID from Step 2):

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',  -- Paste the User ID from Step 2
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

### Step 5: Verify Admin User

```sql
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE user_type = 'admin';
```

---

## 🔐 Login Credentials

**Admin Login URL:** http://localhost:3000/admin/login

- **Email**: `admin@malawiproperties.com`
- **Password**: `Admin123!@#`

---

## ✅ Verify Everything Works

1. ✅ Restart Next.js server (after updating `.env.local`)
2. ✅ Run database migrations in Supabase
3. ✅ Create admin auth user in Supabase
4. ✅ Create admin profile in Supabase
5. ✅ Visit: http://localhost:3000/admin/login
6. ✅ Login with credentials above
7. ✅ Should redirect to: http://localhost:3000/admin

---

## 🔍 Troubleshooting

**Error: "Failed to fetch"**
- ✅ Restart Next.js server after updating `.env.local`
- ✅ Check browser console for detailed error
- ✅ Verify Supabase project is active

**Error: "Table doesn't exist"**
- ✅ Run database migrations first (Step 3)

**Error: "Invalid login credentials"**
- ✅ Make sure you created the auth user first (Step 2)
- ✅ Make sure you created the profile (Step 4)
- ✅ Check email/password spelling

**Error: "Access denied"**
- ✅ Verify `user_type = 'admin'` in profiles table
- ✅ Run Step 4 again to update user_type

---

## 📝 Quick Checklist

- [ ] Updated `.env.local` with new Supabase URL and key
- [ ] Restarted Next.js server
- [ ] Ran database migration in Supabase
- [ ] Created auth user in Supabase
- [ ] Created admin profile in Supabase
- [ ] Verified admin user exists
- [ ] Tested login at `/admin/login`

---

**After completing these steps, your admin dashboard will be fully operational! 🚀**



