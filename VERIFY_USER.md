# Verify User Account in Supabase

## Check if your user exists:

1. Go to **Supabase Dashboard**:
   - https://app.supabase.com/project/ofuyghemecqstflnhixy

2. Go to **Authentication** → **Users**

3. Look for email: `tshepochabalala220@gmail.com`

4. Check:
   - Does the user exist?
   - Is it **"Confirmed"** (email confirmed)?
   - What's the **User ID**?

5. Go to **Table Editor** → **profiles** table

6. Search for your email or User ID

7. Check:
   - Does a profile exist?
   - What's the **user_type**? (Should be `admin` for admin access)
   - Is **is_verified** = `true`?

---

## If user doesn't exist or is wrong type:

### Option 1: Create user via Supabase Dashboard

1. **Authentication** → **Users** → **Add User**
2. Email: `tshepochabalala220@gmail.com`
3. Password: `Hopemabuka@2022`
4. ✅ Check **"Auto Confirm User"**
5. Click **"Create User"**
6. Copy the **User ID** (UUID)

7. Go to **SQL Editor** and run:
```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'YOUR_USER_ID_HERE',  -- Paste the User ID from step 6
  'tshepochabalala220@gmail.com',
  'Admin User',
  'admin',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true;
```

### Option 2: Update existing user

If user exists but isn't admin, run in **SQL Editor**:

```sql
UPDATE profiles
SET user_type = 'admin',
    is_verified = true
WHERE email = 'tshepochabalala220@gmail.com';
```

---

## Test Login After Verification

1. Make sure user exists in **auth.users**
2. Make sure profile exists in **profiles** with `user_type = 'admin'`
3. Try logging in again
4. Check console for debugging logs

