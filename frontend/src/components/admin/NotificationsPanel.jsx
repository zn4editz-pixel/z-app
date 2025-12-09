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
			<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-base-content/10 flex items-center justify-center">
						<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-base-content" />
					</div>
					<div>
						<h2 className="text-xl sm:text-2xl font-semibold">Send Notification</h2>
						<p className="text-xs sm:text-sm text-base-content/60">Send notifications to users</p>
					</div>
				</div>

				<form onSubmit={handleSend} className="space-y-4">
					{/* Notification Type */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Notification Type</span>
						</label>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setNotificationType("broadcast")}
								className={`btn btn-sm flex-1 gap-2 ${
									notificationType === "broadcast" ? "btn-primary" : "btn-outline"
								}`}
							>
								<Users className="w-4 h-4" />
								Broadcast (All Users)
							</button>
							<button
								type="button"
								onClick={() => setNotificationType("personal")}
								className={`btn btn-sm flex-1 gap-2 ${
									notificationType === "personal" ? "btn-primary" : "btn-outline"
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
								<span className="label-text font-medium">User ID</span>
							</label>
							<input
								type="text"
								placeholder="Enter user ID"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								className="input input-bordered"
								required
							/>
						</div>
					)}

					{/* Title */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Title</span>
						</label>
						<input
							type="text"
							placeholder="Notification title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="input input-bordered"
							required
						/>
					</div>

					{/* Message */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Message</span>
						</label>
						<textarea
							placeholder="Notification message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="textarea textarea-bordered h-24"
							required
						/>
					</div>

					{/* Send Button */}
					<button
						type="submit"
						disabled={isSending}
						className="btn btn-primary w-full gap-2"
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
			<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
				<h3 className="text-lg sm:text-xl font-semibold mb-4">Recent Notifications</h3>
				<AdminNotifications />
			</div>
		</div>
	);
};

export default NotificationsPanel;
