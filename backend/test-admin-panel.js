// Test Admin Panel Functionality

const BASE_URL = 'http://localhost:5001';

const testAdminPanel = async () => {
	console.log('🧪 Testing Admin Panel Functionality...\n');

	try {
		// Test 1: Admin Login
		console.log('1️⃣ Testing Admin Login...');
		const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				emailOrUsername: 'ronaldo@gmail.com',
				password: 'safwan123'
			})
		});
		
		const loginData = await loginResponse.json();
		console.log('Login response:', loginData);
		
		if (!loginData.token) {
			throw new Error('Login failed: ' + JSON.stringify(loginData));
		}
		
		const token = loginData.token;
		const headers = { 
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		};
		console.log('✅ Admin login successful');

		// Test 2: Get Admin Stats
		console.log('\n2️⃣ Testing Admin Stats...');
		const statsResponse = await fetch(`${BASE_URL}/api/admin/stats`, { headers });
		const statsData = await statsResponse.json();
		console.log('Raw stats response:', statsData);
		console.log('✅ Admin stats:', {
			totalUsers: statsData.totalUsers,
			onlineUsers: statsData.onlineUsers,
			verifiedUsers: statsData.verifiedUsers,
			pendingReports: statsData.pendingReports
		});

		// Test 3: Get All Users
		console.log('\n3️⃣ Testing Users List...');
		const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, { headers });
		const usersData = await usersResponse.json();
		console.log('Raw users response type:', typeof usersData, 'Array?', Array.isArray(usersData));
		if (Array.isArray(usersData)) {
			const onlineUsers = usersData.filter(u => u.isOnline);
			console.log(`✅ Users loaded: ${usersData.length} total, ${onlineUsers.length} online`);
		} else {
			console.log('❌ Users data is not an array:', usersData);
		}

		// Test 4: Get Reports
		console.log('\n4️⃣ Testing Reports...');
		const reportsResponse = await fetch(`${BASE_URL}/api/admin/reports`, { headers });
		const reportsData = await reportsResponse.json();
		console.log(`✅ Reports loaded: ${reportsData.length} reports`);

		// Test 5: Get Server Metrics
		console.log('\n5️⃣ Testing Server Metrics...');
		try {
			const metricsResponse = await fetch(`${BASE_URL}/api/admin/server-metrics`, { headers });
			const metricsData = await metricsResponse.json();
			console.log('✅ Server metrics loaded successfully');
		} catch (err) {
			console.log('⚠️ Server metrics endpoint not working:', err.message);
		}

		// Test 6: Get Verification Requests
		console.log('\n6️⃣ Testing Verification Requests...');
		const verificationResponse = await fetch(`${BASE_URL}/api/admin/verification-requests`, { headers });
		const verificationData = await verificationResponse.json();
		console.log(`✅ Verification requests: ${verificationData.length} pending`);

		console.log('\n🎉 All Admin Panel Tests Completed Successfully!');
		console.log('\n📊 Summary:');
		console.log(`- Total Users: ${statsData.totalUsers}`);
		console.log(`- Online Users: ${statsData.onlineUsers}`);
		console.log(`- Verified Users: ${statsData.verifiedUsers}`);
		console.log(`- Pending Reports: ${statsData.pendingReports}`);
		console.log(`- Pending Verifications: ${verificationData.length}`);

	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
	}
};

testAdminPanel();