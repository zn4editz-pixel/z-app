import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore"; // ✅ 1. Import chat store
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import CountryFlag from "../components/CountryFlag";
import {
	Loader2,
	UserPlus,
	MessageSquare,
	UserCheck,
	UserX,
	Check,
} from "lucide-react";

// Skeleton component (no changes)
const ProfilePageSkeleton = () => (
	<div className="flex flex-col items-center gap-4 pt-28 max-w-sm mx-auto animate-pulse">
		<div className="avatar">
			<div className="w-32 h-32 rounded-full bg-base-300"></div>
		</div>
		<div className="w-40 h-8 bg-base-300 rounded-lg"></div>
		<div className="w-24 h-6 bg-base-300 rounded-lg"></div>
		<div className="w-full h-16 bg-base-300 rounded-lg"></div>
		<div className="flex items-center gap-4 w-full">
			<div className="w-1/2 h-12 bg-base-300 rounded-lg"></div>
			<div className="w-1/2 h-12 bg-base-300 rounded-lg"></div>
		</div>
	</div>
);

const PublicProfilePage = () => {
	const { username } = useParams();
	const { authUser } = useAuthStore();
	const navigate = useNavigate();

	const {
		getFriendshipStatus,
		sendRequest,
		acceptRequest,
		rejectRequest,
		unfriend,
	} = useFriendStore();

	// ✅ 2. Get setSelectedUser from chat store
	const { setSelectedUser } = useChatStore();

	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isButtonLoading, setIsButtonLoading] = useState(false);

	useEffect(() => {
		if (username.toLowerCase() === authUser?.username.toLowerCase()) {
			navigate("/profile");
			return;
		}

		const fetchUserProfile = async () => {
			setIsLoading(true);
			try {
				const res = await axiosInstance.get(`/users/profile/${username}`);
				setUser(res.data);
			} catch (error) {
				console.error("Failed to fetch user profile:", error);
				toast.error(error.response?.data?.error || "User not found");
				navigate("/");
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserProfile();
	}, [username, authUser, navigate]);

	const handleFriendAction = async () => {
		if (!user) return;
		setIsButtonLoading(true);

		try {
			switch (friendshipStatus) {
				case "NOT_FRIENDS":
					await sendRequest(user.id);
					break;
				case "REQUEST_SENT":
					await rejectRequest(user.id);
					break;
				case "REQUEST_RECEIVED":
					await acceptRequest(user.id);
					break;
				case "FRIENDS":
					await unfriend(user.id);
					break;
				default:
					break;
			}
		} catch (error) {
			console.error("Friend action failed:", error);
		} finally {
			setIsButtonLoading(false);
		}
	};

	// ✅ 3. Update message handler
	const handleSendMessage = () => {
		if (friendshipStatus === "FRIENDS" && user) {
			// Set the selected user in the chat store
			setSelectedUser(user);
			// Navigate to the homepage to show the chat
			navigate("/");
		}
	};

	if (isLoading) {
		return <ProfilePageSkeleton />;
	}

	if (!user) {
		return null;
	}

	const friendshipStatus = getFriendshipStatus(user.id);
	const isMessageButtonDisabled = friendshipStatus !== "FRIENDS";

	const getFriendButtonProps = () => {
		switch (friendshipStatus) {
			case "NOT_FRIENDS":
				return { text: "Add Friend", icon: <UserPlus size={18} />, class: "btn-primary" };
			case "REQUEST_SENT":
				return { text: "Request Sent", icon: <UserX size={18} />, class: "btn-outline" };
			case "REQUEST_RECEIVED":
				return { text: "Accept Request", icon: <Check size={18} />, class: "btn-success" };
			case "FRIENDS":
				return { text: "Friends", icon: <UserCheck size={18} />, class: "btn-secondary" };
			default:
				return { text: "Loading", icon: <Loader2 size={18} />, class: "btn-disabled" };
		}
	};

	const friendButtonProps = getFriendButtonProps();

	return (
		<div className="min-h-screen bg-base-200">
			<div className="max-w-md mx-auto px-2 xs:px-3 sm:px-4 pt-14 xs:pt-16 sm:pt-18 md:pt-20 pb-16 xs:pb-18 sm:pb-20 md:pb-10">
				<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
					<div className="flex flex-col items-center gap-3 sm:gap-4">
						{/* Avatar */}
						<div className="avatar">
							<div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-2">
								<img
									src={user.profilePic || "/avatar.png"}
									alt={`${user.nickname}'s profile`}
									className="object-cover"
								/>
							</div>
						</div>

						{/* Names */}
						<div className="text-center">
							<h1 className="text-xl sm:text-2xl font-bold">{user.nickname}</h1>
							<p className="text-sm sm:text-base text-base-content/70">@{user.username}</p>
						</div>

						{/* Bio */}
						{user.bio && (
							<p className="text-center text-sm sm:text-base text-base-content/80 px-4">{user.bio}</p>
						)}

						{/* Buttons */}
						<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full pt-2 sm:pt-4">
							<button
								className={`btn btn-sm sm:btn-md ${friendButtonProps.class} flex-1 w-full sm:w-auto`}
								onClick={handleFriendAction}
								disabled={isButtonLoading}
							>
								{isButtonLoading ? (
									<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
								) : (
									friendButtonProps.icon
								)}
								<span className="text-sm sm:text-base">{friendButtonProps.text}</span>
							</button>

							{/* Message Button */}
							<button
								className="btn btn-sm sm:btn-md btn-ghost flex-1 w-full sm:w-auto"
								onClick={handleSendMessage}
								disabled={isMessageButtonDisabled}
							>
								<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
								<span className="text-sm sm:text-base">Message</span>
							</button>
						</div>

						{/* Reject Button */}
						{friendshipStatus === "REQUEST_RECEIVED" && (
							<button
								className="btn btn-outline btn-error btn-xs sm:btn-sm w-full mt-2"
								onClick={async () => {
									setIsButtonLoading(true);
									await rejectRequest(user.id);
									setIsButtonLoading(false);
								}}
								disabled={isButtonLoading}
							>
								Reject Request
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PublicProfilePage;