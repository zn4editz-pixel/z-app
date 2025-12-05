import { useState } from "react";
import { Link } from "react-router-dom";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Lock, Eye, EyeOff, LogOut, Video, Mic, Shield, Info, Check, X } from "lucide-react";
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
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
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
          className="btn btn-primary w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </>
          )}
        </button>
      </form>
  );
};

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const [cameraStatus, setCameraStatus] = useState('not-tested');
  const [micStatus, setMicStatus] = useState('not-tested');

  const testCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('granted');
      toast.success('Camera access granted!');
    } catch (error) {
      setCameraStatus('denied');
      toast.error('Camera access denied. Check browser settings.');
    }
  };

  const testMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('granted');
      toast.success('Microphone access granted!');
    } catch (error) {
      setMicStatus('denied');
      toast.error('Microphone access denied. Check browser settings.');
    }
  };

  const testBothPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('granted');
      setMicStatus('granted');
      toast.success('Camera and microphone access granted!');
    } catch (error) {
      toast.error('Permission denied. Check browser settings.');
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-16 sm:pt-20 pb-10 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Settings</h1>
            <p className="text-sm sm:text-base text-base-content/60 mt-1">Customize your experience</p>
          </div>
          <Link 
            to="/change-password"
            className="btn btn-outline btn-primary btn-xs h-8 min-h-8 gap-1 px-2 sm:px-3"
          >
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline text-xs">Change Password</span>
          </Link>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Theme Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Theme</h2>
                <p className="text-xs text-base-content/60">Choose your style</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                    group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                    ${theme === t ? "bg-primary/10 ring-2 ring-primary shadow-md" : "hover:bg-base-200 hover:shadow-sm"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-8 w-full rounded-md overflow-hidden shadow-sm" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-medium truncate w-full text-center ${theme === t ? 'text-primary' : ''}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-3 sm:p-4 border border-base-300">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Permissions</h2>
            </div>
            
            <div className="space-y-1.5">
              {/* Camera Permission */}
              <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-base-200 rounded-lg">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium truncate">Camera</span>
                  {cameraStatus === 'granted' && (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success ml-auto flex-shrink-0" />
                  )}
                  {cameraStatus === 'denied' && (
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-error ml-auto flex-shrink-0" />
                  )}
                </div>
                {cameraStatus === 'granted' ? (
                  <button
                    onClick={() => setCameraStatus('not-tested')}
                    className="btn btn-outline btn-error btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : cameraStatus === 'denied' ? (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-success btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-primary btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Allow
                  </button>
                )}
              </div>

              {/* Microphone Permission */}
              <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-base-200 rounded-lg">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium truncate">Microphone</span>
                  {micStatus === 'granted' && (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success ml-auto flex-shrink-0" />
                  )}
                  {micStatus === 'denied' && (
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-error ml-auto flex-shrink-0" />
                  )}
                </div>
                {micStatus === 'granted' ? (
                  <button
                    onClick={() => setMicStatus('not-tested')}
                    className="btn btn-outline btn-error btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : micStatus === 'denied' ? (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-success btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-primary btn-xs h-5 min-h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] flex-shrink-0"
                  >
                    Allow
                  </button>
                )}
              </div>

              {/* Allow All Button */}
              {(cameraStatus !== 'granted' || micStatus !== 'granted') && (
                <button
                  onClick={testBothPermissions}
                  className="w-full btn btn-outline btn-primary btn-xs h-5 min-h-5 text-[9px] sm:text-[10px] gap-1 mt-1"
                >
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Allow All
                </button>
              )}

              <p className="text-[10px] text-base-content/50 text-center mt-1.5">
                Browser will prompt for access
              </p>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-error" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Logout</h2>
                <p className="text-xs text-base-content/60">Sign out of your account</p>
              </div>
            </div>
            
            <p className="text-sm text-base-content/70 mb-4">
              You will be signed out from this device. You can always sign back in with your credentials.
            </p>
            
            <button
              onClick={handleLogout}
              className="btn btn-error w-full gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout from Account
            </button>
          </div>

          {/* Preview Section - Full Width */}
          <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Theme Preview</h2>
                <p className="text-xs text-base-content/60">See how your theme looks</p>
              </div>
            </div>
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
