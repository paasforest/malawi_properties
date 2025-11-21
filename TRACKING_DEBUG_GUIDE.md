# 🔍 Visit Tracking Debug Guide

## Issues Fixed

### Problems Found:
1. **Silent Failures**: Errors were being caught but not logged properly
2. **Session Storage Logic**: Was preventing tracking if visited within 5 minutes
3. **Direct Supabase Calls**: Less reliable than API routes
4. **No Error Visibility**: Hard to debug when tracking failed

### Solutions Implemented:
1. ✅ **API Route**: Created `/api/track-visit` for reliable server-side tracking
2. ✅ **Better Error Logging**: All errors now logged to console
3. ✅ **Fixed Session Logic**: Tracks each page properly
4. ✅ **Route Change Tracking**: Tracks on every page navigation
5. ✅ **Test Endpoint**: `/api/test-tracking` to verify database access

---

## How to Test Tracking

### 1. Check Browser Console
Open your browser's developer console (F12) and look for:
- ✅ `Visit tracked:` - Success message with details
- ❌ `Error tracking visit:` - Error message with details

### 2. Test API Endpoint
Visit: `https://yourwebsite.com/api/test-tracking`

Should return:
```json
{
  "success": true,
  "count": 10,
  "recent": [...],
  "message": "Tracking is working!"
}
```

### 3. Check Database Directly
In Supabase SQL Editor, run:
```sql
SELECT * FROM traffic_sources 
ORDER BY created_at DESC 
LIMIT 10;
```

### 4. Check Admin Dashboard
Go to `/admin` and look at "Traffic Sources" section

---

## Common Issues & Solutions

### Issue: No visits showing up

**Check:**
1. Open browser console - are there errors?
2. Visit `/api/test-tracking` - does it work?
3. Check Supabase RLS policies - is insert allowed?

**Solution:**
```sql
-- Verify RLS policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'traffic_sources';

-- Should see: "Anyone can insert traffic data"
```

### Issue: "Error tracking visit" in console

**Check:**
1. Are Supabase env variables set correctly?
2. Is the API route accessible?
3. Check network tab for failed requests

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- Check API route logs in Vercel dashboard

### Issue: Tracking works but not showing in dashboard

**Check:**
1. Are you logged in as admin?
2. Check RLS policy for SELECT:
```sql
-- Verify admin can view
SELECT * FROM pg_policies 
WHERE tablename = 'traffic_sources' 
AND policyname LIKE '%admin%';
```

---

## Manual Test Steps

1. **Open website in incognito/private window**
2. **Open browser console (F12)**
3. **Visit the homepage**
4. **Look for console message**: `✅ Visit tracked:`
5. **Check database**:
   ```sql
   SELECT * FROM traffic_sources 
   WHERE created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY created_at DESC;
   ```
6. **Verify in admin dashboard** at `/admin`

---

## Debugging Checklist

- [ ] Browser console shows "Visit tracked" message
- [ ] `/api/test-tracking` returns success
- [ ] Database has recent records
- [ ] Admin dashboard shows traffic sources
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] RLS policies allow insert for anonymous users

---

## Quick Fixes

### If tracking still not working:

1. **Clear browser cache and sessionStorage**
2. **Check Vercel environment variables**
3. **Verify Supabase table exists**:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'traffic_sources'
   );
   ```
4. **Re-run migration if needed**:
   ```sql
   -- From: supabase/migrations/20251118000001_add_marketing_analytics.sql
   ```

---

## What Gets Tracked

- ✅ Source (facebook, google, direct, etc.)
- ✅ Medium (social, organic, referral, etc.)
- ✅ Referrer URL
- ✅ Landing page
- ✅ Device type (mobile, desktop, tablet)
- ✅ Browser (chrome, firefox, safari, etc.)
- ✅ OS (windows, mac, ios, android, etc.)
- ✅ Session ID
- ✅ User ID (if logged in)
- ✅ Timestamp

---

## Expected Behavior

1. **First Visit**: Creates new record in `traffic_sources`
2. **Same Session**: Updates page_views count
3. **New Session**: Creates new record (after 30 min or new browser session)
4. **Facebook Visit**: Source = "facebook", Medium = "social"
5. **Direct Visit**: Source = "direct", Medium = "none"

---

## Still Not Working?

1. Check Vercel deployment logs
2. Check Supabase logs
3. Test API endpoint directly
4. Verify RLS policies
5. Check browser console for errors

