import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Users, TrendingUp, Activity, Shield } from "lucide-react";

const SimpleAdminDashboard = () => {
	const { socket } = useAuthStore();
	const [stats, setStats] = useState(null);
	const [users, setUsers] = useState([]);
	const [loadingStats, setLoadingStats] = useState(true);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [activeTab, setActiveTab] = useState("dashboard");

	useEffect(() => {
		fetchStats();
		fetchUsers();
	}, []);

	const fetchStats = async () => {
		setLoadingStats(true);
		try {
			const res = await axiosInstance.get("/admin/stats");
			setStats(res.data);
		} catch (err) {
			console.error("Error fetching stats:", err);
			toast.error("Failed to load statistics");
		} finally {
			setLoadingStats(false);
		}
	};

	const fetchUsers = async () => {
		setLoadingUsers(true);
		try {
			const res = await axiosInstance.get("/admin/users");
			const userData = Array.isArray(res.data) ? res.data : [];
			setUsers(userData);
			console.log(`Fetched ${userData.length} users`);
		} catch (err) {
			console.error("Error fetching users:", err);
			toast.error("Failed to load users");
			setUsers([]);
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleSuspendUser = async (userId) => {
		try {
			await axiosInstance.put(`/admin/suspend/${userId}`, {
				reason: "Admin action",
				duration: "7d"
			});
			toast.success("User suspended successfully");
			fetchUsers();
		} catch (err) {
			toast.error("Failed to suspend user");
		}
	};

	const handleDeleteUser = async (userId) => {
		if (!confirm("Are you sure you want to delete this user?")) return;
		try {
			await axiosInstance.delete(`/admin/delete/${userId}`);
			toast.success("User deleted successfully");
			fetchUsers();
		} catch (err) {
			toast.error("Failed to delete user");
		}
	};

	const renderDashboard = () => (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl p-6 text-black shadow-xl">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium opacity-80">Total Users</p>
							<p className="text-3xl font-bold">{stats?.totalUsers || users.length}</p>
						</div>
						<Users className="w-8 h-8 opacity-80" />
					</div>
				</div>
				
				<div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium opacity-80">Online Users</p>
							<p className="text-3xl font-bold">{stats?.onlineUsers || 1}</p>
						</div>
						<Activity className="w-8 h-8 opacity-80" />
					</div>
				</div>
				
				<div className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium opacity-80">Verified Users</p>
							<p className="text-3xl font-bold">{users.filter(u => u.isVerified).length}</p>
						</div>
						<Shield className="w-8 h-8 opacity-80" />
					</div>
				</div>
				
				<div className="bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium opacity-80">Total Messages</p>
							<p className="text-3xl font-bold">{stats?.totalMessages || 0}</p>
						</div>
						<TrendingUp className="w-8 h-8 opacity-80" />
					</div>
				</div>
			</div>

			{/* Recent Users */}
			<div className="bg-base-100 rounded-2xl shadow-xl p-6">
				<h3 className="text-xl font-bold mb-4 text-amber-600">Recent Users</h3>
				<div className="grid gap-4">
					{users.slice(0, 5).map((user) => (
						<div key={user.id} className="flex items-center justify-between p-4 bg-base-200 rounded-xl">
							<div className="flex items-center gap-3">
								<div className="avatar">
									<div className="w-10 h-10 rounded-full ring ring-amber-400 ring-offset-2">
										<img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
									</div>
								</div>
								<div>
									<p className="font-semibold">{user.fullName}</p>
									<p className="text-sm opacity-70">{user.email}</p>
								</div>
							</div>
							<div className="flex gap-2">
								{user.isVerified && <span className="badge badge-success">Verified</span>}
								{user.isOnline && <span className="badge badge-info">Online</span>}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	const renderUsers = () => (
		<div className="space-y-6">
			<div className="bg-base-100 rounded-2xl shadow-xl p-6">
				<h3 className="text-xl font-bold mb-4 text-amber-600">All Users ({users.length})</h3>
				{loadingUsers ? (
					<div className="flex justify-center py-8">
						<span className="loading loading-spinner loading-lg text-amber-500"></span>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table table-zebra w-full">
							<thead>
								<tr>
									<th>User</th>
									<th>Email</th>
									<th>Status</th>
									<th>Joined</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user.id}>
										<td>
											<div className="flex items-center gap-3">
												<div className="avatar">
													<div className="w-8 h-8 rounded-full">
														<img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
													</div>
												</div>
												<div>
													<div className="font-bold">{user.fullName}</div>
													<div className="text-sm opacity-50">@{user.username}</div>
												</div>
											</div>
										</td>
										<td>{user.email}</td>
										<td>
											<div className="flex gap-1">
												{user.isVerified && <span className="badge badge-success badge-sm">Verified</span>}
												{user.isOnline && <span className="badge badge-info badge-sm">Online</span>}
												{user.isSuspended && <span className="badge badge-error badge-sm">Suspended</span>}
											</div>
										</td>
										<td>{new Date(user.createdAt).toLocaleDateString()}</td>
										<td>
											<div className="flex gap-2">
												{!user.isSuspended && user.email !== 'ronaldo@gmail.com' && (
													<button 
														onClick={() => handleSuspendUser(user.id)}
														className="btn btn-warning btn-xs"
													>
														Suspend
													</button>
												)}
												{user.email !== 'ronaldo@gmail.com' && (
													<button 
														onClick={() => handleDeleteUser(user.id)}
														className="btn btn-error btn-xs"
													>
														Delete
													</button>
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
		</div>
	);

	return (
		<div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-base-200 via-base-300 to-base-200 pb-20">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
						Admin Panel
					</h1>
					<p className="text-base-content/70">
						Manage your platform with all 22 users restored!
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="bg-base-100 rounded-2xl shadow-xl p-2 mb-8">
					<div className="flex gap-2">
						<button
							onClick={() => setActiveTab("dashboard")}
							className={`btn ${activeTab === "dashboard" ? "btn-warning" : "btn-ghost"}`}
						>
							<TrendingUp className="w-4 h-4" />
							Dashboard
						</button>
						<button
							onClick={() => setActiveTab("users")}
							className={`btn ${activeTab === "users" ? "btn-warning" : "btn-ghost"}`}
						>
							<Users className="w-4 h-4" />
							Users ({users.length})
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="animate-fadeIn">
					{activeTab === "dashboard" && renderDashboard()}
					{activeTab === "users" && renderUsers()}
				</div>
			</div>
		</div>
	);
};

export default SimpleAdminDashboard;