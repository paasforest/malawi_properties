# 🗑️ Delete Supabase Storage Bucket - Step by Step

## ⚠️ Warning

**Deleting the bucket will:**
- ❌ Make all old Supabase image URLs return 404 errors
- ❌ Break display of existing properties with Supabase images
- ✅ **BUT** new uploads to Hetzner will continue working
- ✅ Error handling will show placeholders for broken images

**Before deleting, you can:**
- Option 1: Just delete (old images will show placeholders)
- Option 2: Migrate images first (see migration guide)
- Option 3: Wait until you've verified Hetzner works in production

---

## 🚀 Steps to Delete Supabase Bucket

### Step 1: Go to Supabase Storage

1. **Open Supabase Dashboard:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/storage/buckets

2. **Find the bucket:**
   - Look for bucket named: `property-images`

### Step 2: Delete the Bucket

1. **Click on the bucket** `property-images`

2. **Go to Settings:**
   - Click **"Settings"** tab (or gear icon)

3. **Delete Bucket:**
   - Scroll down to **"Delete Bucket"** section
   - Click **"Delete Bucket"** button
   - Type bucket name to confirm: `property-images`
   - Click **"Delete"** or **"Confirm"**

**OR**

1. **Click on bucket** `property-images`
2. Click **three dots (⋮)** menu
3. Click **"Delete bucket"**
4. Confirm deletion

### Step 3: Verify Deletion

1. **Go back to Storage Buckets page**
2. **Confirm `property-images` bucket is gone**
3. ✅ Bucket deleted!

---

## 🔄 After Deletion

### What Happens:

1. **Old Properties:**
   - Images from Supabase will show 404 errors
   - Error handling will display placeholders
   - Property data is not affected

2. **New Uploads:**
   - ✅ Continue working with Hetzner
   - ✅ No 50 MB limit
   - ✅ Stored in `hope-properties-images` bucket

3. **Display:**
   - Old images: Placeholder shown (graceful error handling)
   - New images: Display correctly from Hetzner

---

## 🧹 Optional: Clean Up Database URLs

If you want to remove Supabase URLs from the database (optional):

### Query to Check How Many Properties Have Supabase Images:

```sql
SELECT 
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE array_length(images, 1) > 0) as properties_with_images,
  COUNT(*) FILTER (
    WHERE array_length(images, 1) > 0 
    AND images[1] LIKE '%supabase.co/storage/v1/object/property-images%'
  ) as properties_with_supabase_images
FROM properties;
```

### Option A: Keep URLs (Recommended)
- Keep Supabase URLs in database
- Error handling shows placeholders
- No database changes needed

### Option B: Clear Old URLs
**⚠️ This removes image URLs from database (images will show as "No Image"):**

```sql
-- Clear all Supabase image URLs from properties
UPDATE properties
SET images = array[]::text[]
WHERE array_length(images, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(images) AS img
    WHERE img::text LIKE '%supabase.co/storage/v1/object/property-images%'
  );
```

**⚠️ Only run this if you're okay with removing old image references!**

---

## ✅ Checklist

- [ ] Verify Hetzner uploads work in production
- [ ] Test new property upload (should go to Hetzner)
- [ ] Go to Supabase Storage page
- [ ] Find `property-images` bucket
- [ ] Delete the bucket
- [ ] Verify bucket is deleted
- [ ] (Optional) Clean up database URLs
- [ ] (Optional) Test old properties show placeholders correctly

---

## 📊 Impact Summary

**Before Deletion:**
- ✅ Old Supabase images work
- ✅ New Hetzner images work
- ✅ All images display

**After Deletion:**
- ❌ Old Supabase images: 404 (show placeholder)
- ✅ New Hetzner images work
- ✅ Error handling prevents broken UI

---

## 🆘 If You Change Your Mind

**Can't undo bucket deletion!** But you can:
- Keep using Hetzner for new uploads ✅
- Old images will show placeholders (not broken UI)
- Property data is safe (only image URLs affected)

---

**Ready to delete? Follow the steps above! 🗑️**

