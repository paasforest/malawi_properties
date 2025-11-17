# 🔧 Git Setup & Push to GitHub

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Sign in or create account
3. Click **"+"** → **"New repository"**
4. Name: `malawiproperties`
5. **Private** or **Public** (your choice)
6. **DO NOT** check "Initialize with README"
7. Click **"Create repository"**

## Step 2: Get Repository URL

After creating, GitHub will show you a URL like:
- `https://github.com/yourusername/malawiproperties.git`

**Copy this URL** - you'll need it!

## Step 3: Push Code to GitHub

Run these commands in your terminal:

```bash
cd "/home/paas/Hope properties"

# Add all files
git add .

# Commit
git commit -m "Initial commit - Malawi Properties platform"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/malawiproperties.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** GitHub may ask for your username and password/token.

---

## Step 4: Connect to Vercel

Once code is on GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Find and select **"malawiproperties"**
5. Click **"Import"**

---

## 🔑 Need GitHub Access Token?

If GitHub asks for password, you need a **Personal Access Token**:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Check **"repo"** scope
4. Copy token
5. Use token as password when pushing

