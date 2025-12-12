#!/usr/bin/env node

/**
 * COMPREHENSIVE PROJECT ANALYSIS
 * Deep dive into the entire project to identify message sending issues
 */

import fs from 'fs';
import path from 'path';

console.log("🔍 COMPREHENSIVE PROJECT ANALYSIS");
console.log("==================================");
console.log("Analyzing entire project structure to identify message sending issues...\n");

// Analysis results
const analysis = {
    backend: {
        server: null,
        routes: null,
        controllers: null,
        middleware: null,
        database: null,
        socket: null
    },
    frontend: {
        components: null,
        stores: null,
        config: null,
        routing: null
    },
    issues: [],
    recommendations: []
};

// 1. Analyze Backend Structure
const analyzeBackend = () => {
    console.log("1️⃣ ANALYZING BACKEND STRUCTURE");
    console.log("==============================");
    
    // Check main server file
    const serverPath = path.join(process.cwd(), 'backend', 'src', 'index.js');
    if (fs.existsSync(serverPath)) {
        const content = fs.readFileSync(serverPath, 'utf8');
        
        // Check for critical components
        analysis.backend.server = {
            exists: true,
            hasExpress: content.includes('express'),
            hasCors: content.includes('cors'),
            hasSocket: content.includes('socket.io'),
            hasRoutes: content.includes('/api/'),
            hasErrorHandler: content.includes('errorHandler'),
            port: content.match(/PORT.*?(\d+)/)?.[1] || 'unknown'
        };
        
        console.log("✅ Backend server file found");
        console.log(`   - Express: ${analysis.backend.server.hasExpress ? '✅' : '❌'}`);
        console.log(`   - CORS: ${analysis.backend.server.hasCors ? '✅' : '❌'}`);
        console.log(`   - Socket.IO: ${analysis.backend.server.hasSocket ? '✅' : '❌'}`);
        console.log(`   - Routes: ${analysis.backend.server.hasRoutes ? '✅' : '❌'}`);
        console.log(`   - Port: ${analysis.backend.server.port}`);
    } else {
        analysis.backend.server = { exists: false };
        analysis.issues.push("❌ Backend server file not found");
        console.log("❌ Backend server file not found");
    }
    
    // Check message routes
    const messageRoutePath = path.join(process.cwd(), 'backend', 'src', 'routes', 'message.route.js');
    if (fs.existsSync(messageRoutePath)) {
        const content = fs.readFileSync(messageRoutePath, 'utf8');
        analysis.backend.routes = {
            exists: true,
            hasSendRoute: content.includes('/send/'),
            hasGetRoute: content.includes('/:id'),
            hasAuth: content.includes('protectRoute')
        };
        console.log("✅ Message routes found");
        console.log(`   - Send route: ${analysis.backend.routes.hasSendRoute ? '✅' : '❌'}`);
        console.log(`   - Get route: ${analysis.backend.routes.hasGetRoute ? '✅' : '❌'}`);
        console.log(`   - Auth protection: ${analysis.backend.routes.hasAuth ? '✅' : '❌'}`);
    } else {
        analysis.backend.routes = { exists: false };
        analysis.issues.push("❌ Message routes not found");
        console.log("❌ Message routes not found");
    }
    
    // Check message controller
    const messageControllerPath = path.join(process.cwd(), 'backend', 'src', 'controllers', 'message.controller.js');
    if (fs.existsExists(messageControllerPath)) {
        const content = fs.readFileSync(messageControllerPath, 'utf8');
        analysis.backend.controllers = {
            exists: true,
            hasSendMessage: content.includes('sendMessage'),
            hasGetMessages: content.includes('getMessages'),
            hasPrisma: content.includes('prisma'),
            hasErrorHandling: content.includes('try') && content.includes('catch')
        };
        console.log("✅ Message controller found");
        console.log(`   - Send function: ${analysis.backend.controllers.hasSendMessage ? '✅' : '❌'}`);
        console.log(`   - Get function: ${analysis.backend.controllers.hasGetMessages ? '✅' : '❌'}`);
        console.log(`   - Database: ${analysis.backend.controllers.hasPrisma ? '✅' : '❌'}`);
        console.log(`   - Error handling: ${analysis.backend.controllers.hasErrorHandling ? '✅' : '❌'}`);
    } else {
        analysis.backend.controllers = { exists: false };
        analysis.issues.push("❌ Message controller not found");
        console.log("❌ Message controller not found");
    }
    
    console.log("");
};

