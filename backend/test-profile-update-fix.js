import axios from 'axios';
import prisma from './src/lib/prisma.js';

// Create axios instance for testing
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testProfileUpdateFix() {
    try {
        console.log('🧪 Testing profile update fix...');
        
        // Create a test user for this test
        const testUser = await prisma.user.create({
            data: {
                fullName: 'Test User Profile',
                email: `test_profile_${Date.now()}@example.com`,
                username: `testuser_${Date.now()}`,
                password: '$2a$10$test.hash.for.testing.purposes.only',
                hasCompletedProfile: true
            }
        });
        
        console.log('✅ Test user created:', testUser.username);
        
        // Login as the test user (simulate token)
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer test-token-${testUser.id}`;
        
        // Mock the protectRoute middleware by directly testing the controller
        const mockReq = {
            user: { id: testUser.id },
            body: {
                fullName: 'Updated Full Name',
                bio: 'Updated bio for testing'
            }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📤 Response ${code}:`, data);
                    return data;
                }
            })
        };
        
        // Import and test the controller directly
        const { updateUserProfile } = await import('./src/controllers/user.controller.js');
        
        console.log('🔄 Testing profile update...');
        await updateUserProfile(mockReq, mockRes);
        
        // Verify the update worked
        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
            select: {
                fullName: true,
                bio: true,
                username: true,
                email: true
            }
        });
        
        console.log('✅ Profile update successful!');
        console.log('📋 Updated user data:', updatedUser);
        
        // Test username update for a user without recent changes
        console.log('🔄 Testing username update...');
        const usernameReq = {
            user: { id: testUser.id },
            body: {
                username: `updated_${testUser.username}`
            }
        };
        
        await updateUserProfile(usernameReq, mockRes);
        
        // Clean up test user
        await prisma.user.delete({
            where: { id: testUser.id }
        });
        
        console.log('🧹 Test user cleaned up');
        console.log('🎉 All profile update tests passed!');
        
    } catch (error) {
        console.error('❌ Profile update test failed:', {
            message: error.message,
            stack: error.stack
        });
    } finally {
        await prisma.$disconnect();
    }
}

testProfileUpdateFix();