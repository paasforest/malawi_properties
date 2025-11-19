# ✅ How to Clean Up Vercel Environment Variables

## ❌ DON'T Delete Your Project!

**You do NOT need to delete the project!** Just clean up environment variables and redeploy.

---

## ✅ Simple Steps to Clean Up

### Step 1: Go to Environment Variables

1. Open: https://vercel.com/dashboard
2. Select your project: `malawi-properties` (or your project name)
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar

---

### Step 2: Remove Duplicate/Unused Variables

**For each of these variables, click the trash icon (🗑️) to delete:**

1. ❌ Delete `SUPABASE_URL` (duplicate of `NEXT_PUBLIC_SUPABASE_URL`)
2. ❌ Delete `SUPABASE_ANON_KEY` (duplicate of `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. ❌ Delete `SUPABASE_SERVICE_ROLE_KEY` (not used)
4. ❌ Delete `POSTGRES_USER` (not used)
5. ❌ Delete `POSTGRES_HOST` (not used)
6. ❌ Delete `POSTGRES_PASSWORD` (not used)
7. ❌ Delete `POSTGRES_DATABASE` (not used)

**Keep these:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (KEEP - used by app)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (KEEP - used by app)

---

### Step 3: Add Hetzner Variables

**Click "Add New" button and add these 5 variables:**

1. ➕ **Variable Name:** `HETZNER_S3_ENDPOINT`
   - **Value:** `https://fsn1.your-objectstorage.com`
   - ✅ Check: Production, Preview, Development

2. ➕ **Variable Name:** `HETZNER_S3_REGION`
   - **Value:** `fsn1`
   - ✅ Check: Production, Preview, Development

3. ➕ **Variable Name:** `HETZNER_S3_ACCESS_KEY`
   - **Value:** `C9B9AV7QGZL3VJOJYG0D`
   - ✅ Check: Production, Preview, Development

4. ➕ **Variable Name:** `HETZNER_S3_SECRET_KEY`
   - **Value:** `ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm`
   - ✅ Check: Production, Preview, Development
   - ✅ Check: "Sensitive" (hide value)

5. ➕ **Variable Name:** `HETZNER_S3_BUCKET`
   - **Value:** `hope-properties-images`
   - ✅ Check: Production, Preview, Development

**Click "Save" after adding each variable.**

---

### Step 4: Redeploy

**Option A: Automatic (Recommended)**
- After adding/deleting variables, Vercel may auto-redeploy
- Check "Deployments" tab - if new deployment starts, wait for it

**Option B: Manual Redeploy**
1. Go to **"Deployments"** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Or click **"Deploy"** button at top

---

## ✅ Final Result

**After cleanup, you should have exactly 7 variables:**

1. ✅ `NEXT_PUBLIC_SUPABASE_URL` (kept)
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (kept)
3. ✅ `HETZNER_S3_ENDPOINT` (added)
4. ✅ `HETZNER_S3_REGION` (added)
5. ✅ `HETZNER_S3_ACCESS_KEY` (added)
6. ✅ `HETZNER_S3_SECRET_KEY` (added)
7. ✅ `HETZNER_S3_BUCKET` (added)

---

## ⚠️ Important Notes

### Why NOT Delete Project?

**Deleting the project would:**
- ❌ Lose all deployment history
- ❌ Lose all environment variables (you'd have to re-add everything)
- ❌ Need to reconnect GitHub repo
- ❌ Need to reconfigure domain settings
- ❌ More work for no reason

**Just cleaning up variables:**
- ✅ Keeps everything intact
- ✅ Only changes what you need
- ✅ Quick and simple
- ✅ No risk

### About Variables:

**If you accidentally delete the wrong variable:**
- You can always add it back
- Just copy the value from this guide
- No permanent damage

**If deployment fails after cleanup:**
- Check build logs in Vercel
- Make sure all required variables are present
- Verify values are correct

---

## 🧪 After Cleanup & Redeploy

### Test Your App:

1. ✅ Visit your production URL
2. ✅ Test uploading an image
3. ✅ Check Hetzner bucket for uploaded file
4. ✅ Verify images display correctly
5. ✅ Check browser console for errors

---

## 📊 What Gets Cleaned Up

**Before (11 variables):**
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_URL` ❌ (duplicate)
- `SUPABASE_ANON_KEY` ❌ (duplicate)
- `SUPABASE_SERVICE_ROLE_KEY` ❌ (unused)
- `POSTGRES_USER` ❌ (unused)
- `POSTGRES_HOST` ❌ (unused)
- `POSTGRES_PASSWORD` ❌ (unused)
- `POSTGRES_DATABASE` ❌ (unused)

**After (7 variables):**
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `HETZNER_S3_ENDPOINT` ✅
- `HETZNER_S3_REGION` ✅
- `HETZNER_S3_ACCESS_KEY` ✅
- `HETZNER_S3_SECRET_KEY` ✅
- `HETZNER_S3_BUCKET` ✅

**Cleaner and easier to manage!**

---

## ✅ Summary

**DON'T delete project** ❌  
**DO clean up variables** ✅  
**DO redeploy after cleanup** ✅  

**That's it! Simple and safe.**

