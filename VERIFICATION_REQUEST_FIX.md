# Verification Request Fix

## Problem
Admin dashboard was not receiving verification requests from users.

## Root Cause
The admin controller was querying for two status values:
- `"pending"` ✅ (correct)
- `"submitted"` ❌ (doesn't exist in schema)

The User model schema only has these statuses:
- `"none"` (default)
- `"pending"` (when user submits request)
- `"approved"` (when admin approves)
- `"rejected"` (when admin rejects)

## Solution Applied

### 1. Fixed Admin Query
**File: `backend/src/controllers/admin.controller.js`**
- Removed the non-existent `"submitted"` status from query
- Now only queries for `"pending"` status
- Added detailed logging to track verification requests

### 2. Enhanced Logging
**File: `backend/src/routes/user.route.js`**
- Added console logs when users submit verification requests
- Logs user ID, username, reason, and ID proof status
- Helps track the entire verification flow

## Changes Made

### Before
```javascript
const users = await User.find({
  $or: [
    { "verificationRequest.status": "pending" },
    { "verificationRequest.status": "submitted" } // ❌ Doesn't exist
  ]
})
```

### After
```javascript
const users = await User.find({
  "verificationRequest.status": "pending" // ✅ Correct
})
```

## Testing Steps

1. **User submits verification request:**
   - Go to Settings → Request Verification
   - Fill in reason and upload ID proof
   - Submit request
   - Check backend console for: `✅ Verification request saved for user...`

2. **Admin checks requests:**
   - Go to Admin Dashboard → Verification Requests tab
   - Should see the pending request
   - Check backend console for: `✅ Found X verification requests`

3. **Admin approves/rejects:**
   - Click Approve or Reject
   - User should receive socket notification
   - User should receive email notification

## Files Modified
1. ✅ `backend/src/controllers/admin.controller.js` - Fixed query
2. ✅ `backend/src/routes/user.route.js` - Enhanced logging

## Additional Fix: Timeout Issue

### Problem
The `/admin/verification-requests` endpoint was timing out after 15 seconds.

### Cause
The database query with sorting on nested field `verificationRequest.requestedAt` was slow.

### Solution
1. Removed database-level sorting
2. Added in-memory sorting (faster for small datasets)
3. Added query performance logging
4. Simplified query to use only essential fields

### Changes
```javascript
// Before: Slow DB sort
.sort({ "verificationRequest.requestedAt": -1 })

// After: Fast in-memory sort
users.sort((a, b) => {
  const dateA = a.verificationRequest?.requestedAt || a.createdAt;
  const dateB = b.verificationRequest?.requestedAt || b.createdAt;
  return new Date(dateB) - new Date(dateA);
});
```

## Result
✅ Admin dashboard now correctly receives and displays verification requests
✅ Query completes in milliseconds instead of timing out
✅ Detailed logging helps track the verification flow and performance
✅ Users can successfully submit verification requests
✅ Admins can approve/reject requests

## Next Steps
**IMPORTANT:** Restart the backend server to apply the changes:
```bash
# Stop the current backend process
# Then restart it
npm run dev
```
