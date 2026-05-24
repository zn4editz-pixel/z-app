import { Shield, ExternalLink, Eye, CheckCircle, XCircle, Brain, TrendingUp, AlertOctagon, Filter, Download, RefreshCw, Trash2, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AIModerationPanel = ({ 
	aiReports, 
	aiStats, 
	loadingAIReports, 
	onUpdateReportStatus,
	onDeleteReport,
	onRefresh
}) => {
	const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
	
	const categoryData = aiReports.reduce((acc, report) => {
		const category = report.aiCategory || 'Unknown';
		acc[category] = (acc[category] || 0) + 1;
		return acc;
	}, {});

	const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));



	return (
		<div className="space-y-6 relative min-h-screen">
			{/* Lightweight CSS-only Background Animation */}
			<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400 rounded-full blur-3xl will-change-transform" style={{ animation: 'float 20s ease-in-out infinite' }} />
				<div className="absolute top-1/2 right-1/4 w-96 h-96 bg-yellow-400 rounded-full blur-3xl will-change-transform" style={{ animation: 'float 25s ease-in-out infinite', animationDelay: '5s' }} />
				<div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-orange-400 rounded-full blur-3xl will-change-transform" style={{ animation: 'float 30s ease-in-out infinite', animationDelay: '10s' }} />
			</div>

			{/* Header Section */}
			<div className="relative bg-gradient-to-br from-black/95 via-amber-950/30 to-black/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 sm:p-6 lg:p-8 border-2 border-amber-500/40 overflow-hidden">
				{/* Animated grid pattern overlay */}
				<div className="absolute inset-0 opacity-10" style={{
					backgroundImage: `
						linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px),
						linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)
					`,
					backgroundSize: '50px 50px',
					animation: 'gridMove 20s linear infinite'
				}} />
				
				{/* Glowing orbs */}
				<div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
				<div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
				
				<div className="relative z-10">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
						<div className="flex items-center gap-4">
							<div className="relative p-4 rounded-2xl border-2 border-amber-400/60 bg-transparent backdrop-blur-sm group hover:border-yellow-400/80 transition-all duration-300">
								<Brain className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 group-hover:text-yellow-300 transition-colors duration-300" />
								<div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</div>
							<div>
								<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
									<span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
										AI MODERATION SYSTEM
									</span>
								</h2>
								<p className="text-sm sm:text-base text-amber-200/80 mt-1 flex items-center gap-2">
									<Activity className="w-4 h-4 animate-pulse text-amber-400" />
									Neural network-powered content analysis
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<button 
								onClick={onRefresh}
								className="btn btn-sm border-2 border-amber-400/60 bg-transparent hover:bg-amber-500/10 hover:border-amber-400 text-amber-400 hover:text-amber-300 gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30" 
								aria-label="Refresh AI reports"
							>
								<RefreshCw size={16} />
								<span className="hidden sm:inline">Refresh</span>
							</button>
							<button 
								className="btn btn-sm border-2 border-yellow-400/60 bg-transparent hover:bg-yellow-500/10 hover:border-yellow-400 text-yellow-400 hover:text-yellow-300 gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30" 
								aria-label="Export AI reports"
							>
								<Download size={16} />
								<span className="hidden sm:inline">Export</span>
							</button>
						</div>
					</div>

				{loadingAIReports ? (
					<div className="flex flex-col items-center justify-center py-16">
						<div className="relative">
							<span className="loading loading-spinner loading-lg text-amber-500"></span>
							<div className="absolute inset-0 loading loading-spinner loading-lg text-yellow-500 opacity-50" style={{ animationDelay: '0.3s' }} />
						</div>
						<p className="text-sm text-amber-200/80 mt-4 animate-pulse">Analyzing neural patterns...</p>
					</div>
				) : (
					<>
						{/* AI Stats Cards */}
						{aiStats && (
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-amber-400/40 hover:border-amber-400/80 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{aiStats.total}</div>
									<div className="text-xs font-medium text-amber-200/70 mt-1">Total AI Reports</div>
								</div>
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-yellow-400/40 hover:border-yellow-400/80 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-3xl font-bold text-yellow-400 group-hover:scale-110 transition-transform">{aiStats.pending}</div>
									<div className="text-xs font-medium text-yellow-200/70 mt-1">Pending Review</div>
								</div>
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-amber-300/40 hover:border-amber-300/80 hover:shadow-xl hover:shadow-amber-400/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-3xl font-bold text-amber-300 group-hover:scale-110 transition-transform">{aiStats.reviewed}</div>
									<div className="text-xs font-medium text-amber-200/70 mt-1">Reviewed</div>
								</div>
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-green-400/40 hover:border-green-400/80 hover:shadow-xl hover:shadow-green-500/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform">{aiStats.actionTaken}</div>
									<div className="text-xs font-medium text-green-300/70 mt-1">Action Taken</div>
								</div>
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-orange-400/40 hover:border-orange-400/80 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-3xl font-bold text-orange-400 group-hover:scale-110 transition-transform">{aiStats.dismissed}</div>
									<div className="text-xs font-medium text-orange-200/70 mt-1">Dismissed</div>
								</div>
								<div className="bg-transparent backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-amber-500/40 hover:border-amber-500/80 hover:shadow-xl hover:shadow-amber-600/20 hover:scale-105 transition-all duration-300 group">
									<div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{(aiStats.avgConfidence * 100).toFixed(0)}%</div>
									<div className="text-xs text-amber-200/70">Avg Confidence</div>
								</div>
							</div>
						)}

						{/* AI Analytics Charts */}
						{aiReports.length > 0 && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
								{/* Violation Categories */}
								<div className="bg-black/60 backdrop-blur-xl rounded-xl shadow-lg p-5 border-2 border-amber-400/30 hover:border-amber-400/60 transition-all duration-300">
									<h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-300">
										<AlertOctagon className="w-5 h-5 text-yellow-400" />
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
												{chartData.map((_, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip 
												contentStyle={{ 
													backgroundColor: 'rgba(0, 0, 0, 0.95)',
													backdropFilter: 'blur(10px)',
													border: '2px solid rgba(251, 191, 36, 0.3)',
													borderRadius: '12px',
													color: '#fbbf24'
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>

								{/* Confidence Distribution */}
								<div className="bg-black/60 backdrop-blur-xl rounded-xl shadow-lg p-5 border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all duration-300">
									<h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-300">
										<TrendingUp className="w-5 h-5 text-amber-400" />
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
													<stop offset="0%" stopColor="#fbbf24" />
													<stop offset="100%" stopColor="#f59e0b" />
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" opacity={0.15} />
											<XAxis dataKey="range" style={{ fontSize: '12px', fill: '#fde68a' }} />
											<YAxis style={{ fontSize: '12px', fill: '#fde68a' }} />
											<Tooltip 
												contentStyle={{ 
													backgroundColor: 'rgba(0, 0, 0, 0.95)',
													backdropFilter: 'blur(10px)',
													border: '2px solid rgba(251, 191, 36, 0.3)',
													borderRadius: '12px',
													color: '#fbbf24'
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

			{/* AI Reports - Responsive Cards for Mobile, Table for Desktop */}
			<div className="relative bg-black/80 backdrop-blur-2xl rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-amber-400/30 overflow-hidden">
				{/* Subtle animated background */}
				<div className="absolute inset-0 opacity-5" style={{
					backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.4) 1px, transparent 0)`,
					backgroundSize: '40px 40px'
				}} />
				
				<div className="relative z-10">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
						<h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-amber-300">
							<Filter className="w-5 h-5 text-yellow-400" />
							Recent AI Detections
						</h3>
						<div className="px-4 py-2 rounded-full border-2 border-amber-400/60 bg-transparent text-amber-300 font-bold shadow-lg">
							{aiReports.length} Reports
						</div>
					</div>

					{aiReports.length === 0 ? (
						<div className="text-center py-16">
							<div className="relative inline-block">
								<Shield className="w-20 h-20 mx-auto mb-4 text-green-400 animate-pulse" />
								<div className="absolute inset-0 w-20 h-20 mx-auto bg-green-400/20 rounded-full blur-xl animate-pulse" />
							</div>
							<p className="text-xl font-bold text-green-400">No AI-detected violations!</p>
							<p className="text-sm text-amber-200/60 mt-2">The system is monitoring content in real-time</p>
						</div>
					) : (
					<>
						{/* Desktop Table View - Hidden on Mobile */}
						<div className="hidden lg:block overflow-x-auto">
							<table className="table w-full table-zebra">
								<thead>
									<tr className="text-sm text-center bg-base-200">
										<th className="w-32">Date</th>
										<th>👤 Reporter</th>
										<th>⚠️ Violator</th>
										<th>AI Category</th>
										<th>Confidence</th>
										<th>🔞 Evidence</th>
										<th>Status</th>
										<th className="w-48">Actions</th>
									</tr>
								</thead>
								<tbody>
									{aiReports.map((report) => (
										<tr key={report.id} className="text-center hover:bg-base-200/50 transition-all">
											<td className="font-medium text-xs">{new Date(report.createdAt).toLocaleDateString()}<br/><span className="text-[10px] opacity-60">{new Date(report.createdAt).toLocaleTimeString()}</span></td>
											
											{/* Reporter */}
											<td>
												<div className="flex items-center justify-center gap-2">
													<div className="avatar">
														<div className="w-12 h-12 rounded-full ring-2 ring-success ring-offset-2 ring-offset-base-100">
															<img src={report.reporter?.profilePic || '/avatar.png'} alt="Reporter" />
														</div>
													</div>
													<div className="text-left">
														<div className="font-semibold text-sm">{report.reporter?.nickname || report.reporter?.username || 'AI'}</div>
														<div className="text-[10px] text-success font-bold">✓ Reporter</div>
													</div>
												</div>
											</td>

											{/* Violator */}
											<td>
												<div className="flex items-center justify-center gap-2">
													<div className="avatar">
														<div className="w-12 h-12 rounded-full ring-2 ring-error ring-offset-2 ring-offset-base-100">
															<img src={report.reportedUser?.profilePic || '/avatar.png'} alt="Violator" />
														</div>
													</div>
													<div className="text-left">
														<div className="font-semibold text-sm">{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</div>
														<div className="text-[10px] text-error font-bold">⚠ Violator</div>
													</div>
												</div>
											</td>

											<td>
												<span className="badge badge-error badge-lg gap-2 shadow-lg">
													<AlertOctagon size={14} />
													{report.aiCategory || 'Unknown'}
												</span>
											</td>
											
											<td>
												<div className="flex flex-col items-center gap-2">
													<div className="w-24 bg-base-300 rounded-full h-3 overflow-hidden">
														<div 
															className={`h-3 rounded-full transition-all ${
																report.aiConfidence >= 0.8 ? 'bg-gradient-to-r from-error to-error/80' :
																report.aiConfidence >= 0.6 ? 'bg-gradient-to-r from-warning to-warning/80' :
																'bg-gradient-to-r from-base-content/30 to-base-content/20'
															}`}
															style={{ width: `${(report.aiConfidence * 100).toFixed(0)}%` }}
														></div>
													</div>
													<span className="text-sm font-bold">{(report.aiConfidence * 100).toFixed(0)}%</span>
												</div>
											</td>
											
											{/* Evidence */}
											<td>
												{report.screenshot ? (
													<div className="flex flex-col items-center gap-2">
														<div className="relative group">
															<div className="w-24 h-24 rounded-xl border-4 border-error shadow-xl overflow-hidden bg-black">
																<img 
																	src={report.screenshot} 
																	alt="Violation"
																	className="w-full h-full object-cover blur-lg group-hover:blur-none transition-all duration-300 cursor-pointer"
																/>
															</div>
															<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
																<span className="bg-error text-white text-xs font-bold px-3 py-1.5 rounded-lg group-hover:opacity-0 transition-opacity shadow-lg">
																	🔞 NSFW
																</span>
															</div>
														</div>
														<a
															href={report.screenshot}
															target="_blank"
															rel="noopener noreferrer"
															className="btn btn-xs gap-1.5 border-2 border-amber-400/60 bg-transparent hover:bg-amber-500/10 hover:border-amber-400 text-amber-400 hover:text-amber-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300"
														>
															<ExternalLink size={12} /> View
														</a>
													</div>
												) : (
													<span className="text-xs text-base-content/50">No Evidence</span>
												)}
											</td>

											<td>
												<span className={`badge badge-md font-semibold shadow-md ${
													report.status === 'pending' ? 'badge-warning' :
													report.status === 'reviewed' ? 'badge-info' :
													report.status === 'action_taken' ? 'badge-success' :
													'badge-neutral'
												}`}>
													{report.status.replace('_', ' ').toUpperCase()}
												</span>
											</td>
											
											<td>
												<div className="flex flex-col gap-1.5">
													{report.status === 'pending' && (
														<>
															<button
																onClick={() => onUpdateReportStatus(report.id, 'reviewed')}
																className="btn btn-sm gap-2 border-2 border-amber-400/60 bg-transparent hover:bg-amber-500/10 hover:border-amber-400 text-amber-400 hover:text-amber-300 shadow-md hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 w-full"
															>
																<Eye size={14} /> Review
															</button>
															<button
																onClick={() => onDeleteReport(report.id)}
																className="btn btn-sm gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 w-full"
															>
																<Trash2 size={14} /> Delete
															</button>
														</>
													)}
													{report.status === 'reviewed' && (
														<>
															<button
																onClick={() => onUpdateReportStatus(report.id, 'action_taken')}
																className="btn btn-sm gap-2 border-2 border-green-400/60 bg-transparent hover:bg-green-500/10 hover:border-green-400 text-green-400 hover:text-green-300 shadow-md hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 w-full"
															>
																<CheckCircle size={14} /> Action
															</button>
															<button
																onClick={() => onUpdateReportStatus(report.id, 'dismissed')}
																className="btn btn-sm gap-2 border-2 border-orange-400/60 bg-transparent hover:bg-orange-500/10 hover:border-orange-400 text-orange-400 hover:text-orange-300 shadow-md hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 w-full"
															>
																<XCircle size={14} /> Dismiss
															</button>
															<button
																onClick={() => onDeleteReport(report.id)}
																className="btn btn-sm gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 w-full"
															>
																<Trash2 size={14} /> Delete
															</button>
														</>
													)}
													{(report.status === 'action_taken' || report.status === 'dismissed') && (
														<button
															onClick={() => onDeleteReport(report.id)}
															className="btn btn-sm gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 w-full"
														>
															<Trash2 size={14} /> Delete
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Mobile Card View - Visible on Mobile Only */}
						<div className="lg:hidden space-y-4">
							{aiReports.map((report) => (
								<div key={report.id} className="bg-gradient-to-br from-base-200/50 to-base-300/30 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-base-300 hover:shadow-xl transition-all">
									{/* Header */}
									<div className="flex items-center justify-between mb-4">
										<span className="text-xs font-medium text-base-content/60">
											{new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
										</span>
										<span className={`badge badge-sm font-semibold ${
											report.status === 'pending' ? 'badge-warning' :
											report.status === 'reviewed' ? 'badge-info' :
											report.status === 'action_taken' ? 'badge-success' :
											'badge-neutral'
										}`}>
											{report.status.replace('_', ' ').toUpperCase()}
										</span>
									</div>

									{/* Reporter & Violator */}
									<div className="grid grid-cols-2 gap-4 mb-4">
										{/* Reporter */}
										<div className="bg-success/10 rounded-xl p-3 border-2 border-success/30">
											<div className="flex flex-col items-center gap-2">
												<div className="avatar">
													<div className="w-16 h-16 rounded-full ring-2 ring-success ring-offset-2 ring-offset-base-100">
														<img src={report.reporter?.profilePic || '/avatar.png'} alt="Reporter" />
													</div>
												</div>
												<div className="text-center">
													<div className="font-bold text-sm">{report.reporter?.nickname || report.reporter?.username || 'AI'}</div>
													<div className="text-[10px] text-success font-bold">✓ Reporter</div>
												</div>
											</div>
										</div>

										{/* Violator */}
										<div className="bg-error/10 rounded-xl p-3 border-2 border-error/30">
											<div className="flex flex-col items-center gap-2">
												<div className="avatar">
													<div className="w-16 h-16 rounded-full ring-2 ring-error ring-offset-2 ring-offset-base-100">
														<img src={report.reportedUser?.profilePic || '/avatar.png'} alt="Violator" />
													</div>
												</div>
												<div className="text-center">
													<div className="font-bold text-sm">{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</div>
													<div className="text-[10px] text-error font-bold">⚠ Violator</div>
												</div>
											</div>
										</div>
									</div>

									{/* AI Info */}
									<div className="flex items-center justify-between mb-4 bg-base-100/50 rounded-xl p-3">
										<div className="flex items-center gap-2">
											<span className="badge badge-error badge-lg gap-2 shadow-md">
												<AlertOctagon size={14} />
												{report.aiCategory || 'Unknown'}
											</span>
										</div>
										<div className="text-right">
											<div className="text-xs text-base-content/60 mb-1">AI Confidence</div>
											<div className="text-lg font-bold">{(report.aiConfidence * 100).toFixed(0)}%</div>
											<div className="w-20 bg-base-300 rounded-full h-2 mt-1">
												<div 
													className={`h-2 rounded-full ${
														report.aiConfidence >= 0.8 ? 'bg-gradient-to-r from-error to-error/80' :
														report.aiConfidence >= 0.6 ? 'bg-gradient-to-r from-warning to-warning/80' :
														'bg-gradient-to-r from-base-content/30 to-base-content/20'
													}`}
													style={{ width: `${(report.aiConfidence * 100).toFixed(0)}%` }}
												></div>
											</div>
										</div>
									</div>

									{/* Evidence */}
									{report.screenshot && (
										<div className="mb-4">
											<div className="text-xs font-bold text-error mb-2 flex items-center gap-1">
												<span>🔞</span> Violation Evidence
											</div>
											<div className="relative group">
												<div className="w-full aspect-video rounded-xl border-4 border-error shadow-xl overflow-hidden bg-black">
													<img 
														src={report.screenshot} 
														alt="Violation"
														className="w-full h-full object-cover blur-xl group-hover:blur-sm transition-all duration-300"
													/>
												</div>
												<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
													<span className="bg-error text-white text-sm font-bold px-4 py-2 rounded-lg group-hover:opacity-0 transition-opacity shadow-lg">
														🔞 NSFW - Tap to Preview
													</span>
												</div>
											</div>
											<a
												href={report.screenshot}
												target="_blank"
												rel="noopener noreferrer"
												className="btn btn-sm gap-2 border-2 border-amber-400/60 bg-transparent hover:bg-amber-500/10 hover:border-amber-400 text-amber-400 hover:text-amber-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 w-full mt-3"
											>
												<ExternalLink size={14} /> View Full Evidence
											</a>
										</div>
									)}

									{/* Action Buttons */}
									<div className="flex flex-col gap-2">
										{report.status === 'pending' && (
											<>
												<button
													onClick={() => onUpdateReportStatus(report.id, 'reviewed')}
													className="btn btn-md gap-2 border-2 border-amber-400/60 bg-transparent hover:bg-amber-500/10 hover:border-amber-400 text-amber-400 hover:text-amber-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 w-full"
												>
													<Eye size={16} /> Mark as Reviewed
												</button>
												<button
													onClick={() => onDeleteReport(report.id)}
													className="btn btn-md gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 w-full"
												>
													<Trash2 size={16} /> Delete Report
												</button>
											</>
										)}
										{report.status === 'reviewed' && (
											<>
												<button
													onClick={() => onUpdateReportStatus(report.id, 'action_taken')}
													className="btn btn-md gap-2 border-2 border-green-400/60 bg-transparent hover:bg-green-500/10 hover:border-green-400 text-green-400 hover:text-green-300 shadow-lg hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 w-full"
												>
													<CheckCircle size={16} /> Mark Action Taken
												</button>
												<button
													onClick={() => onUpdateReportStatus(report.id, 'dismissed')}
													className="btn btn-md gap-2 border-2 border-orange-400/60 bg-transparent hover:bg-orange-500/10 hover:border-orange-400 text-orange-400 hover:text-orange-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 w-full"
												>
													<XCircle size={16} /> Dismiss Report
												</button>
												<button
													onClick={() => onDeleteReport(report.id)}
													className="btn btn-md gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 w-full"
												>
													<Trash2 size={16} /> Delete Report
												</button>
											</>
										)}
										{(report.status === 'action_taken' || report.status === 'dismissed') && (
											<button
												onClick={() => onDeleteReport(report.id)}
												className="btn btn-md gap-2 border-2 border-red-400/60 bg-transparent hover:bg-red-500/10 hover:border-red-400 text-red-400 hover:text-red-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 w-full"
											>
												<Trash2 size={16} /> Delete Report
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					</>
				)}
				</div>
			</div>
			</div>
		</div>
	);
};

export default AIModerationPanel;

