# Admin Dashboard Setup Guide

## ✅ Supabase Connection Status
- **URL**: https://sejgrobmpsqctjripvaiu.supabase.co
- **Status**: ✅ Connected
- **Environment Variables**: ✅ Configured in `.env.local`

## 🔐 Creating Your Admin User

### Method 1: Through Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/project/sejgrobmpsqctjripvaiu
   - Navigate to **Authentication > Users**

2. **Create a New User**
   - Click **"Add User"**
   - Enter your email and password
   - Copy the **User ID** that gets generated

3. **Create Profile with Admin Role**
   - Go to **SQL Editor** in Supabase
   - Run this SQL (replace `USER_ID_HERE` with the User ID you copied):
   
   ```sql
   INSERT INTO profiles (
     id,
     email,
     full_name,
     user_type,
     is_verified
   ) VALUES (
     'USER_ID_HERE',
     'your-email@example.com',
     'Admin User',
     'admin',
     true
   );
   ```

### Method 2: Through Your App (Sign Up + Database Update)

1. **Sign Up** through the app normally
2. **Get Your User ID** from Supabase Dashboard > Authentication > Users
3. **Update Your Profile** in Supabase SQL Editor:

   ```sql
   UPDATE profiles
   SET user_type = 'admin',
       is_verified = true
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

## 📊 Admin Dashboard Features

Once logged in as admin, you'll have access to:

### ✅ Key Metrics Dashboard
- **Total Users**: All registered users count
- **Total Agents**: Verified agents count
- **Total Properties**: All listings
- **Total Inquiries**: All buyer inquiries
- **Total Views**: All property views tracked
- **Revenue**: Total sales value
- **Diaspora Percentage**: % of diaspora buyers
- **Conversion Rate**: Sales/Listings ratio
- **Average Time to Sale**: Days from listing to sale

### ✅ Data Monitoring
- **Recent Properties**: Latest listings
- **Recent Inquiries**: Latest buyer inquiries
- **Recent Users**: New registrations
- **Pending Verifications**: Agents awaiting approval

### ✅ Analytics & Intelligence
- **Top Districts**: Most active districts with activity metrics
- **Property Type Distribution**: Breakdown by type
- **Diaspora Locations**: Where diaspora buyers are located
- **View/Inquiry Ratios**: Engagement metrics

### ✅ Data Export
- Export Properties (JSON)
- Export Inquiries (JSON)
- Export Users (JSON)
- Export Analytics (JSON with all metrics)

### ✅ Database Access
- **Full Read Access**: All tables
- **Update Access**: Can update any profile, property, or inquiry
- **Agent Verification**: Can verify/reject agents

## 🔍 Data Collection Status

### ✅ Currently Tracked:
- ✅ Property views (with viewer location & duration)
- ✅ Buyer inquiries (with diaspora location, budget, intended use)
- ✅ Agent performance (listings, sales, conversion rates)
- ✅ District analytics (listings, sales, views per district)
- ✅ Property type distribution
- ✅ Diaspora buyer patterns
- ✅ Time-to-sale metrics
- ✅ View-to-inquiry conversion rates

### 📈 All Data Saved To:
- `properties` - All property listings
- `property_views` - Every view tracked
- `inquiries` - All buyer inquiries
- `profiles` - All user data (including diaspora status)
- `agents` - Agent performance data
- `market_analytics` - Aggregated market intelligence

## 🔒 Security & Access

### Admin-Only Routes:
- `/admin` - Full admin dashboard

### Admin Permissions:
- View all data across all tables
- Update any profile, property, or inquiry
- Verify/reject agents
- Export all data

### RLS Policies:
- Admin policies added in: `supabase/migrations/20251116000000_add_admin_policies.sql`
- Apply these in Supabase SQL Editor if not already applied

## 🚀 Next Steps

1. **Create your admin user** (see above)
2. **Log in** to the app
3. **Access Admin Dashboard** at `/admin`
4. **Start monitoring** all data collection
5. **Export data** regularly for backup

## 📝 Quick SQL Commands for Admin

### Check if admin user exists:
```sql
SELECT * FROM profiles WHERE user_type = 'admin';
```

### View all users:
```sql
SELECT id, email, full_name, user_type, is_diaspora, created_at 
FROM profiles 
ORDER BY created_at DESC;
```

### View all data stats:
```sql
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM inquiries) as total_inquiries,
  (SELECT COUNT(*) FROM property_views) as total_views;
```

### Export all data (run in Supabase):
```sql
-- All Properties
SELECT * FROM properties;

-- All Inquiries with buyer data
SELECT i.*, p.title as property_title, pr.full_name as buyer_name, pr.is_diaspora
FROM inquiries i
LEFT JOIN properties p ON i.property_id = p.id
LEFT JOIN profiles pr ON i.buyer_id = pr.id;

-- All Property Views
SELECT pv.*, p.title as property_title, p.district
FROM property_views pv
LEFT JOIN properties p ON pv.property_id = p.id;
```

## 🎯 Data Mining Checklist

- ✅ Property views tracked (location, duration)
- ✅ Buyer inquiries tracked (diaspora location, budget, use)
- ✅ Agent performance tracked
- ✅ District analytics collected
- ✅ Property type distribution tracked
- ✅ Diaspora patterns identified
- ✅ Time-to-sale metrics calculated
- ✅ Conversion rates monitored
- ✅ All data exportable
- ✅ Admin dashboard for monitoring

**Your data collection system is fully operational! 🎉**



