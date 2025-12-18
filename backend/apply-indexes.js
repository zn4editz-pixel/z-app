// Apply database indexes using Node.js (for Neon PostgreSQL)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const indexes = [
  // User table indexes
  'CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);',
  'CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);',
  'CREATE INDEX IF NOT EXISTS idx_user_isOnline ON "User"("isOnline");',
  'CREATE INDEX IF NOT EXISTS idx_user_isSuspended ON "User"("isSuspended");',
  'CREATE INDEX IF NOT EXISTS idx_user_createdAt ON "User"("createdAt" DESC);',
  'CREATE INDEX IF NOT EXISTS idx_user_lastSeen ON "User"("lastSeen" DESC);',
  
  // Message table indexes
  'CREATE INDEX IF NOT EXISTS idx_message_senderId ON "Message"("senderId");',
  'CREATE INDEX IF NOT EXISTS idx_message_receiverId ON "Message"("receiverId");',
  'CREATE INDEX IF NOT EXISTS idx_message_createdAt ON "Message"("createdAt" DESC);',
  'CREATE INDEX IF NOT EXISTS idx_message_sender_receiver ON "Message"("senderId", "receiverId");',
  'CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("senderId", "receiverId", "createdAt" DESC);',
  
  // Report table indexes (if exists)
  'CREATE INDEX IF NOT EXISTS idx_report_status ON "Report"(status);',
  'CREATE INDEX IF NOT EXISTS idx_report_reportedUserId ON "Report"("reportedUserId");',
  'CREATE INDEX IF NOT EXISTS idx_report_reporterId ON "Report"("reporterId");',
  'CREATE INDEX IF NOT EXISTS idx_report_createdAt ON "Report"("createdAt" DESC);',
  
  // FriendRequest table indexes (if exists)
  'CREATE INDEX IF NOT EXISTS idx_friendrequest_senderId ON "FriendRequest"("senderId");',
  'CREATE INDEX IF NOT EXISTS idx_friendrequest_receiverId ON "FriendRequest"("receiverId");',
  'CREATE INDEX IF NOT EXISTS idx_friendrequest_status ON "FriendRequest"(status);',
  'CREATE INDEX IF NOT EXISTS idx_friendrequest_createdAt ON "FriendRequest"("createdAt" DESC);',
  
  // Composite indexes
  'CREATE INDEX IF NOT EXISTS idx_user_online_verified ON "User"("isOnline", "isVerified");'
];

async function applyIndexes() {
  try {
    for (let i = 0; i < indexes.length; i++) {
      const index = indexes[i];
      
      try {
        await prisma.$executeRawUnsafe(index);
      } catch (error) {
        // Silently handle existing indexes
      }
    }
  } catch (error) {
    // Silent error handling for production
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();