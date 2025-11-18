# 🔧 Vercel Environment Variables Setup

## Required Environment Variables for Hetzner Storage

Add these to your **Vercel Project Settings** → **Environment Variables**:

### Hetzner Object Storage

```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

### Optional (for private bucket + CDN)

```env
# HETZNER_S3_BUCKET_PUBLIC=false
# HETZNER_CDN_URL=https://your-cdn-domain.com
```

---

## How to Add to Vercel

1. Go to: https://vercel.com/dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `HETZNER_S3_ENDPOINT`
   - **Value**: `https://fsn1.your-objectstorage.com`
   - **Environments**: Check **Production**, **Preview**, **Development**
   - Click **Save**
4. Repeat for all variables above

---

## After Adding Variables

1. **Redeploy** your Vercel project (or push a new commit)
2. New image uploads will use Hetzner Storage ✅
3. Old Supabase images will still work until you remove the bucket

---

## Important Notes

- ✅ **Do NOT** set `NEXT_PUBLIC_` prefix for Hetzner variables (they're server-side only)
- ✅ These are **private** credentials - only server can access them
- ✅ Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.) stay as they are
- ⚠️ After removing Supabase bucket, old image URLs will break

