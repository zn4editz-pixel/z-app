import { Users, Ban, Trash2, BadgeCheck, Search, Shield } from "lucide-react";
import { useState } from "react";
import VerifiedBadge from "../VerifiedBadge";
import CountryFlag from "../CountryFlag";

// Format last seen time in a user-friendly way
const formatLastSeen = (lastSeenDate) => {
	if (!lastSeenDate) return null;
	
	const now = new Date();
	const lastSeen = new Date(lastSeenDate);
	const diffMs = now - lastSeen;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);
	
	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	
	// For older dates, show full date and time
	return lastSeen.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

const UserManagement = ({ 
	users, 
	loadingUsers, 
	onSuspend, 
	onUnsuspend, 
	onDelete, 
	onToggleVerification 
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [suspendModal, setSuspendModal] = useState({ open: false, userId: null, username: "" });
	const [suspendReason, setSuspendReason] = useState("Violation of terms");
	const [suspendDuration, setSuspendDuration] = useState("7d");
	const [customReason, setCustomReason] = useState("");

	const filteredUsers = users.filter(user => 
		user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.email?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleSuspendClick = (userId, username) => {
		setSuspendModal({ open: true, userId, username });
		setSuspendReason("Violation of terms");
		setSuspendDuration("7d");
		setCustomReason("");
	};

	const handleSuspendConfirm = () => {
		const finalReason = suspendReason === "Other" ? customReason : suspendReason;
		if (!finalReason.trim()) {
			alert("Please provide a reason for suspension");
			return;
		}
		onSuspend(suspendModal.userId, finalReason, suspendDuration);
		setSuspendModal({ open: false, userId: null, username: "" });
	};

	const suspendReasons = [
		"Violation of terms",
		"Harassment or hate speech",
		"Spam or scam activity",
		"Inappropriate content",
		"Underage user",
		"Multiple reports",
		"Other"
	];

	const suspendDurations = [
		{ value: "1h", label: "1 Hour" },
		{ value: "6h", label: "6 Hours" },
		{ value: "24h", label: "24 Hours" },
		{ value: "3d", label: "3 Days" },
		{ value: "7d", label: "7 Days" },
		{ value: "14d", label: "14 Days" },
		{ value: "30d", label: "30 Days" },
		{ value: "90d", label: "90 Days" },
	];

	return (
		<div className="bg-base-100/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-base-300">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
				<div>
					<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
							<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
						</div>
						User Management
					</h2>
					<p className="text-sm sm:text-base text-base-content/70 mt-2 ml-1">
						{loadingUsers ? "Loading..." : `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found`}
					</p>
				</div>

				{/* Search */}
				<div className="relative w-full sm:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-base-content/50 pointer-events-none z-10" />
					<input
						type="text"
						placeholder="Search users..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="input input-bordered input-sm sm:input-md w-full sm:w-72 pl-9 sm:pl-10 pr-3 bg-base-200/50 focus:bg-base-100 transition-colors border-base-300 focus:border-primary"
					/>
				</div>
			</div>

			{loadingUsers ? (
				<div className="flex flex-col items-center justify-center py-16">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="text-sm text-base-content/60 mt-4">Loading users...</p>
				</div>
			) : filteredUsers.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-base-content/60">
					<div className="p-4 bg-base-200 rounded-full mb-4">
						<Users className="w-12 h-12 opacity-50" />
					</div>
					<p className="text-lg font-medium">No users found</p>
					<p className="text-sm mt-1">
						{searchTerm ? "Try adjusting your search" : "No users in the system yet"}
					</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-base-300">
					<table className="table w-full">
						<thead className="bg-base-200">
							<tr className="text-xs sm:text-sm border-b border-base-300">
								<th className="bg-base-200">User</th>
								<th className="bg-base-200">Email</th>
								<th className="bg-base-200">Location</th>
								<th className="bg-base-200">Status</th>
								<th className="bg-base-200">Joined</th>
								<th className="bg-base-200">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map((user) => (
								<tr key={user._id} className="text-xs sm:text-sm hover:bg-base-200/50 transition-colors border-b border-base-300 last:border-0">
									<td>
										<div className="flex items-center gap-2">
											<div className="avatar">
												<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full">
													<img src={user.profilePic || "/avatar.png"} alt={user.username} />
												</div>
											</div>
											<div>
												<div className="font-semibold flex items-center gap-1">
													{user.nickname || user.username}
													{user.isVerified && <VerifiedBadge size="sm" />}
												</div>
												<div className="text-xs text-base-content/60">@{user.username}</div>
											</div>
										</div>
									</td>
									<td className="text-xs">{user.email}</td>
									<td>
										<div className="flex flex-col gap-1">
											{user.country && user.country !== 'Unknown' ? (
												<>
													<div className="flex items-center gap-1">
														{user.countryCode && user.countryCode !== 'XX' && (
															<CountryFlag countryCode={user.countryCode} size="sm" />
														)}
														<span className="text-xs font-medium">
															{user.city && user.city !== 'Unknown' ? `${user.city}, ` : ''}{user.country}
														</span>
													</div>
													<div className="flex items-center gap-1">
														{user.isVPN && (
															<span className="badge badge-warning badge-xs gap-1">
																<Shield className="w-3 h-3" />
																VPN
															</span>
														)}
														{user.lastIP && (
															<span className="text-xs text-base-content/40 font-mono">{user.lastIP}</span>
														)}
													</div>
												</>
											) : (
												<span className="text-xs text-base-content/40">Unknown</span>
											)}
										</div>
									</td>
									<td>
										<div className="flex flex-col gap-1">
											{user.isSuspended ? (
												<span className="badge badge-error badge-xs sm:badge-sm">Suspended</span>
											) : user.isOnline ? (
												<span className="badge badge-success badge-xs sm:badge-sm">Online</span>
											) : (
												<>
													<span className="badge badge-ghost badge-xs sm:badge-sm">Offline</span>
													{user.lastSeen && (
														<span className="text-xs text-base-content/50" title={new Date(user.lastSeen).toLocaleString()}>
															{formatLastSeen(user.lastSeen)}
														</span>
													)}
												</>
											)}
										</div>
									</td>
									<td className="text-xs">
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
									<td>
										<div className="flex flex-wrap gap-1">
											{user.isSuspended ? (
												<button
													onClick={() => onUnsuspend(user._id)}
													className="btn btn-success btn-xs"
													title="Unsuspend"
												>
													Unsuspend
												</button>
											) : (
												<button
													onClick={() => handleSuspendClick(user._id, user.nickname || user.username)}
													className="btn btn-warning btn-xs"
													title="Suspend"
												>
													<Ban className="w-3 h-3" />
												</button>
											)}
											<button
												onClick={() => onToggleVerification(user._id)}
												className={`btn btn-xs ${user.isVerified ? 'btn-ghost' : 'btn-info'}`}
												title={user.isVerified ? "Remove Verification" : "Verify"}
											>
												<BadgeCheck className="w-3 h-3" />
											</button>
											<button
												onClick={() => onDelete(user._id)}
												className="btn btn-error btn-xs"
												title="Delete"
											>
												<Trash2 className="w-3 h-3" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Suspension Modal - Fixed Centered with Blur */}
			{suspendModal.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
					<div 
						className="absolute inset-0" 
						onClick={() => setSuspendModal({ open: false, userId: null, username: "" })}
					/>
					<div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
						<div className="p-6">
							<h3 className="font-bold text-xl mb-2">Suspend User</h3>
							<p className="text-sm text-base-content/70 mb-6">
								You are about to suspend <span className="font-semibold text-warning">{suspendModal.username}</span>
							</p>

							{/* Reason Selection */}
							<div className="form-control mb-4">
								<label className="label">
									<span className="label-text font-medium">Reason for Suspension</span>
								</label>
								<select 
									className="select select-bordered w-full"
									value={suspendReason}
									onChange={(e) => setSuspendReason(e.target.value)}
								>
									{suspendReasons.map(reason => (
										<option key={reason} value={reason}>{reason}</option>
									))}
								</select>
							</div>

							{/* Custom Reason Input */}
							{suspendReason === "Other" && (
								<div className="form-control mb-4">
									<label className="label">
										<span className="label-text font-medium">Custom Reason</span>
									</label>
									<textarea
										className="textarea textarea-bordered w-full"
										placeholder="Enter custom reason..."
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										rows={3}
									/>
								</div>
							)}

							{/* Duration Selection */}
							<div className="form-control mb-6">
								<label className="label">
									<span className="label-text font-medium">Suspension Duration</span>
								</label>
								<select 
									className="select select-bordered w-full"
									value={suspendDuration}
									onChange={(e) => setSuspendDuration(e.target.value)}
								>
									{suspendDurations.map(duration => (
										<option key={duration.value} value={duration.value}>
											{duration.label}
										</option>
									))}
								</select>
							</div>

							{/* Actions */}
							<div className="flex gap-3 justify-end">
								<button 
									className="btn btn-ghost"
									onClick={() => setSuspendModal({ open: false, userId: null, username: "" })}
								>
									Cancel
								</button>
								<button 
									className="btn btn-warning"
									onClick={handleSuspendConfirm}
								>
									Suspend User
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes scaleIn {
					from { 
						opacity: 0;
						transform: scale(0.95);
					}
					to { 
						opacity: 1;
						transform: scale(1);
					}
				}
				.animate-fadeIn {
					animation: fadeIn 0.2s ease-out;
				}
				.animate-scaleIn {
					animation: scaleIn 0.3s ease-out;
				}
			`}</style>
		</div>
	);
};

export default UserManagement;
