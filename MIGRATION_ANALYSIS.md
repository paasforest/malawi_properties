# 📊 Hetzner Storage Migration - Complete Analysis

## ✅ What We've Done

### 1. **Code Changes**

#### New Files Created:
- ✅ `src/lib/storage.ts` - Hetzner S3-compatible storage client
- ✅ `app/api/upload/route.ts` - Secure upload API endpoint (server-side)
- ✅ `scripts/test-hetzner-storage.ts` - Test script for Hetzner connection
- ✅ Documentation files (see below)

#### Modified Files:
- ✅ `src/components/PropertyForm.tsx` - Updated to use Hetzner instead of Supabase Storage
- ✅ `package.json` - Added AWS SDK dependencies:
  - `@aws-sdk/client-s3` (v3.693.0)
  - `@aws-sdk/s3-request-presigner` (v3.693.0)

#### Documentation Created:
- ✅ `STORAGE_MIGRATION_HETZNER.md` - Complete migration guide
- ✅ `HETZNER_SETUP.md` - Quick setup guide
- ✅ `BUCKET_SECURITY.md` - Security options (public vs private)
- ✅ `TEST_HETZNER_UPLOAD.md` - Testing instructions
- ✅ `VERCEL_ENV_SETUP.md` - Vercel environment variables setup
- ✅ `REMOVE_SUPABASE_STORAGE.md` - Guide for removing Supabase bucket
- ✅ `env.template` - Environment variable template

---

## 🔄 Architecture Changes

### Before (Supabase Storage):
```
Browser → Supabase Storage API → Supabase Bucket
❌ 50 MB file size limit
❌ Free tier: 1 GB storage, 2 GB bandwidth
❌ Pro tier: $25/month for 100 GB
```

### After (Hetzner Storage):
```
Browser → Next.js API (/api/upload) → Hetzner Object Storage
✅ No file size limit
✅ Pay per GB: ~€0.023/GB/month storage
✅ Pay per GB: ~€0.01/GB bandwidth
✅ Much cheaper for large files
```

---

## 📋 Current Status

### ✅ Completed:
1. Hetzner storage integration code
2. Upload API endpoint
3. PropertyForm updated to use Hetzner
4. Test script verified connection works
5. All documentation created

### ⏳ Pending:
1. **Commit changes to Git** (ready to commit)
2. **Add environment variables to Vercel** (see `VERCEL_ENV_SETUP.md`)
3. **Deploy to Vercel**
4. **Test uploads in production**
5. **Remove Supabase Storage bucket** (after verifying Hetzner works)

---

## 🔐 Environment Variables Required

### For Vercel (Production):

**Server-Side Only (NO `NEXT_PUBLIC_` prefix):**
```env
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=C9B9AV7QGZL3VJOJYG0D
HETZNER_S3_SECRET_KEY=ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm
HETZNER_S3_BUCKET=hope-properties-images
```

**Optional:**
```env
# HETZNER_S3_BUCKET_PUBLIC=false  # Set to false for private bucket
# HETZNER_CDN_URL=https://your-cdn-domain.com  # If using CDN
```

**Keep Existing (Supabase Auth/DB):**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🎯 Next Steps (In Order)

### Step 1: Commit Code ✅
```bash
git add .
git commit -m "feat: Migrate image uploads to Hetzner Object Storage"
git push origin main
```

### Step 2: Add Environment Variables to Vercel
1. Go to: https://vercel.com/dashboard → Your Project
2. Settings → Environment Variables
3. Add all 5 Hetzner variables (see above)
4. Apply to: Production, Preview, Development

### Step 3: Deploy
- Push to main (Vercel auto-deploys)
- OR trigger manual deployment in Vercel

### Step 4: Test in Production
- Try uploading an image
- Verify it goes to Hetzner (check bucket)
- Check browser console for errors

### Step 5: Remove Supabase Storage (After Testing)
- See `REMOVE_SUPABASE_STORAGE.md` for instructions
- Options:
  - **Option A**: Keep bucket (old images still work)
  - **Option B**: Migrate images first, then delete
  - **Option C**: Delete bucket immediately (lose old images)

---

## 💰 Cost Analysis

### Supabase Storage (Old):
- **Free Tier**: 1 GB storage, 2 GB/month bandwidth
- **Pro Tier**: $25/month for 100 GB storage, 200 GB/month bandwidth
- **Limitation**: 50 MB per file

### Hetzner Storage (New):
- **Storage**: €0.023/GB/month (~$0.025/GB)
- **Bandwidth**: €0.01/GB (~$0.011/GB)
- **No file size limits**

