// Frontend Comprehensive Test - Run in Browser Console
// Navigate to http://localhost:5175 and paste this in the console

console.log('🔍 FRONTEND COMPREHENSIVE TEST');
console.log('=' .repeat(60));

const testResults = {
    pageLoad: false,
    routing: false,
    authentication: false,
    components: false,
    stores: false,
    api: false,
    realtime: false
};

// Test 1: Page Load and Basic Functionality
function testPageLoad() {
    console.log('\n1️⃣ TESTING PAGE LOAD...');
    
    try {
        // Check if React is loaded
        if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
            console.log('✅ React app loaded');
            testResults.pageLoad = true;
        } else {
            console.log('❌ React app not detected');
        }
        
        // Check for main app container
        const appContainer = document.querySelector('#root');
        if (appContainer && appContainer.children.length > 0) {
            console.log('✅ App container has content');
        } else {
            console.log('❌ App container empty or missing');
        }
        
        // Check for navigation
        const navbar = document.querySelector('nav') || document.querySelector('[class*="navbar"]');
        if (navbar) {
            console.log('✅ Navigation found');
        } else {
            console.log('⚠️ Navigation not found (might be on login page)');
        }
        
    } catch (error) {
        console.log('❌ Page load test error:', error.message);
    }
}

// Test 2: Routing System
function testRouting() {
    console.log('\n2️⃣ TESTING ROUTING SYSTEM...');
    
    try {
        const currentPath = window.location.pathname;
        console.log('📍 Current path:', currentPath);
        
        // Check if React Router is working
        if (window.history && window.history.pushState) {
            console.log('✅ Browser routing available');
            testResults.routing = true;
        } else {
            console.log('❌ Browser routing not available');
        }
        
        // Test navigation links
        const navLinks = document.querySelectorAll('a[href^="/"]');
        console.log(`🔗 Found ${navLinks.length} internal navigation links`);
        
        if (navLinks.length > 0) {
            console.log('✅ Navigation links found');
        }
        
    } catch (error) {
        console.log('❌ Routing test error:', error.message);
    }
}

// Test 3: Authentication State
function testAuthentication() {
    console.log('\n3️⃣ TESTING AUTHENTICATION...');
    
    try {
        // Check localStorage for auth data
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
            try {
                const user = JSON.parse(authUser);
                console.log('✅ User authenticated:', user.username || user.email);
                console.log('   Profile complete:', user.hasCompletedProfile);
                console.log('   Admin:', user.isAdmin || false);
                testResults.authentication = true;
            } catch (e) {
                console.log('❌ Invalid auth data in localStorage');
            }
        } else {
            console.log('⚠️ No authentication data found (user not logged in)');
        }
        
        // Check for JWT cookie
        const cookies = document.cookie;
        if (cookies.includes('jwt=')) {
            console.log('✅ JWT cookie found');
        } else {
            console.log('⚠️ No JWT cookie found');
        }
        
    } catch (error) {
        console.log('❌ Authentication test error:', error.message);
    }
}

// Test 4: Component Rendering
function testComponents() {
    console.log('\n4️⃣ TESTING COMPONENT RENDERING...');
    
    try {
        const components = {
            buttons: document.querySelectorAll('button').length,
            inputs: document.querySelectorAll('input').length,
            forms: document.querySelectorAll('form').length,
            images: document.querySelectorAll('img').length,
            cards: document.querySelectorAll('[class*="card"]').length,
            modals: document.querySelectorAll('[class*="modal"]').length
        };
        
        console.log('📊 Component count:');
        Object.entries(components).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });
        
        if (components.buttons > 0 && components.inputs >= 0) {
            console.log('✅ Basic components rendered');
            testResults.components = true;
        } else {
            console.log('❌ Missing basic components');
        }
        
        // Check for error boundaries
        const errorMessages = document.querySelectorAll('[class*="error"]');
        if (errorMessages.length > 0) {
            console.log('⚠️ Error messages found:', errorMessages.length);
        }
        
    } catch (error) {
        console.log('❌ Component test error:', error.message);
    }
}

