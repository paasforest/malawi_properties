# ✅ Quick Test Guide - Verify Hetzner Upload

## 🎉 Great! Supabase is Working

**Your console shows:**
```
✅ Supabase initialized: {url: 'https://ofuyghemecqstflnhixy.s...', keyLength: 208, ...}
```

**This means:**
- ✅ Supabase database connection is working
- ✅ Environment variables are correct
- ✅ App is connected to database

---

## 🧪 Now Test Image Upload

### Step 1: Upload an Image

1. **Go to your production site**
2. **Login as agent or owner**
3. **Click "Add Property" or edit existing property**
4. **Select an image file** (any size, can test with large file)
5. **Upload/Save the property**

---

### Step 2: Check Console Logs

**While uploading, watch the browser console (F12 → Console)**

**You should see:**
```
📸 Uploading 1 image(s)...
  Uploading: image.jpg -> property-{userId}/{timestamp}-{random}.jpg
📤 Sending upload request to /api/upload
📥 Upload response: { status: 200, ok: true }
✅ Upload successful, URL: https://fsn1.your-objectstorage.com/hope-properties-images/property-{userId}/...
```

**✅ Success = Hetzner is working!**

---

### Step 3: Check Network Tab

**Open DevTools (F12) → Network tab**

**When uploading, you should see:**
- ✅ `POST /api/upload` → Status: 200
- ❌ Should NOT see `supabase.co/storage/v1/object/...`

**✅ No Supabase storage calls = Migration successful!**

---

### Step 4: Verify in Hetzner

1. **Go to Hetzner Cloud Console**
2. **Object Storage → `hope-properties-images` bucket**
3. **Check if your uploaded file is there**

**✅ File in Hetzner bucket = Confirmed working!**

---

## ✅ Expected Results

### ✅ Everything Working:
```
✅ Supabase initialized (you already see this)
✅ Upload request to /api/upload
✅ Upload response: 200 OK
✅ Upload successful, URL: https://fsn1.your-objectstorage.com/...
✅ File appears in Hetzner bucket
✅ Image displays correctly on property
```

---

## ⚠️ If You See Errors

### Error 1: "Upload failed" or Status 500

**Check:**
- ✅ All 5 Hetzner environment variables are set in Vercel
- ✅ Bucket name matches: `hope-properties-images`
- ✅ Access keys are correct
- ✅ Bucket is public (or CDN configured)

**Fix:**
- Double-check environment variables in Vercel
- Verify Hetzner bucket exists and is public
- Check Vercel function logs for detailed error

---

### Error 2: Still Seeing Supabase URLs

**If you see:**
```
POST https://ofuyghemecqstflnhixy.supabase.co/storage/v1/object/property-images/...
```

**This means:**
- ❌ Code not updated (browser cache)
- ❌ Deployment didn't include latest code

**Fix:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check Vercel deployment logs - verify latest commit is deployed

---

### Error 3: Image Doesn't Display

**If upload succeeds but image doesn't show:**

**Check:**
- ✅ Image URL in database is correct
- ✅ Hetzner bucket is public
- ✅ Image URL format is: `https://fsn1.your-objectstorage.com/hope-properties-images/...`

**Fix:**
- Check browser console for image load errors
- Verify bucket is public in Hetzner console
- Check image URL in property data

---

## 🎯 Quick Status Check

**Current Status:**
- ✅ Supabase initialized → **WORKING**
- ⏳ Image upload → **TEST NOW**
- ⏳ Hetzner bucket → **VERIFY AFTER UPLOAD**
- ⏳ Image display → **CHECK AFTER UPLOAD**

---

## 📝 What to Report

**After testing upload, let me know:**

**✅ If working:**
- "Upload successful!"
- "File in Hetzner bucket"
- "Images displaying correctly"

**❌ If not working:**
- Console error message
- Network tab status codes
- Vercel function logs (if available)

---

**Next Step: Try uploading an image and share the console output!** 🚀