// 2. Analyze Frontend Structure
const analyzeFrontend = () => {
    console.log("2️⃣ ANALYZING FRONTEND STRUCTURE");
    console.log("===============================");
    
    // Check axios configuration
    const axiosPath = path.join(process.cwd(), 'frontend', 'src', 'lib', 'axios.js');
    if (fs.existsSync(axiosPath)) {
        const content = fs.readFileSync(axiosPath, 'utf8');
        analysis.frontend.config = {
            exists: true,
            hasBaseURL: content.includes('baseURL'),
            hasAuth: content.includes('Authorization'),
            hasInterceptors: content.includes('interceptors'),
            baseURL: content.match(/baseURL.*?["'](.*?)["']/)?.[1] || 'unknown'
        };
        console.log("✅ Axios configuration found");
        console.log(`   - Base URL: ${analysis.frontend.config.baseURL}`);
        console.log(`   - Auth headers: ${analysis.frontend.config.hasAuth ? '✅' : '❌'}`);
        console.log(`   - Interceptors: ${analysis.frontend.config.hasInterceptors ? '✅' : '❌'}`);
    } else {
        analysis.frontend.config = { exists: false };
        analysis.issues.push("❌ Axios configuration not found");
        console.log("❌ Axios configuration not found");
    }
    
    // Check chat store
    const chatStorePath = path.join(process.cwd(), 'frontend', 'src', 'store', 'useChatStore.js');
    if (fs.existsSync(chatStorePath)) {
        const content = fs.readFileSync(chatStorePath, 'utf8');
        analysis.frontend.stores = {
            exists: true,
            hasSendMessage: content.includes('sendMessage'),
            hasSocket: content.includes('socket'),
            hasOptimistic: content.includes('optimistic'),
            hasErrorHandling: content.includes('catch')
        };
        console.log("✅ Chat store found");
        console.log(`   - Send function: ${analysis.frontend.stores.hasSendMessage ? '✅' : '❌'}`);
        console.log(`   - Socket integration: ${analysis.frontend.stores.hasSocket ? '✅' : '❌'}`);
        console.log(`   - Optimistic updates: ${analysis.frontend.stores.hasOptimistic ? '✅' : '❌'}`);
        console.log(`   - Error handling: ${analysis.frontend.stores.hasErrorHandling ? '✅' : '❌'}`);
    } else {
        analysis.frontend.stores = { exists: false };
        analysis.issues.push("❌ Chat store not found");
        console.log("❌ Chat store not found");
    }
    
    // Check message input component
    const messageInputPath = path.join(process.cwd(), 'frontend', 'src', 'components', 'MessageInput.jsx');
    if (fs.existsSync(messageInputPath)) {
        const content = fs.readFileSync(messageInputPath, 'utf8');
        analysis.frontend.components = {
            exists: true,
            hasSubmit: content.includes('handleSendMessage'),
            hasValidation: content.includes('trim()'),
            hasStore: content.includes('useChatStore')
        };
        console.log("✅ Message input component found");
        console.log(`   - Submit handler: ${analysis.frontend.components.hasSubmit ? '✅' : '❌'}`);
        console.log(`   - Validation: ${analysis.frontend.components.hasValidation ? '✅' : '❌'}`);
        console.log(`   - Store integration: ${analysis.frontend.components.hasStore ? '✅' : '❌'}`);
    } else {
        analysis.frontend.components = { exists: false };
        analysis.issues.push("❌ Message input component not found");
        console.log("❌ Message input component not found");
    }
    
    console.log("");
};

// 3. Check Environment Configuration
const checkEnvironment = () => {
    console.log("3️⃣ CHECKING ENVIRONMENT CONFIGURATION");
    console.log("=====================================");
    
    // Check backend .env
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
        const content = fs.readFileSync(backendEnvPath, 'utf8');
        console.log("✅ Backend .env found");
        console.log(`   - JWT_SECRET: ${content.includes('JWT_SECRET') ? '✅' : '❌'}`);
        console.log(`   - DATABASE_URL: ${content.includes('DATABASE_URL') ? '✅' : '❌'}`);
        console.log(`   - PORT: ${content.includes('PORT') ? '✅' : '❌'}`);
    } else {
        analysis.issues.push("❌ Backend .env not found");
        console.log("❌ Backend .env not found");
    }
    
    // Check frontend .env
    const frontendEnvPath = path.join(process.cwd(), 'frontend', '.env');
    if (fs.existsSync(frontendEnvPath)) {
        const content = fs.readFileSync(frontendEnvPath, 'utf8');
        console.log("✅ Frontend .env found");
        console.log(`   - VITE_API_BASE_URL: ${content.includes('VITE_API_BASE_URL') ? '✅' : '❌'}`);
        
        const apiUrl = content.match(/VITE_API_BASE_URL=(.+)/)?.[1];
        if (apiUrl) {
            console.log(`   - API URL: ${apiUrl}`);
        }
    } else {
        analysis.issues.push("❌ Frontend .env not found");
        console.log("❌ Frontend .env not found");
    }
    
    console.log("");
};

// 4. Identify Common Issues
const identifyIssues = () => {
    console.log("4️⃣ IDENTIFYING COMMON ISSUES");
    console.log("============================");
    
    // Check for common problems
    const commonIssues = [
        {
            check: () => !analysis.backend.server?.exists,
            issue: "Backend server not configured",
            fix: "Set up backend/src/index.js with Express server"
        },
        {
            check: () => !analysis.backend.routes?.hasSendRoute,
            issue: "Message send route missing",
            fix: "Add POST /api/messages/send/:id route"
        },
        {
            check: () => !analysis.backend.controllers?.hasSendMessage,
            issue: "Send message controller missing",
            fix: "Implement sendMessage function in message controller"
        },
        {
            check: () => !analysis.frontend.config?.hasBaseURL,
            issue: "Frontend API URL not configured",
            fix: "Set VITE_API_BASE_URL in frontend/.env"
        },
        {
            check: () => !analysis.frontend.stores?.hasSendMessage,
            issue: "Frontend send message function missing",
            fix: "Implement sendMessage in chat store"
        },
        {
            check: () => analysis.frontend.config?.baseURL?.includes('localhost:5001') && !analysis.backend.server?.port?.includes('5001'),
            issue: "Port mismatch between frontend and backend",
            fix: "Ensure backend runs on port 5001 or update frontend config"
        }
    ];
    
    commonIssues.forEach(({ check, issue, fix }) => {
        if (check()) {
            analysis.issues.push(`❌ ${issue}`);
            analysis.recommendations.push(`🔧 ${fix}`);
            console.log(`❌ ${issue}`);
            console.log(`   Fix: ${fix}`);
        }
    });
    
    if (analysis.issues.length === 0) {
        console.log("✅ No obvious configuration issues found");
    }
    
    console.log("");
};

// 5. Generate Recommendations
const generateRecommendations = () => {
    console.log("5️⃣ RECOMMENDATIONS");
    console.log("==================");
    
    if (analysis.issues.length > 0) {
        console.log("🚨 CRITICAL ISSUES FOUND:");
        analysis.issues.forEach(issue => console.log(`   ${issue}`));
        console.log("");
        
        console.log("🔧 RECOMMENDED FIXES:");
        analysis.recommendations.forEach(rec => console.log(`   ${rec}`));
        console.log("");
    }
    
    // Always recommend these steps
    console.log("📋 SYSTEMATIC DEBUGGING STEPS:");
    console.log("1. Verify backend server is running on correct port");
    console.log("2. Test API endpoints directly with curl/Postman");
    console.log("3. Check browser console for JavaScript errors");
    console.log("4. Verify authentication tokens are valid");
    console.log("5. Test with minimal message (text only)");
    console.log("6. Check database connectivity");
    console.log("7. Verify socket.io connection");
    console.log("");
    
    console.log("🧪 IMMEDIATE TESTS TO RUN:");
    console.log("1. curl http://localhost:5001/api/health");
    console.log("2. Check browser Network tab for failed requests");
    console.log("3. Test login and check localStorage for token");
    console.log("4. Try sending message and watch backend logs");
    console.log("");
};

// Main analysis function
const runAnalysis = () => {
    try {
        analyzeBackend();
        analyzeFrontend();
        checkEnvironment();
        identifyIssues();
        generateRecommendations();
        
        console.log("📊 ANALYSIS COMPLETE");
        console.log("===================");
        
        if (analysis.issues.length === 0) {
            console.log("🎉 Project structure appears correct!");
            console.log("The issue might be runtime-related:");
            console.log("- Backend server not running");
            console.log("- Database connection issues");
            console.log("- Authentication problems");
            console.log("- Network/CORS issues");
        } else {
            console.log(`❌ Found ${analysis.issues.length} structural issues`);
            console.log("Fix these issues first, then test message sending");
        }
        
    } catch (error) {
        console.error("❌ Analysis failed:", error.message);
    }
};

// Run the analysis
runAnalysis();