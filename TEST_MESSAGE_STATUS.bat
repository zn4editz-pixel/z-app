@echo off
echo 🧪 Testing Message Status Updates...
echo.

echo 📋 Test Steps:
echo 1. Login with two different accounts in different browsers/tabs
echo 2. Send a message from Account A to Account B
echo 3. Check sidebar status on Account A (should show clock initially)
echo 4. Account B should come online and receive the message
echo 5. Check sidebar status on Account A (should show single tick for delivered)
echo 6. Account B should read the message (open the chat)
echo 7. Check sidebar status on Account A (should show double tick for read)
echo.

echo 🔍 What to check:
echo - Clock icon (⏰) = Sending/Pending
echo - Single tick (✓) = Sent to offline user
echo - Gray double tick (✓✓) = Delivered to online user
echo - Colored double tick (✓✓) = Read by recipient
echo.

echo 🌐 URLs to test:
echo - Account A: http://localhost:5173/login
echo - Account B: http://localhost:5173/login (incognito/different browser)
echo.

echo 🛠️ Debug info:
echo - Check browser console for message status logs
echo - Check backend console for delivery notifications
echo - Verify socket connections are working
echo.

echo 📧 Test Accounts:
echo - Admin: z4fwan77@gmail.com / admin123
echo - User: xenos@gmail.com / (check database for password)
echo.

pause