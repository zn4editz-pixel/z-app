// MongoDB to PostgreSQL Migration Script
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Import MongoDB models
import User from '../src/models/user.model.js';
import Message from '../src/models/message.model.js';
import FriendRequest from '../src/models/friendRequest.model.js';
import Report from '../src/models/report.model.js';
import AdminNotification from '../src/models/adminNotification.model.js';

async function migrateUsers() {
  console.log('📦 Migrating users...');
  const users = await User.find({}).lean();
  
  for (const user of users) {
    try {
      await prisma.user.create({
        data: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          nickname: user.nickname || null,
          bio: user.bio || null,
          password: user.password,
          profilePic: user.profilePic || null,
          hasCompletedProfile: user.hasCompletedProfile || false,
          isVerified: user.isVerified || false,
          isBlocked: user.isBlocked || false,
          isSuspended: user.isSuspended || false,
          country: user.country || null,
          countryCode: user.countryCode || null,
          city: user.city || null,
          region: user.region || null,
          timezone: user.timezone || null,
          isVPN: user.isVPN || false,
          lastIP: user.lastIP || null,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || null,
          verificationStatus: user.verificationRequest?.status || 'none',
          verificationReason: user.verificationRequest?.reason || null,
          verificationIdProof: user.verificationRequest?.idProof || null,
          verificationRequestedAt: user.verificationRequest?.requestedAt || null,
          verificationReviewedAt: user.verificationRequest?.reviewedAt || null,
          verificationReviewedBy: user.verificationRequest?.reviewedBy?.toString() || null,
          verificationAdminNote: user.verificationRequest?.adminNote || null,
          friends: user.friends?.map(id => id.toString()) || [],
          friendRequestsSent: user.friendRequestsSent?.map(id => id.toString()) || [],
          friendRequestsReceived: user.friendRequestsReceived?.map(id => id.toString()) || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error(`Error migrating user ${user.username}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateMessages() {
  console.log('📦 Migrating messages...');
  const messages = await Message.find({}).lean();
  
  for (const msg of messages) {
    try {
      await prisma.message.create({
        data: {
          id: msg._id.toString(),
          text: msg.text || null,
          image: msg.image || null,
          voice: msg.voice || null,
          voiceDuration: msg.voiceDuration || null,
          senderId: msg.senderId.toString(),
          receiverId: msg.receiverId.toString(),
          isCallLog: msg.isCallLog || false,
          callType: msg.callType || null,
          callDuration: msg.callDuration || null,
          callStatus: msg.callStatus || null,
          callInitiator: msg.callInitiator?.toString() || null,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        },
      });
    } catch (error) {
      console.error(`Error migrating message ${msg._id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${messages.length} messages`);
}

async function migrateFriendRequests() {
  console.log('📦 Migrating friend requests...');
  const requests = await FriendRequest.find({}).lean();
  
  for (const req of requests) {
    try {
      await prisma.friendRequest.create({
        data: {
          id: req._id.toString(),
          senderId: req.sender.toString(),
          receiverId: req.receiver.toString(),
          createdAt: req.createdAt,
        },
      });
    } catch (error) {
      console.error(`Error migrating friend request ${req._id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${requests.length} friend requests`);
}

async function migrateReports() {
  console.log('📦 Migrating reports...');
  const reports = await Report.find({}).lean();
  
  for (const report of reports) {
    try {
      await prisma.report.create({
        data: {
          id: report._id.toString(),
          reporterId: report.reporter.toString(),
          reportedUserId: report.reportedUser.toString(),
          reason: report.reason,
          description: report.description || null,
          status: report.status || 'pending',
          aiAnalysis: report.aiAnalysis || null,
          severity: report.severity || null,
          category: report.category || null,
          reviewedBy: report.reviewedBy?.toString() || null,
          reviewedAt: report.reviewedAt || null,
          adminNotes: report.adminNotes || null,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      });
    } catch (error) {
      console.error(`Error migrating report ${report._id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${reports.length} reports`);
}

async function migrateAdminNotifications() {
  console.log('📦 Migrating admin notifications...');
  const notifications = await AdminNotification.find({}).lean();
  
  for (const notif of notifications) {
    try {
      await prisma.adminNotification.create({
        data: {
          id: notif._id.toString(),
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead || false,
          link: notif.link || null,
          metadata: notif.metadata || null,
          createdAt: notif.createdAt,
        },
      });
    } catch (error) {
      console.error(`Error migrating notification ${notif._id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${notifications.length} admin notifications`);
}

async function main() {
  try {
    console.log('🚀 Starting migration from MongoDB to PostgreSQL...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Run migrations in order
    await migrateUsers();
    await migrateFriendRequests();
    await migrateMessages();
    await migrateReports();
    await migrateAdminNotifications();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Messages: ${await prisma.message.count()}`);
    console.log(`   Friend Requests: ${await prisma.friendRequest.count()}`);
    console.log(`   Reports: ${await prisma.report.count()}`);
    console.log(`   Admin Notifications: ${await prisma.adminNotification.count()}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

main();
