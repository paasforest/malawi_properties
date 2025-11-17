# 🚀 Quick Setup - Run These Steps

## Step 1: Run Database Migration First

**This is CRITICAL - do this first before creating admin user!**

1. Go to Supabase SQL Editor:
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

2. Copy and paste the entire migration file content:
   - Open: `supabase/migrations/20251116143250_create_real_estate_platform.sql`
   - Copy ALL the SQL code
   - Paste in Supabase SQL Editor
   - Click **"Run"** button

3. Verify tables were created:
   - Go to **Table Editor** in Supabase
   - You should see: `profiles`, `properties`, `agents`, `inquiries`, `property_views`, `market_analytics`

---

## Step 2: Restart Your Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

This loads the new Supabase credentials from `.env.local`

---

## Step 3: Create Admin User - Choose ONE Method:

### Method A: Automated Setup Page (Easiest) ⭐

1. **Visit:** http://localhost:3000/setup/admin
2. **Fill in the form:**
   - Email: `admin@malawiproperties.com`
   - Password: `Admin123!@#`
3. **Click "Create Admin User"**
4. Wait for success message
5. **Go to:** http://localhost:3000/admin/login
6. **Login** with the same credentials

### Method B: Command Line Script

1. **Install tsx** (if not installed):
   ```bash
   npm install -g tsx
   ```

2. **Run the script:**
   ```bash
   npx tsx scripts/create-admin-auto.ts
   ```

3. **Then login at:** http://localhost:3000/admin/login

---

## Step 4: Login

**URL:** http://localhost:3000/admin/login

**Credentials:**
- Email: `admin@malawiproperties.com`
- Password: `Admin123!@#`

---

## ✅ Done!

After completing these steps:
- ✅ Database tables created
- ✅ Admin user created
- ✅ Can login at `/admin/login`
- ✅ Can access admin dashboard at `/admin`

---

## 🔍 If Setup Page Doesn't Work

The setup page might fail due to RLS policies. In that case:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `admin@malawiproperties.com`
4. Password: `Admin123!@#`
5. ✅ Check "Auto Confirm User"
6. Click "Create User"
7. **Copy the User ID** (UUID)
8. Go to SQL Editor and run:

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'PASTE_USER_ID_HERE',  -- Replace with User ID from step 7
  'admin@malawiproperties.com',
  'Admin User',
  'admin',
  true,
  false
);
```

---

**The automated setup page at `/setup/admin` should do all this for you automatically! Try that first.**



