# Create Admin User - Quick Guide

## ✅ Default Admin Credentials

**Username/Email:** `admin@malawiproperties.com`  
**Password:** `Admin123!@#`

---

## 📝 Steps to Create Admin User

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/project/sejgrobmpsqctjripvaiu/auth/users
   - Click **"Add User"**

2. **Create Auth User**
   - **Email**: `admin@malawiproperties.com`
   - **Password**: `Admin123!@#`
   - **Auto Confirm User**: ✅ Check this box
   - Click **"Create User"**
   - **COPY THE USER ID** that appears (it's a UUID like `a1b2c3d4-...`)

3. **Create Admin Profile**
   - Go to **SQL Editor** in Supabase
   - Run this SQL (replace `YOUR_USER_ID_HERE` with the User ID you copied):

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',  -- Paste the User ID from step 2
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

4. **Verify Admin User**
   - Run this SQL to confirm:
```sql
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE user_type = 'admin';
```

---

### Method 2: Quick SQL (If you already have an auth user)

If you already created an auth user through the app:

1. **Get Your User ID**
   - Go to Supabase Dashboard > Authentication > Users
   - Find your user and copy the **User ID**

2. **Update to Admin**
   - Go to SQL Editor
   - Run:
```sql
UPDATE profiles
SET user_type = 'admin',
    is_verified = true
WHERE id = 'YOUR_USER_ID_HERE';
```

---

## 🔐 Login to Admin Dashboard

1. **Start your Next.js server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to Admin Login Page**:
   - Visit: http://localhost:3000/admin/login

3. **Enter Credentials**:
   - Email: `admin@malawiproperties.com`
   - Password: `Admin123!@#`

4. **Access Dashboard**:
   - After login, you'll be redirected to: http://localhost:3000/admin

---

## 🛡️ Security Note

**Change the default password after first login:**

1. Go to Supabase Dashboard > Authentication > Users
2. Find your admin user
3. Click "Reset Password" or update password
4. Or use Supabase Auth API to change password programmatically

---

## ✅ Verify Admin Access

After creating admin user, verify:

1. **Can access `/admin/login`** - ✅ Login page loads
2. **Can login with credentials** - ✅ Login successful
3. **Redirects to `/admin`** - ✅ Dashboard loads
4. **Can see all data** - ✅ Admin dashboard shows all metrics
5. **Can export data** - ✅ Export buttons work

---

## 🔧 Troubleshooting

**Issue: "Access denied" error**
- Solution: Make sure `user_type = 'admin'` in profiles table

**Issue: Can't login**
- Solution: Check email/password in Supabase Dashboard > Authentication > Users

**Issue: Profile doesn't exist**
- Solution: Run the INSERT SQL query above to create the profile

**Issue: Wrong user_type**
- Solution: Run the UPDATE SQL query to change user_type to 'admin'

---

## 📊 What You Can Do as Admin

✅ View all users, properties, inquiries  
✅ Monitor all data collection  
✅ View analytics and intelligence  
✅ Export all data (JSON)  
✅ Verify/reject agents  
✅ Track diaspora buyer patterns  
✅ Monitor district analytics  
✅ View conversion rates  
✅ Track revenue and sales  

---

**Admin dashboard is ready! Create your admin user and start monitoring all your data collection. 🚀**



