import { ArrowLeft, Phone, Video, MoreVertical, Trash2, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser, messages, setMessages } = useChatStore();
	const { onlineUsers } = useAuthStore();
	const [showMenu, setShowMenu] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const menuRef = useRef(null);
	const navigate = useNavigate();

	if (!selectedUser) return null;

	const isOnline = onlineUsers.includes(selectedUser._id);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleStartCall = (callType) => {
		if (onStartCall) {
			onStartCall(callType);
		}
		setShowMenu(false);
	};

	const handleViewProfile = () => {
		navigate(`/profile/${selectedUser.username}`);
	};

	const handleClearChat = async () => {
		try {
			await axiosInstance.delete(`/messages/${selectedUser._id}`);
			setMessages([]);
			toast.success("Chat cleared successfully");
			setShowClearConfirm(false);
			setShowMenu(false);
		} catch (error) {
			console.error("Error clearing chat:", error);
			toast.error("Failed to clear chat");
		}
	};

	return (
		<div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 shadow-sm">
			<div className="flex items-center justify-between p-3 sm:p-4">
				{/* Left Section: Back + Avatar + Info */}
				<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
					{/* Back Button - Larger on mobile */}
					<button
						className="md:hidden btn btn-ghost btn-circle btn-sm flex-shrink-0 active:scale-95"
						onClick={() => setSelectedUser(null)}
						aria-label="Back"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>

					{/* Avatar - Clickable */}
					<button
						onClick={handleViewProfile}
						className="avatar flex-shrink-0 cursor-pointer hover:opacity-80 transition-all active:scale-95"
						aria-label="View Profile"
					>
						<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors relative">
							<img
								src={selectedUser.profilePic || "/avatar.png"}
								alt={selectedUser.nickname || selectedUser.username}
								className="w-full h-full object-cover"
							/>
							{/* Online Indicator */}
							{isOnline && (
								<span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></span>
							)}
						</div>
					</button>

					{/* User Info - Clickable */}
					<button
						onClick={handleViewProfile}
						className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity active:scale-98"
					>
						<div className="font-bold truncate text-base sm:text-lg flex items-center gap-1.5">
							<span className="truncate">
								{selectedUser.nickname || selectedUser.username || "Unknown"}
							</span>
							{selectedUser.isVerified && <VerifiedBadge size="xs" />}
						</div>
						<p className="text-xs sm:text-sm text-base-content/60 truncate flex items-center gap-1.5">
							{isOnline && <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>}
							{isOnline ? "Active now" : "Offline"}
						</p>
					</button>
				</div>

				{/* Right Section: Call Buttons + Menu */}
				<div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
					{/* Audio Call Button - PROMINENT */}
					<button
						className="btn btn-circle btn-sm sm:btn-md bg-success/10 hover:bg-success hover:text-success-content border-success/20 hover:border-success transition-all active:scale-95"
						onClick={() => handleStartCall('audio')}
						aria-label="Audio Call"
						title="Audio call"
					>
						<Phone className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
					</button>

					{/* Video Call Button - PROMINENT */}
					<button
						className="btn btn-circle btn-sm sm:btn-md bg-primary/10 hover:bg-primary hover:text-primary-content border-primary/20 hover:border-primary transition-all active:scale-95"
						onClick={() => handleStartCall('video')}
						aria-label="Video Call"
						title="Video call"
					>
						<Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
					</button>
					
					{/* More Options Menu */}
					<div className="relative" ref={menuRef}>
						<button
							className="btn btn-ghost btn-circle btn-sm sm:btn-md active:scale-95"
							onClick={() => setShowMenu(!showMenu)}
							aria-label="More options"
						>
							<MoreVertical className="w-5 h-5" />
						</button>
						
						{showMenu && (
							<div className="absolute right-0 top-full mt-2 bg-base-100 rounded-xl shadow-2xl border border-base-300 py-2 min-w-[180px] z-20 animate-fadeIn">
								<button
									onClick={handleViewProfile}
									className="w-full px-4 py-3 text-left hover:bg-base-200 text-sm flex items-center gap-3 transition-colors"
								>
									<Info className="w-4 h-4" />
									View Profile
								</button>
								<div className="divider my-1"></div>
								<button
									onClick={() => {
										setShowClearConfirm(true);
										setShowMenu(false);
									}}
									className="w-full px-4 py-3 text-left hover:bg-error/10 text-sm text-error flex items-center gap-3 transition-colors"
								>
									<Trash2 className="w-4 h-4" />
									Clear Chat
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Clear Chat Confirmation Modal */}
			{showClearConfirm && (
				<div className="modal modal-open">
					<div className="modal-box max-w-sm">
						<h3 className="font-bold text-lg mb-2">Clear Chat History?</h3>
						<p className="py-4 text-sm">
							Are you sure you want to clear all messages with{" "}
							<span className="font-semibold text-primary">
								{selectedUser.nickname || selectedUser.username}
							</span>
							? This action cannot be undone.
						</p>
						<div className="modal-action">
							<button
								className="btn btn-ghost"
								onClick={() => setShowClearConfirm(false)}
							>
								Cancel
							</button>
							<button
								className="btn btn-error"
								onClick={handleClearChat}
							>
								Clear Chat
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatHeader;
