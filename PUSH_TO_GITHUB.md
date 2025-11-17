# 🚀 Push Code to GitHub

## You're almost there!

The repository is created at: https://github.com/paasforest/malawi_properties

## Run this command to push:

```bash
cd "/home/paas/Hope properties"
git push -u origin main
```

## If GitHub asks for authentication:

You'll need a **Personal Access Token** (not your password):

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `Vercel Deploy`
4. Check **"repo"** scope (gives full repository access)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)
7. When `git push` asks for password, **paste the token** instead

---

## After Push Success:

1. Go to Vercel: https://vercel.com/new?teamSlug=paas-projects-5446f34f
2. Click **"Import Git Repository"**
3. Find and select **"malawi_properties"**
4. Click **"Import"**
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **"Deploy"** 🚀

---

## Quick Troubleshooting:

**Error: Authentication failed?**
- Use Personal Access Token, not password
- Make sure token has "repo" scope

**Error: Remote already exists?**
- Run: `git remote remove origin` then `git remote add origin https://github.com/paasforest/malawi_properties.git`

**Everything works?**
- Check https://github.com/paasforest/malawi_properties - you should see all your files!

