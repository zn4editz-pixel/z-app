@echo off
echo 🧪 Testing Manual Reporting Functionality...
echo.

echo 📋 Test Steps:
echo 1. Open Stranger Chat page
echo 2. Connect with a partner (or wait for connection)
echo 3. Click the red flag (report) button
echo 4. Fill out the report form
echo 5. Submit the report
echo.

echo 🔍 What to check:
echo - Report button should be visible when connected
echo - Screenshot should be captured automatically
echo - Report modal should open with screenshot preview
echo - Form should submit without getting stuck on "Submitting..."
echo - Success/error message should appear
echo - Modal should close on success
echo.

echo 🌐 URLs to test:
echo - Frontend: http://localhost:5173/stranger-chat
echo - Backend logs: Check console for report submission logs
echo.

echo 🛠️ If issues persist:
echo - Check browser console for JavaScript errors
echo - Check backend console for socket event logs
echo - Verify WebRTC connection is established
echo.

pause