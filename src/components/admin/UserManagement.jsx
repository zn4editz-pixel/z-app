import { Users, Ban, Trash2, BadgeCheck, Search, Shield, UserCheck, Activity, Clock } from "lucide-react";
import { useState, useMemo } from "react";
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
	const [filterStatus, setFilterStatus] = useState("all");
	const [suspendModal, setSuspendModal] = useState({ open: false, userId: null, username: "" });
	const [suspendReason, setSuspendReason] = useState("Violation of terms");
	const [suspendDuration, setSuspendDuration] = useState("7d");

	// Optimized filtering with useMemo
	const filteredUsers = useMemo(() => {
		return users
			.filter(user => {
				const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
									user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
									(user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
				
				const matchesFilter = filterStatus === "all" || 
									(filterStatus === "online" && user.isOnline) ||
									(filterStatus === "verified" && user.isVerified) ||
									(filterStatus === "suspended" && user.isSuspended);
				
				return matchesSearch && matchesFilter;
			})
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}, [users, searchTerm, filterStatus]);

	const handleSuspend = (userId, username) => {
		setSuspendModal({ open: true, userId, username });
	};

	const confirmSuspend = () => {
		if (suspendModal.userId) {
			onSuspend(suspendModal.userId, suspendReason, suspendDuration);
			setSuspendModal({ open: false, userId: null, username: "" });
			setSuspendReason("Violation of terms");
			setSuspendDuration("7d");
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/30 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-2 border-yellow-400/50">
				<div className="flex items-center gap-4 mb-6">
					<div className="relative p-4 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-2xl border-2 border-yellow-300/50">
						{/* Golden shimmer effect */}
						<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 animate-pulse"></div>
						{/* Golden glow */}
						<div className="absolute inset-0 rounded-2xl bg-yellow-400/20 opacity-40 animate-pulse"></div>
						<Users className="relative w-8 h-8 text-white drop-shadow-lg" />
					</div>
					<div>
						<h2 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] admin-panel-gradient-wave">
							USER MANAGEMENT
						</h2>
						<p className="text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-2 font-medium">
							<Users className="w-4 h-4 text-yellow-600" />
							{users?.length || 0} total users • {users?.filter(u => u.isOnline).length || 0} online
						</p>
					</div>
				</div>

				{/* Search and Filters */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-600" />
						<input
							type="text"
							placeholder="Search users by username, email, or nickname..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300/50 dark:border-yellow-600/30 rounded-lg text-amber-900 dark:text-amber-100 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 font-medium"
						/>
					</div>
					<div className="flex gap-2">
						{['all', 'online', 'verified', 'suspended'].map((filter) => (
							<button
								key={filter}
								onClick={() => setFilterStatus(filter)}
								className={`btn btn-sm transition-all duration-200 hover:scale-105 ${
									filterStatus === filter
										? 'bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300/50 text-black shadow-lg hover:shadow-yellow-400/30'
										: 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border-yellow-400/50 text-yellow-600 dark:text-yellow-400 hover:bg-gradient-to-r hover:from-yellow-400/30 hover:to-amber-500/30'
								}`}
							>
								{filter.charAt(0).toUpperCase() + filter.slice(1)}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Users List */}
			<div className="bg-gradient-to-br from-amber-50 via-yellow-100/30 to-orange-50/50 dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-orange-900/20 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-yellow-300/50 dark:border-yellow-500/30">
				{loadingUsers ? (
					<div className="flex flex-col items-center justify-center py-16">
						<span className="loading loading-spinner loading-lg text-primary"></span>
						<p className="text-base-content/70 mt-4">Loading users...</p>
					</div>
				) : !filteredUsers || filteredUsers.length === 0 ? (
					<div className="text-center py-16">
						<Users className="w-20 h-20 mx-auto mb-4 text-primary" />
						<p className="text-xl font-bold text-primary">No users found!</p>
						<p className="text-base-content/60 mt-2">Try adjusting your search or filters</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredUsers.map((user) => (
							<div
								key={user.id}
								className="bg-gradient-to-br from-base-200/50 to-base-300/50 rounded-2xl p-6 shadow-lg border border-base-300/30 hover:shadow-xl transition-all duration-200"
							>
								<div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
									{/* User Info */}
									<div className="flex items-center gap-4 flex-1">
										<div className="relative">
											<img
												src={user.profilePic || "/avatar.png"}
												alt={user.username}
												className="w-16 h-16 rounded-full ring-4 ring-primary/50 ring-offset-2"
											/>
											{user.isOnline && (
												<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-3 border-base-100 flex items-center justify-center">
													<Activity className="w-3 h-3 text-white" />
												</div>
											)}
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="font-bold text-lg text-base-content">
													{user.nickname || user.username}
												</h3>
												{user.isVerified && (
													<div className="badge badge-primary badge-sm flex items-center gap-1">
														<BadgeCheck className="w-3 h-3" />
														Verified
													</div>
												)}
												{user.isSuspended && (
													<div className="badge badge-error badge-sm flex items-center gap-1">
														<Ban className="w-3 h-3" />
														Suspended
													</div>
												)}
											</div>
											<p className="text-sm text-base-content/70">@{user.username}</p>
											<p className="text-xs text-base-content/60">{user.email}</p>
											<div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
												<span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
												{user.country && (
													<div className="flex items-center gap-1">
														<CountryFlag countryCode={user.countryCode} size="sm" />
														<span>{user.country}</span>
													</div>
												)}
												{!user.isOnline && user.lastSeen && (
													<div className="flex items-center gap-1">
														<Clock className="w-3 h-3" />
														<span>{formatLastSeen(user.lastSeen)}</span>
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Actions */}
									<div className="flex flex-wrap gap-2">
										{!user.isSuspended ? (
											<button
												onClick={() => handleSuspend(user.id, user.username)}
												className="btn btn-sm btn-error gap-2 hover:scale-105 transition-all duration-200"
											>
												<Ban className="w-4 h-4" />
												Suspend
											</button>
										) : (
											<button
												onClick={() => onUnsuspend(user.id)}
												className="btn btn-sm btn-success gap-2 hover:scale-105 transition-all duration-200"
											>
												<UserCheck className="w-4 h-4" />
												Unsuspend
											</button>
										)}
										<button
											onClick={() => onToggleVerification(user.id)}
											className="btn btn-sm btn-info gap-2 hover:scale-105 transition-all duration-200"
										>
											<BadgeCheck className="w-4 h-4" />
											{user.isVerified ? 'Unverify' : 'Verify'}
										</button>
										<button
											onClick={() => onDelete(user.id)}
											className="btn btn-sm btn-neutral gap-2 hover:scale-105 transition-all duration-200"
										>
											<Trash2 className="w-4 h-4" />
											Delete
										</button>
									</div>
								</div>

								{/* Suspension Details */}
								{user.isSuspended && (
									<div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl">
										<div className="flex items-center gap-2 mb-2">
											<Shield className="w-4 h-4 text-error" />
											<span className="font-medium text-error">Suspension Details</span>
										</div>
										<p className="text-sm text-base-content/70">
											<strong>Reason:</strong> {user.suspensionReason || 'No reason provided'}
										</p>
										{user.suspensionEndTime && (
											<p className="text-sm text-base-content/70">
												<strong>Until:</strong> {new Date(user.suspensionEndTime).toLocaleString()}
											</p>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Suspend Modal */}
			{suspendModal.open && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-base-100 p-8 rounded-2xl border border-base-300 max-w-md w-full shadow-2xl">
						<h3 className="text-xl font-bold mb-4 text-base-content">
							Suspend User: {suspendModal.username}
						</h3>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-base-content/70 mb-2">
									Reason
								</label>
								<select
									value={suspendReason}
									onChange={(e) => setSuspendReason(e.target.value)}
									className="select select-bordered w-full"
								>
									<option value="Violation of terms">Violation of terms</option>
									<option value="Inappropriate content">Inappropriate content</option>
									<option value="Harassment">Harassment</option>
									<option value="Spam">Spam</option>
									<option value="Other">Other</option>
								</select>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-base-content/70 mb-2">
									Duration
								</label>
								<select
									value={suspendDuration}
									onChange={(e) => setSuspendDuration(e.target.value)}
									className="select select-bordered w-full"
								>
									<option value="1h">1 Hour</option>
									<option value="24h">24 Hours</option>
									<option value="7d">7 Days</option>
									<option value="30d">30 Days</option>
									<option value="permanent">Permanent</option>
								</select>
							</div>
						</div>
						
						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setSuspendModal({ open: false, userId: null, username: "" })}
								className="btn btn-neutral flex-1"
							>
								Cancel
							</button>
							<button
								onClick={confirmSuspend}
								className="btn btn-error flex-1"
							>
								Suspend User
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserManagement;