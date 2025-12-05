import { useState } from "react";
import { Link } from "react-router-dom";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Lock, LogOut, Video, Mic, Shield, Check, X } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

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
      <div className="container mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 pt-16 xs:pt-18 sm:pt-20 md:pt-24 lg:pt-28 pb-6 xs:pb-8 sm:pb-10 md:pb-16 max-w-6xl">
        {/* Page Header */}
        <div className="mb-3 sm:mb-4 md:mb-6 flex flex-row items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-base-content truncate">Settings</h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-base-content/60 mt-0.5 sm:mt-1 truncate">Customize your experience</p>
          </div>
          <Link 
            to="/change-password"
            className="btn btn-outline btn-primary h-6 sm:h-7 md:h-8 
                       gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-3 flex-shrink-0
                       hover:bg-primary hover:text-primary-content
                       transition-all duration-200 text-[9px] sm:text-[10px] md:text-xs
                       min-h-0 border"
          >
            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
            <span className="font-medium hidden xs:inline">
              Password
            </span>
            <span className="font-medium xs:hidden">
              Pass
            </span>
          </Link>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 md:gap-6">
          
          {/* Theme Section */}
          <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-2.5 xs:p-3 sm:p-4 md:p-6 border border-base-300">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm xs:text-base sm:text-lg font-semibold truncate">Theme</h2>
                <p className="text-[10px] xs:text-[11px] sm:text-xs text-base-content/60 truncate">Choose your style</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3 max-h-[250px] xs:max-h-[280px] sm:max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-0.5 xs:pr-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                    group flex flex-col items-center gap-1 xs:gap-1.5 p-1.5 xs:p-2 rounded-md xs:rounded-lg transition-all
                    ${theme === t ? "bg-primary/10 ring-1 xs:ring-2 ring-primary shadow-md" : "hover:bg-base-200 hover:shadow-sm"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-6 xs:h-7 sm:h-8 w-full rounded-sm xs:rounded-md overflow-hidden shadow-sm" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-4 gap-px p-0.5 xs:p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className={`text-[9px] xs:text-[10px] sm:text-[11px] font-medium truncate w-full text-center ${theme === t ? 'text-primary' : ''}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-2.5 xs:p-3 sm:p-4 border border-base-300">
            <div className="flex items-center gap-1.5 xs:gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-primary flex-shrink-0" />
              <h2 className="text-xs xs:text-sm font-semibold truncate">Permissions</h2>
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
                    className="btn btn-outline btn-error btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : cameraStatus === 'denied' ? (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-success btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-primary btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
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
                    className="btn btn-outline btn-error btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : micStatus === 'denied' ? (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-success btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-primary btn-xs h-6 min-h-6 px-2 text-[10px] flex-shrink-0"
                  >
                    Allow
                  </button>
                )}
              </div>

              {/* Allow All Button */}
              {(cameraStatus !== 'granted' || micStatus !== 'granted') && (
                <button
                  onClick={testBothPermissions}
                  className="w-full btn btn-outline btn-primary btn-xs h-6 min-h-6 text-[10px] gap-1 mt-1"
                >
                  <Check className="w-3 h-3" />
                  Allow All
                </button>
              )}

              <p className="text-[10px] text-base-content/50 text-center mt-1.5">
                Browser will prompt for access
              </p>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-2.5 xs:p-3 sm:p-4 md:p-6 border border-base-300">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-error" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm xs:text-base sm:text-lg font-semibold truncate">Logout</h2>
                <p className="text-[10px] xs:text-[11px] sm:text-xs text-base-content/60 truncate">Sign out of your account</p>
              </div>
            </div>
            
            <p className="text-[11px] xs:text-xs sm:text-sm text-base-content/70 mb-2.5 xs:mb-3 sm:mb-4 line-clamp-2">
              You will be signed out from this device. You can always sign back in with your credentials.
            </p>
            
            <button
              onClick={handleLogout}
              className="btn btn-error btn-xs xs:btn-sm sm:btn-md w-full gap-1.5 xs:gap-2 shadow-md hover:shadow-lg transition-all h-8 xs:h-9 sm:h-auto"
            >
              <LogOut className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] xs:text-xs sm:text-sm">Logout from Account</span>
            </button>
          </div>

          {/* Preview Section - Full Width */}
          <div className="lg:col-span-2 bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-2.5 xs:p-3 sm:p-4 md:p-6 border border-base-300">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm xs:text-base sm:text-lg font-semibold truncate">Theme Preview</h2>
                <p className="text-[10px] xs:text-[11px] sm:text-xs text-base-content/60 truncate">See how your theme looks</p>
              </div>
            </div>
            <div className="rounded-md xs:rounded-lg sm:rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
              <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 bg-base-200">
                <div className="max-w-lg mx-auto">
                  {/* Mock Chat UI */}
                  <div className="bg-base-100 rounded-lg xs:rounded-xl shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border-b border-base-300 bg-base-100">
                      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium text-xs xs:text-sm flex-shrink-0">
                          J
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-xs xs:text-sm truncate">Username</h3>
                          <p className="text-[10px] xs:text-[11px] sm:text-xs text-base-content/70 truncate">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-2.5 xs:p-3 sm:p-4 space-y-2.5 xs:space-y-3 sm:space-y-4 min-h-[150px] xs:min-h-[180px] sm:min-h-[200px] max-h-[150px] xs:max-h-[180px] sm:max-h-[200px] overflow-y-auto bg-base-100">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[85%] xs:max-w-[80%] rounded-lg xs:rounded-xl p-2 xs:p-2.5 sm:p-3 shadow-sm
                              ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                            `}
                          >
                            <p className="text-[11px] xs:text-xs sm:text-sm leading-snug">{message.content}</p>
                            <p
                              className={`
                                text-[9px] xs:text-[10px] mt-1 xs:mt-1.5
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
                    <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-1.5 xs:gap-2">
                        <input
                          type="text"
                          className="input input-bordered input-xs xs:input-sm sm:input-md flex-1 text-[11px] xs:text-xs sm:text-sm h-7 xs:h-8 sm:h-10"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="btn btn-primary btn-xs xs:btn-sm sm:btn-md h-7 xs:h-8 sm:h-10 min-h-0 px-2 xs:px-3">
                          <Send size={14} className="xs:hidden" />
                          <Send size={16} className="hidden xs:block sm:hidden" />
                          <Send size={18} className="hidden sm:block" />
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
