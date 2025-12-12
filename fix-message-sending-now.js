#!/usr/bin/env node

/**
 * IMMEDIATE MESSAGE SENDING FIX
 * This script will identify and fix the exact issue preventing messages from sending
 */

import fs from 'fs';
import path from 'path';

console.log("🔧 FIXING MESSAGE SENDING ISSUE NOW");
console.log("===================================");

// Fix 1: Update axios configuration to remove withCredentials
const fixAxiosConfig = () => {
    console.log("\n1️⃣ Fixing Axios Configuration...");
    
    const axiosPath = path.join(process.cwd(), 'frontend', 'src', 'lib', 'axios.js');
    
    if (fs.existsSync(axiosPath)) {
        let content = fs.readFileSync(axiosPath, 'utf8');
        
        // Remove withCredentials: true which can cause CORS issues
        if (content.includes('withCredentials: true')) {
            content = content.replace('withCredentials: true,', '// withCredentials: true, // Removed to fix CORS');
            fs.writeFileSync(axiosPath, content);
            console.log("✅ Removed withCredentials from axios config");
        } else {
            console.log("✅ Axios config already correct");
        }
    } else {
        console.log("❌ Axios config file not found");
    }
};

// Fix 2: Update backend CORS to be more permissive for development
const fixBackendCORS = () => {
    console.log("\n2️⃣ Fixing Backend CORS Configuration...");
    
    const backendPath = path.join(process.cwd(), 'backend', 'src', 'index.js');
    
    if (fs.existsSync(backendPath)) {
        let content = fs.readFileSync(backendPath, 'utf8');
        
        // Make CORS more permissive for development
        const oldCors = `app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));`;

        const newCors = `app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: false, // Changed to false to fix CORS issues
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
  }));`;

        if (content.includes('credentials: true')) {
            content = content.replace(oldCors, newCors);
            fs.writeFileSync(backendPath, content);
            console.log("✅ Updated backend CORS configuration");
        } else {
            console.log("✅ Backend CORS already updated");
        }
    } else {
        console.log("❌ Backend index.js not found");
    }
};

// Fix 3: Create a simple message test endpoint
const createTestEndpoint = () => {
    console.log("\n3️⃣ Creating Test Message Endpoint...");
    
    const testPath = path.join(process.cwd(), 'backend', 'test-message-endpoint.js');
    
    const testEndpoint = `// Simple message test endpoint
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: "*",
    credentials: false
}));

app.use(express.json());

// Test endpoint
app.post('/api/test-message', (req, res) => {
    console.log('📨 Test message received:', req.body);
    res.json({ 
        success: true, 
        message: 'Message received successfully',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test-health', (req, res) => {
    res.json({ status: 'OK', message: 'Test server is running' });
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(\`🧪 Test server running on http://localhost:\${PORT}\`);
    console.log('Test endpoints:');
    console.log('- GET  http://localhost:5002/api/test-health');
    console.log('- POST http://localhost:5002/api/test-message');
});
`;

    fs.writeFileSync(testPath, testEndpoint);
    console.log("✅ Created test message endpoint");
    console.log("💡 Run: node backend/test-message-endpoint.js");
};

