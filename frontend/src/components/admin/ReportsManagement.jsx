import { AlertTriangle, ExternalLink, Eye, CheckCircle, XCircle, Users, Shield } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const ReportsManagement = ({ 
	reports, 
	loadingReports, 
	onUpdateReportStatus,
	onDeleteReport 
}) => {
	const [sortBy, setSortBy] = useState('date');

	// Simple statistics
	const stats = useMemo(() => {
		if (!reports || reports.length === 0) return null;
		return {
			pending: reports.filter(r => r.status === 'pending').length,
			reviewed: reports.filter(r => r.status === 'reviewed').length,
			resolved: reports.filter(r => r.status === 'action_taken').length,
			total: reports.length
		};
	}, [reports]);

	// Sort reports
	const sortedReports = useMemo(() => {
		if (!reports) return [];
		const sorted = [...reports];
		switch (sortBy) {
			case 'status':
				return sorted.sort((a, b) => {
					const statusOrder = { 'pending': 0, 'reviewed': 1, 'action_taken': 2, 'dismissed': 3 };
					return statusOrder[a.status] - statusOrder[b.status];
				});
			case 'date':
				return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
			default:
				return sorted;
		}
	}, [reports, sortBy]);

	// Get status badge color
	const getStatusColor = (status) => {
		switch (status) {
			case 'pending': return 'badge-warning';
			case 'reviewed': return 'badge-info';
			case 'action_taken': return 'badge-success';
			case 'dismissed': return 'badge-neutral';
			default: return 'badge-neutral';
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-warning/20">
				<div className="flex items-center gap-4">
					<div className="bg-gradient-to-br from-warning to-orange-500 p-4 rounded-2xl shadow-lg">
						<AlertTriangle className="w-8 h-8 text-white" />
					</div>
					<div>
						<h2 className="text-3xl font-black text-warning">
							REPORTS MANAGEMENT
						</h2>
						<p className="text-base-content/70 mt-1 flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 text-warning" />
							{reports?.length || 0} total reports requiring review
						</p>
					</div>
				</div>

				{/* Statistics */}
				{stats && (
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
						<div className="bg-gradient-to-br from-warning/10 to-orange-500/10 rounded-xl p-4 text-center border border-warning/20">
							<div className="text-2xl font-bold text-warning">{stats.pending}</div>
							<div className="text-xs font-medium text-base-content/60">Pending</div>
						</div>
						<div className="bg-gradient-to-br from-info/10 to-blue-500/10 rounded-xl p-4 text-center border border-info/20">
							<div className="text-2xl font-bold text-info">{stats.reviewed}</div>
							<div className="text-xs font-medium text-base-content/60">Reviewed</div>
						</div>
						<div className="bg-gradient-to-br from-success/10 to-green-500/10 rounded-xl p-4 text-center border border-success/20">
							<div className="text-2xl font-bold text-success">{stats.resolved}</div>
							<div className="text-xs font-medium text-base-content/60">Resolved</div>
						</div>
						<div className="bg-gradient-to-br from-base-300/50 to-base-200/50 rounded-xl p-4 text-center border border-base-300/20">
							<div className="text-2xl font-bold text-base-content">{stats.total}</div>
							<div className="text-xs font-medium text-base-content/60">Total</div>
						</div>
					</div>
				)}
			</div>

			{/* Sort Controls */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-warning/20">
				<div className="flex gap-2">
					<button
						onClick={() => setSortBy('date')}
						className={`btn btn-sm transition-all duration-200 ${
							sortBy === 'date' 
								? 'btn-warning' 
								: 'btn-outline btn-warning'
						}`}
					>
						Date
					</button>
					<button
						onClick={() => setSortBy('status')}
						className={`btn btn-sm transition-all duration-200 ${
							sortBy === 'status' 
								? 'btn-warning' 
								: 'btn-outline btn-warning'
						}`}
					>
						Status
					</button>
				</div>
			</div>

			{/* Reports List */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-warning/20">
				{loadingReports ? (
					<div className="flex flex-col items-center justify-center py-16">
						<span className="loading loading-spinner loading-lg text-warning"></span>
						<p className="text-base-content/70 mt-4">Loading reports...</p>
					</div>
				) : !reports || reports.length === 0 ? (
					<div className="text-center py-16">
						<AlertTriangle className="w-20 h-20 mx-auto mb-4 text-success" />
						<p className="text-xl font-bold text-success">No reports found!</p>
						<p className="text-base-content/60 mt-2">All reports have been processed</p>
					</div>
				) : (
					<div className="space-y-4">
						{sortedReports.map((report) => (
							<div 
								key={report.id} 
								className="bg-gradient-to-br from-base-200/50 to-base-300/50 rounded-2xl p-6 shadow-lg border border-base-300/30 hover:shadow-xl transition-all duration-200"
							>
								{/* Header with Status */}
								<div className="flex flex-wrap items-start justify-between gap-2 mb-4">
									<div className="flex flex-wrap gap-2">
										<span className={`badge ${getStatusColor(report.status)}`}>
											{report.status.replace('_', ' ').toUpperCase()}
										</span>
										<span className="badge badge-outline">
											{report.reason}
										</span>
									</div>
									<span className="text-xs text-base-content/60">
										{new Date(report.createdAt).toLocaleString()}
									</span>
								</div>

								{/* Report Details */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
									{/* Reporter */}
									<div className="bg-success/10 rounded-lg p-3 border border-success/30">
										<div className="text-xs text-success font-bold mb-2 flex items-center gap-1">
											<Users className="w-3 h-3" />
											REPORTER
										</div>
										<div className="flex items-center gap-2">
											<div className="avatar">
												<div className="w-10 h-10 rounded-full ring ring-success ring-offset-2">
													<img 
														src={report.reporter?.profilePic || '/avatar.png'} 
														alt="Reporter" 
													/>
												</div>
											</div>
											<div>
												<div className="font-semibold text-sm">
													{report.reporter?.nickname || report.reporter?.username || 'Anonymous'}
												</div>
												<div className="text-xs text-base-content/60">
													{report.reporter?.email || 'N/A'}
												</div>
											</div>
										</div>
									</div>

									{/* Reported User */}
									<div className="bg-error/10 rounded-lg p-3 border border-error/30">
										<div className="text-xs text-error font-bold mb-2 flex items-center gap-1">
											<AlertTriangle className="w-3 h-3" />
											REPORTED USER
										</div>
										<div className="flex items-center gap-2">
											<div className="avatar">
												<div className="w-10 h-10 rounded-full ring ring-error ring-offset-2">
													<img 
														src={report.reportedUser?.profilePic || '/avatar.png'} 
														alt="Reported User" 
													/>
												</div>
											</div>
											<div>
												<div className="font-semibold text-sm">
													{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}
												</div>
												<div className="text-xs text-base-content/60">
													{report.reportedUser?.email || 'N/A'}
												</div>
											</div>
										</div>
									</div>

									{/* Evidence */}
									<div className="bg-warning/10 rounded-lg p-3 border border-warning/30">
										<div className="text-xs text-warning font-bold mb-2 flex items-center gap-1">
											<Shield className="w-3 h-3" />
											EVIDENCE
										</div>
										{report.screenshot ? (
											<div className="flex items-center gap-2">
												<div className="w-16 h-16 rounded-lg border-2 border-error overflow-hidden bg-black">
													<img 
														src={report.screenshot} 
														alt="Evidence"
														className="w-full h-full object-cover"
													/>
												</div>
												<a
													href={report.screenshot}
													target="_blank"
													rel="noopener noreferrer"
													className="btn btn-error btn-xs gap-1"
												>
													<ExternalLink className="w-3 h-3" /> View
												</a>
											</div>
										) : (
											<div className="text-xs text-base-content/50">
												No evidence provided
											</div>
										)}
									</div>
								</div>

								{/* Description */}
								{report.description && (
									<div className="bg-base-100/50 rounded p-3 mb-4">
										<div className="text-xs text-base-content/60 mb-1">Description:</div>
										<div className="text-sm">{report.description}</div>
									</div>
								)}

								{/* Actions */}
								<div className="flex flex-wrap gap-2 pt-3 border-t border-base-300">
									{report.screenshot && (
										<a
											href={report.screenshot}
											target="_blank"
											rel="noopener noreferrer"
											className="btn btn-sm btn-ghost gap-1"
										>
											<ExternalLink className="w-4 h-4" /> Evidence
										</a>
									)}
									{report.status === 'pending' && (
										<button
											onClick={() => onUpdateReportStatus(report.id, 'reviewed')}
											className="btn btn-sm btn-info gap-1"
										>
											<Eye className="w-4 h-4" /> Review
										</button>
									)}
									{report.status === 'reviewed' && (
										<>
											<button
												onClick={() => onUpdateReportStatus(report.id, 'action_taken')}
												className="btn btn-sm btn-success gap-1"
											>
												<CheckCircle className="w-4 h-4" /> Resolve
											</button>
											<button
												onClick={() => onUpdateReportStatus(report.id, 'dismissed')}
												className="btn btn-sm btn-neutral gap-1"
											>
												<XCircle className="w-4 h-4" /> Dismiss
											</button>
										</>
									)}
									<button
										onClick={() => onDeleteReport(report.id)}
										className="btn btn-sm btn-error gap-1"
									>
										<XCircle className="w-4 h-4" /> Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportsManagement;