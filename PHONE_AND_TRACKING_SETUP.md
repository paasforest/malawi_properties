# 📞 Phone Number & Visit Tracking Setup

## ✅ What Was Added

### 1. **Phone Number Display** 📱

Your South African phone number (**+27 67 951 8124**) has been added to:

#### **Header (Desktop)**
- Phone number visible in desktop navigation
- Clickable to call directly
- Shows on larger screens

#### **Header (Mobile)**
- Phone number in mobile menu
- WhatsApp link for easy messaging
- Both call and WhatsApp options

#### **Footer**
- Full contact section
- Phone number with call link
- WhatsApp link
- Appears on every page

### 2. **Visit Tracking System** 📊

Comprehensive visit tracking has been implemented to track:
- **All website visitors**
- **Facebook referrals** (especially important for your Facebook groups)
- **Google searches**
- **Other social media** (Instagram, Twitter, LinkedIn, WhatsApp)
- **Direct visits**
- **Email campaigns**

---

## 🔍 What Gets Tracked

### Traffic Source Information:
- **Source**: Where visitor came from (facebook, google, direct, etc.)
- **Medium**: Type of traffic (social, organic, referral, email)
- **Referrer**: Full URL of where they came from
- **Landing Page**: First page they visited
- **Device Type**: Mobile, desktop, or tablet
- **Browser**: Chrome, Firefox, Safari, etc.
- **OS**: Windows, Mac, iOS, Android, etc.
- **Session ID**: Unique identifier for each visit
- **User ID**: If they're logged in
- **Conversion**: Whether visit led to inquiry/signup

### Facebook-Specific Tracking:
- Automatically detects visits from:
  - `facebook.com`
  - `fb.com`
  - `m.facebook.com` (mobile Facebook)
- Marks source as "facebook" with medium "social"
- Tracks which Facebook posts/groups are driving traffic

---

## 📈 How to View Tracking Data

### In Admin Dashboard:

1. **Go to Admin Dashboard**: `/admin`
2. **Traffic Sources Section**: 
   - Shows breakdown by source (Facebook, Google, Direct, etc.)
   - Percentage of traffic from each source
   - Total visits per source

3. **What You'll See**:
   - **Facebook**: Number of visits from Facebook
   - **Google**: Organic search visits
   - **Direct**: Direct visits (typed URL or bookmarked)
   - **Other sources**: Instagram, WhatsApp, etc.

### Example Dashboard View:
```
Traffic Sources:
- Facebook: 45 visits (60%)
- Google: 20 visits (27%)
- Direct: 10 visits (13%)
```

---

## 🎯 Facebook Group Tracking

### How It Works:
1. When someone clicks your link in a Facebook group
2. They land on your website
3. System automatically detects it's from Facebook
4. Records it in `traffic_sources` table
5. Shows up in admin dashboard

### To Track Specific Facebook Posts:
You can add UTM parameters to your links:
```
https://yourwebsite.com/?utm_source=facebook&utm_medium=social&utm_campaign=group_post_1
```

This will show up as:
- Source: `facebook`
- Medium: `social`
- Campaign: `group_post_1`

---

## 📊 Database Tables

### `traffic_sources` Table:
Stores all visit tracking data:
- `source`: facebook, google, direct, etc.
- `medium`: social, organic, referral, email
- `referrer`: Full referrer URL
- `landing_page`: First page visited
- `device_type`: mobile, desktop, tablet
- `converted`: true if visit led to inquiry/signup
- `created_at`: When visit occurred

---

## 🔧 Technical Details

### Files Created/Modified:

1. **`src/components/Footer.tsx`** - Footer with phone number
2. **`src/components/VisitTracker.tsx`** - Component that tracks visits
3. **`src/lib/visitTracking.ts`** - Visit tracking logic
4. **`app/layout.tsx`** - Added Footer and VisitTracker
5. **`src/components/Header.tsx`** - Added phone number to header

### How Tracking Works:

1. **On Every Page Load**:
   - `VisitTracker` component runs
   - Calls `trackVisit()` function
   - Detects referrer (where visitor came from)
   - Parses source (Facebook, Google, etc.)
   - Records visit in database

2. **Session Management**:
   - Creates unique session ID
   - Tracks multiple page views in same session
   - Updates page view count
   - Tracks last activity time

3. **Facebook Detection**:
   - Checks if referrer contains "facebook.com"
   - Automatically marks as Facebook source
   - Records full referrer URL for analysis

---

## 📱 Phone Number Format

**Displayed as**: +27 67 951 8124

**Links created**:
- **Call**: `tel:+27679518124`
- **WhatsApp**: `https://wa.me/27679518124`

**Where it appears**:
- ✅ Header (desktop and mobile)
- ✅ Footer (all pages)
- ✅ Clickable for direct calling
- ✅ WhatsApp link for messaging

---

## 🚀 Next Steps

1. **Test the phone number**:
   - Click it on desktop/mobile
   - Verify WhatsApp link works

2. **Check tracking**:
   - Visit your site from Facebook
   - Check admin dashboard
   - Verify Facebook visits are being tracked

3. **Monitor traffic**:
   - Check admin dashboard regularly
   - See which Facebook posts drive most traffic
   - Track conversion rates

---

## 💡 Tips for Facebook Marketing

1. **Use UTM Parameters**:
   ```
   https://yourwebsite.com/?utm_source=facebook&utm_campaign=group_post_1
   ```

2. **Track Different Posts**:
   - Use different UTM campaigns for different posts
   - See which posts perform best

3. **Monitor Conversions**:
   - Check which sources lead to inquiries
   - Focus on high-converting sources

---

## ✅ Summary

- ✅ Phone number added to header and footer
- ✅ Visit tracking implemented
- ✅ Facebook referrals automatically tracked
- ✅ All visits recorded in database
- ✅ Viewable in admin dashboard

**Your website now tracks all visitors, especially from Facebook!** 🎉