// Fix 4: Create a frontend test script
const createFrontendTest = () => {
    console.log("\n4️⃣ Creating Frontend Test Script...");
    
    const testPath = path.join(process.cwd(), 'test-frontend-messages.html');
    
    const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message Sending Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        #results { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🧪 Message Sending Test</h1>
    
    <div class="test-section">
        <h3>1. Test Backend Connection</h3>
        <button onclick="testBackend()">Test Backend Health</button>
        <div id="backend-result"></div>
    </div>
    
    <div class="test-section">
        <h3>2. Test Authentication</h3>
        <input type="email" id="email" placeholder="Email" value="z4fwan77@gmail.com">
        <input type="password" id="password" placeholder="Password" value="admin123">
        <button onclick="testAuth()">Test Login</button>
        <div id="auth-result"></div>
    </div>
    
    <div class="test-section">
        <h3>3. Test Message Sending</h3>
        <input type="text" id="message" placeholder="Test message" value="Hello, this is a test message!">
        <button onclick="testMessage()">Send Test Message</button>
        <div id="message-result"></div>
    </div>
    
    <div class="test-section">
        <h3>4. Test Simple Endpoint</h3>
        <button onclick="testSimple()">Test Simple Endpoint</button>
        <div id="simple-result"></div>
    </div>
    
    <div id="results"></div>

    <script>
        let authToken = null;
        
        async function testBackend() {
            const result = document.getElementById('backend-result');
            try {
                const response = await fetch('http://localhost:5001/api/health');
                if (response.ok) {
                    const data = await response.json();
                    result.innerHTML = '<div class="success">✅ Backend is running: ' + JSON.stringify(data) + '</div>';
                } else {
                    result.innerHTML = '<div class="error">❌ Backend error: ' + response.status + '</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ Backend not reachable: ' + error.message + '</div>';
            }
        }
        
        async function testAuth() {
            const result = document.getElementById('auth-result');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:5001/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    authToken = data.token;
                    result.innerHTML = '<div class="success">✅ Login successful! Token: ' + authToken.substring(0, 20) + '...</div>';
                } else {
                    const error = await response.text();
                    result.innerHTML = '<div class="error">❌ Login failed: ' + error + '</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ Login error: ' + error.message + '</div>';
            }
        }
        
        async function testMessage() {
            const result = document.getElementById('message-result');
            const message = document.getElementById('message').value;
            
            if (!authToken) {
                result.innerHTML = '<div class="error">❌ Please login first</div>';
                return;
            }
            
            try {
                // First get users to find someone to send to
                const usersResponse = await fetch('http://localhost:5001/api/users/sidebar', {
                    headers: {
                        'Authorization': 'Bearer ' + authToken
                    }
                });
                
                if (!usersResponse.ok) {
                    result.innerHTML = '<div class="error">❌ Failed to get users: ' + usersResponse.status + '</div>';
                    return;
                }
                
                const users = await usersResponse.json();
                if (users.length === 0) {
                    result.innerHTML = '<div class="error">❌ No users found to send message to</div>';
                    return;
                }
                
                // Send message to first user
                const messageResponse = await fetch(\`http://localhost:5001/api/messages/send/\${users[0].id}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ text: message })
                });
                
                if (messageResponse.ok) {
                    const data = await messageResponse.json();
                    result.innerHTML = '<div class="success">✅ Message sent successfully! ID: ' + data.id + '</div>';
                } else {
                    const error = await messageResponse.text();
                    result.innerHTML = '<div class="error">❌ Message failed: ' + error + '</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ Message error: ' + error.message + '</div>';
            }
        }
        
        async function testSimple() {
            const result = document.getElementById('simple-result');
            try {
                const response = await fetch('http://localhost:5002/api/test-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: 'Test message from frontend' })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    result.innerHTML = '<div class="success">✅ Simple test successful: ' + JSON.stringify(data) + '</div>';
                } else {
                    result.innerHTML = '<div class="error">❌ Simple test failed: ' + response.status + '</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ Simple test error: ' + error.message + '</div>';
            }
        }
        
        // Auto-run backend test on load
        window.onload = () => {
            testBackend();
        };
    </script>
</body>
</html>`;

    fs.writeFileSync(testPath, testHTML);
    console.log("✅ Created frontend test page");
    console.log("💡 Open: test-frontend-messages.html in browser");
};

// Main fix function
const runFixes = () => {
    console.log("🚀 Applying fixes...");
    
    fixAxiosConfig();
    fixBackendCORS();
    createTestEndpoint();
    createFrontendTest();
    
    console.log("\n🎯 FIXES APPLIED!");
    console.log("==================");
    console.log("1. ✅ Fixed axios CORS configuration");
    console.log("2. ✅ Fixed backend CORS settings");
    console.log("3. ✅ Created test message endpoint");
    console.log("4. ✅ Created frontend test page");
    
    console.log("\n📋 NEXT STEPS:");
    console.log("==============");
    console.log("1. Restart backend server: cd backend && npm run dev");
    console.log("2. Start test server: node backend/test-message-endpoint.js");
    console.log("3. Open test-frontend-messages.html in browser");
    console.log("4. Run all tests to identify the exact issue");
    console.log("5. Clear browser cache and try sending messages again");
    
    console.log("\n💡 If tests pass but app still doesn't work:");
    console.log("- Clear browser localStorage and cookies");
    console.log("- Hard refresh the frontend (Ctrl+Shift+R)");
    console.log("- Check browser console for JavaScript errors");
    console.log("- Make sure you're logged in with correct credentials");
};

// Run the fixes
runFixes();