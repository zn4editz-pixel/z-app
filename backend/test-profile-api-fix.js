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

async function testProfileAPIFix() {
    try {
        console.log('🧪 Testing profile update API fix...');
        
        // Create a test user for this test
        const testUser = await prisma.user.create({
            data: {
                fullName: 'API Test User',
                email: `api_test_${Date.now()}@example.com`,
                username: `apitest_${Date.now()}`,
                password: '$2a$10$test.hash.for.testing.purposes.only',
                hasCompletedProfile: true
            }
        });
        
        console.log('✅ Test user created:', testUser.username);
        
        // Login as admin to get a valid token
        const loginRes = await axiosInstance.post('/auth/login', {
            emailOrUsername: 'z4fwan77@gmail.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('✅ Admin login successful');
        
        // Test updating full name and bio (should work)
        console.log('🔄 Testing full name and bio update...');
        const updateRes = await axiosInstance.put('/users/me', {
            fullName: 'Updated Admin Name',
            bio: 'Updated admin bio'
        });
        
        console.log('✅ Profile update successful!');
        console.log('📋 Updated profile:', {
            fullName: updateRes.data.fullName,
            bio: updateRes.data.bio,
            username: updateRes.data.username
        });
        
        // Clean up test user
        await prisma.user.delete({
            where: { id: testUser.id }
        });
        
        console.log('🧹 Test user cleaned up');
        console.log('🎉 Profile API update test passed!');
        
    } catch (error) {
        console.error('❌ Profile API test failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.response?.data?.error || error.message,
            data: error.response?.data
        });
    } finally {
        await prisma.$disconnect();
    }
}

testProfileAPIFix();