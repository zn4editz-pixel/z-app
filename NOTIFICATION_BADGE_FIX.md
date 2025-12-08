# Notification Badge Fix - Don't Show Badge After Viewing

## Problem
The notification badge in the Navbar was showing unread notifications count, but after the user opened and viewed the notifications in the Social Hub, the badge would continue to show until the page was refreshed or the component re-rendered.

## Root Cause
The badge count calculation in Navbar was filtering notifications on every render, but the `read` status wasn't being properly reflected in real-time after calling `viewNotifications()`.

## Solution Implemented

### 1. Added Helper Method to Notification Store
**File:** `frontend/src/store/useNotificationStore.js`

Added a new method `getUnreadAdminCount()` that:
- Filters notifications by type (admin or admin_broadcast)
- Returns only unread notifications count
- Ensures consistent calculation across components

```javascript
getUnreadAdminCount: () => {
    const state = get();
    const adminNotifications = state.notifications.filter(
        n => (n.type === 'admin' || n.type === 'admin_broadcast') && !n.read
    );
    return adminNotifications.length;
}
```

### 2. Updated Navbar Component
**File:** `frontend/src/components/Navbar.jsx`

Changed from inline filtering to using the helper method:
```javascript
// Before
const adminNotifications = notifications.filter(n => n.type === 'admin' || n.type === 'admin_broadcast');
const unreadAdminNotifications = adminNotifications.filter(n => !n.read);
const totalUpdates = pendingReceived.length + unreadAdminNotifications.length + ...

// After
const unreadAdminCount = getUnreadAdminCount();
const totalUpdates = pendingReceived.length + unreadAdminCount + ...
```

### 3. Updated DiscoverPage Component
**File:** `frontend/src/pages/DiscoverPage.jsx`

Applied the same helper method for consistency:
```javascript
// Before
const adminNotifications = notifications.filter(n => n.type === 'admin' || n.type === 'admin_broadcast');
const unreadAdminNotifications = adminNotifications.filter(n => !n.read);
const notificationCount = unreadAdminNotifications.length + ...

// After
const unreadAdminCount = getUnreadAdminCount();
const notificationCount = unreadAdminCount + ...
```

## How It Works

1. **User sees badge**: Badge shows count of unread notifications (e.g., "3")
2. **User clicks Social Hub**: Navigates to /discover page
3. **User clicks Notifications tab**: 
   - `activeTab` changes to "notifications"
   - `useEffect` triggers after 500ms delay (Instagram-style)
   - `viewNotifications()` is called
   - All notifications are marked as `read: true`
   - Store updates and notifies all subscribers
4. **Badge updates immediately**: 
   - Navbar re-renders due to store update
   - `getUnreadAdminCount()` returns 0
   - Badge disappears (no longer shown)
5. **Badge stays hidden**: 
   - Even if user navigates away and comes back
   - Badge only reappears when NEW unread notifications arrive

## Testing

A test file has been created: `test-notification-badge.html`

To test:
1. Open the test file in a browser
2. Click "View Notifications" - badge should disappear
3. Click "Add Notification" - badge should reappear with new count
4. Click "View Notifications" again - badge should disappear again

## Benefits

✅ **Instant feedback**: Badge disappears immediately when notifications are viewed
✅ **Consistent behavior**: Same logic used in both Navbar and DiscoverPage
✅ **Better UX**: Users know their notifications have been acknowledged
✅ **Instagram-style**: Smooth 500ms delay before marking as read
✅ **No false positives**: Badge won't show for already-read notifications

## Files Modified

1. `frontend/src/store/useNotificationStore.js` - Added helper method
2. `frontend/src/components/Navbar.jsx` - Updated badge calculation
3. `frontend/src/pages/DiscoverPage.jsx` - Updated notification count calculation

## No Breaking Changes

All existing functionality remains intact:
- Notifications still load from backend
- Mark as read functionality works
- Delete notifications works
- Badge still shows for verification requests and suspensions
