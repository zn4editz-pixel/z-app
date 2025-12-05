import { ArrowLeft, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser } = useChatStore();
	const { onlineUsers } = useAuthStore();
	const navigate = useNavigate();

	if (!selectedUser) return null;

	const isOnline = onlineUsers.includes(selectedUser._id);

	const handleStartCall = (callType) => {
		if (onStartCall) {
			onStartCall(callType);
		}
	};

	const handleViewProfile = () => {
		navigate(`/profile/${selectedUser.username}`);
	};

	return (
		<div className="px-2.5 sm:px-4 py-2.5 sm:py-3 border-b border-base-300 flex items-center justify-between bg-base-100">
			<div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
				{/* Back Button - Mobile */}
				<button
					className="btn btn-ghost btn-circle btn-sm md:hidden"
					onClick={() => setSelectedUser(null)}
				>
					<ArrowLeft className="w-5 h-5" />
				</button>

				{/* Avatar */}
				<button
					onClick={handleViewProfile}
					className="avatar cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
				>
					<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-base-300">
						<img
							src={selectedUser.profilePic || "/avatar.png"}
							alt={selectedUser.nickname || selectedUser.username}
							className="object-cover"
						/>
					</div>
				</button>

				{/* User Info */}
				<button
					onClick={handleViewProfile}
					className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
				>
					<div className="font-semibold truncate text-base flex items-center gap-1.5">
						<span className="truncate">
							{selectedUser.nickname || selectedUser.username}
						</span>
						{selectedUser.isVerified && <VerifiedBadge size="xs" />}
					</div>
					<p className="text-sm text-base-content/60 truncate">
						{isOnline ? (
							<span className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
								Online
							</span>
						) : (
							"Offline"
						)}
					</p>
				</button>
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-2 sm:gap-3">
				{/* Audio Call */}
				<button
					className="btn btn-ghost btn-circle btn-sm sm:btn-md"
					onClick={() => handleStartCall('audio')}
					title="Audio call"
				>
					<Phone className="w-5 h-5 sm:w-6 sm:h-6" />
				</button>

				{/* Video Call */}
				<button
					className="btn btn-ghost btn-circle btn-sm sm:btn-md"
					onClick={() => handleStartCall('video')}
					title="Video call"
				>
					<Video className="w-5 h-5 sm:w-6 sm:h-6" />
				</button>
			</div>

		</div>
	);
};

export default ChatHeader;
