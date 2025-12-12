// Test Frontend Friend Flow
console.log('🧪 FRONTEND FRIEND FLOW TEST');
console.log('This test should be run in the browser console');
console.log('');
console.log('📝 MANUAL TESTING STEPS:');
console.log('');
console.log('1. Open http://localhost:5174 in your browser');
console.log('2. Login with any user (test, admin, s4fwan_x)');
console.log('3. Go to Discover page');
console.log('4. Open browser Developer Tools (F12)');
console.log('5. Go to Console tab');
console.log('6. Run these commands to debug:');
console.log('');
console.log('// Check friend store state');
console.log('window.friendStore = useFriendStore.getState();');
console.log('console.log("Friends:", window.friendStore.friends);');
console.log('console.log("Pending Sent:", window.friendStore.pendingSent);');
console.log('console.log("Pending Received:", window.friendStore.pendingReceived);');
console.log('');
console.log('// Test sending friend request');
console.log('window.friendStore.sendFriendRequest("USER_ID_HERE");');
console.log('');
console.log('// Check state after sending');
console.log('setTimeout(() => {');
console.log('  console.log("After send - Pending Sent:", useFriendStore.getState().pendingSent);');
console.log('}, 1000);');
console.log('');
console.log('🔍 WHAT TO LOOK FOR:');
console.log('- Check if pendingSent array updates after sending request');
console.log('- Check if friends array updates after accepting request');
console.log('- Check if users appear in sidebar after becoming friends');
console.log('- Look for any console errors or warnings');
console.log('');
console.log('🚨 COMMON ISSUES TO CHECK:');
console.log('1. Network errors in Network tab');
console.log('2. JavaScript errors in Console tab');
console.log('3. State not updating (check React DevTools)');
console.log('4. Caching issues (clear localStorage/sessionStorage)');
console.log('');
console.log('💡 QUICK FIXES TO TRY:');
console.log('1. Refresh the page');
console.log('2. Clear browser cache (Ctrl+Shift+R)');
console.log('3. Clear localStorage: localStorage.clear()');
console.log('4. Clear sessionStorage: sessionStorage.clear()');

// Also create a simple browser test script
const browserTestScript = `
// BROWSER CONSOLE TEST SCRIPT
// Copy and paste this into browser console after logging in

console.log('🧪 Testing Friend System in Browser');

// Get friend store
const friendStore = window.useFriendStore?.getState() || {};
console.log('📊 Current Friend Store State:');
console.log('Friends:', friendStore.friends?.length || 0);
console.log('Pending Sent:', friendStore.pendingSent?.length || 0);
console.log('Pending Received:', friendStore.pendingReceived?.length || 0);

// Test API directly
async function testFriendAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found - please login first');
        return;
    }
    
    try {
        // Test get requests
        const response = await fetch('/api/friends/requests', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:');
            console.log('Sent:', data.sent?.length || 0);
            console.log('Received:', data.received?.length || 0);
        } else {
            console.log('❌ API Error:', response.status);
        }
    } catch (error) {
        console.log('❌ Network Error:', error.message);
    }
}

// Run API test
testFriendAPI();

// Instructions
console.log('');
console.log('📝 To test sending friend request:');
console.log('1. Go to Discover page');
console.log('2. Find a user to send request to');
console.log('3. Click "Add Friend" button');
console.log('4. Check if button changes to "Request Sent"');
console.log('5. Check if request appears in pending sent list');
`;

console.log('');
console.log('🌐 BROWSER TEST SCRIPT:');
console.log('Copy the following script and paste it in browser console:');
console.log('');
console.log(browserTestScript);