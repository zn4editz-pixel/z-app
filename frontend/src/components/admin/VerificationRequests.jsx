import { BadgeCheck, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import VerifiedBadge from "../VerifiedBadge";

const VerificationRequests = ({ 
	verificationRequests, 
	loadingVerifications, 
	onApprove, 
	onReject 
}) => {
	return (
		<div className="bg-base-100 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-info/20 flex items-center justify-center">
					<BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
				</div>
				<div>
					<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold flex items-center gap-2">
						Verification Requests
					</h2>
					<p className="text-xs sm:text-sm text-base-content/60">
						{verificationRequests.length} pending requests
					</p>
				</div>
			</div>

			{loadingVerifications ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : verificationRequests.length === 0 ? (
				<div className="text-center py-8 text-base-content/60">
					<BadgeCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
					<p>No pending verification requests</p>
				</div>
			) : (
				<div className="space-y-4">
					{verificationRequests.map((user) => (
						<div
							key={user._id}
							className="card bg-base-200 border border-base-300"
						>
							<div className="card-body p-4">
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
									{/* User Info */}
									<div className="flex items-center gap-4 flex-1">
										<div className="avatar">
											<div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
												<img
													src={user.profilePic || "/avatar.png"}
													alt={user.username}
												/>
											</div>
										</div>
										<div>
											<h3 className="font-semibold text-lg">
												{user.nickname || user.username}
											</h3>
											<p className="text-sm text-base-content/60">
												@{user.username}
											</p>
											<p className="text-xs text-base-content/50">
												{user.email}
											</p>
										</div>
									</div>

									{/* Verification Document */}
									{user.verificationDocument && (
										<div className="flex-shrink-0">
											<a
												href={user.verificationDocument}
												target="_blank"
												rel="noopener noreferrer"
												className="btn btn-sm btn-outline gap-2"
											>
												<ExternalLink className="w-4 h-4" />
												View Document
											</a>
										</div>
									)}

									{/* Actions */}
									<div className="flex gap-2 flex-shrink-0">
										<button
											onClick={() => onApprove(user._id)}
											className="btn btn-success btn-sm gap-2"
										>
											<CheckCircle className="w-4 h-4" />
											Approve
										</button>
										<button
											onClick={() => onReject(user._id)}
											className="btn btn-error btn-sm gap-2"
										>
											<XCircle className="w-4 h-4" />
											Reject
										</button>
									</div>
								</div>

								{/* Request Date */}
								<div className="text-xs text-base-content/50 mt-2">
									Requested: {new Date(user.verificationRequestedAt || user.createdAt).toLocaleString()}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default VerificationRequests;
