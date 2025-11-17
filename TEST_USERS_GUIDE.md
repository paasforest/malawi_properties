# 🧪 Test Users Setup Guide

## 🎯 Quick Setup

Visit: **http://localhost:3000/setup/test-users**

This page will create test users automatically.

---

## 👥 Test Users Created

### **1. Test Buyer (Local)**
- **Email:** `buyer@test.com`
- **Password:** `TestBuyer123!`
- **Type:** Buyer
- **Location:** Lilongwe, Malawi
- **Dashboard:** `/buyer`

### **2. Diaspora Buyer**
- **Email:** `buyer.diaspora@test.com`
- **Password:** `TestBuyer123!`
- **Type:** Buyer (Diaspora)
- **Location:** Johannesburg, South Africa
- **Dashboard:** `/buyer`

### **3. Test Seller (Owner)**
- **Email:** `seller@test.com`
- **Password:** `TestSeller123!`
- **Type:** Property Owner
- **Location:** Blantyre, Malawi
- **Dashboard:** `/dashboard`

### **4. Test Agent**
- **Email:** `agent@test.com`
- **Password:** `TestAgent123!`
- **Type:** Agent
- **Location:** Lilongwe, Malawi
- **Dashboard:** `/dashboard`
- **Has Agent Profile:** ✅ Yes (verified)

---

## 🚀 How to Use

### **Step 1: Create Test Users**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/setup/test-users`
3. Click **"Create All Test Users"**
4. Wait for all users to be created

### **Step 2: Log In**

**For Buyers:**
1. Go to: `http://localhost:3000`
2. Click "Sign In" in header
3. Use buyer credentials:
   - Email: `buyer@test.com`
   - Password: `TestBuyer123!`
4. You'll see "My Dashboard" link in header
5. Click it → Goes to `/buyer` (Buyer Dashboard)

**For Sellers/Agents:**
1. Go to: `http://localhost:3000`
2. Click "Sign In" in header
3. Use seller/agent credentials:
   - Email: `seller@test.com` OR `agent@test.com`
   - Password: `TestSeller123!` OR `TestAgent123!`
4. You'll see "Dashboard" link in header
5. Click it → Goes to `/dashboard` (Seller/Agent Dashboard)

---

## 📊 What Each Dashboard Shows

### **Buyer Dashboard (`/buyer`):**
- ✅ My Inquiries tab (properties they inquired about)
- ✅ Viewed Properties tab (properties they viewed)
- ✅ Saved Properties tab (favorites - ready for implementation)
- ✅ Stats: Total inquiries, views, saved properties

### **Seller/Agent Dashboard (`/dashboard`):**
- ✅ Their properties list
- ✅ Add/Edit/Delete properties
- ✅ Mark as Sold
- ✅ Update inquiry status
- ✅ View inquiries with buyer intelligence
- ✅ Stats: Total listings, views, inquiries, conversion rate
- ✅ Agent Profile management (if agent)

---

## 🔧 Testing Different Scenarios

### **Test 1: Buyer Flow**
1. Login as `buyer@test.com`
2. Browse properties on homepage
3. Click on a property
4. Send an inquiry
5. Go to `/buyer` dashboard
6. See inquiry in "My Inquiries" tab

### **Test 2: Seller Flow**
1. Login as `seller@test.com`
2. Go to `/dashboard`
3. Click "Add Property"
4. Create a test property
5. See it in "Your Properties" list
6. View inquiries (if any)

### **Test 3: Agent Flow**
1. Login as `agent@test.com`
2. Go to `/dashboard`
3. See "Agent Profile" button
4. Click it → Update agent details
5. Add properties
6. View inquiries with buyer intelligence

---

## 🎯 Test User Features

### **All Users Can:**
- ✅ Sign in / Sign up
- ✅ Browse marketplace
- ✅ View properties
- ✅ Send inquiries

### **Buyers Can:**
- ✅ Access `/buyer` dashboard
- ✅ See their inquiries
- ✅ See viewed properties
- ✅ Track inquiry status

### **Sellers/Agents Can:**
- ✅ Access `/dashboard`
- ✅ Add/edit/delete properties
- ✅ Mark properties as sold
- ✅ View inquiries with buyer intelligence
- ✅ Update inquiry status
- ✅ Manage agent profile (if agent)

---

## 📝 Notes

- **Email Confirmation:** In Supabase, you may need to confirm test user emails manually
- **If Login Fails:** Check Supabase Auth settings (email confirmation requirements)
- **If Dashboard Empty:** That's normal! Dashboards show data as you interact with the platform

---

## 🚀 Quick Test Commands

```bash
# Start dev server
npm run dev

# Visit test users page
open http://localhost:3000/setup/test-users

# Visit login page
open http://localhost:3000
```

---

**Test users are ready! You can now test all dashboards! 🎉**



