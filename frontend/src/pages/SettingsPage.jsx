import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Lock, Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const ChangePasswordSection = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-base-300 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">Change Password</h3>
      </div>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        {/* Current Password */}
        <div>
          <label className="label">
            <span className="label-text">Current Password</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5 text-base-content/60" />
              ) : (
                <Eye className="w-5 h-5 text-base-content/60" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="label">
            <span className="label-text">New Password</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5 text-base-content/60" />
              ) : (
                <Eye className="w-5 h-5 text-base-content/60" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">
            <span className="label-text">Confirm New Password</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5 text-base-content/60" />
              ) : (
                <Eye className="w-5 h-5 text-base-content/60" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Change Password"
          )}
        </button>
      </form>
    </div>
  );
};

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-10 max-w-5xl">
        <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-xl font-semibold">Theme</h2>
            <p className="text-xs sm:text-sm text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

          {/* Change Password Section */}
          <ChangePasswordSection />

          {/* Preview Section */}
          <div className="pt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Preview</h3>
            <div className="rounded-lg sm:rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
              <div className="p-3 sm:p-4 bg-base-200">
                <div className="max-w-lg mx-auto">
                  {/* Mock Chat UI */}
                  <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                          J
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Username</h3>
                          <p className="text-xs text-base-content/70">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-xl p-3 shadow-sm
                              ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`
                                text-[10px] mt-1.5
                                ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                              `}
                            >
                              12:00 PM
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 text-sm h-10"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="btn btn-primary h-10 min-h-0">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
