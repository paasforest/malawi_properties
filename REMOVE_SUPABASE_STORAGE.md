# 🗑️ Remove Supabase Storage Bucket

## Why Remove It?

✅ **Simpler architecture** - All images in one place (Hetzner)  
✅ **Cost savings** - No Supabase storage costs  
✅ **No 50 MB limit** - Hetzner has no file size limits  
✅ **Better for scaling** - Hetzner is more cost-effective for large files  

---

## ⚠️ Important: Before Removing

### 1. Check Existing Images

Run this query in Supabase SQL Editor to see how many images you have:

```sql
SELECT 
  id,
  title,
  images,
  array_length(images, 1) as image_count,
  created_at
FROM properties
WHERE array_length(images, 1) > 0
ORDER BY created_at DESC;
```

### 2. Options for Old Images

#### Option A: Keep Old Images Working (Recommended Initially)
- **Don't delete the bucket yet**
- Old images will continue to work
- New uploads go to Hetzner
- Gradually migrate over time

#### Option B: Migrate All Images to Hetzner
- Download all images from Supabase
- Upload them to Hetzner
- Update database URLs
- Then delete Supabase bucket

#### Option C: Delete Bucket Immediately
- Old image URLs will break (404 errors)
- Only new uploads will work
- Fastest but loses existing images

---

## 🚀 Recommended Steps

### Step 1: Deploy Hetzner Code First

1. ✅ Commit and push code changes (already done)
2. ✅ Add environment variables to Vercel (see `VERCEL_ENV_SETUP.md`)
3. ✅ Deploy to Vercel
4. ✅ Test that new uploads work with Hetzner

### Step 2: Wait and Monitor

- Monitor for a few days/weeks
- Verify all new uploads go to Hetzner
- Check for any issues

### Step 3: Decide on Migration Strategy

Choose one:
- **Option A**: Keep both (no migration needed, just stop using Supabase)
- **Option B**: Migrate images gradually (see migration script below)
- **Option C**: Delete bucket (accept losing old images)

---

## 📦 How to Remove Supabase Bucket

Once you're ready:

1. **Go to Supabase Dashboard**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/storage/buckets

2. **Find the `property-images` bucket**

3. **Delete the bucket**
   - Click on the bucket
   - Click **Delete Bucket** or **Settings** → **Delete**
   - Confirm deletion

4. **Update Database (Optional)**
   
   If you want to clean up old image URLs from the database:
   
   ```sql
   -- Clear all old Supabase image URLs (use with caution!)
   UPDATE properties
   SET images = array[]::text[]
   WHERE array_length(images, 1) > 0
     AND images[1] LIKE '%supabase.co/storage/v1/object/property-images%';
   ```

   **⚠️ Warning**: This removes old image URLs from the database. Only do this if you've migrated them or don't need them.

---

## 📋 Migration Script (Optional)

If you want to migrate existing images from Supabase to Hetzner:

```bash
# This would require:
# 1. Download all images from Supabase bucket
# 2. Upload each to Hetzner
# 3. Update database with new URLs

# Example migration script structure:
# - List all Supabase images
# - Download each image
# - Upload to Hetzner with same path structure
# - Update properties.images array with new URLs
```

**Note**: This is complex and may require custom scripting. Contact if you need help building this.

---

## ✅ After Removal

- ✅ All new uploads go to Hetzner
- ✅ No 50 MB limit
- ✅ Lower storage costs
- ✅ Simpler architecture
- ⚠️ Old Supabase image URLs will return 404 (if bucket deleted)

---

## 📊 Cost Comparison

**Supabase Free Tier:**
- 1 GB storage
- 2 GB bandwidth/month
- 50 MB file size limit

**Hetzner (Your Usage):**
- ~€0.023/GB/month storage
- ~€0.01/GB egress
- No file size limits
- Example: 20 GB + 100 GB bandwidth = ~€1.50/month

**Recommendation**: ✅ Hetzner is much better for your use case!

