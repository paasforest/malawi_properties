# 🔒 Bucket Security Options

## Two Options for Hetzner Storage

### Option 1: **Public Bucket** (Default - Simpler)

**Configuration:**
```env
HETZNER_S3_BUCKET_PUBLIC=true  # or omit this line (defaults to true)
# HETZNER_CDN_URL=  # Optional
```

**How it works:**
- Files are publicly accessible via direct S3 URL
- Anyone with the URL can access the file
- ✅ Simple setup, no CDN required
- ✅ Good for public property images
- ⚠️ Less secure (anyone with URL can access)

**Use when:**
- Property images should be publicly viewable
- You want simplest setup
- Direct S3 URLs work fine for your use case

---

### Option 2: **Private Bucket** (More Secure - Recommended)

**Configuration:**
```env
HETZNER_S3_BUCKET_PUBLIC=false
HETZNER_CDN_URL=https://your-cdn-domain.com  # REQUIRED for private bucket
```

**How it works:**
- Files are stored privately in Hetzner
- Only accessible via your CDN (Cloudflare, etc.)
- CDN acts as a secure proxy
- ✅ More secure - bucket not directly accessible
- ✅ Better performance with CDN caching
- ✅ Can add image transformations via CDN
- ⚠️ Requires CDN setup

**Use when:**
- You want extra security
- You're using Cloudflare or similar CDN
- You want image optimization/transformations
- You want better global performance

---

## Which Should You Choose?

### For Property Images: **Public is usually fine** ✅

Property images are meant to be viewed by potential buyers, so public access is typically acceptable. However, if you want:
- Extra security layer
- Image transformations
- Better caching/performance

Then go with **Private + CDN**.

---

## Setup Instructions

### Public Bucket:
1. Create bucket in Hetzner
2. Set bucket to **public** access
3. Add environment variables (no `HETZNER_S3_BUCKET_PUBLIC` needed)
4. Done! ✅

### Private Bucket:
1. Create bucket in Hetzner
2. Set bucket to **private** access
3. Set up CDN (Cloudflare recommended)
4. Point CDN to Hetzner bucket
5. Add environment variables:
   ```env
   HETZNER_S3_BUCKET_PUBLIC=false
   HETZNER_CDN_URL=https://your-cdn-domain.com
   ```
6. Done! ✅

---

## Recommendation

**Start with Public** - it's simpler and works fine for property images.  
**Switch to Private + CDN** later if you need:
- Better security
- Image optimization
- Global CDN performance


