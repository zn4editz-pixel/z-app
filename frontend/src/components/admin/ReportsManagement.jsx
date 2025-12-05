import { AlertTriangle, ExternalLink, Eye, CheckCircle, XCircle } from "lucide-react";

const ReportsManagement = ({ 
	reports, 
	loadingReports, 
	onUpdateReportStatus,
	onDeleteReport 
}) => {
	return (
		<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/20 flex items-center justify-center">
					<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
				</div>
				<div>
					<h2 className="text-xl sm:text-2xl font-semibold">User-Submitted Reports</h2>
					<p className="text-xs sm:text-sm text-base-content/60">{reports.length} total reports</p>
				</div>
			</div>

			{loadingReports ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : reports.length === 0 ? (
				<div className="text-center text-info py-8">
					<AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-30" />
					<p>No pending reports found.</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="table w-full table-zebra table-sm sm:table-md">
						<thead>
							<tr className="text-xs sm:text-sm text-center">
								<th>Date</th>
								<th>Reporter</th>
								<th>Reported User</th>
								<th>Reason</th>
								<th>Screenshot</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{reports.map((report) => (
								<tr key={report._id} className="text-center text-xs sm:text-sm">
									<td>{new Date(report.createdAt).toLocaleString()}</td>
									<td>
										{report.isAIDetected ? (
											<span className="badge badge-purple badge-xs">AI Auto-Report</span>
										) : (
											report.reporter?.nickname || report.reporter?.username || 'N/A'
										)}
									</td>
									<td>{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</td>
									<td>
										{report.reason}
										{report.isAIDetected && (
											<span className="badge badge-purple badge-xs ml-1">AI</span>
										)}
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
										<span className={`badge ${
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
		</div>
	);
};

export default ReportsManagement;
