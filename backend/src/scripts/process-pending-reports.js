import prisma from '../lib/prisma.js';
import sendEmail from '../utils/sendEmail.js';

async function processPendingReports() {
	console.log('📋 Processing pending reports...');
	
	try {
		// 1. Get all pending reports
		const pendingReports = await prisma.report.findMany({
			where: { status: 'pending' },
			include: {
				reporter: {
					select: { id: true, username: true, email: true }
				},
				reportedUser: {
					select: { id: true, username: true, email: true }
				}
			},
			orderBy: [
				{ priority: 'desc' }, // High priority first
				{ createdAt: 'asc' }   // Oldest first
			]
		});
		
		console.log(`📊 Found ${pendingReports.length} pending reports`);
		
		if (pendingReports.length === 0) {
			console.log('✅ No pending reports to process');
			return { success: true, processed: 0 };
		}
		
		// 2. Categorize reports by severity
		const categorized = {
			critical: [],
			high: [],
			medium: [],
			low: []
		};
		
		pendingReports.forEach(report => {
			const severity = categorizeSeverity(report);
			categorized[severity].push(report);
		});
		
		console.log('📊 Report categorization:');
		console.log(`   Critical: ${categorized.critical.length}`);
		console.log(`   High: ${categorized.high.length}`);
		console.log(`   Medium: ${categorized.medium.length}`);
		console.log(`   Low: ${categorized.low.length}`);
		
		// 3. Process critical reports immediately
		let processed = 0;
		
		for (const report of categorized.critical) {
			await processReport(report, 'critical');
			processed++;
		}
		
		// 4. Auto-resolve spam reports
		const spamReports = pendingReports.filter(report => 
			report.reason?.toLowerCase().includes('spam') && 
			report.description?.length < 20
		);
		
		for (const report of spamReports) {
			await prisma.report.update({
				where: { id: report.id },
				data: {
					status: 'resolved',
					actionTaken: 'Auto-resolved: Insufficient evidence',
					reviewedAt: new Date(),
					reviewedBy: 'system'
				}
			});
			processed++;
		}
		
		// 5. Send notification to admins about remaining reports
		if (pendingReports.length - processed > 0) {
			await notifyAdminsAboutReports(pendingReports.length - processed);
		}
		
		console.log(`✅ Processed ${processed} reports`);
		console.log(`⏳ ${pendingReports.length - processed} reports still pending manual review`);
		
		return {
			success: true,
			processed,
			remaining: pendingReports.length - processed,
			categorized
		};
		
	} catch (error) {
		console.error('❌ Report processing error:', error);
		throw error;
	}
}

function categorizeSeverity(report) {
	const reason = report.reason?.toLowerCase() || '';
	const description = report.description?.toLowerCase() || '';
	
	// Critical - immediate action required
	if (reason.includes('harassment') || 
		reason.includes('threat') || 
		reason.includes('underage') ||
		description.includes('suicide') ||
		description.includes('violence')) {
		return 'critical';
	}
	
	// High - action required within 24 hours
	if (reason.includes('nudity') || 
		reason.includes('sexual') || 
		reason.includes('hate speech')) {
		return 'high';
	}
	
	// Medium - action required within 48 hours
	if (reason.includes('inappropriate') || 
		reason.includes('offensive')) {
		return 'medium';
	}
	
	// Low - can be processed in batch
	return 'low';
}

async function processReport(report, severity) {
	console.log(`🚨 Processing ${severity} report: ${report.id}`);
	
	try {
		// For critical reports, take immediate action
		if (severity === 'critical') {
			// Temporarily suspend reported user for investigation
			await prisma.user.update({
				where: { id: report.reportedUserId },
				data: {
					isSuspended: true,
					suspensionReason: `Under investigation for: ${report.reason}`,
					suspensionEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
				}
			});
			
			// Update report status
			await prisma.report.update({
				where: { id: report.id },
				data: {
					status: 'under_review',
					actionTaken: 'User temporarily suspended pending investigation',
					reviewedAt: new Date(),
					reviewedBy: 'auto-moderator'
				}
			});
			
			// Send email to admin
			await sendCriticalReportEmail(report);
		}
		
	} catch (error) {
		console.error(`❌ Failed to process report ${report.id}:`, error);
	}
}

async function notifyAdminsAboutReports(count) {
	try {
		// Create admin notification
		await prisma.adminNotification.create({
			data: {
				type: 'report_backlog',
				title: 'Pending Reports Require Attention',
				message: `${count} user reports are pending review. Please check the Reports Management tab.`,
				color: 'red',
				isBroadcast: false
			}
		});
		
		console.log(`📧 Admin notification sent about ${count} pending reports`);
		
	} catch (error) {
		console.error('❌ Failed to notify admins:', error);
	}
}

async function sendCriticalReportEmail(report) {
	try {
		const emailContent = `
			<h2>🚨 Critical Report Alert</h2>
			<p><strong>Report ID:</strong> ${report.id}</p>
			<p><strong>Reason:</strong> ${report.reason}</p>
			<p><strong>Reporter:</strong> ${report.reporter.username}</p>
			<p><strong>Reported User:</strong> ${report.reportedUser.username}</p>
			<p><strong>Description:</strong> ${report.description}</p>
			<p><strong>Action Taken:</strong> User temporarily suspended pending investigation</p>
			<p><strong>Next Steps:</strong> Please review this report immediately in the admin dashboard.</p>
		`;
		
		// Send to admin email (you should configure this)
		const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
		
		await sendEmail(
			adminEmail,
			`🚨 Critical Report Alert - ${report.reason}`,
			emailContent
		);
		
		console.log(`📧 Critical report email sent for report ${report.id}`);
		
	} catch (error) {
		console.error('❌ Failed to send critical report email:', error);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	processPendingReports()
		.then(result => {
			console.log('🎉 Report processing completed:', result);
			process.exit(0);
		})
		.catch(error => {
			console.error('💥 Report processing failed:', error);
			process.exit(1);
		});
}

export { processPendingReports };