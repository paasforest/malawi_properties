# 🚀 Hetzner Storage Setup - Quick Start

## ✅ Step 1: Dependencies Installed

The required packages have been installed:
- `@aws-sdk/client-s3` - S3 client for Hetzner
- `@aws-sdk/s3-request-presigner` - For presigned URLs

---

## 📝 Step 2: Provide Your Hetzner Credentials

Once you have your Hetzner Object Storage credentials, provide me:

1. **Endpoint URL** (e.g., `https://fsn1.your-objectstorage.com`)
2. **Region** (e.g., `fsn1`, `nbg1`, `hel1`)
3. **Access Key**
4. **Secret Key**
5. **Bucket Name** (or I can use `hope-properties-images`)

---

## 🔧 Step 3: I'll Configure Everything

Once you provide the credentials, I will:
- ✅ Update `.env.local` with your credentials
- ✅ Test the connection
- ✅ Verify upload functionality works
- ✅ Update any necessary configuration

---

## 📋 How to Get Hetzner Credentials

### Option A: If you already have Hetzner account:

1. Go to [Hetzner Console](https://console.hetzner.cloud/)
2. Select your project
3. Go to **Storage** → **Object Storage**
4. Create a bucket (or use existing)
5. Click **Access Keys** → **Generate Access Key**
6. Copy the endpoint, access key, and secret key

### Option B: Create new Hetzner account:

1. Sign up at https://www.hetzner.com/storage/storage-box
2. Create Object Storage
3. Create a bucket
4. Generate access keys

---

## 🎯 What to Send Me

Just provide these details:

```
Endpoint: https://fsn1.your-objectstorage.com
Region: fsn1
Access Key: YOUR_ACCESS_KEY
Secret Key: YOUR_SECRET_KEY
Bucket: hope-properties-images
```

Or you can paste your Hetzner credentials here and I'll configure everything!

---

## ✨ After Setup

- Files will upload to Hetzner (no 50 MB limit!)
- Old Supabase images will still work
- New uploads go to Hetzner
- Much cheaper than Supabase Pro plan


