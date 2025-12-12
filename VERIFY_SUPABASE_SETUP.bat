@echo off
echo ========================================
echo 🔍 VERIFYING SUPABASE SETUP
echo ========================================

echo.
echo 🔄 Testing Supabase connection...
cd backend
node test-supabase-connection.js
cd ..

echo.
echo 📊 If connection successful, importing data...
cd backend
node import-to-supabase.js
cd ..

echo.
echo ========================================
echo 🎯 VERIFICATION COMPLETE
echo ========================================

echo.
echo 💡 If everything worked:
echo   ✅ Your database is ready
echo   ✅ Data has been imported
echo   ✅ Ready for Step 2: Railway Backend
echo.
echo 🚀 Next: Run STEP_2_RAILWAY_SETUP.bat
echo.
pause