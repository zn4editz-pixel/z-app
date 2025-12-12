#!/usr/bin/env node

/**
 * DEEP MESSAGE SENDING DIAGNOSIS
 * Comprehensive analysis to find the exact issue
 */

const BACKEND_URL = "http://localhost:5001";

console.log("🔍 DEEP MESSAGE SENDING DIAGNOSIS");
console.log("=================================");
console.log("Performing comprehensive analysis to identify the exact issue...\n");

// Test 1: Backend Health Check
const testBackendHealth = async () => {
    console.log("1️⃣ BACKEND HEALTH CHECK");
    console.log("=======================");
    
    try {
        const response = await fetch(`${BACKEND_URL}/health/ping`);
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Backend is running");
            console.log(`   Response: ${JSON.stringify(data)}`);
            return true;
        } else {
            console.log(`❌ Backend health check failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Backend is not reachable: ${error.message}`);
        console.log("💡 Solution: Start backend with 'cd backend && npm run dev'");
        return false;
    }
};

// Test 2: Authentication Flow
const testAuthentication = async () => {
    console.log("\n2️⃣ AUTHENTICATION TEST");
    console.log("======================");
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: "z4fwan77@gmail.com",
                password: "admin123"
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Authentication successful");
            console.log(`   User: ${data.username || data.fullName}`);
            console.log(`   Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
            return data.token;
        } else {
            const error = await response.text();
            console.log(`❌ Authentication failed: ${response.status}`);
            console.log(`   Error: ${error}`);
            console.log("💡 Check credentials or create admin user");
            return null;
        }
    } catch (error) {
        console.log(`❌ Authentication request failed: ${error.message}`);
        return null;
    }
};

// Test 3: Users Endpoint
const testUsersEndpoint = async (token) => {
    console.log("\n3️⃣ USERS ENDPOINT TEST");
    console.log("======================");
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/sidebar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const users = await response.json();
            console.log(`✅ Users endpoint working`);
            console.log(`   Found ${users.length} users`);
            
            if (users.length > 0) {
                console.log(`   First user: ${users[0].username || users[0].nickname}`);
                return users[0].id;
            } else {
                console.log("⚠️ No users found - need to create test users");
                return null;
            }
        } else {
            const error = await response.text();
            console.log(`❌ Users endpoint failed: ${response.status}`);
            console.log(`   Error: ${error}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Users request failed: ${error.message}`);
        return null;
    }
};

// Test 4: Message Sending (The Critical Test)
const testMessageSending = async (token, receiverId) => {
    console.log("\n4️⃣ MESSAGE SENDING TEST");
    console.log("=======================");
    
    if (!receiverId) {
        console.log("❌ No receiver ID available - skipping message test");
        return false;
    }
    
    const testMessage = {
        text: `🧪 Deep diagnosis test message - ${new Date().toISOString()}`
    };
    
    try {
        console.log(`📤 Sending message to user ${receiverId}...`);
        console.log(`   Message: "${testMessage.text}"`);
        console.log(`   URL: ${BACKEND_URL}/api/messages/send/${receiverId}`);
        console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'None'}`);
        
        const response = await fetch(`${BACKEND_URL}/api/messages/send/${receiverId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testMessage)
        });

        console.log(`📥 Response status: ${response.status}`);
        console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const message = await response.json();
            console.log("🎉 MESSAGE SENDING WORKS!");
            console.log(`   Message ID: ${message.id}`);
            console.log(`   Text: ${message.text}`);
            console.log(`   Created: ${message.createdAt}`);
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ Message sending failed: ${response.status}`);
            console.log(`   Error response: ${error}`);
            
            // Analyze the error
            if (response.status === 401) {
                console.log("🔍 Analysis: Authentication issue");
                console.log("   - Token might be invalid or expired");
                console.log("   - Check if user is logged in properly");
            } else if (response.status === 403) {
                console.log("🔍 Analysis: Permission issue");
                console.log("   - User might be blocked or suspended");
                console.log("   - Check user permissions");
            } else if (response.status === 404) {
                console.log("🔍 Analysis: Route not found");
                console.log("   - Check if message routes are properly configured");
                console.log("   - Verify receiver ID exists");
            } else if (response.status === 500) {
                console.log("🔍 Analysis: Server error");
                console.log("   - Check backend logs for detailed error");
                console.log("   - Database or controller issue");
            } else if (response.status === 429) {
                console.log("🔍 Analysis: Rate limiting");
                console.log("   - Too many requests - wait and try again");
            }
            
            return false;
        }
    } catch (error) {
        console.log(`❌ Message request failed: ${error.message}`);
        console.log("🔍 Analysis: Network or connection issue");
        console.log("   - Check if backend is running");
        console.log("   - Verify network connectivity");
        console.log("   - Check for CORS issues in browser");
        return false;
    }
};

