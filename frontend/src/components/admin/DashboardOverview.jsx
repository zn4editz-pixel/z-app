import { Users, UserCheck, Clock, AlertTriangle, TrendingUp, Activity, BarChart3, Wifi, WifiOff, Search } from "lucide-react";
import { 
	BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts";
import { useState } from "react";

const DashboardOverview = ({ stats, loadingStats, users = [] }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all"); // all, online, offline

	// Filter users based on search and status
	const filteredUsers = users.filter(user => {
		const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = filterStatus === "all" || 
			(filterStatus === "online" && user.isOnline) ||
			(filterStatus === "offline" && !user.isOnline);
		
		return matchesSearch && matchesStatus;
	});

	// Use stats.onlineUsers for accurate count from socket connections
	// But filter users array for display
	const onlineUsers = users.filter(u => u.isOnline);
	const offlineUsers = users.filter(u => !u.isOnline);
	
	// Debug: Log the mismatch
	if (stats && onlineUsers.length !== stats.onlineUsers) {
		if (import.meta.env.DEV) console.log(`⚠️ Online user count mismatch: DB shows ${onlineUsers.length}, Socket shows ${stats.onlineUsers}`);
	}

	return (
		<div className="space-y-6 sm:space-y-8 animate-fadeIn">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				{loadingStats ? (
					<div className="col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col items-center justify-center py-12">
						<span className="loading loading-spinner loading-lg text-primary"></span>
						<p className="text-sm text-base-content/60 mt-4">Loading statistics...</p>
					</div>
				) : stats && (
					<>
						<div className="stat bg-gradient-to-br from-white/10 via-white/5 to-primary/10 rounded-2xl shadow-xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105">
							<div className="stat-figure text-white">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white/20 to-primary/30 flex items-center justify-center shadow-lg">
									<Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
							</div>
							<div className="stat-title text-xs sm:text-sm font-semibold text-base-content/70">Total Users</div>
							<div className="stat-value text-white text-3xl sm:text-4xl font-bold">{stats.totalUsers}</div>
							<div className="stat-desc text-xs font-medium text-green-600">+{stats.recentUsers} this week</div>
						</div>

						<div className="stat bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 border border-base-300 hover:scale-105">
							<div className="stat-figure text-success hidden sm:block">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-success/20 flex items-center justify-center">
									<UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
								</div>
							</div>
							<div className="stat-title text-xs sm:text-sm font-semibold text-base-content/70">Online Now</div>
							<div className="stat-value text-success text-3xl sm:text-4xl font-bold">{stats.onlineUsers}</div>
							<div className="stat-desc text-xs font-medium">{stats.verifiedUsers} verified</div>
						</div>

						<div className="stat bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 border border-base-300 hover:scale-105">
							<div className="stat-figure text-warning hidden sm:block">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
									<Clock className="w-6 h-6 sm:w-7 sm:h-7" />
								</div>
							</div>
							<div className="stat-title text-xs sm:text-sm font-semibold text-base-content/70">Pending Verifications</div>
							<div className="stat-value text-warning text-3xl sm:text-4xl font-bold">{stats.pendingVerifications}</div>
							<div className="stat-desc text-xs font-medium">{stats.approvedVerifications} approved</div>
						</div>

						<div className="stat bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 border border-base-300 hover:scale-105">
							<div className="stat-figure text-error hidden sm:block">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-error/20 flex items-center justify-center">
									<AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
								</div>
							</div>
							<div className="stat-title text-xs sm:text-sm font-semibold text-base-content/70">Pending Reports</div>
							<div className="stat-value text-error text-3xl sm:text-4xl font-bold">{stats.pendingReports}</div>
							<div className="stat-desc text-xs font-medium">{stats.totalReports} total reports</div>
						</div>
					</>
				)}
			</div>

			{/* Analytics Charts - Modern Design */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* User Growth Chart - Gradient Area Chart */}
				<div className="bg-gradient-to-br from-white/5 via-primary/5 to-secondary/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-white/20 hover:border-white/40 transition-all">
					<h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-white/20 via-primary/30 to-secondary/30 rounded-xl shadow-lg">
							<TrendingUp className="w-5 h-5 text-white" />
						</div>
						<span className="bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
							User Growth Trend
						</span>
					</h3>
					<ResponsiveContainer width="100%" height={280}>
						<AreaChart data={[
							{ day: 'Mon', users: 45, active: 32 },
							{ day: 'Tue', users: 52, active: 38 },
							{ day: 'Wed', users: 61, active: 45 },
							{ day: 'Thu', users: 58, active: 42 },
							{ day: 'Fri', users: 70, active: 55 },
							{ day: 'Sat', users: 85, active: 68 },
							{ day: 'Sun', users: 92, active: 75 }
						]}>
							<defs>
								<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
									<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
								</linearGradient>
								<linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
							<XAxis 
								dataKey="day" 
								stroke="#64748b" 
								style={{ fontSize: '13px', fontWeight: '500' }} 
							/>
							<YAxis 
								stroke="#64748b" 
								style={{ fontSize: '13px', fontWeight: '500' }} 
							/>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'rgba(15, 23, 42, 0.95)',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(148, 163, 184, 0.2)',
									borderRadius: '12px',
									boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
									color: '#fff'
								}}
								labelStyle={{ color: '#e2e8f0', fontWeight: '600' }}
							/>
							<Legend 
								wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} 
								iconType="circle"
							/>
							<Area 
								type="monotone" 
								dataKey="users" 
								stroke="#8b5cf6" 
								strokeWidth={3}
								fillOpacity={1}
								fill="url(#colorUsers)"
								name="Total Users"
							/>
							<Area 
								type="monotone" 
								dataKey="active" 
								stroke="#3b82f6" 
								strokeWidth={3}
								fillOpacity={1}
								fill="url(#colorActive)"
								name="Active Users"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>

				{/* Activity Distribution - Modern Donut Chart */}
				<div className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-green-500/20 hover:border-green-500/40 transition-all">
					<h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg">
							<Activity className="w-5 h-5 text-white" />
						</div>
						<span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
							User Activity Status
						</span>
					</h3>
					<ResponsiveContainer width="100%" height={280}>
						<PieChart>
							<defs>
								<linearGradient id="gradientOnline" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stopColor="#10b981" />
									<stop offset="100%" stopColor="#14b8a6" />
								</linearGradient>
								<linearGradient id="gradientOffline" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stopColor="#64748b" />
									<stop offset="100%" stopColor="#475569" />
								</linearGradient>
							</defs>
							<Pie
								data={[
									{ name: 'Online Users', value: stats?.onlineUsers || 0 },
									{ name: 'Offline Users', value: (stats?.totalUsers || 0) - (stats?.onlineUsers || 0) }
								]}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={5}
								dataKey="value"
								label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
								labelLine={false}
							>
								<Cell fill="url(#gradientOnline)" />
								<Cell fill="url(#gradientOffline)" />
							</Pie>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'rgba(15, 23, 42, 0.95)',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(148, 163, 184, 0.2)',
									borderRadius: '12px',
									boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
									color: '#fff'
								}}
							/>
							<Legend 
								verticalAlign="bottom" 
								height={36}
								iconType="circle"
								wrapperStyle={{ fontSize: '13px', fontWeight: '500' }}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>

				{/* Reports & Verifications - Gradient Bar Chart */}
				<div className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
					<h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-xl shadow-lg">
							<AlertTriangle className="w-5 h-5 text-white" />
						</div>
						<span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
							Moderation Overview
						</span>
					</h3>
					<ResponsiveContainer width="100%" height={280}>
						<BarChart 
							data={[
								{ 
									name: 'Reports', 
									Pending: stats?.pendingReports || 0, 
									Resolved: (stats?.totalReports || 0) - (stats?.pendingReports || 0)
								},
								{ 
									name: 'Verifications', 
									Pending: stats?.pendingVerifications || 0, 
									Approved: stats?.approvedVerifications || 0 
								}
							]}
							barGap={8}
						>
							<defs>
								<linearGradient id="gradientPending" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#f59e0b" />
									<stop offset="100%" stopColor="#d97706" />
								</linearGradient>
								<linearGradient id="gradientResolved" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#3b82f6" />
									<stop offset="100%" stopColor="#2563eb" />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
							<XAxis 
								dataKey="name" 
								stroke="#64748b" 
								style={{ fontSize: '13px', fontWeight: '500' }} 
							/>
							<YAxis 
								stroke="#64748b" 
								style={{ fontSize: '13px', fontWeight: '500' }} 
							/>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'rgba(15, 23, 42, 0.95)',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(148, 163, 184, 0.2)',
									borderRadius: '12px',
									boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
									color: '#fff'
								}}
								cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
							/>
							<Legend 
								wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} 
								iconType="circle"
							/>
							<Bar 
								dataKey="Pending" 
								fill="url(#gradientPending)" 
								radius={[10, 10, 0, 0]}
								maxBarSize={60}
							/>
							<Bar 
								dataKey="Resolved" 
								fill="url(#gradientResolved)" 
								radius={[10, 10, 0, 0]}
								maxBarSize={60}
							/>
							<Bar 
								dataKey="Approved" 
								fill="url(#gradientResolved)" 
								radius={[10, 10, 0, 0]}
								maxBarSize={60}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* User Status Breakdown - Radial Progress */}
				<div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
					<h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 rounded-xl shadow-lg">
							<BarChart3 className="w-5 h-5 text-white" />
						</div>
						<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
							User Metrics
						</span>
					</h3>
					<ResponsiveContainer width="100%" height={280}>
						<RadialBarChart 
							cx="50%" 
							cy="50%" 
							innerRadius="20%" 
							outerRadius="90%" 
							data={[
								{ 
									name: 'Verified', 
									value: stats?.verifiedUsers || 0, 
									fill: '#8b5cf6',
									max: stats?.totalUsers || 100
								},
								{ 
									name: 'Online', 
									value: stats?.onlineUsers || 0, 
									fill: '#10b981',
									max: stats?.totalUsers || 100
								},
								{ 
									name: 'New This Week', 
									value: stats?.recentUsers || 0, 
									fill: '#3b82f6',
									max: stats?.totalUsers || 100
								}
							]}
							startAngle={90}
							endAngle={-270}
						>
							<RadialBar
								minAngle={15}
								background
								clockWise
								dataKey="value"
								cornerRadius={10}
								label={{ position: 'insideStart', fill: '#fff', fontSize: 14, fontWeight: 'bold' }}
							/>
							<Legend 
								iconSize={12}
								layout="vertical"
								verticalAlign="middle"
								align="right"
								wrapperStyle={{ fontSize: '13px', fontWeight: '500' }}
							/>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'rgba(15, 23, 42, 0.95)',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(148, 163, 184, 0.2)',
									borderRadius: '12px',
									boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
									color: '#fff'
								}}
							/>
						</RadialBarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Online/Offline Users List - Modern Design */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Online Users */}
				<div className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-green-500/20 hover:border-green-500/40 transition-all">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg sm:text-xl font-bold flex items-center gap-3">
							<div className="p-2.5 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg">
								<Wifi className="w-5 h-5 text-white" />
							</div>
							<span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
								Online Users
							</span>
						</h3>
						<div className="badge badge-lg badge-success gap-2">
							<div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
							{onlineUsers.length}
						</div>
					</div>

					<div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
						{onlineUsers.length === 0 ? (
							<div className="text-center py-8 text-base-content/60">
								<WifiOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p className="text-sm">No users online</p>
							</div>
						) : (
							onlineUsers.map((user) => (
								<div 
									key={user.id} 
									className="flex items-center gap-3 p-3 bg-base-100/80 backdrop-blur-sm rounded-xl hover:bg-base-100 transition-all hover:scale-102 border border-green-500/20 hover:border-green-500/40 hover:shadow-lg"
								>
									<div className="avatar online">
										<div className="w-12 h-12 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
											<img src={user.profilePic || '/avatar.png'} alt={user.username} />
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="font-semibold text-sm truncate">{user.nickname || user.username}</p>
											{user.isVerified && (
												<UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
											)}
										</div>
										<p className="text-xs text-base-content/60 truncate">@{user.username}</p>
										<p className="text-xs text-success font-medium mt-0.5">● Active now</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Offline Users */}
				<div className="bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-500/20 hover:border-slate-500/40 transition-all">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg sm:text-xl font-bold flex items-center gap-3">
							<div className="p-2.5 bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-500 rounded-xl shadow-lg">
								<WifiOff className="w-5 h-5 text-white" />
							</div>
							<span className="bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
								Offline Users
							</span>
						</h3>
						<div className="badge badge-lg badge-neutral gap-2">
							<div className="w-2 h-2 rounded-full bg-white/50"></div>
							{offlineUsers.length}
						</div>
					</div>

					<div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
						{offlineUsers.length === 0 ? (
							<div className="text-center py-8 text-base-content/60">
								<Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p className="text-sm">All users are online!</p>
							</div>
						) : (
							offlineUsers.slice(0, 20).map((user) => (
								<div 
									key={user.id} 
									className="flex items-center gap-3 p-3 bg-base-100/80 backdrop-blur-sm rounded-xl hover:bg-base-100 transition-all hover:scale-102 border border-slate-500/20 hover:border-slate-500/40 hover:shadow-lg"
								>
									<div className="avatar offline">
										<div className="w-12 h-12 rounded-full ring ring-neutral ring-offset-base-100 ring-offset-2 opacity-70">
											<img src={user.profilePic || '/avatar.png'} alt={user.username} />
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="font-semibold text-sm truncate opacity-80">{user.nickname || user.username}</p>
											{user.isVerified && (
												<UserCheck className="w-4 h-4 text-primary flex-shrink-0 opacity-70" />
											)}
										</div>
										<p className="text-xs text-base-content/60 truncate">@{user.username}</p>
										<p className="text-xs text-base-content/40 font-medium mt-0.5">○ Offline</p>
									</div>
								</div>
							))
						)}
						{offlineUsers.length > 20 && (
							<div className="text-center py-2 text-xs text-base-content/60">
								+ {offlineUsers.length - 20} more offline users
							</div>
						)}
					</div>
				</div>
			</div>

			{/* All Users Search & Filter */}
			<div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-indigo-500/20">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
					<h3 className="text-lg sm:text-xl font-bold flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 rounded-xl shadow-lg">
							<Users className="w-5 h-5 text-white" />
						</div>
						<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
							All Users Directory
						</span>
					</h3>
					<div className="flex gap-2">
						<button 
							onClick={() => setFilterStatus("all")}
							className={`btn btn-sm ${filterStatus === "all" ? "btn-primary" : "btn-outline"}`}
						>
							All ({users.length})
						</button>
						<button 
							onClick={() => setFilterStatus("online")}
							className={`btn btn-sm ${filterStatus === "online" ? "btn-success" : "btn-outline"}`}
						>
							Online ({onlineUsers.length})
						</button>
						<button 
							onClick={() => setFilterStatus("offline")}
							className={`btn btn-sm ${filterStatus === "offline" ? "btn-neutral" : "btn-outline"}`}
						>
							Offline ({offlineUsers.length})
						</button>
					</div>
				</div>

				{/* Search Bar */}
				<div className="relative mb-6">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
					<input
						type="text"
						placeholder="Search by username, nickname, or email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="input input-bordered w-full pl-12 bg-base-100/80 backdrop-blur-sm focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				{/* Users Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
					{filteredUsers.length === 0 ? (
						<div className="col-span-full text-center py-12 text-base-content/60">
							<Search className="w-16 h-16 mx-auto mb-3 opacity-50" />
							<p className="text-lg font-semibold">No users found</p>
							<p className="text-sm">Try adjusting your search or filters</p>
						</div>
					) : (
						filteredUsers.map((user) => (
							<div 
								key={user.id} 
								className={`flex items-center gap-3 p-3 bg-base-100/80 backdrop-blur-sm rounded-xl hover:bg-base-100 transition-all hover:scale-105 border ${
									user.isOnline 
										? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/20' 
										: 'border-slate-500/20 hover:border-slate-500/40'
								} hover:shadow-lg`}
							>
								<div className={`avatar ${user.isOnline ? 'online' : 'offline'}`}>
									<div className={`w-10 h-10 rounded-full ring ${
										user.isOnline ? 'ring-success' : 'ring-neutral opacity-70'
									} ring-offset-base-100 ring-offset-2`}>
										<img src={user.profilePic || '/avatar.png'} alt={user.username} />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1">
										<p className={`font-semibold text-xs truncate ${!user.isOnline && 'opacity-80'}`}>
											{user.nickname || user.username}
										</p>
										{user.isVerified && (
											<UserCheck className={`w-3 h-3 text-primary flex-shrink-0 ${!user.isOnline && 'opacity-70'}`} />
										)}
									</div>
									<p className="text-xs text-base-content/60 truncate">@{user.username}</p>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default DashboardOverview;
