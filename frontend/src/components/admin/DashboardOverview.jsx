import { Users, UserCheck, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { 
	LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const DashboardOverview = ({ stats, loadingStats }) => {
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
						<div className="stat bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-purple-600/10 rounded-2xl shadow-xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40 hover:scale-105">
							<div className="stat-figure text-blue-600">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
									<Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
							</div>
							<div className="stat-title text-xs sm:text-sm font-semibold text-base-content/70">Total Users</div>
							<div className="stat-value text-blue-600 text-3xl sm:text-4xl font-bold">{stats.totalUsers}</div>
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

			{/* Analytics Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* User Growth Chart */}
				<div className="bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-base-300">
					<h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
							<TrendingUp className="w-5 h-5 text-white" />
						</div>
						User Growth (Last 7 Days)
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<LineChart data={[
							{ day: 'Mon', users: 45 },
							{ day: 'Tue', users: 52 },
							{ day: 'Wed', users: 61 },
							{ day: 'Thu', users: 58 },
							{ day: 'Fri', users: 70 },
							{ day: 'Sat', users: 85 },
							{ day: 'Sun', users: 92 }
						]}>
							<CartesianGrid strokeDasharray="3 3" opacity={0.1} />
							<XAxis dataKey="day" stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<YAxis stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'hsl(var(--b1))', 
									border: '1px solid hsl(var(--b3))',
									borderRadius: '0.5rem'
								}} 
							/>
							<Line 
								type="monotone" 
								dataKey="users" 
								stroke="hsl(var(--p))" 
								strokeWidth={3}
								dot={{ fill: 'hsl(var(--p))', r: 5 }}
								activeDot={{ r: 7 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{/* Activity Distribution */}
				<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
					<h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
						<Users className="w-5 h-5 text-success" />
						Activity Distribution
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={[
									{ name: 'Active Users', value: stats?.onlineUsers || 0, color: 'hsl(var(--su))' },
									{ name: 'Offline Users', value: (stats?.totalUsers || 0) - (stats?.onlineUsers || 0), color: 'hsl(var(--b3))' }
								]}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
								outerRadius={80}
								fill="#8884d8"
								dataKey="value"
							>
								{[
									{ name: 'Active Users', value: stats?.onlineUsers || 0, color: 'hsl(var(--su))' },
									{ name: 'Offline Users', value: (stats?.totalUsers || 0) - (stats?.onlineUsers || 0), color: 'hsl(var(--b3))' }
								].map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'hsl(var(--b1))', 
									border: '1px solid hsl(var(--b3))',
									borderRadius: '0.5rem'
								}} 
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>

				{/* Reports & Verifications */}
				<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
					<h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-warning" />
						Moderation Overview
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={[
							{ 
								name: 'Reports', 
								Pending: stats?.pendingReports || 0, 
								Total: stats?.totalReports || 0 
							},
							{ 
								name: 'Verifications', 
								Pending: stats?.pendingVerifications || 0, 
								Total: stats?.approvedVerifications || 0 
							}
						]}>
							<CartesianGrid strokeDasharray="3 3" opacity={0.1} />
							<XAxis dataKey="name" stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<YAxis stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'hsl(var(--b1))', 
									border: '1px solid hsl(var(--b3))',
									borderRadius: '0.5rem'
								}} 
							/>
							<Legend wrapperStyle={{ fontSize: '12px' }} />
							<Bar dataKey="Pending" fill="hsl(var(--wa))" radius={[8, 8, 0, 0]} />
							<Bar dataKey="Total" fill="hsl(var(--in))" radius={[8, 8, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* User Status Breakdown */}
				<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
					<h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
						<UserCheck className="w-5 h-5 text-info" />
						User Status
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart 
							data={[
								{ status: 'Verified', count: stats?.verifiedUsers || 0 },
								{ status: 'Online', count: stats?.onlineUsers || 0 },
								{ status: 'New', count: stats?.recentUsers || 0 }
							]}
							layout="vertical"
						>
							<CartesianGrid strokeDasharray="3 3" opacity={0.1} />
							<XAxis type="number" stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<YAxis dataKey="status" type="category" stroke="currentColor" opacity={0.5} style={{ fontSize: '12px' }} />
							<Tooltip 
								contentStyle={{ 
									backgroundColor: 'hsl(var(--b1))', 
									border: '1px solid hsl(var(--b3))',
									borderRadius: '0.5rem'
								}} 
							/>
							<Bar dataKey="count" fill="hsl(var(--p))" radius={[0, 8, 8, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

export default DashboardOverview;
