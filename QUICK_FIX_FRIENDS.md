# Quick Fix: Friends Not Showing in Sidebar

## The Problem

Friends list is empty in sidebar even though users exist in the database.

## Root Cause

The caching logic was skipping the API fetch even when there was no cached data, leaving the friends array empty.

## What I Fixed

Updated `frontend/src/store/useFriendStore.js`:
- ✅ Load cache first (if available)
- ✅ Only skip fetch if cache exists AND recently fetched
- ✅ Always fetch if no cache available

## Quick Fix for You

**Option 1: Clear Session Storage (Easiest)**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Type: `sessionStorage.clear()`
4. Press Enter
5. Refresh page (F5)

**Option 2: Hard Refresh**
- Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)

## Verify It Works

After clearing, you should see:
```
✅ Friends loading from API
✅ Friends appearing in sidebar
✅ Can click on friends to chat
```

---

**TL;DR:** Type `sessionStorage.clear()` in console and refresh
