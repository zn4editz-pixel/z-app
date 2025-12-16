import { Phone, Video, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import VerifiedBadge from "./VerifiedBadge";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser, isTyping, typingUserId } = useChatStore();
	const { onlineUsers } = useAuthStore();

	if (!selectedUser) return null;

	const isOnline = onlineUsers.includes(selectedUser.id);

	const handleStartCall = (callType) => {
		if (onStartCall) {
			onStartCall(callType);
		}
	};

	return (
		<div className="p-2.5 border-b border-base-300 relative">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{/* Back Button */}
					<button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-circle btn-sm -ml-1">
						<ArrowLeft className="size-5" />
					</button>

					{/* Avatar */}
					<div className="avatar">
						<div className="size-10 rounded-full relative border border-base-300">
							<img
								src={selectedUser.profilePic || "/avatar.png"}
								alt={selectedUser.username}
								className="size-full object-cover rounded-full"
							/>
						</div>
					</div>

					{/* User Info */}
					<div>
						<h3 className="font-medium flex items-center gap-1">
							{selectedUser.nickname || selectedUser.username}
							{selectedUser.isVerified && <VerifiedBadge size="xs" />}
						</h3>
						<p className="text-sm text-base-content/70">
							{isTyping && typingUserId === selectedUser.id ? (
								<span className="text-secondary font-medium animate-pulse">Typing...</span>
							) : isOnline ? (
								"Online"
							) : (
								"Offline"
							)}
						</p>
					</div>
				</div>

				{/* Header Actions */}
				<div className="flex items-center gap-2">
					{/* Calls */}
					<button onClick={() => handleStartCall('video')} className="btn btn-ghost btn-circle btn-sm">
						<Video className="size-5" />
					</button>
					<button onClick={() => handleStartCall('audio')} className="btn btn-ghost btn-circle btn-sm">
						<Phone className="size-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatHeader;
