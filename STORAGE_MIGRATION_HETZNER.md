# 📦 Storage Migration to Hetzner Object Storage

## 🎯 Why Hetzner is a Good Choice for File Uploads

### ✅ Advantages over Supabase Storage Free Tier

1. **No Upload Size Limits**
   - Supabase Free: 50 MB per file limit
   - Hetzner: No artificial file size limits (only limited by your storage quota)

2. **Cost-Effective Pricing**
   - Hetzner Object Storage: €0.023/GB/month (storage) + €0.01/GB (egress)
   - Much cheaper than AWS S3 or Cloudflare R2 for high storage/bandwidth needs
   - Perfect for a growing real estate platform

3. **S3-Compatible API**
   - Works with standard AWS SDK
   - Easy migration path
   - Wide tooling support

4. **Better for Large Files**
   - Property videos, high-resolution images, documentation files
   - No need to worry about per-file size limits

5. **Scalability**
   - Pay only for what you use
   - Easy to scale up as your platform grows

---

## 📊 Comparison Table

| Feature | Supabase Free | Supabase Pro | Hetzner Object Storage |
|---------|--------------|--------------|------------------------|
| **Storage** | 1 GB | 100 GB | Unlimited (pay per GB) |
| **Bandwidth** | 2 GB/month | 200 GB/month | Pay per GB (€0.01/GB) |
| **File Size Limit** | 50 MB | 50 MB | **No limit** |
| **Cost** | Free | $25/month | ~€0.023/GB/month |
| **Image Transformations** | ❌ | ✅ | ✅ (via Cloudflare/CDN) |

---

## 🚀 Migration Plan

### Step 1: Set Up Hetzner Object Storage

1. **Create Hetzner Account**
   - Go to: https://www.hetzner.com/storage/storage-box
   - Sign up for Object Storage

2. **Create Storage Bucket**
   - Name: `hope-properties-images` (or your preference)
   - Region: Choose closest to your users (EU for Europe, US for Americas)

3. **Generate Access Keys**
   - Create S3-compatible access key and secret
   - Save these securely - you'll need them for environment variables

### Step 2: Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Note:** The `package.json` has already been updated with these dependencies.

### Step 3: Configure Environment Variables

Add to `.env.local`:
```env
# Hetzner Object Storage (S3-compatible)
HETZNER_S3_ENDPOINT=https://your-region.your-objectstorage.com
HETZNER_S3_REGION=your-region
HETZNER_S3_ACCESS_KEY=your-access-key
HETZNER_S3_SECRET_KEY=your-secret-key
HETZNER_S3_BUCKET=hope-properties-images

# Optional: Public CDN URL for serving images
HETZNER_CDN_URL=https://your-cdn-domain.com
```

### Step 4: Update Code

See implementation files:
- `src/lib/storage.ts` - Hetzner S3 client
- `src/components/PropertyForm.tsx` - Updated upload function

---

## 💡 Alternative: Hybrid Approach

**Keep Supabase Storage for small files, use Hetzner for large files:**

- Files < 10 MB → Supabase Storage (faster, integrated)
- Files > 10 MB → Hetzner Object Storage (no limits)

This gives you the best of both worlds!

---

## 🔧 Implementation Details

### Cost Estimation Example

For a real estate platform with:
- 1,000 properties
- 10 images per property (avg 2 MB each) = 20 GB
- Monthly bandwidth: 100 GB

**Hetzner Costs:**
- Storage: 20 GB × €0.023 = €0.46/month
- Bandwidth: 100 GB × €0.01 = €1.00/month
- **Total: ~€1.50/month** (vs $25/month for Supabase Pro)

---

## ✅ Migration Checklist

- [ ] Create Hetzner account and bucket
- [ ] Install AWS SDK packages
- [ ] Add environment variables
- [ ] Update storage client (`src/lib/storage.ts`)
- [ ] Update PropertyForm upload function
- [ ] Test file uploads (small and large files)
- [ ] Migrate existing images (optional - can run in parallel)
- [ ] Update image URLs in database
- [ ] Set up CDN for image serving (optional)

---

## 🚨 Important Notes

1. **Existing Images**: If you have images in Supabase Storage, you can:
   - Keep them there (they'll keep working)
   - Migrate them gradually to Hetzner
   - Run both in parallel during transition

2. **CDN Setup**: Consider adding Cloudflare or similar CDN in front of Hetzner for:
   - Faster global delivery
   - Image transformations/optimization
   - Reduced bandwidth costs

3. **Security**: Make sure to:
   - Use environment variables (never commit keys)
   - Set up proper bucket policies
   - Enable HTTPS only
   - Consider signed URLs for private files

---

## 📚 Resources

- [Hetzner Object Storage Docs](https://docs.hetzner.com/storage/object-storage/)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [S3-compatible Storage Guide](https://docs.hetzner.com/storage/object-storage/s3/)

---

**Recommendation: Hetzner is an excellent choice for your use case!** 🎯

