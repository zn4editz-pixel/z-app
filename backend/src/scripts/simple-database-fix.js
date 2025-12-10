import prisma from '../lib/prisma.js';

async function simpleDatabaseFix() {
	console.log('🔧 SIMPLE DATABASE FIX & REPORT PROCESSING...');
	
	try {
		// 1. Get current stats
		const initialStats = await getDatabaseStats();
		console.log('\n📊 CURRENT DATABASE STATUS:');
		console.log(`   Users: ${initialStats.users}`);
		console.log(`   Messages: ${initialStats.messages}`);
		console.log(`   Pending Reports: ${initialStats.pendingReports}`);
		console.log(`   Total Reports: ${initialStats.totalReports}`);
		
		if (initialStats.pendingReports === 0) {
			console.log('✅ No pending reports to process!');
			return { success: true, message: 'No action needed' };
		}
		
		// 2. Process pending reports intelligently
		console.log('\n📋 Processing pending reports...');
		const pendingReports = await prisma.report.findMany({
			where: { status: 'pending' },
			orderBy: { createdAt: 'asc' }
		});
		
		console.log(`📊 Found ${pendingReports.length} pending reports to review`);
		
		let processed = 0;
		for (const report of pendingReports) {
			let shouldAutoResolve = false;
			let actionTaken = '';
			
			// Auto-resolve reports with insufficient information
			if (!report.description || report.description.trim().length < 10) {
				shouldAutoResolve = true;
				actionTaken = 'Auto-resolved: Insufficient information provided';
			}
			// Auto-resolve obvious test reports
			else if (report.description?.toLowerCase().includes('test') && 
					 report.description.length < 20) {
				shouldAutoResolve = true;
				actionTaken = 'Auto-resolved: Test report';
			}
			// Auto-resolve spam reports with no details
			else if (report.reason?.toLowerCase().includes('spam') && 
					 (!report.description || report.description.length < 15)) {
				shouldAutoResolve = true;
				actionTaken = 'Auto-resolved: Spam report with insufficient details';
			}
			
			if (shouldAutoResolve) {
				await prisma.report.update({
					where: { id: report.id },
					data: {
						status: 'resolved',
						actionTaken: actionTaken,
						reviewedAt: new Date(),
						reviewedBy: 'auto-moderator'
					}
				});
				processed++;
				console.log(`✅ Auto-resolved report ${report.id}: ${actionTaken}`);
			}
		}
		
		console.log(`✅ Auto-processed ${processed} reports`);
		
		// 3. Clean up old resolved reports (older than 7 days)
		console.log('\n🧹 Cleaning up old resolved reports...');
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		
		const deletedReports = await prisma.report.deleteMany({
			where: {
				status: { in: ['resolved', 'dismissed'] },
				createdAt: { lt: sevenDaysAgo }
			}
		});
		
		console.log(`✅ Deleted ${deletedReports.count} old resolved reports`);
		
		// 4. Get final stats
		const finalStats = await getDatabaseStats();
		console.log('\n📊 UPDATED DATABASE STATUS:');
		console.log(`   Users: ${finalStats.users}`);
		console.log(`   Messages: ${finalStats.messages}`);
		console.log(`   Pending Reports: ${finalStats.pendingReports} (was ${initialStats.pendingReports})`);
		console.log(`   Total Reports: ${finalStats.totalReports}`);
		
		// 5. Create admin notification
		if (finalStats.pendingReports > 0) {
			await prisma.adminNotification.create({
				data: {
					type: 'report_backlog',
					title: 'Reports Need Manual Review',
					message: `${finalStats.pendingReports} reports require admin attention. ${processed} were auto-processed.`,
					link: '/admin'
				}
			});
			console.log(`📧 Admin notification created for ${finalStats.pendingReports} remaining reports`);
		} else {
			await prisma.adminNotification.create({
				data: {
					type: 'system_update',
					title: 'All Reports Processed',
					message: `Report backlog cleared! ${processed} reports were auto-resolved.`,
					link: '/admin'
				}
			});
			console.log('🎉 All reports processed - admin notified of success');
		}
		
		console.log('\n✅ DATABASE FIX COMPLETED SUCCESSFULLY!');
		console.log(`🎯 Reduced pending reports from ${initialStats.pendingReports} to ${finalStats.pendingReports}`);
		console.log('📈 Database performance should be improved');
		
		return {
			success: true,
			initialStats,
			finalStats,
			actions: {
				processedReports: processed,
				deletedOldReports: deletedReports.count,
				improvement: initialStats.pendingReports - finalStats.pendingReports
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
	const [users, messages, totalReports, pendingReports] = await Promise.all([
		prisma.user.count(),
		prisma.message.count(),
		prisma.report.count(),
		prisma.report.count({ where: { status: 'pending' } })
	]);
	
	return { users, messages, totalReports, pendingReports };
}

// Run immediately
simpleDatabaseFix()
	.then(result => {
		console.log('\n🎉 DATABASE FIX COMPLETED!');
		if (result.actions) {
			console.log(`📊 Processed ${result.actions.processedReports} reports`);
			console.log(`🧹 Deleted ${result.actions.deletedOldReports} old reports`);
			console.log(`📈 Improved pending count by ${result.actions.improvement}`);
		}
		process.exit(0);
	})
	.catch(error => {
		console.error('\n💥 DATABASE FIX FAILED:', error);
		process.exit(1);
	});