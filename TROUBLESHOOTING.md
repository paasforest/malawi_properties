# Troubleshooting "Failed to Fetch" Error

## Common Causes & Solutions

### 1. ✅ Check Environment Variables

Make sure `.env.local` exists and has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sejgrobmpsqctjripvaiu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Fix:**
- Verify `.env.local` file exists in project root
- Restart Next.js dev server after changing `.env.local`
- Check no trailing slash in URL

### 2. ✅ Restart Next.js Server

Environment variables only load on server start.

**Fix:**
```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. ✅ Check Supabase URL

The URL should be: `https://sejgrobmpsqctjripvaiu.supabase.co`

**Test in browser:**
Visit: https://sejgrobmpsqctjripvaiu.supabase.co/rest/v1/

Should return JSON (even if it's an error, it means connection works).

### 4. ✅ Check Browser Console

Open browser DevTools (F12) → Console tab
Look for specific error messages.

### 5. ✅ Verify Admin User Exists

Make sure you've created the admin user in Supabase:

**In Supabase SQL Editor:**
```sql
-- Check if admin user exists
SELECT id, email, user_type, is_verified 
FROM profiles 
WHERE user_type = 'admin';

-- If not, create it (see CREATE_ADMIN_USER.md)
```

### 6. ✅ Check Network Tab

Open DevTools → Network tab
Look for failed requests to `supabase.co`
Check if CORS errors appear

### 7. ✅ Test Supabase Connection

Add this to browser console on login page:
```javascript
// Test connection
fetch('https://sejgrobmpsqctjripvaiu.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE'
  }
})
.then(r => console.log('Connection:', r.status))
.catch(e => console.error('Connection failed:', e));
```

## Quick Fix Checklist

- [ ] `.env.local` file exists in project root
- [ ] Environment variables are correct
- [ ] Next.js server restarted after `.env.local` changes
- [ ] Supabase URL is correct (no trailing slash)
- [ ] Admin user created in Supabase
- [ ] Browser console shows no CORS errors
- [ ] Internet connection is working
- [ ] Supabase project is active (not paused)

## Still Not Working?

1. **Clear browser cache** and try again
2. **Try incognito/private mode**
3. **Check Supabase Dashboard** - make sure project is active
4. **Check Supabase Auth Settings** - ensure email auth is enabled

## Contact Info

If still having issues, check:
- Supabase Dashboard: https://app.supabase.com/project/sejgrobmpsqctjripvaiu
- Project Status: Should show "Active"
- Auth Settings: Email auth should be enabled



