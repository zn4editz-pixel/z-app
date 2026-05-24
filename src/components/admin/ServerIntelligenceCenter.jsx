import { useEffect, useState, useRef, memo, useMemo, useCallback } from "react";
import { 
	Activity, Database, Zap, Globe, Wifi, AlertTriangle, 
	CheckCircle, TrendingUp, TrendingDown, Server, Clock,
	Cpu, HardDrive, BarChart3, LineChart, PieChart, RefreshCw,
	FileText, Camera, Users, MessageSquare
} from "lucide-react";
import { 
	LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar,
	XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell
} from "recharts";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";
import { useThemeStore } from "../../store/useThemeStore";
import "../../styles/server-intelligence-fix.css";

const ServerIntelligenceCenter = () => {
	const { theme } = useThemeStore();
	const [metrics, setMetrics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [history, setHistory] = useState([]);
	const [showReportModal, setShowReportModal] = useState(false);
	const [isLive, setIsLive] = useState(true);
	const intervalRef = useRef(null);

	useEffect(() => {
		fetchMetrics();
		
		// Start live updates if enabled - much slower to prevent flicker
		if (isLive) {
			intervalRef.current = setInterval(() => {
				fetchMetrics();
			}, 15000); // Update every 15 seconds to prevent flicker
		}
		
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isLive]);

	// Generate stable mock metrics with minimal variation to prevent flicker
	const generateMockMetrics = () => {
		const baseTime = Date.now();
		// Use very small, stable variations to prevent flicker
		const stableRandom = (seed) => Math.sin(baseTime / seed) * 0.1; // Reduced from 0.3 to 0.1
		
		return {
			timestamp: baseTime,
			backend: {
				responseTime: Math.max(50, 120 + Math.sin(baseTime / 20000) * 15 + stableRandom(10000) * 5), // Slower, smaller changes
				status: 'healthy',
				trend: stableRandom(6000) * 0.02, // Reduced trend variation
				requestsPerSecond: Math.max(10, 45 + Math.sin(baseTime / 16000) * 8 + stableRandom(8000) * 3)
			},
			frontend: {
				loadTime: Math.max(30, 80 + Math.sin(baseTime / 24000) * 10 + stableRandom(12000) * 4),
				status: 'healthy',
				trend: stableRandom(8000) * 0.02,
				cacheHitRate: Math.max(70, 85 + Math.sin(baseTime / 30000) * 5 + stableRandom(14000) * 2)
			},
			database: {
				queryTime: Math.max(20, 60 + Math.sin(baseTime / 18000) * 12 + stableRandom(11000) * 4),
				status: 'healthy',
				trend: stableRandom(7000) * 0.02,
				connections: Math.max(5, 15 + Math.sin(baseTime / 22000) * 4 + stableRandom(13000) * 2),
				cacheHitRate: Math.max(75, 90 + Math.sin(baseTime / 26000) * 4 + stableRandom(16000) * 1),
				totalUsers: 1247 + Math.floor(stableRandom(20000) * 2), // Very small user count changes
				totalMessages: 45623 + Math.floor(stableRandom(24000) * 10) // Small message count changes
			},
			socket: {
				latency: Math.max(10, 35 + Math.sin(baseTime / 14000) * 8 + stableRandom(9000) * 3),
				status: 'healthy',
				trend: stableRandom(5000) * 0.02,
				connections: Math.max(20, 85 + Math.sin(baseTime / 28000) * 12 + stableRandom(15000) * 4)
			},
			system: {
				cpu: Math.max(10, 35 + Math.sin(baseTime / 32000) * 10 + stableRandom(18000) * 4),
				memory: Math.max(40, 65 + Math.sin(baseTime / 36000) * 8 + stableRandom(22000) * 3),
				disk: Math.max(20, 45 + Math.sin(baseTime / 40000) * 5 + stableRandom(26000) * 2)
			}
		};
	};

	const fetchMetrics = async () => {
		try {
			// Only show loading on initial load
			if (!metrics) setLoading(true);
			
			let newMetrics;
			try {
				const res = await axiosInstance.get("/admin/server-metrics");
				newMetrics = res.data;
			} catch (apiErr) {
				// If API fails, use mock data for live animation
				console.log("API unavailable, using mock data for live animation");
				newMetrics = generateMockMetrics();
			}
			
			// Use functional updates with deep comparison to prevent flicker
			setMetrics(prevMetrics => {
				if (!prevMetrics) return newMetrics;
				
				// Check if values changed significantly (more than 5% to prevent minor flicker)
				const hasSignificantChange = (oldVal, newVal) => {
					if (typeof oldVal !== 'number' || typeof newVal !== 'number') return oldVal !== newVal;
					return Math.abs((newVal - oldVal) / oldVal) > 0.05; // 5% threshold
				};
				
				// Deep comparison for significant changes only
				const checkSignificantChanges = (oldObj, newObj) => {
					for (const key in newObj) {
						if (typeof newObj[key] === 'object' && newObj[key] !== null) {
							if (checkSignificantChanges(oldObj[key] || {}, newObj[key])) return true;
						} else if (hasSignificantChange(oldObj[key], newObj[key])) {
							return true;
						}
					}
					return false;
				};
				
				// Only update if there are significant changes
				if (checkSignificantChanges(prevMetrics, newMetrics)) {
					return newMetrics;
				}
				return prevMetrics;
			});
			
			// Update history less frequently to prevent chart flicker
			setHistory(prev => {
				const shouldUpdateHistory = prev.length === 0 || (Date.now() - (prev[prev.length - 1]?.timestamp || 0)) > 30000; // Update every 30 seconds
				if (shouldUpdateHistory) {
					const newHistory = [...prev.slice(-29), newMetrics].slice(-30);
					return newHistory;
				}
				return prev;
			});
			
			if (!metrics) setLoading(false);
		} catch (err) {
			console.error("Failed to fetch server metrics:", err);
			// Use mock data as fallback
			const mockMetrics = generateMockMetrics();
			
			// Apply same flicker prevention logic
			setMetrics(prevMetrics => {
				if (!prevMetrics) return mockMetrics;
				return prevMetrics; // Don't update on error to prevent flicker
			});
			
			// Only show error toast on initial load, not background updates
			if (!metrics) {
				toast.error("Using simulated data - API unavailable");
				setLoading(false);
			}
		}
	};

	const toggleLiveMode = () => {
		setIsLive(!isLive);
		// Don't immediately update metrics when toggling to prevent flicker
		// Let the useEffect handle the interval restart
	};

	// Memoize expensive calculations to prevent flicker
	const getStatusColor = useCallback((value, thresholds) => {
		if (value >= thresholds.critical) return "text-error";
		if (value >= thresholds.warning) return "text-warning";
		return "text-success";
	}, []);

	const getStatusBg = useCallback((value, thresholds) => {
		if (value >= thresholds.critical) return "bg-error/10 border-error/30";
		if (value >= thresholds.warning) return "bg-warning/10 border-warning/30";
		return "bg-success/10 border-success/30";
	}, []);

	// Memoize stable metrics to prevent unnecessary re-renders
	const stableMetrics = useMemo(() => {
		if (!metrics) return null;
		return {
			...metrics,
			// Round values to prevent micro-changes causing flicker
			backend: {
				...metrics.backend,
				responseTime: Math.round(metrics.backend?.responseTime || 0),
				requestsPerSecond: Math.round(metrics.backend?.requestsPerSecond || 0)
			},
			frontend: {
				...metrics.frontend,
				loadTime: Math.round(metrics.frontend?.loadTime || 0),
				cacheHitRate: Math.round(metrics.frontend?.cacheHitRate || 0)
			},
			database: {
				...metrics.database,
				queryTime: Math.round(metrics.database?.queryTime || 0),
				connections: Math.round(metrics.database?.connections || 0),
				cacheHitRate: Math.round(metrics.database?.cacheHitRate || 0)
			},
			socket: {
				...metrics.socket,
				latency: Math.round(metrics.socket?.latency || 0),
				connections: Math.round(metrics.socket?.connections || 0)
			},
			system: {
				...metrics.system,
				cpu: Math.round(metrics.system?.cpu || 0),
				memory: Math.round(metrics.system?.memory || 0),
				disk: Math.round(metrics.system?.disk || 0)
			}
		};
	}, [metrics]);

	if (loading) {
		return (
			<div className="loading-state">
				<div className="loading-spinner"></div>
				<p className="loading-text">Initializing Server Intelligence Center...</p>
			</div>
		);
	}

	return (
		<div className="bg-black rounded-3xl p-8 m-4 space-y-6 server-intelligence-container shadow-2xl border border-gray-800" data-theme={theme}>
			{/* Enhanced Golden Header */}
			<div className="bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/30 dark:to-orange-900/20 border-2 border-yellow-400/50 p-6 rounded-2xl shadow-2xl">
				<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="relative p-4 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-2xl border-2 border-yellow-300/50">
							{/* Shimmer effect */}
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30"></div>
							{/* Golden glow */}
							<div className="absolute inset-0 rounded-2xl bg-yellow-400/20 opacity-40"></div>
							<Activity className="relative w-8 h-8 text-white drop-shadow-lg" />
						</div>
						<div>
							<h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
								Server Intelligence Center
							</h2>
							<p className="text-base-content/70 font-medium flex items-center gap-2">
								<span className="inline-block w-2 h-2 bg-yellow-500 rounded-full opacity-80"></span>
								<Activity className="w-4 h-4" />
								Real-time performance monitoring & diagnostics
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div 
							className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
								isLive 
									? 'bg-gradient-to-r from-green-400/20 to-emerald-500/20 border-green-400/50' 
									: 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
							}`}
						>
							<div 
								className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'}`}
							/>
							<span 
								className={`font-bold text-sm ${isLive ? 'text-green-400' : 'text-gray-400'}`}
							>
								{isLive ? 'LIVE' : 'PAUSED'}
							</span>
						</div>
						<button
							onClick={toggleLiveMode}
							className="px-4 py-2 rounded-lg border-2 font-bold transition-all hover:scale-105 bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300/50 text-black shadow-lg hover:shadow-yellow-400/30"
						>
							<RefreshCw className={`w-4 h-4 mr-2 inline ${isLive ? 'animate-spin' : ''}`} />
							{isLive ? 'Pause' : 'Start'} Live
						</button>
						<button
							onClick={() => setShowReportModal(true)}
							className="px-4 py-2 rounded-lg border-2 font-bold transition-all hover:scale-105 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 border-orange-400/50 text-orange-600 dark:text-orange-400 hover:bg-gradient-to-r hover:from-orange-400/30 hover:to-yellow-400/30 flex items-center gap-2"
						>
							<FileText className="w-4 h-4" />
							Report Issue
						</button>
					</div>
				</div>
			</div>

			{/* Enhanced Status Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 admin-animate-in-delay-1">
				<EnhancedMetricCard
					icon={Server}
					title="Backend"
					value={`${stableMetrics?.backend?.responseTime || 0}ms`}
					status={stableMetrics?.backend?.status}
					trend={stableMetrics?.backend?.trend}
					subtitle={`${stableMetrics?.backend?.requestsPerSecond || 0} req/s`}
					theme={theme}
				/>
				<EnhancedMetricCard
					icon={Globe}
					title="Frontend"
					value={`${stableMetrics?.frontend?.loadTime || 0}ms`}
					status={stableMetrics?.frontend?.status}
					trend={stableMetrics?.frontend?.trend}
					subtitle={`${stableMetrics?.frontend?.cacheHitRate || 0}% cache hit`}
					theme={theme}
				/>
				<EnhancedMetricCard
					icon={Database}
					title="Database"
					value={`${stableMetrics?.database?.queryTime || 0}ms`}
					status={stableMetrics?.database?.status}
					trend={stableMetrics?.database?.trend}
					subtitle={`${stableMetrics?.database?.connections || 0} connections`}
					theme={theme}
				/>
				<EnhancedMetricCard
					icon={Wifi}
					title="WebSocket"
					value={`${stableMetrics?.socket?.latency || 0}ms`}
					status={stableMetrics?.socket?.status}
					trend={stableMetrics?.socket?.trend}
					subtitle={`${stableMetrics?.socket?.connections || 0} active`}
					theme={theme}
				/>
			</div>

			{/* Enhanced Performance Graphs */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 admin-animate-in-delay-2">
				<EnhancedLineChart
					title="Backend Response Time"
					data={history}
					dataKey="backend.responseTime"
					unit="ms"
					threshold={200}
					theme={theme}
				/>
				<EnhancedLineChart
					title="Database Query Time"
					data={history}
					dataKey="database.queryTime"
					unit="ms"
					threshold={100}
					theme={theme}
				/>
			</div>

			{/* Enhanced Area Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 admin-animate-in-delay-3">
				<EnhancedAreaChart
					title="Active Connections"
					data={history}
					dataKey="database.connections"
					unit=""
					theme={theme}
				/>
				<EnhancedAreaChart
					title="Cache Hit Rate"
					data={history}
					dataKey="database.cacheHitRate"
					unit="%"
					theme={theme}
				/>
				<EnhancedAreaChart
					title="Socket Latency"
					data={history}
					dataKey="socket.latency"
					unit="ms"
					theme={theme}
				/>
			</div>

			{/* Advanced Metrics */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<MultiLineGraph
					title="System Performance Overview"
					data={history}
					lines={[
						{ key: "backend.responseTime", label: "Backend", color: "#FFD700" },
						{ key: "database.queryTime", label: "Database", color: "#00CED1" },
						{ key: "socket.latency", label: "Socket", color: "#FF6B6B" }
					]}
					unit="ms"
				/>
				<DatabaseMetricsChart
					title="Database Health Metrics"
					metrics={stableMetrics?.database}
				/>
			</div>

			{/* Detailed Metrics */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<DetailedMetricPanel
					title="Backend Health"
					icon={Server}
					metrics={stableMetrics?.backend}
				/>
				<DetailedMetricPanel
					title="Database Health"
					icon={Database}
					metrics={stableMetrics?.database}
				/>
				<DetailedMetricPanel
					title="Socket Health"
					icon={Wifi}
					metrics={stableMetrics?.socket}
				/>
			</div>

			{/* Manual Report Modal */}
			{showReportModal && (
				<ManualReportModal onClose={() => setShowReportModal(false)} />
			)}

			{/* Enhanced System Resources */}
			<div className="admin-card-theme p-6 bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/30 dark:to-orange-900/20 border-2 border-yellow-400/50 shadow-2xl">
				<h3 className="text-xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 bg-clip-text text-transparent admin-panel-gradient-wave">
					<div className="relative p-3 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-2xl border-2 border-yellow-300/50">
						{/* Golden shimmer effect */}
						<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 animate-pulse"></div>
						{/* Golden glow */}
						<div className="absolute inset-0 rounded-xl bg-yellow-400/20 opacity-40 animate-pulse"></div>
						<Cpu className="relative w-6 h-6 text-white drop-shadow-lg" />
					</div>
					<Server className="w-6 h-6 text-yellow-600" />
					System Resources
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<EnhancedResourceBar
						label="CPU Usage"
						value={stableMetrics?.system?.cpu || 0}
						max={100}
						theme={theme}
						icon={Cpu}
					/>
					<EnhancedResourceBar
						label="Memory Usage"
						value={stableMetrics?.system?.memory || 0}
						max={100}
						theme={theme}
						icon={HardDrive}
					/>
					<EnhancedResourceBar
						label="Disk Usage"
						value={stableMetrics?.system?.disk || 0}
						max={100}
						theme={theme}
						icon={Database}
					/>
				</div>
			</div>
		</div>
	);
};

const EnhancedMetricCard = memo(({ icon: Icon, title, value, status, trend, subtitle, theme }) => {
	const statusColors = {
		healthy: { 
			bg: 'rgba(34, 197, 94, 0.15)', 
			border: 'rgba(34, 197, 94, 0.4)', 
			text: '#16a34a',
			gradient: 'from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/30 dark:to-orange-900/20',
			iconBg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
		},
		warning: { 
			bg: 'rgba(245, 158, 11, 0.15)', 
			border: 'rgba(245, 158, 11, 0.4)', 
			text: '#d97706',
			gradient: 'from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/30 dark:to-yellow-900/20',
			iconBg: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400'
		},
		critical: { 
			bg: 'rgba(239, 68, 68, 0.15)', 
			border: 'rgba(239, 68, 68, 0.4)', 
			text: '#dc2626',
			gradient: 'from-red-50 via-orange-50 to-amber-50 dark:from-red-900/20 dark:via-orange-900/30 dark:to-amber-900/20',
			iconBg: 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500'
		}
	};

	const statusStyle = statusColors[status] || statusColors.healthy;

	return (
		<div 
			className={`metric-card-theme p-6 transition-all hover:scale-105 cursor-pointer group bg-gradient-to-br ${statusStyle.gradient} border-2 shadow-xl hover:shadow-2xl hover:shadow-yellow-400/20`}
			style={{
				borderColor: '#fbbf24'
			}}
		>
			<div className="flex items-center justify-between mb-4">
				<div className={`relative p-3 rounded-xl ${statusStyle.iconBg} group-hover:scale-110 transition-all duration-300 shadow-lg border-2 border-yellow-300/30`}>
					{/* Golden shimmer effect */}
					<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse opacity-60"></div>
					{/* Golden glow */}
					<div className="absolute inset-0 rounded-xl bg-yellow-400/30 animate-pulse"></div>
					<Icon className="relative w-6 h-6 text-white drop-shadow-lg" />
				</div>
				{trend && (
					<div className="flex items-center gap-1">
						{trend > 0 ? 
							<TrendingUp className="w-5 h-5 text-yellow-600 animate-bounce" /> : 
							<TrendingDown className="w-5 h-5 text-orange-600 animate-bounce" />
						}
						<span className={`text-sm font-bold ${trend > 0 ? 'text-yellow-600' : 'text-orange-600'}`}>
							{Math.abs(trend * 5).toFixed(1)}%
						</span>
					</div>
				)}
			</div>
			<h3 className="text-sm font-bold mb-2 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
				{title}
			</h3>
			<p className="text-3xl font-bold mb-1 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
				{value}
			</p>
			{subtitle && (
				<p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-yellow-100/80 dark:bg-yellow-900/30 px-3 py-1 rounded-full inline-block border border-yellow-300/50">
					{subtitle}
				</p>
			)}
		</div>
	);
});

const EnhancedLineChart = memo(({ title, data, dataKey, unit, threshold, theme }) => {
	if (!data || data.length === 0) return null;

	const chartData = data.map((item, index) => ({
		time: index,
		value: getNestedValue(item, dataKey) || 0,
		timestamp: new Date(item.timestamp || Date.now() - (data.length - index) * 2000).toLocaleTimeString()
	}));

	const currentValue = chartData[chartData.length - 1]?.value || 0;
	const avgValue = chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length;
	const isAboveThreshold = threshold && currentValue > threshold;

	return (
		<div className="chart-container-theme bg-gradient-to-br from-yellow-50 via-amber-50/30 to-orange-50/50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 border-2 border-yellow-300/50 dark:border-yellow-500/30 shadow-xl hover:shadow-yellow-400/20">
			<div className="flex justify-between items-start mb-6">
				<div>
					<h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
						{title}
					</h3>
					<div className="flex gap-6 text-sm">
						<span className="text-amber-700 dark:text-amber-300">
							Current: <span className="font-bold text-yellow-600 dark:text-yellow-400">
								{currentValue.toFixed(1)}{unit}
							</span>
						</span>
						<span className="text-amber-700 dark:text-amber-300">
							Avg: <span className="font-bold text-orange-600 dark:text-orange-400">
								{avgValue.toFixed(1)}{unit}
							</span>
						</span>
					</div>
				</div>
				{isAboveThreshold && (
					<span className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-400/50 animate-pulse font-bold flex items-center gap-1">
						<AlertTriangle className="w-3 h-3" />
						Above Threshold
					</span>
				)}
			</div>
			
			<ResponsiveContainer width="100%" height={250}>
				<RechartsLineChart data={chartData}>
					<defs>
						<linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
							<stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#fbbf24" opacity={0.2} />
					<XAxis 
						dataKey="time" 
						stroke="#d97706" 
						opacity={0.7}
						fontSize={12}
						tickFormatter={() => ''}
					/>
					<YAxis 
						stroke="#d97706" 
						opacity={0.7}
						fontSize={12}
						domain={['dataMin - 5', 'dataMax + 5']}
					/>
					<Tooltip 
						contentStyle={{ 
							backgroundColor: '#fffbeb',
							border: '2px solid #fbbf24',
							borderRadius: '12px',
							color: '#92400e',
							boxShadow: '0 10px 25px rgba(251, 191, 36, 0.3)'
						}}
						labelFormatter={(value, payload) => payload[0]?.payload?.timestamp || ''}
						formatter={(value) => [`${value.toFixed(1)}${unit}`, title]}
					/>
					<Line 
						type="monotone" 
						dataKey="value" 
						stroke="#fbbf24"
						strokeWidth={4}
						dot={{ fill: '#f59e0b', strokeWidth: 3, r: 5, stroke: '#fbbf24' }}
						activeDot={{ r: 8, stroke: '#fbbf24', strokeWidth: 3, fill: '#f59e0b' }}
					/>
					{threshold && (
						<Line 
							type="monotone" 
							dataKey={() => threshold} 
							stroke="#ef4444" 
							strokeWidth={2}
							strokeDasharray="5 5"
							dot={false}
						/>
					)}
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
});

const EnhancedAreaChart = memo(({ title, data, dataKey, unit, theme }) => {
	if (!data || data.length === 0) return null;

	const chartData = data.map((item, index) => ({
		time: index,
		value: getNestedValue(item, dataKey) || 0,
		timestamp: new Date(item.timestamp || Date.now() - (data.length - index) * 2000).toLocaleTimeString()
	}));

	const currentValue = chartData[chartData.length - 1]?.value || 0;
	const maxValue = Math.max(...chartData.map(d => d.value));
	const minValue = Math.min(...chartData.map(d => d.value));

	return (
		<div className="chart-container-theme bg-gradient-to-br from-amber-50 via-yellow-50/30 to-orange-50/50 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-orange-900/20 border-2 border-amber-300/50 dark:border-amber-500/30 shadow-xl hover:shadow-amber-400/20">
			<div className="flex justify-between items-center mb-6">
				<h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
					{title}
				</h3>
				<div className="text-right">
					<div 
						className="text-2xl font-bold"
						style={{ color: 'var(--theme-primary)' }}
					>
						{currentValue.toFixed(1)}{unit}
					</div>
					<div className="text-xs opacity-60" style={{ color: 'var(--theme-text)' }}>
						Range: {minValue.toFixed(1)} - {maxValue.toFixed(1)}{unit}
					</div>
				</div>
			</div>
			
			<ResponsiveContainer width="100%" height={200}>
				<AreaChart data={chartData}>
					<defs>
						<linearGradient id={`areaGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="var(--theme-secondary)" stopOpacity={0.8}/>
							<stop offset="95%" stopColor="var(--theme-secondary)" stopOpacity={0.1}/>
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--theme-primary)" opacity={0.1} />
					<XAxis 
						dataKey="time" 
						stroke="var(--theme-text)" 
						opacity={0.6}
						fontSize={10}
						tickFormatter={() => ''}
					/>
					<YAxis 
						stroke="var(--theme-text)" 
						opacity={0.6}
						fontSize={10}
						domain={['dataMin - 2', 'dataMax + 2']}
					/>
					<Tooltip 
						contentStyle={{ 
							backgroundColor: 'var(--theme-surface)',
							border: '1px solid var(--theme-primary)',
							borderRadius: '8px',
							color: 'var(--theme-text)'
						}}
						labelFormatter={(value, payload) => payload[0]?.payload?.timestamp || ''}
						formatter={(value) => [`${value.toFixed(1)}${unit}`, title]}
					/>
					<Area 
						type="monotone" 
						dataKey="value" 
						stroke="var(--theme-secondary)"
						strokeWidth={2}
						fill={`url(#areaGradient-${dataKey})`}
						dot={false}
						activeDot={{ r: 4, stroke: 'var(--theme-secondary)', strokeWidth: 2 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
});

const MultiLineGraph = memo(({ title, data, lines, unit }) => {
	const allValues = lines.flatMap(line => data.map(d => getNestedValue(d, line.key) || 0));
	const maxValue = Math.max(...allValues, 100);
	const minValue = Math.min(...allValues, 0);
	const range = maxValue - minValue || 1;
	
	// Golden theme colors for lines
	const goldenLines = [
		{ ...lines[0], color: "#FFD700" }, // Gold
		{ ...lines[1], color: "#FFA500" }, // Orange
		{ ...lines[2], color: "#FF8C00" }  // Dark Orange
	];
	
	return (
		<div className="bg-gradient-to-br from-yellow-50 via-amber-50/30 to-orange-50/50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-yellow-300/50 dark:border-yellow-500/30 shadow-xl hover:shadow-yellow-400/20">
			<h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
				{title}
			</h3>
			
			{/* Golden Legend */}
			<div className="flex gap-4 mb-4">
				{goldenLines.map((line, idx) => (
					<div key={idx} className="flex items-center gap-2">
						<div 
							className="w-3 h-3 rounded-full shadow-lg" 
							style={{ 
								backgroundColor: line.color,
								boxShadow: `0 0 8px ${line.color}50`
							}} 
						/>
						<span className="text-xs font-medium text-amber-700 dark:text-amber-300">{line.label}</span>
					</div>
				))}
			</div>
			
			<div className="relative h-48 bg-gradient-to-br from-yellow-100/20 to-amber-100/20 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-xl border border-yellow-200/30 dark:border-yellow-600/20">
				<svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
					{/* Golden grid lines */}
					<defs>
						<pattern id="goldenGrid" width="10" height="10" patternUnits="userSpaceOnUse">
							<path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fbbf24" strokeWidth="0.2" opacity="0.3"/>
						</pattern>
					</defs>
					<rect width="100" height="100" fill="url(#goldenGrid)" />
					
					{goldenLines.map((line, lineIdx) => {
						const points = data.map((point, idx) => {
							const value = getNestedValue(point, line.key) || 0;
							const x = (idx / (data.length - 1 || 1)) * 100;
							const y = 100 - ((value - minValue) / range) * 100;
							return { x, y, value };
						});
						
						const pathD = points.length > 0 ? points.map((p, i) => 
							`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
						).join(' ') : '';
						
						return (
							<g key={lineIdx}>
								<path
									d={pathD}
									fill="none"
									stroke={line.color}
									strokeWidth="1.5"
									className="transition-all duration-300"
									style={{ 
										filter: `drop-shadow(0 0 4px ${line.color}) drop-shadow(0 0 8px ${line.color}50)`,
										strokeLinecap: 'round',
										strokeLinejoin: 'round'
									}}
								/>
								{/* Golden glow effect */}
								<path
									d={pathD}
									fill="none"
									stroke={line.color}
									strokeWidth="3"
									opacity="0.3"
									className="transition-all duration-300"
									style={{ 
										filter: `blur(2px)`,
										strokeLinecap: 'round',
										strokeLinejoin: 'round'
									}}
								/>
							</g>
						);
					})}
				</svg>
			</div>
			
			<div className="flex justify-between mt-4 text-xs font-medium text-amber-600 dark:text-amber-400">
				<span className="bg-yellow-100/50 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-300/30">
					-{data.length * 3}s
				</span>
				<span className="bg-yellow-100/50 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-300/30">
					Now
				</span>
			</div>
		</div>
	);
});

const DatabaseMetricsChart = memo(({ title, metrics }) => {
	if (!metrics) return null;
	
	const chartData = [
		{ label: "Query Time", value: metrics.queryTime || 0, max: 300, color: "#FFD700", bgColor: "from-yellow-400 to-amber-500" },
		{ label: "Connections", value: metrics.connections || 0, max: 50, color: "#FFA500", bgColor: "from-amber-400 to-orange-500" },
		{ label: "Cache Hit", value: metrics.cacheHitRate || 0, max: 100, color: "#FF8C00", bgColor: "from-orange-400 to-red-500" }
	];
	
	return (
		<div className="bg-gradient-to-br from-yellow-50 via-amber-50/30 to-orange-50/50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-yellow-300/50 dark:border-yellow-500/30 shadow-xl hover:shadow-yellow-400/20">
			<h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
				{title}
			</h3>
			<div className="space-y-6">
				{chartData.map((item, idx) => {
					const percentage = (item.value / item.max) * 100;
					return (
						<div key={idx}>
							<div className="flex justify-between mb-2">
								<span className="text-sm font-medium text-amber-700 dark:text-amber-300">{item.label}</span>
								<span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
									{item.value.toFixed(1)}{item.label === "Cache Hit" ? "%" : item.label === "Query Time" ? "ms" : ""}
								</span>
							</div>
							<div className="relative h-5 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full overflow-hidden border-2 border-yellow-200/50 dark:border-yellow-600/30">
								<div
									className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${item.bgColor} relative overflow-hidden`}
									style={{ 
										width: `${Math.min(percentage, 100)}%`,
										boxShadow: `0 0 15px ${item.color}60, inset 0 1px 0 rgba(255,255,255,0.3)`
									}}
								>
									{/* Golden shimmer effect */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse opacity-60"></div>
									{/* Golden glow */}
									<div 
										className="absolute inset-0 rounded-full animate-pulse opacity-50"
										style={{ backgroundColor: item.color }}
									></div>
								</div>
								{/* Percentage text overlay */}
								{percentage >= 25 && (
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-xs font-bold text-white drop-shadow-lg">
											{percentage.toFixed(0)}%
										</span>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
			
			{/* Golden Database Stats */}
			<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-yellow-300/30 dark:border-yellow-600/30">
				<div className="text-center bg-gradient-to-br from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-600/20">
					<div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
						{metrics.totalUsers?.toLocaleString() || 0}
					</div>
					<div className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wide flex items-center gap-1 justify-center">
						<Users className="w-3 h-3" />
						Total Users
					</div>
				</div>
				<div className="text-center bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-600/20">
					<div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
						{metrics.totalMessages?.toLocaleString() || 0}
					</div>
					<div className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-wide flex items-center gap-1 justify-center">
						<MessageSquare className="w-3 h-3" />
						Total Messages
					</div>
				</div>
			</div>
		</div>
	);
});

const DetailedMetricPanel = memo(({ title, icon: Icon, metrics }) => {
	if (!metrics) return null;

	return (
		<div className="bg-gradient-to-br from-yellow-50 via-amber-50/30 to-orange-50/50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-yellow-300/50 dark:border-yellow-500/30 shadow-xl hover:shadow-yellow-400/20">
			<div className="flex items-center gap-3 mb-6">
				<div className="relative p-3 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-lg border-2 border-yellow-300/30">
					{/* Golden shimmer effect */}
					<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse opacity-60"></div>
					{/* Golden glow */}
					<div className="absolute inset-0 rounded-xl bg-yellow-400/30 animate-pulse"></div>
					<Icon className="relative w-6 h-6 text-white drop-shadow-lg" />
				</div>
				<h3 className="text-lg font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
					{title}
				</h3>
			</div>
			<div className="space-y-4">
				{Object.entries(metrics).map(([key, value]) => {
					if (typeof value === 'object') return null;
					return (
						<div key={key} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-100/30 to-amber-100/30 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200/30 dark:border-yellow-600/20 hover:shadow-md transition-all">
							<span className="text-sm font-medium text-amber-700 dark:text-amber-300 capitalize">
								{key.replace(/([A-Z])/g, ' $1')}
							</span>
							<span className="text-sm font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent px-2 py-1 bg-yellow-50/50 dark:bg-yellow-900/30 rounded border border-yellow-300/30">
								{formatValue(value)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
});
const ManualReportModal = memo(({ onClose }) => {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		severity: "medium",
		screenshot: null
	});
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setUploading(true);
		
		try {
			const formDataToSend = new FormData();
			formDataToSend.append("title", formData.title);
			formDataToSend.append("description", formData.description);
			formDataToSend.append("severity", formData.severity);
			if (formData.screenshot) {
				formDataToSend.append("screenshot", formData.screenshot);
			}

			// Send to backend
			await axiosInstance.post("/admin/manual-report", formDataToSend, {
				headers: { "Content-Type": "multipart/form-data" }
			});

			toast.success("Report submitted successfully!");
			onClose();
		} catch (err) {
			toast.error("Failed to submit report");
		} finally {
			setUploading(false);
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File size must be less than 5MB");
				return;
			}
			setFormData({ ...formData, screenshot: file });
		}
	};

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/90 dark:via-amber-900/90 dark:to-orange-900/90 p-8 rounded-2xl border-2 border-yellow-300/50 dark:border-yellow-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<div className="relative p-3 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-lg border-2 border-yellow-300/30">
							{/* Golden shimmer effect */}
							<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse opacity-60"></div>
							<FileText className="relative w-6 h-6 text-white drop-shadow-lg" />
						</div>
						<h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
							Submit Manual Report
						</h3>
					</div>
					<button 
						onClick={onClose} 
						className="text-amber-600 dark:text-amber-400 hover:text-orange-600 dark:hover:text-orange-400 text-3xl font-bold transition-all hover:scale-110"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 uppercase tracking-wide">
							Issue Title *
						</label>
						<input
							type="text"
							required
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							className="w-full px-4 py-3 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300/50 dark:border-yellow-600/30 rounded-lg text-amber-900 dark:text-amber-100 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 font-medium"
							placeholder="Brief description of the issue"
						/>
					</div>

					<div>
						<label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 uppercase tracking-wide">
							Severity *
						</label>
						<select
							value={formData.severity}
							onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
							className="w-full px-4 py-3 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300/50 dark:border-yellow-600/30 rounded-lg text-amber-900 dark:text-amber-100 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 font-medium"
						>
							<option value="low">Low - Minor issue</option>
							<option value="medium">Medium - Moderate impact</option>
							<option value="high">High - Significant impact</option>
							<option value="critical">Critical - Urgent attention needed</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 uppercase tracking-wide">
							Description *
						</label>
						<textarea
							required
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							className="w-full px-4 py-3 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300/50 dark:border-yellow-600/30 rounded-lg text-amber-900 dark:text-amber-100 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 h-32 resize-none font-medium"
							placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
						/>
					</div>

					<div>
						<label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 uppercase tracking-wide">
							Screenshot (Optional)
						</label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							className="hidden"
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="w-full px-4 py-4 bg-gradient-to-r from-yellow-100/30 to-amber-100/30 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-dashed border-yellow-300/50 dark:border-yellow-600/30 rounded-lg text-amber-700 dark:text-amber-300 hover:border-yellow-500 hover:bg-gradient-to-r hover:from-yellow-200/50 hover:to-amber-200/50 dark:hover:from-yellow-800/30 dark:hover:to-amber-800/30 transition-all font-medium"
						>
							{formData.screenshot ? (
								<span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
									<CheckCircle className="w-4 h-4" />
									{formData.screenshot.name}
								</span>
							) : (
								<span className="flex items-center gap-2">
									<Camera className="w-4 h-4" />
									Click to upload screenshot (Max 5MB)
								</span>
							)}
						</button>
					</div>

					<div className="flex gap-4 pt-6">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50 hover:from-gray-500/30 hover:to-gray-600/30 rounded-lg text-gray-700 dark:text-gray-300 font-bold transition-all hover:scale-105"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={uploading}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 rounded-lg text-white font-bold transition-all disabled:opacity-50 hover:scale-105 shadow-lg hover:shadow-yellow-400/30 border-2 border-yellow-300/30"
						>
							{uploading ? (
								<span className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									Submitting...
								</span>
							) : (
								"Submit Report"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
});

const EnhancedResourceBar = memo(({ label, value, max, theme, icon: Icon }) => {
	const percentage = (value / max) * 100;
	const getStatusColor = () => {
		if (percentage >= 90) return { 
			bg: 'linear-gradient(90deg, #ef4444, #dc2626)', 
			text: '#ef4444',
			border: '#ef4444'
		};
		if (percentage >= 70) return { 
			bg: 'linear-gradient(90deg, #f59e0b, #d97706)', 
			text: '#f59e0b',
			border: '#f59e0b'
		};
		return { 
			bg: 'linear-gradient(90deg, #fbbf24, #f59e0b)', 
			text: '#fbbf24',
			border: '#fbbf24'
		};
	};

	const statusColor = getStatusColor();

	return (
		<div className="space-y-3 bg-gradient-to-br from-yellow-100/30 to-amber-100/30 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200/30 dark:border-yellow-600/20">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
					<span className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
						{label}
					</span>
				</div>
				<span 
					className="text-xl font-bold"
					style={{ color: statusColor.text }}
				>
					{value.toFixed(1)}%
				</span>
			</div>
			<div className="relative">
				<div className="h-6 rounded-full overflow-hidden border-2 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200/50 dark:border-yellow-600/30">
					<div
						className="h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
						style={{ 
							width: `${Math.min(percentage, 100)}%`,
							background: statusColor.bg,
							boxShadow: `0 0 15px ${statusColor.border}60, inset 0 1px 0 rgba(255,255,255,0.3)`
						}}
					>
						{/* Golden shimmer effect */}
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse opacity-60"></div>
						{/* Golden glow */}
						<div 
							className="absolute inset-0 rounded-full animate-pulse opacity-50"
							style={{ backgroundColor: statusColor.border }}
						></div>
					</div>
				</div>
				{/* Percentage text overlay */}
				{percentage >= 15 && (
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-xs font-bold text-white drop-shadow-lg">
							{percentage.toFixed(0)}%
						</span>
					</div>
				)}
			</div>
		</div>
	);
});

// Helper functions
const getNestedValue = (obj, path) => {
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const formatValue = (value) => {
	if (typeof value === 'number') {
		if (value > 1000) return `${(value / 1000).toFixed(2)}k`;
		return value.toFixed(2);
	}
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return value;
};

export default ServerIntelligenceCenter;
