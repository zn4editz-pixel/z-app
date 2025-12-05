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
		<div className="bg-base-100 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
				<div>
					<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold flex items-center gap-2">
						<Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
						User Management
					</h2>
					<p className="text-xs sm:text-sm text-base-content/60 mt-1">
						{filteredUsers.length} users found
					</p>
				</div>

				{/* Search */}
				<div className="relative w-full sm:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
					<input
						type="text"
						placeholder="Search users..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="input input-bordered input-sm sm:input-md w-full sm:w-64 pl-10"
					/>
				</div>
			</div>

			{loadingUsers ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : filteredUsers.length === 0 ? (
				<div className="text-center py-8 text-base-content/60">
					<Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
					<p>No users found</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="table w-full table-zebra">
						<thead>
							<tr className="text-xs sm:text-sm">
								<th>User</th>
								<th>Email</th>
								<th>Status</th>
								<th>Joined</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map((user) => (
								<tr key={user._id} className="text-xs sm:text-sm">
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
