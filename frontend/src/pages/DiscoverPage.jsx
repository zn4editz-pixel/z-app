import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios.js";
import { Search, Loader2, UserPlus, Users, Bell, UserCheck, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import VerifiedBadge from "../components/VerifiedBadge";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";

const DiscoverPage = () => {
	const [activeTab, setActiveTab] = useState("discover"); // discover, requests, notifications
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);
	const [suggestedUsers, setSuggestedUsers] = useState([]);
	const [isLoadingSuggested, setIsLoadingSuggested] = useState(true);
	const [loadingRequestId, setLoadingRequestId] = useState(null);

	const { pendingReceived, acceptRequest, rejectRequest, fetchFriendData } = useFriendStore();
	const { authUser } = useAuthStore();

	// Fetch friend data on mount
	useEffect(() => {
		fetchFriendData();
	}, [fetchFriendData]);

	// Fetch suggested users on mount
	useEffect(() => {
		if (activeTab === "discover") {
			fetchSuggestedUsers();
		}
	}, [activeTab]);

	const fetchSuggestedUsers = async () => {
		setIsLoadingSuggested(true);
		try {
			const res = await axiosInstance.get("/users/suggested");
			setSuggestedUsers(res.data || []);
		} catch (error) {
			console.error("Error fetching suggested users:", error);
		} finally {
			setIsLoadingSuggested(false);
		}
	};

	// Debounced search
	useEffect(() => {
		if (activeTab !== "discover") return;
		
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}
		setIsLoadingSearch(true);
		const timerId = setTimeout(() => {
			const fetchUsers = async () => {
				try {
					const res = await axiosInstance.get(`/users/search?q=${searchQuery}`);
					setSearchResults(res.data);
				} catch (error) {
					console.error("Search error:", error);
					toast.error("Failed to search users");
				} finally {
					setIsLoadingSearch(false);
				}
			};
			fetchUsers();
		}, 300);
		return () => clearTimeout(timerId);
	}, [searchQuery, activeTab]);

	const handleAccept = async (id) => {
		setLoadingRequestId(id);
		await acceptRequest(id);
		setLoadingRequestId(null);
	};

	const handleReject = async (id) => {
		setLoadingRequestId(id);
		await rejectRequest(id);
		setLoadingRequestId(null);
	};

	const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;
	const isLoading = searchQuery.trim() ? isLoadingSearch : isLoadingSuggested;

	return (
		<div className="min-h-screen pt-20 pb-10 px-4 bg-base-200">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
					<div className="flex items-center gap-3 mb-4">
						<Users className="w-8 h-8 text-primary" />
						<h1 className="text-3xl font-bold">Social Hub</h1>
					</div>
					<p className="text-base-content/70">
						Discover users, manage requests, and stay updated
					</p>
				</div>

				{/* Tabs */}
				<div className="bg-base-100 rounded-xl shadow-lg mb-6">
					<div className="flex border-b border-base-300">
						<button
							onClick={() => setActiveTab("discover")}
							className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-colors ${
								activeTab === "discover"
									? "text-primary border-b-2 border-primary"
									: "text-base-content/60 hover:text-base-content"
							}`}
						>
							<Search className="w-5 h-5" />
							<span className="hidden sm:inline">Discover</span>
						</button>
						<button
							onClick={() => setActiveTab("requests")}
							className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-colors relative ${
								activeTab === "requests"
									? "text-primary border-b-2 border-primary"
									: "text-base-content/60 hover:text-base-content"
							}`}
						>
							<UserCheck className="w-5 h-5" />
							<span className="hidden sm:inline">Requests</span>
							{pendingReceived.length > 0 && (
								<span className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 badge badge-error badge-sm">
									{pendingReceived.length}
								</span>
							)}
						</button>
						<button
							onClick={() => setActiveTab("notifications")}
							className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-colors ${
								activeTab === "notifications"
									? "text-primary border-b-2 border-primary"
									: "text-base-content/60 hover:text-base-content"
							}`}
						>
							<Bell className="w-5 h-5" />
							<span className="hidden sm:inline">Notifications</span>
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "discover" && (
					<>
						{/* Search Bar */}
						<div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Search className="h-5 w-5 text-base-content/60" />
								</div>
								<input
									type="text"
									placeholder="Search by username or nickname..."
									className="input input-bordered w-full pl-12 pr-4 text-base"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>

						{/* Results Section */}
						<div className="bg-base-100 rounded-xl shadow-lg p-6">
							<h2 className="text-xl font-semibold mb-4">
								{searchQuery.trim() ? "Search Results" : "Suggested Users"}
							</h2>

							{isLoading ? (
								<div className="flex justify-center items-center py-12">
									<Loader2 className="w-8 h-8 animate-spin text-primary" />
								</div>
							) : displayUsers.length === 0 ? (
								<div className="text-center py-12">
									<Users className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
									<p className="text-base-content/60">
										{searchQuery.trim()
											? `No users found for "${searchQuery}"`
											: "No suggested users available"}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{displayUsers.map((user) => (
										<div
											key={user._id}
											className="card bg-base-200 hover:bg-base-300 transition-all duration-200 border border-base-300"
										>
											<div className="card-body p-4">
												<div className="flex items-start gap-4">
													<Link to={`/profile/${user.username}`}>
														<div className="avatar">
															<div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
																<img
																	src={user.profilePic || "/default-avatar.png"}
																	alt={user.username}
																/>
															</div>
														</div>
													</Link>

													<div className="flex-1 min-w-0">
														<Link to={`/profile/${user.username}`}>
															<div className="flex items-center gap-1 mb-1">
																<h3 className="font-semibold text-lg truncate">
																	{user.nickname || user.username}
																</h3>
																{user.isVerified && <VerifiedBadge size="sm" />}
															</div>
															<p className="text-sm text-base-content/70 mb-2">
																@{user.username}
															</p>
														</Link>

														{user.bio && (
															<p className="text-sm text-base-content/80 line-clamp-2 mb-3">
																{user.bio}
															</p>
														)}

														<div className="flex gap-2">
															<Link
																to={`/profile/${user.username}`}
																className="btn btn-primary btn-sm flex-1"
															>
																<UserPlus className="w-4 h-4" />
																View Profile
															</Link>
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}

				{activeTab === "requests" && (
					<div className="bg-base-100 rounded-xl shadow-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
						
						{pendingReceived.length === 0 ? (
							<div className="text-center py-12">
								<UserCheck className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
								<p className="text-base-content/60">No pending friend requests</p>
							</div>
						) : (
							<div className="space-y-4">
								{pendingReceived.map((user) => (
									<div
										key={user._id}
										className="card bg-base-200 border border-base-300"
									>
										<div className="card-body p-4">
											<div className="flex items-center gap-4">
												<Link to={`/profile/${user.username}`}>
													<div className="avatar">
														<div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
															<img
																src={user.profilePic || "/default-avatar.png"}
																alt={user.username}
															/>
														</div>
													</div>
												</Link>

												<div className="flex-1 min-w-0">
													<Link to={`/profile/${user.username}`}>
														<div className="flex items-center gap-1 mb-1">
															<h3 className="font-semibold text-lg truncate">
																{user.nickname || user.username}
															</h3>
															{user.isVerified && <VerifiedBadge size="sm" />}
														</div>
														<p className="text-sm text-base-content/70">
															@{user.username}
														</p>
													</Link>
												</div>

												<div className="flex gap-2">
													<button
														onClick={() => handleAccept(user._id)}
														disabled={loadingRequestId === user._id}
														className="btn btn-success btn-sm"
													>
														{loadingRequestId === user._id ? (
															<Loader2 className="w-4 h-4 animate-spin" />
														) : (
															<>
																<CheckCircle className="w-4 h-4" />
																<span className="hidden sm:inline">Accept</span>
															</>
														)}
													</button>
													<button
														onClick={() => handleReject(user._id)}
														disabled={loadingRequestId === user._id}
														className="btn btn-ghost btn-sm"
													>
														{loadingRequestId === user._id ? (
															<Loader2 className="w-4 h-4 animate-spin" />
														) : (
															<>
																<XCircle className="w-4 h-4" />
																<span className="hidden sm:inline">Reject</span>
															</>
														)}
													</button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "notifications" && (
					<div className="bg-base-100 rounded-xl shadow-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Notifications</h2>
						
						<div className="space-y-4">
							{/* Verification Status */}
							{authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none" && (
								<div className={`alert ${
									authUser.verificationRequest.status === "pending" ? "alert-warning" :
									authUser.verificationRequest.status === "approved" ? "alert-success" :
									"alert-error"
								}`}>
									<BadgeCheck className="w-6 h-6" />
									<div className="flex-1">
										<h3 className="font-bold text-base">Verification Request</h3>
										<p className="text-sm mt-1">
											Status: <span className="font-semibold capitalize">{authUser.verificationRequest.status}</span>
										</p>
										{authUser.verificationRequest.status === "pending" && (
											<p className="text-sm mt-2 opacity-90">
												⏳ Your verification request is being reviewed by our admin team.
											</p>
										)}
										{authUser.verificationRequest.status === "approved" && (
											<p className="text-sm mt-2 opacity-90">
												🎉 Congratulations! Your account has been verified. You now have a verified badge on your profile.
											</p>
										)}
										{authUser.verificationRequest.status === "rejected" && (
											<div className="mt-2">
												<p className="text-sm font-semibold mb-1">❌ Request Rejected</p>
												{authUser.verificationRequest.adminNote ? (
													<div className="bg-base-100/50 p-3 rounded-lg mt-2">
														<p className="text-xs font-semibold mb-1">Admin's Response:</p>
														<p className="text-sm">{authUser.verificationRequest.adminNote}</p>
													</div>
												) : (
													<p className="text-sm opacity-90">Your request does not meet verification criteria.</p>
												)}
												<p className="text-xs mt-2 opacity-75">
													You can submit a new request after addressing the issues mentioned above.
												</p>
											</div>
										)}
										{authUser.verificationRequest.requestedAt && (
											<p className="text-xs mt-2 opacity-60">
												Requested: {new Date(authUser.verificationRequest.requestedAt).toLocaleDateString()}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Account Status */}
							{authUser?.isSuspended && (
								<div className="alert alert-error">
									<XCircle className="w-6 h-6" />
									<div className="flex-1">
										<h3 className="font-bold text-base">⚠️ Account Suspended</h3>
										<p className="text-sm mt-1">
											Suspended Until: <span className="font-semibold">{new Date(authUser.suspendedUntil).toLocaleString()}</span>
										</p>
										{authUser.suspensionReason && (
											<div className="bg-base-100/50 p-3 rounded-lg mt-2">
												<p className="text-xs font-semibold mb-1">Admin's Reason:</p>
												<p className="text-sm">{authUser.suspensionReason}</p>
											</div>
										)}
										<p className="text-xs mt-2 opacity-75">
											You will be able to access your account again after the suspension period ends.
										</p>
									</div>
								</div>
							)}

							{/* Welcome Message */}
							{!authUser?.verificationRequest?.status && !authUser?.isSuspended && (
								<div className="text-center py-12">
									<Bell className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
									<p className="text-base-content/60">No notifications at the moment</p>
									<p className="text-sm text-base-content/50 mt-2">
										You'll see important updates and messages here
									</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DiscoverPage;
