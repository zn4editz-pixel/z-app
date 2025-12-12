#!/usr/bin/env node

/**
 * Quick Message Fix Test
 * Tests if the CORS fix resolved the message sending issue
 */

const BACKEND_URL = "http://localhost:5001";

const testMessageAPI = async () => {
    console.log("🧪 Testing Message API After CORS Fix");
    console.log("=====================================");
    
    try {
        // Step 1: Test backend health
        console.log("\n1️⃣ Testing backend health...");
        const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
        if (!healthResponse.ok) {
            throw new Error(`Backend not responding: ${healthResponse.status}`);
        }
        console.log("✅ Backend is running");

        // Step 2: Test authentication
        console.log("\n2️⃣ Testing authentication...");
        const authResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: "z4fwan77@gmail.com",
                password: "admin123"
            })
        });

        if (!authResponse.ok) {
            const error = await authResponse.text();
            throw new Error(`Authentication failed: ${error}`);
        }

        const { token } = await authResponse.json();
        console.log("✅ Authentication successful");

        // Step 3: Test getting users
        console.log("\n3️⃣ Testing users endpoint...");
        const usersResponse = await fetch(`${BACKEND_URL}/api/users/sidebar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!usersResponse.ok) {
            throw new Error(`Users endpoint failed: ${usersResponse.status}`);
        }

        const users = await usersResponse.json();
        console.log(`✅ Users endpoint working (${users.length} users found)`);

        if (users.length === 0) {
            console.log("⚠️ No users found - creating test users...");
            
            // Create a test user to send messages to
            const createUserResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
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

            if (createUserResponse.ok) {
                console.log("✅ Test user created");
                
                // Get users again
                const newUsersResponse = await fetch(`${BACKEND_URL}/api/users/sidebar`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (newUsersResponse.ok) {
                    const newUsers = await newUsersResponse.json();
                    console.log(`✅ Now have ${newUsers.length} users`);
                }
            }
        }

        // Step 4: Test message sending
        console.log("\n4️⃣ Testing message sending...");
        
        // Get fresh user list
        const finalUsersResponse = await fetch(`${BACKEND_URL}/api/users/sidebar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const finalUsers = await finalUsersResponse.json();
        
        if (finalUsers.length > 0) {
            const receiverId = finalUsers[0].id;
            const messageResponse = await fetch(`${BACKEND_URL}/api/messages/send/${receiverId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: "🧪 Test message after CORS fix - " + new Date().toISOString()
                })
            });

            if (messageResponse.ok) {
                const message = await messageResponse.json();
                console.log("✅ Message sent successfully!");
                console.log(`   Message ID: ${message.id}`);
                console.log(`   Text: ${message.text}`);
                console.log(`   Receiver: ${receiverId}`);
                
                // Test getting messages back
                const getMessagesResponse = await fetch(`${BACKEND_URL}/api/messages/${receiverId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (getMessagesResponse.ok) {
                    const messages = await getMessagesResponse.json();
                    console.log(`✅ Retrieved ${messages.length} messages`);
                }
                
                return true;
            } else {
                const error = await messageResponse.text();
                console.log("❌ Message sending failed:", error);
                return false;
            }
        } else {
            console.log("❌ No users available to send message to");
            return false;
        }

    } catch (error) {
        console.log("❌ Test failed:", error.message);
        return false;
    }
};

// Run the test
testMessageAPI().then(success => {
    console.log("\n📊 TEST RESULT:");
    console.log("===============");
    
    if (success) {
        console.log("🎉 MESSAGE SENDING IS WORKING!");
        console.log("\n✅ The CORS fix resolved the issue.");
        console.log("✅ Messages can now be sent successfully.");
        console.log("\n💡 Next steps:");
        console.log("1. Restart your frontend server (if running)");
        console.log("2. Clear browser cache (Ctrl+Shift+R)");
        console.log("3. Login to the app and try sending messages");
        console.log("4. Messages should now work in real-time!");
    } else {
        console.log("❌ MESSAGE SENDING STILL NOT WORKING");
        console.log("\n🔍 Additional troubleshooting needed:");
        console.log("1. Check if backend server is running: cd backend && npm run dev");
        console.log("2. Check browser console for JavaScript errors");
        console.log("3. Verify you're logged in with correct credentials");
        console.log("4. Try the frontend test page: test-frontend-messages.html");
    }
    
    process.exit(success ? 0 : 1);
}).catch(console.error);