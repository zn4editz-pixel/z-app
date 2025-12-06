import { Users, Ban, Trash2, BadgeCheck, Search } from "lucide-react";
import { useState } from "react";
import VerifiedBadge from "../VerifiedBadge";

const UserManagement = ({ 
	users, 
	loadingUsers, 
	onSuspend, 
	onUnsuspend, 
	onDelete, 
	onToggleVerification 
}) => {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredUsers = users.filter(user => 
		user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.email?.toLowerCase().includes(searchTerm.toLowerCase())
	);

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
											{user.isSuspended ? (
												<span className="badge badge-error badge-xs sm:badge-sm">Suspended</span>
											) : user.isOnline ? (
												<span className="badge badge-success badge-xs sm:badge-sm">Online</span>
											) : (
												<span className="badge badge-ghost badge-xs sm:badge-sm">Offline</span>
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
													onClick={() => onSuspend(user._id)}
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
		</div>
	);
};

export default UserManagement;
