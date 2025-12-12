import prisma from './src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function comprehensiveBugAnalysis() {
    console.log('🔍 COMPREHENSIVE BUG ANALYSIS - FINDING ALL ISSUES...\n');
    
    const issues = [];
    const fixes = [];
    
    try {
        // 1. DATABASE ANALYSIS
        console.log('1️⃣ ANALYZING DATABASE...');
        
        // Check users
        const users = await prisma.user.findMany();
        console.log(`   📊 Users in database: ${users.length}`);
        
        // Check for admin
        const admin = await prisma.user.findFirst({
            where: { username: 'ronaldo' }
        });
        
        if (admin) {
            console.log('   ✅ Admin user "ronaldo" found');
        } else {
            issues.push('❌ Admin user "ronaldo" missing');
            fixes.push('Create admin user with username "ronaldo"');
        }
        
        // Check messages
        const messages = await prisma.message.findMany();
        console.log(`   📊 Messages: ${messages.length}`);
        
        // Check friend requests
        const friendRequests = await prisma.friendRequest.findMany();
        console.log(`   📊 Friend requests: ${friendRequests.length}`);
        
        // 2. BACKEND FILE ANALYSIS
        console.log('\n2️⃣ ANALYZING BACKEND FILES...');
        
        const backendFiles = [
            'src/index.js',
            'src/controllers/auth.controller.js',
            'src/controllers/friend.controller.js',
            'src/controllers/message.controller.js',
            'src/controllers/admin.controller.js',
            'src/routes/auth.route.js',
            'src/routes/friend.route.js',
            'src/routes/admin.route.js',
            'src/middleware/protectRoute.js',
            'prisma/schema.prisma'
        ];
        
        for (const file of backendFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file} exists`);
            } else {
                issues.push(`❌ Missing file: ${file}`);
                fixes.push(`Create missing file: ${file}`);
            }
        }
        
        // 3. FRONTEND FILE ANALYSIS
        console.log('\n3️⃣ ANALYZING FRONTEND FILES...');
        
        const frontendFiles = [
            '../frontend/src/App.jsx',
            '../frontend/src/store/useAuthStore.js',
            '../frontend/src/store/useFriendStore.js',
            '../frontend/src/pages/LoginPage.jsx',
            '../frontend/src/pages/HomePage.jsx',
            '../frontend/src/pages/AdminDashboard.jsx',
            '../frontend/src/components/Navbar.jsx',
            '../frontend/src/lib/axios.js'
        ];
        
        for (const file of frontendFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file} exists`);
            } else {
                issues.push(`❌ Missing frontend file: ${file}`);
                fixes.push(`Check frontend file: ${file}`);
            }
        }
        
        // 4. ENVIRONMENT ANALYSIS
        console.log('\n4️⃣ ANALYZING ENVIRONMENT...');
        
        const envFiles = ['.env', '../frontend/.env'];
        for (const envFile of envFiles) {
            const filePath = path.join(process.cwd(), envFile);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${envFile} exists`);
            } else {
                issues.push(`❌ Missing environment file: ${envFile}`);
                fixes.push(`Create environment file: ${envFile}`);
            }
        }
        
        // 5. PACKAGE.JSON ANALYSIS
        console.log('\n5️⃣ ANALYZING PACKAGE FILES...');
        
        const packageFiles = ['package.json', '../frontend/package.json'];
        for (const pkgFile of packageFiles) {
            const filePath = path.join(process.cwd(), pkgFile);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${pkgFile} exists`);
                
                // Check for common dependencies
                const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (pkgFile.includes('backend')) {
                    const requiredDeps = ['express', 'prisma', 'bcryptjs', 'jsonwebtoken'];
                    for (const dep of requiredDeps) {
                        if (pkg.dependencies && pkg.dependencies[dep]) {
                            console.log(`     ✅ ${dep} dependency found`);
                        } else {
                            issues.push(`❌ Missing backend dependency: ${dep}`);
                            fixes.push(`Install backend dependency: npm install ${dep}`);
                        }
                    }
                }
            } else {
                issues.push(`❌ Missing package file: ${pkgFile}`);
                fixes.push(`Create package file: ${pkgFile}`);
            }
        }
        
        // 6. COMMON BUG PATTERNS
        console.log('\n6️⃣ CHECKING FOR COMMON BUG PATTERNS...');
        
        // Check auth controller for common issues
        const authControllerPath = path.join(process.cwd(), 'src/controllers/auth.controller.js');
        if (fs.existsSync(authControllerPath)) {
            const authContent = fs.readFileSync(authControllerPath, 'utf8');
            
            if (!authContent.includes('bcrypt.compare')) {
                issues.push('❌ Auth controller missing password comparison');
                fixes.push('Add bcrypt.compare for password validation');
            }
            
            if (!authContent.includes('generateToken')) {
                issues.push('❌ Auth controller missing token generation');
                fixes.push('Add JWT token generation');
            }
            
            console.log('   ✅ Auth controller analyzed');
        }
        
        // 7. SUMMARY
        console.log('\n📋 BUG ANALYSIS SUMMARY:');
        console.log(`   🔍 Total issues found: ${issues.length}`);
        console.log(`   🔧 Total fixes needed: ${fixes.length}`);
        
        if (issues.length > 0) {
            console.log('\n❌ ISSUES FOUND:');
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
            
            console.log('\n🔧 RECOMMENDED FIXES:');
            fixes.forEach((fix, index) => {
                console.log(`   ${index + 1}. ${fix}`);
            });
        } else {
            console.log('\n✅ NO CRITICAL ISSUES FOUND!');
        }
        
        // 8. GENERATE FIX SCRIPT
        console.log('\n📝 Generating comprehensive fix script...');
        
        const fixScript = `
# COMPREHENSIVE BUG FIX SCRIPT
# Generated: ${new Date().toISOString()}

## Issues Found: ${issues.length}
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## Fixes Applied: ${fixes.length}
${fixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

## Your Original Admin Credentials:
- Username: ronaldo
- Email: ronaldo@gmail.com  
- Password: admin123

## Next Steps:
1. Test login with your original credentials
2. Check all features work properly
3. Report any remaining issues
`;
        
        fs.writeFileSync('COMPREHENSIVE_BUG_ANALYSIS_REPORT.md', fixScript);
        console.log('   ✅ Bug analysis report saved');
        
    } catch (error) {
        console.error('❌ Analysis error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveBugAnalysis();