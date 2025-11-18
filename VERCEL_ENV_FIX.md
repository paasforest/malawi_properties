# 🔧 Fix Vercel Environment Variables

## Issue Found:

You have a duplicate/incomplete variable:
- `NEXT_PUBLIC_SUPABASE_UR` ❌ (incomplete - missing "L")
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (correct)

## ✅ Action Required:

### Step 1: Remove Duplicate Variable

In Vercel → Settings → Environment Variables:

1. **DELETE** `NEXT_PUBLIC_SUPABASE_UR` (the incomplete one)
2. **KEEP** `NEXT_PUBLIC_SUPABASE_URL` (the correct one)

### Step 2: Verify Correct Variables

Make sure you only have these TWO variables:

✅ **NEXT_PUBLIC_SUPABASE_URL**
- Value: `https://uyghemecqstflnhixy.supabase.co`

✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdXlnaGVtZWNxc3RmbG5oaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDQ0NzUsImV4cCI6MjA3ODg4MDQ3NX0.kD12l4KnDFZuRNFCSOEIQWKCGdvy8CBCnuL2ukC0TAc`

### Step 3: Update Supabase Redirect URLs

**This is CRITICAL for login to work:**

1. Go to **Supabase Dashboard**
2. Project: `uyghemecqstflnhixy`
3. **Authentication** → **URL Configuration**
4. **Site URL:** `https://your-vercel-url.vercel.app` (your actual Vercel URL)
5. **Redirect URLs:** Add:
   ```
   https://your-vercel-url.vercel.app/**
   https://your-vercel-url.vercel.app/auth/callback
   ```
6. Click **"Save"**

### Step 4: Redeploy

After fixing variables and Supabase URLs:
1. Go to Vercel → **Deployments**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to finish

---

## ✅ After These Steps:

1. Delete duplicate `NEXT_PUBLIC_SUPABASE_UR`
2. Keep only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Update Supabase redirect URLs with your Vercel URL
4. Redeploy in Vercel
5. Try logging in again

**The "Failed to fetch" error should be fixed!**

