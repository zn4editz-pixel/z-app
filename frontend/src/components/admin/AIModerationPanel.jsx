import { Shield, ExternalLink, Eye, CheckCircle, XCircle, Brain, TrendingUp, AlertOctagon, Filter, Download, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AIModerationPanel = ({ 
	aiReports, 
	aiStats, 
	loadingAIReports, 
	onUpdateReportStatus 
}) => {
	const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];
	
	const categoryData = aiReports.reduce((acc, report) => {
		const category = report.aiCategory || 'Unknown';
		acc[category] = (acc[category] || 0) + 1;
		return acc;
	}, {});

	const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 border border-purple-500/30">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
							<Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
						</div>
						<div>
							<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
								AI Content Moderation
							</h2>
							<p className="text-sm sm:text-base text-base-content/70 mt-1">Real-time automated content analysis</p>
						</div>
					</div>
					<div className="flex gap-2">
						<button className="btn btn-sm btn-outline btn-primary gap-2" aria-label="Refresh AI reports">
							<RefreshCw size={16} />
							Refresh
						</button>
						<button className="btn btn-sm btn-outline btn-secondary gap-2" aria-label="Export AI reports">
							<Download size={16} />
							Export
						</button>
					</div>
				</div>

				{loadingAIReports ? (
					<div className="flex flex-col items-center justify-center py-16">
						<span className="loading loading-spinner loading-lg text-purple-500"></span>
						<p className="text-sm text-base-content/60 mt-4">Loading AI reports...</p>
					</div>
				) : (
					<>
						{/* AI Stats Cards */}
						{aiStats && (
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
								<div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-purple-500/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{aiStats.total}</div>
									<div className="text-xs font-medium text-base-content/70 mt-1">Total AI Reports</div>
								</div>
								<div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-amber-500/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-3xl font-bold text-warning">{aiStats.pending}</div>
									<div className="text-xs font-medium text-base-content/70 mt-1">Pending Review</div>
								</div>
								<div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-3xl font-bold text-white">{aiStats.reviewed}</div>
									<div className="text-xs font-medium text-base-content/70 mt-1">Reviewed</div>
								</div>
								<div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-green-500/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-3xl font-bold text-success">{aiStats.actionTaken}</div>
									<div className="text-xs font-medium text-base-content/70 mt-1">Action Taken</div>
								</div>
								<div className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-slate-500/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-3xl font-bold text-neutral">{aiStats.dismissed}</div>
									<div className="text-xs font-medium text-base-content/70 mt-1">Dismissed</div>
								</div>
								<div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-violet-500/30 hover:shadow-xl hover:scale-105 transition-all">
									<div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{(aiStats.avgConfidence * 100).toFixed(0)}%</div>
									<div className="text-xs text-base-content/60">Avg Confidence</div>
								</div>
							</div>
						)}

						{/* AI Analytics Charts */}
						{aiReports.length > 0 && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
								{/* Violation Categories */}
								<div className="bg-base-100/90 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-base-300">
									<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
										<AlertOctagon className="w-5 h-5 text-error" />
										Violation Categories
									</h3>
									<ResponsiveContainer width="100%" height={250}>
										<PieChart>
											<Pie
												data={chartData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{chartData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip 
												contentStyle={{ 
													backgroundColor: 'rgba(15, 23, 42, 0.95)',
													backdropFilter: 'blur(10px)',
													border: '1px solid rgba(148, 163, 184, 0.2)',
													borderRadius: '12px',
													color: '#fff'
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>

								{/* Confidence Distribution */}
								<div className="bg-base-100/90 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-base-300">
									<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
										<TrendingUp className="w-5 h-5 text-success" />
										AI Confidence Levels
									</h3>
									<ResponsiveContainer width="100%" height={250}>
										<BarChart data={[
											{ range: '90-100%', count: aiReports.filter(r => r.aiConfidence >= 0.9).length },
											{ range: '80-89%', count: aiReports.filter(r => r.aiConfidence >= 0.8 && r.aiConfidence < 0.9).length },
											{ range: '70-79%', count: aiReports.filter(r => r.aiConfidence >= 0.7 && r.aiConfidence < 0.8).length },
											{ range: '60-69%', count: aiReports.filter(r => r.aiConfidence >= 0.6 && r.aiConfidence < 0.7).length },
											{ range: '<60%', count: aiReports.filter(r => r.aiConfidence < 0.6).length }
										]}>
											<defs>
												<linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="#8b5cf6" />
													<stop offset="100%" stopColor="#ec4899" />
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" opacity={0.15} />
											<XAxis dataKey="range" style={{ fontSize: '12px' }} />
											<YAxis style={{ fontSize: '12px' }} />
											<Tooltip 
												contentStyle={{ 
													backgroundColor: 'rgba(15, 23, 42, 0.95)',
													backdropFilter: 'blur(10px)',
													border: '1px solid rgba(148, 163, 184, 0.2)',
													borderRadius: '12px',
													color: '#fff'
												}}
											/>
											<Bar dataKey="count" fill="url(#confidenceGradient)" radius={[8, 8, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* AI Reports Table */}
			<div className="bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-6 border border-base-300">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold flex items-center gap-2">
						<Filter className="w-5 h-5 text-primary" />
						Recent AI Detections
					</h3>
					<div className="badge badge-lg badge-primary">{aiReports.length} Reports</div>
				</div>

				{aiReports.length === 0 ? (
					<div className="text-center text-success py-12">
						<Shield className="w-16 h-16 mx-auto mb-3 text-success" />
						<p className="text-lg font-semibold">No AI-detected violations!</p>
						<p className="text-sm text-base-content/60 mt-2">The system is monitoring content in real-time</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table w-full table-zebra table-sm sm:table-md">
							<thead>
								<tr className="text-xs sm:text-sm text-center bg-base-200">
									<th>Date</th>
									<th>Reported User</th>
									<th>AI Category</th>
									<th>Confidence</th>
									<th>Screenshot</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{aiReports.map((report) => (
									<tr key={report.id} className="text-center text-xs sm:text-sm hover:bg-base-200/50 transition-colors">
										<td className="font-medium">{new Date(report.createdAt).toLocaleString()}</td>
										<td>
											<div className="flex items-center justify-center gap-2">
												<div className="avatar">
													<div className="w-8 h-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
														<img 
															src={report.reportedUser?.profilePic || '/avatar.png'} 
															alt="" 
														/>
													</div>
												</div>
												<span className="font-semibold">{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</span>
											</div>
										</td>
										<td>
											<span className="badge badge-error badge-md gap-1">
												<AlertOctagon size={12} />
												{report.aiCategory || 'Unknown'}
											</span>
										</td>
										<td>
											<div className="flex flex-col items-center gap-1">
												<div className="w-20 bg-base-300 rounded-full h-2.5">
													<div 
														className={`h-2.5 rounded-full ${
															report.aiConfidence >= 0.8 ? 'bg-error' :
															report.aiConfidence >= 0.6 ? 'bg-warning' :
															'bg-base-content/30'
														}`}
														style={{ width: `${(report.aiConfidence * 100).toFixed(0)}%` }}
													></div>
												</div>
												<span className="text-xs font-bold">{(report.aiConfidence * 100).toFixed(0)}%</span>
											</div>
										</td>
										<td>
											<a
												href={report.screenshot}
												target="_blank"
												rel="noopener noreferrer"
												className="btn btn-ghost btn-xs gap-1"
											>
												<ExternalLink size={14} /> View
											</a>
										</td>
										<td>
											<span className={`badge badge-sm ${
												report.status === 'pending' ? 'badge-warning' :
												report.status === 'reviewed' ? 'badge-info' :
												report.status === 'action_taken' ? 'badge-success' :
												report.status === 'dismissed' ? 'badge-neutral' : ''
											}`}>
												{report.status.replace('_', ' ').toUpperCase()}
											</span>
										</td>
										<td>
											<div className="flex flex-wrap justify-center gap-1">
												{report.status === 'pending' && (
													<button
														onClick={() => onUpdateReportStatus(report.id, 'reviewed')}
														className="btn btn-info btn-xs gap-1"
													>
														<Eye size={12} /> Review
													</button>
												)}
												{report.status === 'reviewed' && (
													<>
														<button
															onClick={() => onUpdateReportStatus(report.id, 'action_taken')}
															className="btn btn-success btn-xs gap-1"
														>
															<CheckCircle size={12} /> Action
														</button>
														<button
															onClick={() => onUpdateReportStatus(report.id, 'dismissed')}
															className="btn btn-neutral btn-xs gap-1"
														>
															<XCircle size={12} /> Dismiss
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default AIModerationPanel;

