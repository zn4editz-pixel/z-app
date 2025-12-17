#!/usr/bin/env node

/**
 * Test script for admin functions
 * Run with: node test-admin-functions.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminFunctions() {
    console.log('🧪 Testing Admin Functions...\n');

    try {
        // Test 1: Check if we can connect to database
        console.log('1️⃣ Testing database connection...');
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection successful\n');

        // Test 2: Get all users (should work)
        console.log('2️⃣ Testing getAllUsers...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                isVerified: true,
                isSuspended: true,
                isBlocked: true
            },
            take: 5
        });
        console.log(`✅ Found ${users.length} users`);
        if (users.length > 0) {
            console.log('Sample user:', users[0]);
        }
        console.log('');

        // Test 3: Check for foreign key constraints
        console.log('3️⃣ Testing foreign key relationships...');
        
        if (users.length > 0) {
            const testUserId = users[0].id;
            
            // Check messages
            const messageCount = await prisma.message.count({
                where: {
                    OR: [
                        { senderId: testUserId },
                        { receiverId: testUserId }
                    ]
                }
            });
            console.log(`📧 User ${testUserId} has ${messageCount} messages`);

            // Check friend requests
            const friendRequestCount = await prisma.friendRequest.count({
                where: {
                    OR: [
                        { senderId: testUserId },
                        { receiverId: testUserId }
                    ]
                }
            });
            console.log(`👥 User ${testUserId} has ${friendRequestCount} friend requests`);

            // Check reports
            const reportCount = await prisma.report.count({
                where: {
                    OR: [
                        { reporterId: testUserId },
                        { reportedUserId: testUserId }
                    ]
                }
            });
            console.log(`🚨 User ${testUserId} has ${reportCount} reports`);
        }
        console.log('');

        // Test 4: Test suspension logic (dry run)
        console.log('4️⃣ Testing suspension logic (dry run)...');
        const suspendUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        console.log(`✅ Suspension date calculation works: ${suspendUntilDate}`);
        console.log('');

        // Test 5: Check schema fields
        console.log('5️⃣ Checking required schema fields...');
        const schemaFields = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'User' 
            AND column_name IN ('isSuspended', 'suspensionReason', 'suspensionStartTime', 'suspensionEndTime', 'isBlocked')
            ORDER BY column_name
        `;
        console.log('Schema fields:', schemaFields);
        console.log('');

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
    } finally {
        await prisma.$disconnect();
    }
}

// Run the tests
testAdminFunctions().catch(console.error);