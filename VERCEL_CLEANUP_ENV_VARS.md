# 🧹 Vercel Environment Variables Cleanup Guide

## ✅ What Your Code Actually Uses

**Your codebase ONLY uses:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Used in `src/lib/supabase.ts`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Used in `src/lib/supabase.ts`

**Your code does NOT use:**
- ❌ `SUPABASE_URL` (without `NEXT_PUBLIC_`) - Duplicate, not used
- ❌ `SUPABASE_ANON_KEY` (without `NEXT_PUBLIC_`) - Duplicate, not used
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Not used in your code
- ❌ `POSTGRES_USER` - Not used (direct Postgres connection)
- ❌ `POSTGRES_HOST` - Not used (direct Postgres connection)
- ❌ `POSTGRES_PASSWORD` - Not used (direct Postgres connection)
- ❌ `POSTGRES_DATABASE` - Not used (direct Postgres connection)

---

## 🧹 Recommended Cleanup

### ✅ KEEP These (Required):

```env
NEXT_PUBLIC_SUPABASE_URL=https://ofuyghemecqstflnhixy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Why keep:** These are actively used by your app.

---

### ❌ You Can Remove These (Duplicates/Unused):

```env
SUPABASE_URL (remove - duplicate of NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_ANON_KEY (remove - duplicate of NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_SERVICE_ROLE_KEY (remove - not used)
POSTGRES_USER (remove - not used)
POSTGRES_HOST (remove - not used)
POSTGRES_PASSWORD (remove - not used)
POSTGRES_DATABASE (remove - not used)
```

**Why remove:** 
- Duplicates are redundant
- Unused vars add clutter
- No harm keeping them, but cleaner to remove

---

### ➕ ADD These (New - Required):

```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

**Why add:** Required for Hetzner image storage.

---

## 📊 Final Environment Variables List

### After Cleanup, You Should Have:

**Supabase (2 variables - KEEP):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ofuyghemecqstflnhixy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Hetzner (5 variables - ADD):**
```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

**Total: 7 variables** (2 Supabase + 5 Hetzner)

---

## ✅ Step-by-Step Cleanup

### Step 1: Keep Required Supabase Variables
- ✅ Keep `NEXT_PUBLIC_SUPABASE_URL`
- ✅ Keep `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Remove Duplicates/Unused (Optional)
- ❌ Delete `SUPABASE_URL` (duplicate)
- ❌ Delete `SUPABASE_ANON_KEY` (duplicate)
- ❌ Delete `SUPABASE_SERVICE_ROLE_KEY` (unused)
- ❌ Delete `POSTGRES_USER` (unused)
- ❌ Delete `POSTGRES_HOST` (unused)
- ❌ Delete `POSTGRES_PASSWORD` (unused)
- ❌ Delete `POSTGRES_DATABASE` (unused)

### Step 3: Add Hetzner Variables
- ➕ Add `HETZNER_S3_ENDPOINT`
- ➕ Add `HETZNER_S3_REGION`
- ➕ Add `HETZNER_S3_ACCESS_KEY`
- ➕ Add `HETZNER_S3_SECRET_KEY`
- ➕ Add `HETZNER_S3_BUCKET`

### Step 4: Apply to All Environments
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 5: Redeploy
- After cleanup, redeploy in Vercel

---

## ⚠️ Important Notes

### About `NEXT_PUBLIC_` Prefix:

**`NEXT_PUBLIC_SUPABASE_URL` vs `SUPABASE_URL`:**
- `NEXT_PUBLIC_` = Exposed to browser (client-side accessible)
- Without `NEXT_PUBLIC_` = Server-side only (not exposed to browser)
- Your code uses `NEXT_PUBLIC_` versions, so those are the ones that matter

### About Duplicates:

**Having duplicates won't break anything:**
- Keeping `SUPABASE_URL` alongside `NEXT_PUBLIC_SUPABASE_URL` is harmless
- It's just redundant and adds clutter
- Your code will still work fine with both

**Removing duplicates is optional:**
- You can keep them if you prefer
- Removing them just makes the list cleaner
- No functional impact either way

### About Postgres Variables:

**Why they exist:**
- Added for direct Postgres connection (bypassing Supabase API)
- Your app doesn't use direct Postgres connection
- App uses Supabase client (via `NEXT_PUBLIC_` vars)

**Safe to remove:**
- Not used anywhere in your codebase
- Can be safely deleted

---

## 🎯 Quick Decision Guide

| Variable | Action | Reason |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ **KEEP** | Used by app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ **KEEP** | Used by app |
| `SUPABASE_URL` | ❌ **Remove** | Duplicate (optional) |
| `SUPABASE_ANON_KEY` | ❌ **Remove** | Duplicate (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **Remove** | Not used (optional) |
| `POSTGRES_*` (4 vars) | ❌ **Remove** | Not used (optional) |
| `HETZNER_S3_*` (5 vars) | ➕ **ADD** | Required for storage |

---

## ✅ Final Checklist

**After cleanup, you should have exactly 7 variables:**

- [x] `NEXT_PUBLIC_SUPABASE_URL` (keep)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (keep)
- [ ] `HETZNER_S3_ENDPOINT` (add)
- [ ] `HETZNER_S3_REGION` (add)
- [ ] `HETZNER_S3_ACCESS_KEY` (add)
- [ ] `HETZNER_S3_SECRET_KEY` (add)
- [ ] `HETZNER_S3_BUCKET` (add)

**Total: 7 variables** (down from 11)

---

**Note:** Removing duplicates is optional - your app will work fine with them. But cleaning them up makes the environment variables list cleaner and easier to manage.