### Example Cost Comparison:

**Scenario: 1000 properties, 10 images each (2 MB avg) = 20 GB storage, 100 GB/month bandwidth**

| Service | Storage Cost | Bandwidth Cost | Total/Month |
|---------|-------------|----------------|-------------|
| Supabase Pro | $25 | Included | **$25** |
| Hetzner | €0.46 (~$0.50) | €1.00 (~$1.10) | **~$1.60** |

**Savings: ~$23.40/month (94% cheaper!)**

---

## ⚠️ Important Considerations

### 1. **Old Images**
- Currently stored in Supabase Storage bucket `property-images`
- Will continue to work until bucket is deleted
- Database has URLs pointing to Supabase
- **Decision needed**: Migrate or delete?

### 2. **Migration Impact**
- New uploads: ✅ Go to Hetzner (no limit)
- Old images: ✅ Still work (if bucket kept)
- Mixed URLs: ✅ Both will work simultaneously

### 3. **Breaking Changes**
- ❌ None - old images still work
- ✅ New uploads use Hetzner automatically
- ✅ No code changes needed after deployment

### 4. **Rollback Plan**
- If issues arise, can revert commit
- Old Supabase Storage code is removed but bucket still exists
- Can quickly re-enable Supabase if needed

---

## 🧪 Testing Status

### ✅ Tested Locally:
- ✅ Hetzner connection works
- ✅ File upload works
- ✅ File download works
- ✅ URL generation works
- ✅ File deletion works

### ⏳ Needs Testing in Production:
- [ ] Upload via Vercel production site
- [ ] Verify images appear in Hetzner bucket
- [ ] Verify images display correctly on site
- [ ] Test large file uploads (> 50 MB)
- [ ] Check error handling

---

## 📁 File Structure

```
project/
├── app/
│   └── api/
│       └── upload/
│           └── route.ts          ← NEW: Upload API endpoint
├── src/
│   ├── lib/
│   │   ├── storage.ts            ← NEW: Hetzner storage client
│   │   └── supabase.ts           ← Existing (unchanged)
│   └── components/
│       └── PropertyForm.tsx      ← MODIFIED: Uses Hetzner now
├── scripts/
│   └── test-hetzner-storage.ts   ← NEW: Test script
├── package.json                  ← MODIFIED: Added AWS SDK
└── docs/
    ├── STORAGE_MIGRATION_HETZNER.md
    ├── HETZNER_SETUP.md
    ├── BUCKET_SECURITY.md
    ├── VERCEL_ENV_SETUP.md
    ├── REMOVE_SUPABASE_STORAGE.md
    └── env.template
```

---

## 🚀 Deployment Checklist

### Pre-Deployment:
- [x] Code changes complete
- [x] Local testing successful
- [x] Documentation created
- [ ] Code committed to Git
- [ ] Code pushed to repository

### Vercel Setup:
- [ ] Environment variables added
- [ ] Production deployment triggered
- [ ] Deployment successful

### Post-Deployment:
- [ ] Test image upload in production
- [ ] Verify Hetzner bucket receives files
- [ ] Verify images display correctly
- [ ] Monitor for errors

### Cleanup (After Verification):
- [ ] Decide on Supabase bucket removal
- [ ] Execute removal plan (see `REMOVE_SUPABASE_STORAGE.md`)
- [ ] Update database if needed

---

## 📊 Summary

### ✅ Benefits:
1. **No 50 MB limit** - Upload any file size
2. **94% cost savings** - Much cheaper than Supabase Pro
3. **Better scalability** - Pay only for what you use
4. **Simple architecture** - One storage solution
5. **No breaking changes** - Old images still work

### ⚠️ Risks:
1. **Old images** - Need migration or deletion decision
2. **Production testing** - Needs verification in live environment
3. **Environment variables** - Must be set correctly in Vercel

### 🎯 Recommendation:
✅ **Proceed with deployment** - Code is ready, tested locally, and provides significant benefits with minimal risk.

---

## 📝 Quick Reference

**Hetzner Credentials:**
- Endpoint: `https://fsn1.your-objectstorage.com`
- Region: `fsn1`
- Bucket: `hope-properties-images`
- Access Key: `C9B9AV7QGZL3VJOJYG0D`
- Secret Key: `ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm`

**Vercel Setup:** See `VERCEL_ENV_SETUP.md`

**Remove Supabase:** See `REMOVE_SUPABASE_STORAGE.md`

---

**Status**: ✅ Ready for production deployment

