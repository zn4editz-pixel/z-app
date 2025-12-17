import { Phone, Video, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import VerifiedBadge from "./VerifiedBadge";
import { useEffect, useState } from "react";

const ChatHeader = ({ onStartCall }) => {
	const { selectedUser, setSelectedUser, isTyping, typingUserId } = useChatStore();
	const { onlineUsers } = useAuthStore();
	const [isMobile, setIsMobile] = useState(false);
	const [keyboardVisible, setKeyboardVisible] = useState(false);

	// Detect mobile device
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Handle mobile keyboard visibility
	useEffect(() => {
		if (!isMobile) return;

		const handleViewportChange = () => {
			// Detect keyboard by viewport height change
			const viewportHeight = window.visualViewport?.height || window.innerHeight;
			const windowHeight = window.screen.height;
			const keyboardThreshold = windowHeight * 0.75; // 75% of screen height
			
			setKeyboardVisible(viewportHeight < keyboardThreshold);
		};

		// Listen to visual viewport changes (better than resize for keyboard detection)
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', handleViewportChange);
			return () => window.visualViewport.removeEventListener('resize', handleViewportChange);
		} else {
			// Fallback for older browsers
			window.addEventListener('resize', handleViewportChange);
			return () => window.removeEventListener('resize', handleViewportChange);
		}
	}, [isMobile]);

	if (!selectedUser) return null;

	const isOnline = onlineUsers.includes(selectedUser.id);

	const handleStartCall = (callType) => {
		if (onStartCall) {
			onStartCall(callType);
		}
	};

	return (
		<div className={`p-2.5 border-b border-base-300 relative bg-base-100 z-30 ${
			isMobile && keyboardVisible ? 'mobile-chat-header-keyboard' : ''
		}`}>
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
