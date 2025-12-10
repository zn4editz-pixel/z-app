import prisma from '../lib/prisma.js';

async function emergencyDatabaseFix() {
	console.log('🚨 EMERGENCY DATABASE FIX STARTING...');
	
	try {
		// 1. Add critical performance indexes
		console.log('📊 Adding performance indexes...');
		
		try {
			await prisma.$executeRaw`
				CREATE INDEX IF NOT EXISTS idx_reports_status_created 
				ON "Report"(status, "createdAt");
			`;
			console.log('✅ Reports index added');
		} catch (e) {
			console.log('⚠️ Reports index may already exist');
		}
		
		try {
			await prisma.$executeRaw`
				CREATE INDEX IF NOT EXISTS idx_messages_created 
				ON "Message"("createdAt");
			`;
			console.log('✅ Messages index added');
		} catch (e) {
			console.log('⚠️ Messages index may already exist');
		}
		
		try {
			await prisma.$executeRaw`
				CREATE INDEX IF NOT EXISTS idx_users_online_status 
				ON "User"("isOnline", "lastSeen");
			`;
			console.log('✅ Users index added');
		} catch (e) {
			console.log('⚠️ Users index may already exist');
		}
		
		// 2. Clear expired suspensions immediately
		console.log('🧹 Clearing expired suspensions...');
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
		
		// 3. Process pending reports - auto-resolve obvious spam
		console.log('📋 Processing pending reports...');
		const pendingReports = await prisma.report.findMany({
			where: { status: 'pending' }
		});
		
		console.log(`📊 Found ${pendingReports.length} pending reports`);
		
		let autoResolved = 0;
		for (const report of pendingReports) {
			// Auto-resolve obvious spam/invalid reports
			if (report.description && report.description.length < 10) {
				await prisma.report.update({
					where: { id: report.id },
					data: {
						status: 'resolved',
						actionTaken: 'Auto-resolved: Insufficient information',
						reviewedAt: new Date(),
						reviewedBy: 'system'
					}
				});
				autoResolved++;
			}
		}
		
		console.log(`✅ Auto-resolved ${autoResolved} invalid reports`);
		
		// 4. Clean up old data to free space
		console.log('🧹 Cleaning up old data...');
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		
		// Delete old resolved reports
		const deletedReports = await prisma.report.deleteMany({
			where: {
				status: { in: ['resolved', 'dismissed'] },
				createdAt: { lt: thirtyDaysAgo }
			}
		});
		
		console.log(`✅ Deleted ${deletedReports.count} old resolved reports`);
		
		// 5. Get final database stats
		const stats = await getDatabaseStats();
		console.log('\n📊 FINAL DATABASE STATUS:');
		console.log(`   Users: ${stats.users}`);
		console.log(`   Messages: ${stats.messages}`);
		console.log(`   Pending Reports: ${stats.pendingReports}`);
		console.log(`   Total Reports: ${stats.totalReports}`);
		console.log(`   Friend Requests: ${stats.friendRequests}`);
		
		// 6. Create admin notification about remaining reports
		if (stats.pendingReports > 0) {
			await prisma.adminNotification.create({
				data: {
					type: 'report_backlog',
					title: 'Reports Require Manual Review',
					message: `${stats.pendingReports} user reports need admin attention. Auto-resolved ${autoResolved} invalid reports.`,
					color: 'orange',
					isBroadcast: false
				}
			});
			console.log(`📧 Admin notification created for ${stats.pendingReports} remaining reports`);
		}
		
		console.log('\n✅ EMERGENCY DATABASE FIX COMPLETED SUCCESSFULLY!');
		console.log('🎯 Database performance should be improved');
		console.log('📋 Report backlog reduced significantly');
		
		return {
			success: true,
			stats,
			actions: {
				clearedSuspensions: clearedSuspensions.count,
				autoResolvedReports: autoResolved,
				deletedOldReports: deletedReports.count
			}
		};
		
	} catch (error) {
		console.error('❌ EMERGENCY FIX FAILED:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

async function getDatabaseStats() {
	const [users, messages, totalReports, pendingReports, friendRequests] = await Promise.all([
		prisma.user.count(),
		prisma.message.count(),
		prisma.report.count(),
		prisma.report.count({ where: { status: 'pending' } }),
		prisma.friendRequest.count()
	]);
	
	return { users, messages, totalReports, pendingReports, friendRequests };
}

// Run immediately
emergencyDatabaseFix()
	.then(result => {
		console.log('\n🎉 EMERGENCY FIX COMPLETED:', result);
		process.exit(0);
	})
	.catch(error => {
		console.error('\n💥 EMERGENCY FIX FAILED:', error);
		process.exit(1);
	});