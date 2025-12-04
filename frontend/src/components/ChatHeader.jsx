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
		<div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-base-300 flex items-center justify-between bg-base-100">
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{/* Avatar */}
				<button
					onClick={handleViewProfile}
					className="avatar cursor-pointer hover:opacity-80 transition-opacity"
				>
					<div className="w-10 h-10 rounded-full">
						<img
							src={selectedUser.profilePic || "/avatar.png"}
							alt={selectedUser.nickname || selectedUser.username}
						/>
					</div>
				</button>

				{/* User Info */}
				<button
					onClick={handleViewProfile}
					className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
				>
					<div className="font-semibold truncate text-sm flex items-center gap-1">
						<span className="truncate">
							{selectedUser.nickname || selectedUser.username}
						</span>
						{selectedUser.isVerified && <VerifiedBadge size="xs" />}
					</div>
					<p className="text-xs text-base-content/70 truncate">
						{isOnline ? "Online" : "Offline"}
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

			{/* Clear Chat Modal */}
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
