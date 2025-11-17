# Fix Email Confirmation Error

## ✅ Quick Fix: Confirm Email in Supabase

The user was created but needs email confirmation. Here's how to fix it:

### Method 1: Confirm Email in Supabase Dashboard (Fastest)

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/auth/users

2. **Find your admin user:**
   - Look for: `admin@malawiproperties.com`
   - Or search for User ID: `0eb208ce-566c-420c-80a9-a30286568ccb`

3. **Click on the user** to open details

4. **Click "Confirm Email"** button or change **"Email Confirmed"** to **true**

5. **Save changes**

6. **Try login again:** http://localhost:3000/admin/login

---

### Method 2: Disable Email Confirmation (For Development)

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/auth/settings

2. **Find "Email Auth" section**

3. **Uncheck "Enable email confirmations"** (or similar)

4. **Save settings**

5. **Create new admin user** (the old one might still need confirmation)

---

### Method 3: Run SQL to Confirm Email

**Go to SQL Editor:**
- https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Run this SQL:**

```sql
-- Confirm the admin user's email (only email_confirmed_at, confirmed_at is generated)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';

-- Verify it worked
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';
```

**Then create the profile if not exists:**

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  '0eb208ce-566c-420c-80a9-a30286568ccb',
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

---

## ✅ After Fixing

1. Go to: http://localhost:3000/admin/login
2. Email: `admin@malawiproperties.com`
3. Password: `Admin123!@#`
4. Should login successfully!

