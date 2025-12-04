import { ArrowLeft, Phone, Video, MoreVertical, Trash2, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { Capacitor } from "@capacitor/core";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser, messages, setMessages } = useChatStore();
	const { onlineUsers } = useAuthStore();
	const [showMenu, setShowMenu] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const menuRef = useRef(null);
	const navigate = useNavigate();

	// Check if running in native app (APK) or web
	const isNativeApp = Capacitor.isNativePlatform();

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
		<div className="p-2 sm:p-3 border-b flex items-center justify-between bg-base-300 text-base-content border-base-100">
			<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
				{/* Back button on mobile */}
				<button
					className="md:hidden btn btn-ghost btn-circle btn-xs sm:btn-sm flex-shrink-0"
					onClick={() => setSelectedUser(null)}
					aria-label="Back"
				>
					<ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
				</button>

				{/* Clickable Avatar */}
				<button
					onClick={handleViewProfile}
					className="avatar flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
					aria-label="View Profile"
				>
					<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-base-200 hover:border-primary transition-colors relative">
						<img
							src={selectedUser.profilePic || "/avatar.png"}
							alt={selectedUser.nickname || selectedUser.username}
							className="w-full h-full object-cover"
						/>
						{/* Online Indicator - only for native app */}
						{isNativeApp && isOnline && (
							<span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></span>
						)}
					</div>
				</button>

				{/* User Info - Also clickable */}
				<button
					onClick={handleViewProfile}
					className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
				>
					<div className="font-semibold truncate text-sm sm:text-base flex items-center gap-1">
						<span className="truncate">
							{selectedUser.nickname ||
								selectedUser.username ||
								"Unknown"}
						</span>
						{selectedUser.isVerified && <VerifiedBadge size="xs" />}
					</div>
					<p className="text-[10px] sm:text-xs text-base-content/70 truncate">
						{isOnline ? "Online" : "Offline"}
					</p>
				</button>
			</div>

			{/* Call Buttons - Different style for native vs web */}
			<div className="flex items-center gap-2 flex-shrink-0">
				{isNativeApp ? (
					// Native App (APK) - Colored buttons with backgrounds
					<>
						<button
							className="btn btn-circle btn-sm sm:btn-md bg-success/10 hover:bg-success hover:text-success-content border-success/20 hover:border-success transition-all active:scale-95"
							onClick={() => handleStartCall('audio')}
							aria-label="Audio Call"
							title="Audio call"
						>
							<Phone className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
						</button>
						<button
							className="btn btn-circle btn-sm sm:btn-md bg-primary/10 hover:bg-primary hover:text-primary-content border-primary/20 hover:border-primary transition-all active:scale-95"
							onClick={() => handleStartCall('video')}
							aria-label="Video Call"
							title="Video call"
						>
							<Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
						</button>
					</>
				) : (
					// Web - Original simple ghost buttons
					<>
						<button
							className="btn btn-ghost btn-circle btn-sm hover:bg-success/20 hover:text-success transition-colors"
							onClick={() => handleStartCall('audio')}
							aria-label="Start Audio Call"
							title="Audio call"
						>
							<Phone className="w-5 h-5" />
						</button>
						<button
							className="btn btn-ghost btn-circle btn-sm hover:bg-primary/20 hover:text-primary transition-colors"
							onClick={() => handleStartCall('video')}
							aria-label="Start Video Call"
							title="Video call"
						>
							<Video className="w-4 h-4 sm:w-5 sm:h-5" />
						</button>
					</>
				)}
				
				{/* More Options Menu */}
				<div className="relative" ref={menuRef}>
					<button
						className="btn btn-ghost btn-circle btn-xs sm:btn-sm"
						onClick={() => setShowMenu(!showMenu)}
						aria-label="More options"
					>
						<MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
					</button>
					
					{showMenu && (
						<div className="absolute right-0 top-full mt-2 bg-base-100 rounded-lg shadow-xl border border-base-300 py-2 min-w-[150px] z-10">
							<button
								onClick={() => {
									setShowClearConfirm(true);
									setShowMenu(false);
								}}
								className="w-full px-4 py-2 text-left hover:bg-base-200 text-sm text-error flex items-center gap-2"
							>
								<Trash2 className="w-4 h-4" />
								Clear Chat
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Clear Chat Confirmation Modal */}
			{showClearConfirm && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg">Clear Chat History?</h3>
						<p className="py-4">
							Are you sure you want to clear all messages with{" "}
							<span className="font-semibold">
								{selectedUser.nickname || selectedUser.username}
							</span>
							? This action cannot be undone.
						</p>
						<div className="modal-action">
							<button
								className="btn btn-error"
								onClick={handleClearChat}
							>
								Clear Chat
							</button>
							<button
								className="btn"
								onClick={() => setShowClearConfirm(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatHeader;
