# 🎯 SUPABASE SETUP GUIDE - STEP BY STEP

## 🚨 IMPORTANT: Complete These Steps First

### Step 1: Apply Database Schema
1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/psmdpjokjhjfhzesaret
2. **Click "SQL Editor"** in the left sidebar
3. **Click "New query"** button
4. **Copy the entire contents** of `supabase-schema.sql` file
5. **Paste it into the SQL Editor**
6. **Click "Run"** button to execute

### Step 2: Verify Tables Created
After running the schema, you should see these tables in your database:
- ✅ `users`
- ✅ `messages` 
- ✅ `friend_requests`
- ✅ `friends`
- ✅ `reports`

### Step 3: Check Project URL
Your Supabase project URL should be: `https://psmdpjokjhjfhzesaret.supabase.co`

If this URL doesn't work, please:
1. Go to your Supabase dashboard
2. Check the correct project URL
3. Update the URL in the environment files

## 🔧 WHAT WE'VE PREPARED FOR YOU

### ✅ Data Export Complete
- **22 users** exported from your current database
- **4 reports** exported
- **0 messages** (clean start)
- Export saved to: `backend/supabase-export.json`

### ✅ Environment Files Ready
- `backend/.env.supabase` - Backend configuration
- `frontend/.env.supabase` - Frontend configuration
- All your Supabase credentials are configured

### ✅ Migration Scripts Ready
- `backend/export-for-supabase.js` - Export your data
- `backend/import-to-supabase.js` - Import to Supabase
- `backend/test-supabase-connection.js` - Test connection

## 🚀 NEXT STEPS AFTER SCHEMA IS APPLIED

### Option 1: Automatic Import (Recommended)
```bash
cd backend
node import-to-supabase.js
```

### Option 2: Manual Data Entry
If automatic import fails, you can:
1. Create a test user in Supabase dashboard
2. Test the connection
3. Import data later

## 🎯 VERIFICATION CHECKLIST

After applying the schema, verify:
- [ ] All 5 tables created in Supabase
- [ ] No SQL errors in the editor
- [ ] Project URL accessible
- [ ] Connection test passes

## 💡 TROUBLESHOOTING

### If Schema Application Fails:
1. Check for syntax errors in SQL Editor
2. Make sure you copied the entire schema
3. Run sections one by one if needed

### If Connection Still Fails:
1. Wait 5-10 minutes for project to fully provision
2. Check project URL in Supabase dashboard
3. Verify API keys are correct

## 🎉 ONCE COMPLETE

After successful schema application:
1. **Test connection**: `node test-supabase-connection.js`
2. **Import data**: `node import-to-supabase.js`
3. **Proceed to Step 2**: Railway backend deployment

---

**Ready to continue?** Once your schema is applied and connection works, we'll move to Step 2: Railway Backend Setup! 🚂