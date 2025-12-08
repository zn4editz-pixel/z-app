# Field Name Fix: suspendedUntil → suspensionEndTime

**Date:** December 8, 2025  
**Issue:** Admin panel returning 500 error when fetching users

## Problem
The admin controller was using the field name `suspendedUntil` but the Prisma schema defines it as `suspensionEndTime`, causing Prisma query errors.

## Error Message
```
Unknown field `suspendedUntil` for select statement on model `User`
```

## Files Fixed

### Backend
- ✅ `backend/src/controllers/admin.controller.js`
  - Line 44: Changed `suspendedUntil: true` → `suspensionEndTime: true` in getAllUsers select
  - Line 89: Changed `suspendedUntil: suspendUntilDate` → `suspensionEndTime: suspendUntilDate` in suspendUser
  - Line 110: Changed `suspendedUntil: null` → `suspensionEndTime: null` in unsuspendUser

### Frontend
- ✅ `frontend/src/pages/AdminDashboard.jsx`
  - Line 171: Changed `suspendedUntil` → `suspensionEndTime` in suspend handler
  - Line 208: Changed `suspendedUntil` → `suspensionEndTime` in unsuspend handler

- ✅ `frontend/src/pages/DiscoverPage.jsx`
  - Line 630: Changed `authUser.suspendedUntil` → `authUser.suspensionEndTime`

- ✅ `frontend/src/store/useAuthStore.js`
  - Line 76: Changed `user.suspendedUntil` → `user.suspensionEndTime`

## Result
✅ Admin panel now loads users successfully  
✅ User suspension/unsuspension works correctly  
✅ All field names consistent with Prisma schema

## Schema Reference
From `backend/prisma/schema.prisma`:
```prisma
model User {
  // ...
  isSuspended        Boolean @default(false)
  suspensionReason    String?
  suspensionStartTime DateTime?
  suspensionEndTime   DateTime?  // ← Correct field name
  suspensionDuration  Int?
  // ...
}
```
