# ✅ Post-Deployment Checklist

## 🎉 Your Site is Live!

Your Malawi Properties platform is now deployed at: `https://malawi-properties.vercel.app` (or similar)

---

## Step 1: Test Your Live Site

### Test These Pages:
- [ ] **Homepage:** `https://your-site.vercel.app`
- [ ] **Admin Login:** `https://your-site.vercel.app/admin/login`
- [ ] **Dashboard:** `https://your-site.vercel.app/dashboard` (after login)
- [ ] **Admin Dashboard:** `https://your-site.vercel.app/admin` (after admin login)

### Check:
- [ ] Site loads correctly
- [ ] No console errors (F12 → Console)
- [ ] Pages navigate correctly
- [ ] Styling looks good

---

## Step 2: Update Supabase Redirect URLs

**Critical:** Update Supabase to allow authentication from your Vercel URL.

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **URL Configuration**

2. Update these settings:

   **Site URL:**
   ```
   https://your-vercel-url.vercel.app
   ```

   **Redirect URLs (add these):**
   ```
   https://your-vercel-url.vercel.app/**
   https://your-vercel-url.vercel.app/auth/callback
   https://your-vercel-url.vercel.app/admin/login
   ```

3. Click **"Save"**

---

## Step 3: Create Admin User

### Option A: Via Setup Page
1. Visit: `https://your-site.vercel.app/setup/admin`
2. Enter:
   - Email: `admin@malawiproperties.com`
   - Password: (your secure password)
3. Click "Create Admin User"

### Option B: Via Supabase Dashboard (if Option A fails)
1. Go to Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Email: `admin@malawiproperties.com`
3. Password: (your secure password)
4. Check **"Auto Confirm"**
5. Copy the **User ID**
6. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO profiles (id, email, full_name, user_type, is_verified, is_diaspora)
VALUES (
  'PASTE_USER_ID_HERE',
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

## Step 4: Create Test Users

1. Visit: `https://your-site.vercel.app/setup/test-users`
2. Click **"Create All Test Users"** or create them individually

**Test Accounts:**
- **Seller:** `test.seller@example.com` / `TestSeller123!`
- **Agent:** `test.agent@example.com` / `TestAgent123!`
- **Buyer:** `test.buyer@example.com` / `TestBuyer123!`

---

## Step 5: Test Key Features

### Test Property Listing:
- [ ] Log in as seller/agent
- [ ] Go to Dashboard
- [ ] Add a test property
- [ ] View property on marketplace

### Test Inquiry System:
- [ ] View property as buyer (not logged in)
- [ ] Fill out buyer details form
- [ ] Submit inquiry
- [ ] Check seller/agent dashboard for inquiry

### Test "Mark as Sold":
- [ ] In seller/agent dashboard
- [ ] Click "Mark as Sold" on a property
- [ ] Fill sale details (optional)
- [ ] Verify property hidden from marketplace

### Test Admin Dashboard:
- [ ] Log in as admin
- [ ] View Admin Dashboard
- [ ] Check all analytics sections
- [ ] Verify data displays correctly

---

## Step 6: Add Custom Domain (Optional - Later)

When you're ready to add your domain:

1. Go to Vercel → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `malawiproperties.co.za`)
3. Follow DNS instructions
4. Wait for DNS propagation (5-30 minutes)
5. Update Supabase redirect URLs to include your domain

---

## 🐛 Troubleshooting

### Can't log in?
- Check Supabase redirect URLs are updated
- Check browser console for errors
- Verify environment variables are set in Vercel

### Database errors?
- Check Supabase is connected
- Verify RLS policies are correct
- Check Supabase logs for errors

### Build failed?
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

---

## ✅ You're All Set!

Once you've tested everything:
- Start adding real properties
- Share the site URL with users
- Monitor the Admin Dashboard for activity
- Collect data and insights

**Your platform is live!** 🚀

