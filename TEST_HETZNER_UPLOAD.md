# 🧪 Test Hetzner Storage Configuration

## Current Configuration

Your `.env.local` now has:
- ✅ Access Key: `C9B9AV7QGZL3VJOJYG0D`
- ✅ Secret Key: `ST3CkNBoCAxyC0yPwW6TNpQIQGocpbea8nETLupm`
- ✅ Region: `fsn1`
- ✅ Bucket: `hope-properties-images`
- ⚠️ Endpoint: `https://fsn1.your-objectstorage.com` (may need adjustment)

## How to Test

1. **Restart your Next.js server:**
   ```bash
   npm run dev
   ```

2. **Try uploading an image** through your property form

3. **Check the console** for any errors

## If Endpoint URL is Wrong

If you get connection errors, the endpoint URL might need to be different. 

**Check your Hetzner Console:**
- Go to: https://console.hetzner.cloud/
- Storage → Object Storage → Your bucket
- Look for "S3 Endpoint" or "Connection URL"
- It might be a different format like:
  - `https://fsn1.your-objectstorage.com` (standard)
  - Or a custom domain format

## Common Hetzner Object Storage Endpoint Formats

- `https://fsn1.your-objectstorage.com`
- `https://fsn1.your-objectstorage.com:443`
- Custom domain you configured

**Share the endpoint from your Hetzner console if you see connection errors!**


