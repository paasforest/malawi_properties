# ✅ Image Deletion & Owner Access - Fixed

## 🎯 Issues Addressed

### 1. **Images Remain in Hetzner Storage** ✅ FIXED
**Problem:** When properties were deleted, images remained in Hetzner storage, filling up storage space.

**Solution:** ✅ **Automatic image deletion added**
- Images are now automatically deleted from Hetzner when property is deleted
- New API route: `/api/delete-image` for secure server-side deletion
- Prevents storage from filling up with orphaned images

### 2. **Owners Cannot Delete Properties** ✅ CONFIRMED
**Concern:** Owners should be able to delete their own properties too.

**Status:** ✅ **Owners CAN delete their properties**
- Delete button shows for both agents and owners
- RLS (Row Level Security) policy allows owners to delete their own properties
- Works identically for agents and owners

---

## 🗑️ How Image Deletion Works

### Automatic Cleanup:

**When a property is deleted:**

1. ✅ **Check property images**
2. ✅ **For each Hetzner image:**
   - Extract path from URL
   - Call `/api/delete-image` API route
   - Delete from Hetzner Object Storage
3. ✅ **For Supabase images:**
   - Skip (bucket may be deleted)
   - Log message (not an error)
4. ✅ **Delete property from database**
5. ✅ **Update agent total_listings** (if agent)
6. ✅ **Done!** Images cleaned up

### API Route: `/api/delete-image`

**Server-side secure deletion:**
```typescript
POST /api/delete-image
Body: { imageUrl: "https://fsn1.your-objectstorage.com/..." }
```

**Features:**
- ✅ Server-side (credentials not exposed)
- ✅ Uses `deleteFile()` from storage.ts
- ✅ Extracts path from URL automatically
- ✅ Handles errors gracefully

---

## 👥 Owner vs Agent Access

### Who Can Delete?

**Agents:**
- ✅ Can delete properties they listed (`agent_id` matches)
- ✅ Delete button shows in PropertyForm
- ✅ Agent's `total_listings` count updated

**Owners:**
- ✅ Can delete properties they own (`owner_id` matches)
- ✅ Delete button shows in PropertyForm (same as agents)
- ✅ No listing count to update (owners don't have this field)

**Security:**
- ✅ Protected by RLS (Row Level Security)
- ✅ Can only delete own properties
- ✅ Database-level security (can't be bypassed)

---

## 📋 Delete Button Display

**Shows when:**
- ✅ Editing existing property (not creating new)
- ✅ User is agent OR owner
- ✅ Property belongs to user

**Does NOT show when:**
- ❌ Creating new property
- ❌ Property doesn't belong to user (RLS prevents deletion anyway)

---

## 🔐 Security (RLS Policy)

**Database Policy:**
```sql
CREATE POLICY "Agents can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
    OR auth.uid() = owner_id  -- Owners can also delete
  );
```

**This means:**
- ✅ Agents can delete properties where `agent.user_id = current_user`
- ✅ Owners can delete properties where `owner_id = current_user`
- ❌ Cannot delete other users' properties

---

## 📊 Deletion Process

### For Agents:

1. Click "Edit" on property
2. See red "Delete" button
3. Click "Delete"
4. Confirm deletion
5. **Images deleted from Hetzner** ✅
6. Property deleted from database
7. Agent's `total_listings` count decremented

### For Owners:

1. Click "Edit" on property
2. See red "Delete" button
3. Click "Delete"
4. Confirm deletion
5. **Images deleted from Hetzner** ✅
6. Property deleted from database
7. **Done!** (no listing count to update)

---

## ✅ Benefits

### Storage Management:
- ✅ **No orphaned images** in Hetzner
- ✅ **Storage space freed** when properties deleted
- ✅ **Automatic cleanup** (no manual intervention needed)
- ✅ **Cost savings** (not paying for unused storage)

### User Experience:
- ✅ **Agents can delete** their properties easily
- ✅ **Owners can delete** their properties easily
- ✅ **Same interface** for both (no confusion)
- ✅ **Secure** (RLS ensures users only delete their own)

---

## 📝 Technical Details

### Files Modified:
1. `app/api/delete-image/route.ts` - NEW: API route for image deletion
2. `src/components/PropertyForm.tsx` - Updated `handleDelete()` to delete images

### Functions Added:
- `POST /api/delete-image` - Server-side image deletion endpoint
- Uses `deleteFile()` and `extractPathFromUrl()` from `storage.ts`

### Error Handling:
- ✅ If image deletion fails, property deletion still continues
- ✅ Logs warnings but doesn't block deletion
- ✅ Handles Supabase URLs gracefully (skips them)

---

## 🎯 Summary

### ✅ Fixed:
1. ✅ **Images now deleted** from Hetzner automatically
2. ✅ **Owners can delete** their properties (they always could, but now confirmed)
3. ✅ **Storage cleanup** prevents filling up with orphaned images

### ✅ Works For:
- ✅ Agents deleting their properties
- ✅ Owners deleting their properties
- ✅ Both use same delete button interface

---

**Status: ✅ COMPLETE**

**Both issues fixed:**
1. ✅ Images automatically deleted from Hetzner (no storage bloat)
2. ✅ Owners can delete properties (same as agents)

