import { ArrowLeft, Phone, Video, MoreVertical, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser, setMessages } = useChatStore();
	const { onlineUsers } = useAuthStore();
	const [showMenu, setShowMenu] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const menuRef = useRef(null);
	const navigate = useNavigate();

	if (!selectedUser) return null;

	const isOnline = onlineUsers.includes(selectedUser._id);

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
			<div className="flex items-center gap-1">
				{/* Audio Call */}
				<button
					className="btn btn-ghost btn-circle btn-sm"
					onClick={() => handleStartCall('audio')}
					title="Audio call"
				>
					<Phone className="w-5 h-5" />
				</button>

				{/* Video Call */}
				<button
					className="btn btn-ghost btn-circle btn-sm"
					onClick={() => handleStartCall('video')}
					title="Video call"
				>
					<Video className="w-5 h-5" />
				</button>
				
				{/* More Options */}
				<div className="relative" ref={menuRef}>
					<button
						className="btn btn-ghost btn-circle btn-sm"
						onClick={() => setShowMenu(!showMenu)}
					>
						<MoreVertical className="w-5 h-5" />
					</button>
					
					{showMenu && (
						<div className="absolute right-0 top-full mt-2 bg-base-100 rounded-xl shadow-xl border border-base-300 py-1 min-w-[160px] z-50">
							<button
								onClick={() => {
									setShowClearConfirm(true);
									setShowMenu(false);
								}}
								className="w-full px-4 py-2.5 text-left hover:bg-base-200 active:bg-base-300 text-sm text-error flex items-center gap-2 transition"
							>
								<Trash2 className="w-4 h-4" />
								Clear Chat
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Clear Chat Modal */}
			{showClearConfirm && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
					<div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
						<h3 className="font-bold text-lg sm:text-xl mb-4">Clear Chat History?</h3>
						<p className="text-sm sm:text-base text-base-content/80 mb-6">
							Are you sure you want to clear all messages with{" "}
							<span className="font-semibold text-primary">
								{selectedUser.nickname || selectedUser.username}
							</span>
							? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
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
