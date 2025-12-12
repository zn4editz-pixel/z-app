import { FileText, Send, Users, User } from "lucide-react";
import { useState } from "react";
import AdminNotifications from "../AdminNotifications";

const NotificationsPanel = ({ onSendNotification }) => {
	const [notificationType, setNotificationType] = useState("broadcast");
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [userId, setUserId] = useState("");
	const [isSending, setIsSending] = useState(false);

	const handleSend = async (e) => {
		e.preventDefault();
		
		if (!title || !message) {
			return;
		}

		if (notificationType === "personal" && !userId) {
			return;
		}

		setIsSending(true);
		try {
			await onSendNotification({
				type: notificationType,
				title,
				message,
				userId: notificationType === "personal" ? userId : null
			});
			
			// Reset form
			setTitle("");
			setMessage("");
			setUserId("");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Send Notification Form */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-primary/20">
				<div className="flex items-center gap-4 mb-6">
					<div className="bg-gradient-to-br from-primary to-purple-600 p-4 rounded-2xl shadow-lg">
						<FileText className="w-8 h-8 text-white" />
					</div>
					<div>
						<h2 className="text-3xl font-black text-primary">
							SEND NOTIFICATION
						</h2>
						<p className="text-base-content/70 mt-1 flex items-center gap-2">
							<Send className="w-4 h-4 text-primary" />
							Broadcast messages to users
						</p>
					</div>
				</div>

				<form onSubmit={handleSend} className="space-y-6">
					{/* Notification Type */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-bold text-primary uppercase tracking-wide">Notification Type</span>
						</label>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setNotificationType("broadcast")}
								className={`btn btn-sm flex-1 gap-2 transition-all duration-200 ${
									notificationType === "broadcast" 
										? "btn-primary" 
										: "btn-outline btn-primary"
								}`}
							>
								<Users className="w-4 h-4" />
								Broadcast (All Users)
							</button>
							<button
								type="button"
								onClick={() => setNotificationType("personal")}
								className={`btn btn-sm flex-1 gap-2 transition-all duration-200 ${
									notificationType === "personal" 
										? "btn-primary" 
										: "btn-outline btn-primary"
								}`}
							>
								<User className="w-4 h-4" />
								Personal (Single User)
							</button>
						</div>
					</div>

					{/* User ID (for personal notifications) */}
					{notificationType === "personal" && (
						<div className="form-control">
							<label className="label">
								<span className="label-text font-bold text-primary uppercase tracking-wide">User ID</span>
							</label>
							<input
								type="text"
								placeholder="Enter user ID"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								className="input input-bordered input-primary"
								required
							/>
						</div>
					)}

					{/* Title */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-bold text-primary uppercase tracking-wide">Title</span>
						</label>
						<input
							type="text"
							placeholder="Notification title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="input input-bordered input-primary"
							required
						/>
					</div>

					{/* Message */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-bold text-primary uppercase tracking-wide">Message</span>
						</label>
						<textarea
							placeholder="Notification message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="textarea textarea-bordered textarea-primary h-24 resize-none"
							required
						/>
					</div>

					{/* Send Button */}
					<button
						type="submit"
						disabled={isSending}
						className="btn btn-primary w-full gap-2 hover:scale-105 transition-all duration-200 disabled:opacity-50"
					>
						{isSending ? (
							<>
								<span className="loading loading-spinner loading-sm"></span>
								Sending...
							</>
						) : (
							<>
								<Send className="w-4 h-4" />
								Send Notification
							</>
						)}
					</button>
				</form>
			</div>

			{/* Recent Notifications */}
			<div className="bg-gradient-to-br from-base-100/90 to-base-200/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-primary/20">
				<h3 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
					<FileText className="w-5 h-5" />
					Recent Notifications
				</h3>
				<AdminNotifications />
			</div>
		</div>
	);
};

export default NotificationsPanel;