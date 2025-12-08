# Stranger Chat Outline Buttons & Better Positioning

## Changes Made

### 1. Chat Button - Better Position
**Before:** `bottom-14 left-3` (left side, could overlap with controls)
**After:** `bottom-16 sm:bottom-14 right-4` (right side, better for thumb reach)

**Benefits:**
- ✅ Right side is easier to reach on mobile (thumb-friendly)
- ✅ Doesn't overlap with bottom controls
- ✅ Larger size: `w-12 h-12 sm:w-14 sm:h-14`
- ✅ Better unread badge with border
- ✅ Consistent positioning across devices

### 2. All Buttons Now Outline-Only

#### AI Protected Badge
**Before:** `badge-success` (filled green background)
**After:** `badge-outline border-2 border-success text-success` (green border only)

#### Report Button
**Before:** `btn-error` (filled red background)
**After:** `btn-outline btn-error border-2` (red border only)

#### Start/Next Button
**Already outline:** `btn-outline btn-primary border-2`

#### Add Friend Button
**Already outline:** `btn-outline btn-secondary border-2`

#### Leave Button
**Already outline:** `btn-outline btn-error border-2`

#### Chat Button
**Already outline:** `btn-outline btn-primary border-2`

#### Camera Flip Button
**Already outline:** `btn-outline btn-primary`

### 3. Visual Consistency

**All buttons now have:**
- Outline style (no fill colors)
- Border-2 for better visibility
- Consistent hover effects
- Professional, clean look
- Better contrast on video background

## Result

✅ Chat button in better position (right side, thumb-friendly)
✅ All buttons are outline-only (no fill colors)
✅ AI Protected badge has green border only
✅ Consistent, professional design
✅ Better visibility on video background
✅ Works perfectly on mobile and desktop
✅ Clean, modern aesthetic

## Visual Style
- **Primary buttons:** Blue border
- **Secondary buttons:** Purple border  
- **Error/Leave buttons:** Red border
- **Success badge:** Green border
- **Warning badge:** Yellow border
- All with transparent backgrounds
