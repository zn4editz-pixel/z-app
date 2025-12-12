import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportForSupabase() {
  try {
    console.log('📊 Exporting data for Supabase migration...');

    const users = await prisma.user.findMany();
    const messages = await prisma.message.findMany();

    // Try to get other tables if they exist
    let friendRequests = [];
    let friends = [];
    let reports = [];

    try {
      friendRequests = await prisma.friendRequest.findMany();
    } catch (e) { console.log('No friendRequest table'); }

    try {
      friends = await prisma.friend.findMany();
    } catch (e) { console.log('No friend table'); }

    try {
      reports = await prisma.report.findMany();
    } catch (e) { console.log('No report table'); }

    const exportData = {
      users: users.map(user => ({
        ...user,
        id: user.id,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_seen: user.lastSeen,
        is_online: user.isOnline,
        is_verified: user.isVerified,
        profile_pic: user.profilePic,
        verification_reason: user.verificationReason,
        verification_id_proof: user.verificationIdProof,
        verification_requested_at: user.verificationRequestedAt
      })),
      messages: messages.map(msg => ({
        ...msg,
        id: msg.id,
        sender_id: msg.senderId,
        receiver_id: msg.receiverId,
        is_read: msg.isRead,
        read_at: msg.readAt,
        file_url: msg.fileUrl,
        file_name: msg.fileName,
        file_size: msg.fileSize,
        created_at: msg.createdAt,
        updated_at: msg.updatedAt
      })),
      friendRequests,
      friends,
      reports,
      exportedAt: new Date().toISOString(),
      totalRecords: users.length + messages.length + friendRequests.length + friends.length + reports.length
    };

    fs.writeFileSync('supabase-export.json', JSON.stringify(exportData, null, 2));

    console.log('✅ Export complete for Supabase!');
    console.log(`📊 Users: ${users.length}`);
    console.log(`📊 Messages: ${messages.length}`);
    console.log(`📊 Friend Requests: ${friendRequests.length}`);
    console.log(`📊 Friends: ${friends.length}`);
    console.log(`📊 Reports: ${reports.length}`);
    console.log(`📊 Total Records: ${exportData.totalRecords}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportForSupabase();