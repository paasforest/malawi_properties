# 🚀 Deployment Guide to Vercel

## Step-by-Step Deployment Checklist

### ✅ Prerequisites
- [ ] Code is in Git (GitHub/GitLab/Bitbucket)
- [ ] Supabase project is set up
- [ ] Environment variables ready

---

## 📋 Step 1: Prepare Your Code

### 1.1 Check Git Status
```bash
git status
```

### 1.2 Commit All Changes (if not already)
```bash
git add .
git commit -m "Ready for production deployment"
```

### 1.3 Push to GitHub/GitLab
```bash
git push origin main
```

---

## 🌐 Step 2: Deploy to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended) or email

### 2.2 Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import your Git repository
3. Select your **"Hope properties"** repository

### 2.3 Configure Project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

---

## 🔐 Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these **REQUIRED** variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these:**
1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:**
- Add these for **Production**, **Preview**, and **Development** environments
- Use the **same values** for all environments (or create separate Supabase projects)

---

## 🚀 Step 4: Deploy

1. Click **"Deploy"** button in Vercel
2. Wait for build to complete (2-5 minutes)
3. Get your free URL: `your-project-name.vercel.app`

---

## ✅ Step 5: Test Your Deployment

### Test These Pages:
- [ ] Homepage: `https://your-project.vercel.app`
- [ ] Marketplace: `https://your-project.vercel.app`
- [ ] Admin Login: `https://your-project.vercel.app/admin/login`
- [ ] Dashboard: `https://your-project.vercel.app/dashboard` (after login)
- [ ] Admin Dashboard: `https://your-project.vercel.app/admin` (after admin login)

### Check:
- [ ] Authentication works
- [ ] Database connection works
- [ ] Property listings load
- [ ] Dashboards display correctly

---

## 🔧 Step 6: Post-Deployment Setup

### 6.1 Update Supabase Auth URLs
1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel URL:
   - **Site URL:** `https://your-project.vercel.app`
   - **Redirect URLs:** 
     - `https://your-project.vercel.app/**`
     - `https://your-project.vercel.app/auth/callback`

### 6.2 Test User Creation
- Try creating a test user via `/setup/test-users`
- Or create manually in Supabase Dashboard

---

## 🌍 Step 7: Add Custom Domain (Later)

When you're ready:
1. Go to Vercel → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `malawiproperties.co.za`)
3. Follow DNS instructions
4. Wait for DNS propagation (5-30 minutes)

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run typecheck`

### Environment Variables Not Working
- Verify variable names start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables
- Check browser console for errors

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Check RLS policies allow public access where needed

### Authentication Not Working
- Update Supabase redirect URLs (Step 6.1)
- Clear browser cookies and try again
- Check Supabase Auth settings

---

## 📝 Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard  
**Supabase Dashboard:** https://supabase.com/dashboard  
**Build Logs:** Vercel → Your Project → **Deployments** → Click deployment → **Build Logs**

---

## 🎉 You're Live!

Once deployed, your site will be live at:
`https://your-project-name.vercel.app`

Share this URL and start testing in production! 🚀

