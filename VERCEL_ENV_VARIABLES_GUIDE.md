# 🔐 Vercel Environment Variables Guide

## ✅ KEEP These Supabase Variables

**You MUST keep these** - they're still needed for database and authentication:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ofuyghemecqstflnhixy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Why keep them?**
- ✅ **Database** - Still using Supabase for properties, profiles, agents, etc.
- ✅ **Authentication** - Still using Supabase Auth for user login
- ✅ **API calls** - All your database queries use these
- ❌ Only storage moved to Hetzner

---

## ➕ ADD These Hetzner Variables

**Add these NEW variables** (don't remove anything):

```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

---

## 📊 Complete Environment Variables List

### Supabase (KEEP - Required for DB & Auth):
```env
NEXT_PUBLIC_SUPABASE_URL=https://ofuyghemecqstflnhixy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Hetzner (ADD - Required for Image Storage):
```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

**Total: 7 environment variables** (2 Supabase + 5 Hetzner)

---

## 🚫 What You DON'T Need

**These are NOT needed in Vercel:**
- ❌ Any Supabase Storage-specific variables (if any existed)
- ❌ Any bucket name variables for Supabase storage

**Note:** If you had Supabase storage variables, you can remove those, but keep the main Supabase URL and Anon Key!

---

## ✅ Action Items

### Step 1: Check Current Variables
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check what's currently there

### Step 2: Keep Supabase Variables
- ✅ **Keep:** `NEXT_PUBLIC_SUPABASE_URL`
- ✅ **Keep:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ **Remove:** Any Supabase storage bucket variables (if they exist)

### Step 3: Add Hetzner Variables
- ➕ **Add:** All 5 Hetzner variables listed above

### Step 4: Apply to All Environments
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 📋 Summary

| Variable Type | Action | Why |
|--------------|--------|-----|
| **Supabase URL** | ✅ **KEEP** | Needed for database & auth |
| **Supabase Anon Key** | ✅ **KEEP** | Needed for database & auth |
| **Supabase Storage** | ❌ **Remove** (if exists) | No longer using |
| **Hetzner Variables** | ➕ **ADD** | New storage system |

---

## ✅ Final Checklist

**In Vercel Environment Variables, you should have:**

- [x] `NEXT_PUBLIC_SUPABASE_URL` (existing)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (existing)
- [ ] `HETZNER_S3_ENDPOINT` (add new)
- [ ] `HETZNER_S3_REGION` (add new)
- [ ] `HETZNER_S3_ACCESS_KEY` (add new)
- [ ] `HETZNER_S3_SECRET_KEY` (add new)
- [ ] `HETZNER_S3_BUCKET` (add new)

**Total: 2 Supabase (keep) + 5 Hetzner (add) = 7 variables**

---

## ⚠️ Important Notes

1. **Don't delete Supabase variables** - Your app will break!
2. **Only storage moved** - Database and auth still use Supabase
3. **Add Hetzner variables** - Don't replace, just add them
4. **Redeploy after adding** - Vercel needs to rebuild with new vars

---

**In short: Keep Supabase variables, add Hetzner variables! ✅**

