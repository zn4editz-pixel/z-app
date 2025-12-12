import { BadgeCheck, CheckCircle, XCircle, ExternalLink } from "lucide-react";

const VerificationRequests = ({ 
	verificationRequests, 
	loadingVerifications, 
	onApprove, 
	onReject 
}) => {
	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-info/20">
				<div className="flex items-center gap-4">
					<div className="bg-gradient-to-br from-info to-blue-600 p-4 rounded-2xl shadow-lg">
						<BadgeCheck className="w-8 h-8 text-white" />
					</div>
					<div>
						<h2 className="text-3xl font-black text-info">
							VERIFICATION REQUESTS
						</h2>
						<p className="text-base-content/70 mt-1 flex items-center gap-2">
							<BadgeCheck className="w-4 h-4 text-info" />
							{verificationRequests?.length || 0} pending verification requests
						</p>
					</div>
				</div>
			</div>

			{/* Verification Requests */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-info/20">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-xl font-bold text-info flex items-center gap-2">
						<BadgeCheck className="w-5 h-5" />
						Pending Verifications
					</h3>
					<div className="badge badge-info badge-lg">
						{verificationRequests?.length || 0} Requests
					</div>
				</div>

				{loadingVerifications ? (
					<div className="flex flex-col items-center justify-center py-16">
						<span className="loading loading-spinner loading-lg text-info"></span>
						<p className="text-base-content/70 mt-4">Loading verification requests...</p>
					</div>
				) : !verificationRequests || verificationRequests.length === 0 ? (
					<div className="text-center py-16">
						<BadgeCheck className="w-20 h-20 mx-auto mb-4 text-success" />
						<p className="text-xl font-bold text-success">No pending verification requests!</p>
						<p className="text-base-content/60 mt-2">All verification requests have been processed</p>
					</div>
				) : (
					<div className="space-y-4">
						{verificationRequests.map((user) => (
							<div
								key={user.id}
								className="bg-gradient-to-br from-base-200/50 to-base-300/50 rounded-2xl p-6 shadow-lg border border-info/30 hover:shadow-xl transition-all duration-200"
							>
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
									{/* User Info */}
									<div className="flex items-center gap-4 flex-1">
										<div className="avatar">
											<div className="w-16 h-16 rounded-full ring-4 ring-info/50 ring-offset-2">
												<img
													src={user.profilePic || "/avatar.png"}
													alt={user.username}
												/>
											</div>
										</div>
										<div>
											<h3 className="font-bold text-lg text-base-content">
												{user.nickname || user.username}
											</h3>
											<p className="text-sm text-base-content/70">
												@{user.username}
											</p>
											<p className="text-xs text-base-content/60">
												{user.email}
											</p>
										</div>
									</div>

									{/* Actions */}
									<div className="flex gap-3 flex-shrink-0">
										<button
											onClick={() => onApprove(user.id)}
											className="btn btn-sm btn-success gap-2 hover:scale-105 transition-all duration-200"
										>
											<CheckCircle className="w-4 h-4" />
											Approve
										</button>
										<button
											onClick={() => onReject(user.id)}
											className="btn btn-sm btn-error gap-2 hover:scale-105 transition-all duration-200"
										>
											<XCircle className="w-4 h-4" />
											Reject
										</button>
									</div>
								</div>

								{/* Verification Details */}
								<div className="mt-4 space-y-3 border-t border-base-300 pt-4">
									{/* Reason */}
									{user.verificationReason && (
										<div>
											<p className="text-sm font-semibold text-base-content/70 mb-1">Reason for Verification:</p>
											<p className="text-sm bg-base-300/50 p-3 rounded-lg">{user.verificationReason}</p>
										</div>
									)}

									{/* ID Proof Document */}
									{user.verificationIdProof && (
										<div>
											<p className="text-sm font-semibold text-base-content/70 mb-2">ID Proof Document:</p>
											<div className="flex flex-col sm:flex-row gap-3">
												{/* Preview Image */}
												<div className="flex-shrink-0">
													<img
														src={user.verificationIdProof}
														alt="ID Proof"
														className="w-full sm:w-48 h-32 object-cover rounded-lg border-2 border-base-300 cursor-pointer hover:border-info transition-colors"
														onClick={() => window.open(user.verificationIdProof, '_blank')}
													/>
												</div>
												{/* View Button */}
												<div className="flex items-center">
													<a
														href={user.verificationIdProof}
														target="_blank"
														rel="noopener noreferrer"
														className="btn btn-outline btn-sm gap-2"
													>
														<ExternalLink className="w-4 h-4" />
														View Full Size
													</a>
												</div>
											</div>
										</div>
									)}

									{/* Request Date */}
									<div className="text-xs text-base-content/50">
										Requested: {new Date(user.verificationRequestedAt || user.createdAt).toLocaleString()}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default VerificationRequests;