import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { 
	ArrowLeft, 
	Eye, 
	EyeOff, 
	User, 
	UserX, 
	Shield, 
	Settings,
	Video,
	MessageCircle,
	Globe
} from "lucide-react";
import toast from "react-hot-toast";

const StrangerChatSettings = () => {
	const navigate = useNavigate();
	const { authUser } = useAuthStore();
	
	// Privacy settings state
	const [showUsername, setShowUsername] = useState(true);
	const [showProfilePic, setShowProfilePic] = useState(true);
	const [showVerificationBadge, setShowVerificationBadge] = useState(true);
	const [allowFriendRequests, setAllowFriendRequests] = useState(true);
	
	// Load saved settings from localStorage
	useEffect(() => {
		const savedSettings = localStorage.getItem('strangerChatSettings');
		if (savedSettings) {
			const settings = JSON.parse(savedSettings);
			setShowUsername(settings.showUsername ?? true);
			setShowProfilePic(settings.showProfilePic ?? true);
			setShowVerificationBadge(settings.showVerificationBadge ?? true);
			setAllowFriendRequests(settings.allowFriendRequests ?? true);
		}
	}, []);
	
	// Save settings to localStorage
	const saveSettings = () => {
		const settings = {
			showUsername,
			showProfilePic,
			showVerificationBadge,
			allowFriendRequests
		};
		localStorage.setItem('strangerChatSettings', JSON.stringify(settings));
		toast.success("Privacy settings saved!");
	};
	
	// Start stranger chat with current settings
	const startStrangerChat = () => {
		saveSettings();
		navigate("/stranger");
	};
	
	// Get display name based on settings
	const getDisplayName = () => {
		if (showUsername) {
			return authUser?.nickname || authUser?.username || "User";
		}
		return "Stranger";
	};
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 p-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<button 
						onClick={() => navigate("/")}
						className="btn btn-circle btn-outline"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-3xl font-bold">Stranger Chat Privacy</h1>
						<p className="text-base-content/70">Choose what strangers can see about you</p>
					</div>
				</div>
				
				{/* Preview Card */}
				<div className="card bg-base-100 shadow-xl mb-8">
					<div className="card-body">
						<h2 className="card-title flex items-center gap-2">
							<Eye className="w-5 h-5" />
							Preview: How you'll appear to strangers
						</h2>
						
						<div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
							<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
								{showProfilePic ? (
									<img 
										src={authUser?.profilePic || "/avatar.png"} 
										alt="Profile"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full bg-gray-400 flex items-center justify-center">
										<User className="w-6 h-6 text-white" />
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span className="font-semibold text-lg">
									{getDisplayName()}
								</span>
								{showVerificationBadge && authUser?.isVerified && (
									<div className="badge badge-primary badge-sm">✓</div>
								)}
							</div>
						</div>
					</div>
				</div>
				
				{/* Privacy Settings */}
				<div className="card bg-base-100 shadow-xl mb-8">
					<div className="card-body">
						<h2 className="card-title flex items-center gap-2 mb-6">
							<Shield className="w-5 h-5" />
							Privacy Settings
						</h2>
						
						<div className="space-y-6">
							{/* Username Visibility */}
							<div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
								<div className="flex items-center gap-3">
									<User className="w-5 h-5 text-primary" />
									<div>
										<h3 className="font-semibold">Show Username</h3>
										<p className="text-sm text-base-content/70">
											Let strangers see your {authUser?.nickname ? 'nickname' : 'username'}
										</p>
									</div>
								</div>
								<input 
									type="checkbox" 
									className="toggle toggle-primary" 
									checked={showUsername}
									onChange={(e) => setShowUsername(e.target.checked)}
								/>
							</div>
							
							{/* Profile Picture Visibility */}
							<div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
								<div className="flex items-center gap-3">
									<Video className="w-5 h-5 text-primary" />
									<div>
										<h3 className="font-semibold">Show Profile Picture</h3>
										<p className="text-sm text-base-content/70">
											Display your profile picture to strangers
										</p>
									</div>
								</div>
								<input 
									type="checkbox" 
									className="toggle toggle-primary" 
									checked={showProfilePic}
									onChange={(e) => setShowProfilePic(e.target.checked)}
								/>
							</div>
							
							{/* Verification Badge */}
							{authUser?.isVerified && (
								<div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
									<div className="flex items-center gap-3">
										<Shield className="w-5 h-5 text-success" />
										<div>
											<h3 className="font-semibold">Show Verification Badge</h3>
											<p className="text-sm text-base-content/70">
												Display your verified status
											</p>
										</div>
									</div>
									<input 
										type="checkbox" 
										className="toggle toggle-success" 
										checked={showVerificationBadge}
										onChange={(e) => setShowVerificationBadge(e.target.checked)}
									/>
								</div>
							)}
							
							{/* Friend Requests */}
							<div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
								<div className="flex items-center gap-3">
									<MessageCircle className="w-5 h-5 text-secondary" />
									<div>
										<h3 className="font-semibold">Allow Friend Requests</h3>
										<p className="text-sm text-base-content/70">
											Let strangers send you friend requests
										</p>
									</div>
								</div>
								<input 
									type="checkbox" 
									className="toggle toggle-secondary" 
									checked={allowFriendRequests}
									onChange={(e) => setAllowFriendRequests(e.target.checked)}
								/>
							</div>
						</div>
					</div>
				</div>
				
				{/* Privacy Tips */}
				<div className="alert alert-info mb-8">
					<Shield className="w-5 h-5" />
					<div>
						<h3 className="font-bold">Privacy Tips</h3>
						<div className="text-sm mt-2 space-y-1">
							<p>• Hiding your username makes you appear as "Stranger"</p>
							<p>• Your real identity is never shared without permission</p>
							<p>• You can change these settings anytime</p>
							<p>• Friend requests require mutual consent</p>
						</div>
					</div>
				</div>
				
				{/* Action Buttons */}
				<div className="flex gap-4">
					<button 
						onClick={saveSettings}
						className="btn btn-outline flex-1"
					>
						<Settings className="w-4 h-4" />
						Save Settings
					</button>
					<button 
						onClick={startStrangerChat}
						className="btn btn-primary flex-1"
					>
						<Globe className="w-4 h-4" />
						Start Stranger Chat
					</button>
				</div>
			</div>
		</div>
	);
};

export default StrangerChatSettings;