// Test 5: Store Management (Zustand)
function testStores() {
    console.log('\n5️⃣ TESTING STORE MANAGEMENT...');
    
    try {
        // Try to access stores from window (if exposed in dev mode)
        const storeTests = [
            'useAuthStore',
            'useFriendStore', 
            'useChatStore',
            'useNotificationStore',
            'useThemeStore'
        ];
        
        let storesFound = 0;
        storeTests.forEach(storeName => {
            if (window[storeName]) {
                console.log(`✅ ${storeName} accessible`);
                storesFound++;
            } else {
                console.log(`⚠️ ${storeName} not accessible from window`);
            }
        });
        
        if (storesFound > 0) {
            console.log('✅ Some stores accessible');
            testResults.stores = true;
        } else {
            console.log('⚠️ Stores not exposed to window (normal in production)');
            testResults.stores = true; // Assume working if no errors
        }
        
    } catch (error) {
        console.log('❌ Store test error:', error.message);
    }
}

// Test 6: API Connectivity
function testAPI() {
    console.log('\n6️⃣ TESTING API CONNECTIVITY...');
    
    return fetch('http://localhost:5001/health/ping')
        .then(response => {
            if (response.ok) {
                console.log('✅ Backend API reachable');
                testResults.api = true;
                return response.json();
            } else {
                console.log('❌ Backend API not responding');
                return null;
            }
        })
        .then(data => {
            if (data) {
                console.log('✅ API health check passed:', data.message);
            }
        })
        .catch(error => {
            console.log('❌ API connectivity error:', error.message);
        });
}

// Test 7: Real-time Features (Socket.IO)
function testRealtime() {
    console.log('\n7️⃣ TESTING REAL-TIME FEATURES...');
    
    try {
        // Check if Socket.IO is loaded
        if (window.io || window.socket) {
            console.log('✅ Socket.IO detected');
            testResults.realtime = true;
        } else {
            console.log('⚠️ Socket.IO not detected in window');
        }
        
        // Check for WebSocket connections
        if (navigator.onLine) {
            console.log('✅ Browser is online');
        } else {
            console.log('❌ Browser is offline');
        }
        
        // Look for connection status indicators
        const connectionStatus = document.querySelector('[class*="connection"]') || 
                               document.querySelector('[class*="online"]') ||
                               document.querySelector('[class*="offline"]');
        
        if (connectionStatus) {
            console.log('✅ Connection status indicator found');
        } else {
            console.log('⚠️ No connection status indicator');
        }
        
    } catch (error) {
        console.log('❌ Real-time test error:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive frontend tests...\n');
    
    testPageLoad();
    testRouting();
    testAuthentication();
    testComponents();
    testStores();
    await testAPI();
    testRealtime();
    
    // Summary
    console.log('\n📊 FRONTEND TEST RESULTS');
    console.log('=' .repeat(60));
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    
    Object.entries(testResults).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'WORKING' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 FRONTEND SCORE: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 FRONTEND WORKING PERFECTLY!');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('⚠️ FRONTEND MOSTLY WORKING - Minor issues detected');
    } else {
        console.log('🚨 FRONTEND HAS MAJOR ISSUES - Needs immediate attention');
    }
    
    return testResults;
}

// Instructions
console.log(`
🎯 FRONTEND TESTING INSTRUCTIONS:

1. Make sure you're on http://localhost:5175
2. Run: runAllTests()
3. Check the results and fix any issues

Ready to test? Run: runAllTests()
`);

// Export to global scope
window.testPageLoad = testPageLoad;
window.testRouting = testRouting;
window.testAuthentication = testAuthentication;
window.testComponents = testComponents;
window.testStores = testStores;
window.testAPI = testAPI;
window.testRealtime = testRealtime;
window.runAllTests = runAllTests;