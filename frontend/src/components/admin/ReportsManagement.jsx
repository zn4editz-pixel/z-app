import { AlertTriangle, ExternalLink, Eye, CheckCircle, XCircle, Brain, TrendingUp, Zap } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { analyzeReport, batchAnalyzeReports, getReportStatistics, SEVERITY_LEVELS } from "../../utils/aiReportAnalysis";

const ReportsManagement = ({ 
	reports, 
	loadingReports, 
	onUpdateReportStatus,
	onDeleteReport 
}) => {
	const [analyzedReports, setAnalyzedReports] = useState([]);
	const [showAIInsights, setShowAIInsights] = useState(true);
	const [sortBy, setSortBy] = useState('priority'); // priority, date, severity

	// Analyze reports with AI when they load
	useEffect(() => {
		if (reports && reports.length > 0) {
			const analyzed = batchAnalyzeReports(reports);
			setAnalyzedReports(analyzed);
		} else {
			setAnalyzedReports([]);
		}
	}, [reports]);

	// Get AI statistics
	const aiStats = useMemo(() => {
		if (analyzedReports.length === 0) return null;
		return getReportStatistics(analyzedReports);
	}, [analyzedReports]);

	// Sort reports
	const sortedReports = useMemo(() => {
		const sorted = [...analyzedReports];
		switch (sortBy) {
			case 'priority':
				return sorted.sort((a, b) => b.aiAnalysis.priority - a.aiAnalysis.priority);
			case 'severity':
				return sorted.sort((a, b) => b.aiAnalysis.severity.level - a.aiAnalysis.severity.level);
			case 'date':
				return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
			default:
				return sorted;
		}
	}, [analyzedReports, sortBy]);

	// Get severity badge color
	const getSeverityColor = (severity) => {
		switch (severity.label) {
			case 'Critical': return 'badge-error';
			case 'High': return 'badge-warning';
			case 'Medium': return 'badge-info';
			case 'Low': return 'badge-success';
			default: return 'badge-neutral';
		}
	};

	// Get category label
	const getCategoryLabel = (category) => {
		return category.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	};

	return (
		<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/20 flex items-center justify-center">
						<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
					</div>
					<div>
						<h2 className="text-xl sm:text-2xl font-semibold">User-Submitted Reports</h2>
						<p className="text-xs sm:text-sm text-base-content/60">{reports.length} total reports</p>
					</div>
				</div>
				<button
					onClick={() => setShowAIInsights(!showAIInsights)}
					className="btn btn-sm btn-ghost gap-2"
				>
					<Brain className="w-4 h-4" />
					AI Insights
				</button>
			</div>

			{/* AI Insights Panel */}
			{showAIInsights && aiStats && (
				<div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
					<div className="flex items-center gap-2 mb-3">
						<Brain className="w-5 h-5 text-primary" />
						<h3 className="font-semibold text-primary">AI Analysis Summary</h3>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div className="bg-base-100 rounded-lg p-3">
							<div className="text-2xl font-bold text-error">{aiStats.requiresImmediate}</div>
							<div className="text-xs text-base-content/60">Urgent</div>
						</div>
						<div className="bg-base-100 rounded-lg p-3">
							<div className="text-2xl font-bold text-warning">{aiStats.bySeverity?.High || 0}</div>
							<div className="text-xs text-base-content/60">High Priority</div>
						</div>
						<div className="bg-base-100 rounded-lg p-3">
							<div className="text-2xl font-bold text-success">{aiStats.autoResolvable}</div>
							<div className="text-xs text-base-content/60">Auto-Resolvable</div>
						</div>
						<div className="bg-base-100 rounded-lg p-3">
							<div className="text-2xl font-bold text-base-content">{Math.round(aiStats.avgConfidence * 100)}%</div>
							<div className="text-xs text-base-content/60">Avg Confidence</div>
						</div>
					</div>
				</div>
			)}

			{/* Sort Controls */}
			<div className="flex gap-2 mb-4">
				<button
					onClick={() => setSortBy('priority')}
					className={`btn btn-sm ${sortBy === 'priority' ? 'btn-primary' : 'btn-ghost'}`}
				>
					<TrendingUp className="w-4 h-4" /> Priority
				</button>
				<button
					onClick={() => setSortBy('severity')}
					className={`btn btn-sm ${sortBy === 'severity' ? 'btn-primary' : 'btn-ghost'}`}
				>
					<Zap className="w-4 h-4" /> Severity
				</button>
				<button
					onClick={() => setSortBy('date')}
					className={`btn btn-sm ${sortBy === 'date' ? 'btn-primary' : 'btn-ghost'}`}
				>
					Date
				</button>
			</div>

			{loadingReports ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : reports.length === 0 ? (
				<div className="text-center text-base-content/60 py-8">
					<AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-30" />
					<p>No pending reports found.</p>
				</div>
			) : (
				<div className="space-y-3">
					{sortedReports.map((report) => {
						const ai = report.aiAnalysis;
						return (
							<div 
								key={report.id} 
								className={`card bg-base-200 shadow-md border-l-4 ${
									ai.requiresImmediate ? 'border-error animate-pulse' :
									ai.severity.level >= 4 ? 'border-warning' :
									ai.severity.level >= 3 ? 'border-base-content/30' :
									'border-success'
								}`}
							>
								<div className="card-body p-4">
									{/* Header with AI Badges */}
									<div className="flex flex-wrap items-start justify-between gap-2 mb-2">
										<div className="flex flex-wrap gap-2">
											<span className={`badge ${getSeverityColor(ai.severity)}`}>
												{ai.severity.label}
											</span>
											<span className="badge badge-outline">
												{getCategoryLabel(ai.category)}
											</span>
											{ai.requiresImmediate && (
												<span className="badge badge-error gap-1">
													<Zap className="w-3 h-3" /> URGENT
												</span>
											)}
											{ai.autoResolvable && (
												<span className="badge badge-success gap-1">
													<Brain className="w-3 h-3" /> Auto-Resolvable
												</span>
											)}
											<span className="badge badge-ghost">
												{Math.round(ai.confidence * 100)}% confidence
											</span>
										</div>
										<span className={`badge ${
											report.status === 'pending' ? 'badge-warning' :
											report.status === 'reviewed' ? 'badge-info' :
											report.status === 'action_taken' ? 'badge-success' :
											'badge-neutral'
										}`}>
											{report.status}
										</span>
									</div>

									{/* AI Summary */}
									<div className="bg-primary/5 rounded p-2 mb-2">
										<div className="flex items-start gap-2">
											<Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
											<div className="text-sm">
												<div className="font-semibold text-primary mb-1">{ai.summary}</div>
												<div className="text-xs text-base-content/70">
													<strong>Suggested Action:</strong> {ai.suggestedAction.action.replace(/_/g, ' ')} 
													{ai.suggestedAction.duration && ` (${ai.suggestedAction.duration})`}
													<br />
													<strong>Reason:</strong> {ai.suggestedAction.reason}
												</div>
											</div>
										</div>
									</div>

									{/* Report Details */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
										<div>
											<span className="text-base-content/60">Reporter:</span>{' '}
											{report.isAIDetected ? (
												<span className="badge badge-purple badge-xs">AI Auto-Report</span>
											) : (
												<span className="font-medium">
													{report.reporter?.nickname || report.reporter?.username || 'N/A'}
												</span>
											)}
										</div>
										<div>
											<span className="text-base-content/60">Reported User:</span>{' '}
											<span className="font-medium">
												{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}
											</span>
										</div>
										<div>
											<span className="text-base-content/60">Date:</span>{' '}
											<span className="font-medium">
												{new Date(report.createdAt).toLocaleString()}
											</span>
										</div>
										<div>
											<span className="text-base-content/60">Priority Score:</span>{' '}
											<span className="font-medium">{ai.priority}/100</span>
										</div>
									</div>

									{/* Original Reason */}
									<div className="mt-2">
										<div className="text-xs text-base-content/60 mb-1">Original Report:</div>
										<div className="text-sm bg-base-100 rounded p-2">
											<strong>{report.reason}</strong>
											{report.description && (
												<p className="mt-1 text-base-content/70">{report.description}</p>
											)}
										</div>
									</div>

									{/* Patterns Detected */}
									{ai.patterns && ai.patterns.length > 0 && (
										<div className="mt-2">
											<div className="text-xs text-base-content/60 mb-1">Patterns Detected:</div>
											<div className="flex flex-wrap gap-1">
												{ai.patterns.map((pattern, idx) => (
													<span key={idx} className="badge badge-sm badge-warning" title={pattern.description}>
														{pattern.type.replace(/_/g, ' ')}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Actions */}
									<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-300">
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
													<CheckCircle className="w-4 h-4" /> Take Action
												</button>
												<button
													onClick={() => onUpdateReportStatus(report.id, 'dismissed')}
													className="btn btn-sm btn-neutral gap-1"
												>
													<XCircle className="w-4 h-4" /> Dismiss
												</button>
											</>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default ReportsManagement;
