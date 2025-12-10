import prisma from '../lib/prisma.js';

async function fixDatabaseWarning() {
	console.log('🔧 Starting database warning fix...');
	
	try {
		// 1. Add performance indexes
		console.log('📊 Adding performance indexes...');
		
		await prisma.$executeRaw`
			CREATE INDEX IF NOT EXISTS idx_reports_status_created 
			ON "Report"(status, "createdAt");
		`;
		
		await prisma.$executeRaw`
			CREATE INDEX IF NOT EXISTS idx_messages_created 
			ON "Message"("createdAt");
		`;
		
		await prisma.$executeRaw`
			CREATE INDEX IF NOT EXISTS idx_users_online_status 
			ON "User"("isOnline", "lastSeen");
		`;
		
		await prisma.$executeRaw`
			CREATE INDEX IF NOT EXISTS idx_friend_requests_status 
			ON "FriendRequest"(status, "createdAt");
		`;
		
		console.log('✅ Performance indexes added');
		
		// 2. Clean up old data
		console.log('🧹 Cleaning up old data...');
		
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		
		// Delete old resolved reports
		const deletedReports = await prisma.report.deleteMany({
			where: {
				status: { in: ['resolved', 'dismissed'] },
				createdAt: { lt: thirtyDaysAgo }
			}
		});
		
		// Delete old messages
		const deletedMessages = await prisma.message.deleteMany({
			where: {
				createdAt: { lt: thirtyDaysAgo }
			}
		});
		
		console.log(`✅ Deleted ${deletedReports.count} old reports`);
		console.log(`✅ Deleted ${deletedMessages.count} old messages`);
		
		// 3. Clear expired suspensions
		const now = new Date();
		const clearedSuspensions = await prisma.user.updateMany({
			where: {
				isSuspended: true,
				suspensionEndTime: { lt: now }
			},
			data: {
				isSuspended: false,
				suspensionEndTime: null,
				suspensionReason: null
			}
		});
		
		console.log(`✅ Cleared ${clearedSuspensions.count} expired suspensions`);
		
		// 4. Get current database stats
		const stats = await getDatabaseStats();
		console.log('\n📊 Current Database Status:');
		console.log(`   Users: ${stats.users}`);
		console.log(`   Messages: ${stats.messages}`);
		console.log(`   Pending Reports: ${stats.pendingReports}`);
		console.log(`   Friend Requests: ${stats.friendRequests}`);
		
		// 5. Optimize database
		console.log('\n🔧 Running database optimization...');
		await prisma.$executeRaw`VACUUM ANALYZE;`;
		console.log('✅ Database optimization completed');
		
		console.log('\n✅ Database warning fix completed successfully!');
		
		return {
			success: true,
			stats,
			cleaned: {
				reports: deletedReports.count,
				messages: deletedMessages.count,
				suspensions: clearedSuspensions.count
			}
		};
		
	} catch (error) {
		console.error('❌ Database fix error:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

async function getDatabaseStats() {
	const [users, messages, reports, pendingReports, friendRequests] = await Promise.all([
		prisma.user.count(),
		prisma.message.count(),
		prisma.report.count(),
		prisma.report.count({ where: { status: 'pending' } }),
		prisma.friendRequest.count()
	]);
	
	return { users, messages, reports, pendingReports, friendRequests };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	fixDatabaseWarning()
		.then(result => {
			console.log('🎉 Fix completed:', result);
			process.exit(0);
		})
		.catch(error => {
			console.error('💥 Fix failed:', error);
			process.exit(1);
		});
}

export { fixDatabaseWarning };