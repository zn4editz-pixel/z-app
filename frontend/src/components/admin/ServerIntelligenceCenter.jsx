import { useEffect, useState, useRef } from "react";
import { 
	Activity, Database, Zap, Globe, Wifi, AlertTriangle, 
	CheckCircle, TrendingUp, TrendingDown, Server, Clock,
	Cpu, HardDrive, BarChart3, LineChart, PieChart
} from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";

const ServerIntelligenceCenter = () => {
	const [metrics, setMetrics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [history, setHistory] = useState([]);
	const [bugs, setBugs] = useState([]);
	const intervalRef = useRef(null);

	useEffect(() => {
		fetchMetrics();
		intervalRef.current = setInterval(fetchMetrics, 3000); // Update every 3s
		return () => clearInterval(intervalRef.current);
	}, []);

	const fetchMetrics = async () => {
		try {
			const res = await axiosInstance.get("/admin/server-metrics");
			setMetrics(res.data);
			setHistory(prev => [...prev.slice(-29), res.data].slice(-30)); // Keep last 30 data points
			setBugs(res.data.bugs || []);
			setLoading(false);
		} catch (err) {
			console.error("Failed to fetch metrics:", err);
			if (loading) setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="loading loading-spinner loading-lg text-warning"></div>
			</div>
		);
	}

	const getStatusColor = (value, thresholds) => {
		if (value >= thresholds.critical) return "text-error";
		if (value >= thresholds.warning) return "text-warning";
		return "text-success";
	};

	const getStatusBg = (value, thresholds) => {
		if (value >= thresholds.critical) return "bg-error/10 border-error/30";
		if (value >= thresholds.warning) return "bg-warning/10 border-warning/30";
		return "bg-success/10 border-success/30";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-gradient-to-r from-black via-yellow-900/20 to-black p-6 rounded-2xl border-2 border-yellow-500/30 shadow-2xl">
				<div className="flex items-center gap-4">
					<div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/50">
						<Activity className="w-8 h-8 text-yellow-500" />
					</div>
					<div>
						<h2 className="text-3xl font-bold text-yellow-500">Server Intelligence Center</h2>
						<p className="text-yellow-200/70">Real-time performance monitoring & diagnostics</p>
					</div>
				</div>
			</div>

			{/* Status Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					icon={Server}
					title="Backend"
					value={`${metrics?.backend?.responseTime || 0}ms`}
					status={metrics?.backend?.status}
					trend={metrics?.backend?.trend}
					color="yellow"
				/>
				<MetricCard
					icon={Globe}
					title="Frontend"
					value={`${metrics?.frontend?.loadTime || 0}ms`}
					status={metrics?.frontend?.status}
					trend={metrics?.frontend?.trend}
					color="yellow"
				/>
				<MetricCard
					icon={Database}
					title="Database"
					value={`${metrics?.database?.queryTime || 0}ms`}
					status={metrics?.database?.status}
					trend={metrics?.database?.trend}
					color="yellow"
				/>
				<MetricCard
					icon={Wifi}
					title="WebSocket"
					value={`${metrics?.socket?.latency || 0}ms`}
					status={metrics?.socket?.status}
					trend={metrics?.socket?.trend}
					color="yellow"
				/>
			</div>

			{/* Performance Graphs */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<LineGraph
					title="Backend Response Time"
					data={history}
					dataKey="backend.responseTime"
					color="yellow"
					unit="ms"
					threshold={200}
				/>
				<LineGraph
					title="Database Query Time"
					data={history}
					dataKey="database.queryTime"
					color="cyan"
					unit="ms"
					threshold={100}
				/>
			</div>

			{/* Database Specific Graphs */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<AreaGraph
					title="Active Connections"
					data={history}
					dataKey="database.connections"
					color="green"
					unit=""
				/>
				<AreaGraph
					title="Cache Hit Rate"
					data={history}
					dataKey="database.cacheHitRate"
					color="purple"
					unit="%"
				/>
				<AreaGraph
					title="Socket Latency"
					data={history}
					dataKey="socket.latency"
					color="orange"
					unit="ms"
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
					metrics={metrics?.database}
				/>
			</div>

			{/* Detailed Metrics */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<DetailedMetricPanel
					title="Backend Health"
					icon={Server}
					metrics={metrics?.backend}
				/>
				<DetailedMetricPanel
					title="Database Health"
					icon={Database}
					metrics={metrics?.database}
				/>
				<DetailedMetricPanel
					title="Socket Health"
					icon={Wifi}
					metrics={metrics?.socket}
				/>
			</div>

			{/* Bug Detection */}
			{bugs.length > 0 && (
				<div className="bg-gradient-to-br from-red-950/50 to-black p-6 rounded-2xl border-2 border-red-500/30">
					<div className="flex items-center gap-3 mb-4">
						<AlertTriangle className="w-6 h-6 text-red-500" />
						<h3 className="text-xl font-bold text-red-500">Detected Issues</h3>
					</div>
					<div className="space-y-3">
						{bugs.map((bug, idx) => (
							<BugAlert key={idx} bug={bug} />
						))}
					</div>
				</div>
			)}

			{/* System Resources */}
			<div className="bg-gradient-to-br from-black via-yellow-900/10 to-black p-6 rounded-2xl border-2 border-yellow-500/20">
				<h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
					<Cpu className="w-6 h-6" />
					System Resources
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<ResourceBar
						label="CPU Usage"
						value={metrics?.system?.cpu || 0}
						max={100}
						color="yellow"
					/>
					<ResourceBar
						label="Memory Usage"
						value={metrics?.system?.memory || 0}
						max={100}
						color="yellow"
					/>
					<ResourceBar
						label="Disk Usage"
						value={metrics?.system?.disk || 0}
						max={100}
						color="yellow"
					/>
				</div>
			</div>
		</div>
	);
};

const MetricCard = ({ icon: Icon, title, value, status, trend, color }) => {
	const statusColors = {
		healthy: "text-green-500 bg-green-500/10 border-green-500/30",
		warning: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
		critical: "text-red-500 bg-red-500/10 border-red-500/30"
	};

	return (
		<div className={`p-6 rounded-xl border-2 ${statusColors[status] || statusColors.healthy} backdrop-blur-sm transition-all hover:scale-105`}>
			<div className="flex items-center justify-between mb-3">
				<Icon className={`w-6 h-6 ${statusColors[status]?.split(' ')[0]}`} />
				{trend && (
					trend > 0 ? 
						<TrendingUp className="w-5 h-5 text-green-500" /> : 
						<TrendingDown className="w-5 h-5 text-red-500" />
				)}
			</div>
			<h3 className="text-sm font-medium text-white/70 mb-1">{title}</h3>
			<p className="text-2xl font-bold text-white">{value}</p>
		</div>
	);
};

const LineGraph = ({ title, data, dataKey, color, unit, threshold }) => {
	const maxValue = Math.max(...data.map(d => getNestedValue(d, dataKey) || 0), threshold || 100);
	const minValue = Math.min(...data.map(d => getNestedValue(d, dataKey) || 0), 0);
	const range = maxValue - minValue || 1;
	
	const colorMap = {
		yellow: { line: "#FFD700", glow: "#FFD700", bg: "rgba(255, 215, 0, 0.1)" },
		cyan: { line: "#00CED1", glow: "#00CED1", bg: "rgba(0, 206, 209, 0.1)" },
		green: { line: "#10B981", glow: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
		purple: { line: "#A855F7", glow: "#A855F7", bg: "rgba(168, 85, 247, 0.1)" },
		orange: { line: "#FF6B6B", glow: "#FF6B6B", bg: "rgba(255, 107, 107, 0.1)" }
	};
	
	const colors = colorMap[color] || colorMap.yellow;
	
	// Create SVG path for smooth line
	const points = data.map((point, idx) => {
		const value = getNestedValue(point, dataKey) || 0;
		const x = (idx / (data.length - 1 || 1)) * 100;
		const y = 100 - ((value - minValue) / range) * 100;
		return { x, y, value };
	});
	
	const pathD = points.length > 0 ? points.map((p, i) => 
		`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
	).join(' ') : '';
	
	const areaD = pathD ? `${pathD} L 100 100 L 0 100 Z` : '';
	
	const currentValue = points[points.length - 1]?.value || 0;
	const avgValue = data.length > 0 ? data.reduce((sum, d) => sum + (getNestedValue(d, dataKey) || 0), 0) / data.length : 0;
	
	return (
		<div className="bg-gradient-to-br from-black via-gray-900 to-black p-6 rounded-2xl border-2 border-gray-700/50 hover:border-gray-600/50 transition-all">
			<div className="flex justify-between items-start mb-4">
				<div>
					<h3 className="text-lg font-bold" style={{ color: colors.line }}>{title}</h3>
					<div className="flex gap-4 mt-2 text-sm">
						<span className="text-white/70">Current: <span className="font-semibold text-white">{currentValue.toFixed(1)}{unit}</span></span>
						<span className="text-white/70">Avg: <span className="font-semibold text-white">{avgValue.toFixed(1)}{unit}</span></span>
					</div>
				</div>
				{threshold && currentValue > threshold && (
					<span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg border border-red-500/30">
						Above Threshold
					</span>
				)}
			</div>
			
			<div className="relative h-48">
				<svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
					{/* Area fill */}
					<path
						d={areaD}
						fill={colors.bg}
						className="transition-all duration-300"
					/>
					{/* Line */}
					<path
						d={pathD}
						fill="none"
						stroke={colors.line}
						strokeWidth="0.5"
						className="transition-all duration-300"
						style={{ filter: `drop-shadow(0 0 2px ${colors.glow})` }}
					/>
					{/* Dots */}
					{points.map((p, i) => (
						<circle
							key={i}
							cx={p.x}
							cy={p.y}
							r="0.8"
							fill={colors.line}
							className="transition-all duration-300 hover:r-1.5"
							style={{ filter: `drop-shadow(0 0 2px ${colors.glow})` }}
						>
							<title>{p.value.toFixed(1)}{unit}</title>
						</circle>
					))}
					{/* Threshold line */}
					{threshold && (
						<line
							x1="0"
							y1={100 - ((threshold - minValue) / range) * 100}
							x2="100"
							y2={100 - ((threshold - minValue) / range) * 100}
							stroke="#EF4444"
							strokeWidth="0.3"
							strokeDasharray="2,2"
							opacity="0.5"
						/>
					)}
				</svg>
			</div>
			
			<div className="flex justify-between mt-2 text-xs text-white/40">
				<span>-{data.length * 3}s</span>
				<span>Now</span>
			</div>
		</div>
	);
};

const AreaGraph = ({ title, data, dataKey, color, unit }) => {
	const maxValue = Math.max(...data.map(d => getNestedValue(d, dataKey) || 0), 100);
	
	const colorMap = {
		green: { from: "#10B981", to: "#059669" },
		purple: { from: "#A855F7", to: "#7C3AED" },
		orange: { from: "#F59E0B", to: "#D97706" },
		cyan: { from: "#06B6D4", to: "#0891B2" }
	};
	
	const colors = colorMap[color] || colorMap.green;
	
	return (
		<div className="bg-gradient-to-br from-black via-gray-900 to-black p-6 rounded-2xl border-2 border-gray-700/50">
			<h3 className="text-lg font-bold mb-4" style={{ color: colors.from }}>{title}</h3>
			<div className="h-32 flex items-end gap-0.5">
				{data.map((point, idx) => {
					const value = getNestedValue(point, dataKey) || 0;
					const height = (value / maxValue) * 100;
					return (
						<div
							key={idx}
							className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
							style={{ 
								height: `${height}%`, 
								minHeight: '2px',
								background: `linear-gradient(to top, ${colors.from}, ${colors.to})`
							}}
							title={`${value.toFixed(1)}${unit}`}
						/>
					);
				})}
			</div>
			<div className="mt-3 text-center">
				<span className="text-2xl font-bold text-white">
					{(data[data.length - 1] ? getNestedValue(data[data.length - 1], dataKey) || 0 : 0).toFixed(1)}{unit}
				</span>
			</div>
		</div>
	);
};

const MultiLineGraph = ({ title, data, lines, unit }) => {
	const allValues = lines.flatMap(line => data.map(d => getNestedValue(d, line.key) || 0));
	const maxValue = Math.max(...allValues, 100);
	const minValue = Math.min(...allValues, 0);
	const range = maxValue - minValue || 1;
	
	return (
		<div className="bg-gradient-to-br from-black via-gray-900 to-black p-6 rounded-2xl border-2 border-gray-700/50">
			<h3 className="text-lg font-bold text-white mb-4">{title}</h3>
			
			{/* Legend */}
			<div className="flex gap-4 mb-4">
				{lines.map((line, idx) => (
					<div key={idx} className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
						<span className="text-xs text-white/70">{line.label}</span>
					</div>
				))}
			</div>
			
			<div className="relative h-48">
				<svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
					{lines.map((line, lineIdx) => {
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
									strokeWidth="0.5"
									className="transition-all duration-300"
									style={{ filter: `drop-shadow(0 0 2px ${line.color})` }}
								/>
							</g>
						);
					})}
				</svg>
			</div>
			
			<div className="flex justify-between mt-2 text-xs text-white/40">
				<span>-{data.length * 3}s</span>
				<span>Now</span>
			</div>
		</div>
	);
};

const DatabaseMetricsChart = ({ title, metrics }) => {
	if (!metrics) return null;
	
	const chartData = [
		{ label: "Query Time", value: metrics.queryTime || 0, max: 300, color: "#00CED1" },
		{ label: "Connections", value: metrics.connections || 0, max: 50, color: "#10B981" },
		{ label: "Cache Hit", value: metrics.cacheHitRate || 0, max: 100, color: "#A855F7" }
	];
	
	return (
		<div className="bg-gradient-to-br from-black via-gray-900 to-black p-6 rounded-2xl border-2 border-gray-700/50">
			<h3 className="text-lg font-bold text-white mb-6">{title}</h3>
			<div className="space-y-6">
				{chartData.map((item, idx) => {
					const percentage = (item.value / item.max) * 100;
					return (
						<div key={idx}>
							<div className="flex justify-between mb-2">
								<span className="text-sm text-white/70">{item.label}</span>
								<span className="text-sm font-semibold text-white">
									{item.value.toFixed(1)}{item.label === "Cache Hit" ? "%" : item.label === "Query Time" ? "ms" : ""}
								</span>
							</div>
							<div className="relative h-4 bg-black/50 rounded-full overflow-hidden border border-gray-700/50">
								<div
									className="h-full rounded-full transition-all duration-500"
									style={{ 
										width: `${Math.min(percentage, 100)}%`,
										backgroundColor: item.color,
										boxShadow: `0 0 10px ${item.color}50`
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
			
			{/* Database Stats */}
			<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700/50">
				<div className="text-center">
					<div className="text-2xl font-bold text-cyan-400">{metrics.totalUsers?.toLocaleString() || 0}</div>
					<div className="text-xs text-white/50 mt-1">Total Users</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-green-400">{metrics.totalMessages?.toLocaleString() || 0}</div>
					<div className="text-xs text-white/50 mt-1">Total Messages</div>
				</div>
			</div>
		</div>
	);
};

const DetailedMetricPanel = ({ title, icon: Icon, metrics }) => {
	if (!metrics) return null;

	return (
		<div className="bg-gradient-to-br from-black via-yellow-900/10 to-black p-6 rounded-2xl border-2 border-yellow-500/20">
			<div className="flex items-center gap-3 mb-4">
				<Icon className="w-6 h-6 text-yellow-500" />
				<h3 className="text-lg font-bold text-yellow-500">{title}</h3>
			</div>
			<div className="space-y-3">
				{Object.entries(metrics).map(([key, value]) => {
					if (typeof value === 'object') return null;
					return (
						<div key={key} className="flex justify-between items-center">
							<span className="text-sm text-white/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
							<span className="text-sm font-semibold text-yellow-400">{formatValue(value)}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

const BugAlert = ({ bug }) => {
	const severityColors = {
		critical: "border-red-500/50 bg-red-950/30 text-red-400",
		high: "border-orange-500/50 bg-orange-950/30 text-orange-400",
		medium: "border-yellow-500/50 bg-yellow-950/30 text-yellow-400",
		low: "border-blue-500/50 bg-blue-950/30 text-blue-400"
	};

	return (
		<div className={`p-4 rounded-lg border-2 ${severityColors[bug.severity]}`}>
			<div className="flex items-start gap-3">
				<AlertTriangle className="w-5 h-5 mt-0.5" />
				<div className="flex-1">
					<h4 className="font-semibold mb-1">{bug.title}</h4>
					<p className="text-sm opacity-80">{bug.description}</p>
					<div className="flex items-center gap-4 mt-2 text-xs opacity-60">
						<span>Location: {bug.location}</span>
						<span>Detected: {new Date(bug.timestamp).toLocaleTimeString()}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

const ResourceBar = ({ label, value, max, color }) => {
	const percentage = (value / max) * 100;
	const getColor = () => {
		if (percentage >= 90) return "bg-red-500";
		if (percentage >= 70) return "bg-yellow-500";
		return "bg-green-500";
	};

	return (
		<div>
			<div className="flex justify-between mb-2">
				<span className="text-sm text-white/70">{label}</span>
				<span className="text-sm font-semibold text-yellow-400">{value}%</span>
			</div>
			<div className="h-3 bg-black/50 rounded-full overflow-hidden border border-yellow-500/20">
				<div
					className={`h-full ${getColor()} transition-all duration-500 rounded-full`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
};

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
