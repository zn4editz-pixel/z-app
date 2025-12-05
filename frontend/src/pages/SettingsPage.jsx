import { useState } from "react";
import { Link } from "react-router-dom";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Lock, LogOut, Video, Mic, Shield, Check, X } from "lucide-react";
import toast from "react-hot-toast";

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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-20 sm:pb-24 md:pb-16 max-w-5xl">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-1">Settings</h1>
            <p className="text-xs sm:text-sm md:text-base text-base-content/60">Customize your experience</p>
          </div>
          <Link 
            to="/change-password"
            className="btn btn-outline btn-primary btn-sm md:btn-md
                       gap-1.5 px-3 md:px-4 flex-shrink-0
                       hover:bg-primary hover:text-primary-content
                       transition-all duration-200"
          >
            <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-medium text-xs md:text-sm">
              Password
            </span>
          </Link>
        </div>

        {/* Settings Grid */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Theme Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Theme</h2>
                <p className="text-xs sm:text-sm text-base-content/60">Choose your style</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 max-h-[320px] sm:max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                    group flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-lg transition-all duration-200
                    ${theme === t ? "bg-primary/10 ring-2 ring-primary shadow-md scale-105" : "hover:bg-base-200 hover:shadow-sm hover:scale-105"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-8 sm:h-9 md:h-10 w-full rounded-md overflow-hidden shadow-sm" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium truncate w-full text-center ${theme === t ? 'text-primary font-semibold' : 'text-base-content/70'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Preview Section - Full Width */}
          <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-2.5 xs:p-3 sm:p-4 md:p-6 border border-base-300">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm xs:text-base sm:text-lg font-semibold truncate">Theme Preview</h2>
                <p className="text-[10px] xs:text-[11px] sm:text-xs text-base-content/60 truncate">See how your theme looks</p>
              </div>
            </div>
            
            {/* Chat Preview Container */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-xl border border-base-300 overflow-hidden">
                {/* Chat Header */}
                <div className="px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 border-b border-base-300 bg-base-100/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 xs:gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-semibold text-sm xs:text-base shadow-md">
                        J
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 xs:w-3 xs:h-3 bg-success rounded-full border-2 border-base-100"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm xs:text-base truncate">John Doe</h3>
                      <p className="text-[10px] xs:text-xs text-success truncate">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-3 xs:p-4 sm:p-5 space-y-3 xs:space-y-4 min-h-[180px] xs:min-h-[220px] sm:min-h-[260px] max-h-[180px] xs:max-h-[220px] sm:max-h-[260px] overflow-y-auto bg-base-200/30 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                  {/* Received Message */}
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[80%] xs:max-w-[75%]">
                      <div className="bg-base-100 rounded-2xl rounded-tl-sm p-2.5 xs:p-3 sm:p-3.5 shadow-md border border-base-300/50">
                        <p className="text-[11px] xs:text-xs sm:text-sm leading-relaxed text-base-content">
                          Hey! How's it going?
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 xs:mt-2">
                          <p className="text-[9px] xs:text-[10px] text-base-content/60">
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sent Message */}
                  <div className="flex justify-end animate-fade-in">
                    <div className="max-w-[80%] xs:max-w-[75%]">
                      <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl rounded-tr-sm p-2.5 xs:p-3 sm:p-3.5 shadow-md">
                        <p className="text-[11px] xs:text-xs sm:text-sm leading-relaxed text-primary-content">
                          I'm doing great! Just working on some new features.
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1.5 xs:mt-2">
                          <p className="text-[9px] xs:text-[10px] text-primary-content/80">
                            12:00 PM
                          </p>
                          <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-primary-content/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-2.5 xs:p-3 sm:p-4 border-t border-base-300 bg-base-100/80 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-[11px] xs:text-xs sm:text-sm h-8 xs:h-9 sm:h-10 
                                 bg-base-200 border-base-300 focus:border-primary focus:outline-none
                                 rounded-full px-3 xs:px-4"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary btn-circle btn-sm xs:btn-md h-8 w-8 xs:h-10 xs:w-10 min-h-0 
                                     shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <Send className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Permissions</h2>
                <p className="text-xs sm:text-sm text-base-content/60">Manage app access</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Camera Permission */}
              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base font-medium">Camera</span>
                  {cameraStatus === 'granted' && (
                    <Check className="w-4 h-4 text-success ml-auto flex-shrink-0" />
                  )}
                  {cameraStatus === 'denied' && (
                    <X className="w-4 h-4 text-error ml-auto flex-shrink-0" />
                  )}
                </div>
                {cameraStatus === 'granted' ? (
                  <button
                    onClick={() => setCameraStatus('not-tested')}
                    className="btn btn-outline btn-error btn-sm flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : cameraStatus === 'denied' ? (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-success btn-sm flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testCameraPermission}
                    className="btn btn-outline btn-primary btn-sm flex-shrink-0"
                  >
                    Allow
                  </button>
                )}
              </div>

              {/* Microphone Permission */}
              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base font-medium">Microphone</span>
                  {micStatus === 'granted' && (
                    <Check className="w-4 h-4 text-success ml-auto flex-shrink-0" />
                  )}
                  {micStatus === 'denied' && (
                    <X className="w-4 h-4 text-error ml-auto flex-shrink-0" />
                  )}
                </div>
                {micStatus === 'granted' ? (
                  <button
                    onClick={() => setMicStatus('not-tested')}
                    className="btn btn-outline btn-error btn-sm flex-shrink-0"
                  >
                    Revoke
                  </button>
                ) : micStatus === 'denied' ? (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-success btn-sm flex-shrink-0"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={testMicPermission}
                    className="btn btn-outline btn-primary btn-sm flex-shrink-0"
                  >
                    Allow
                  </button>
                )}
              </div>

              {/* Allow All Button */}
              {(cameraStatus !== 'granted' || micStatus !== 'granted') && (
                <button
                  onClick={testBothPermissions}
                  className="w-full btn btn-primary btn-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  Allow All Permissions
                </button>
              )}

              <p className="text-xs text-base-content/50 text-center mt-2">
                Browser will prompt for access
              </p>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-error" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Logout</h2>
                <p className="text-xs sm:text-sm text-base-content/60">Sign out of your account</p>
              </div>
            </div>
            
            <p className="text-sm text-base-content/70 mb-4">
              You will be signed out from this device. You can always sign back in with your credentials.
            </p>
            
            <button
              onClick={handleLogout}
              className="btn btn-error btn-md w-full gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from Account</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
