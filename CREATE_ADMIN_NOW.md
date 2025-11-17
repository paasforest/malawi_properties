# ✅ Admin User Created!

## 🎉 Auth User Created Successfully

**User ID:** `0eb208ce-566c-420c-80a9-a30286568ccb`  
**Email:** `admin@malawiproperties.com`  
**Password:** `Admin123!@#`

---

## ⚠️ Last Step: Create Admin Profile

The auth user was created, but we need to create the profile. 

### Run this SQL in Supabase SQL Editor:

**Go to:** https://app.supabase.com/project/ofuyghemecqstflnhixy/editor

**Copy and paste this SQL:**

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
    is_verified = true,
    email = 'admin@malawiproperties.com',
    full_name = 'Admin User';
```

**Click "Run"**

---

## ✅ Verify Admin Profile

After running the SQL above, verify it worked:

```sql
SELECT id, email, full_name, user_type, is_verified 
FROM profiles 
WHERE id = '0eb208ce-566c-420c-80a9-a30286568ccb';
```

Should show:
- `user_type`: `admin`
- `is_verified`: `true`

---

## 🔐 Login

**URL:** http://localhost:3000/admin/login

**Credentials:**
- **Email:** `admin@malawiproperties.com`
- **Password:** `Admin123!@#`

---

**After running the SQL above, you can login immediately! 🚀**



