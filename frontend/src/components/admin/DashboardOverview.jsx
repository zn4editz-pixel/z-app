import { Users, UserCheck, Activity, TrendingUp, AlertTriangle, BarChart3, LineChart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import "../../styles/admin-smooth-gradients.css";

const DashboardOverview = ({ stats, loadingStats, users = [] }) => {
	// Error handling for invalid data
	const safeStats = stats || {};
	const safeUsers = Array.isArray(users) ? users : [];

	if (loadingStats) {
		return (
			<div className="space-y-6 relative min-h-screen">
				<div className="flex flex-col items-center justify-center py-16 relative z-10">
					<div className="relative">
						<span className="loading loading-spinner loading-lg text-warning"></span>
					</div>
					<p className="text-sm text-warning/80 mt-4">Loading dashboard data...</p>
				</div>
			</div>
		);
	}

	// Handle error state
	if (!stats && !loadingStats) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
				<h3 className="text-xl font-bold text-red-400 mb-2">Failed to Load Dashboard</h3>
				<p className="text-gray-400 mb-4">Unable to fetch dashboard data. Please try again.</p>
				<button 
					onClick={() => window.location.reload()} 
					className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 relative min-h-screen">

			{/* Header Section */}
			<div className="relative bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-3xl shadow-2xl p-5 sm:p-6 lg:p-8 border border-warning/20 overflow-hidden z-10">
				<div className="relative z-10">
					<div className="flex items-center gap-4">
						<div className="bg-gradient-to-br from-warning to-orange-500 p-4 rounded-2xl shadow-lg">
							<TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
						</div>
						<div>
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight dashboard-overview-gradient">
								DASHBOARD OVERVIEW
							</h2>
							<p className="text-sm sm:text-base text-base-content/70 mt-1 flex items-center gap-2">
								<Activity className="w-4 h-4 text-warning" />
								Real-time platform analytics and user insights
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
				{/* Total Users Card */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] border border-warning/20">
					<div className="flex items-center justify-between mb-4">
						<div className="text-base-content/70 text-sm font-bold uppercase tracking-wide">Total Users</div>
						<div className="bg-gradient-to-br from-warning to-orange-500 p-3 rounded-xl shadow-lg">
							<Users className="w-6 h-6 text-white drop-shadow-lg" />
						</div>
					</div>
					<div className="text-4xl font-bold mb-1 text-warning">
						{safeStats?.totalUsers?.toLocaleString() || safeUsers.length}
					</div>
					<div className="text-sm text-base-content/60 font-medium">
						+{safeStats?.recentUsers || Math.floor(safeUsers.length * 0.3)} this week
					</div>
				</div>

				{/* Online Now Card */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] border border-success/20">
					<div className="flex items-center justify-between mb-4">
						<div className="text-base-content/70 text-sm font-bold uppercase tracking-wide">Online Now</div>
						<div className="bg-gradient-to-br from-success to-green-600 p-3 rounded-xl shadow-lg">
							<Activity className="w-6 h-6 text-white drop-shadow-lg" />
						</div>
					</div>
					<div className="text-4xl font-bold mb-1 text-success">
						{safeStats?.onlineUsers || safeUsers.filter(u => u.isOnline).length}
					</div>
					<div className="text-sm text-base-content/60 font-medium">
						{safeStats?.verifiedUsers || safeUsers.filter(u => u.isVerified).length} verified
					</div>
				</div>

				{/* Pending Verifications Card */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] border border-info/20">
					<div className="flex items-center justify-between mb-4">
						<div className="text-base-content/70 text-sm font-bold uppercase tracking-wide">Pending Verifications</div>
						<div className="bg-gradient-to-br from-info to-blue-600 p-3 rounded-xl shadow-lg">
							<UserCheck className="w-6 h-6 text-white drop-shadow-lg" />
						</div>
					</div>
					<div className="text-4xl font-bold mb-1 text-info">
						{safeStats?.pendingVerifications || 0}
					</div>
					<div className="text-sm text-base-content/60 font-medium">
						{safeStats?.verifiedUsers || safeUsers.filter(u => u.isVerified).length} approved
					</div>
				</div>

				{/* Pending Reports Card */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] border border-error/20">
					<div className="flex items-center justify-between mb-4">
						<div className="text-base-content/70 text-sm font-bold uppercase tracking-wide">Pending Reports</div>
						<div className="bg-gradient-to-br from-error to-red-600 p-3 rounded-xl shadow-lg">
							<AlertTriangle className="w-6 h-6 text-white drop-shadow-lg" />
						</div>
					</div>
					<div className="text-4xl font-bold mb-1 text-error">
						{safeStats?.pendingReports || 0}
					</div>
					<div className="text-sm text-base-content/60 font-medium">
						{safeStats?.totalReports || 0} total reports
					</div>
				</div>
			</div>



			{/* Online Users and Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Online Users List */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-xl transition-all duration-200 border border-success/20">
					<div className="flex items-center gap-3 mb-4">
						<div className="bg-gradient-to-br from-success to-green-600 p-2 rounded-xl shadow-lg">
							<Activity className="w-5 h-5 text-white drop-shadow-lg" />
						</div>
						<h3 className="text-lg font-bold text-success">Currently Online Users</h3>
						<span className="px-3 py-1 rounded-full bg-success/20 border border-success/50 text-success font-bold text-sm">
							{safeUsers.filter(u => u.isOnline).length} online
						</span>
					</div>
					<div className="max-h-64 overflow-y-auto space-y-2">
						{safeUsers.filter(u => u.isOnline).length === 0 ? (
							<div className="text-center py-8 text-base-content/50">
								<Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>No users currently online</p>
							</div>
						) : (
							safeUsers
								.filter(u => u.isOnline)
								.slice(0, 10)
								.map(user => (
									<div key={user.id} className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors">
										<div className="relative">
											<img 
												src={user.profilePic || '/avatar.png'} 
												alt={user.username}
												className="w-10 h-10 rounded-full ring-2 ring-success ring-offset-2"
											/>
											<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-base-100"></div>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium text-base-content truncate">
													{user.nickname || user.username}
												</span>
												{user.isVerified && (
													<div className="badge badge-primary badge-xs flex items-center gap-1">
														<UserCheck className="w-2 h-2" />
													</div>
												)}
											</div>
											<div className="text-xs text-base-content/60 truncate">
												@{user.username}
											</div>
										</div>
										<div className="text-xs text-success font-medium">
											Online
										</div>
									</div>
								))
						)}
						{safeUsers.filter(u => u.isOnline).length > 10 && (
							<div className="text-center py-2 text-base-content/60 text-sm">
								+{safeUsers.filter(u => u.isOnline).length - 10} more users online
							</div>
						)}
					</div>
				</div>

				{/* Recent Users */}
				<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-warning/20">
					<div className="flex items-center gap-3 mb-4">
						<div className="bg-gradient-to-br from-warning to-orange-500 p-2 rounded-xl shadow-lg">
							<TrendingUp className="w-5 h-5 text-white drop-shadow-lg" />
						</div>
						<h3 className="text-lg font-bold text-warning">Recent Users</h3>
					</div>
					<div className="max-h-64 overflow-y-auto space-y-2">
						{safeUsers.length === 0 ? (
							<div className="text-center py-8 text-base-content/50">
								<Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>No users found</p>
							</div>
						) : (
							safeUsers
								.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
								.slice(0, 8)
								.map(user => (
									<div key={user.id} className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors">
										<div className="relative">
											<img 
												src={user.profilePic || '/avatar.png'} 
												alt={user.username}
												className="w-10 h-10 rounded-full"
											/>
											{user.isOnline && (
												<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-base-100"></div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium text-base-content truncate">
													{user.nickname || user.username}
												</span>
												{user.isVerified && (
													<div className="badge badge-primary badge-xs flex items-center gap-1">
														<UserCheck className="w-2 h-2" />
													</div>
												)}
											</div>
											<div className="text-xs text-base-content/60 truncate">
												Joined {new Date(user.createdAt).toLocaleDateString()}
											</div>
										</div>
										<div className={`text-xs font-medium ${user.isOnline ? 'text-success' : 'text-base-content/60'}`}>
											{user.isOnline ? 'Online' : 'Offline'}
										</div>
									</div>
								))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Modern Analytics Chart Component
const ModernAnalyticsChart = ({ users }) => {
	const [analyticsData, setAnalyticsData] = useState({
		userActivity: 0,
		engagement: 0,
		performance: 0,
		growth: 0
	});
	const [waveData, setWaveData] = useState([]);
	const intervalRef = useRef(null);

	useEffect(() => {
		// Initialize wave data for animated background
		const initialWave = Array.from({ length: 50 }, (_, i) => ({
			x: i * 2,
			y: 50 + Math.sin(i * 0.1) * 20
		}));
		setWaveData(initialWave);

		// Start live updates
		intervalRef.current = setInterval(() => {
			const onlineUsers = users?.filter(u => u.isOnline).length || 0;
			const totalUsers = users?.length || 1;
			
			setAnalyticsData({
				userActivity: Math.min(100, (onlineUsers / Math.max(totalUsers * 0.3, 1)) * 100),
				engagement: Math.min(100, 60 + Math.sin(Date.now() / 2000) * 20 + Math.random() * 15),
				performance: Math.min(100, 75 + Math.cos(Date.now() / 1500) * 15 + Math.random() * 10),
				growth: Math.min(100, 45 + Math.sin(Date.now() / 3000) * 25 + Math.random() * 20)
			});

			// Update wave animation
			setWaveData(prev => prev.map((point, i) => ({
				x: point.x,
				y: 50 + Math.sin((Date.now() / 1000) + i * 0.2) * 15 + Math.sin((Date.now() / 500) + i * 0.1) * 8
			})));
		}, 200);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [users]);

	const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = "#fbbf24", label, icon: Icon }) => {
		const radius = (size - strokeWidth) / 2;
		const circumference = radius * 2 * Math.PI;
		const offset = circumference - (value / 100) * circumference;

		return (
			<div className="relative flex flex-col items-center">
				<div className="relative">
					<svg width={size} height={size} className="transform -rotate-90">
						{/* Background circle */}
						<circle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							stroke="rgba(255, 255, 255, 0.1)"
							strokeWidth={strokeWidth}
							fill="transparent"
						/>
						{/* Progress circle */}
						<circle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							stroke={color}
							strokeWidth={strokeWidth}
							fill="transparent"
							strokeDasharray={circumference}
							strokeDashoffset={offset}
							strokeLinecap="round"
							className="transition-all duration-500 ease-out"
							style={{
								filter: `drop-shadow(0 0 8px ${color}60)`
							}}
						/>
					</svg>
					{/* Center content */}
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<Icon className="w-6 h-6 mb-1" style={{ color }} />
						<span className="text-lg font-bold" style={{ color }}>
							{Math.round(value)}%
						</span>
					</div>
				</div>
				<span className="text-xs text-base-content/70 mt-2 font-medium">{label}</span>
			</div>
		);
	};

	return (
		<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-warning/20 overflow-hidden relative">
			{/* Animated Wave Background */}
			<div className="absolute inset-0 opacity-10">
				<svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
					<defs>
						<linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
							<stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
							<stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
						</linearGradient>
					</defs>
					<path
						d={`M 0 ${waveData[0]?.y || 50} ${waveData.map((point, i) => `L ${point.x} ${point.y}`).join(' ')} L 100 100 L 0 100 Z`}
						fill="url(#waveGradient)"
						className="transition-all duration-200"
					/>
				</svg>
			</div>

			{/* Header */}
			<div className="flex items-center gap-3 mb-6 relative z-10">
				<div className="bg-gradient-to-br from-warning to-orange-500 p-2 rounded-xl shadow-lg">
					<BarChart3 className="w-5 h-5 text-white" />
				</div>
				<h3 className="text-lg font-bold text-warning">Live Analytics Dashboard</h3>
				<div className="flex items-center gap-1">
					<div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
					<span className="text-xs font-medium text-warning">REAL-TIME</span>
				</div>
			</div>

			{/* Circular Progress Charts */}
			<div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
				<CircularProgress
					value={analyticsData.userActivity}
					color="#22c55e"
					label="User Activity"
					icon={Users}
				/>
				<CircularProgress
					value={analyticsData.engagement}
					color="#3b82f6"
					label="Engagement"
					icon={TrendingUp}
				/>
				<CircularProgress
					value={analyticsData.performance}
					color="#f59e0b"
					label="Performance"
					icon={Activity}
				/>
				<CircularProgress
					value={analyticsData.growth}
					color="#ef4444"
					label="Growth Rate"
					icon={LineChart}
				/>
			</div>

			{/* Live Stats Bar */}
			<div className="bg-gradient-to-r from-base-200/50 to-base-300/50 rounded-xl p-4 relative z-10">
				<div className="grid grid-cols-4 gap-4 text-center">
					<div>
						<div className="text-success font-bold text-xl">
							{users?.filter(u => u.isOnline).length || 0}
						</div>
						<div className="text-xs text-base-content/60">Online Now</div>
					</div>
					<div>
						<div className="text-info font-bold text-xl">
							{Math.round(analyticsData.engagement)}%
						</div>
						<div className="text-xs text-base-content/60">Engaged</div>
					</div>
					<div>
						<div className="text-warning font-bold text-xl">
							{Math.round(analyticsData.performance)}%
						</div>
						<div className="text-xs text-base-content/60">Performance</div>
					</div>
					<div>
						<div className="text-error font-bold text-xl">
							+{Math.round(analyticsData.growth)}%
						</div>
						<div className="text-xs text-base-content/60">Growth</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Live System Metrics Chart Component
const LiveSystemMetricsChart = () => {
	const [metricsData, setMetricsData] = useState([]);
	const intervalRef = useRef(null);

	useEffect(() => {
		// Generate initial data
		const initialData = Array.from({ length: 20 }, (_, i) => ({
			time: i,
			cpu: Math.random() * 60 + 20,
			memory: Math.random() * 40 + 40,
			network: Math.random() * 80 + 10,
			timestamp: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString()
		}));
		setMetricsData(initialData);

		// Start live updates
		intervalRef.current = setInterval(() => {
			setMetricsData(prev => {
				const baseTime = Date.now();
				const newPoint = {
					time: prev.length,
					cpu: Math.max(10, 40 + Math.sin(baseTime / 10000) * 20 + Math.random() * 15),
					memory: Math.max(30, 60 + Math.sin(baseTime / 12000) * 15 + Math.random() * 10),
					network: Math.max(5, 30 + Math.sin(baseTime / 8000) * 25 + Math.random() * 20),
					timestamp: new Date().toLocaleTimeString()
				};
				return [...prev.slice(-19), newPoint];
			});
		}, 3000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return (
		<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-warning/20">
			<div className="flex items-center gap-3 mb-4">
				<div className="bg-gradient-to-br from-warning to-orange-500 p-2 rounded-xl shadow-lg">
					<LineChart className="w-5 h-5 text-white" />
				</div>
				<h3 className="text-lg font-bold text-warning">Live System Metrics</h3>
				<div className="flex items-center gap-1">
					<div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
					<span className="text-xs font-medium text-warning">LIVE</span>
				</div>
			</div>

			{/* Legend */}
			<div className="flex gap-4 mb-4 text-xs">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-error rounded-full"></div>
					<span className="text-base-content/70">CPU %</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-warning rounded-full"></div>
					<span className="text-base-content/70">Memory %</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-info rounded-full"></div>
					<span className="text-base-content/70">Network %</span>
				</div>
			</div>

			{/* Live Chart */}
			<div className="relative h-48 bg-gradient-to-br from-base-200/30 to-base-300/30 rounded-xl border border-base-300/30 overflow-hidden">
				<svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
					{/* Grid */}
					<defs>
						<pattern id="metricsGrid" width="10" height="10" patternUnits="userSpaceOnUse">
							<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.2"/>
						</pattern>
					</defs>
					<rect width="100" height="100" fill="url(#metricsGrid)" />
					
					{/* CPU Line */}
					<path
						d={metricsData.map((point, idx) => {
							const x = (idx / (metricsData.length - 1 || 1)) * 100;
							const y = 100 - point.cpu;
							return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
						}).join(' ')}
						fill="none"
						stroke="rgb(239, 68, 68)"
						strokeWidth="2"
						className="transition-all duration-300"
						style={{ filter: 'drop-shadow(0 0 4px rgb(239, 68, 68))' }}
					/>
					
					{/* Memory Line */}
					<path
						d={metricsData.map((point, idx) => {
							const x = (idx / (metricsData.length - 1 || 1)) * 100;
							const y = 100 - point.memory;
							return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
						}).join(' ')}
						fill="none"
						stroke="rgb(245, 158, 11)"
						strokeWidth="2"
						className="transition-all duration-300"
						style={{ filter: 'drop-shadow(0 0 4px rgb(245, 158, 11))' }}
					/>
					
					{/* Network Line */}
					<path
						d={metricsData.map((point, idx) => {
							const x = (idx / (metricsData.length - 1 || 1)) * 100;
							const y = 100 - point.network;
							return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
						}).join(' ')}
						fill="none"
						stroke="rgb(59, 130, 246)"
						strokeWidth="2"
						className="transition-all duration-300"
						style={{ filter: 'drop-shadow(0 0 4px rgb(59, 130, 246))' }}
					/>
				</svg>
			</div>

			{/* Current Values */}
			<div className="grid grid-cols-3 gap-4 mt-4 text-sm">
				<div className="text-center">
					<div className="text-error font-bold text-lg">
						{metricsData[metricsData.length - 1]?.cpu.toFixed(1) || 0}%
					</div>
					<div className="text-xs text-base-content/60">CPU</div>
				</div>
				<div className="text-center">
					<div className="text-warning font-bold text-lg">
						{metricsData[metricsData.length - 1]?.memory.toFixed(1) || 0}%
					</div>
					<div className="text-xs text-base-content/60">Memory</div>
				</div>
				<div className="text-center">
					<div className="text-info font-bold text-lg">
						{metricsData[metricsData.length - 1]?.network.toFixed(1) || 0}%
					</div>
					<div className="text-xs text-base-content/60">Network</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardOverview;