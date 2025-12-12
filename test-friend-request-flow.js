// Test Friend Request Flow in Browser Console
// Copy and paste this into the browser console on http://localhost:5175

console.log('🧪 TESTING FRIEND REQUEST FLOW');

// Test 1: Check if friend store is working
const testFriendStore = () => {
    console.log('\n1️⃣ Testing Friend Store...');
    
    // Get the friend store from window (if exposed) or from React DevTools
    const friendStore = window.useFriendStore?.getState?.() || 
                       (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current?.memoizedState);
    
    if (friendStore) {
        console.log('✅ Friend store found');
        console.log('Friends:', friendStore.friends?.length || 0);
        console.log('Pending Sent:', friendStore.pendingSent?.length || 0);
        console.log('Pending Received:', friendStore.pendingReceived?.length || 0);
    } else {
        console.log('❌ Friend store not accessible from console');
        console.log('💡 Try: Open React DevTools and inspect the DiscoverPage component');
    }
};

// Test 2: Check if discover page is loaded
const testDiscoverPage = () => {
    console.log('\n2️⃣ Testing Discover Page...');
    
    const discoverTitle = document.querySelector('h1');
    if (discoverTitle && discoverTitle.textContent.includes('Social Hub')) {
        console.log('✅ Discover page loaded');
        
        // Check for user cards
        const userCards = document.querySelectorAll('[class*="card"]');
        console.log(`📊 Found ${userCards.length} cards on page`);
        
        // Check for Add Friend buttons
        const addFriendButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent.includes('Add Friend') || btn.textContent.includes('Request Sent')
        );
        console.log(`🔘 Found ${addFriendButtons.length} friend request buttons`);
        
        if (addFriendButtons.length > 0) {
            console.log('✅ Friend request buttons found');
            addFriendButtons.forEach((btn, i) => {
                console.log(`   Button ${i+1}: "${btn.textContent.trim()}" - ${btn.disabled ? 'Disabled' : 'Enabled'}`);
            });
        } else {
            console.log('❌ No friend request buttons found');
            console.log('💡 Check if users are displayed and buttons are rendered');
        }
    } else {
        console.log('❌ Discover page not loaded or title not found');
        console.log('💡 Navigate to /discover first');
    }
};

// Test 3: Check network requests
const testNetworkRequests = () => {
    console.log('\n3️⃣ Testing Network Requests...');
    
    // Override fetch to monitor friend-related requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('/friends/')) {
            console.log(`🌐 Friend API call: ${url}`);
        }
        return originalFetch.apply(this, args);
    };
    
    console.log('✅ Network monitoring enabled');
    console.log('💡 Now try sending a friend request - you should see API calls logged');
};

// Test 4: Simulate friend request
const testSendFriendRequest = () => {
    console.log('\n4️⃣ Testing Send Friend Request...');
    
    const addFriendButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Add Friend') && !btn.disabled
    );
    
    if (addFriendButton) {
        console.log('✅ Found enabled Add Friend button');
        console.log('🔘 Clicking button...');
        addFriendButton.click();
        
        // Check for state changes after a delay
        setTimeout(() => {
            const updatedButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Request Sent') || btn.textContent.includes('Sending')
            );
            
            if (updatedButton) {
                console.log('✅ Button state updated after click');
                console.log(`   New state: "${updatedButton.textContent.trim()}"`);
            } else {
                console.log('❌ Button state did not update');
                console.log('💡 Check console for errors or network issues');
            }
        }, 2000);
    } else {
        console.log('❌ No enabled Add Friend button found');
        console.log('💡 Either no users to add or all requests already sent');
    }
};

// Run all tests
const runAllTests = () => {
    testFriendStore();
    testDiscoverPage();
    testNetworkRequests();
    
    // Wait a bit before testing the button click
    setTimeout(() => {
        testSendFriendRequest();
    }, 1000);
};

// Instructions
console.log(`
🎯 FRIEND REQUEST TESTING INSTRUCTIONS:

1. Make sure you're on http://localhost:5175/discover
2. Run: runAllTests()
3. Or run individual tests:
   - testFriendStore()
   - testDiscoverPage()
   - testNetworkRequests()
   - testSendFriendRequest()

4. Check the browser network tab for API calls
5. Check React DevTools for state changes

Ready to test? Run: runAllTests()
`);

// Export functions to global scope
window.testFriendStore = testFriendStore;
window.testDiscoverPage = testDiscoverPage;
window.testNetworkRequests = testNetworkRequests;
window.testSendFriendRequest = testSendFriendRequest;
window.runAllTests = runAllTests;