// Test 5: Create Test User if Needed
const createTestUser = async (token) => {
    console.log("\n5️⃣ CREATING TEST USER");
    console.log("=====================");
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: "testuser@example.com",
                username: "testuser",
                fullName: "Test User",
                password: "password123"
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Test user created successfully");
            console.log(`   User ID: ${data.id}`);
            return data.id;
        } else {
            const error = await response.text();
            console.log(`⚠️ Test user creation failed: ${response.status}`);
            console.log(`   Error: ${error}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Test user creation request failed: ${error.message}`);
        return null;
    }
};

// Test 6: Retrieve Messages
const testMessageRetrieval = async (token, userId) => {
    console.log("\n6️⃣ MESSAGE RETRIEVAL TEST");
    console.log("=========================");
    
    if (!userId) {
        console.log("❌ No user ID available - skipping retrieval test");
        return false;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const messages = await response.json();
            console.log(`✅ Message retrieval works`);
            console.log(`   Retrieved ${messages.length} messages`);
            
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                console.log(`   Last message: "${lastMessage.text}"`);
                console.log(`   Sent at: ${lastMessage.createdAt}`);
            }
            
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ Message retrieval failed: ${response.status}`);
            console.log(`   Error: ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Message retrieval request failed: ${error.message}`);
        return false;
    }
};

// Main diagnostic function
const runDeepDiagnosis = async () => {
    console.log("Starting comprehensive message sending diagnosis...\n");
    
    const results = {
        backend: false,
        auth: false,
        users: false,
        messageSend: false,
        messageRetrieve: false
    };
    
    // Step 1: Check backend
    results.backend = await testBackendHealth();
    if (!results.backend) {
        console.log("\n🚨 CRITICAL: Backend is not running!");
        console.log("   Start backend: cd backend && npm run dev");
        return;
    }
    
    // Step 2: Test authentication
    const token = await testAuthentication();
    results.auth = !!token;
    if (!token) {
        console.log("\n🚨 CRITICAL: Authentication failed!");
        console.log("   Check admin credentials or create admin user");
        return;
    }
    
    // Step 3: Test users endpoint
    let receiverId = await testUsersEndpoint(token);
    results.users = !!receiverId;
    
    // Step 4: Create test user if needed
    if (!receiverId) {
        receiverId = await createTestUser(token);
        if (receiverId) {
            results.users = true;
        }
    }
    
    // Step 5: Test message sending (THE CRITICAL TEST)
    if (receiverId) {
        results.messageSend = await testMessageSending(token, receiverId);
        
        // Step 6: Test message retrieval
        if (results.messageSend) {
            results.messageRetrieve = await testMessageRetrieval(token, receiverId);
        }
    }
    
    // Final analysis
    console.log("\n📊 DIAGNOSIS RESULTS");
    console.log("===================");
    console.log(`Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Users Endpoint: ${results.users ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Message Sending: ${results.messageSend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Message Retrieval: ${results.messageRetrieve ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log("\n🎯 FINAL DIAGNOSIS");
    console.log("==================");
    
    if (results.messageSend) {
        console.log("🎉 MESSAGE SENDING IS WORKING!");
        console.log("   The API is functioning correctly.");
        console.log("   If frontend still doesn't work:");
        console.log("   1. Clear browser cache (Ctrl+Shift+R)");
        console.log("   2. Check browser console for JavaScript errors");
        console.log("   3. Verify you're logged in to the frontend");
        console.log("   4. Check if frontend is connecting to correct backend URL");
    } else if (!results.backend) {
        console.log("🚨 BACKEND NOT RUNNING");
        console.log("   Start backend: cd backend && npm run dev");
    } else if (!results.auth) {
        console.log("🚨 AUTHENTICATION ISSUE");
        console.log("   Check admin credentials or database");
    } else if (!results.users) {
        console.log("🚨 NO USERS AVAILABLE");
        console.log("   Create users or check database");
    } else {
        console.log("🚨 MESSAGE SENDING API FAILURE");
        console.log("   Check backend logs for detailed errors");
        console.log("   Verify message controller and routes");
        console.log("   Check database connectivity");
    }
    
    return results.messageSend;
};

// Run the diagnosis
runDeepDiagnosis()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error("\n💥 Diagnosis failed:", error);
        process.exit(1);
    });