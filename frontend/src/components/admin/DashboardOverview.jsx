import { Users, UserCheck, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { 
	LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const DashboardOverview = ({ stats, loadingStats }) => {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{loadingStats ? (
					<div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-8">
						<span className="loading loading-spinner loading-lg"></span>
					</div>
				) : stats && (
					<>
						<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
							<div className="stat-figure text-primary hidden sm:block">
								<Users className="w-6 h-6 sm:w-8 sm:h-8" />
							</div>
							<div className="stat-title text-xs sm:text-sm">Total Users</div>
							<div className="stat-value text-primary text-2xl sm:text-3xl">{stats.totalUsers}</div>
							<div className="stat-desc text-xs">{stats.recentUsers} new this week</div>
						</div>

						<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
							<div className="stat-figure text-success hidden sm:block">
								<UserCheck className="w-6 h-6 sm:w-8 sm:h-8" />
							</div>
							<div className="stat-title text-xs sm:text-sm">Online Now</div>
							<div className="stat-value text-success text-2xl sm:text-3xl">{stats.onlineUsers}</div>
							<div className="stat-desc text-xs">{stats.verifiedUsers} verified</div>
						</div>

						<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
							<div className="stat-figure text-warning hidden sm:block">
								<Clock className="w-6 h-6 sm:w-8 sm:h-8" />
							</div>
							<div className="stat-title text-xs sm:text-sm">Pending Verifications</div>
							<div className="stat-value text-warning text-2xl sm:text-3xl">{stats.pendingVerifications}</div>
							<div className="stat-desc text-xs">{stats.approvedVerifications} approved</div>
						</div>

						<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
							<div className="stat-figure text-error hidden sm:block">
								<AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
							</div>
							<div className="stat-title text-xs sm:text-sm">Pending Reports</div>
							<div className="stat-value text-error text-2xl sm:text-3xl">{stats.pendingReports}</div>
							<div className="stat-desc text-xs">{stats.totalReports} total reports</div>
						</div>
					</>
				)}
			</div>

			{/* Analytics Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* User Growth Chart */}
				<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
					<h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-primary" />
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
