import { Shield, ExternalLink, Eye, CheckCircle, XCircle } from "lucide-react";

const AIModerationPanel = ({ 
	aiReports, 
	aiStats, 
	loadingAIReports, 
	onUpdateReportStatus 
}) => {
	return (
		<div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-purple-500/20">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
					<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
				</div>
				<div>
					<h2 className="text-xl sm:text-2xl font-semibold">AI Content Moderation</h2>
					<p className="text-xs sm:text-sm text-base-content/60">Automatically detected violations</p>
				</div>
			</div>

			{loadingAIReports ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-lg text-purple-500"></span>
				</div>
			) : (
				<>
					{/* AI Stats Cards */}
					{aiStats && (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-purple-500">{aiStats.total}</div>
								<div className="text-xs text-base-content/60">Total AI Reports</div>
							</div>
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-warning">{aiStats.pending}</div>
								<div className="text-xs text-base-content/60">Pending</div>
							</div>
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-info">{aiStats.reviewed}</div>
								<div className="text-xs text-base-content/60">Reviewed</div>
							</div>
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-success">{aiStats.actionTaken}</div>
								<div className="text-xs text-base-content/60">Action Taken</div>
							</div>
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-neutral">{aiStats.dismissed}</div>
								<div className="text-xs text-base-content/60">Dismissed</div>
							</div>
							<div className="bg-base-100 rounded-lg p-3 text-center">
								<div className="text-2xl font-bold text-purple-500">{(aiStats.avgConfidence * 100).toFixed(0)}%</div>
								<div className="text-xs text-base-content/60">Avg Confidence</div>
							</div>
						</div>
					)}

					{/* AI Reports Table */}
					{aiReports.length === 0 ? (
						<div className="text-center text-success py-8">
							<Shield className="w-12 h-12 mx-auto mb-2 text-success" />
							<p className="font-semibold">No AI-detected violations!</p>
							<p className="text-sm text-base-content/60">The system is monitoring content in real-time</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table w-full table-zebra table-sm sm:table-md">
								<thead>
									<tr className="text-xs sm:text-sm text-center">
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
										<tr key={report._id} className="text-center text-xs sm:text-sm">
											<td>{new Date(report.createdAt).toLocaleString()}</td>
											<td>
												<div className="flex items-center justify-center gap-2">
													<img 
														src={report.reportedUser?.profilePic || '/avatar.png'} 
														alt="" 
														className="w-6 h-6 rounded-full"
													/>
													<span>{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</span>
												</div>
											</td>
											<td>
												<span className="badge badge-error badge-sm">
													{report.aiCategory || 'Unknown'}
												</span>
											</td>
											<td>
												<div className="flex items-center justify-center gap-1">
													<div className="w-16 bg-base-300 rounded-full h-2">
														<div 
															className="bg-purple-500 h-2 rounded-full" 
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
													className="btn btn-ghost btn-xs"
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
													{report.status}
												</span>
											</td>
											<td>
												<div className="flex flex-wrap justify-center gap-1">
													{report.status === 'pending' && (
														<button
															onClick={() => onUpdateReportStatus(report._id, 'reviewed')}
															className="btn btn-info btn-xs"
														>
															<Eye size={12} /> Review
														</button>
													)}
													{report.status === 'reviewed' && (
														<>
															<button
																onClick={() => onUpdateReportStatus(report._id, 'action_taken')}
																className="btn btn-success btn-xs"
															>
																<CheckCircle size={12} /> Action
															</button>
															<button
																onClick={() => onUpdateReportStatus(report._id, 'dismissed')}
																className="btn btn-neutral btn-xs"
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
				</>
			)}
		</div>
	);
};

export default AIModerationPanel;
