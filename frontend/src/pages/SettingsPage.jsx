import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";
import {
  Send,
  Lock,
  LogOut,
  Video,
  Mic,
  Shield,
  Check,
  X,
  User,
  Edit2,
  Save,
  Camera,
  Loader2,
  Palette,
  ChevronRight,
  Sparkles,
  UserCheck,
  MessageSquare,
  Volume2,
  Bell,
} from "lucide-react";
import ImageCropper from "../components/ImageCropper";
import LogoutModal from "../components/LogoutModal";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const TABS = [
  { id: "profile", label: "Edit Profile", icon: User, desc: "Personal info & username" },
  { id: "theme", label: "Theme & Style", icon: Palette, desc: "Color palettes & chat preview" },
  { id: "chat", label: "Chat & Sounds", icon: MessageSquare, desc: "Sounds, shortcuts & status" },
  { id: "security", label: "Account Security", icon: Lock, desc: "Passwords & sessions" },
  { id: "permissions", label: "Permissions", icon: Shield, desc: "Camera & mic access" },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { logout, authUser, updateProfile } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState("profile");

  // Local chat preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("chat-sounds-enabled") !== "false";
  });
  const [enterToSend, setEnterToSend] = useState(() => {
    return localStorage.getItem("chat-enter-to-send") !== "false";
  });
  const [desktopAlerts, setDesktopAlerts] = useState(() => {
    return localStorage.getItem("chat-desktop-alerts") === "true";
  });
  const [activeStatus, setActiveStatus] = useState(() => {
    return localStorage.getItem("chat-show-active-status") !== "false";
  });

  const handleToggleSound = (checked) => {
    setSoundEnabled(checked);
    localStorage.setItem("chat-sounds-enabled", checked ? "true" : "false");
    toast.success(`Message sounds ${checked ? "enabled" : "disabled"}`);
  };

  const handleToggleEnter = (checked) => {
    setEnterToSend(checked);
    localStorage.setItem("chat-enter-to-send", checked ? "true" : "false");
    toast.success(`Enter to Send ${checked ? "enabled" : "disabled"}`);
  };

  const handleToggleAlerts = async (checked) => {
    if (checked && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied by browser");
        setDesktopAlerts(false);
        localStorage.setItem("chat-desktop-alerts", "false");
        return;
      }
    }
    setDesktopAlerts(checked);
    localStorage.setItem("chat-desktop-alerts", checked ? "true" : "false");
    toast.success(`Push notifications ${checked ? "enabled" : "disabled"}`);
  };

  const handleToggleActiveStatus = async (checked) => {
    setActiveStatus(checked);
    localStorage.setItem("chat-show-active-status", checked ? "true" : "false");
    try {
      await axiosInstance.put("/users/me", { isOnline: checked });
      toast.success(`Online status visibility ${checked ? "shown" : "hidden"}`);
    } catch (e) {
      toast.success(`Online status preference saved locally`);
    }
  };

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [newProfilePic, setNewProfilePic] = useState(null);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [profileData, setProfileData] = useState({
    username: "",
    bio: "",
    fullName: "",
    nickname: "",
  });

  // Permission states
  const [cameraStatus, setCameraStatus] = useState("not-tested");
  const [micStatus, setMicStatus] = useState("not-tested");

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (authUser) {
      setProfileData({
        username: authUser.username || "",
        bio: authUser.bio || "",
        fullName: authUser.fullName || "",
        nickname: authUser.nickname || "",
      });
    }
  }, [authUser]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getAllowedThemes = () => {
    if (!settings?.allowedThemes || settings.allowedThemes === "all")
      return THEMES;
    const allowedList = settings.allowedThemes.split(",");
    if (!allowedList.includes(theme)) {
      return [theme, ...allowedList.filter((t) => THEMES.includes(t))];
    }
    return THEMES.filter((t) => allowedList.includes(t));
  };

  const displayedThemes = getAllowedThemes();

  const checkUsername = async (username) => {
    if (username === authUser?.username) {
      setUsernameAvailable(true);
      return;
    }
    if (username.length < 3) {
      setUsernameAvailable(false);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await axiosInstance.get(`/users/check-username/${username}`);
      setUsernameAvailable(res.data.available);
    } catch (error) {
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setTempImage(reader.result);
      setShowCropper(true);
    };
  };

  const handleCropComplete = (croppedImage) => {
    setSelectedImg(croppedImage);
    setNewProfilePic(croppedImage);
    setShowCropper(false);
    setTempImage(null);
    toast.success("Image cropped! Click 'Save Changes' to update.");
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  const handleSaveProfile = async () => {
    if (!profileData.username || profileData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (profileData.bio && profileData.bio.length > 150) {
      toast.error("Bio cannot exceed 150 characters");
      return;
    }
    if (!profileData.fullName || profileData.fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }
    setSavingProfile(true);
    try {
      const updateData = {
        ...profileData,
        ...(newProfilePic && { profilePic: newProfilePic }),
      };
      await updateProfile(updateData);
      setIsEditingProfile(false);
      setNewProfilePic(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const testCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("granted");
      toast.success("Camera access granted!");
    } catch (error) {
      setCameraStatus("denied");
      toast.error("Camera access denied. Check browser settings.");
    }
  };

  const testMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      toast.success("Microphone access granted!");
    } catch (error) {
      setMicStatus("denied");
      toast.error("Microphone access denied. Check browser settings.");
    }
  };

  const testBothPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("granted");
      setMicStatus("granted");
      toast.success("Camera and microphone access granted!");
    } catch (error) {
      toast.error("Permission denied. Check browser settings.");
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="min-h-screen bg-base-200 select-none pb-24 md:pb-12 pt-20 sm:pt-24 md:pt-28">
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* ========================================================
              LEFT COLUMN: Navigation Sidebar & Tabs (PC & Tablet)
             ======================================================== */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* Header branding card with gradient sparkles */}
            <div className="bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-300 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content shadow-md shadow-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-base-content tracking-tight">Settings</h1>
                <p className="text-[10px] text-base-content/40 truncate">System preferences & stats</p>
              </div>
            </div>

            {/* Mobile horizontal scrolling tabs wrapper */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 pt-1 scrollbar-none scroll-smooth -mx-4 px-4 border-b border-base-300/20">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-300 select-none ${
                      isActive
                        ? "bg-primary text-primary-content shadow-lg shadow-primary/20 scale-103"
                        : "bg-base-200 text-base-content/70 hover:bg-base-300"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop Vertical Menu - macOS Premium Style */}
            <div className="hidden lg:flex flex-col bg-base-100 rounded-2xl border border-base-300 shadow-md overflow-hidden p-2">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl text-left transition-all duration-300 border-l-4 ${
                      isActive
                        ? "bg-primary/5 text-primary border-primary shadow-sm font-bold"
                        : "text-base-content/65 hover:bg-base-200/50 hover:text-base-content border-l-4 border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive ? "bg-primary/10" : "bg-base-200"
                    }`}>
                      <TabIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight">{tab.label}</p>
                      <p className="text-[9px] text-base-content/40 truncate leading-tight mt-0.5">{tab.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? "translate-x-0.5 opacity-100 text-primary" : "opacity-0"
                    }`} />
                  </button>
                );
              })}
            </div>
            
            {/* Quick Profile Summary Widget */}
            <div className="hidden lg:flex items-center gap-3 bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
              <img
                src={authUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                alt="Me"
                className="w-9 h-9 rounded-xl object-cover border border-base-300"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-base-content truncate">{authUser?.fullName}</p>
                <p className="text-[10px] text-base-content/50 truncate">@{authUser?.username}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-ghost btn-circle btn-sm text-error hover:bg-error/10"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Tab Content Display
             ======================================================== */}
          <div className="lg:col-span-3">
            <div className="bg-base-100 rounded-2xl border border-base-300 shadow-lg p-4 sm:p-7 min-h-[500px]">
              
              {/* --- EDIT PROFILE PANEL --- */}
              {activeTab === "profile" && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-base-content tracking-tight">
                      <User className="w-5 h-5 text-primary" /> Edit Profile
                    </h2>
                    <p className="text-xs text-base-content/40 mt-0.5">Manage your personal branding and username credentials</p>
                  </div>
                  
                  {/* Profile Picture Upload Section - Premium Horizontal Layout */}
                  <div className="flex items-center gap-4 p-3.5 bg-base-200/50 rounded-2xl border border-base-300/60 shadow-sm select-none">
                    <div className="relative shrink-0 select-none">
                      <img
                        src={selectedImg || authUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                        alt="Profile avatar"
                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl object-cover border border-base-300/80 shadow-md transition-all duration-300"
                      />
                      {isEditingProfile && (
                        <label
                          htmlFor="avatar-upload-settings"
                          className="absolute -bottom-1 -right-1 bg-primary hover:bg-primary-focus p-1.5 rounded-lg cursor-pointer transition-all shadow-md border border-base-100"
                        >
                          <Camera className="w-3 h-3 text-primary-content" />
                          <input
                            type="file"
                            id="avatar-upload-settings"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={savingProfile}
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-base-content/85">Avatar Image</p>
                      <p className="text-[10px] text-base-content/40 leading-snug mt-0.5">
                        {isEditingProfile
                          ? "Supports cropped JPG or PNG formats. Click the camera badge on the avatar image to select."
                          : "This profile image is visible to other users globally across chats and matching screens."}
                      </p>
                    </div>
                    {!isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="btn btn-xs btn-ghost gap-1.5 border border-base-300 hover:bg-base-200 shrink-0 font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Form entries */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Full Name input */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-bold text-xs">DISPLAY NAME</span>
                        </label>
                        <input
                          type="text"
                          className={`input input-bordered w-full h-11 transition-all rounded-xl ${
                            !isEditingProfile 
                              ? "bg-base-200/50 text-base-content/60 border-base-300" 
                              : "focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                          }`}
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          disabled={!isEditingProfile}
                          placeholder="Your full name"
                        />
                      </div>

                      {/* Nickname input */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-bold text-xs">CASUAL NICKNAME</span>
                        </label>
                        <input
                          type="text"
                          className={`input input-bordered w-full h-11 transition-all rounded-xl ${
                            !isEditingProfile 
                              ? "bg-base-200/50 text-base-content/60 border-base-300" 
                              : "focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                          }`}
                          value={profileData.nickname}
                          onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
                          disabled={!isEditingProfile}
                          placeholder="Casual handle"
                        />
                      </div>
                      
                      {/* Username input with availability checker */}
                      <div className="form-control">
                        <label className="label py-1 flex items-center justify-between">
                          <span className="label-text font-bold text-xs">UNIQUE USERNAME</span>
                          {isEditingProfile && profileData.username !== authUser?.username && (
                            <span className="label-text-alt">
                              {checkingUsername ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : usernameAvailable === true ? (
                                <span className="text-success flex items-center gap-1 font-bold text-[10px]">
                                  <Check className="w-3 h-3" /> Available
                                </span>
                              ) : usernameAvailable === false ? (
                                <span className="text-error flex items-center gap-1 font-bold text-[10px]">
                                  <X className="w-3 h-3" /> Taken
                                </span>
                              ) : null}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          className={`input input-bordered w-full h-11 transition-all rounded-xl ${
                            !isEditingProfile 
                              ? "bg-base-200/50 text-base-content/60 border-base-300" 
                              : "focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                          }`}
                          value={profileData.username}
                          onChange={(e) => {
                            const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                            setProfileData({ ...profileData, username: newUsername });
                            if (newUsername.length >= 3) {
                              checkUsername(newUsername);
                            }
                          }}
                          disabled={!isEditingProfile}
                          placeholder="Unique username"
                          maxLength={30}
                        />
                      </div>
                    </div>

                    {/* Bio Description Area */}
                    <div className="form-control">
                      <label className="label py-1 flex items-center justify-between">
                        <span className="label-text font-bold text-xs">BIO SUMMARY</span>
                        {isEditingProfile && (
                          <span className="label-text-alt text-[10px] text-base-content/40">
                            {profileData.bio.length} / 150
                          </span>
                        )}
                      </label>
                      <textarea
                        className={`textarea textarea-bordered w-full h-24 transition-all rounded-xl ${
                          !isEditingProfile 
                            ? "bg-base-200/50 text-base-content/60 border-base-300" 
                            : "focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                        }`}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value.slice(0, 150) })}
                        disabled={!isEditingProfile}
                        placeholder="Say something about yourself..."
                        maxLength={150}
                      />
                    </div>

                    {/* Action buttons */}
                    {isEditingProfile && (
                      <div className="flex gap-2.5 pt-3">
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile || (profileData.username !== authUser?.username && !usernameAvailable)}
                          className="btn btn-primary flex-1 gap-1.5 h-11 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              username: authUser?.username || "",
                              bio: authUser?.bio || "",
                              fullName: authUser?.fullName || "",
                              nickname: authUser?.nickname || "",
                            });
                            setSelectedImg(authUser?.profilePic);
                            setNewProfilePic(null);
                            setUsernameAvailable(null);
                          }}
                          disabled={savingProfile}
                          className="btn btn-ghost h-11 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- APPEARANCE & THEME PANEL --- */}
              {activeTab === "theme" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-base-content tracking-tight">
                      <Palette className="w-5 h-5 text-primary" /> Theme & Appearance
                    </h2>
                    <p className="text-xs text-base-content/40 mt-0.5">Personalize the styling and color palette of your dashboard</p>
                  </div>

                  {/* Theme Select Grid */}
                  <div className="bg-base-200/50 p-4 rounded-xl border border-base-300 space-y-3">
                    <p className="text-xs font-bold text-base-content/85">SELECT THEME PALETTE</p>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[190px] overflow-y-auto custom-scrollbar pr-1">
                      {displayedThemes.map((t) => (
                        <button
                          key={t}
                          className={`
                            group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 border relative overflow-hidden
                            ${theme === t 
                              ? "bg-primary/10 border-primary ring-1 ring-primary shadow-md scale-103" 
                              : "bg-base-100 border-base-300 hover:bg-base-300 hover:scale-103 active:scale-97"}
                          `}
                          onClick={() => setTheme(t)}
                        >
                          {/* Selected theme visual checkmark overlay */}
                          {theme === t && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[0.5px] z-10">
                              <div className="bg-primary text-primary-content p-1.5 rounded-full shadow-md animate-scale-up">
                                <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                              </div>
                            </div>
                          )}
                          
                          <div className="relative h-7 w-full rounded-md overflow-hidden shadow-sm" data-theme={t}>
                            <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1">
                              <div className="rounded-sm bg-primary"></div>
                              <div className="rounded-sm bg-secondary"></div>
                              <div className="rounded-sm bg-accent"></div>
                              <div className="rounded-sm bg-neutral"></div>
                            </div>
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold truncate w-full text-center ${
                            theme === t ? "text-primary" : "text-base-content/70"
                          }`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Live Preview */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-base-content/85">LIVE INTERACTIVE CHAT PREVIEW</p>
                    <div className="w-full bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-lg">
                      {/* Header */}
                      <div className="px-4 py-2.5 border-b border-base-300 bg-base-100/90 flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-bold text-xs">
                            J
                          </div>
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100"></div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content truncate">John Doe</p>
                          <p className="text-[10px] text-success font-medium">Online</p>
                        </div>
                      </div>
                      
                      {/* Message area */}
                      <div className="p-4 space-y-3 min-h-[140px] max-h-[140px] overflow-y-auto bg-base-200/20">
                        {/* Received message */}
                        <div className="flex justify-start">
                          <div className="bg-base-100 rounded-2xl rounded-tl-sm p-2.5 shadow-sm border border-base-300 max-w-[80%]">
                            <p className="text-xs text-base-content leading-relaxed">Hey! How does this custom theme look?</p>
                          </div>
                        </div>
                        
                        {/* Sent message */}
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-content rounded-2xl rounded-tr-sm p-2.5 shadow-sm max-w-[80%]">
                            <p className="text-xs leading-relaxed">It looks incredibly clean, responsive, and professional! 🎨</p>
                          </div>
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="p-3 border-t border-base-300 bg-base-100/80">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input input-bordered flex-1 text-xs h-9 bg-base-200 border-base-300 rounded-full px-3.5"
                            placeholder="Type a message..."
                            value="Looking perfect!"
                            readOnly
                          />
                          <button className="btn btn-primary btn-circle h-9 w-9 min-h-0 shadow-md">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- CHAT & SOUND PREFERENCES PANEL --- */}
              {activeTab === "chat" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-base-content tracking-tight">
                      <MessageSquare className="w-5 h-5 text-primary" /> Chat & Sound Preferences
                    </h2>
                    <p className="text-xs text-base-content/40 mt-0.5">Customize your messaging experience, shortcuts, and notification chimes</p>
                  </div>

                  <div className="bg-base-200/50 p-4 sm:p-5 rounded-2xl border border-base-300 space-y-4">
                    
                    {/* Toggle: Sounds */}
                    <div className="flex items-center justify-between p-3.5 bg-base-100 rounded-xl border border-base-300/60 shadow-sm hover:shadow hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Volume2 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Notification Sounds</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Play a soft alert sound on incoming messages</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm cursor-pointer"
                        checked={soundEnabled}
                        onChange={(e) => handleToggleSound(e.target.checked)}
                      />
                    </div>

                    {/* Toggle: Push Notifications */}
                    <div className="flex items-center justify-between p-3.5 bg-base-100 rounded-xl border border-base-300/60 shadow-sm hover:shadow hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Bell className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Browser Notifications</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Show desktop push banner alerts when app is in background</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm cursor-pointer"
                        checked={desktopAlerts}
                        onChange={(e) => handleToggleAlerts(e.target.checked)}
                      />
                    </div>

                    {/* Toggle: Enter to Send */}
                    <div className="flex items-center justify-between p-3.5 bg-base-100 rounded-xl border border-base-300/60 shadow-sm hover:shadow hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Send className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Press Enter to Send</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Pressing the Enter key will send message immediately</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm cursor-pointer"
                        checked={enterToSend}
                        onChange={(e) => handleToggleEnter(e.target.checked)}
                      />
                    </div>

                    {/* Toggle: Active Status */}
                    <div className="flex items-center justify-between p-3.5 bg-base-100 rounded-xl border border-base-300/60 shadow-sm hover:shadow hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <UserCheck className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Show Active Status</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Allow your friends to see if you are currently online</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm cursor-pointer"
                        checked={activeStatus}
                        onChange={(e) => handleToggleActiveStatus(e.target.checked)}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* --- ACCOUNT SECURITY PANEL --- */}
              {activeTab === "security" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-base-content tracking-tight">
                      <Lock className="w-5 h-5 text-primary" /> Account & Security
                    </h2>
                    <p className="text-xs text-base-content/40 mt-0.5">Manage credentials, password updates, and session logs</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password change panel */}
                    <div className="flex flex-col justify-between p-5 bg-base-200/50 rounded-xl border border-base-300 space-y-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                      <div className="space-y-2">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Lock className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <h3 className="font-bold text-sm text-base-content">Security Password</h3>
                        <p className="text-xs text-base-content/50 leading-relaxed">Change your active passcode regularly to protect your conversations against snoops.</p>
                      </div>
                      <Link
                        to="/change-password"
                        className="btn btn-primary btn-sm w-full gap-1.5 h-9 rounded-lg font-bold"
                      >
                        Change Password
                      </Link>
                    </div>

                    {/* Verification status display */}
                    <div className="flex flex-col justify-between p-5 bg-base-200/50 rounded-xl border border-base-300 space-y-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                      <div className="space-y-2">
                        <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
                          <Shield className="w-4.5 h-4.5 text-success" />
                        </div>
                        <h3 className="font-bold text-sm text-base-content">Verification Badge</h3>
                        <p className="text-xs text-base-content/50 leading-relaxed">
                          {authUser?.isVerified 
                            ? "Congratulations! Your account has been verified. A blue verified checkmark is visible on your profile."
                            : "Submit a verification request to get our official verified user badge next to your display nickname."}
                        </p>
                      </div>
                      {authUser?.isVerified ? (
                        <div className="flex items-center justify-center gap-1 text-success text-xs font-bold bg-success/10 p-2 rounded-lg border border-success/20">
                          <UserCheck className="w-4 h-4" /> Account Verified
                        </div>
                      ) : (
                        <div className="text-xs text-base-content/40 bg-base-300/40 p-2 rounded-lg text-center font-bold">
                          Submit verification from profile details
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Red Logout Row */}
                  <div className="p-5 bg-error/5 rounded-xl border border-error/25 space-y-3 mt-4">
                    <h3 className="font-bold text-sm text-error flex items-center gap-1.5">
                      <LogOut className="w-4.5 h-4.5" /> Sign Out Session
                    </h3>
                    <p className="text-xs text-base-content/60 leading-relaxed">
                      Click below to end your active session on this device. You will need to input your email/username and password again to log back in.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="btn btn-error btn-sm gap-1.5 h-9 rounded-lg text-white font-black px-5 shadow-sm hover:shadow"
                    >
                      Log Out Now
                    </button>
                  </div>
                </div>
              )}

              {/* --- PERMISSIONS PANEL --- */}
              {activeTab === "permissions" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-base-content tracking-tight">
                      <Shield className="w-5 h-5 text-primary" /> Hardware Permissions
                    </h2>
                    <p className="text-xs text-base-content/40 mt-0.5">Test or request camera and microphone permissions for live video matching</p>
                  </div>

                  <div className="space-y-3">
                    {/* Camera Permission check with breathing pulse glow */}
                    <div className="flex items-center justify-between p-3.5 bg-base-200/50 border border-base-300 rounded-xl hover:bg-base-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Video className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Webcam Camera</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Used in live video chat viewports</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cameraStatus === "granted" ? (
                          <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/15 px-2.5 py-1 rounded-lg border border-success/20 shadow-sm animate-pulse-glow">
                            <Check className="w-3.5 h-3.5" /> Active
                          </div>
                        ) : cameraStatus === "denied" ? (
                          <div className="flex items-center gap-1 text-error text-xs font-bold bg-error/15 px-2.5 py-1 rounded-lg border border-error/20 shadow-sm">
                            <X className="w-3.5 h-3.5" /> Blocked
                          </div>
                        ) : (
                          <button
                            onClick={testCameraPermission}
                            className="btn btn-outline btn-primary btn-xs h-8 px-3.5 rounded-lg text-xs font-bold"
                          >
                            Grant
                          </button>
                        )}
                        {cameraStatus !== "not-tested" && (
                          <button
                            onClick={() => setCameraStatus("not-tested")}
                            className="btn btn-ghost btn-circle btn-xs text-base-content/30 hover:bg-base-300"
                            title="Reset permission status"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Microphone Permission check with breathing pulse glow */}
                    <div className="flex items-center justify-between p-3.5 bg-base-200/50 border border-base-300 rounded-xl hover:bg-base-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Mic className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">Voice Microphone</p>
                          <p className="text-[10px] text-base-content/40 mt-0.5">Used in voice calls and voice notes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {micStatus === "granted" ? (
                          <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/15 px-2.5 py-1 rounded-lg border border-success/20 shadow-sm animate-pulse-glow">
                            <Check className="w-3.5 h-3.5" /> Active
                          </div>
                        ) : micStatus === "denied" ? (
                          <div className="flex items-center gap-1 text-error text-xs font-bold bg-error/15 px-2.5 py-1 rounded-lg border border-error/20 shadow-sm">
                            <X className="w-3.5 h-3.5" /> Blocked
                          </div>
                        ) : (
                          <button
                            onClick={testMicPermission}
                            className="btn btn-outline btn-primary btn-xs h-8 px-3.5 rounded-lg text-xs font-bold"
                          >
                            Grant
                          </button>
                        )}
                        {micStatus !== "not-tested" && (
                          <button
                            onClick={() => setMicStatus("not-tested")}
                            className="btn btn-ghost btn-circle btn-xs text-base-content/30 hover:bg-base-300"
                            title="Reset permission status"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allow all option */}
                  {(cameraStatus !== "granted" || micStatus !== "granted") && (
                    <button
                      onClick={testBothPermissions}
                      className="w-full btn btn-primary h-11 gap-1.5 rounded-xl font-bold mt-4 shadow-md hover:shadow-lg active:scale-98 transition-all"
                    >
                      <Check className="w-4.5 h-4.5" />
                      Grant All Hardware Access
                    </button>
                  )}
                  <p className="text-[10px] text-base-content/45 text-center mt-2">
                    Browser permissions prompt will overlay on top to request secure access
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
