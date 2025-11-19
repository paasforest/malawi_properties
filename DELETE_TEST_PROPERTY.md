# 🗑️ Delete Test Property

## ✅ How to Delete the Test Property

You can delete properties in several ways:

---

## Method 1: Via Supabase Dashboard (Easiest) ✅

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/editor/properties

2. **Find the Property:**
   - Look for: "4 Bedroom house in area 4" (or your test property)
   - Property ID: `b40570c2-5743-4dd3-adc3-04ce00962013`

3. **Delete the Property:**
   - Click on the property row
   - Click **"Delete"** button or **trash icon (🗑️)**
   - Confirm deletion

---

## Method 2: Via SQL Editor (Quick) ✅

1. **Go to Supabase SQL Editor:**
   - https://app.supabase.com/project/ofuyghemecqstflnhixy/sql/new

2. **Run this SQL:**
```sql
-- Delete the test property by ID
DELETE FROM properties 
WHERE id = 'b40570c2-5743-4dd3-adc3-04ce00962013';

-- OR delete by title (if you remember it)
DELETE FROM properties 
WHERE title LIKE '%test%' OR title LIKE '%4 Bedroom house in area 4%';

-- OR delete the most recently created property (be careful!)
DELETE FROM properties 
WHERE id = (
  SELECT id FROM properties 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

3. **Click "Run"** to execute

---

## Method 3: Delete via Property Form (If you have edit access)

1. **Go to your dashboard**
2. **Find the property in your list**
3. **Click "Edit"**
4. **Change status to "Withdrawn"** (hides it from public)
5. **Or** look for delete button (may not exist yet)

---

## ✅ Quick SQL to Find Test Properties

**Find all properties created today:**
```sql
SELECT id, title, created_at, status 
FROM properties 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
```

**Delete all properties created today:**
```sql
DELETE FROM properties 
WHERE created_at::date = CURRENT_DATE 
  AND title LIKE '%test%' OR title LIKE '%4 Bedroom%';
```

---

## ⚠️ Important Notes

1. **Deleting a property will:**
   - ✅ Remove it from database
   - ✅ Remove it from public listings
   - ✅ Delete associated inquiries (if CASCADE is set)

2. **Images will:**
   - ❌ Remain in Hetzner bucket (not deleted automatically)
   - 💡 You can manually delete them later if needed

3. **Before deleting, you can:**
   - Change status to "withdrawn" (hides it instead of deleting)
   - Export property data (if you need it)

---

## 🎯 Recommended: Use SQL Editor

**Fastest way:**
1. Open SQL Editor
2. Run: `DELETE FROM properties WHERE id = 'b40570c2-5743-4dd3-adc3-04ce00962013';`
3. Done!

---

**After deletion, refresh your site - property should be gone!** ✅

