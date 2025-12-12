// Create Sample Reports for Testing
import prisma from './src/lib/prisma.js';

const createSampleReports = async () => {
	console.log('📝 Creating sample reports for testing...\n');

	try {
		// Get some users to create reports with
		const users = await prisma.user.findMany({ take: 5 });
		
		if (users.length < 2) {
			console.log('❌ Need at least 2 users to create reports');
			return;
		}

		const sampleReports = [
			{
				reason: 'Inappropriate Content',
				description: 'User posted inappropriate images in chat',
				reporterId: users[0].id,
				reportedUserId: users[1].id,
				status: 'pending',
				isAIDetected: false
			},
			{
				reason: 'Spam Messages',
				description: 'User is sending repetitive spam messages',
				reporterId: users[1].id,
				reportedUserId: users[2]?.id || users[0].id,
				status: 'pending',
				isAIDetected: true,
				aiConfidence: 0.85
			},
			{
				reason: 'Harassment',
				description: 'User is harassing other members',
				reporterId: users[0].id,
				reportedUserId: users[3]?.id || users[1].id,
				status: 'reviewed',
				isAIDetected: true,
				aiConfidence: 0.92
			},
			{
				reason: 'Fake Profile',
				description: 'Suspected fake profile with stolen images',
				reporterId: users[2]?.id || users[0].id,
				reportedUserId: users[4]?.id || users[1].id,
				status: 'pending',
				isAIDetected: false
			}
		];

		console.log('Creating reports...');
		for (const reportData of sampleReports) {
			try {
				const report = await prisma.report.create({
					data: reportData
				});
				console.log(`✅ Created report: ${report.reason} (${report.status})`);
			} catch (err) {
				console.log(`⚠️ Failed to create report: ${reportData.reason} - ${err.message}`);
			}
		}

		// Get final count
		const totalReports = await prisma.report.count();
		const pendingReports = await prisma.report.count({ where: { status: 'pending' } });
		const aiReports = await prisma.report.count({ where: { isAIDetected: true } });

		console.log('\n📊 Report Summary:');
		console.log(`- Total Reports: ${totalReports}`);
		console.log(`- Pending Reports: ${pendingReports}`);
		console.log(`- AI Detected Reports: ${aiReports}`);

		console.log('\n🎉 Sample reports created successfully!');

	} catch (error) {
		console.error('❌ Error creating sample reports:', error.message);
	} finally {
		await prisma.$disconnect();
	}
};

createSampleReports();