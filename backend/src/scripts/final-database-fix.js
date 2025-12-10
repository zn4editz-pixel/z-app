import prisma from '../lib/prisma.js';

async function finalDatabaseFix() {
	console.log('🔧 FINAL DATABASE FIX & OPTIMIZATION...');
	
	try {
		// 1. Get current stats
		const initialStats = await getDatabaseStats();
		console.log('\n📊 INITIAL DATABASE STATUS:');
		console.log(`   Users: ${initialStats.users}`);
		console.log(`   Messages: ${initialStats.messages}`);
		console.log(`   Pending Reports: ${initialStats.pendingReports}`);
		console.log(`   Total Reports: ${initialStats.totalReports}`);
		
		// 2. Process pending reports intelligently
		console.log('\n📋 Processing pending reports...');
		const pendingReports = await prisma.report.findMany({
			where: { status: 'pending' },
			orderBy: { createdAt: 'asc' }
		});
		
		let processed = 0;
		for (const report of pendingReports) {
			// Auto-resolve reports with insufficient information
			if (!report.description || report.description.length < 15) {
				await prisma.report.update({
					where: { id: report.id },
					data: {
						status: 'resolved',
						actionTaken: 'Auto-resolved: Insufficient information provided',
						reviewedAt: new Date(),
						reviewedBy: 'system'
					}
				});
				processed++;
			}
			// Auto-resolve duplicate spam reports
			else if (report.reason?.toLowerCase().includes('spam') && 
					 report.description?.toLowerCase().includes('test')) {
				await prisma.report.update({
					where: { id: report.id },
					data: {
						status: 'resolved',
						actionTaken: 'Auto-resolved: Test/spam report',
						reviewedAt: new Date(),
						reviewedBy: 'system'
					}
				});
				processed++;
			}
		}
		
		console.log(`✅ Auto-processed ${processed} reports`);
		
		// 3. Clean up old data
		console.log('\n🧹 Cleaning up old data...');
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		
		// Delete old resolved reports
		const deletedReports = await prisma.report.deleteMany({
			where: {
				status: { in: ['resolved', 'dismissed'] },
				createdAt: { lt: sevenDaysAgo }
			}
		});
		
		// Delete old rejected friend requests
		const deletedRequests = await prisma.friendRequest.deleteMany({
			where: {
				status: 'rejected',
				createdAt: { lt: thirtyDaysAgo }
			}
		});
		
		console.log(`✅ Deleted ${deletedReports.count} old resolved reports`);
		console.log(`✅ Deleted ${deletedRequests.count} old rejected friend requests`);
		
		// 4. Optimize database
		console.log('\n⚡ Optimizing database performance...');
		try {
			// Run VACUUM to reclaim space and update statistics
			await prisma.$executeRaw`VACUUM ANALYZE;`;
			console.log('✅ Database vacuum completed');
		} catch (e) {
			console.log('⚠️ Vacuum not supported on this database type');
		}
		
		// 5. Get final stats
		const finalStats = await getDatabaseStats();
		console.log('\n📊 FINAL DATABASE STATUS:');
		console.log(`   Users: ${finalStats.users}`);
		console.log(`   Messages: ${finalStats.messages}`);
		console.log(`   Pending Reports: ${finalStats.pendingReports} (was ${initialStats.pendingReports})`);
		console.log(`   Total Reports: ${finalStats.totalReports}`);
		
		// 6. Create admin notification for remaining reports
		if (finalStats.pendingReports > 0) {
			await prisma.adminNotification.create({
				data: {
					type: 'report_backlog',
					title: 'Reports Require Manual Review',
					message: `${finalStats.pendingReports} user reports need admin attention. ${processed} reports were auto-processed.`,
					link: '/admin/reports'
				}
			});
			console.log(`📧 Admin notification created for ${finalStats.pendingReports} remaining reports`);
		} else {
			await prisma.adminNotification.create({
				data: {
					type: 'system_update',
					title: 'Report Backlog Cleared',
					message: `All pending reports have been processed. ${processed} reports were auto-resolved.`,
					link: '/admin/reports'
				}
			});
			console.log('🎉 All reports processed - admin notified');
		}
		
		console.log('\n✅ DATABASE OPTIMIZATION COMPLETED SUCCESSFULLY!');
		console.log(`🎯 Processed ${processed} reports automatically`);
		console.log(`🧹 Cleaned ${deletedReports.count + deletedRequests.count} old records`);
		console.log('📈 Database performance should be significantly improved');
		
		return {
			success: true,
			initialStats,
			finalStats,
			actions: {
				processedReports: processed,
				deletedReports: deletedReports.count,
				deletedRequests: deletedRequests.count
			}
		};
		
	} catch (error) {
		console.error('❌ DATABASE FIX FAILED:', error);
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
finalDatabaseFix()
	.then(result => {
		console.log('\n🎉 DATABASE FIX COMPLETED SUCCESSFULLY!');
		console.log('📊 Results:', result);
		process.exit(0);
	})
	.catch(error => {
		console.error('\n💥 DATABASE FIX FAILED:', error);
		process.exit(1);
	});