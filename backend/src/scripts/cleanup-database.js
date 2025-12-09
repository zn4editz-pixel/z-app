import prisma from '../lib/prisma.js';

export async function cleanupDatabase() {
	console.log('🧹 Starting database cleanup...');
	
	try {
		// 1. Delete old messages (30+ days old)
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const deletedMessages = await prisma.message.deleteMany({
			where: {
				createdAt: {
					lt: thirtyDaysAgo
				}
			}
		});
		console.log(`✅ Deleted ${deletedMessages.count} old messages (30+ days)`);
		
		// 2. Delete resolved/dismissed reports (90+ days old)
		const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
		const deletedReports = await prisma.report.deleteMany({
			where: {
				status: { in: ['resolved', 'dismissed'] },
				createdAt: {
					lt: ninetyDaysAgo
				}
			}
		});
		console.log(`✅ Deleted ${deletedReports.count} old reports (90+ days)`);
		
		// 3. Delete rejected friend requests (30+ days old)
		const deletedRequests = await prisma.friendRequest.deleteMany({
			where: {
				status: 'rejected',
				createdAt: {
					lt: thirtyDaysAgo
				}
			}
		});
		console.log(`✅ Deleted ${deletedRequests.count} rejected friend requests (30+ days)`);
		
		// 4. Clear expired suspensions
		const now = new Date();
		const clearedSuspensions = await prisma.user.updateMany({
			where: {
				isSuspended: true,
				suspensionEndTime: {
					lt: now
				}
			},
			data: {
				isSuspended: false,
				suspensionEndTime: null,
				suspensionReason: null
			}
		});
		console.log(`✅ Cleared ${clearedSuspensions.count} expired suspensions`);
		
		// 5. Delete old admin notifications (30+ days old)
		const deletedNotifications = await prisma.adminNotification.deleteMany({
			where: {
				createdAt: {
					lt: thirtyDaysAgo
				}
			}
		});
		console.log(`✅ Deleted ${deletedNotifications.count} old notifications (30+ days)`);
		
		// 6. Get database statistics
		const stats = await getDatabaseStats();
		console.log('\n📊 Database Statistics:');
		console.log(`   Users: ${stats.users}`);
		console.log(`   Messages: ${stats.messages}`);
		console.log(`   Reports: ${stats.reports}`);
		console.log(`   Friend Requests: ${stats.friendRequests}`);
		
		console.log('\n✅ Database cleanup completed successfully!');
		return {
			success: true,
			deleted: {
				messages: deletedMessages.count,
				reports: deletedReports.count,
				friendRequests: deletedRequests.count,
				suspensions: clearedSuspensions.count,
				notifications: deletedNotifications.count
			},
			stats
		};
	} catch (error) {
		console.error('❌ Cleanup error:', error);
		throw error;
	}
}

async function getDatabaseStats() {
	const [users, messages, reports, friendRequests] = await Promise.all([
		prisma.user.count(),
		prisma.message.count(),
		prisma.report.count(),
		prisma.friendRequest.count()
	]);
	
	return { users, messages, reports, friendRequests };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	cleanupDatabase()
		.then(() => {
			console.log('\n✅ Cleanup script finished');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Cleanup script failed:', error);
			process.exit(1);
		})
		.finally(() => {
			prisma.$disconnect();
		});
}
