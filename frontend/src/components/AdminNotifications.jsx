import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Send, Mail, Users, User, Loader2 } from "lucide-react";

const AdminNotifications = ({ users = [] }) => {
  const [notificationType, setNotificationType] = useState("personal"); // personal or broadcast
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("blue");
  const [type, setType] = useState("info");
  const [isSending, setIsSending] = useState(false);

  const colors = [
    { value: "green", label: "Green (Success)", class: "bg-success" },
    { value: "red", label: "Red (Error)", class: "bg-error" },
    { value: "blue", label: "Blue (Info)", class: "bg-info" },
    { value: "yellow", label: "Yellow (Warning)", class: "bg-warning" },
    { value: "orange", label: "Orange (Alert)", class: "bg-orange-500" },
  ];

  const types = [
    { value: "success", label: "Success", icon: "✓" },
    { value: "warning", label: "Warning", icon: "⚠" },
    { value: "error", label: "Error", icon: "✕" },
    { value: "info", label: "Info", icon: "ℹ" },
  ];

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (notificationType === "personal" && !selectedUser) {
      toast.error("Please select a user");
      return;
    }

    setIsSending(true);

    try {
      if (notificationType === "personal") {
        await axiosInstance.post(`/admin/notifications/personal/${selectedUser}`, {
          title,
          message,
          color,
          type,
        });
        toast.success("Notification sent successfully!");
      } else {
        const response = await axiosInstance.post("/admin/notifications/broadcast", {
          title,
          message,
          color,
          type,
        });
        toast.success(`Broadcast sent to ${response.data.count} users!`);
      }

      // Reset form
      setTitle("");
      setMessage("");
      setSelectedUser("");
      setColor("blue");
      setType("info");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 border border-base-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Send Notifications</h2>
          <p className="text-sm text-base-content/60">Send messages to users in Social Hub</p>
        </div>
      </div>

      <form onSubmit={handleSendNotification} className="space-y-4">
        {/* Notification Type */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNotificationType("personal")}
            className={`flex-1 btn btn-sm gap-2 ${
              notificationType === "personal" ? "btn-primary" : "btn-ghost"
            }`}
          >
            <User className="w-4 h-4" />
            Personal
          </button>
          <button
            type="button"
            onClick={() => setNotificationType("broadcast")}
            className={`flex-1 btn btn-sm gap-2 ${
              notificationType === "broadcast" ? "btn-primary" : "btn-ghost"
            }`}
          >
            <Users className="w-4 h-4" />
            Broadcast
          </button>
        </div>

        {/* User Selection (Personal Only) */}
        {notificationType === "personal" && (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Select User</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nickname || user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Title</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Important Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Message */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Message</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {/* Color and Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Color */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Color</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {colors.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Type</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="alert shadow-lg" style={{ backgroundColor: `var(--${color})`, color: 'white' }}>
          <div>
            <span className="font-bold">{title || "Preview Title"}</span>
            <p className="text-sm opacity-90">{message || "Preview message will appear here..."}</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-full gap-2"
          disabled={isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {notificationType === "personal" ? "Send to User" : "Broadcast to All Users"}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminNotifications;
